import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

export const downloadAndCachePdf = async (signedUrl, filename, courseId) => {
    try {
      const fileUri = FileSystem.documentDirectory + filename;

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) return fileUri;

      const downloadResumable = FileSystem.createDownloadResumable(
        signedUrl,
        fileUri
      );
      const { uri } = await downloadResumable.downloadAsync();

      // Store under course-specific key
      const cacheKey = `cached-files-${courseId}`;
      const storedCache = await AsyncStorage.getItem(cacheKey);
      const cacheMap = storedCache ? JSON.parse(storedCache) : {};

      if (!cacheMap[filename]) {
        cacheMap[filename] = uri;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheMap));
        console.log("✅ Saved into course-level cache:", cacheMap);
      }

      return uri;
    } catch (err) {
      console.error("❌ Failed to download/cache PDF:", err.message);
      return null;
    }
  };