import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simple storage utility for persisting app preferences
 * Uses React Native's AsyncStorage with fallback to in-memory storage
 * when native module is unavailable (e.g., in Expo dev environment)
 */

const STORAGE_PREFIX = '@dumshare_prefs:';
const memoryStorage = new Map<string, string>();
let isNativeAvailable = true;

/**
 * Get value from storage
 * Falls back to in-memory storage if native module is unavailable
 */
export async function getStorageValue(key: string): Promise<string | null> {
  const prefixedKey = STORAGE_PREFIX + key;
  
  try {
    // Try native storage first
    if (isNativeAvailable) {
      const value = await AsyncStorage.getItem(prefixedKey);
      return value;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If native module is not available, fall back to memory storage
    if (errorMessage.includes('Native module is null') || errorMessage.includes('AsyncStorageError')) {
      console.warn(`AsyncStorage native module unavailable, using in-memory storage for key: ${key}`);
      isNativeAvailable = false;
      return memoryStorage.get(prefixedKey) ?? null;
    }
    
    console.error(`Failed to get storage value for key: ${key}`, error);
    return memoryStorage.get(prefixedKey) ?? null;
  }
  
  return memoryStorage.get(prefixedKey) ?? null;
}

/**
 * Set value in storage
 * Falls back to in-memory storage if native module is unavailable
 */
export async function setStorageValue(
  key: string,
  value: string
): Promise<void> {
  const prefixedKey = STORAGE_PREFIX + key;
  
  try {
    // Try native storage first
    if (isNativeAvailable) {
      await AsyncStorage.setItem(prefixedKey, value);
      return;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If native module is not available, fall back to memory storage
    if (errorMessage.includes('Native module is null') || errorMessage.includes('AsyncStorageError')) {
      console.warn(`AsyncStorage native module unavailable, using in-memory storage for key: ${key}`);
      isNativeAvailable = false;
      memoryStorage.set(prefixedKey, value);
      return;
    }
    
    console.error(`Failed to set storage value for key: ${key}`, error);
  }
  
  memoryStorage.set(prefixedKey, value);
}

/**
 * Remove value from storage
 * Falls back to in-memory storage if native module is unavailable
 */
export async function removeStorageValue(key: string): Promise<void> {
  const prefixedKey = STORAGE_PREFIX + key;
  
  try {
    // Try native storage first
    if (isNativeAvailable) {
      await AsyncStorage.removeItem(prefixedKey);
      return;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If native module is not available, fall back to memory storage
    if (errorMessage.includes('Native module is null') || errorMessage.includes('AsyncStorageError')) {
      console.warn(`AsyncStorage native module unavailable, using in-memory storage for key: ${key}`);
      isNativeAvailable = false;
      memoryStorage.delete(prefixedKey);
      return;
    }
    
    console.error(`Failed to remove storage value for key: ${key}`, error);
  }
  
  memoryStorage.delete(prefixedKey);
}
