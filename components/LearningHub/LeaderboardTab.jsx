import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useLeaderboardStore } from "@/backend/store/useLeaderboardStore";
import { useEffect } from "react";

const LeaderboardTab = ({ colors, isDark }) => {
  const { leaderboard, badges, streak, loading, refreshAll, error } =
    useLeaderboardStore();

    useEffect(() => {
    // Fetch leaderboard data when the component mounts
    const fetchData = async () => {
      try {
        await refreshAll();
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
      }
    };
    fetchData();
  }, [refreshAll]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-lg font-bold mb-4"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Top Performers
        </Text>
        <TouchableOpacity onPress={refreshAll}>
          <MaterialCommunityIcons
            name="refresh"
            size={24}
            color={isDark ? colors.offwhite : colors.dark}
            style={{ marginRight: 16 }}
          />
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Text
          style={{
            color: isDark ? colors.primary : colors.primaryDark,
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          🔥 Your Current Streak: {streak} day{streak === 1 ? "" : "s"}
        </Text>
      </View>

      {/* Leaderboard List or Empty State */}
      {leaderboard.length === 0 ? (
        <View style={{ alignItems: "center", marginVertical: 32 }}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={48}
            color={isDark ? colors.primary : colors.primaryDark}
            style={{ marginBottom: 12 }}
          />
          <Text
            style={{
              color: isDark ? colors.offwhite : colors.dark,
              fontSize: 16,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            No leaderboard data yet!
          </Text>
          <Text
            style={{
              color: isDark ? colors.deepLight : `${colors.dark}80`,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Participate in competitions to see yourself and others on the
            leaderboard.
          </Text>
        </View>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={leaderboard}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View
              className="rounded-xl p-4 mb-2 flex-row items-center"
              style={{
                backgroundColor: item.isCurrentUser
                  ? colors.primary
                  : isDark
                  ? `${colors.primaryDark}80`
                  : colors.white,
                borderWidth: item.isCurrentUser ? 0 : 1,
                borderColor: isDark
                  ? `${colors.primary}20`
                  : `${colors.primary}10`,
              }}
            >
              <View className="w-8 items-center mr-3">
                {index < 3 ? (
                  <MaterialIcons
                    name={
                      index === 0
                        ? "emoji-events"
                        : index === 1
                        ? "workspace-premium"
                        : "star"
                    }
                    size={24}
                    color={
                      index === 0
                        ? "#FFD700"
                        : index === 1
                        ? "#C0C0C0"
                        : "#CD7F32"
                    }
                  />
                ) : (
                  <Text
                    style={{
                      color: item.isCurrentUser
                        ? colors.white
                        : isDark
                        ? colors.offwhite
                        : colors.dark,
                    }}
                  >
                    #{index + 1}
                  </Text>
                )}
              </View>
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: item.isCurrentUser
                    ? colors.dark
                    : colors.primary,
                  borderWidth: item.isCurrentUser ? 0 : 2,
                  borderColor: colors.primary,
                }}
              >
                <Text
                  className="font-bold"
                  style={{
                    color: item.isCurrentUser ? colors.primary : colors.white,
                  }}
                >
                  {item.avatar}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="font-medium"
                  style={{
                    color: item.isCurrentUser
                      ? colors.dark
                      : isDark
                      ? colors.offwhite
                      : colors.dark,
                  }}
                >
                  {item.name} {item.isCurrentUser && "(You)"}
                </Text>
                <Text
                  style={{
                    color: item.isCurrentUser
                      ? colors.primaryDark
                      : isDark
                      ? `${colors.offwhite}80`
                      : `${colors.dark}80`,
                  }}
                >
                  {item.score} pts • {item.streak} day streak
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Badges */}
      <Text
        className="text-lg font-bold mt-6 mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Your Achievements
      </Text>

      <View className="flex-row flex-wrap justify-between mb-6">
        {badges.length === 0 ? (
          <View
            style={{ width: "100%", alignItems: "center", marginVertical: 32 }}
          >
            <MaterialCommunityIcons
              name="star-off-outline"
              size={48}
              color={isDark ? colors.primary : colors.primaryDark}
              style={{ marginBottom: 12 }}
            />
            <Text
              style={{
                color: isDark ? colors.offwhite : colors.dark,
                fontSize: 16,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              No achievements yet!
            </Text>
            <Text
              style={{
                color: isDark ? colors.deepLight : `${colors.dark}80`,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Complete quizzes and contribute notes to earn badges.
            </Text>
          </View>
        ) : (
          badges.map((badge) => (
            <View
              key={badge.id}
              className="items-center mb-4"
              style={{ width: "48%" }}
            >
              <View
                className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
                  badge.earned
                    ? "bg-primary-100 dark:bg-primary-900"
                    : "bg-primary-100 dark:bg-primary-200"
                }`}
              >
                <MaterialCommunityIcons
                  name={badge.icon}
                  size={28}
                  color={
                    badge.earned
                      ? colors.white
                      : isDark
                      ? colors.offwhite
                      : colors.dark
                  }
                />
              </View>
              <Text
                className="text-center"
                style={{
                  color: badge.earned
                    ? isDark
                      ? colors.offwhite
                      : colors.dark
                    : isDark
                    ? `${colors.offwhite}`
                    : `${colors.dark}50`,
                }}
              >
                {badge.name}
              </Text>
              {!badge.earned && (
                <Text
                  className="text-xs mt-1"
                  style={{
                    color: isDark ? `${colors.deepLight}` : `${colors.dark}50`,
                  }}
                >
                  Locked
                </Text>
              )}
            </View>
          ))
        )}
      </View>
      <View className="mb-20" />
    </View>
  );
};

export default LeaderboardTab;
