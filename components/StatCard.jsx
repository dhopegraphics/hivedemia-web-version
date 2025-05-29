import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StatCard = ({ icon, value, label, color, isDark }) => {
  return (
    <View className="items-center">
      <View className={`p-3 rounded-full mb-2`} style={{ backgroundColor: `${color}20` }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </Text>
      <Text className={`text-sm ${isDark ? 'text-gray' : 'text-primary-100'}`}>
        {label}
      </Text>
    </View>
  );
};

export default StatCard;