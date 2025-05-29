
import { View, Text } from 'react-native';
import { Time } from 'react-native-gifted-chat';

const MessageBubble = (props) => {
  const isAI = props.currentMessage.user._id === 2;
  
  return (
    <View className={`mb-2 ${isAI ? 'items-start' : 'items-end'}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${
          isAI ? 'bg-gray-100' : 'bg-indigo-500'
        }`}
      >
        <Text className={isAI ? 'text-gray-900' : 'text-white'}>
          {props.currentMessage.text}
        </Text>
      </View>
      <Time
        {...props}
        timeTextStyle={{
          left: { color: 'gray', fontSize: 12 },
          right: { color: 'gray', fontSize: 12 },
        }}
        containerStyle={{
          left: { marginTop: 4, marginLeft: 4 },
          right: { marginTop: 4, marginRight: 4 },
        }}
      />
    </View>
  );
};

export default MessageBubble;