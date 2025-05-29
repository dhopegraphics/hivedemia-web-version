import { MaterialIcons } from "@expo/vector-icons";
import { Image, View } from "react-native";
import { GiftedChat, Time } from "react-native-gifted-chat";
import InputToolbar from "./InputToolbar";
import MessageBubble from "./MessageBubble";
import QuickReplies from "./QuickReplies";

const ChatMessages = ({
  messages,
  onSend,
  onQuickReply,
  isTyping,
  isDark,
  userId,
  renderCustomView = (props) => {
    if (props.currentMessage.image) {
      return (
        <Image
          source={{ uri: props.currentMessage.image }}
          style={{
            width: 256,
            height: 160,
            borderRadius: 8,
            marginTop: 8,
            marginHorizontal: 16,
          }}
          resizeMode="cover"
        />
      );
    }
    return null;
  },
}) => {
  const renderTime = (props) => {
    return (
      <Time
        {...props}
        timeTextStyle={{
          left: { color: "#6b7280", fontSize: 12 },
          right: {
            color: isDark ? "#042222" : "#e2e8f0",
            fontSize: 12,
            fontFamily: "Jakarta-SemiBold",
          },
        }}
      />
    );
  };




  const renderFooter = () => (
    <>
      {isTyping && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
        
        </View>
      )}
      {messages.length > 0 && messages[0].quickReplies && (
        <QuickReplies
          quickReplies={messages[0].quickReplies}
          onQuickReply={onQuickReply}
        />
      )}
    </>
  );

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: userId }}
      renderBubble={(props) => (
        <MessageBubble props={props} isDark={isDark} userId={userId} />
      )}
      renderTime={renderTime}
      renderInputToolbar={(props) => (
        <InputToolbar props={props} isDark={isDark} />
      )}
      renderCustomView={renderCustomView}
      renderQuickReplies={() => null}
      alwaysShowSend
      scrollToBottom
      scrollToBottomComponent={() => (
        <MaterialIcons name="keyboard-arrow-down" size={24} color="#9ca3af" />
      )}
      bottomOffset={20}
      renderFooter={renderFooter}
      listViewProps={{
        style: { paddingBottom: 16 },
        keyboardDismissMode: "on-drag",
      }}
    />
  );
};

export default ChatMessages;
