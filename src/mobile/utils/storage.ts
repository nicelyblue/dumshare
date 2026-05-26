import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simple storage utility for persisting app preferences
 * Uses React Native's AsyncStorage
 */

const STORAGE_PREFIX = '@dumshare_prefs:';

/**
 * Get value from storage
 */
export async function getStorageValue(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.error(`Failed to get storage value for key: ${key}`, error);
    return null;
  }
}

/**
 * Set value in storage
 */
export async function setStorageValue(
  key: string,
  value: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + key, value);
  } catch (error) {
    console.error(`Failed to set storage value for key: ${key}`, error);
  }
}

/**
 * Remove value from storage
 */
export async function removeStorageValue(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.error(`Failed to remove storage value for key: ${key}`, error);
  }
}
