// utils/dbCheck.ts
import * as FileSystem from "expo-file-system";

export const doesGroupsDbExist = async (): Promise<boolean> => {
  const dbPath = `${FileSystem.documentDirectory}SQLite/groups.db`;
  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  return fileInfo.exists;
};