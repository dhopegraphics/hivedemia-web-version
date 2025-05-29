import { Stack } from "expo-router";

const FileViewerLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "PDF Viewer",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DocViewer"
        options={{
          title: "Document Viewer",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ExcelViewer"
        options={{
          title: "Excel Viewer",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PPTViewer"
        options={{
          title: "PowerPoint Viewer",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UnknownViewer"
        options={{
          title: "Unknown File",
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default FileViewerLayout;