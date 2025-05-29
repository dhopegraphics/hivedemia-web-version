import { useCompetitionStore } from "@/backend/store/useCompetitionStore";
import { useLocalCompetitionStore } from "@/backend/store/useLocalCompetitionStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import { colors } from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ActiveCompetition = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { competitionId } = useLocalSearchParams();
  const router = useRouter();
  const competitionStore = useCompetitionStore();
  const localStore = useLocalCompetitionStore();
  const userStore = useUserStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  const [questionAnswerCounts, setQuestionAnswerCounts] = useState({});
  const [activeParticipantsCount, setActiveParticipantsCount] = useState(0);
  const [localQuestions, setLocalQuestions] = useState([]);
  const [localAnswers, setLocalAnswers] = useState({});
  const [isLocalDataReady, setIsLocalDataReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const cleanupRef = useRef(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const debugLog = useCallback((message, data) => {
    console.log(`[Competition Debug] ${message}`, data || "");
  }, []);

  const currentParticipant = useMemo(
    () =>
      competitionStore.competitionParticipants.find(
        (p) => p.user_id === userStore.profile.user_id
      ),
    [competitionStore.competitionParticipants, userStore.profile.user_id]
  );

  useEffect(() => {
    debugLog("Question changed", {
      index: currentQuestionIndex,
      hasAnswered,
      timeLeft,
      waitingForOthers,
    });
  }, [currentQuestionIndex, hasAnswered, timeLeft, waitingForOthers , debugLog]);

  // Initialize local database and start background sync
  useEffect(() => {
    const setupLocalStore = async () => {
      try {
        await localStore.initializeDB();
        const cleanup = localStore.startBackgroundSync();
        cleanupRef.current = cleanup;
        setIsInitializing(false);
      } catch (error) {
        console.error("Failed to initialize local database:", error);
        Alert.alert(
          "Setup Error",
          "Failed to set up local storage. The app will try to use online mode."
        );
        setIsInitializing(false);
      }
    };
    setupLocalStore();
    // Cleanup function to stop background sync when component unmounts
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [localStore]);
  // In ActiveCompetition.jsx
  useEffect(() => {
    const loadCompetition = async () => {
      if (!competitionId || !userStore.profile.user_id || isInitializing)
        return;
      try {
        // Preload ALL data before starting the competition
        await localStore.preloadCompetitionData(parseInt(competitionId));

        // Get all questions at once
        const questions = await localStore.getLocalQuestions(
          parseInt(competitionId)
        );
        setLocalQuestions(questions);

        // Preload answers for all questions
        const answersMap = {};
        for (const question of questions) {
          answersMap[question.id] = await localStore.getLocalAnswers(
            question.id
          );
        }
        setLocalAnswers(answersMap);

        setIsLocalDataReady(true);

        // Background sync with server
        competitionStore
          .getCompetitionDetails(parseInt(competitionId))
          .catch(console.error);
        competitionStore.subscribeToCompetitionUpdates(parseInt(competitionId));

        // Ensure participant is joined
        await competitionStore.ensureParticipantJoined(
          userStore.profile.user_id,
          parseInt(competitionId)
        );
      } catch (error) {
        console.error("Error initializing competition:", error);
        setIsLocalDataReady(competitionStore.competitionQuestions.length > 0);
      }
    };

    loadCompetition();

    return () => {
      competitionStore.cleanupSubscriptions();
    };
  }, [
    competitionId,
    userStore.profile.user_id,
    isInitializing,
    localStore,
    competitionStore,
  ]);
  // Count active participants
  useEffect(() => {
    if (competitionStore.competitionParticipants) {
      const activeCount = competitionStore.competitionParticipants.filter(
        (p) => p.has_joined && !p.completed
      ).length;
      setActiveParticipantsCount(activeCount);
    }
  }, [competitionStore.competitionParticipants]);

  // Load answers for current question from local DB
  useEffect(() => {
    const loadAnswersForCurrentQuestion = async () => {
      if (!isLocalDataReady || localQuestions.length === 0) return;
      try {
        const currentQuestionId = localQuestions[currentQuestionIndex]?.id;
        if (!currentQuestionId) return;
        // Get answers from local DB
        const answers = await localStore.getLocalAnswers(currentQuestionId);
        // Update state with these answers
        setLocalAnswers((prevAnswers) => ({
          ...prevAnswers,
          [currentQuestionId]: answers,
        }));
        // Also trigger online fetch for sync purposes, but don't wait for it
        if (competitionStore.competitionQuestions[currentQuestionIndex]?.id) {
          competitionStore
            .fetchQuestionAnswers(
              competitionStore.competitionQuestions[currentQuestionIndex].id
            )
            .catch(console.error);
        }
      } catch (error) {
        console.error("Error loading local answers:", error);
      }
    };
    loadAnswersForCurrentQuestion();
  }, [
    currentQuestionIndex,
    localQuestions,
    isLocalDataReady,
    competitionStore,
    localStore,
  ]);
  // Get current question and answers
  const currentQuestion = isLocalDataReady
    ? localQuestions[currentQuestionIndex]
    : competitionStore.competitionQuestions[currentQuestionIndex];
  // Add useMemo for expensive computations
  const currentQuestionAnswers = useMemo(() => {
    if (isLocalDataReady && currentQuestion) {
      return localAnswers[currentQuestion.id] || [];
    }
    return (
      competitionStore.questionAnswersByQuestionId[
        competitionStore.competitionQuestions[currentQuestionIndex]?.id
      ] || []
    );
  }, [
    currentQuestion,
    isLocalDataReady,
    localAnswers,
    competitionStore.questionAnswersByQuestionId,
    competitionStore.competitionQuestions,
    currentQuestionIndex,
  ]);
  // Effect to track participant answers for the current question
  // Effect for tracking participant answers
  useEffect(() => {
    if (!currentQuestion?.id || !waitingForOthers) return;

    const currentQuestionId = currentQuestion.id;
    const answersForCurrentQuestion =
      competitionStore.participantAnswers.filter(
        (a) => a.question_id === currentQuestionId
      );

    setQuestionAnswerCounts((prev) => ({
      ...prev,
      [currentQuestionId]: answersForCurrentQuestion.length,
    }));

    if (
      answersForCurrentQuestion.length >= activeParticipantsCount &&
      activeParticipantsCount > 0
    ) {
      const timer = setTimeout(() => {
        setWaitingForOthers(false);
        handleNextQuestion();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    currentQuestion?.id,
    waitingForOthers,
    activeParticipantsCount,
    competitionStore.participantAnswers,
    competitionStore.competitionQuestions,
    handleNextQuestion,
  ]);

  // Replace both timer effects with this single version
  useEffect(() => {
    const shouldStartTimer =
      currentQuestion &&
      !waitingForOthers &&
      !hasAnswered &&
      !timerActive &&
      (competitionStore.currentCompetition || isLocalDataReady);

    if (!shouldStartTimer) return;

    const timePerQuestion =
      competitionStore.currentCompetition?.time_per_question || 30;
    const startTimeValue = Date.now();

    setTimeLeft(timePerQuestion);
    setTimerActive(true);
    setStartTime(startTimeValue);

    const timer = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTimeValue) / 1000);
      const remaining = Math.max(0, timePerQuestion - elapsedTime);

      if (remaining <= 0) {
        clearInterval(timer);
        setTimerActive(false);
        setTimeLeft(0);
        if (!hasAnswered && !waitingForOthers) {
          handleTimeUp();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    currentQuestion?.id,
    waitingForOthers,
    hasAnswered,
    isLocalDataReady,
    handleTimeUp,
    currentQuestion,
    timerActive,
    competitionStore.currentCompetition,
  ]); // More specific dependencies
  // Update the handleTimeUp function:
  const handleTimeUp = useCallback(async () => {
    setTimerActive(false);
    debugLog("Time up triggered", {
      hasAnswered,
      timeLeft,
      currentQuestionIndex,
    });

    if (!hasAnswered && currentQuestion && currentParticipant) {
      setHasAnswered(true);
      try {
        await localStore.submitLocalAnswer({
          participantId: currentParticipant.id,
          questionId: currentQuestion.id,
          answerId: null,
          isCorrect: false,
          timeTaken:
            competitionStore.currentCompetition?.time_per_question || 30,
        });

        competitionStore
          .submitAnswer({
            participantId: currentParticipant.id,
            questionId: currentQuestion.id,
            answerId: null,
            timeTaken:
              competitionStore.currentCompetition?.time_per_question || 30,
          })
          .catch(console.error);
      } catch (error) {
        console.error("Error handling time up:", error);
      }
    }
    checkIfAllAnswered();
  }, [
    hasAnswered,
    timeLeft,
    currentQuestionIndex,
    currentQuestion,
    currentParticipant,
    localStore,
    competitionStore,
    checkIfAllAnswered,
    debugLog,
    setTimerActive,
    setHasAnswered,
  ]);

  const handleAnswerSelect = async (answerId) => {
    if (waitingForOthers || selectedAnswerId) return;

    setSelectedAnswerId(answerId);
    setTimerActive(false);
    setHasAnswered(true);

    const timeTaken = Math.min(
      Math.floor((Date.now() - startTime) / 1000),
      competitionStore.currentCompetition?.time_per_question || 30
    );

    const selectedAnswer = currentQuestionAnswers.find(
      (answer) => answer.id === answerId
    );
    const isCorrect = selectedAnswer?.is_correct || false;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    localStore
      .submitLocalAnswer({
        participantId: currentParticipant.id,
        questionId: currentQuestion.id,
        answerId,
        isCorrect,
        timeTaken,
      })
      .catch(console.error);

    setWaitingForOthers(true);

    competitionStore
      .submitAnswer({
        participantId: currentParticipant.id,
        questionId: currentQuestion.id,
        answerId,
        timeTaken,
      })
      .catch(console.error);
  };

  const checkIfAllAnswered = useCallback(() => {
    if (!currentQuestion || timeLeft > 0 || !hasAnswered) return;

    const currentQuestionId = currentQuestion.id;
    const answersForCurrentQuestion =
      competitionStore.participantAnswers.filter(
        (a) => a.question_id === currentQuestionId
      );

    // Single player mode
    if (activeParticipantsCount === 1) {
      setTimeout(() => handleNextQuestion(), 1500);
      return;
    }

    // Multiplayer mode
    if (competitionStore.currentCompetition?.is_private) {
      if (answersForCurrentQuestion.length < activeParticipantsCount) {
        setWaitingForOthers(true);
      } else {
        setTimeout(() => handleNextQuestion(), 1500);
      }
    }
  }, [
    activeParticipantsCount,
    timeLeft,
    hasAnswered,
    competitionStore.participantAnswers,
    handleNextQuestion,
    currentQuestion,
    competitionStore.currentCompetition?.is_private,
  ]);

  const handleNextQuestion = useCallback(() => {
    debugLog("Next question triggered", {
      timeLeft,
      hasAnswered,
      timerActive,
      waitingForOthers,
      currentQuestionIndex,
    });

    if (timerActive) {
      debugLog("Prevented skip - timer still active");
      return;
    }

    if (!hasAnswered && timeLeft > 0) {
      debugLog("Prevented skip - no answer and time remaining");
      return;
    }

    setSelectedAnswerId(null);
    setWaitingForOthers(false);
    setHasAnswered(false);
    setTimerActive(false);

    const maxQuestions = isLocalDataReady
      ? localQuestions.length
      : competitionStore.competitionQuestions.length;

    if (currentQuestionIndex < maxQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleCompleteCompetition();
    }
  }, [
    timeLeft,
    hasAnswered,
    timerActive,
    waitingForOthers,
    currentQuestionIndex,
    isLocalDataReady,
    localQuestions.length,
    competitionStore.competitionQuestions.length,
    setSelectedAnswerId,
    setWaitingForOthers,
    setHasAnswered,
    setTimerActive,
    setCurrentQuestionIndex,
    handleCompleteCompetition,
    debugLog,
  ]);

  const handleCompleteCompetition = useCallback(async () => {
    try {
      if (!currentParticipant) {
        Alert.alert("Error", "Participant information not found");
        return;
      }
      // First try to sync any pending answers before completing
      await localStore.syncPendingAnswers();
      // Use the store function to update participant status
      await competitionStore.updateParticipantStatus({
        participantId: currentParticipant.id,
        userId: userStore.profile.user_id,
        competitionId: parseInt(competitionId),
        completed: true,
        score: score,
      });

      // Check if all participants have completed
      const { count, error: countError } = await supabase
        .from("competition_participants")
        .select("*", { count: "exact" })
        .eq("competition_id", competitionId)
        .eq("has_joined", true)
        .eq("completed", false);

      if (!countError && (count === 0 || count === null)) {
        await supabase
          .from("competitions")
          .update({ status: "completed", ended_at: new Date().toISOString() })
          .eq("id", competitionId);
      }

      // Refresh competition details before navigating
      await competitionStore.getCompetitionDetails(parseInt(competitionId));

      router.replace({
        pathname: `/Hubs/Competition/TurnOutResult`,
        params: {
          competitionId: competitionId,
        },
      });
    } catch (error) {
      console.error("Failed to complete competition:", error);
      Alert.alert("Error", "Failed to complete competition. Please try again.");
    }
  }, [
    currentParticipant,
    localStore,
    competitionStore,
    userStore.profile.user_id,
    competitionId,
    score,
    router,
  ]);

  const getCompletionPercentage = () => {
    if (!currentQuestion) return 0;

    const answers = competitionStore.participantAnswers.filter(
      (a) => a.question_id === currentQuestion.id
    ).length;

    return Math.floor((answers / activeParticipantsCount) * 100);
  };

  // Show initial loading indicator only during first initialization
  if (isInitializing) {
    return (
      <View
        className={`flex-1 items-center justify-center ${
          isDark ? "bg-dark" : "bg-light"
        }`}
      >
        <Text
          className={`text-center mb-4 ${
            isDark ? "text-offwhite" : "text-dark"
          }`}
        >
          Initializing Competition...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If local data not ready yet and online data also not available, show loading
  if (!isLocalDataReady && (!currentQuestion || competitionStore.isLoading)) {
    return (
      <View
        className={`flex-1 items-center justify-center ${
          isDark ? "bg-dark" : "bg-light"
        }`}
      >
        <Text
          className={`text-center mb-4 ${
            isDark ? "text-offwhite" : "text-dark"
          }`}
        >
          Loading Competition Data...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className={`flex-1 p-4 pt-20 ${isDark ? "bg-dark" : "bg-light"}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-lg ${isDark ? "text-offwhite" : "text-dark"}`}>
          Question {currentQuestionIndex + 1}/
          {isLocalDataReady
            ? localQuestions.length
            : competitionStore.competitionQuestions.length}
        </Text>
        {!waitingForOthers ? (
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="timer-outline"
              size={20}
              color={isDark ? colors.offwhite : colors.dark}
            />
            <Text
              className={`ml-1 font-bold ${
                timeLeft < 10
                  ? "text-error"
                  : isDark
                  ? "text-offwhite"
                  : "text-dark"
              }`}
            >
              {timeLeft}s
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Text className={`${isDark ? "text-offwhite" : "text-dark"}`}>
              Waiting {getCompletionPercentage()}%
            </Text>
          </View>
        )}
      </View>

      {/* Question */}
      <ScrollView className="flex-1 mb-6">
        <View
          className={`p-4 rounded-xl mb-6 ${
            isDark ? "bg-darkLight" : "bg-grayLight"
          }`}
        >
          <Text
            className={`text-xl font-bold ${
              isDark ? "text-offwhite" : "text-dark"
            }`}
          >
            {currentQuestion?.question_text || "Loading question..."}
          </Text>
        </View>

        {/* Answer Options */}
        <View className="space-y-3 mb-6">
          {currentQuestionAnswers.map((answer) => (
            <TouchableOpacity
              key={answer.id}
              className={`p-4 rounded-lg ${
                selectedAnswerId === answer.id
                  ? answer.is_correct
                    ? "bg-success-500"
                    : "bg-error"
                  : isDark
                  ? "bg-darkLight"
                  : "bg-grayLight"
              }`}
              onPress={() =>
                !selectedAnswerId &&
                !waitingForOthers &&
                handleAnswerSelect(answer.id)
              }
              disabled={!!selectedAnswerId || waitingForOthers}
            >
              <Text
                className={
                  selectedAnswerId === answer.id
                    ? "text-white"
                    : isDark
                    ? "text-offwhite"
                    : "text-dark"
                }
              >
                {answer.answer_text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {waitingForOthers && (
          <View className="items-center my-4">
            <Text
              className={`text-center ${
                isDark ? "text-offwhite" : "text-dark"
              }`}
            >
              Waiting for other participants...
            </Text>
            <Text
              className={`text-center text-xs mt-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {questionAnswerCounts[currentQuestion?.id] || 0}/
              {activeParticipantsCount} answered
            </Text>
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: 10 }}
            />
          </View>
        )}

        {!waitingForOthers && (
          <Text
            className={`text-center text-xs mb-4 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Active participants: {activeParticipantsCount}
          </Text>
        )}
      </ScrollView>

      {/* Score Indicator */}
      <View
        className={`p-3 rounded-lg mb-4 ${
          isDark ? "bg-darkLight" : "bg-grayLight"
        }`}
      >
        <Text
          className={`text-center font-bold ${
            isDark ? "text-offwhite" : "text-dark"
          }`}
        >
          Score: {score}/
          {isLocalDataReady
            ? localQuestions.length
            : competitionStore.competitionQuestions.length}
        </Text>
      </View>

      {/* Connection Status Indicator */}
      <View className="absolute bottom-2 right-2">
        <Text
          className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {navigator.onLine ? "Online" : "Offline"}
        </Text>
      </View>
    </View>
  );
};

export default ActiveCompetition;
