import Guidelines from "@/components/NotesUploads/Guidelines";
import UploadButton from "@/components/NotesUploads/UploadButton";
import { colors } from "@/constants/Colors";
import { allowedExtensions } from "@/utils/AllowedExtensions";
import { getPdfPageCount } from "@/utils/getPdfPageCount";
import { getMimeTypeFromName } from "@/utils/NotesUtils";
import { PublicFileOperations } from "@/utils/PublicFileOperations";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "History",
  "Geography",
  "English",
  "Other",
];

const NoteUpload = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  // Form state
  const [noteData, setNoteData] = useState({
    title: "",
    description: "",
    subject: "",
    fileName: "",
    fileType: "",
    fileSize: 0,
    pages: "",
    allowComments: true,
    isAnonymous: false,
    isRealAuthor: false,
    realAuthor: "",
    file: null, // This will now store the complete file object
  });
  const { handleFileUpload, uploading } = PublicFileOperations({
    setFiles: () => {},
  });

  const handleInputChange = (field, value) => {
    setNoteData((prev) => ({ ...prev, [field]: value }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        Alert.alert("Cancelled", "No file was selected.");
        return;
      }

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const fileExt = file.name.split(".").pop().toLowerCase();

      if (!allowedExtensions.includes(fileExt)) {
        Alert.alert(
          "Unsupported File",
          "Only PDF, Word, Excel, Text, or Markdown files are allowed."
        );
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const mimeType = file.mimeType || getMimeTypeFromName(file.name);

      let pageCount = "Unknown";
      if (mimeType === "application/pdf") {
        pageCount = await getPdfPageCount(file.uri);
      }

      // Store the entire file object
      setNoteData((prev) => ({
        ...prev,
        file: file, // Store the complete file object
        fileType: fileExt,
        fileName: file.name,
        fileSize: fileInfo.size ?? 0,
        pages: pageCount,
      }));
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
      console.error(err);
    }
  };

  const removeFile = () => {
    setNoteData((prev) => ({
      ...prev,
      file: null,
      fileType: "",
      fileName: "",
      fileSize: 0,
      pages: "",
    }));
  };

  const handleSubmit = async () => {
    if (!noteData.title || !noteData.subject || !noteData.file) {
      Alert.alert(
        "Missing Information",
        "Please fill all required fields and upload a file"
      );
      return;
    }

    try {
      // Call your upload function, passing all the metadata
      await handleFileUpload({
        title: noteData.title,
        description: noteData.description,
        subject: noteData.subject,
        fileName: noteData.fileName,
        fileType: noteData.fileType,
        fileSize: noteData.fileSize,
        pageCount: parseInt(noteData.pages) || null,
        allowComments: noteData.allowComments,
        isAnonymous: noteData.isAnonymous,
        isRealAuthor: noteData.isRealAuthor,
        realAuthor: noteData.realAuthor,
        file: noteData.file, // Now passing the complete file object
      });

      Alert.alert("Success", "Your notes have been uploaded successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to upload notes. Please try again.");
      console.error(error);
    }
  };

  const getFileIcon = () => {
    if (!noteData.fileType) return "file";

    if (noteData.fileType.includes("pdf")) return "file-pdf-box";
    if (noteData.fileType.includes("word")) return "file-word-box";
    return "file-document";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i]);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      {/* Header */}
      <View
        className="px-6 pt-20 pb-4"
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primary,
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.white }}>
            Contribute Notes
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text className="font-medium" style={{ color: colors.white }}>
                Upload
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* File Upload Section */}
        <View className="mb-6">
          <Text
            className="text-sm mb-3"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Upload Notes File (PDF or DOCX)
          </Text>

          {!noteData.file ? (
            <TouchableOpacity
              className="border-2 border-dashed p-8 rounded-xl items-center justify-center"
              style={{
                borderColor: colors.primary,
                backgroundColor: isDark
                  ? `${colors.primaryDark}20`
                  : `${colors.primary}10`,
              }}
              onPress={pickDocument}
            >
              <MaterialCommunityIcons
                name="cloud-upload"
                size={40}
                color={colors.primary}
              />
              <Text
                className="mt-2 text-center font-medium"
                style={{ color: colors.primary }}
              >
                Tap to select file
              </Text>
              <Text
                className="text-xs mt-1 text-center"
                style={{
                  color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                }}
              >
                Supported formats: PDF, DOC, DOCX
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              className="rounded-xl p-4"
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryDark}80`
                  : colors.white,
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <MaterialCommunityIcons
                    name={getFileIcon()}
                    size={32}
                    color={colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <View className="flex-1">
                    <Text
                      className="font-medium"
                      style={{ color: isDark ? colors.offwhite : colors.dark }}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {noteData.fileName}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        color: isDark
                          ? `${colors.offwhite}80`
                          : `${colors.dark}80`,
                      }}
                    >
                      {formatFileSize(noteData.fileSize)} • {noteData.pages}{" "}
                      pages
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={removeFile}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={isDark ? colors.offwhite : colors.dark}
                  />
                </TouchableOpacity>
              </View>

              {/* Preview placeholder - in a real app you'd show actual preview */}
              <View className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg items-center justify-center">
                <MaterialCommunityIcons
                  name={getFileIcon()}
                  size={48}
                  color={isDark ? colors.offwhite : colors.dark}
                />
                <Text
                  className="mt-2"
                  style={{ color: isDark ? colors.offwhite : colors.dark }}
                >
                  File Preview
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Form Fields */}
        <View className="mb-4">
          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Title *
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="e.g. Calculus Midterm Notes"
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            value={noteData.title}
            onChangeText={(text) => handleInputChange("title", text)}
          />

          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Name Of The Author *
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="e.g. Dr. Kate"
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            value={noteData.realAuthor}
            onChangeText={(text) => handleInputChange("realAuthor", text)}
          />

          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Subject *
          </Text>
          <View className="relative mb-4">
            <TextInput
              className="p-3 rounded-lg"
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryDark}80`
                  : colors.white,
                color: isDark ? colors.offwhite : colors.dark,
              }}
              placeholder="Select subject"
              placeholderTextColor={
                isDark ? `${colors.offwhite}80` : `${colors.dark}80`
              }
              value={noteData.subject}
              onChangeText={(text) => handleInputChange("subject", text)}
            />
            {noteData.subject ? (
              <TouchableOpacity
                className="absolute right-3 top-3"
                onPress={() => handleInputChange("subject", "")}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={isDark ? `${colors.offwhite}80` : `${colors.dark}80`}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="absolute right-3 top-3"
                onPress={() => {
                  // In a real app, you might show a dropdown or modal with subject options
                  handleInputChange("subject", subjects[0]);
                }}
              >
                <MaterialIcons
                  name="arrow-drop-down"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Description
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4 h-24"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
              textAlignVertical: "top",
            }}
            placeholder="Brief description of your notes..."
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            multiline
            value={noteData.description}
            onChangeText={(text) => handleInputChange("description", text)}
          />

          {/* Toggles */}
          <View className="space-y-3">
            <View
              className="flex-row justify-between items-center p-3 rounded-lg"
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryDark}80`
                  : colors.white,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="visibility-off"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  Post Anonymously
                </Text>
              </View>
              <Switch
                value={noteData.isAnonymous}
                onValueChange={(value) =>
                  handleInputChange("isAnonymous", value)
                }
                trackColor={{ false: "#767577", true: colors.primaryLight }}
                thumbColor={noteData.isAnonymous ? colors.primary : "#f4f3f4"}
              />
            </View>

            <View
              className="flex-row justify-between items-center p-3 rounded-lg"
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryDark}80`
                  : colors.white,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="comment"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  Allow Comments
                </Text>
              </View>
              <Switch
                value={noteData.allowComments}
                onValueChange={(value) =>
                  handleInputChange("allowComments", value)
                }
                trackColor={{ false: "#767577", true: colors.primaryLight }}
                thumbColor={noteData.allowComments ? colors.primary : "#f4f3f4"}
              />
            </View>

            <View
              className="flex-row justify-between items-center p-3 rounded-lg"
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryDark}80`
                  : colors.white,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="comment"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  Are You The Author Of this Document
                </Text>
              </View>
              <Switch
                value={noteData.isRealAuthor}
                onValueChange={(value) =>
                  handleInputChange("isRealAuthor", value)
                }
                trackColor={{ false: "#767577", true: colors.primaryLight }}
                thumbColor={noteData.isRealAuthor ? colors.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* Upload Button */}
        <UploadButton
          isUploading={uploading}
          colors={colors}
          handleSubmit={handleSubmit}
        />

        {/* Guidelines */}
        <Guidelines isDark={isDark} colors={colors} />
      </ScrollView>
    </View>
  );
};

export default NoteUpload;
