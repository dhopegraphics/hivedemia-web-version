import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

const FileStateSwitch = () => {
  const router = useRouter();
  const { id, fileTitle, fileType, fileIsPrivate, fileUrl, courseId , isCommentable } =
    useLocalSearchParams();
  const sourceType = "remote";


  useEffect(() => {
    if (!fileType || !fileUrl) return;

    const type = fileType.toLowerCase();

    if (type === "pdf") {
      router.replace({
        pathname: "/FileViewers",
        params: { id, fileTitle, fileUrl, fileIsPrivate, sourceType, courseId , isCommentable , fileType },
      });
    } else if (["doc", "docx", "txt", "md"].includes(type)) {
      router.replace({
        pathname: "/FileViewers/DocViewer",
        params: { id, fileTitle, fileUrl, fileIsPrivate, sourceType, courseId , isCommentable , fileType },
      });
    } else if (["xls", "xlsx"].includes(type)) {
      router.replace({
        pathname: "/FileViewers/ExcelViewer",
        params: { id, fileTitle, fileUrl, fileIsPrivate, sourceType, courseId , isCommentable , fileType },
      });
    } else if (["ppt", "pptx"].includes(type)) {
      router.replace({
        pathname: "/FileViewers/PPTViewer",
        params: { id, fileTitle, fileUrl, fileIsPrivate, sourceType, courseId  , isCommentable , fileType },
      });
    } else {
      router.replace({
        pathname: "/FileViewers/UnknownViewer",
        params: { id, fileTitle, fileUrl, fileIsPrivate, sourceType, courseId , isCommentable , fileType },
      });
    }
  }, [fileType, fileUrl , id, fileTitle, fileIsPrivate, sourceType, courseId , isCommentable, router]);

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" />
      <Text>Loading file preview...</Text>
    </View>
  );
};

export default FileStateSwitch;
