import { View, Text, TouchableOpacity } from 'react-native';

const CourseCard = ({ code, name, progress, isDark }) => {
  return (
    <TouchableOpacity 
      className={`p-4 mb-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {code}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
          {progress}% complete
        </Text>
      </View>
      <Text className={`${isDark ? 'text-offwhite' : 'text-gray-600'}`}>
        {name}
      </Text>
      <View className={`mt-3 h-2 rounded-full ${isDark ? 'bg-offwhite' : 'bg-gray'}`}>
        <View 
          className="h-2 rounded-full bg-green-500" 
          style={{ width: `${progress}%` }}
        />
      </View>
    </TouchableOpacity>
  );
};

export default CourseCard;