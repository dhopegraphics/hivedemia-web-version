import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";


export default function GenerateQuizScreen() {
  const router = useRouter();
  const { fileName, fileUrl, ai = "chatgpt" } = useLocalSearchParams();

  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);


  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-4">Generating Quiz from: {fileName}</Text>
      {status === "loading" && <Text>Preparing...</Text>}
      {status === "uploading" && <ActivityIndicator />}
      {status === "done" && (
        <Text className="mt-4">
          Result: {JSON.stringify(result, null, 2)}
        </Text>
      )}
      {status === "error" && <Text className="text-red-500">Something went wrong.</Text>}
    </View>
  );
}