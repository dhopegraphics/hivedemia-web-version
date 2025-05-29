import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { useUserStore } from "@/backend/store/useUserStore";
import { useCompetitionStore } from "@/backend/store/useCompetitionStore";

const OngoingCompetitions = ({ isDark, colors }) => {
  const { profile: user } = useUserStore();
  const {
    competitions,
    getMyCompetitions,
    isLoading: isStoreLoading,
    fetchPublicCompetitions,
  } = useCompetitionStore();
  

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState({});

  useEffect(() => {
    fetchPublicCompetitions(); // Fetch all public competitions
    if (user?.user_id) {
      getMyCompetitions(user.user_id); // Also fetch user's private competitions
    }
  }, [user?.user_id]);

  const allCompetitions = [...competitions];

  // Filter ongoing competitions (status: 'waiting', 'active')
  const ongoingCompetitions = allCompetitions
    .filter((comp) => ["waiting", "active"].includes(comp.status))
    .map((comp) => {
      const participants = comp.competition_participants || [];
      const host = participants.find((p) => p.user_id === comp.created_by);

      return {
        ...comp,
        hostName: host?.profiles?.username || "Unknown",
        participantCount: participants.length,
        hasJoined: user?.user_id
          ? participants.some((p) => p.user_id === user.user_id && p.has_joined)
          : false,
        isHost: comp.created_by === user?.user_id,
      };
    });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (user?.user_id) {
        await fetchPublicCompetitions();
        await getMyCompetitions(user.user_id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleJoinCompetition = async (competitionId) => {
  try {
    setJoinRequestSent((prev) => ({ ...prev, [competitionId]: true }));

    if (user?.user_id) {
      // First check if competition is full
      const competition = competitions.find(c => c.id === competitionId);
      if (competition?.participantCount >= competition?.max_participants) {
        throw new Error("Competition is full");
      }

      await useCompetitionStore
        .getState()
        .ensureParticipantJoined(user.user_id, competitionId);
      router.push({
        pathname: `/Hubs/Competition/waiting-room`,
        params: { competitionId },
      });
    }
  } catch (error) {
    console.error("Failed to join competition:", error);
    setJoinRequestSent((prev) => ({ ...prev, [competitionId]: false }));
    // Optionally show an error message to the user
  }
};

  const getCompetitionStatus = (competition) => {
    if (competition.status === "active") {
      return competition.allow_mid_join ? "open_to_join" : "in_progress";
    }

    return "waiting_to_start";
  };

  const renderCompetitionCard = ({ item: competition }) => {
    const status = getCompetitionStatus(competition);
    const canJoin =
      (status === "open_to_join" || status === "waiting_to_start") &&
      !competition.hasJoined &&
      competition.participantCount < competition.max_participants;
    const canStart = status === "waiting_to_start" && competition.isHost;
    const canResume = competition.hasJoined;

    const isFull = competition.participantCount >= competition.max_participants;

    return (
      <View
        className="mb-4 rounded-xl overflow-hidden"
        style={{
          backgroundColor: isDark ? `${colors.dark}90` : colors.white,
          shadowColor: colors.dark,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Status Bar */}
        <View
          className="py-1 px-3"
          style={{
            backgroundColor:
              status === "in_progress"
                ? colors.success
                : status === "waiting_to_start"
                ? colors.warning
                : colors.primary,
          }}
        >
          <Text className="text-white text-xs font-medium">
            {status === "in_progress"
              ? "In Progress"
              : status === "waiting_to_start"
              ? "Waiting to Start"
              : "Open to Join"}
          </Text>
        </View>

        {/* Competition Info */}
        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text
                className="font-bold text-lg"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
                numberOfLines={2}
              >
                {competition.title}
              </Text>
              <Text
                className="text-sm mt-1 mb-2"
                style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
              >
                {competition.subject} • {competition.participantCount}/
                {competition.max_participants} participants
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              className="ml-3 rounded-lg px-3 py-1"
              style={{
                backgroundColor: joinRequestSent[competition.id]
                  ? isDark
                    ? `${colors.gray}50`
                    : colors.lightGray
                  : canJoin || canStart || canResume
                  ? colors.primary
                  : isDark
                  ? `${colors.gray}50`
                  : colors.lightGray,
              }}
              onPress={() => {
                if (canJoin) {
                  handleJoinCompetition(competition.id);
                } else if (canStart) {
                  router.push(`/Hubs/Competition/start/${competition.id}`);
                } else if (canResume) {
                  router.push({
                    pathname: `/Hubs/Competition/waiting-room`,
                    params: { competitionId: competition.id },
                  });
                } else {
                  router.push({
                    pathname: `/Hubs/Competition/TurnOutResult`,
                    params: { competitionId: competition.id },
                  });
                }
              }}
              disabled={isStoreLoading || joinRequestSent[competition.id]}
            >
              {isStoreLoading && joinRequestSent[competition.id] ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text
                  className="font-medium"
                  style={{
                    color: joinRequestSent[competition.id]
                      ? isDark
                        ? colors.offwhite
                        : colors.dark
                      : canJoin || canStart || canResume
                      ? colors.white
                      : isDark
                      ? colors.offwhite
                      : colors.dark,
                  }}
                >
                  {joinRequestSent[competition.id]
                    ? "Joining..."
                    : isFull
                    ? "Full"
                    : canJoin
                    ? "Join Now"
                    : canResume
                    ? "Resume"
                    : canStart
                    ? "Start"
                    : "View"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Progress Info */}
          <View className="flex-row items-center mt-2">
            <MaterialCommunityIcons
              name="progress-check"
              size={18}
              color={isDark ? `${colors.offwhite}80` : colors.gray}
            />
            <Text
              className="ml-1"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              {status === "waiting_to_start"
                ? "Not started yet"
                : `Question ${competition.current_question || 0}/${
                    competition.question_count
                  }`}
            </Text>

            <Text
              className="ml-auto"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              {competition.started_at
                ? `Started: ${new Date(
                    competition.started_at
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </Text>
          </View>

          {/* Host Info */}
          <View
            className="mt-3 pt-3 border-t"
            style={{
              borderColor: isDark ? `${colors.gray}30` : colors.lightGray,
            }}
          >
            <View className="flex-row items-center">
              <FontAwesome5
                name="user-alt"
                size={14}
                color={isDark ? `${colors.offwhite}80` : colors.gray}
              />
              <Text
                className="ml-2 font-medium"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                Host: {competition.hostName}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="p-4">
      {/* Section Title */}
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className="text-lg font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Ongoing Competitions
        </Text>

        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={isRefreshing ? colors.gray : colors.primary}
          />
          <Text
            className="ml-1 font-medium"
            style={{ color: isRefreshing ? colors.gray : colors.primary }}
          >
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* Competition Cards */}
      {isStoreLoading && !isRefreshing && ongoingCompetitions.length === 0 ? (
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            className="mt-4 text-center"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Loading competitions...
          </Text>
        </View>
      ) : ongoingCompetitions.length > 0 ? (
        <FlatList
          scrollEnabled={false}
          data={ongoingCompetitions}
          renderItem={renderCompetitionCard}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View
          className="items-center justify-center py-8 bg-white rounded-xl"
          style={{
            backgroundColor: isDark ? `${colors.dark}90` : colors.white,
          }}
        >
          <MaterialCommunityIcons
            name="trophy-outline"
            size={48}
            color={colors.gray}
          />
          <Text
            className="mt-4 text-center font-medium"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            No active competitions
          </Text>
          <Text
            className="mt-1 text-center text-sm"
            style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
          >
            Create a new competition or check back later
          </Text>

          <TouchableOpacity
            className="mt-6 px-6 py-2 rounded-full"
            style={{ backgroundColor: colors.primary }}
            onPress={() => router.push("/Hubs/Competition/create")}
          >
            <Text className="text-white font-medium">Create Competition</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default OngoingCompetitions;
