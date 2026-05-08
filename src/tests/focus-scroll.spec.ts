import { describe, expect, test } from 'vitest';

import {
  computeVerticalScrollDelta,
  isRecentKeyboardNavigation,
  markKeyboardNavigation,
  scrollFocusedElementIntoView,
} from '../ui/focusScroll';

describe('focus scroll helpers', () => {
  test('tracks keyboard navigation recency window', () => {
    markKeyboardNavigation(1000);

    expect(isRecentKeyboardNavigation(1500)).toBe(true);
    expect(isRecentKeyboardNavigation(3001)).toBe(false);
  });

  test('skips scrolling when target is already visible', () => {
    const delta = computeVerticalScrollDelta(
      { top: 100, bottom: 140, left: 0, right: 0 },
      { top: 0, bottom: 400, left: 0, right: 0 },
      12,
    );

    expect(delta).toBe(0);
  });

  test('scrolls nearest container first, then viewport fallback', () => {
    markKeyboardNavigation();

    const containerScrollCalls: number[] = [];
    const viewportScrollCalls: number[] = [];

    const scrollContainer = {
      scrollTop: 0,
      scrollHeight: 1200,
      clientHeight: 300,
      getBoundingClientRect: () => ({ top: 0, bottom: 300, left: 0, right: 0 }),
      scrollBy: ({ top = 0 }: { top?: number }) => {
        containerScrollCalls.push(top);
      },
      parentElement: null,
    };

    const target = {
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 0,
      getBoundingClientRect: () => ({ top: 350, bottom: 390, left: 0, right: 0 }),
      parentElement: scrollContainer,
      ownerDocument: {
        defaultView: {
          innerHeight: 320,
          matchMedia: () => ({ matches: true }),
          scrollBy: ({ top = 0 }: { top?: number }) => {
            viewportScrollCalls.push(top);
          },
        },
      },
    };

    scrollFocusedElementIntoView(target);

    expect(containerScrollCalls.length).toBe(1);
    expect(containerScrollCalls[0]).toBeGreaterThan(0);
    expect(viewportScrollCalls.length).toBe(1);
    expect(viewportScrollCalls[0]).toBeGreaterThan(0);
  });
});
