import { describe, expect, test } from 'vitest';
import { formatDateTimeLabel } from '../mobile/utils/formatDateTimeLabel';

describe('formatDateTimeLabel', () => {
  test('formats date with month, ordinal day, year and 12-hour time', () => {
    expect(formatDateTimeLabel(new Date(2026, 0, 1, 9, 10))).toBe('Jan 1st 2026 9:10am');
  });

  test('applies ordinal suffix exceptions and pm formatting', () => {
    expect(formatDateTimeLabel(new Date(2026, 0, 11, 15, 5))).toBe('Jan 11th 2026 3:05pm');
    expect(formatDateTimeLabel(new Date(2026, 0, 22, 0, 0))).toBe('Jan 22nd 2026 12:00am');
  });
});
