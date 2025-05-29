import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors } from "@/constants/Colors";

const ChatHeader = ({ isDark, optionsButtonRef, handleMoreOptions }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? colors.primary : colors.dark,
        backgroundColor: isDark ? colors.dark : colors.light,
        position: "relative",
        zIndex: 10,
      }}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={isDark ? colors.primary : colors.dark}
        />
      </TouchableOpacity>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>SH</Text>
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? colors.primary : colors.dark,
          }}
        >
          Smart Hive
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: 8,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              backgroundColor: "#10b981",
              borderRadius: 4,
              marginRight: 4,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              color: isDark ? colors.offwhite : colors.gray,
            }}
          >
            Online
          </Text>
        </View>
      </View>
      <TouchableOpacity ref={optionsButtonRef} onPress={handleMoreOptions}>
        <Ionicons
          name="ellipsis-vertical"
          size={24}
          color={isDark ? colors.primary : colors.dark}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ChatHeader;
