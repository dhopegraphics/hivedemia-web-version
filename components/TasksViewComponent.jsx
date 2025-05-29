import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { days, months, weeks } from "../constants/calenderFilter";
import PlanPlusInfoCard from "./PlanPlusInfoCard";
import Re_Plan_ScheduleCard from "./Re_Plan_ScheduleCard";
import SearchPlusFilterBox from "./SearchPlusFilterBox";

const TasksViewComponent = ({
  plans,
  onTaskToggle,
  MoreOptionsToggle,
  isMenuVisible,
  setIsMenuVisible,
  ReplanSchedule,
  handlePlanDelete,
  colors,
  isDark,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedWeekday, setSelectedWeekday] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null); // Optional

  // Bottom sheet ref
  const bottomSheetRef = useRef(null);

  // Variables
  const snapPoints = useMemo(() => ["75%", "90%"], []);

  // Callbacks
  const handleSheetChanges = useCallback((index) => {
    console.log("handleSheetChanges", index);
  }, []);

  if (!plans || plans.length === 0) {
    return (
      <View className="items-center mt-40 justify-center my-10">
        <Image
          source={require("@/assets/images/electric-shock.png")}
          className="w-48 h-48 mb-6"
        />
        <Ionicons
          name="calendar-outline"
          size={40}
          color={isDark ? colors.offwhite : colors.dark}
        />
        <Text
          className="mt-2 font-JakartaBold text-base"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          No Plans Yet ?
        </Text>
      </View>
    );
  }

  const openFilterSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeFilterSheet = () => {
    bottomSheetRef.current?.close();
  };
  const normalizedSelectedDay = selectedDay ? parseInt(selectedDay) : null;

  const filteredPlans = plans.filter((plan) => {
    const dateString = plan.date; // Example: "Tuesday , December 5 , 2025"
    if (!dateString) return false;

    const [weekday, monthDay, year] = dateString
      .split(",")
      .map((s) => s.trim());
    const [monthName, dayNumber] = monthDay.split(" "); // "December 5"
    const dayNumberInt = parseInt(dayNumber);

    // Match checks
    const matchesMonth = !selectedMonth || monthName === selectedMonth;
    const matchesDay =
      !normalizedSelectedDay || dayNumberInt === normalizedSelectedDay;
    const matchesWeekday =
      !selectedWeekday ||
      weekday.toLowerCase() === selectedWeekday.toLowerCase();
    const matchesYear = !selectedYear || year === selectedYear;

    // 🧮 Calculate the week of the month for this day
    let weekOfMonth = null;
    if (dayNumberInt <= 7) weekOfMonth = "Week 1";
    else if (dayNumberInt <= 14) weekOfMonth = "Week 2";
    else if (dayNumberInt <= 21) weekOfMonth = "Week 3";
    else if (dayNumberInt <= 28) weekOfMonth = "Week 4";
    else weekOfMonth = "Week 5";

    const matchesWeek = !selectedWeek || selectedWeek === weekOfMonth;

    return (
      matchesMonth && matchesDay && matchesWeek && matchesWeekday && matchesYear
    );
  });
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setSelectedWeek(null);
    setSelectedDay(null);
  };

  const handleWeekSelect = (week) => {
    setSelectedWeek(week);
    if (!selectedMonth) {
      const currentMonth = new Date().getMonth();
      setSelectedMonth(months[currentMonth]);
    }
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    if (!selectedMonth) {
      const currentMonth = new Date().getMonth();
      setSelectedMonth(months[currentMonth]);
    }
  };

  const clearFilters = () => {
    setSelectedMonth(null);
    setSelectedWeek(null);
    setSelectedDay(null);
    closeFilterSheet();
    setSelectedWeekday(null);
    setSelectedYear(null);
  };

  const applyFilters = () => {
    closeFilterSheet();
  };

  const renderFilterContent = () => (
    <BottomSheetView
      style={{
        flex: 1,
        backgroundColor: isDark ? colors.primaryDark : colors.white,
        paddingHorizontal: 24,
        paddingTop: 16,
      }}
    >
      <View className="flex-row justify-between items-center mb-6">
        <Text
          className="text-xl font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Filter Tasks
        </Text>
        <TouchableOpacity onPress={closeFilterSheet}>
          <Ionicons
            name="close"
            size={24}
            color={isDark ? colors.offwhite : colors.dark}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Filter */}
        <View className="mb-6">
          <Text
            className="font-medium mb-3"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Month
          </Text>
          <View className="flex-row flex-wrap">
            {months.map((month) => {
              const isSelected = selectedMonth === month;
              const bgClass = isSelected ? "bg-primary" : "bg-gray-200";
              const textClass = isSelected
                ? "text-white"
                : isDark
                ? "text-gray-400"
                : "text-gray-700";

              return (
                <TouchableOpacity
                  key={month}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${bgClass}`}
                  onPress={() => handleMonthSelect(month)}
                >
                  <Text className={textClass}>{month.substring(0, 3)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Week Filter */}
        <View className="mb-6">
          <Text
            className="font-medium mb-3"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Week
          </Text>
          <View className="flex-row flex-wrap">
            {weeks.map((week) => (
              <TouchableOpacity
                key={week}
                className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                  selectedWeek === week ? "bg-primary" : "bg-gray-200"
                }`}
                onPress={() => handleWeekSelect(week)}
                disabled={!selectedMonth}
                style={{ opacity: !selectedMonth ? 0.5 : 1 }}
              >
                <Text
                  className={
                    selectedWeek === week
                      ? "text-white"
                      : isDark
                      ? "text-gray-500"
                      : "text-gray-700"
                  }
                >
                  {week}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Day Filter */}
        <View className="mb-6">
          <Text
            className="font-medium mb-3"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Day
          </Text>
          <View className="flex-row flex-wrap">
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                  selectedDay === day ? "bg-primary" : "bg-gray-200"
                }`}
                onPress={() => handleDaySelect(day)}
                style={{ opacity: !selectedMonth ? 0.5 : 1 }}
              >
                <Text
                  className={
                    selectedDay === day
                      ? "text-white"
                      : isDark
                      ? "text-gray-400"
                      : "text-gray-700"
                  }
                >
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="flex-row justify-between mt-4 mb-8">
          <TouchableOpacity
            className="px-6 py-3 rounded-md"
            style={{
              backgroundColor: isDark ? colors.dark : `${colors.primary}20`,
            }}
            onPress={clearFilters}
          >
            <Text
              style={{ color: isDark ? colors.offwhite : colors.primaryDark }}
            >
              Clear Filters
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-6 py-3 rounded-md"
            style={{ backgroundColor: colors.primary }}
            onPress={applyFilters}
          >
            <Text style={{ color: colors.white }}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
        <View className="mb-32" />
      </ScrollView>
    </BottomSheetView>
  );

  const renderPlanItem = ({ item: plan }) => {
    const planFilteredTasks = (plan.tasks || []).filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    return (
      <PlanPlusInfoCard
        plan={plan}
        isDark={isDark}
        colors={colors}
        tasks={planFilteredTasks} // <-- now only send the plan's own filtered tasks
        onTaskToggle={onTaskToggle}
        MoreOptionsToggle={MoreOptionsToggle}
        handlePlanDelete={handlePlanDelete}
      />
    );
  };

  const renderPlansHeader = () => {
    const completedPlans = plans?.filter((plan) => {
      if (!plan.tasks || plan.tasks.length === 0) return false; // no tasks means not complete
      return plan.tasks.every((task) => task.completed); // every task must be completed
    });

    // If you have a date/timestamp field, sort by that to get the last completed plan
    const sortedCompletedPlans = completedPlans.sort((a, b) => {
      const dateA = new Date(a.date); // Convert to Date object for sorting
      const dateB = new Date(b.date);
      return dateB - dateA; // Sort in descending order (most recent first)
    });

    // Get the last completed plan (i.e., the last completed plan based on sorting or appearance)
    const lastCompletedPlan = sortedCompletedPlans[0]; // Now the most recent one

    return (
      <View>
        {lastCompletedPlan && (
          <View className="mb-4">
            <Re_Plan_ScheduleCard
              plan={lastCompletedPlan}
              isDark={isDark}
              colors={colors}
              ReplanSchedule={ReplanSchedule}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (isMenuVisible) {
          setIsMenuVisible(false); // Close the menu if visible
        }
        Keyboard.dismiss(); // Optionally dismiss keyboard too
      }}
    >
      <View className="flex-1">
        <SearchPlusFilterBox
          searchQuery={searchQuery}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          selectedWeek={selectedWeek}
          setSearchQuery={setSearchQuery}
          setSelectedDay={setSelectedDay}
          setSelectedMonth={setSelectedMonth}
          setSelectedWeek={setSelectedWeek}
          isDark={isDark}
          colors={colors}
          openFilterSheet={openFilterSheet}
        />

        <FlatList
          data={filteredPlans}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderPlanItem}
          ListHeaderComponent={renderPlansHeader}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128 }}
        />

        {/* Bottom Sheet for Filters */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={true}
          backgroundStyle={{
            backgroundColor: isDark ? colors.primaryDark : colors.white,
          }}
          handleIndicatorStyle={{
            backgroundColor: isDark ? colors.offwhite : colors.dark,
          }}
        >
          {renderFilterContent()}
        </BottomSheet>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default TasksViewComponent;
