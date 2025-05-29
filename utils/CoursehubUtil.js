 import AsyncStorage from "@react-native-async-storage/async-storage";
import DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { Alert } from "react-native";
import { supabase } from "../backend/supabase";

 export const handleCourseDelete = async () => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course and all its files?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: userData, error: userError } =
                await supabase.auth.getUser();
              const user_id = userData?.user?.id;
              if (userError || !user_id)
                throw new Error("User not authenticated");

              // 1. Fetch all files for this course
              const { data: filesToDelete, error: fetchError } = await supabase
                .from("coursefiles")
                .select("id, name")
                .eq("course_id", id)
                .eq("user_id", user_id);

              if (fetchError) throw fetchError;

              // 2. Delete files from storage
              const filePaths = filesToDelete.map(
                (file) => `${id}/${file.name}`
              );
              if (filePaths.length > 0) {
                const { error: storageError } = await supabase.storage
                  .from("coursefiles")
                  .remove(filePaths);
                if (storageError) throw storageError;
              }

              // 3. Delete metadata from coursefiles table
              await supabase.from("coursefiles").delete().eq("course_id", id);

              // 4. Delete course record
              await supabase.from("course").delete().eq("id", id);

              // 5. Remove local cache
              await AsyncStorage.removeItem(`course-files-${id}`);

              // 6. Go back to previous screen
              router.back();

              console.log("✅ Course deleted successfully.");
            } catch (err) {
              console.error("❌ Failed to delete course:", err.message);
              Alert.alert(
                "Error",
                "Failed to delete course. Please try again."
              );
            }
          },
        },
      ]
    );
  };

 export  const handlefileupload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0)
        return;
      const file = result.assets[0];

      if (!allowedTypes.includes(file.mimeType)) {
        Alert.alert(
          "Unsupported File",
          "Only PDF, Word, Excel, PPT, Text, or Markdown files are allowed."
        );
        return;
      }

      setUploading(true);
      setUploadProgress(0);


      const fileExt = file.name.split(".").pop();
      const filePath = `${id}/${Date.now()}-${file.name}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("coursefiles")
        .upload(filePath, {
          uri: file.uri,
          type: file.mimeType || "application/octet-stream",
          name: file.name,
        });



      if (uploadError) {
        setUploading(false);
        Alert.alert("Upload Failed", uploadError.message);
        console.error("Upload failed:", uploadError.message);
        return;
      }

       // Simulate progress for UX (Supabase doesn't support progress natively)
    let simulatedProgress = 0;
    const interval = setInterval(() => {
      simulatedProgress += 10;
      setUploadProgress(simulatedProgress);
      if (simulatedProgress >= 90) clearInterval(interval);
    }, 150);


      const { data: fileUrlData } = await supabase.storage
        .from("coursefiles")
        .getPublicUrl(filePath);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      const user_id = userData?.user?.id;

      if (userError || !user_id) {
        console.warn("User not authenticated");
        return;
      }

      const { error: insertError } = await supabase.from("coursefiles").insert([
        {
          course_id: parseInt(id),
          user_id,
          name: file.name,
          type: fileExt,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          is_private: true,
          url: fileUrlData?.publicUrl || "",
        },
      ]);

      if (insertError) {
        setUploading(false);
        console.error("Insert failed:", insertError.message);
        return;
      }

      setFiles((prev) => {
        const updated = [
          ...prev,
          {
            id: Date.now(), // temp id, could be replaced if you return DB ID
            name: file.name,
            type: fileExt,
            date: new Date().toISOString().split("T")[0],
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          },
        ];
        AsyncStorage.setItem(`course-files-${id}`, JSON.stringify(updated));
        return updated;
      });

      console.log("✅ File uploaded and saved to Supabase!");
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  export const handleFileDelete = async (fileId, fileName) => {
    try {
      const filePath = `${id}/${fileName}`;

      await supabase.storage.from("coursefiles").remove([filePath]);
      await supabase.from("coursefiles").delete().eq("id", fileId);

      const updated = files.filter((f) => f.id !== fileId);
      setFiles(updated);
      await AsyncStorage.setItem(`course-files-${id}`, JSON.stringify(updated));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };