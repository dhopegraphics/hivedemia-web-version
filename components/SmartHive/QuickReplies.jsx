import { View, Text, TouchableOpacity } from "react-native";
import { colors } from "@/constants/Colors";

const QuickReplies = ({ quickReplies, onQuickReply }) => {
  if (
    !quickReplies ||
    !quickReplies.values ||
    quickReplies.values.length === 0
  ) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
        marginHorizontal: 16,
      }}
    >
      {quickReplies.values.map((reply, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onQuickReply(reply)}
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginRight: 8,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 14 }}>
            {reply.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default QuickReplies;
