import { View, Text, ActivityIndicator } from "react-native";
import useGroupsStore from "@/backend/store/groupsStore";

const BootLoadingScreen = ({ colors, isDark }) => {
  const { initialization } = useGroupsStore();

  if (initialization.status === "done") return null;

  return (
    <View
      className="flex-1 justify-center self-center items-center"
      style={{ backgroundColor: isDark ? colors.backgroundDark : colors.white }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text
        className="mt-4 text-lg font-bold"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        {initialization.message}
      </Text>
    </View>
  );
};

export default BootLoadingScreen;
