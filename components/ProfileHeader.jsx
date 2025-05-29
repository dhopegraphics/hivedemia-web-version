import { View, Text, TouchableOpacity, Image } from "react-native";

const ProfileHeader = ({ user,  isDark, colors , onPressAvatar }) => {

  return (
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className={`p-6 `}
    >
      <View className="flex-row justify-center items-center">
        <TouchableOpacity onPress={onPressAvatar}>
        <Image
          source={{ uri : user?.avatar_url}}
          className="w-16 h-16 rounded-full border-2 border-green-700"
        />
        </TouchableOpacity>
        <View className="ml-4 flex-1">
          <Text
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {user?.full_name}
          </Text>
          <Text className={`${isDark ? "text-white" : "text-gray-600"}`}>
            {user?.email}
          </Text>
          <Text
            className={`text-sm text-white ${isDark ? "dark:text-offwhite" : "text-gray"}`}
          >
            {user?.university_id} 
          </Text>
        </View>
       
      </View>
    </View>
  );
};

export default ProfileHeader;
