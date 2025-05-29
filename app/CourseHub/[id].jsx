import ActionButtons from "@/components/CourseHub/ActionButtons";
import FilesUploadPlusPreview from "@/components/CourseHub/FilesUploadPlusPreview";
import InCourseTopicQuizzes from "@/components/CourseHub/InCourseTopicQuizzes";
import InHistoryPreview from "@/components/CourseHub/InHistoryPreview";
import AIAssistant from "@/components/SmartHive/AIAssistant";
import { colors } from "@/constants/Colors";
import { useDeleteCourse } from "@/utils/useDeleteCourse";
import { useFileOperations } from "@/utils/useFileOperations";
import { useLoadFiles } from "@/utils/useLoadFiles";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CourseHubDetail() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const {
    id,
    courseTitle,
    courseCode,
    courseProfessor,
    courseDescription,
    courseColor,
    courseIcon,
  } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("files");
  const [files, setFiles] = useState([]);

  useLoadFiles({ id, setFiles });
  const {
    uploading,
    uploadProgress,
    progressMode,
    handleFileUpload,
    handleFileDelete,
  } = useFileOperations({ id, setFiles });

  const fileNames = files.map((file) => file.name);

  const handleCourseDelete = useDeleteCourse({ id, fileNames });

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      {/* Header */}
      <View
        className="px-6 pt-20 pb-4"
        style={{ backgroundColor: isDark ? colors.primaryDark : courseColor }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCourseDelete}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-4">
          <MaterialIcons
            name={courseIcon}
            size={32}
            color={colors.white}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text
              className="text-2xl font-bold"
              style={{ color: colors.white }}
            >
              {courseTitle}
            </Text>
            <Text className="text-white/90">{courseCode}</Text>
          </View>
        </View>
        <Text className="mt-4 text-sm text-gray dark:text-offwhite">
          Accepted file types: PDF, Word, Excel, PowerPoint, Text, Markdown.
        </Text>

        {/* Tabs */}
        <View className="flex-row justify-between mt-4">
          {["files", "quizzes", "history"].map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`pb-2 ${activeTab === tab ? "border-b-2" : ""}`}
              style={{
                borderColor: activeTab === tab ? colors.white : "transparent",
                width: "32%",
                alignItems: "center",
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text className="font-medium" style={{ color: colors.white }}>
                {tab === "files"
                  ? "Files"
                  : tab === "quizzes"
                  ? "Quizzes"
                  : "History"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Course Info */}
        <View
          className="mb-6 p-4 rounded-xl"
          style={{
            backgroundColor: isDark ? `${colors.primaryDark}80` : colors.white,
          }}
        >
          <Text
            className="text-sm mb-1"
            style={{
              color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
            }}
          >
            Professor: {courseProfessor}
          </Text>
          <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
            {courseDescription}
          </Text>
        </View>

        {/* Upload Button */}
        <ActionButtons
          isDark={isDark}
          colors={colors}
          handleFileUpload={handleFileUpload}
          courseTitle={courseTitle}
          courseCode={courseCode}
          courseProfessor={courseProfessor}
          courseDescription={courseDescription}
          courseFiles={files}
        />

        {uploading && (
          <View className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-xl h-3 overflow-hidden">
            <View
              className={`h-full ${
                progressMode === "upload" ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${uploadProgress}%` }}
            />
          </View>
        )}
        {/* Tab Views */}
        {activeTab === "files" && (
          <FilesUploadPlusPreview
            isDark={isDark}
            colors={colors}
            files={files}
            onDelete={handleFileDelete}
            courseId={id}
          />
        )}
        {activeTab === "quizzes" && (
          <InCourseTopicQuizzes
            isDark={isDark}
            colors={colors}
            files={files}
            courseId={id}
          />
        )}
        {activeTab === "history" && (
          <InHistoryPreview isDark={isDark} colors={colors} />
        )}
      </ScrollView>
      <AIAssistant />
    </View>
  );
}
