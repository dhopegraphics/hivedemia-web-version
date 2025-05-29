import { View, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DurationPicker from "../DurationPIcker";

const RenderTaskFields = ({
  formData,
  handleInputChange,
  handleDurationChange,
  isDark,
  colors,
}) => (
  <>
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className="flex-row items-center  rounded-lg px-4 py-3 mb-4 shadow-sm"
    >
      <MaterialIcons
        name="title"
        size={20}
        color={isDark ? colors.white : colors.dark}
        className="mr-3"
      />
      <TextInput
        placeholder="Task Todo-Message"
        value={formData.title}
        onChangeText={(text) => handleInputChange("title", text)}
        className="flex-1 dark:text-white text-gray-800"
        placeholderTextColor={isDark ? colors.offwhite : colors.dark}
      />
    </View>

    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className="flex-row items-center  rounded-lg px-4 py-3 mb-4 shadow-sm"
    >
      <MaterialIcons
        name="access-time"
        size={20}
        color={isDark ? colors.white : colors.dark}
        className="mr-3"
      />
      <DurationPicker
        duration={formData.duration}
        isDark={isDark}
        onChange={(newDate) => handleDurationChange(null, newDate)}
      />
    </View>
  </>
);

export default RenderTaskFields;
