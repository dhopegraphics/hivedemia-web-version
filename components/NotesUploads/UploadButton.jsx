import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const UploadButton = ({ isUploading, colors, handleSubmit }) => {
  return (
    <View>
      <TouchableOpacity
        className="p-4 rounded-lg items-center mt-6 flex-row justify-center"
        style={{ backgroundColor: colors.primary }}
        onPress={handleSubmit}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <ActivityIndicator size="small" color={colors.white} />
            <Text className="ml-2 font-bold" style={{ color: colors.white }}>
              Uploading...
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload" size={20} color={colors.white} />
            <Text className="ml-2 font-bold" style={{ color: colors.white }}>
              Upload Notes
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UploadButton;
