// components/FilesUploadPlusPreview.tsx
import {
  AIAction,
  DocumentItem,
  hasExtractedTopics,
  ProcessingStatus,
  useAIDocumentProcessor,
  useBatchDocumentProcessor,
  useTopicExtraction
} from "@/backend/store/useAIDocumentProcessor";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";



interface FilesUploadPlusPreviewProps {
  colors: any;
  isDark: boolean;
  files: DocumentItem[];
  onDelete?: (id: string | number, filePath: string, name: string) => void;
  courseId: string;
  enableAutoTopicExtraction?: boolean;
  showAIActions?: boolean;
}

interface AIActionModalProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: AIAction, customMessage?: string) => void;
  fileName: string;
  isDark: boolean;
  colors: any;
}

const AIActionModal: React.FC<AIActionModalProps> = ({ 
  visible, 
  onClose, 
  onAction, 
  fileName, 
  isDark, 
  colors 
}) => {
  const [customMessage, setCustomMessage] = useState("");
  const [selectedAction, setSelectedAction] = useState<AIAction>("extract_topics");

  const actions: { key: AIAction; label: string; description: string; icon: string }[] = [
    {
      key: "extract_topics",
      label: "Extract Topics",
      description: "Extract key topics and concepts from the document",
      icon: "list-outline"
    },
    {
      key: "analyze_document",
      label: "Analyze Document",
      description: "Get comprehensive analysis and insights",
      icon: "analytics-outline"
    },
    {
      key: "generate_quiz",
      label: "Generate Quiz",
      description: "Create quiz questions based on content",
      icon: "help-circle-outline"
    },
    {
      key: "summarize",
      label: "Summarize",
      description: "Get a concise summary of the document",
      icon: "document-text-outline"
    }
  ];

  const handleAction = () => {
    onAction(selectedAction, customMessage.trim() || undefined);
    setCustomMessage("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View 
        className="flex-1 p-6"
        style={{ backgroundColor: isDark ? colors.dark : colors.offwhite }}
      >
        <Text 
          className="text-xl font-bold mb-2"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          AI Actions
        </Text>
        <Text 
          className="text-sm mb-6"
          style={{ color: isDark ? `${colors.offwhite}80` : `${colors.dark}80` }}
        >
          Choose an action for: {fileName}
        </Text>

        <ScrollView className="flex-1">
          {actions.map((action) => (
            <TouchableOpacity
              key={action.key}
              className={`p-4 rounded-xl mb-3 flex-row items-center ${
                selectedAction === action.key ? 'border-2' : 'border'
              }`}
              style={{
                backgroundColor: isDark ? `${colors.primaryDark}40` : colors.white,
                borderColor: selectedAction === action.key ? colors.primary : (isDark ? `${colors.primaryDark}80` : `${colors.dark}20`),
              }}
              onPress={() => setSelectedAction(action.key)}
            >
              <Ionicons
                name={action.icon as any}
                size={24}
                color={selectedAction === action.key ? colors.primary : (isDark ? colors.offwhite : colors.dark)}
                style={{ marginRight: 12 }}
              />
              <View className="flex-1">
                <Text
                  className="font-semibold mb-1"
                  style={{ 
                    color: selectedAction === action.key ? colors.primary : (isDark ? colors.offwhite : colors.dark) 
                  }}
                >
                  {action.label}
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: isDark ? `${colors.offwhite}80` : `${colors.dark}80` }}
                >
                  {action.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="mt-6">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 p-4 rounded-xl border"
              style={{
                borderColor: isDark ? `${colors.primaryDark}80` : `${colors.dark}20`,
              }}
              onPress={onClose}
            >
              <Text
                className="text-center font-semibold"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 p-4 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              onPress={handleAction}
            >
              <Text className="text-center font-semibold text-white">
                Process Document
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const FilesUploadPlusPreview: React.FC<FilesUploadPlusPreviewProps> = ({ 
  colors, 
  isDark, 
  files, 
  onDelete, 
  courseId,
  enableAutoTopicExtraction = true,
  showAIActions = true
}) => {
  const router = useRouter();

  
  // AI Processing hooks
  const { 
    statusByFile, 
    errorByFile, 
    extractedTopicsByFile,
    getFileStatus,
    getFileError,
    clearFileStatus
  } = useAIDocumentProcessor();
  
  const { extractTopics } = useTopicExtraction();
  const { processBatch } = useBatchDocumentProcessor();
  
  // Local state
  const [selectedFile, setSelectedFile] = useState<DocumentItem | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());

  // Auto-extract topics for new files
// Auto-extract topics for new files
useEffect(() => {
  if (!enableAutoTopicExtraction) return;

// ...inside an async function oruseEffect...
const unprocessedFiles: DocumentItem[] = [];
for (const file of files) {
  const fileKey = String(file.id);
  const status = getFileStatus(file.id);
  if (!processedFiles.has(fileKey) && status === "idle") {
    const alreadyExtracted =  hasExtractedTopics(file.id);
    if (!alreadyExtracted) {
      unprocessedFiles.push(file);
    }
  }
}
// Now, only call extractTopics for files in unprocessedFiles

  if (unprocessedFiles.length > 0) {
    // Process files one by one with delay
    const processFiles = async () => {
      for (const file of unprocessedFiles) {
        const fileKey = String(file.id);
        setProcessedFiles(prev => new Set([...prev, fileKey]));
        
        try {
          // Create a new file object with courseId included
          const fileWithCourseId = { ...file, courseId };
          await extractTopics(fileWithCourseId);
        } catch (error) {
          console.error(`Failed to extract topics for ${file.name}:`, error);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };

    processFiles();
  }
}, [files, enableAutoTopicExtraction, extractTopics, processedFiles, getFileStatus, courseId]); // Add courseId to dependencies
  const getFileIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      pdf: "file-pdf-box",
      doc: "file-word",
      docx: "file-word",
      ppt: "file-powerpoint",
      pptx: "file-powerpoint",
      xlsx: "file-excel",
      xls: "file-excel",
      png: "image",
      jpg: "image",
      jpeg: "image",
      gif: "image",
    };
    return iconMap[type.toLowerCase()] || "file";
  };

  const getStatusColor = (status: ProcessingStatus): string => {
    switch (status) {
      case "processing":
        return colors.primary;
      case "success":
        return "#10B981"; // Green
      case "error":
        return "#EF4444"; // Red
      default:
        return isDark ? `${colors.offwhite}40` : `${colors.dark}40`;
    }
  };

  const getStatusIcon = (status: ProcessingStatus): string => {
    switch (status) {
      case "processing":
        return "sync";
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      default:
        return "ellipse";
    }
  };

  const HandleFilePass = (item: DocumentItem) => {
    router.push({
      pathname: "/FileDecisionRouter/[id]",
      params: {
        id: String(item.id),
        fileTitle: ` ${item?.name}`,
        fileType: item.type,
        fileIsPrivate: item.is_private !== undefined ? String(item.is_private) : undefined,
        fileUrl: item.url,
        courseId: courseId
      },
    });
  };

  const confirmDelete = (item: DocumentItem) => {
    Alert.alert("Delete File", `Delete ${item.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // Clear AI processing status when deleting
          clearFileStatus(item.id);
          onDelete?.(item.id, item.url, item.name);
        },
      },
    ]);
  };

const handleAIAction = (item: DocumentItem) => {
  setSelectedFile({ ...item, courseId }); // Add courseId to the selected file object
  setShowAIModal(true);
};

  const handleAIProcess = async (action: AIAction, customMessage?: string) => {
    if (!selectedFile) return;

    const { processDocument } = useAIDocumentProcessor.getState();
    
    try {
      const result = await processDocument(selectedFile, action, customMessage);
      
      if (result.success) {
        Alert.alert(
          "Success", 
          `${action.replace('_', ' ')} completed successfully!`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error", 
          result.error || "Processing failed",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error", 
        error.message || "An unexpected error occurred",
        [{ text: "OK" }]
      );
    }
  };

  const handleBatchExtraction = async () => {
    Alert.alert(
      "Batch Topic Extraction",
      `Extract topics from all ${files.length} files?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Extract",
          onPress: async () => {
            try {
              const { successful, failed } = await processBatch(
                files,
                "extract_topics",
                undefined,
                (completed, total, currentItem) => {
                  console.log(`Processing ${completed}/${total}: ${currentItem.name}`);
                }
              );

              Alert.alert(
                "Batch Processing Complete",
                `Successfully processed: ${successful.length}\nFailed: ${failed.length}`,
                [{ text: "OK" }]
              );
            } catch (error: any) {
              Alert.alert(
                "Batch Processing Error",
                error.message || "Failed to process files",
                [{ text: "OK" }]
              );
            }
          }
        }
      ]
    );
  };

  const renderFileItem = ({ item }: { item: DocumentItem }) => {
    const fileKey = String(item.id);
    const status = getFileStatus(item.id);
    const error = getFileError(item.id);
    const extractedTopics = extractedTopicsByFile[fileKey];

    return (
      <View
        className="p-4 rounded-xl mb-3"
        style={{
          backgroundColor: isDark ? `${colors.primaryDark}80` : colors.white,
        }}
      >
        {/* Main File Info Row */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="flex-row flex-1 items-center"
            onPress={() => HandleFilePass(item)}
          >
            <MaterialCommunityIcons
              name={getFileIcon(item.type) as any}
              size={24}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Text
                className="font-medium mb-1"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                }}
              >
                {item.date} • {item.size}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-2">
            {/* AI Status Indicator */}
            <View className="items-center">
              {status === "processing" ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={getStatusIcon(status) as any}
                  size={16}
                  color={getStatusColor(status)}
                />
              )}
            </View>

            {/* AI Actions Button */}
            {showAIActions && (
              <TouchableOpacity
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${colors.primary}20` }}
                onPress={() => handleAIAction(item)}
              >
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}

            {/* Delete Button */}
            <TouchableOpacity onPress={() => confirmDelete(item)}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={isDark ? colors.offwhite : colors.dark}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Processing Status */}
        {(status === "processing" || status === "error" || extractedTopics) && (
          <View className="mt-3 pt-3 border-t" style={{ 
            borderTopColor: isDark ? `${colors.primaryDark}40` : `${colors.dark}10` 
          }}>
            {status === "processing" && (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                <Text
                  className="text-sm"
                  style={{ color: colors.primary }}
                >
                  Processing with AI...
                </Text>
              </View>
            )}

            {status === "error" && error && (
              <View className="flex-row items-center">
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color="#EF4444"
                  style={{ marginRight: 8 }}
                />
                <Text
                  className="text-sm flex-1"
                  style={{ color: "#EF4444" }}
                >
                  {error}
                </Text>
                <TouchableOpacity onPress={() => clearFileStatus(item.id)}>
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}

            {extractedTopics && status === "success" && (
              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: "#10B981" }}
                >
                  ✓ {extractedTopics.topicsCount} topics extracted
                </Text>
                {extractedTopics.summary && (
                  <Text
                    className="text-xs"
                    style={{ color: isDark ? `${colors.offwhite}80` : `${colors.dark}80` }}
                    numberOfLines={2}
                  >
                    {extractedTopics.summary}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View>
      {/* Header with Batch Actions */}
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-lg font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Course Files ({files.length})
        </Text>

        {files.length > 1 && showAIActions && (
          <TouchableOpacity
            className="px-3 py-2 rounded-lg flex-row items-center"
            style={{ backgroundColor: `${colors.primary}20` }}
            onPress={handleBatchExtraction}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text
              className="text-sm font-medium"
              style={{ color: colors.primary }}
            >
              Extract All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Files List */}
      <FlatList
        scrollEnabled={false}
        data={files}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFileItem}
        showsVerticalScrollIndicator={false}
      />

      {/* AI Action Modal */}
      {selectedFile && (
        <AIActionModal
          visible={showAIModal}
          onClose={() => {
            setShowAIModal(false);
            setSelectedFile(null);
          }}
          onAction={handleAIProcess}
          fileName={selectedFile.name}
          isDark={isDark}
          colors={colors}
        />
      )}
    </View>
  );
};

export default React.memo(FilesUploadPlusPreview);