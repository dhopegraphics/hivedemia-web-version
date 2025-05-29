import { View, Text, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

const ConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-6">
        <View
          className={`w-full rounded-xl p-6 ${
            isDark ? "bg-offwhite" : "bg-white"
          }`}
        >
          {/* Header */}
          <View className="items-center mb-4">
            <MaterialIcons
              name="warning"
              size={32}
              color={isDestructive ? "#EF4444" : isDark ? "#D1D5DB" : "#4B5563"}
              className="mb-2"
            />
            <Text
              className={`text-xl font-bold text-center ${
                isDark ? "text-dark" : "text-gray-900"
              }`}
            >
              {title}
            </Text>
            <Text
              className={`text-center mt-2 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {description}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mt-6">
            <TouchableOpacity
              onPress={onClose}
              className={`flex-1 py-3 rounded-lg mr-2 ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className={`flex-1 py-3 rounded-lg ml-2 ${
                isDestructive ? "bg-red-500" : "bg-green-500"
              }`}
            >
              <Text className="text-center font-medium text-white">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;
