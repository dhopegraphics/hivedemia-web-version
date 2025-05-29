import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_KEYS = {
  JOINED_GROUPS: "joined_groups",
  CREATED_GROUPS: "created_groups",
};

export const getCachedGroups = async () => {
  const joinedRaw = await AsyncStorage.getItem(LOCAL_KEYS.JOINED_GROUPS);
  const createdRaw = await AsyncStorage.getItem(LOCAL_KEYS.CREATED_GROUPS);
  return {
    joined: joinedRaw ? JSON.parse(joinedRaw) : [],
    created: createdRaw ? JSON.parse(createdRaw) : [],
  };
};