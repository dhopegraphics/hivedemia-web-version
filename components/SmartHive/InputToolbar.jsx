import {
  InputToolbar as GiftedInputToolbar,
  Composer,
  Send,
} from "react-native-gifted-chat";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { useState } from "react";
import { Platform } from "react-native";

const CustomComposer = (props) => {
  const [composerHeight, setComposerHeight] = useState(40); // default height

  return (
    <Composer
      {...props}
      multiline={true}
      composerHeight={"auto"}
      textInputStyle={{
        backgroundColor: "#f3f4f6",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        color: "#1f2937",
        minHeight: 40,
        maxHeight: 120,
        width: "auto",
        height: Platform.OS === "ios" ? composerHeight : undefined,
      }}
      onContentSizeChange={(e) => {
        if (Platform.OS === "ios") {
          const height = e.nativeEvent.contentSize.height;
          setComposerHeight(Math.min(120, Math.max(40, height)));
        }
      }}
      placeholder="Message Smart Hive..."
    />
  );
};

const CustomSend = (props) => {
  return (
    <Send
      {...props}
      containerStyle={{
        justifyContent: "center",
        paddingLeft: 8,
        paddingRight: 4,
      }}
    >
      <Ionicons name="send" size={24} color={colors.primary} />
    </Send>
  );
};

const InputToolbar = ({ props, isDark }) => {
  return (
    <GiftedInputToolbar
      {...props}
      renderComposer={(composerProps) => <CustomComposer {...composerProps} />}
      renderSend={(sendProps) => <CustomSend {...sendProps} />}
      containerStyle={{
        backgroundColor: isDark ? colors.darkLight : colors.offwhite,
        borderTopWidth: 1,
        borderTopColor: isDark ? colors.primary : colors.dark,
        paddingVertical: 10,
        paddingBottom: "7%",
        width: "100%",
        height: "auto",
      }}
    />
  );
};

export default InputToolbar;
