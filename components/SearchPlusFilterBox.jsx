import { View, Text, TextInput, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const SearchPlusFilterBox = ({
  isDark,
  colors,
  selectedMonth,
  selectedDay,
  selectedWeek,
  setSelectedMonth,
  setSelectedDay,
  setSelectedWeek,
  searchQuery,
  setSearchQuery,
  openFilterSheet,
}) => {
  return (
    <View>
      {/* Search and Filter Bar */}
      <View
        className="px-6 pt-6 pb-4"
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        <View className="flex-row items-center">
          <View
            className="flex-1 flex-row items-center rounded-lg px-4 py-2 mr-3"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}50`
                : `${colors.primary}10`,
            }}
          >
            <Ionicons
              name="search"
              size={18}
              color={isDark ? colors.offwhite : colors.primaryDark}
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Search tasks..."
              placeholderTextColor={
                isDark ? `${colors.offwhite}80` : `${colors.dark}80`
              }
              className="flex-1"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            className="rounded-lg p-2"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}50`
                : `${colors.primary}10`,
            }}
            onPress={openFilterSheet}
          >
            <Ionicons
              name="filter"
              size={20}
              color={isDark ? colors.offwhite : colors.primaryDark}
            />
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        {(selectedMonth || selectedWeek || selectedDay) && (
          <View className="flex-row flex-wrap mt-3">
            {selectedMonth && (
              <View className="flex-row items-center bg-primary-200 rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="text-white text-sm mr-1">{selectedMonth}</Text>
                <TouchableOpacity onPress={() => setSelectedMonth(null)}>
                  <Ionicons name="close" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
            {selectedWeek && (
              <View className="flex-row items-center bg-primary rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="text-white text-sm mr-1">{selectedWeek}</Text>
                <TouchableOpacity onPress={() => setSelectedWeek(null)}>
                  <Ionicons name="close" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
            {selectedDay && (
              <View className="flex-row items-center bg-primary rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="text-white text-sm mr-1">{selectedDay}</Text>
                <TouchableOpacity onPress={() => setSelectedDay(null)}>
                  <Ionicons name="close" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default SearchPlusFilterBox;
