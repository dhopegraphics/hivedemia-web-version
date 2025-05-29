import { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  Dimensions,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { colors } from "@/constants/Colors";

const MAX_HEIGHT = Dimensions.get("window").height * 0.4;

const MessageText = ({ props, userId, isDark }) => {
  const isUser = props.currentMessage.user._id === userId;
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  if (isUser) {
    return (
      <Text style={[props.textStyle[props.position]]}>
        {props.currentMessage.text}
      </Text>
    );
  }

  return (
    <>
      <TouchableOpacity onPress={openModal} activeOpacity={0.8}>
        <View style={{ maxHeight: MAX_HEIGHT, width: "100%" }}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <Markdown style={markdownStyle(props.position)}>
              {props.currentMessage.text}
            </Markdown>
          </ScrollView>
          <View>
            <Text className="text-gray-600 font-Jakarta ">
              Tap to View full text
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        onRequestClose={closeModal}
        animationType="slide"
        transparent={false}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? colors.offwhite : colors.offwhite },
          ]}
        >
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Markdown style={markdownStyle(props.position)}>
              {props.currentMessage.text}
            </Markdown>
          </ScrollView>
          <Text onPress={closeModal} style={styles.closeText}>
            Close
          </Text>
        </View>
      </Modal>
    </>
  );
};

const markdownStyle = (position) => ({
  body: {
    color: position === "left" ? "#1f2937" : "white",
    fontSize: 16,
    fontFamily: "Jakarta-SemiBold",
  },
  paragraph: { marginVertical: 4 },
  code_block: {
    backgroundColor: position === "left" ? "#e5e7eb" : "#374151",
    padding: 8,
    borderRadius: 4,
    fontFamily: "Jakarta-SemiBold",
  },
  link: {
    color: position === "left" ? colors.primary : colors.offwhite,
    textDecorationLine: "underline",
  },
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 48,
  },
  closeText: {
    textAlign: "center",
    padding: 16,
    color: colors.primary,
    fontWeight: "bold",
  },
});

export default MessageText;
