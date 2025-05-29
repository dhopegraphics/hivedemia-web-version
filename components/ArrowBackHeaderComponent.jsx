import { View, Text, TouchableOpacity } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const ArrowBackHeaderComponent = ({
  isDark,
  colors,
  headerName = "",
  optionsPreview = false,
}) => {
  return (
    <View className="pt-8 mb-6 px-4">
      <View className="flex-row justify-start  items-center mb-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View>
          <Text className=" ml-12 dark:text-white  text-2xl font-JakartaBold">
            {headerName}
          </Text>
        </View>
        {optionsPreview && (
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ArrowBackHeaderComponent;
