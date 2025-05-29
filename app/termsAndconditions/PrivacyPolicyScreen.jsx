import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";

import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function PrivacyPolicyScreen() {
  return (
    <View className="flex-1  dark:bg-dark bg-offwhite">
      <StatusBar style="auto" />
      {/* Header */}
      <View className="dark:bg-primary-200  bg-primary-200 pt-16 p-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-16 left-6 z-10"
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white text-center">
          Privacy Policy
        </Text>
        <Text className="dark:text-primary-100 text-center mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-semibold dark:text-offwhite text-dark mb-4">
          Hivedemia ("we," "our," or "us") is committed to protecting your
          privacy. This Privacy Policy explains how we collect, use, disclose,
          and safeguard your information when you use our mobile application.
        </Text>

        {/* Information Collection */}
        <Section title="1. Information We Collect">
          <BulletPoint icon="person">
            <Text className="dark:text-offwhite text-dark ">
              <Text className="font-semibold">Account Information:</Text> When
              you create an account, we collect your name, email address,
              university affiliation, and academic interests.
            </Text>
          </BulletPoint>

          <BulletPoint icon="cloud-upload">
            <Text className="dark:text-offwhite text-dark ">
              <Text className="font-semibold">Uploaded Content:</Text>{" "}
              Documents, notes, images, and other materials you upload for AI
              processing. This content is processed to generate study materials
              but is never shared with third parties.
            </Text>
          </BulletPoint>

          <BulletPoint icon="analytics">
            <Text className="dark:text-offwhite text-dark ">
              <Text className="font-semibold">Usage Data:</Text> How you
              interact with SmartHive AI, including queries, study sessions, and
              feature usage to improve our service.
            </Text>
          </BulletPoint>
        </Section>

        {/* Data Usage */}
        <Section title="2. How We Use Your Information">
          <BulletPoint icon="auto-awesome">
            <Text className="dark:text-offwhite text-dark ">
              Provide and maintain SmartHive AI services
            </Text>
          </BulletPoint>
          <BulletPoint icon="school">
            <Text className="dark:text-offwhite text-dark ">
              Generate personalized study plans and materials
            </Text>
          </BulletPoint>
          <BulletPoint icon="security">
            <Text className="dark:text-offwhite text-dark ">
              Improve and optimize our AI algorithms
            </Text>
          </BulletPoint>
          <BulletPoint icon="mail">
            <Text className="dark:text-offwhite text-dark ">
              Communicate important service updates
            </Text>
          </BulletPoint>
        </Section>

        {/* Data Protection */}
        <Section title="3. Data Protection">
          <Text className="dark:text-offwhite text-dark  mb-4">
            We implement industry-standard security measures including:
          </Text>
          <BulletPoint icon="lock">
            <Text className="dark:text-offwhite text-dark ">
              End-to-end encryption for all uploaded materials
            </Text>
          </BulletPoint>
          <BulletPoint icon="storage">
            <Text className="dark:text-offwhite text-dark ">
              Secure cloud storage with limited access
            </Text>
          </BulletPoint>
          <BulletPoint icon="code">
            <Text className="dark:text-offwhite text-dark ">
              Regular security audits of our AI systems
            </Text>
          </BulletPoint>
        </Section>

        {/* User Rights */}
        <Section title="4. Your Rights">
          <BulletPoint icon="delete">
            <Text className="dark:text-offwhite text-dark ">
              Right to delete your account and all associated data
            </Text>
          </BulletPoint>
          <BulletPoint icon="visibility-off">
            <Text className="dark:text-offwhite text-dark ">
              Right to opt-out of data processing
            </Text>
          </BulletPoint>
          <BulletPoint icon="download">
            <Text className="dark:text-offwhite text-dark ">
              Right to export your generated study materials
            </Text>
          </BulletPoint>
        </Section>

        {/* Contact */}
        <View className="mt-8 p-4 bg-primary-200 rounded-lg">
          <Text className="text-lg font-semibold text-white  mb-2">
            Contact Us
          </Text>
          <Text className="dark:text-offwhite text-dark  mb-4">
            For any privacy-related questions or to exercise your rights, please
            contact our Data Protection Officer:
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:privacy@hivedemia.com")}
            className="flex-row items-center"
          >
            <Feather name="mail" size={20} color="#00DF82" />
            <Text className="text-white ml-2">privacy@hivedemia.com</Text>
          </TouchableOpacity>
        </View>
        <View className="mb-20" />
      </ScrollView>
    </View>
  );
}

// Reusable components
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
