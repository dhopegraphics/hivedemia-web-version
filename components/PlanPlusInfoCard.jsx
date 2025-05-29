import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const PlanPlusInfoCard = ({
  plan,
  tasks,
  isDark,
  colors,
  onTaskToggle,
  MoreOptionsToggle,
  handlePlanDelete,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const completionPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <View>
      <View className="flex-row justify-between">
        <View>
          <Text
            className="text-lg font-bold mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            {plan.date}
          </Text>
          <Text
            className="text-sm mb-4"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            {plan.focus}
          </Text>
        </View>
        <View>
          <TouchableOpacity onPress={() => handlePlanDelete(plan)}>
            <Text className=" dark:text-primary-100  text-white">
              Delete Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="rounded-xl overflow-hidden shadow mb-4">
        {tasks.length > 0 ? (
          <>
            {tasks.map((task) => (
              <View key={task.task_id}>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-4 border-b"
                  style={{
                    backgroundColor: isDark
                      ? `${colors.primaryDark}80`
                      : colors.white,
                    borderBottomColor: isDark
                      ? `${colors.primary}20`
                      : `${colors.primary}10`,
                  }}
                  onPress={() => onTaskToggle(plan.plan_id, task.task_id)}
                  activeOpacity={0.9}
                >
                  <View
                    className="justify-center items-center mr-3"
                    style={[
                      {
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                      },
                      task.completed
                        ? {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          }
                        : { borderWidth: 2, borderColor: "#9E9E9E" },
                    ]}
                  >
                    {task.completed && (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`text-base font-medium mb-1 ${
                        task.completed ? "line-through" : ""
                      }`}
                      style={{
                        color: isDark ? colors.offwhite : colors.dark,
                      }}
                    >
                      {task.title}
                    </Text>
                    <Text
                      style={{
                        alignItems: "center",
                        color: isDark
                          ? `${colors.offwhite}80`
                          : `${colors.dark}80`,
                        justifyContent: "center",
                        alignContent: "center",
                      }}
                    >
                      {task.duration}

                      {task.important && (
                        <MaterialIcons
                          name="star"
                          size={18}
                          color="#F59E0B"
                          style={{ marginLeft: 8 }}
                        />
                      )}
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
              </View>
            ))}

            {/* ✅ Progress bar shown once at the bottom */}
            <View
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryDark}80`
                  : colors.white,
              }}
              className="px-4 pt-4 pb-2"
            >
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full"
                  style={{
                    width: `${completionPercentage}%`,
                    backgroundColor:
                      completionPercentage >= 100 ? "#10B981" : colors.primary,
                  }}
                />
              </View>
              <Text
                className="text-xs mt-2 text-right"
                style={{ color: isDark ? "#999" : "#666" }}
              >
                {completedTasks} of {totalTasks} tasks completed
              </Text>
            </View>
          </>
        ) : (
          <View
            className="px-4 py-8 items-center"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
            }}
          >
            <Ionicons
              name="search"
              size={32}
              color={isDark ? colors.offwhite : colors.dark}
              style={{ opacity: 0.5 }}
            />
            <Text
              className="mt-2"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              No tasks found
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default PlanPlusInfoCard;
