import { Stack } from "expo-router";

const HubsLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="Notes/NoteUpload"
        options={{ headerShown: false, title: "Contribute To Public Note" }}
      />
      <Stack.Screen name="Competition" options={{ headerShown: false }} />
      <Stack.Screen name="Exams/create" options={{ headerShown: false }} />
      <Stack.Screen name="Exams/ExamsList" options={{ headerShown: false }} />
      <Stack.Screen name="Exams/[ExamId]" options={{ headerShown: false }} />
    </Stack>
  );
};

export default HubsLayout;
