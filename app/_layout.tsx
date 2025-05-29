import { ToastProvider } from "@/context/ToastContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "../global.css";


const MainLayout = () => {


  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="termsAndconditions/PrivacyAndPermissions"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="termsAndconditions/PrivacyPolicyScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="termsAndconditions/TermsOfServiceScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="(home)" options={{ headerShown: false }} />
      <Stack.Screen
        name="notifications/index"
        options={{ headerShown: false, title: "Notifications" }}
      />
      <Stack.Screen name="CourseHub/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="CourseHub/CreateCourse"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="QuizHome/Active" options={{ headerShown: false }} />
      <Stack.Screen
        name="TopicQuizzes/QuizOnTopic"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="recentActivity/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SnapSolution/SnapSolve"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SmartHiveAi/SmartHiveChatScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="GroupChatRoom/ChatRoom"
        options={{ headerShown: false, title: "Group Chat Room" }}
      />
      <Stack.Screen
        name="GroupChatRoom/create-group"
        options={{ headerShown: false, title: "Create Your Own Group" }}
      />
      <Stack.Screen
        name="GroupChatRoom/GroupSettings"
        options={{ headerShown: false, title: "Group Settings" }}
      />
      <Stack.Screen
        name="GroupChatRoom/GroupMembers"
        options={{ headerShown: false, title: "Group Members" }}
      />
      <Stack.Screen
        name="GroupChatRoom/ForwardMessageScreen"
        options={{ headerShown: false, title: "Forward Message" }}
      />
      <Stack.Screen
        name="FileDecisionRouter/[id]"
        options={{ headerShown: false, title: "RedirectFileType" }}
      />
      <Stack.Screen
        name="settingsItems/AboutUs"
        options={{ headerShown: false, title: "About us" }}
      />
      <Stack.Screen
        name="settingsItems/AcademicProfileScreen"
        options={{ headerShown: false, title: "Academic Profile" }}
      />
      <Stack.Screen
        name="settingsItems/NotificationPreferencesScreen"
        options={{ headerShown: false, title: "Notification Preferences" }}
      />
      <Stack.Screen
        name="settingsItems/PersonalInformationScreen"
        options={{ headerShown: false, title: "Personal Information" }}
      />
      <Stack.Screen
        name="settingsItems/PasswordSecurityScreen"
        options={{ headerShown: false, title: "Password Security" }}
      />
      <Stack.Screen
        name="Hubs"
        options={{ headerShown: false, title: "Hubs" }}
      />
    </Stack>
  );
};

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
