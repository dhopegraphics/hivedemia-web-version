import useGroupsStore from "@/backend/store/groupsStore";
import { useGroupStats } from "@/backend/store/useGroupStats";
import { useUserStore } from "@/backend/store/useUserStore";
import BootLoadingScreen from "@/components/CourseHub/BootLoadingScreen";
import ExamsModeTab from "@/components/LearningHub/ExamsModeTab";
import GroupsTab from "@/components/LearningHub/GroupsTab";
import LeaderboardTab from "@/components/LearningHub/LeaderboardTab";
import PublicNotesTab from "@/components/LearningHub/PublicNotesTab";
import TabsPublicHeader from "@/components/TabsPublicHeader";
import { colors } from "@/constants/Colors";
import { doesGroupsDbExist } from "@/utils/dbCheck";
import { useLoadPublicFiles } from "@/utils/LoadPublicFiles";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HubScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState("groups");
  const [refreshing, setRefreshing] = useState(false);
  const { refreshAllStats } = useGroupStats();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    files,
    loading: PublicFilesLoading,
    refreshFiles,
  } = useLoadPublicFiles();
  const initDb = useGroupsStore((state) => state.initDb);

  const { profile: user } = useUserStore();

  const {
    groups,
    loading,
    fetchFromLocalDb,
    fetchFromSupabaseSyncToLocal,
    syncMembersToSupabase,
    fetchMembersFromLocalDb,
    fetchMembersFromSupabaseSyncToLocal,
    groupMembers,
    getJoinedGroupIds,
    syncToSupabase,
    initialization,
    setInitialization,
  } = useGroupsStore();

  const joinedGroups = useMemo(() => {
    if (!user.user_id || !groups.length || !groupMembers.length) return [];
    const joinedIds = getJoinedGroupIds(user.user_id);
    return groups.filter((g) => joinedIds.includes(g.id));
  }, [groups, groupMembers, user.user_id, getJoinedGroupIds]);

  useEffect(() => {
    const initialize = async () => {
      const dbExists = await doesGroupsDbExist();

      if (!dbExists) {
        setInitialization("initializing", "Setting up local database...", true);
      }

      await initDb();

      if (!dbExists) {
        setInitialization("saving", "Loading groups from device...", true);
      }

      await fetchFromLocalDb();
      await fetchMembersFromLocalDb();

      if (!dbExists) {
        setInitialization("syncing", "Syncing groups from cloud...", true);
      }

      await fetchFromSupabaseSyncToLocal();
      await syncToSupabase();
      await fetchMembersFromSupabaseSyncToLocal();
      await syncMembersToSupabase();

      setInitialization("done", "Ready!", dbExists === false);
    };

    initialize();
  }, [
    fetchFromLocalDb,
    fetchFromSupabaseSyncToLocal,
    fetchMembersFromLocalDb,
    fetchMembersFromSupabaseSyncToLocal,
    initDb,
    setInitialization,
    syncMembersToSupabase,
    syncToSupabase,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    if (activeTab === "groups") {
      await fetchFromLocalDb(); // always do local first

      await fetchFromSupabaseSyncToLocal();
      await fetchMembersFromSupabaseSyncToLocal();
      await fetchMembersFromLocalDb();

      const groupIds = (groups || []).map((g) => g.id);
      if (groupIds.length > 0) {
        await refreshAllStats(groupIds);
      }
    } else if (activeTab === "notes") {
      await refreshFiles();
    }

    setRefreshing(false);
  }, [
    activeTab,
    groups,
    refreshFiles,
    fetchFromLocalDb,
    fetchFromSupabaseSyncToLocal,
    fetchMembersFromSupabaseSyncToLocal,
    fetchMembersFromLocalDb,
    refreshAllStats,
  ]);

  if (!user?.user_id) return null; // or a loading spinner

  const filteredCreatedGroups = (groups || []).filter(
    (g) =>
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      g.created_by === user?.user_id
  );

  const filteredPublicGroups = (groups || []).filter(
    (g) =>
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      g.isPrivate === false
  );

  const filteredFiles = (files || []).filter((file) =>
    file.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      <TabsPublicHeader
        HeaderName={"Learning Hub"}
        isDark={isDark}
        colors={colors}
        onSearch={setSearchQuery} // 🔥 Pass the function properly
      />
      {/* Header */}
      <View
        className="px-6 pb-4"
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primary,
        }}
      >
        {/* Tabs */}
        <View className="flex-row justify-between mb-2">
          {["groups", "exams", "notes", "leaderboard"].map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`pb-2 ${activeTab === tab ? "border-b-2" : ""}`}
              style={{
                borderColor: activeTab === tab ? colors.white : "transparent",
                width: "24%",
                alignItems: "center",
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text className="font-medium" style={{ color: colors.white }}>
                {tab === "groups"
                  ? "Groups"
                  : tab === "exams"
                  ? "Exams"
                  : tab === "notes"
                  ? "Notes"
                  : "Top"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Content with Pull-to-Refresh */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === "groups" ? (
          <>
            {initialization.showBootScreen ? (
              <BootLoadingScreen colors={colors} isDark={isDark} />
            ) : (
              <GroupsTab
                isDark={isDark}
                colors={colors}
                createdGroups={filteredCreatedGroups}
                publicGroups={filteredPublicGroups}
                loading={loading}
                joinedGroups={joinedGroups}
              />
            )}
          </>
        ) : activeTab === "exams" ? (
          <ExamsModeTab isDark={isDark} colors={colors} />
        ) : activeTab === "notes" ? (
          <PublicNotesTab
            isDark={isDark}
            colors={colors}
            files={filteredFiles}
            loading={PublicFilesLoading}
            refreshFiles={refreshFiles}
          />
        ) : (
          <LeaderboardTab isDark={isDark} colors={colors} />
        )}
      </ScrollView>
    </View>
  );
}
