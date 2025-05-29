import { View, Text, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { colors } from "@/constants/Colors";

const SourceMaterial = ({ selectedFiles, setSelectedFiles }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "text/plain",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        multiple: true,
      });

      if (!result.canceled) {
        setSelectedFiles(result.assets);
      }
    } catch (err) {
      console.error("Document picker error:", err);
    }
  };

  return (
    <View className="mb-8">
      <Text
        className="text-lg font-bold mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Source Material
      </Text>
      <View
        className="rounded-xl p-4"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : `${colors.primary}10`,
        }}
      >
        {selectedFiles.length > 0 ? (
          <View>
            <Text
              className="mb-2"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Selected files ({selectedFiles.length}):
            </Text>
            {selectedFiles.map((file, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  className="ml-2 flex-1"
                  style={{
                    color: isDark ? colors.offwhite : colors.dark,
                  }}
                >
                  {file.name}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  <Ionicons name="close" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text
            className="mb-2"
            style={{
              color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
            }}
          >
            No files selected
          </Text>
        )}
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 rounded-lg mt-2"
          style={{
            backgroundColor: isDark ? colors.primaryDark : colors.primary,
          }}
          onPress={handleFileUpload}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={20}
            color={colors.white}
          />
          <Text className="ml-2 font-medium" style={{ color: colors.white }}>
            {selectedFiles.length ? "Add More Files" : "Upload Files"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SourceMaterial;
