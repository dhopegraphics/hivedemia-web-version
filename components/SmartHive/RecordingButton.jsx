import { TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";

const RecordingButton = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  isDark,
}) => {
  if (!isRecording) {
    return (
      <TouchableOpacity
        onPress={onStartRecording}
        style={{
          position: "absolute",
          right: 16,
          bottom: 80,
          backgroundColor: isDark ? colors.darkLight : "#f3f4f6",
          padding: 12,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.primary,
        }}
      >
        <FontAwesome name="microphone" size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onStopRecording}
      style={{
        position: "absolute",
        left: 16,
        bottom: 80,
        backgroundColor: "#ef4444",
        padding: 12,
        borderRadius: 20,
      }}
    >
      <FontAwesome name="stop" size={20} color="white" />
      <View
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          width: 12,
          height: 12,
          backgroundColor: "#ef4444",
          borderRadius: 6,
        }}
      />
    </TouchableOpacity>
  );
};

export default RecordingButton;
