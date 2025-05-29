import { View, Text , TouchableOpacity ,  } from 'react-native'
import React from 'react'
import { MaterialCommunityIcons , Ionicons , FontAwesome5 , Feather } from '@expo/vector-icons'
import { router  } from 'expo-router'

const QuickHomeActionsCard = ({colors , isDark , }) => {
  return (
    <View className="px-6 mt-6">
    <Text
      className="text-xl font-bold mb-4"
      style={{ color: isDark ? colors.offwhite : colors.dark }}
    >
      Quick Actions
    </Text>
    <View className="flex-row justify-between mb-6">
      <TouchableOpacity
        className="p-4 rounded-2xl w-[48%] items-center"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : `${colors.primary}20`,
        }}
        onPress={() => router.push("/SmartHiveAi/SmartHiveChatScreen")}
      >
        <View
          className="p-3 rounded-full mb-2"
          style={{
            backgroundColor: isDark
              ? `${colors.primary}30`
              : `${colors.primary}20`,
          }}
        >
          <FontAwesome5 name="robot" size={24} color={colors.primaryLight} />
        </View>
        <Text
          className="font-medium text-center"
          style={{ color: isDark ? colors.primaryLight : colors.primaryDark }}
        >
          Generate Custom Quiz
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="p-4 rounded-2xl w-[48%] items-center"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryLight}40`
            : `${colors.primaryLight}20`,
        }}
        onPress={() => router.push("/SnapSolution/SnapSolve")}
      >
        <View
          className="p-3 rounded-full mb-2"
          style={{
            backgroundColor: isDark
              ? `${colors.primaryLight}30`
              : `${colors.primaryLight}20`,
          }}
        >
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={24}
            color={colors.primaryLight}
          />
        </View>
        <Text
          className="font-medium text-center"
          style={{
            color: isDark ? colors.primaryLight : colors.primaryDark,
          }}
        >
          Help Me Solve a Problem
        </Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      className="p-4 rounded-2xl flex-row items-center justify-between"
      style={{
        backgroundColor: isDark
          ? `${colors.primary}30`
          : `${colors.primary}20`,
      }}
      onPress={() => router.push("/TopicQuizzes/QuizOnTopic")}
    >
      <View className="flex-row items-center">
        <View
          className="p-3 rounded-full mr-3"
          style={{
            backgroundColor: isDark
              ? `${colors.primary}40`
              : `${colors.primary}30`,
          }}
        >
          <Ionicons
            name="library-outline"
            size={24}
            color={colors.primary}
          />
        </View>
        <Text
          className="font-medium"
          style={{ color: isDark ? colors.primary : colors.primaryDark }}
        >
          Browse Topic Quizzes
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.primary} />
    </TouchableOpacity>
  </View>
  )
}

export default QuickHomeActionsCard