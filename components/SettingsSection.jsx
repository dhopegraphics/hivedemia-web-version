import { View, Text } from "react-native";
import { colors } from "../constants/Colors";

const SettingsSection = ({ title, children, isDark }) => {
  return (
    <View 
    style={{ backgroundColor: isDark ? colors.primaryDark : colors.white }}
    className={`mt-4`}>
      <Text
        className={`px-6 py-3 text-sm font-medium ${
          isDark ? "text-white" : "text-gray-500"
        }`}
      >
        {title}
      </Text>
      <View
        style={{ backgroundColor: isDark ? "#2CC295" : "#FFFFFF" }}
        className={`border-t `}
      >
        {children}
      </View>
    </View>
  );
};

export default SettingsSection;
