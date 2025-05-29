import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ChatHeader = () => {
  return (
    <View className="bg-white px-4 py-3 border-b border-gray-200">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity className="p-2">
          <Ionicons name="arrow-back" size={24} className="text-gray-800" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-lg font-semibold text-gray-900">
            Smart Hive AI
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            <Text className="text-xs text-gray-500">Online</Text>
          </View>
        </View>
        <View className="w-8" /> {/* Spacer for balance */}
      </View>
    </View>
  );
};

export default ChatHeader;
