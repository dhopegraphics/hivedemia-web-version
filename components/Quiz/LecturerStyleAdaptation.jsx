import { View, Text, TouchableOpacity, Switch } from "react-native";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { colors } from "@/constants/Colors";

const LecturerStyleAdaptation = ({
  lecturerStyleEnabled,
  setLecturerStyleEnabled,
  selectedLecturerFiles,
  setSelectedLecturerFiles,
}) => {
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
        setSelectedLecturerFiles(result.assets);
      }
    } catch (err) {
      console.error("Document picker error:", err);
    }
  };

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className="text-lg font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Lecturer Style Adaptation
        </Text>
        <Switch
          value={lecturerStyleEnabled}
          onValueChange={setLecturerStyleEnabled}
          trackColor={{
            false: isDark ? colors.primaryDark : "#cccccc",
            true: colors.primary,
          }}
          thumbColor={colors.white}
        />
      </View>

      {lecturerStyleEnabled &&
        (selectedLecturerFiles.length > 0 ? (
          <View>
            <Text
              className="mb-4"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              File containing the questions from your lecturer Selected
            </Text>
            {selectedLecturerFiles.map((file, index) => (
              <View
                key={index}
                className="rounded-xl flex-row items-center mb-2 p-4"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}80`
                    : `${colors.primary}10`,
                }}
              >
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
                    setSelectedLecturerFiles((prev) =>
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
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : `${colors.primary}10`,
            }}
          >
            <Text
              className="mb-4"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Upload sample questions from your lecturer to adapt the quiz style
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-center py-3 rounded-lg border-2 border-dashed"
              style={{ borderColor: colors.primary }}
              onPress={handleFileUpload}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                className="ml-2 font-medium"
                style={{ color: colors.primary }}
              >
                Upload Sample Questions
              </Text>
            </TouchableOpacity>
          </View>
        ))}
    </View>
  );
};

export default LecturerStyleAdaptation;
