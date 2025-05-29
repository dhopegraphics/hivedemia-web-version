import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { colors } from "../constants/Colors";

const SettingsItem = ({
  icon,
  label,
  value,
  onPress,
  rightComponent,
  isDark,
  isRed = false,
}) => {
  return (
    <TouchableOpacity
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className={`flex-row items-center justify-between px-6 py-4 `}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row items-center">
        <MaterialIcons
          name={icon}
          size={24}
          color={isRed ? "#EF4444" : isDark ? "#fff" : "#4B5563"}
          className="mr-3"
        />
        <Text
          className={`${
            isRed ? "text-red-500" : isDark ? "text-white" : "text-gray-700"
          }`}
        >
          {label}
        </Text>
      </View>

      <View className="flex-row items-center">
        {value && (
          <Text
            className={`mr-2 ${isDark ? "text-white" : "text-gray-500"}`}
          >
            {value}
          </Text>
        )}
        {rightComponent ? (
          rightComponent
        ) : (
          <Feather
            name="chevron-right"
            size={20}
            color={isDark ? "#fff" : "#6B7280"}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default SettingsItem;
