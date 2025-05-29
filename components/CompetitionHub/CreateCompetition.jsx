import { useCompetitionStore } from "@/backend/store/useCompetitionStore";
import { useLocalCompetitionStore } from "@/backend/store/useLocalCompetitionStore";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const CreateCompetition = ({ isDark, colors }) => {
  const competitionStore = useCompetitionStore();
  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [questionCount, setQuestionCount] = useState("15");
  const [timePerQuestion, setTimePerQuestion] = useState("60");
  const [maxParticipants, setMaxParticipants] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowMidJoin, setAllowMidJoin] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [duration, setDuration] = useState("60");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [preloadProgress, setPreloadProgress] = useState(0);

  // Mock data
  const availableTopics = [
    { id: 1, name: "Derivatives" },
    { id: 2, name: "Integrals" },
    { id: 3, name: "Limits" },
    { id: 4, name: "Differential Equations" },
    { id: 5, name: "Vector Calculus" },
    { id: 6, name: "Series & Sequences" },
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      competitionStore.fetchAvailableUsers(searchQuery);
    }
  }, [searchQuery]);

  // Helper functions
  const toggleTopic = (id) => {
    setSelectedTopics((prev) =>
      prev.includes(id)
        ? prev.filter((topicId) => topicId !== id)
        : [...prev, id]
    );
  };

  const addUser = (userId) => {
    if (!invitedUsers.includes(userId)) {
      setInvitedUsers([...invitedUsers, userId]);
    }
    setSearchQuery("");
  };
  const removeUser = (userId) => {
    setInvitedUsers(invitedUsers.filter((id) => id !== userId));
  };

  const handleCreateCompetition = async () => {
    try {
      // Create the competition
      const competitionId = await competitionStore.createCompetition({
        title,
        subject,
        questionCount: parseInt(questionCount),
        timePerQuestion: parseInt(timePerQuestion),
        maxParticipants: parseInt(maxParticipants),
        difficulty,
        isPrivate,
        allowMidJoin,
        showLeaderboard,
        duration: parseInt(duration),
        topics: selectedTopics,
        invitedUsers: isPrivate ? invitedUsers : undefined,
      });

      // Start preloading data in the background
      const localStore = useLocalCompetitionStore.getState();
      await localStore.initializeDB(); // Ensure DB is ready
      await localStore.preloadCompetitionData(competitionId);

      // Navigate to waiting room
      router.push({
        pathname: `/Hubs/Competition/waiting-room`,
        params: {
          competitionId: competitionId,
          preloaded: "true", // Flag to indicate data is preloaded
        },
      });
    } catch (error) {
      console.error("Failed to create competition:", error);
      Alert.alert("Error", "Failed to create competition. Please try again.");
    } finally {
    }
  };

  const isFormValid =
    title &&
    subject &&
    selectedTopics.length > 0 &&
    (!isPrivate || invitedUsers.length > 0);

  return (
    <View className="p-4">
      {/* Main Form */}
      <View
        className="bg-white rounded-xl p-5 mb-6 shadow-sm"
        style={{ backgroundColor: isDark ? `${colors.dark}90` : colors.white }}
      >
        <Text
          className="text-lg font-bold mb-4"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Competition Details
        </Text>

        {/* Title */}
        <View className="mb-4">
          <Text
            className="text-sm mb-1 font-medium"
            style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
          >
            Competition Title
          </Text>
          <TextInput
            className="p-3 rounded-lg border"
            style={{
              borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
              backgroundColor: isDark ? `${colors.dark}90` : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="Enter a title for your competition"
            placeholderTextColor={isDark ? `${colors.offwhite}50` : colors.gray}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Subject */}
        <View className="mb-4">
          <Text
            className="text-sm mb-1 font-medium"
            style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
          >
            Subject
          </Text>
          <TextInput
            className="p-3 rounded-lg border"
            style={{
              borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
              backgroundColor: isDark ? `${colors.dark}90` : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="Enter subject or course code"
            placeholderTextColor={isDark ? `${colors.offwhite}50` : colors.gray}
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        {/* Grid of controls */}
        <View className="flex-row mb-4 justify-between">
          {/* Duration */}
          <View className="w-5/12">
            <Text
              className="text-sm mb-1 font-medium"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              Duration (min)
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="h-10 w-10 rounded-l-lg justify-center items-center"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}90`
                    : `${colors.primary}20`,
                }}
                onPress={() =>
                  setDuration(Math.max(parseInt(duration) - 15, 15).toString())
                }
              >
                <AntDesign name="minus" size={16} color={colors.primary} />
              </TouchableOpacity>
              <View style={{ maxWidth: 50, minWidth: 20 }}>
                <TextInput
                  className="h-10  text-center flex-1 border-t border-b"
                  style={{
                    borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
                    backgroundColor: isDark ? `${colors.dark}90` : colors.white,
                    color: isDark ? colors.offwhite : colors.dark,
                  }}
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>

              <TouchableOpacity
                className="h-10 w-10 rounded-r-lg justify-center items-center"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}90`
                    : `${colors.primary}20`,
                }}
                onPress={() =>
                  setDuration((parseInt(duration) + 15).toString())
                }
              >
                <AntDesign name="plus" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Questions */}
          <View className="w-5/12">
            <Text
              className="text-sm mb-1 font-medium"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              Questions
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="h-10 w-10 rounded-l-lg justify-center items-center"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}90`
                    : `${colors.primary}20`,
                }}
                onPress={() =>
                  setQuestionCount(
                    Math.max(parseInt(questionCount) - 5, 5).toString()
                  )
                }
              >
                <AntDesign name="minus" size={16} color={colors.primary} />
              </TouchableOpacity>
              <View style={{ maxWidth: 50, minWidth: 20 }}>
                <TextInput
                  className="h-10 text-center flex-1 border-t border-b"
                  style={{
                    borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
                    backgroundColor: isDark ? `${colors.dark}90` : colors.white,
                    color: isDark ? colors.offwhite : colors.dark,
                  }}
                  keyboardType="numeric"
                  value={questionCount}
                  onChangeText={setQuestionCount}
                />
              </View>

              <TouchableOpacity
                className="h-10 w-10 rounded-r-lg justify-center items-center"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}90`
                    : `${colors.primary}20`,
                }}
                onPress={() =>
                  setQuestionCount((parseInt(questionCount) + 5).toString())
                }
              >
                <AntDesign name="plus" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="flex-row mb-4 justify-between">
          {/* Duration */}
          <View className="w-5/12">
            <Text
              className="text-sm mb-1 font-medium"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              Question Timer (sec)
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="h-10 w-10 rounded-l-lg justify-center items-center"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}90`
                    : `${colors.primary}20`,
                }}
                onPress={() =>
                  setTimePerQuestion(
                    Math.max(parseInt(timePerQuestion) - 15, 15).toString()
                  )
                }
              >
                <AntDesign name="minus" size={16} color={colors.primary} />
              </TouchableOpacity>
              <View style={{ maxWidth: 50, minWidth: 20 }}>
                <TextInput
                  className="h-10  text-center flex-1 border-t border-b"
                  style={{
                    borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
                    backgroundColor: isDark ? `${colors.dark}90` : colors.white,
                    color: isDark ? colors.offwhite : colors.dark,
                  }}
                  keyboardType="numeric"
                  value={timePerQuestion}
                  onChangeText={setTimePerQuestion}
                />
              </View>

              <TouchableOpacity
                className="h-10 w-10 rounded-r-lg justify-center items-center"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}90`
                    : `${colors.primary}20`,
                }}
                onPress={() =>
                  setTimePerQuestion(
                    (parseInt(timePerQuestion) + 15).toString()
                  )
                }
              >
                <AntDesign name="plus" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Questions */}
          <View className="w-5/12">
            <Text
              className="text-sm mb-1 font-medium"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              Max Participants
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="h-10 w-10 rounded-l-lg justify-center items-center"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}90`
                    : `${colors.primary}20`,
                }}
                onPress={() =>
                  setMaxParticipants(
                    Math.max(parseInt(maxParticipants) - 5, 5).toString()
                  )
                }
              >
                <AntDesign name="minus" size={16} color={colors.primary} />
              </TouchableOpacity>
              <View style={{ maxWidth: 50, minWidth: 20 }}>
                <TextInput
                  className="h-10 text-center flex-1 border-t border-b"
                  style={{
                    borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
                    backgroundColor: isDark ? `${colors.dark}90` : colors.white,
                    color: isDark ? colors.offwhite : colors.dark,
                  }}
                  keyboardType="numeric"
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                />
              </View>

              <TouchableOpacity
                className="h-10 w-10 rounded-r-lg justify-center items-center"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}90`
                    : `${colors.primary}20`,
                }}
                onPress={() =>
                  setMaxParticipants((parseInt(maxParticipants) + 5).toString())
                }
              >
                <AntDesign name="plus" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="mb-2">
          <Text
            className="text-sm mb-2 font-medium"
            style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
          >
            Difficulty Level
          </Text>
          <View className="flex-row justify-between">
            {["easy", "medium", "hard"].map((level) => (
              <TouchableOpacity
                key={level}
                className="flex-1 mx-1 py-2 rounded-lg items-center justify-center"
                style={{
                  backgroundColor:
                    difficulty === level
                      ? isDark
                        ? colors.primaryDark
                        : colors.primary
                      : isDark
                      ? `${colors.dark}90`
                      : `${colors.lightGray}50`,
                }}
                onPress={() => setDifficulty(level)}
              >
                <Text
                  className="font-medium capitalize"
                  style={{
                    color:
                      difficulty === level
                        ? colors.white
                        : isDark
                        ? colors.offwhite
                        : colors.dark,
                  }}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Competition Settings */}
        <View className="mb-4">
          <Text
            className="text-sm mb-2 font-medium"
            style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
          >
            Settings
          </Text>

          {/* Private Competition */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1">
              <MaterialIcons
                name="lock-outline"
                size={18}
                color={isDark ? colors.offwhite : colors.dark}
                style={{ marginRight: 10 }}
              />
              <View>
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  Private Competition
                </Text>
                <Text
                  className="text-xs"
                  style={{
                    color: isDark ? `${colors.offwhite}60` : colors.gray,
                  }}
                >
                  Only invited users can join
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{
                false: colors.lightGray,
                true: `${colors.primary}80`,
              }}
              thumbColor={isPrivate ? colors.primary : "#f4f3f4"}
              ios_backgroundColor={colors.lightGray}
              onValueChange={() => setIsPrivate(!isPrivate)}
              value={isPrivate}
            />
          </View>

          {/* Allow Mid-Join */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1">
              <MaterialCommunityIcons
                name="account-arrow-right-outline"
                size={18}
                color={isDark ? colors.offwhite : colors.dark}
                style={{ marginRight: 10 }}
              />
              <View>
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  Allow Mid-Competition Join
                </Text>
                <Text
                  className="text-xs"
                  style={{
                    color: isDark ? `${colors.offwhite}60` : colors.gray,
                  }}
                >
                  Users can join during competition
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{
                false: colors.lightGray,
                true: `${colors.primary}80`,
              }}
              thumbColor={allowMidJoin ? colors.primary : "#f4f3f4"}
              ios_backgroundColor={colors.lightGray}
              onValueChange={() => setAllowMidJoin(!allowMidJoin)}
              value={allowMidJoin}
            />
          </View>

          {/* Show Leaderboard */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <MaterialCommunityIcons
                name="format-list-numbered"
                size={18}
                color={isDark ? colors.offwhite : colors.dark}
                style={{ marginRight: 10 }}
              />
              <View>
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  Show Live Leaderboard
                </Text>
                <Text
                  className="text-xs"
                  style={{
                    color: isDark ? `${colors.offwhite}60` : colors.gray,
                  }}
                >
                  Participants can see rankings during competition
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{
                false: colors.lightGray,
                true: `${colors.primary}80`,
              }}
              thumbColor={showLeaderboard ? colors.primary : "#f4f3f4"}
              ios_backgroundColor={colors.lightGray}
              onValueChange={() => setShowLeaderboard(!showLeaderboard)}
              value={showLeaderboard}
            />
          </View>
        </View>
      </View>

      {/* Topics Section */}
      <View
        className="bg-white rounded-xl p-5 mb-6 shadow-sm"
        style={{ backgroundColor: isDark ? `${colors.dark}90` : colors.white }}
      >
        <Text
          className="text-lg font-bold mb-4"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Select Topics
        </Text>

        <View className="flex-row flex-wrap">
          {availableTopics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              className="mb-3 mr-3 py-2 px-4 rounded-full flex-row items-center"
              style={{
                backgroundColor: selectedTopics.includes(topic.id)
                  ? isDark
                    ? `${colors.primary}90`
                    : `${colors.primary}20`
                  : isDark
                  ? `${colors.dark}90`
                  : `${colors.lightGray}50`,
                borderWidth: 1,
                borderColor: selectedTopics.includes(topic.id)
                  ? colors.primary
                  : isDark
                  ? `${colors.gray}50`
                  : colors.lightGray,
              }}
              onPress={() => toggleTopic(topic.id)}
            >
              <Text
                className="font-medium mr-2"
                style={{
                  color: selectedTopics.includes(topic.id)
                    ? isDark
                      ? colors.white
                      : colors.primary
                    : isDark
                    ? colors.offwhite
                    : colors.dark,
                }}
              >
                {topic.name}
              </Text>
              {selectedTopics.includes(topic.id) && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={isDark ? colors.white : colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Invite Users */}
      {isPrivate && (
        <View
          className="bg-white rounded-xl p-5 mb-6 shadow-sm"
          style={{
            backgroundColor: isDark ? `${colors.dark}90` : colors.white,
          }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Invite Users
          </Text>
          {/* Search Input */}
          <View className="mb-4 relative">
            <View
              className="flex-row items-center border rounded-lg overflow-hidden"
              style={{
                borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
              }}
            >
              <Ionicons
                name="search"
                size={18}
                color={isDark ? colors.offwhite : colors.gray}
                style={{ marginLeft: 12 }}
              />
              <TextInput
                className="p-3 flex-1"
                style={{
                  backgroundColor: isDark ? `${colors.dark}90` : colors.white,
                  color: isDark ? colors.offwhite : colors.dark,
                }}
                placeholder="Search by username"
                placeholderTextColor={
                  isDark ? `${colors.offwhite}50` : colors.gray
                }
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== "" && (
                <TouchableOpacity
                  className="px-3"
                  onPress={() => setSearchQuery("")}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={isDark ? colors.offwhite : colors.gray}
                  />
                </TouchableOpacity>
              )}
            </View>
            {/* Search Results Dropdown */}
            {searchQuery !== "" && (
              <View
                className="absolute top-full left-0 right-0 z-10 rounded-b-lg border-l border-r border-b mt-0 max-h-40"
                style={{
                  backgroundColor: isDark ? `${colors.dark}90` : colors.white,
                  borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
                }}
              >
                {competitionStore.isLoading ? (
                  <View className="p-3 items-center">
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : competitionStore.availableUsers.length > 0 ? (
                  <FlatList
                    data={competitionStore.availableUsers.filter(
                      (user) => !invitedUsers.includes(user.user_id)
                    )}
                    scrollEnabled={false}
                    keyExtractor={(item) => item.user_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        className="p-3 flex-row items-center border-b"
                        style={{
                          borderColor: isDark
                            ? `${colors.gray}30`
                            : colors.lightGray,
                        }}
                        onPress={() => addUser(item.user_id)}
                      >
                        <View
                          className="h-8 w-8 rounded-full mr-3 items-center justify-center"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Text className="text-white font-bold">
                            {item.full_name?.charAt(0) ||
                              item.username.charAt(0)}
                          </Text>
                        </View>
                        <View>
                          <Text
                            className="font-medium"
                            style={{
                              color: isDark ? colors.offwhite : colors.dark,
                            }}
                          >
                            {item.full_name || item.username}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{
                              color: isDark
                                ? `${colors.offwhite}60`
                                : colors.gray,
                            }}
                          >
                            @{item.username}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 200 }}
                  />
                ) : (
                  <View className="p-3">
                    <Text
                      className="text-center"
                      style={{ color: isDark ? colors.offwhite : colors.dark }}
                    >
                      No users found
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          {/* Invited Users */}
          <View className="mb-2">
            <Text
              className="text-sm mb-2 font-medium"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              Invited ({invitedUsers.length})
            </Text>

            {invitedUsers.length > 0 ? (
              <View className="flex-row flex-wrap">
                {invitedUsers.map((userId) => {
                  const user = competitionStore.allFetchedUsers.find(
                    (u) => u.user_id === userId
                  );

                  return (
                    <View
                      key={userId}
                      className="flex-row items-center bg -gray-100 rounded-full py-1 px-3 mr-2 mb-2"
                      style={{
                        backgroundColor: isDark
                          ? `${colors.gray}30`
                          : `${colors.lightGray}50`,
                      }}
                    >
                      <Text
                        className="mr-2"
                        style={{
                          color: isDark ? colors.offwhite : colors.dark,
                        }}
                      >
                        {user?.full_name || user?.username || "Unknown"}
                      </Text>
                      <TouchableOpacity onPress={() => removeUser(userId)}>
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={isDark ? `${colors.offwhite}70` : colors.gray}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text
                className="italic"
                style={{ color: isDark ? `${colors.offwhite}60` : colors.gray }}
              >
                No users invited yet
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Create Competition Button */}
      <TouchableOpacity
        className="py-4 rounded-xl justify-center items-center mb-10"
        style={{
          backgroundColor: isFormValid
            ? colors.primary
            : isDark
            ? `${colors.gray}30`
            : `${colors.lightGray}90`,
        }}
        onPress={handleCreateCompetition}
        disabled={!isFormValid || competitionStore.isLoading}
      >
        {competitionStore.isLoading ? (
          <View className="items-center">
            <ActivityIndicator size="small" color={colors.white} />
            {preloadProgress > 0 && (
              <Text className="text-white text-xs mt-1">
                Loading questions... {Math.round(preloadProgress * 100)}%
              </Text>
            )}
          </View>
        ) : (
          <Text className="text-white font-bold text-lg">
            Create Competition
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CreateCompetition;
