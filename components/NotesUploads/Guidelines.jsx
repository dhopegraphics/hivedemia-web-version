import { View, Text } from "react-native";

const Guidelines = ({ isDark, colors }) => {
  return (
    <View>
      <View
        className="mt-6 p-4 rounded-lg"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : `${colors.primary}20`,
        }}
      >
        <Text className="font-bold mb-2" style={{ color: colors.primary }}>
          Contribution Guidelines
        </Text>
        <View className="space-y-1">
          <View className="flex-row">
            <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
              •{" "}
            </Text>
            <Text
              style={{ color: isDark ? colors.offwhite : colors.dark, flex: 1 }}
            >
              Only upload original content or content you have permission to
              share
            </Text>
          </View>
          <View className="flex-row">
            <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
              •{" "}
            </Text>
            <Text
              style={{ color: isDark ? colors.offwhite : colors.dark, flex: 1 }}
            >
              Ensure notes are clear, organized, and relevant to the subject
            </Text>
          </View>
          <View className="flex-row">
            <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
              •{" "}
            </Text>
            <Text
              style={{ color: isDark ? colors.offwhite : colors.dark, flex: 1 }}
            >
              Include a descriptive title and subject for better discoverability
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Guidelines;
