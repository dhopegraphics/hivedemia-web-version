import { colors } from "@/constants/Colors";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ForgotPasswordScreen = () => {
  const [activeTab, setActiveTab] = useState("phone"); // 'phone' or 'email' or 'recovery'
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: input, 2: OTP, 3: new password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSendCode = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleVerifyCode = () => {
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleResetPassword = () => {
    setIsLoading(true);
    // Simulate password reset
    setTimeout(() => {
      setIsLoading(false);
      router.navigate("/(auth)/Log-in");
    }, 1500);
  };

  const renderStep1 = () => (
    <View className="w-full">
      <View className="flex-row mb-6 border-b border-offwhite">
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${
            activeTab === "phone" ? "border-b-2 border-primary-100" : ""
          }`}
          onPress={() => setActiveTab("phone")}
        >
          <Text
            className={`font-medium ${
              activeTab === "phone"
                ? "text-primary-100"
                : "dark:text-offwhite text-slate-500"
            }`}
          >
            Phone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${
            activeTab === "email" ? "border-b-2 border-primary-100" : ""
          }`}
          onPress={() => setActiveTab("email")}
        >
          <Text
            className={`font-medium ${
              activeTab === "email"
                ? "text-primary-100"
                : "dark:text-offwhite  text-slate-500"
            }`}
          >
            Email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${
            activeTab === "recovery" ? "border-b-2 border-primary-100" : ""
          }`}
          onPress={() => setActiveTab("recovery")}
        >
          <Text
            className={`font-medium ${
              activeTab === "recovery"
                ? "text-primary-100"
                : "dark:text-offwhite text-slate-500"
            }`}
          >
            Recovery Code
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "phone" && (
        <View className="mb-6">
          <Text className="text-sm dark:text-offwhite text-slate-600 mb-2">
            Phone Number
          </Text>
          <View className="flex-row items-center border border-slate-300 rounded-lg px-3">
            <View className="flex-row items-center pr-3 border-r border-slate-300">
              <Text className="dark:text-offwhite text-slate-700">+233</Text>
            </View>
            <TextInput
              className="flex-1 py-3 px-3 text-white dark:text-white"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <Text className="text-xs dark:text-offwhite text-slate-500 mt-1">
            We&apos;ll send a verification code to this number
          </Text>
        </View>
      )}

      {activeTab === "email" && (
        <View className="mb-6">
          <Text className="text-sm dark:text-offwhite text-slate-600 mb-2">
            Email Address
          </Text>
          <TextInput
            className="w-full border dark:border-slate-300 border-slate-300 rounded-lg py-3 px-4 text-gray-700 mb-1"
            placeholder="Enter your email address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Text className="text-xs dark:text-offwhite text-slate-500">
            We&apos;ll send a password reset link to this email
          </Text>
        </View>
      )}

      {activeTab === "recovery" && (
        <View className="mb-6">
          <Text className="text-sm dark:text-offwhite text-slate-600 mb-2">
            Recovery Code
          </Text>
          <TextInput
            className="w-full border border-slate-300 rounded-lg py-3 px-4 text-gray-700 mb-1"
            placeholder="Enter your 8-digit recovery code"
            keyboardType="numeric"
            value={recoveryCode}
            onChangeText={setRecoveryCode}
            maxLength={8}
          />
          <Text className="text-xs dark:text-offwhite text-slate-500">
            Use one of the recovery codes you saved when setting up your account
          </Text>
          <TouchableOpacity className="mt-4">
            <Text className="text-primary-100 dark:text-offwhite text-sm font-medium">
              Where can I find my recovery codes?
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        className="bg-primary py-3 rounded-lg items-center mt-4"
        onPress={handleSendCode}
        disabled={isLoading}
      >
        <Text className="text-primary-100 font-medium">
          {isLoading ? "Sending..." : "Send Verification Code"}
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center mt-6">
        <Text className="dark:text-white text-slate-600">
          Remember your password?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary-100 font-medium">Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="w-full">
      <Text className="text-lg font-bold dark:text-offwhite text-slate-600 mb-2">
        Enter Verification Code
      </Text>
      <Text className="dark:text-offwhite text-slate-600 mb-6">
        We&apos;ve sent a 6-digit code to{" "}
        {activeTab === "phone" ? `+233${phone}` : email}
      </Text>

      <View className="flex-row justify-between mb-6">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            className="w-12 h-12 border  dark:bg-offwhite dark:border-white  border-slate-300 rounded-lg text-center font-JakartaExtraBold text-xl"
            keyboardType="numeric"
            maxLength={1}
            onChangeText={(text) => {
              const newOtp = otp.split("");
              newOtp[index] = text;
              setOtp(newOtp.join(""));
            }}
            value={otp[index] || ""}
          />
        ))}
      </View>

      <View className="flex-row justify-center mb-6">
        <Text className="text-white">Didn&apos;t receive code? </Text>
        <TouchableOpacity>
          <Text className="text-primary-100 font-medium">Resend</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-primary py-3 rounded-lg items-center"
        onPress={handleVerifyCode}
        disabled={isLoading || otp.length < 6}
      >
        <Text className="text-primary-100 font-medium">
          {isLoading ? "Verifying..." : "Verify Code"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 items-center"
        onPress={() => setStep(1)}
      >
        <Text className="text-primary-100 font-medium">
          Use a different method
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View className="w-full">
      <Text className="text-lg font-bold text-gray-800 mb-6">
        Create New Password
      </Text>

      <View className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">New Password</Text>
        <TextInput
          className="w-full border border-gray-300 rounded-lg py-3 px-4 text-gray-700 mb-1"
          placeholder="Enter new password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <Text className="text-xs text-gray-500">
          Must be at least 8 characters with a number and special character
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-sm text-gray-600 mb-2">Confirm Password</Text>
        <TextInput
          className="w-full border border-gray-300 rounded-lg py-3 px-4 text-gray-700"
          placeholder="Confirm new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <TouchableOpacity
        className="bg-primary py-3 rounded-lg items-center"
        onPress={handleResetPassword}
        disabled={isLoading || !newPassword || newPassword !== confirmPassword}
      >
        <Text className="text-white font-medium">
          {isLoading ? "Resetting..." : "Reset Password"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      className="flex-1 "
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8 justify-center">
            <View className="items-center mb-8">
              {isDark ? (
                <Image
                  source={require("@/assets/images/black-logo-white-text.webp")}
                  className="w-full h-32"
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require("@/assets/images/var-2-primary.webp")}
                  className="w-full h-32"
                  resizeMode="contain"
                />
              )}
            </View>

            <Text className="text-2xl font-bold dark:text-offwhite text-slate-900 mb-2 text-center">
              {step === 1
                ? "Forgot Password"
                : step === 2
                ? "Verify Identity"
                : "New Password"}
            </Text>
            <Text className="dark:text-offwhite text-slate-600 mb-8 text-center">
              {step === 1
                ? "Select your preferred method to reset your password"
                : step === 2
                ? "Enter the verification code sent to you"
                : "Create a strong new password for your account"}
            </Text>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
