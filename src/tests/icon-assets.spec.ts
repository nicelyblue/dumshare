import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ExpoConfig = {
  expo?: {
    icon?: string;
    android?: {
      adaptiveIcon?: {
        foregroundImage?: string;
        backgroundColor?: string;
      };
    };
  };
};

function readPngDimensions(path: string): { width: number; height: number; colorType: number } {
  const data = readFileSync(path);
  expect(data.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25],
  };
}

describe('launcher icon configuration', () => {
  it('uses real square PNG assets for the base and adaptive icons', () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), 'app.json'), 'utf8'),
    ) as ExpoConfig;
    const icon = config.expo?.icon;
    const foreground = config.expo?.android?.adaptiveIcon?.foregroundImage;

    expect(icon).toBe('./assets/dumshare-icon.png');
    expect(foreground).toBe('./assets/dumshare-adaptive-foreground.png');
    expect(config.expo?.android?.adaptiveIcon?.backgroundColor).toBe('#365F7D');

    for (const [relativePath, colorType] of [
      [icon, 2],
      [foreground, 6],
      ['./assets/dumshare-mark.png', 6],
    ] as const) {
      expect(relativePath).toBeTruthy();
      const path = resolve(process.cwd(), relativePath as string);
      expect(existsSync(path)).toBe(true);
      const png = readPngDimensions(path);
      expect(png.width).toBe(1024);
      expect(png.height).toBe(1024);
      expect(png.colorType).toBe(colorType);
    }
  });
});
