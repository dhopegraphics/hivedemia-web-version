// Clear all AsyncStorage, SecureStore, and SQLite databases
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

export async function clearAllAppData() {
  // 1. Clear AsyncStorage
  await AsyncStorage.clear();

  // 2. Clear all SecureStore keys
  // SecureStore does not provide a method to list all keys, so you must know the keys used.
  // If you know your keys, clear them like this:
  const secureStoreKeys = ['session', 'onboardingComplete', /* add more keys here */];
  await Promise.all(secureStoreKeys.map(key => SecureStore.deleteItemAsync(key)));

  // 3. Delete all SQLite databases
  // By default, SQLite DBs are stored in FileSystem.documentDirectory
  const dbDir = FileSystem.documentDirectory || '';
  const files = await FileSystem.readDirectoryAsync(dbDir);
  const dbFiles = files.filter(f => f.endsWith('.db'));
  await Promise.all(
    dbFiles.map(f => FileSystem.deleteAsync(dbDir + f, { idempotent: true }))
  );

  console.log('All app data cleared!');
}