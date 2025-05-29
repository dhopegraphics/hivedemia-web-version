import { Bubble } from "react-native-gifted-chat";
import { colors } from "@/constants/Colors";
import MessageText from "./MessageText";

const MessageBubble = ({ props, isDark, userId }) => {
  return (
    <Bubble
      {...props}
      renderMessageText={(messageTextProps) => (
        <MessageText props={messageTextProps} userId={userId} isDark={isDark} />
      )}
      wrapperStyle={{
        left: {
          backgroundColor: isDark ? colors.offwhite : colors.lightGray,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 24,
          borderTopLeftRadius: 4,
          maxWidth: "80%",
        },
        right: {
          backgroundColor: isDark ? colors.primary : colors.dark,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 24,
          borderTopRightRadius: 4,
          maxWidth: "80%",
        },
      }}
      textStyle={{
        left: { color: "#1f2937" },
        right: {
          color: isDark ? colors.dark : colors.white,
          fontFamily: "Jakarta-SemiBold",
        },
      }}
    />
  );
};

export default MessageBubble;
