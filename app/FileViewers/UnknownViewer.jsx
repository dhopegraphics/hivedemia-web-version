import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function UnknownViewer() {
  const { fileTitle } = useLocalSearchParams();
  return (
    <View className="flex-1 justify-center items-center">
      <Text>Cannot preview file:</Text>
      <Text className="text-lg font-bold mt-2">{fileTitle}</Text>
    </View>
  );
}