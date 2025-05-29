// InputToolbar.js
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View, } from 'react-native';
import { Actions, Composer, InputToolbar, Send } from 'react-native-gifted-chat';



export const CustomInputToolbar = (props) => (

  <InputToolbar
    {...props}
    containerStyle={{
      backgroundColor: 'white',
      borderTopColor: '#e5e7eb',
      paddingHorizontal: 8,
      paddingVertical: 8,
    }}
  />
);

export const CustomComposer = (props) => (
  <Composer
    {...props}
    textInputStyle={{
      backgroundColor: '#f3f4f6',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginLeft: 8,
      color: '#111827',
    }}
    placeholder="Type your question..."
  />
);

export const CustomSend = (props) => (
  <Send
    {...props}
    containerStyle={{
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
    }}
  >
    <TouchableOpacity className="bg-indigo-500 rounded-full p-2 ml-2">
      <Ionicons name="send" size={20} className="text-white" />
    </TouchableOpacity>
  </Send>
);

export const CustomActions = (props) => (
  <Actions
    {...props}
    containerStyle={{
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <TouchableOpacity className="p-2">
      <FontAwesome name="microphone" size={24} className="text-gray-600" />
    </TouchableOpacity>
  </Actions>
);

export const CustomQuickReplies = (props) => {
  if (!props.currentMessage.quickReplies) return null;

  return (
    <View className="mt-2 px-4">
      <View className="flex-row flex-wrap">
        {props.currentMessage.quickReplies.values.map((reply, index) => (
          <TouchableOpacity
            key={index}
            className="bg-indigo-100 rounded-full px-3 py-2 mr-2 mb-2"
            onPress={() => props.onQuickReply({ reply })}
          >
            <Text className="text-indigo-700 text-sm">{reply.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};