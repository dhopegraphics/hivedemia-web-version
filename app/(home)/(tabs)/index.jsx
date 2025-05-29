import { usePlannerStore } from "@/backend/store/plannerStore";
import { useUserStore } from "@/backend/store/useUserStore";
import ContinueSectionCard from "@/components/ContinueSectionCard";
import CountdownPlusSuggestedTopics from "@/components/CountdownPlusSuggestedTopics";
import CourseAiSuggestionCard from "@/components/CourseAiSuggestionCard";
import QuickHomeActionsCard from "@/components/QuickHomeActionsCard";
import RecentActivity from "@/components/RecentActivity";
import { colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const navigation = useNavigation();
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
      return "Good Evening";
    } else {
      return "Good Night";
    }
  };

  const { profile, hydrateProfile, error } =
    useUserStore();

  const schedules = usePlannerStore((state) => state.schedules);
  const loadPlannerFromDB = usePlannerStore((state) => state.loadPlannerFromDB);
  const [nextExam, setNextExam] = useState(null);

  useEffect(() => {
    hydrateProfile();
    loadPlannerFromDB();
  }, [loadPlannerFromDB , hydrateProfile]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const upcomingExams = schedules.exams
      .filter((exam) => exam.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (upcomingExams.length > 0) {
      setNextExam(upcomingExams[0]);
    } else {
      setNextExam(null);
    }
  }, [schedules.exams]);

  if (!profile) return <Text>No profile loaded</Text>;

  const userData = {
    todayFocus: "Advanced Calculus",
  };

  const recentActivities = [
    { id: 1, title: "Calculus Quiz", score: "85%", type: "quiz" },
    { id: 2, title: "Physics Hub", type: "hub" },
    { id: 3, title: "Algebra Problem", type: "problem" },
    { id: 4, title: "Statistics Quiz", score: "92%", type: "quiz" },
  ];
  const notifications = {};

  return (
    <>
      <StatusBar style="auto" />
      <View
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primary,
        }}
        className="flex-row justify-between pt-16 px-4 py-2 items-center "
      >
       
        <View>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons
              name="reorder-three-sharp"
              size={32}
              color={isDark ? colors.light : colors.black}
            />
          </TouchableOpacity>
        </View>
        <View>
          <Image
            source={require("@/assets/images/black-logo-white-text.webp")}
            className="w-40 h-8 "
            resizeMode="cover"
          />
        </View>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={isDark ? colors.light : colors.black}
          />
          {notifications > 0 && (
            <View
              className="absolute -top-1 -right-1 rounded-full w-5 h-5 items-center justify-center"
              style={{ backgroundColor: colors.error }}
            >
              <Text className="text-white text-xs">{notifications}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
        
      >
        { error && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-red-500">Error: {error}</Text>
          </View>
        )}

        {/* Greeting Section */}
        
        <View className="px-6">
          <Text
            style={{ color: isDark ? colors.offwhite : colors.dark }}
            className="text-lg"
          >
            {getTimeBasedGreeting()}
          </Text>
          <Text
            style={{ color: isDark ? colors.offwhite : colors.dark }}
            className="text-2xl font-bold"
          >
            Hello, {profile.username}!
          </Text>
        </View>

        {/* Quick Actions */}
        <QuickHomeActionsCard isDark={isDark} colors={colors} />

        {/* Today's Focus */}
        <CourseAiSuggestionCard
          userData={userData}
          colors={colors}
          isDark={isDark}
        />

        {/* Countdown & Suggested Topics */}
        <CountdownPlusSuggestedTopics
          isDark={isDark}
          colors={colors}
          nextExam={nextExam}
        />

        {/* Continue Section */}
        <ContinueSectionCard isDark={isDark} colors={colors} />

        {/* Recent Activity */}
        <RecentActivity
          isDark={isDark}
          colors={colors}
          userData={userData}
          recentActivities={recentActivities}
        />
      </ScrollView>
    </>
  );
}
