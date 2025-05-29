import router from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const InHistoryPreview = ({ colors, isDark }) => {
  const history = [
    {
      id: 1,
      title: "Midterm Review Quiz",
      score: "85%",
      date: "2023-10-18",
    },
    {
      id: 2,
      title: "Chapter 1-3 Quiz",
      score: "92%",
      date: "2023-09-28",
    },
  ];
  return (
    <View>
      <Text
        className="text-lg font-bold mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Quiz History
      </Text>

      <FlatList
        scrollEnabled={false}
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="p-4 rounded-xl mb-3"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
            }}
            onPress={() => router.push(`/quiz/results/${item.id}`)}
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text
                  className="font-medium mb-1"
                  style={{ color: isDark ? colors.offwhite : colors.dark }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                  }}
                >
                  {item.date}
                </Text>
              </View>
              <View className="bg-primary px-3 py-1 rounded-full">
                <Text className="font-medium" style={{ color: colors.white }}>
                  {item.score}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default InHistoryPreview;
