import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const RecentActivity = ({ colors, isDark, recentActivities }) => {
  return (
    <View className="px-6 mt-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className="text-xl font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Recent Activity
        </Text>
        <TouchableOpacity>
          <Text style={{ color: colors.primary }}>See All</Text>
        </TouchableOpacity>
      </View>
      <View className="mb-20">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={recentActivities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="rounded-2xl p-4 mb-4 mr-3 w-40 shadow-sm"
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryDark}80`
                  : `${colors.light}`,
              }}
              onPress={() =>
                router.push(item.type === "quiz" ? "/quiz-results" : "/hub")
              }
            >
              <View
                className="p-3 rounded-full w-12 h-12 items-center justify-center mb-3"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primary}20`
                    : `${colors.primary}10`,
                }}
              >
                {item.type === "quiz" ? (
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.primary}
                  />
                ) : item.type === "hub" ? (
                  <Ionicons
                    name="library-outline"
                    size={20}
                    color={colors.primary}
                  />
                ) : (
                  <Ionicons
                    name="help-circle-outline"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </View>
              <Text
                className="font-medium mb-1"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.score && (
                <Text className="text-sm" style={{ color: colors.primary }}>
                  {item.score}
                </Text>
              )}
            </TouchableOpacity>
          )}
           initialNumToRender={10}
      maxToRenderPerBatch={10}
        />
      </View>
    </View>
  );
};

export default RecentActivity;
