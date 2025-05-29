import { useAuthStore } from "@/backend/store/authStore";
import OnboardingAnimation from "@/utils/OnboardingAnimated";
import { FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const onboardingSlides = [
  {
    id: 1,
    title: "Welcome to Hivedemia",
    subtitle: "Your Smart Study Companion",
    description: "Built to help you learn, revise, and prepare with AI",
    image: require("@/assets/images/onboarding1.webp"),
    icon: "school",
  },
  {
    id: 2,
    title: "SmartHive AI Assistant",
    subtitle: "Your Personal Tutor",
    description:
      "Breaks down your notes, creates quizzes, and answers your questions",
    image: require("@/assets/images/onboarding2.jpg"),
    icon: "robot",
  },
  {
    id: 3,
    title: "Solve Anything",
    subtitle: "Instant Help with Problems",
    description:
      "Snap a question. SmartHive AI will walk you through the solution step-by-step",
    image: require("@/assets/images/onboarding3.jpg"),
    icon: "camera",
  },
  {
    id: 4,
    title: "Learn Your Way",
    subtitle: "Personalized Study Paths",
    description:
      "Choose a course, select a topic, and practice with real past questions or AI-generated ones",
    image: require("@/assets/images/onboarding4.png"),
    icon: "book",
  },
  {
    id: 5,
    title: "Get Started",
    subtitle: "Join the Hive",
    description: "Create your account to unlock personalized learning",
    image: require("@/assets/images/SmartHive.jpeg"),
    icon: "login",
  },
];

export default function OnboardingScreen() {
  const setOnboarded = useAuthStore((state) => state.setOnboarded);
  const user = useAuthStore((state) => state.user);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (currentIndex === onboardingSlides.length - 1) {
      setOnboarded(true);
      if (user) {
        router.push("/(home)/(tabs)");
      } else {
        router.push("/(auth)");
      }
    }
  }, [currentIndex, user, setOnboarded, router]);

  const goToNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setOnboarded(true);
      router.push("/(auth)");
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const skipOnboarding = () => {
    setOnboarded(true);
    router.push("/(auth)");
  };

  let slideImage;
  try {
    slideImage = onboardingSlides[currentIndex].image;
  } catch (e) {
    slideImage = null;
  }

  return (
    <View className="flex-1 bg-white">
      {/* Skip Button */}
      <TouchableOpacity
        onPress={skipOnboarding}
        className="absolute top-12 right-6 z-10"
      >
        <Text className="text-indigo-600 font-medium">Skip</Text>
      </TouchableOpacity>
      {/* Main Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Image */}
        <View className="h-64 w-64 mb-8 justify-center items-center">
          {slideImage ? (
            <Image
              source={slideImage}
              className="w-full h-full"
              resizeMode="contain"
            />
          ) : (
            <Text>Image not found</Text>
          )}
        </View>

        {/* Icon */}
        <View className="bg-indigo-100 p-4 rounded-full mb-6">
          {currentIndex === 0 && (
            <MaterialIcons name="school" size={32} color="#4f46e5" />
          )}
          {currentIndex === 1 && (
            <FontAwesome6 name="robot" size={32} color="#4f46e5" />
          )}
          {currentIndex === 2 && (
            <FontAwesome name="camera" size={32} color="#4f46e5" />
          )}
          {currentIndex === 3 && (
            <MaterialIcons name="book" size={32} color="#4f46e5" />
          )}
          {currentIndex === 4 && (
            <MaterialIcons name="login" size={32} color="#4f46e5" />
          )}
        </View>

        {/* Text Content */}
        <OnboardingAnimation>
          <Text className="text-3xl font-bold text-center text-gray-900 mb-2">
            {onboardingSlides[currentIndex].title}
          </Text>
          <Text className="text-xl text-indigo-600 font-semibold text-center mb-4">
            {onboardingSlides[currentIndex].subtitle}
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-8 px-4">
            {onboardingSlides[currentIndex].description}
          </Text>
        </OnboardingAnimation>
      </View>

      {/* Bottom Navigation */}
      <View className="pb-12 px-6">
        {/* Progress Dots */}
        <View className="flex-row justify-center mb-8">
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full mx-1 ${
                currentIndex === index ? "bg-indigo-600 w-6" : "bg-gray-300"
              }`}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View className="flex-row justify-between items-center">
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={goToPrev} className="p-3">
              <MaterialIcons name="arrow-back" size={24} color="#4f46e5" />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}

          {currentIndex < onboardingSlides.length - 1 ? (
            <TouchableOpacity
              onPress={goToNext}
              className="bg-indigo-600 px-6 py-3 rounded-full flex-1 mx-4 items-center"
            >
              <Text className="text-white font-medium">Next</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-1 mx-4">
              <Link href={"/termsAndconditions/PrivacyAndPermissions"} asChild>
                <TouchableOpacity className="bg-indigo-600 px-6 py-3 rounded-full items-center mb-3">
                  <Text className="text-white font-medium">Sign Up</Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity
                onPress={skipOnboarding}
                className="border border-indigo-600 px-6 py-3 rounded-full items-center"
              >
                <Text className="text-indigo-600 font-medium">Log In</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentIndex < onboardingSlides.length - 1 ? (
            <TouchableOpacity onPress={skipOnboarding} className="p-3">
              <Text className="text-indigo-600 font-medium">Skip</Text>
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>
      </View>
    </View>
  );
}
