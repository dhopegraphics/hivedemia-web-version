// components/TabsPublicHeader.js
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TextInput, TouchableOpacity, View } from "react-native";

const TabsPublicHeader = ({ isDark, colors, onSearch , HeaderName }) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputWidth = useRef(new Animated.Value(0)).current;

  const toggleSearch = () => {
    setSearchVisible((prev) => !prev);
  };

  useEffect(() => {
    Animated.timing(inputWidth, {
      toValue: searchVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [searchVisible , inputWidth]);

  const interpolatedWidth = inputWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // Change width as needed
  });

  return (
    <View className="px-6 pt-20 pb-4 w-[100%]" style={{ backgroundColor: isDark ? colors.primaryDark : colors.primary }}>
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold" style={{ color: colors.white }}>
         {HeaderName}
        </Text>

        <View className="flex-row items-center space-x-2">
          <Animated.View style={{ width: interpolatedWidth, overflow: "hidden" }}>
            <TextInput
              placeholder="Search"
              placeholderTextColor="#ccc"
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                onSearch?.(text);
              }}
              style={{
                color: "white",
                borderBottomWidth: 1,
                borderColor: "#fff",
                paddingHorizontal: 8,
                height: 40,
              }}
            />
          </Animated.View>

          <TouchableOpacity onPress={toggleSearch}>
            <Ionicons name="search" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TabsPublicHeader;