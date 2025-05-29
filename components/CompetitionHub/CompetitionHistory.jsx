import { useCompetitionHistoryStore } from "@/backend/store/useCompetitionHistoryStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { colors } from "@/constants/Colors";
import {
  getMedalIcon,
  getPositionColor,
} from "@/constants/CompetitionHistoryUtilitis";
import { useToast } from "@/context/ToastContext";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const CompetitionHistory = ({ isDark }) => {
  const { profile: user } = useUserStore();
  const [activeFilter, setActiveFilter] = useState("all"); // all, hosted, participated
  const competitionHistoryStore = useCompetitionHistoryStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();
  const [hasError, setHasError] = useState(false);
  // Separate background sync into its own effect
  useEffect(() => {
    if (!user?.user_id) return;

    let isMounted = true;
    let syncInterval;

    const backgroundSync = async () => {
      try {
        const store = useCompetitionHistoryStore.getState();
        if (store.db && isMounted) {
          await store.syncCompetitionHistory(user.user_id);
        }
      } catch (error) {
        console.error("Background sync failed:", error);
      }
    };

    // Initial background sync after 30 seconds
    const initialSync = setTimeout(backgroundSync, 30000);

    // Then every 5 minutes
    syncInterval = setInterval(backgroundSync, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearTimeout(initialSync);
      clearInterval(syncInterval);
    };
  }, [user?.user_id]);
  
    useEffect(() => {
    if (!user?.user_id) return;

    const initialize = async () => {
      try {
        // Set loading state
        setIsSyncing(true);

        // Initialize DB if not already initialized
        if (!competitionHistoryStore.db) {
          await competitionHistoryStore.initializeDB();
        }

        // First load from local DB to show immediate data
        const localData =
          await competitionHistoryStore.getLocalCompetitionHistory(
            user.user_id
          );

        // If we have local data, show it immediately
        if (localData.length > 0) {
          const initialCount = localData.length;

          // Then trigger background sync
          setTimeout(async () => {
            await competitionHistoryStore.syncCompetitionHistory(user.user_id);

            // Calculate new items after sync
            const newCount =
              competitionHistoryStore.competitions.length - initialCount;
            if (newCount > 0) {
              showToast(
                newCount === 1
                  ? "1 new competition updated"
                  : `${newCount} new competitions updated`,
                "success",
                3000
              );
            }
          }, 100);
        } else {
          // If no local data, sync immediately
          await competitionHistoryStore.syncCompetitionHistory(user.user_id);
        }
      } catch (error) {
        console.error("Failed to initialize competition history:", error);
        showToast("Couldn't update competitions", "error", 3000);
      } finally {
        setIsSyncing(false);
      }
    };

    initialize();
  }, [user?.user_id , competitionHistoryStore , showToast]);

  useEffect(() => {
    setHasError(false);
  }, [activeFilter]);

  const onRefresh = async () => {
    if (!user?.user_id) return;

    setRefreshing(true);
    try {
      // First try to load from local
      await competitionHistoryStore.getLocalCompetitionHistory(user.user_id);

      // Then sync with remote
      await competitionHistoryStore.syncCompetitionHistory(user.user_id);

      showToast("Competition history updated", "success", 1000);
    } catch (error) {
      console.error("Refresh failed:", error);
      showToast("Refresh failed", "error", 3000);
    } finally {
      setRefreshing(false);
    }
  };

  if (hasError) {
    return (
      <View className="p-4 items-center justify-center">
        <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
          Something went wrong displaying the competition history.
        </Text>
        <TouchableOpacity
          className="mt-4 px-4 py-2 rounded-full"
          style={{ backgroundColor: colors.primary }}
          onPress={() => setHasError(false)}
        >
          <Text className="text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  

  

  

  // Filter competitions based on active filter
  const filteredHistory = competitionHistoryStore.competitions.filter(
    (item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "hosted") return item.is_host;
      if (activeFilter === "participated") return !item.is_host;
      if (activeFilter === "completed") {
        return item.status === "completed" || item.participants_count > 0;
      }
      return true;
    }
  );

  // Initialize and sync data on mount


  const renderHistoryItem = ({ item }) => {
    const handlePress = () => {
      if (item.status === "completed") {
        router.push({
          pathname: `/Hubs/Competition/TurnOutResult`,
          params: {
            competitionId: item.id,
          },
        });
      } else if (item.status === "in_progress") {
        router.push({
          pathname: `/Hubs/Competition/ActiveCompetition`,
          params: {
            competitionId: item.id,
          },
        });
      } else {
        router.push({
          pathname: `/Hubs/Competition/waiting-room`,
          params: {
            competitionId: item.id,
          },
        });
      }
    };

    return (
      <TouchableOpacity
        className="mb-4 rounded-xl overflow-hidden"
        style={{
          backgroundColor: isDark ? `${colors.dark}90` : colors.white,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          elevation: 2,
        }}
        onPress={handlePress}
      >
        {/* Status indicator */}
        <View className="absolute top-20 right-6 z-10">
          <View
            className="px-2 py-1 rounded-full"
            style={{
              backgroundColor:
                item.status === "completed"
                  ? colors.success + "20"
                  : item.status === "in_progress"
                  ? colors.warning + "20"
                  : colors.primary + "20",
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{
                color:
                  item.status === "completed"
                    ? colors.success
                    : item.status === "in_progress"
                    ? colors.warning
                    : colors.primary,
              }}
            >
              {item.status === "completed"
                ? "Completed"
                : item.status === "in_progress"
                ? "In Progress"
                : "Waiting"}
            </Text>
          </View>
        </View>

        {/* Header with position badge */}
        <View
          className="flex-row justify-between items-center p-3 border-b"
          style={{
            borderColor: isDark ? `${colors.gray}30` : colors.lightGray,
          }}
        >
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name={item.is_host ? "account-supervisor" : "account-group"}
              size={18}
              color={isDark ? colors.offwhite : colors.dark}
            />
            <Text
              className="ml-2"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              {item.is_host ? "You hosted" : `Hosted by ${item.host_name}`}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text
              className="text-xs mr-1"
              style={{ color: isDark ? `${colors.offwhite}70` : colors.gray }}
            >
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            {item.status === "completed" && item.user_position && (
              <View
                className="h-6 w-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: getPositionColor(item.user_position, isDark),
                }}
              >
                <Text className="text-white font-bold text-xs">
                  {item.user_position}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Competition Info */}
        <View className="p-4">
          <Text
            className="font-bold text-lg"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            {item.title}
          </Text>
          <Text
            className="text-sm mb-3"
            style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
          >
            {item.subject} • {item.participants_count} participants •{" "}
            {item.questions_count} questions
          </Text>

          {/* Score */}
          {item.status === "completed" && (
            <View
              className="p-3 rounded-lg mb-4 flex-row justify-between items-center"
              style={{
                backgroundColor: isDark
                  ? `${colors.gray}20`
                  : `${colors.lightGray}50`,
              }}
            >
              {item.user_position !== undefined && (
                <View
                  className="h-6 w-6 rounded-full bg-primary-100 items-center justify-center"
                  style={{
                    backgroundColor: getPositionColor(item.user_position),
                  }}
                >
                  <Text className="text-white font-bold text-xs">
                    {item.user_position}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name={getMedalIcon(item.user_position)}
                  size={22}
                  color={getPositionColor(item.user_position)}
                />
                <Text
                  className="ml-2 font-medium"
                  style={{ color: isDark ? colors.offwhite : colors.dark }}
                >
                  {item.user_position === undefined
                    ? "Did not participate"
                    : item.user_position === 1
                    ? "Winner!"
                    : item.user_position === 2
                    ? "2nd Place"
                    : item.user_position === 3
                    ? "3rd Place"
                    : `${item.user_position}th Place`}
                </Text>
              </View>

              <View className="flex-row items-center">
                <AntDesign name="star" size={16} color={colors.warning} />
                <Text
                  className="ml-1 font-medium"
                  style={{ color: isDark ? colors.offwhite : colors.dark }}
                >
                  {item.user_position === undefined
                    ? "N/A"
                    : `${item.user_score}/${item.total_score}`}
                </Text>
              </View>
            </View>
          )}

          {/* Status-specific message */}
          {item.status !== "completed" && (
            <View
              className="p-3 rounded-lg mb-4 items-center"
              style={{
                backgroundColor: isDark
                  ? `${colors.gray}20`
                  : `${colors.lightGray}50`,
              }}
            >
              <Text
                className="font-medium"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                {item.status === "in_progress"
                  ? "Competition is currently in progress"
                  : "Waiting for competition to start"}
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: isDark ? `${colors.offwhite}70` : colors.gray }}
              >
                {item.status === "in_progress"
                  ? "Tap to join the active competition"
                  : "Tap to view the waiting room"}
              </Text>
            </View>
          )}

          {/* Top Participants - only show for completed competitions */}
          {item.status === "completed" &&
            item.top_participants &&
            item.top_participants.length > 0 && (
              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{
                    color: isDark ? `${colors.offwhite}80` : colors.gray,
                  }}
                >
                  Top Performers
                </Text>

                {item.top_participants.map((participant, index) => (
                  <View
                    key={index}
                    className="flex-row justify-between items-center py-2"
                    style={{
                      borderBottomWidth:
                        index < item.top_participants.length - 1 ? 1 : 0,
                      borderColor: isDark
                        ? `${colors.gray}20`
                        : `${colors.lightGray}70`,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className="font-medium w-5 text-center"
                        style={{
                          color: getPositionColor(participant.position),
                        }}
                      >
                        {participant.position}
                      </Text>
                      <Text
                        className="ml-3"
                        style={{
                          color: isDark ? colors.offwhite : colors.dark,
                          fontWeight:
                            participant.name === "You" ? "600" : "400",
                        }}
                      >
                        {participant.name}
                      </Text>
                      {participant.name === "You" && (
                        <Text
                          className="ml-1 text-xs"
                          style={{
                            color: isDark
                              ? `${colors.primary}90`
                              : colors.primary,
                          }}
                        >
                          (You)
                        </Text>
                      )}
                    </View>

                    <Text
                      style={{
                        color: isDark ? `${colors.offwhite}70` : colors.gray,
                      }}
                    >
                      {participant.score} pts
                    </Text>
                  </View>
                ))}
              </View>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="p-4">
      {/* Filter Options */}
      <View className="flex-row mb-4">
        {["all", "hosted", "participated", "completed"].map((filter) => (
          <TouchableOpacity
            key={filter}
            className="mr-3 py-2 px-4 rounded-full"
            style={{
              backgroundColor:
                activeFilter === filter
                  ? isDark
                    ? colors.primary
                    : `${colors.primary}20`
                  : isDark
                  ? `${colors.gray}30`
                  : `${colors.lightGray}50`,
            }}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              className="font-medium capitalize"
              style={{
                color:
                  activeFilter === filter
                    ? isDark
                      ? colors.white
                      : colors.primary
                    : isDark
                    ? colors.offwhite
                    : colors.dark,
              }}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      {filteredHistory.length > 0 ? (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      ) : (
        <View
          className="items-center justify-center py-12 bg-white rounded-xl"
          style={{
            backgroundColor: isDark ? `${colors.dark}90` : colors.white,
          }}
        >
          <MaterialCommunityIcons
            name={activeFilter === "completed" ? "trophy" : "history"}
            size={48}
            color={colors.gray}
          />
          <Text
            className="mt-4 text-center font-medium"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            {activeFilter === "completed"
              ? "No completed competitions found"
              : "No competition history found"}
          </Text>
          <Text
            className="mt-1 text-center text-sm"
            style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
          >
            {activeFilter === "completed"
              ? "Complete a competition to see it here"
              : "Join or create competitions to see your history"}
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-2 rounded-full"
            style={{ backgroundColor: colors.primary }}
            onPress={() => router.push("/Hubs/Competition/create")}
          >
            <Text className="text-white font-medium">
              {activeFilter === "hosted"
                ? "Host a Competition"
                : "Join a Competition"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CompetitionHistory;
