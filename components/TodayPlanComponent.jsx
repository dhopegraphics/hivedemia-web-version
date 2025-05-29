import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TodayPlanComponent = ({
  plans,
  onTaskToggle,
  isDark,
  colors,
  AiSuggestion,
  MoreOptionsToggle,
}) => {
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
          No Plans For Today ?
        </Text>
      </View>
    );
  }

  // Get today's date and format it as "dayOfWeek, month day, year" (e.g., "Tuesday, December 5, 2025")
  const today = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const todayDate = new Intl.DateTimeFormat("en-US", options).format(today);

  // Filter plans to include only those that match today's formatted date
  const todayPlans = plans?.filter((plan) => plan.date === todayDate);

  return (
    <>
      {/* Today's Focus */}
      <ScrollView className="flex-1 px-6 pt-6">
        {todayPlans?.map((plan, index) => (
          <View key={index}>
            {/* Today's Tasks */}
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? colors.offwhite : colors.dark },
              ]}
            >
              {plan.date}
            </Text>
            <View style={styles.focusContainer}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={colors.primary}
                style={styles.focusIcon}
              />
              <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                <Text style={styles.focusLabel}>Focus: </Text>
                {plan.focus}
              </Text>
            </View>

            <View style={styles.taskContainer}>
              {plan?.tasks?.map((task) => (
                <TouchableOpacity
                  key={task.task_id}
                  style={[
                    styles.taskItem,
                    {
                      backgroundColor: isDark
                        ? `${colors.primaryDark}80`
                        : colors.white,
                      borderBottomColor: isDark
                        ? `${colors.primary}20`
                        : `${colors.primary}10`,
                    },
                  ]}
                  onPress={() => onTaskToggle(plan.plan_id, task.task_id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      task.completed ? styles.checkedBox : styles.uncheckedBox,
                    ]}
                  >
                    {task.completed && (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    )}
                  </View>
                  <View style={styles.taskContent}>
                    <Text
                      className={`text-base font-medium  ${
                        task.completed ? "line-through" : ""
                      }`}
                      style={[
                        styles.taskTitle,
                        { color: isDark ? colors.offwhite : colors.dark },
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text
                      style={{
                        color: isDark
                          ? `${colors.offwhite}80`
                          : `${colors.dark}80`,
                      }}
                    >
                      {task.duration}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) =>
                      MoreOptionsToggle(plan.plan_id, task.task_id, e)
                    }
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={18}
                      color={isDark ? colors.offwhite : colors.dark}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* AI Suggestions */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? colors.offwhite : colors.dark, marginTop: 20 },
          ]}
        >
          AI Study Suggestions
        </Text>

        <View style={styles.suggestionContainer}>
          {AiSuggestion.map((suggestion, index) => (
            <View
              key={index}
              style={[
                styles.suggestionItem,
                {
                  backgroundColor: isDark
                    ? `${colors.primaryDark}80`
                    : colors.white,
                  borderBottomColor: isDark
                    ? `${colors.primary}20`
                    : `${colors.primary}10`,
                },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={14}
                color={colors.primary}
                style={styles.suggestionIcon}
              />
              <Text
                style={{
                  color: isDark ? colors.offwhite : colors.dark,
                  flexWrap: 1,
                }}
              >
                {suggestion?.suggestion_message}
              </Text>
            </View>
          ))}
        </View>
        <View className="mb-32" />
      </ScrollView>
    </>
  );
};

const styles = {
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  focusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  focusIcon: {
    marginRight: 8,
  },
  focusLabel: {
    fontWeight: "600",
  },
  replanButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  replanButtonText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  taskContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#00DF82",
    borderColor: "#00DF82",
  },
  uncheckedBox: {
    borderWidth: 2,
    borderColor: "#9E9E9E",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: "500",
    marginBottom: 4,
  },
  suggestionContainer: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: 8,
  },
};

export default TodayPlanComponent;
