import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { useCompetitionStore } from '../../backend/store/useCompetitionStore'
import { useUserStore } from '../../backend/store/useUserStore'

const ExamsModeTab = ({isDark, colors}) => {
  const [invitedCompetitions, setInvitedCompetitions] = React.useState([]);
  const { fetchInvitedCompetitions } = useCompetitionStore();
  const { profile: user } = useUserStore(); 

  React.useEffect(() => {
    const loadInvitedCompetitions = async () => {
      if (user?.user_id) {
        const competitions = await fetchInvitedCompetitions(user.user_id);
        setInvitedCompetitions(competitions);
      }
    };
    
    loadInvitedCompetitions();
  }, [user?.user_id , fetchInvitedCompetitions]);

  return (
    <View>
      <Text
        className="text-lg font-bold mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Exam Preparation
      </Text>

      <View className="flex-row justify-between mb-6">
        <TouchableOpacity
          className="p-4 rounded-xl items-center"
          style={{
            backgroundColor: isDark
              ? `${colors.primaryDark}80`
              : `${colors.primary}20`,
            width: "48%",
          }}
          onPress={() => router.push("/Hubs/Exams/create")}
        >
          <MaterialCommunityIcons
            name="timer"
            size={28}
            color={colors.primary}
          />
          <Text
            className="mt-2 font-medium text-center"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Create Custom Exam
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-4 rounded-xl items-center"
          style={{
            backgroundColor: isDark
              ? `${colors.primaryDark}80`
              : `${colors.primary}20`,
            width: "48%",
          }}
          onPress={() => router.push("/Hubs/Competition")}
        >
          <FontAwesome5 name="trophy" size={24} color={colors.primary} />
          <Text
            className="mt-2 font-medium text-center"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Start Competition
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        className="text-lg font-bold mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Competition Invitations
      </Text>

      {invitedCompetitions.length === 0 ? (
        <View 
          className="rounded-xl p-6 mb-4 items-center justify-center"
          style={{
            backgroundColor: isDark ? `${colors.primaryDark}80` : colors.white,
          }}
        >
          <FontAwesome5 
            name="inbox" 
            size={32} 
            color={isDark ? `${colors.offwhite}80` : `${colors.dark}80`}
          />
          <Text
            className="text-center mt-3 text-base"
            style={{
              color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
            }}
          >
            No competition invitations yet
          </Text>
          <Text
            className="text-center mt-1 text-sm"
            style={{
              color: isDark ? `${colors.offwhite}60` : `${colors.dark}60`,
            }}
          >
            When someone invites you to a competition, it will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={invitedCompetitions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="rounded-xl p-4 mb-4"
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryDark}80`
                  : colors.white,
              }}
              onPress={() => router.push(`/Hubs/Competition/waiting-room?competitionId=${item.id}&preloaded=true`)}
            >
              <Text
                className="font-bold mb-1"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                {item.title}
              </Text>
              <Text
                className="mb-2"
                style={{
                  color: isDark
                    ? `${colors.offwhite}80`
                    : `${colors.dark}80`,
                }}
              >
                {item.subject} • {item.questions} questions •{" "}
                {item.duration}
              </Text>
              <View className="flex-row justify-between items-center">
                <Text
                  style={{
                    color: isDark
                      ? `${colors.offwhite}80`
                      : `${colors.dark}80`,
                  }}
                >
                  Created by: {item.createdBy?.username || "Unknown"}
                </Text>
                <TouchableOpacity
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push({
                      pathname: `/Hubs/Competition/waiting-room`,
                      params: {
                        competitionId: item.id,
                        preloaded: "true",
                      },
                    });
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{ color: colors.white }}
                  >
                    Accept
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

export default ExamsModeTab