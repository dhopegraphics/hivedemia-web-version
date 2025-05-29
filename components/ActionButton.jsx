import { MaterialIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

const ActionButton = ({
  icon,
  label,
  onPress,
  isDark,
  isRed = false,
  className = "",
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-center py-3 rounded-lg ${
        isRed ? "bg-red-100" : isDark ? "bg-gray-700" : "bg-gray-100"
      } ${className}`}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={isRed ? "#EF4444" : isDark ? "#D1D5DB" : "#4B5563"}
        className="mr-2"
      />
      <Text
        className={`font-medium ${
          isRed ? "text-red-600" : isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ActionButton;
