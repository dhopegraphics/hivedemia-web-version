import { signUpWithProfile } from "@/backend/services/auth";
import { supabase } from "@/backend/supabase";
import { colors } from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-z0-9_]+$/,
        "Only lowercase letters, numbers, and underscores"
      ),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { user, error } = await signUpWithProfile(
        data.email,
        data.password,
        data.name,
        data.username
      );

      if (error) {
        throw new Error(
          typeof error === "string" ? error : JSON.stringify(error)
        );
      }

      // Fetch the session after signup
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        throw new Error("Session could not be retrieved after signup.");
      }

      // Save session to AsyncStorage
      if (sessionData?.session) {
        await AsyncStorage.setItem(
          "supabase_session",
          JSON.stringify(sessionData.session)
        );
      }

      if (user) {
        router.replace("/(auth)/Log-in");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to sign up. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ paddingBottom: insets.bottom }}
    >
      <StatusBar style="auto" />
      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
        className="flex-1 px-6 justify-center"
      >
        <View className="mb-5">
          <Text className="text-3xl dark:text-offwhite font-bold text-slate-700">
            Create an account
          </Text>
          <Text className=" dark:text-offwhite text-slate-700 mt-2">
            Join us to get started today
          </Text>
        </View>

        <View className="space-y-8">
          <View>
            <Text className="text-sm dark:text-offwhite font-medium text-slate-900 mb-3">
              Full Name
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`border bg-slate-200 dark:bg-darkLight rounded-lg px-4 py-3 flex-row items-center ${
                    errors.name
                      ? "border-red-500"
                      : "dark:border-offwhite  border-slate-300"
                  }`}
                >
                  <Feather
                    name="user"
                    size={20}
                    color={isDark ? colors.offwhite : colors.gray}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1  dark:text-white text-slate-900"
                    placeholder="Enter your full name"
                    autoCapitalize="words"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholderTextColor={
                      isDark ? colors.offwhite : colors.gray
                    }
                  />
                </View>
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.name.message}
              </Text>
            )}
          </View>
          <View>
            <Text className="text-sm font-medium text-slate-700 mb-3 mt-2 dark:text-offwhite">
              Username
            </Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`border bg-slate-200 dark:bg-darkLight  rounded-lg px-4 py-3 flex-row items-center ${
                    errors.username
                      ? "border-red-500"
                      : "dark:border-offwhite  border-slate-300"
                  }`}
                >
                  <Feather
                    name="at-sign"
                    size={20}
                    color={isDark ? colors.offwhite : colors.gray}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1  dark:text-white text-slate-900"
                    placeholder="Enter your username"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text.toLowerCase())} // Force lowercase
                    value={value}
                    placeholderTextColor={
                      isDark ? colors.offwhite : colors.gray
                    }
                  />
                </View>
              )}
            />
            {errors.username && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.username.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-3 mt-2 dark:text-offwhite">
              Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`border  bg-slate-200 dark:bg-darkLight rounded-lg px-4 py-3 flex-row items-center ${
                    errors.email
                      ? "border-red-500"
                      : "dark:border-offwhite  border-slate-300"
                  }`}
                >
                  <Feather
                    name="mail"
                    size={20}
                    color={isDark ? colors.offwhite : colors.gray}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1   dark:text-white text-slate-900"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholderTextColor={
                      isDark ? colors.offwhite : colors.gray
                    }
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-slate-700 mb-3 mt-2 dark:text-offwhite">
              Password
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`border bg-slate-200 dark:bg-darkLight rounded-lg px-4 py-3 flex-row items-center ${
                    errors.password
                      ? "border-red-500"
                      : "dark:border-offwhite  border-slate-300"
                  }`}
                >
                  <Feather
                    name="lock"
                    size={20}
                    color={isDark ? colors.offwhite : colors.gray}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1  dark:text-white text-gray-900"
                    placeholder="Enter your password"
                    secureTextEntry={secureTextEntry}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholderTextColor={
                      isDark ? colors.offwhite : colors.gray
                    }
                  />
                  <TouchableOpacity
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  >
                    <Feather
                      name={secureTextEntry ? "eye-off" : "eye"}
                      size={20}
                      color={isDark ? colors.offwhite : colors.gray}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium  text-slate-700 mb-3 mt-2 dark:text-offwhite">
              Confirm Password
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`border  bg-slate-200 dark:bg-darkLight  mb-6 rounded-lg px-4 py-3 flex-row items-center ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "dark:border-offwhite  border-slate-300"
                  }`}
                >
                  <Feather
                    name="lock"
                    size={20}
                    color={isDark ? colors.offwhite : colors.gray}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    className="flex-1 dark:text-white text-slate-900"
                    placeholder="Confirm your password"
                    secureTextEntry={confirmSecureTextEntry}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholderTextColor={
                      isDark ? colors.offwhite : colors.gray
                    }
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setConfirmSecureTextEntry(!confirmSecureTextEntry)
                    }
                  >
                    <Feather
                      name={confirmSecureTextEntry ? "eye-off" : "eye"}
                      size={20}
                      color={isDark ? colors.offwhite : colors.gray}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            className={`bg-primary-100 rounded-lg py-4 items-center justify-center ${
              isLoading ? "opacity-70" : ""
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text className="text-white font-medium">
                Creating account...
              </Text>
            ) : (
              <Text className="text-white font-medium">Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray">Already have an account? </Text>
          <Link href="/(auth)/Log-in" asChild>
            <TouchableOpacity>
              <Text className="text-primary-100 font-medium">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-primary-100" />
          <Text className="mx-4 text-dark dark:text-offwhite">or</Text>
          <View className="flex-1 h-px bg-primary-100" />
        </View>

        <View className="flex-row  justify-center gap-4 ">
          <TouchableOpacity className="border border-dark dark:border-offwhite rounded-full p-3">
            <Feather
              name="facebook"
              size={24}
              color={isDark ? colors.offwhite : colors.gray}
            />
          </TouchableOpacity>
          <TouchableOpacity className="border border-dark dark:border-offwhite rounded-full p-3">
            <Feather
              name="twitter"
              size={24}
              color={isDark ? colors.offwhite : colors.gray}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
