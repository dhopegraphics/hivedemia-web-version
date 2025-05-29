import { View, ScrollView, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";

const TabNavigation = ({ tabs, activeTab, setActiveTab, isDark }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      {tabs.map((tab) => (
        <View key={tab.key}>
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`px-4 py-3 h-16 items-center ${
              activeTab === tab.key ? "border-b-2" : ""
            }`}
            style={{
              borderBottomColor:
                activeTab === tab.key ? colors.primary : "transparent",
              backgroundColor: isDark ? colors.dark : colors.light,
            }}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={
                activeTab === tab.key
                  ? colors.primary
                  : isDark
                  ? colors.offwhite
                  : colors.dark
              }
            />
            <Text
              style={{
                color: activeTab === tab.key ? colors.primary : colors.offwhite,
              }}
              className={`text-xs mt-1 ${
                activeTab === tab.key
                  ? "text-primary-100 font-semibold"
                  : isDark
                  ? "text-offwhite"
                  : "text-dark"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default TabNavigation;
