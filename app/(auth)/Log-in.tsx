import { supabase } from "@/backend/supabase";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useAuthStore } from "../../backend/store/authStore";
import { colors } from "../../constants/Colors";

const signInSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);

    try {
      console.log("Attempting to sign in with username:", data.username);

      // Step 1: Look up email by username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .ilike("username", data.username.toLowerCase())
        .single();

      if (profileError || !profileData?.email) {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .ilike("username", data.username.toLowerCase());

        if (count === 0) {
          throw new Error("Username not found");
        } else {
          throw new Error("Email not found for username");
        }
      }

      // Step 2: Sign in with email and password
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: profileData.email,
          password: data.password,
        });

      if (authError || !authData?.session) {
        if (authError?.message?.includes("Invalid login credentials")) {
          throw new Error("Invalid password");
        }
        throw new Error(authError?.message || "Authentication failed");
      }

      // ✅ Step 3: Persist session securely using Zustand + SecureStore
      const { setSession } = useAuthStore.getState();
      const { access_token, refresh_token, user, expires_at } =
        authData.session;

      await setSession({
        access_token,
        refresh_token,
        user: {
          id: user.id,
          email: user.email!,
        },
        expires_at: expires_at!,
      });

      // Step 4: Redirect to home screen
      router.replace("/(home)/(tabs)");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to sign in. Please try again.";
      Alert.alert("Error", errorMessage);
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
        <View className="mb-10">
          <Text className="text-3xl dark:text-offwhite font-bold text-slate-700">
            Welcome back
          </Text>
          <Text className="  dark:text-offwhite text-slate-500 mt-2">
            Sign in to your account to continue
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium dark:text-offwhite  text-slate-700 mb-3">
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
                    name="user"
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
                    onChangeText={(text) => onChange(text.toLowerCase())}
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
                    className="flex-1  dark:text-white text-slate-900"
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

          <TouchableOpacity
            onPress={() => router.push("/(auth)/ForgotPassword")}
            className="items-end"
          >
            <Text className="text-primary-100 mb-3 mt-3 font-medium">
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`bg-primary-100 rounded-lg py-4 items-center justify-center ${
              isLoading ? "opacity-70" : ""
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text className="text-white font-medium">Signing in...</Text>
            ) : (
              <Text className="text-white font-medium">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray">Don&apos;t have an account? </Text>
          <Link href="/(auth)" asChild>
            <TouchableOpacity>
              <Text className="text-primary-100 font-medium">Sign up</Text>
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
