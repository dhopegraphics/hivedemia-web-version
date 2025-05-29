import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
  Switch,
} from "react-native";
import {
  MaterialIcons,
  FontAwesome,
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { Camera } from "expo-camera";

export default function PrivacyPermissionsScreen() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [storageEnabled, setStorageEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const openLink = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <View className="flex-1 bg-white p-6 w-[100%]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-8">
          <View className="bg-indigo-100 p-4 rounded-full mb-4">
            <MaterialIcons name="privacy-tip" size={32} color="#4f46e5" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Privacy & Permissions
          </Text>
          <Text className="text-lg text-gray-600 text-center">
            We value your privacy. Here's how we protect your data and what we
            need to make Hivedemia work for you.
          </Text>
        </View>

        {/* Terms and Conditions */}
        <View className="mb-8 p-4 bg-indigo-50 rounded-lg">
          <View className="flex-row items-center mb-4">
            <MaterialIcons name="gavel" size={24} color="#4f46e5" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Terms & Policies
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() =>
                router.push("/termsAndconditions/PrivacyPolicyScreen")
              }
              className="flex-row items-center"
            >
              <Feather name="file-text" size={20} color="#4f46e5" />
              <Text className="text-indigo-600 ml-2">Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() =>
                router.push("/termsAndconditions/TermsOfServiceScreen")
              }
              className="flex-row items-center"
            >
              <Feather name="file-text" size={20} color="#4f46e5" />
              <Text className="text-indigo-600 ml-2">Terms & Conditions</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-4 flex-row items-start">
            <TouchableOpacity
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              className="mr-3"
            >
              <Ionicons
                name={acceptedTerms ? "checkbox-outline" : "square-outline"}
                size={24}
                color={acceptedTerms ? "#4f46e5" : "#9ca3af"}
              />
            </TouchableOpacity>
            <Text className="flex-1 text-gray-700">
              I agree to Hivedemia's Terms & Conditions and Privacy Policy
            </Text>
          </View>
        </View>

        {/* Permissions Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <MaterialIcons
              name="perm-device-information"
              size={24}
              color="#4f46e5"
            />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              App Permissions
            </Text>
          </View>

          {/* Camera Permission */}
          <View className="flex-row  items-center p-4 bg-gray-50 rounded-lg mb-3">
            <View className="flex-row items-center">
              <FontAwesome name="camera" size={20} color="#4f46e5" />
              <View className="ml-3 w-[70%]">
                <Text className="font-medium text-gray-900">Camera Access</Text>
                <Text className="text-sm text-gray-600">
                  Scan handwritten problems or upload photos to SmartHive AI
                </Text>
              </View>
            </View>
            <Switch
              value={cameraEnabled}
              onValueChange={async (value) => {
                if (value) {
                  const { status } =
                    await Camera.requestCameraPermissionsAsync();
                  if (status === "granted") {
                    setCameraEnabled(true);
                  } else {
                    setCameraEnabled(false);
                    alert(
                      "Camera permission is required to enable this feature."
                    );
                  }
                } else {
                  // "Revoke" or unset camera state
                  setCameraEnabled(false);
                }
              }}
              trackColor={{ false: "#e5e7eb", true: "#a5b4fc" }}
              thumbColor={cameraEnabled ? "#4f46e5" : "#f3f4f6"}
            />
          </View>

          {/* Storage Permission */}
          <View className="flex-row justify-between items-center p-4 bg-gray-50 rounded-lg mb-3">
            <View className="flex-row items-center">
              <MaterialIcons name="storage" size={20} color="#4f46e5" />
              <View className="ml-3">
                <Text className="font-medium text-gray-900">
                  Storage Access
                </Text>
                <Text className="text-sm text-gray-600">
                  Upload documents, PDFs, and recorded lessons for AI analysis
                </Text>
              </View>
            </View>
            <Switch
              value={storageEnabled}
              onValueChange={setStorageEnabled}
              trackColor={{ false: "#e5e7eb", true: "#a5b4fc" }}
              thumbColor={storageEnabled ? "#4f46e5" : "#f3f4f6"}
            />
          </View>

          {/* Microphone Permission */}
          <View className="flex-row justify-between items-center p-4 bg-gray-50 rounded-lg mb-3">
            <View className="flex-row items-center">
              <FontAwesome name="microphone" size={20} color="#4f46e5" />
              <View className="ml-3">
                <Text className="font-medium text-gray-900">
                  Microphone Access
                </Text>
                <Text className="text-sm text-gray-600">
                  Optional: For future voice commands with SmartHive AI
                </Text>
              </View>
            </View>
            <Switch
              value={microphoneEnabled}
              onValueChange={setMicrophoneEnabled}
              trackColor={{ false: "#e5e7eb", true: "#a5b4fc" }}
              thumbColor={microphoneEnabled ? "#4f46e5" : "#f3f4f6"}
            />
          </View>

          {/* Location Permission */}
          <View className="flex-row justify-between items-center p-4 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <MaterialIcons name="location-on" size={20} color="#4f46e5" />
              <View className="ml-3">
                <Text className="font-medium text-gray-900">
                  Location Access
                </Text>
                <Text className="text-sm text-gray-600">
                  Optional: For personalized scheduling based on your timezone
                </Text>
              </View>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: "#e5e7eb", true: "#a5b4fc" }}
              thumbColor={locationEnabled ? "#4f46e5" : "#f3f4f6"}
            />
          </View>
        </View>

        {/* Privacy Commitments */}
        <View className="p-4 bg-indigo-50 rounded-lg">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="verified-user" size={24} color="#4f46e5" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Our Privacy Commitments
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#10b981"
              className="mt-1"
            />
            <Text className="ml-2 text-gray-700 flex-1">
              We never sell your data to third parties
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#10b981"
              className="mt-1"
            />
            <Text className="ml-2 text-gray-700 flex-1">
              SmartHive AI processes your uploads securely with encryption
            </Text>
          </View>

          <View className="flex-row items-start">
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#10b981"
              className="mt-1"
            />
            <Text className="ml-2 text-gray-700 flex-1">
              You can delete your data at any time from Settings
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity
        disabled={!acceptedTerms}
        onPress={() => {
          if (acceptedTerms) {
            router.replace("/(auth)");
          }
        }}
        className={`p-4 rounded-lg mt-4 ${
          acceptedTerms ? "bg-indigo-600" : "bg-gray-300"
        }`}
      >
        <Text className="text-center text-white font-medium">
          {acceptedTerms
            ? "Continue to Hivedemia"
            : "Please Accept Terms to Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
