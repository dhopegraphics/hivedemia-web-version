import {
  View,
  TextInput,
  Modal,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";

const RenderExamFields = ({
  formData,
  handleInputChange,
  isDark,
  colors,
  courses,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleSelectCourse = (course) => {
    handleInputChange("course", course.title);
    handleInputChange("code", course.code);
    setModalVisible(false);
  };
  return (
    <>
      <View
        style={{ backgroundColor: isDark ? colors.darkLight : colors.white }}
        className="flex-row items-center rounded-lg px-4 py-3 mb-4 shadow-sm"
      >
        <MaterialIcons
          name="class"
          size={20}
          color={isDark ? colors.offwhite : colors.gray}
          className="mr-3"
        />
        <TextInput
          placeholder="Course Name"
          value={formData.course}
          onChangeText={(text) => handleInputChange("course", text)}
          className="flex-1 font-JakartaMedium"
          style={{ color: isDark ? colors.offwhite : colors.gray }}
          placeholderTextColor={isDark ? colors.offwhite : colors.gray}
        />
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <MaterialIcons
            name="arrow-drop-down-circle"
            size={24}
            color={isDark ? colors.offwhite : colors.gray}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>

      <View
        style={{ backgroundColor: isDark ? colors.darkLight : colors.white }}
        className="flex-row items-center  rounded-lg px-4 py-3 mb-4 shadow-sm"
      >
        <MaterialIcons
          color={isDark ? colors.offwhite : colors.gray}
          name="code"
          size={20}
          className="mr-3"
        />
        <TextInput
          placeholder="Course Code"
          value={formData.code}
          onChangeText={(text) => handleInputChange("code", text)}
          className="flex-1 font-JakartaMedium "
          style={{ color: isDark ? colors.offwhite : colors.gray }}
          placeholderTextColor={isDark ? colors.offwhite : colors.gray}
        />
      </View>

      <View
        style={{ backgroundColor: isDark ? colors.darkLight : colors.white }}
        className="flex-row items-center rounded-lg px-4 py-3 mb-4 shadow-sm"
      >
        <MaterialIcons
          name="location-on"
          size={20}
          className="mr-3"
          color={isDark ? colors.offwhite : colors.gray}
        />
        <TextInput
          placeholder="Location (Building/Room)"
          value={formData.location}
          onChangeText={(text) => handleInputChange("location", text)}
          className="flex-1 font-JakartaMedium"
          style={{ color: isDark ? colors.offwhite : colors.gray }}
          placeholderTextColor={isDark ? colors.offwhite : colors.gray}
        />
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? colors.darkLight : colors.white,
              borderRadius: 12,
              width: "85%",
              maxHeight: "60%",
              padding: 16,
            }}
          >
            <Text
              style={{
                color: isDark ? colors.offwhite : colors.dark,
                fontWeight: "bold",
                fontSize: 16,
                marginBottom: 12,
              }}
            >
              Select Course
            </Text>
            <FlatList
              data={courses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectCourse(item)}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? colors.dark : "#eee",
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? colors.offwhite : colors.dark,
                      fontSize: 15,
                    }}
                  >
                    {item.title} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 16, alignSelf: "flex-end" }}
            >
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default RenderExamFields;
