import { View, Text } from 'react-native';
import { Svg, Circle } from 'react-native-svg';

const ProgressCircle = ({ progress, label, size = 80, strokeWidth = 8, isDark , colors }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            stroke={isDark ? '#374151' : '#E5E7EB'}
            fill="transparent"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <Circle
            stroke="#10B981"
            fill="transparent"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View className="absolute inset-0 justify-center items-center">
          <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {progress}%
          </Text>
        </View>
      </View>
      <Text className={`mt-2 text-sm ${isDark ? 'text-gray' : 'text-primary-100'}`}>
        {label}
      </Text>
    </View>
  );
};

export default ProgressCircle;