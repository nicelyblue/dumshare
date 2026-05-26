import { View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export type SettlementData = {
  currency: string;
  recommendations: Array<{
    fromLabel: string;
    toLabel: string;
    amountLabel: string;
  }>;
};

/**
 * Generate a shareable PNG image of settlement recommendations
 * Returns the URI to the generated image
 */
export async function generateSettlementImage(
  viewShotRef: React.RefObject<ViewShot>,
): Promise<string> {
  if (!viewShotRef.current) {
    throw new Error('ViewShot ref is not available');
  }

  try {
    // Capture the view as a base64 image
    const uri = await viewShotRef.current.capture?.();
    
    if (!uri) {
      throw new Error('Failed to capture settlement view');
    }

    // Copy to a shareable location
    const fileName = `settlement-${Date.now()}.png`;
    const shareableUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: shareableUri,
    });

    return shareableUri;
  } catch (error) {
    console.error('Error generating settlement image:', error);
    throw error;
  }
}

/**
 * Share a settlement image to other apps
 */
export async function shareSettlementImage(imageUri: string): Promise<void> {
  try {
    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Settlement',
      UTI: 'public.png',
    });
  } catch (error) {
    console.error('Error sharing settlement image:', error);
    throw error;
  }
}
