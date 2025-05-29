import React from "react";
import { View, TouchableOpacity, Text, Pressable } from "react-native";
import { colors } from "@/constants/Colors";

const OptionsMenu = ({
  menuVisible,
  setMenuVisible,
  menuPosition,
  isDark,
  handleCreateSession,
  handleOpenSession,
  handleClearChat,
  handleDeleteChat,
}) => {
  if (!menuVisible) return null;

  return (
    <Pressable
      onPress={() => setMenuVisible(false)}
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: menuPosition.top,
          left: menuPosition.left,
          backgroundColor: isDark ? colors.dark : "white",
          borderRadius: 8,
          elevation: 5,
          padding: 10,
          width: 160,
        }}
      >
        {[
          { label: "➕ New Session", action: handleCreateSession },
          { label: "📂 Open Session", action: handleOpenSession },
          { label: "🧹 Clear Chat", action: handleClearChat },
          { label: "🗑️ Delete Chat", action: handleDeleteChat },
        ].map(({ label, action }, index) => (
          <TouchableOpacity
            key={index}
            onPress={action}
            style={{ paddingVertical: 8 }}
          >
            <Text style={{ color: isDark ? "white" : "black" }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  );
};

export default OptionsMenu;