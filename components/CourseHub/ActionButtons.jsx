import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAIAssistantStore } from "@/backend/store/aiAssistantStore";

const ActionButtons = ({
  handleFileUpload,
  isDark,
  colors,
  courseTitle,
  courseFiles,
  courseCode,
  courseProfessor,
  courseDescription,
}) => {
  const { showAssistant } = useAIAssistantStore();
  const parsedFiles = courseFiles.map((file) => ({
    name: file.name,
    type: file.type,
  }));
  const context = `I can help you with your ${courseTitle} . What would you like to
   know? or what should i do with your course and files`;
  const courseFilesMessage = ` this is a course and course files  
  related to ${courseTitle} .  
  the user want make enquiry about the entire 
  course plus the files it has added,  so act brilliant and  behave like a 
  course assistant and help the user with the course and files he has added. 
   the files are as follows: ${parsedFiles} 
   behave as if you have access to all the files and the content of the course. the course
    code is ${courseCode} and the course professor is ${courseProfessor} and the course description is ${courseDescription} .
  the user is asking about the course and files he has added.  so act like a course assistant and help the user with the course and files he has added.`;

  const HandleAiChatCourseRelated = () => {
    showAssistant({
      context,
      originalSolution: courseFilesMessage,
    });
  };
  return (
    <View className="flex-row justify-between mb-6">
      <TouchableOpacity
        className="p-3 rounded-lg flex-row items-center"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : `${colors.primary}20`,
          width: "48%",
        }}
        onPress={handleFileUpload}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={20}
          color={colors.primary}
        />
        <Text className="ml-2" style={{ color: colors.primary }}>
          Upload File
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="p-3 rounded-lg flex-row items-center"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : `${colors.primary}20`,
          width: "48%",
        }}
        onPress={HandleAiChatCourseRelated}
      >
        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
        <Text className="ml-2" style={{ color: colors.primary }}>
          Chat with AI
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionButtons;
