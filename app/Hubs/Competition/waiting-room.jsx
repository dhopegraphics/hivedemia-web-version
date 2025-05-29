import { useCompetitionStore } from "@/backend/store/useCompetitionStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import { colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const WaitingRoom = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { competitionId } = useLocalSearchParams();
  const router = useRouter();
  const competitionStore = useCompetitionStore();
  const userStore = useUserStore();

  const allReady = competitionStore.competitionParticipants.every(
    (p) => p.has_joined
  );
  const enoughParticipants =
    competitionStore.competitionParticipants.length >= 2;

  // Find the current participant
  const currentParticipant = competitionStore.competitionParticipants.find(
    (p) => p.user_id === userStore.profile.user_id
  );

  useEffect(() => {
    const loadCompetition = async () => {
      if (!competitionId || !userStore.profile.user_id) return;

      try {
        await competitionStore.getCompetitionDetails(Number(competitionId));
        const participantId = await competitionStore.ensureParticipantJoined(
          userStore.profile.user_id,
          Number(competitionId)
        );

        // Set hasJoined to true when component mounts
        if (participantId) {
          await competitionStore.updateParticipantStatus({
            participantId,
            hasJoined: true,
          });
        }

        // Subscribe to competition updates
        competitionStore.subscribeToCompetitionUpdates(Number(competitionId));
      } catch (err) {
        console.error("Error initializing competition:", err);
      }
    };

    loadCompetition();

    return () => {
      // Cleanup function - set hasJoined to false when component unmounts
      const cleanup = async () => {
        if (currentParticipant?.id) {
          try {
            await competitionStore.updateParticipantStatus({
              participantId: currentParticipant.id,
              hasJoined: false,
            });
          } catch (err) {
            console.error("Error updating participant status on unmount:", err);
          }
        }
        competitionStore.cleanupSubscriptions();
      };
      cleanup();
    };
  }, [competitionId, userStore.profile.user_id , competitionStore, currentParticipant]);

  // Add this effect to handle status changes
  useEffect(() => {
    if (competitionStore.currentCompetition?.status === "active") {
      // Redirect ALL participants when competition becomes active
      router.push({
        pathname: `/Hubs/Competition/ActiveCompetition`,
        params: { competitionId },
      });
    }
  }, [competitionStore.currentCompetition?.status , competitionId, router]);

  const isParticipant = competitionStore.competitionParticipants.some(
    (p) => p.user_id === userStore.profile.user_id
  );


  const handleStartCompetition = useCallback(async () => {
    try {
      await competitionStore.updateCompetitionStatus(
        Number(competitionId),
        "active"
      );
      // Update competition status to 'active' and set start time
      const { error } = await supabase
        .from("competitions")
        .update({
          status: "active",
          started_at: new Date().toISOString(),
        })
        .eq("id", competitionId);

      if (error) throw error;

      // Navigate to active competition
      router.push({
        pathname: `/Hubs/Competition/ActiveCompetition`,
        params: {
          competitionId: competitionId,
        },
      });
    } catch (error) {
      console.error("Failed to start competition:", error);
    }
  }, [competitionId, competitionStore, router]);

  useEffect(() => {
    const tryAutoJoin = async () => {
      if (
        competitionId &&
        competitionStore.currentCompetition &&
        !competitionStore.currentCompetition.is_private &&
        !competitionStore.competitionParticipants.some(
          (p) => p.user_id === userStore.profile.user_id
        )
      ) {
        await supabase.from("competition_participants").insert({
          user_id: userStore.profile.user_id,
          is_invited: false,
          has_joined: true,
          competition_id: Number(competitionId),
        });
        competitionStore.getCompetitionDetails(Number(competitionId)); // refresh
      }
    };

    tryAutoJoin();
  }, [competitionStore.currentCompetition, competitionId , userStore.profile.user_id, competitionStore]);

  // Check if current user is the creator
  const isCreator =
    competitionStore.currentCompetition?.created_by ===
    userStore.profile.user_id;

  useEffect(() => {
    if (
      isCreator &&
      competitionStore.currentCompetition?.status === "waiting" &&
      competitionStore.competitionParticipants.length > 1 &&
      competitionStore.competitionParticipants.every((p) => p.has_joined)
    ) {
      handleStartCompetition();
    }
  }, [competitionStore.competitionParticipants , isCreator, competitionStore.currentCompetition?.status, handleStartCompetition]);
  return (
    <View className={`flex-1 pt-20 p-4 ${isDark ? "bg-dark" : "bg-light"}`}>
      {/* Header */}
      <View className="mb-6">
        <Text
          className={`text-2xl font-bold mb-2 ${
            isDark ? "text-offwhite" : "text-dark"
          }`}
        >
          {competitionStore.currentCompetition?.title}
        </Text>
        <Text className={`text-lg ${isDark ? "text-offwhite" : "text-dark"}`}>
          {isParticipant
            ? "Get ready! Waiting for others..."
            : "You're not a participant in this competition."}
        </Text>
      </View>

      {/* Competition Info */}
      <View
        className={`p-4 rounded-xl mb-6 ${
          isDark ? "bg-darkLight" : "bg-grayLight"
        }`}
      >
        <View className="flex-row justify-between mb-2">
          <Text className={`${isDark ? "text-offwhite" : "text-dark"}`}>
            Subject:
          </Text>
          <Text
            className={`font-medium ${isDark ? "text-offwhite" : "text-dark"}`}
          >
            {competitionStore.currentCompetition?.subject}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className={`${isDark ? "text-offwhite" : "text-dark"}`}>
            Questions:
          </Text>
          <Text
            className={`font-medium ${isDark ? "text-offwhite" : "text-dark"}`}
          >
            {competitionStore.currentCompetition?.question_count}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className={`${isDark ? "text-offwhite" : "text-dark"}`}>
            Difficulty:
          </Text>
          <Text
            className={`font-medium capitalize ${
              isDark ? "text-offwhite" : "text-dark"
            }`}
          >
            {competitionStore.currentCompetition?.difficulty}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className={`${isDark ? "text-offwhite" : "text-dark"}`}>
            Status:
          </Text>
          <Text
            className={`font-medium ${
              isDark ? "text-primary" : "text-primaryDark"
            }`}
          >
            {competitionStore.currentCompetition?.status}
          </Text>
        </View>
      </View>

      {/* Participants List */}
      <View className="flex-1 mb-6">
        <Text
          className={`text-lg font-bold mb-3 ${
            isDark ? "text-offwhite" : "text-dark"
          }`}
        >
          Participants ({competitionStore.competitionParticipants.length})
        </Text>

        {competitionStore.isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={competitionStore.competitionParticipants}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View
                className={`flex-row items-center p-3 mb-2 rounded-lg ${
                  isDark ? "bg-darkLight" : "bg-grayLight"
                }`}
              >
                <View
                  className={`h-10 w-10 rounded-full mr-3 items-center justify-center ${
                    item.has_joined ? "bg-success" : "bg-warning"
                  }`}
                >
                  <Text className="text-white font-bold">
                    {item.profiles?.full_name?.charAt(0) ||
                      item.profiles?.username?.charAt(0) ||
                      "?"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-medium ${
                      isDark ? "text-offwhite" : "text-dark"
                    }`}
                  >
                    {item.profiles?.full_name || item.profiles?.username}
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? "text-offwhite/70" : "text-dark/70"
                    }`}
                  >
                    {item.has_joined ? "Ready" : "Waiting..."}
                  </Text>
                </View>
                {item.user_id ===
                  competitionStore.currentCompetition?.created_by && (
                  <Ionicons name="ribbon" size={20} color={colors.primary} />
                )}
              </View>
            )}
                      initialNumToRender={10}
          maxToRenderPerBatch={10}
            ListEmptyComponent={
              <Text
                className={`text-center mt-4 ${
                  isDark ? "text-offwhite/70" : "text-dark/70"
                }`}
              >
                No participants yet
              </Text>
            }
          />
        )}
      </View>

      {/* Action Buttons */}
      {isCreator && (
        <View className="space-y-3">
          <TouchableOpacity
            className={`py-3 rounded-xl items-center justify-center ${
              isDark ? "bg-primaryDark" : "bg-primary"
            }`}
            onPress={handleStartCompetition}
            disabled={competitionStore.isLoading}
          >
            {competitionStore.isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text className="text-white font-bold text-lg">
                Start Competition
              </Text>
            )}
          </TouchableOpacity>

          {!competitionStore.currentCompetition?.is_private && (
            <TouchableOpacity
              className={`py-3 rounded-xl items-center justify-center border ${
                isDark ? "border-primaryDark" : "border-primary"
              }`}
              onPress={handleStartCompetition}
              disabled={
                !allReady || !enoughParticipants || competitionStore.isLoading
              }
            >
              <Text
                className={`font-bold text-lg ${
                  isDark ? "text-primaryDark" : "text-primary"
                }`}
              >
                Start Now (Skip Waiting)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default WaitingRoom;
