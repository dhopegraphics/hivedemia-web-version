import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

let storage: any;

if (Platform.OS === 'web') {
  if (typeof window !== 'undefined' && window?.localStorage) {
    storage = window.localStorage;
  } else {
    console.warn("⚠️ window.localStorage not available on web — using dummy memory storage.");
    // fallback to simple memory storage
    let memoryStore: Record<string, string> = {};
    storage = {
      getItem: (key: string) => memoryStore[key] || null,
      setItem: (key: string, value: string) => { memoryStore[key] = value },
      removeItem: (key: string) => { delete memoryStore[key] },
    };
  }
} else {
  storage = AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});