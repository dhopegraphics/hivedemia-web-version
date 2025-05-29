import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";

const Section = ({ title, children }) => (
  <View className="mb-6">
    <Text className="text-xl font-bold dark:text-primary-100 text-primary-100 mb-3">
      {title}
    </Text>
    {children}
  </View>
);

const BulletPoint = ({ icon, children }) => (
  <View className="flex-row items-start mb-3">
    <MaterialIcons name={icon} size={20} color="#00DF82" className="mt-1" />
    <View className="ml-3 flex-1">{children}</View>
  </View>
);

export default function TermsOfServiceScreen() {
  return (
    <View className="flex-1 bg-dark">
      {/* Header */}
      <View className="dark:bg-primary-200 bg-offwhite pt-16  p-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-16 left-6 z-10"
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white text-center">
          Terms of Service
        </Text>
        <Text className="text-indigo-100 text-center mt-2">
          Effective: {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <Text className="text-lg text-gray-700 mb-6">
          Welcome to Hivedemia! These Terms of Service ("Terms") govern your use
          of our AI-powered educational platform and services ("Services").
        </Text>

        {/* Acceptance */}
        <Section title="1. Acceptance of Terms">
          <Text className="text-gray-700 mb-4">
            By accessing or using Hivedemia, you agree to be bound by these
            Terms. If you disagree, please discontinue use immediately.
          </Text>
        </Section>

        {/* Service Description */}
        <Section title="2. Service Description">
          <Text className="text-gray-700 mb-4">Hivedemia provides:</Text>
          <BulletPoint icon="auto-awesome">
            <Text className="text-gray-700">
              AI-generated study materials from your uploaded content
            </Text>
          </BulletPoint>
          <BulletPoint icon="quiz">
            <Text className="text-gray-700">
              Personalized quizzes and practice tests
            </Text>
          </BulletPoint>
          <BulletPoint icon="schedule">
            <Text className="text-gray-700">
              Smart revision planning with SmartHive AI
            </Text>
          </BulletPoint>
          <Text className="text-gray-700 mt-4">
            We continuously improve our AI models, which may affect output
            formats and features.
          </Text>
        </Section>

        {/* User Responsibilities */}
        <Section title="3. User Responsibilities">
          <BulletPoint icon="warning">
            <Text className="text-gray-700">
              <Text className="font-semibold">Academic Integrity:</Text>{" "}
              Hivedemia is a study aid, not a substitute for learning. Ensure
              your use complies with your institution's academic policies.
            </Text>
          </BulletPoint>
          <BulletPoint icon="content-paste">
            <Text className="text-gray-700">
              <Text className="font-semibold">Content Ownership:</Text> You
              retain rights to materials you upload. We claim no ownership over
              user-generated content.
            </Text>
          </BulletPoint>
          <BulletPoint icon="do-not-disturb">
            <Text className="text-gray-700">
              <Text className="font-semibold">Prohibited Uses:</Text> Reverse
              engineering, spamming, or any unlawful activities are strictly
              forbidden.
            </Text>
          </BulletPoint>
        </Section>

        {/* AI Limitations */}
        <Section title="4. AI Limitations">
          <Text className="text-gray-700 mb-4">
            SmartHive AI may occasionally produce inaccurate information. Always
            verify critical academic content.
          </Text>
          <BulletPoint icon="error">
            <Text className="text-gray-700">
              Not a substitute for professional academic advice
            </Text>
          </BulletPoint>
          <BulletPoint icon="update">
            <Text className="text-gray-700">
              Output quality depends on input materials
            </Text>
          </BulletPoint>
        </Section>

        {/* Termination */}
        <Section title="5. Termination">
          <Text className="text-gray-700">
            We may terminate access for violations of these Terms. You may
            delete your account anytime via Settings.
          </Text>
        </Section>

        {/* Governing Law */}
        <Section title="6. Governing Law">
          <Text className="text-gray-700">
            These Terms shall be governed by the laws of [Your Jurisdiction]
            without regard to conflict of law principles.
          </Text>
        </Section>

        {/* Changes */}
        <Section title="7. Changes to Terms">
          <Text className="text-gray-700">
            We'll notify users of material changes via email or in-app notice.
            Continued use constitutes acceptance.
          </Text>
        </Section>

        {/* Contact */}
        <View className="mt-8 p-4 bg-indigo-50 rounded-lg">
          <Text className="text-lg font-semibold text-indigo-700 mb-2">
            Questions?
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:support@hivedemia.com")}
            className="flex-row items-center"
          >
            <Feather name="mail" size={20} color="#4f46e5" />
            <Text className="text-indigo-600 ml-2">support@hivedemia.com</Text>
          </TouchableOpacity>
        </View>
        <View className="mb-20" />
      </ScrollView>
    </View>
  );
}
