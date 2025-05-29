import { useCompetitionStore } from "@/backend/store/useCompetitionStore";
import { useLocalTurnoutStore } from "@/backend/store/useLocalTurnoutStore";
import { colors } from "@/constants/Colors";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TurnOutResult = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const localTurnoutStore = useLocalTurnoutStore();
  const { competitionId } = useLocalSearchParams();
  const competitionStore = useCompetitionStore();

  // Load competition details
  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize local DB if needed
        await localTurnoutStore.initializeDB();

        if (competitionId) {
          // Try to load from local first
          const localResults = await localTurnoutStore.getLocalTurnoutResults(
            parseInt(competitionId)
          );
          const localQuestions =
            await localTurnoutStore.getLocalQuestionResults(
              parseInt(competitionId)
            );

          if (localResults.length > 0 && localQuestions.length > 0) {
            // Use local data if available
            // You might need to merge this with the competitionStore state
          }

          // Always fetch fresh data from server
          await competitionStore.getCompetitionDetails(parseInt(competitionId));

          // Save results to local DB
          const participantScores = getParticipantScores();
          const questionDetails = competitionStore.competitionQuestions.map(
            (q) => {
              const details = getQuestionDetails(q.id);
              return {
                question_id: q.id,
                correct_answer_id: details.correctAnswer?.id || null,
                correct_percentage: details.correctPercentage,
              };
            }
          );

          await localTurnoutStore.saveTurnoutResults(
            parseInt(competitionId),
            participantScores.map((p, index) => ({
              participant_id: p.id,
              score: p.score,
              total_time: p.totalTime,
              accuracy: p.accuracy,
              position: index + 1,
            }))
          );

          await localTurnoutStore.saveQuestionResults(
            parseInt(competitionId),
            questionDetails
          );
        }
      } catch (error) {
        console.error("Failed to load/save turnout results:", error);
      }
    };

    loadData();

    return () => {
      competitionStore.cleanupSubscriptions();
    };
  }, [competitionId , localTurnoutStore, competitionStore , getParticipantScores, getQuestionDetails]);

  // Initialize background sync when app starts
  useEffect(() => {
    const cleanup = useLocalTurnoutStore.getState().startBackgroundSync();
    return cleanup;
  }, []);

  // Calculate participant scores using answers if score field is missing


  const getParticipantScores = useCallback(() => {
    const answersByParticipant = new Map();

    // Group answers by participant
    for (const answer of competitionStore.participantAnswers) {
      if (!answersByParticipant.has(answer.participant_id)) {
        answersByParticipant.set(answer.participant_id, []);
      }
      answersByParticipant.get(answer.participant_id).push(answer);
    }

    // Map participants with calculated scores
    return (
      competitionStore.competitionParticipants
        .map((participant) => {
          const answers = answersByParticipant.get(participant.id) || [];
          const correctAnswers = answers.filter((a) => a.is_correct).length;
          const totalTime = answers.reduce(
            (sum, a) => sum + (a.time_taken || 0),
            0
          );
          const questionCount = competitionStore.competitionQuestions.length;

          // Use participant.score if available, otherwise calculate from answers
          const finalScore =
            participant.score > 0 ? participant.score : correctAnswers;

          return {
            ...participant,
            score: finalScore,
            totalTime,
            accuracy:
              questionCount > 0 ? (finalScore / questionCount) * 100 : 0,
            hasAnswered: answers.length > 0,
          };
        })
        // Only include participants who have answered questions or have a score
        .filter(
          (p) => p.hasAnswered || p.score > 0 || (p.has_joined && p.completed)
        )
        // Sort by score descending, then by time ascending
        .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime)
    );
  }, [
    competitionStore.participantAnswers,
    competitionStore.competitionParticipants,
    competitionStore.competitionQuestions.length,
  ]);
  // Get question details with participant answers
  const getQuestionDetails = useCallback(
    (questionId) => {
      const question = competitionStore.competitionQuestions.find(
        (q) => q.id === questionId
      );
      if (!question) return null;

      // Get all answers for this question
      const allAnswersForQuestion = competitionStore.questionAnswers.filter(
        (a) => Number(a.question_id) === Number(questionId)
      );

      const correctAnswer = allAnswersForQuestion.find(
        (a) => a.is_correct === true || a.is_correct === "true"
      );

      if (!correctAnswer && allAnswersForQuestion.length > 0) {
        // If no correct answer is marked, log a warning
        console.warn(`No correct answer found for question ${questionId}`, {
          allQuestionAnswers: competitionStore.questionAnswers,
          filteredAnswers: allAnswersForQuestion,
          questionExists: !!question,
        });
      }

      // Get participant answers for this question
      const participantAnswers = competitionStore.participantAnswers.filter(
        (a) => Number(a.question_id) === Number(questionId)
      );

      const correctCount = participantAnswers.filter((a) => a.is_correct).length;
      const totalAnswered = participantAnswers.length;

      return {
        question,
        correctAnswer,
        participantAnswers,
        correctPercentage:
          totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0,
      };
    },
    [
      competitionStore.competitionQuestions,
      competitionStore.questionAnswers,
      competitionStore.participantAnswers,
    ]
  );

  const handleBackPress = () => {
    // Check if we came from a replaced route
    const fromReplacedRoute = router.canGoBack();

    if (!fromReplacedRoute) {
      // If we came from router.replace(), go back multiple times
      router.back();
      router.back();
      router.back();
      router.back();
    } else {
      // Normal navigation, just go back once
      router.back();
    }
  };

  const participantScores = getParticipantScores();
  const currentCompetition = competitionStore.currentCompetition;
  const totalParticipantsJoined =
    competitionStore.competitionParticipants.filter(
      (p) => p.has_joined || p.id in participantScores.map((ps) => ps.id)
    ).length;

  if (competitionStore.isLoading || !currentCompetition) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
          Loading results...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 pt-20 p-4"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      <View>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={handleBackPress}>
            <Ionicons
              name="backspace-outline"
              size={24}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Competition Results
          </Text>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={isDark ? colors.offwhite : colors.dark}
          />
        </View>
      </View>
      {/* Competition Header */}
      <View className="mb-6">
        <Text
          className="text-2xl font-bold mb-1"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          {currentCompetition.title}
        </Text>
        <Text
          className="text-lg mb-2"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          {currentCompetition.subject}
        </Text>
        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name="trophy"
            size={20}
            color={colors.primary}
          />
          <Text className="ml-1" style={{ color: colors.primary }}>
            Competition Results
          </Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View
        className="p-4 rounded-lg mb-6"
        style={{
          backgroundColor: isDark ? colors.darkLight : colors.grayLight,
        }}
      >
        <View className="flex-row justify-between mb-3">
          <View>
            <Text
              className="text-sm"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              Participants
            </Text>
            <Text
              className="text-xl font-bold"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              {participantScores.length ||
                totalParticipantsJoined ||
                competitionStore.competitionParticipants.length}
            </Text>
          </View>
          <View>
            <Text
              className="text-sm"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              Questions
            </Text>
            <Text
              className="text-xl font-bold"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              {competitionStore.competitionQuestions.length}
            </Text>
          </View>
          <View>
            <Text
              className="text-sm"
              style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
            >
              Avg. Score
            </Text>
            <Text
              className="text-xl font-bold"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              {participantScores.length > 0
                ? Math.round(
                    participantScores.reduce((sum, p) => sum + p.score, 0) /
                      participantScores.length
                  )
                : 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Leaderboard */}
      <Text
        className="text-lg font-bold mb-3"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Leaderboard
      </Text>
      <View
        className="rounded-lg mb-6 overflow-hidden"
        style={{
          backgroundColor: isDark ? colors.darkLight : colors.grayLight,
        }}
      >
        {participantScores.length > 0 ? (
          participantScores.map((participant, index) => (
            <View
              key={participant.id}
              className={`flex-row items-center p-3 ${
                index !== participantScores.length - 1 ? "border-b" : ""
              }`}
              style={{
                borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
              }}
            >
              <View className="w-8 items-center">
                {index === 0 ? (
                  <Feather name="award" size={20} color={colors.gold} />
                ) : index === 1 ? (
                  <Feather name="award" size={20} color={colors.silver} />
                ) : index === 2 ? (
                  <Feather name="award" size={20} color={colors.bronze} />
                ) : (
                  <Text
                    style={{ color: isDark ? colors.offwhite : colors.dark }}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="font-medium"
                  style={{ color: isDark ? colors.offwhite : colors.dark }}
                >
                  {participant.profiles?.username ||
                    participant.profiles?.full_name ||
                    "Anonymous"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-bold" style={{ color: colors.primary }}>
                  {participant.score} /{" "}
                  {competitionStore.competitionQuestions.length}
                </Text>
                <Text
                  className="text-xs"
                  style={{
                    color: isDark ? `${colors.offwhite}80` : colors.gray,
                  }}
                >
                  {Math.round(participant.accuracy)}% accuracy
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View className="p-4">
            <Text
              style={{
                color: isDark ? colors.offwhite : colors.dark,
                textAlign: "center",
              }}
            >
              No participants have completed the competition yet
            </Text>
          </View>
        )}
      </View>

      {/* Questions Breakdown */}
      <Text
        className="text-lg font-bold mb-3"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Questions Breakdown
      </Text>
      <FlatList
        data={competitionStore.competitionQuestions}
        scrollEnabled={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: question, index }) => {
          const details = getQuestionDetails(question.id);
          if (!details) return null;

          return (
            <View
              className="p-4 rounded-lg mb-3"
              style={{
                backgroundColor: isDark ? colors.darkLight : colors.grayLight,
              }}
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text
                  className="font-medium"
                  style={{
                    color: isDark ? colors.offwhite : colors.dark,
                    maxWidth: 250,
                  }}
                >
                  Q{index + 1}: {question.question_text}
                </Text>
                <View
                  style={{
                    backgroundColor:
                      details.participantAnswers.length === 0
                        ? colors.infoBlue // Blue for unanswered
                        : details.correctPercentage === 0
                        ? colors.dangerRed // Red for all incorrect
                        : colors.successGreen, // Green for some correct
                  }}
                  className="px-2 py-1 rounded-full"
                >
                  <Text className="text-xs text-white">
                    {Math.round(details.correctPercentage)}% correct
                  </Text>
                </View>
              </View>

              <View className="mt-2">
                <Text
                  className="text-sm mb-1"
                  style={{
                    color: isDark ? `${colors.offwhite}80` : colors.gray,
                  }}
                >
                  Correct Answer:
                </Text>
                <View className="flex-row items-center bg-green-100 p-2 rounded">
                  <AntDesign
                    name="checkcircle"
                    size={16}
                    color={colors.primary}
                  />
                  {details.correctAnswer ? (
                    <Text
                      className="ml-2"
                      style={{ color: isDark ? colors.dark : colors.dark }}
                    >
                      {details.correctAnswer.answer_text}
                    </Text>
                  ) : (
                    <Text className="ml-2 italic text-red-500">
                      No correct answer found
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        }}
                  initialNumToRender={10}
          maxToRenderPerBatch={10}
      />

      {/* Final Remarks */}
      <View
        className="mt-6 p-4 rounded-lg"
        style={{
          backgroundColor: isDark ? colors.darkLight : colors.grayLight,
        }}
      >
        <Text
          className="text-lg font-bold mb-2"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Competition Summary
        </Text>
        <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
          {participantScores.length > 0
            ? `The competition had ${
                participantScores.length
              } participants with an average score of ${Math.round(
                participantScores.reduce((sum, p) => sum + p.score, 0) /
                  participantScores.length
              )} out of ${competitionStore.competitionQuestions.length}.`
            : "No participants have completed the competition yet."}
        </Text>
      </View>
      <View className="mb-32" />
    </ScrollView>
  );
};

export default TurnOutResult;
