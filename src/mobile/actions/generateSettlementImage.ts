import { View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

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
 * and open the native share dialog
 */
export async function generateAndShareSettlementImage(
  viewShotRef: React.RefObject<ViewShot>,
  data: SettlementData,
): Promise<void> {
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

    // Open share dialog
    await Sharing.shareAsync(shareableUri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Settlement',
      UTI: 'public.png',
    });
  } catch (error) {
    console.error('Error generating or sharing settlement image:', error);
    throw error;
  }
}
