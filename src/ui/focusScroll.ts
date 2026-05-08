type RectLike = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type ScrollableLike = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrollBy?: (options: { top?: number; left?: number; behavior?: 'auto' | 'smooth' }) => void;
  getBoundingClientRect: () => RectLike;
  parentElement?: ScrollableLike | null;
};

type FocusTargetLike = ScrollableLike & {
  ownerDocument?: {
    defaultView?: {
      innerHeight?: number;
      matchMedia?: (query: string) => { matches: boolean };
      scrollBy?: (options: { top?: number; left?: number; behavior?: 'auto' | 'smooth' }) => void;
    };
  };
};

const KEYBOARD_FOCUS_WINDOW_MS = 1200;
const DEFAULT_MARGIN_PX = 12;

let lastKeyboardNavigationAt = 0;
let trackingInitialized = false;

function isDocumentAvailable(): boolean {
  return typeof document !== 'undefined' && typeof document.addEventListener === 'function';
}

function prefersReducedMotion(win: FocusTargetLike['ownerDocument'] extends { defaultView: infer W } ? W : never): boolean {
  if (!win || typeof win.matchMedia !== 'function') {
    return false;
  }

  return win.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getBehavior(win: FocusTargetLike['ownerDocument'] extends { defaultView: infer W } ? W : never): 'auto' | 'smooth' {
  return prefersReducedMotion(win) ? 'auto' : 'smooth';
}

function isScrollable(element: ScrollableLike): boolean {
  return element.scrollHeight > element.clientHeight;
}

function getScrollableAncestor(element: FocusTargetLike): ScrollableLike | null {
  let current: ScrollableLike | null | undefined = element.parentElement;

  while (current) {
    if (isScrollable(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function markKeyboardNavigation(now = Date.now()): void {
  lastKeyboardNavigationAt = now;
}

export function isRecentKeyboardNavigation(now = Date.now(), windowMs = KEYBOARD_FOCUS_WINDOW_MS): boolean {
  return now - lastKeyboardNavigationAt <= windowMs;
}

export function computeVerticalScrollDelta(target: RectLike, container: RectLike, margin = DEFAULT_MARGIN_PX): number {
  const topBound = container.top + margin;
  const bottomBound = container.bottom - margin;

  if (target.top < topBound) {
    return target.top - topBound;
  }

  if (target.bottom > bottomBound) {
    return target.bottom - bottomBound;
  }

  return 0;
}

export function initializeKeyboardFocusTracking(): void {
  if (trackingInitialized || !isDocumentAvailable()) {
    return;
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      markKeyboardNavigation();
    }
  });

  trackingInitialized = true;
}

export function scrollFocusedElementIntoView(target: unknown, margin = DEFAULT_MARGIN_PX): void {
  if (!target || !isRecentKeyboardNavigation()) {
    return;
  }

  const focusTarget = target as FocusTargetLike;
  if (typeof focusTarget.getBoundingClientRect !== 'function') {
    return;
  }

  const targetRect = focusTarget.getBoundingClientRect();
  const ancestor = getScrollableAncestor(focusTarget);
  const win = focusTarget.ownerDocument?.defaultView;
  const behavior = getBehavior(win);

  if (ancestor) {
    const ancestorRect = ancestor.getBoundingClientRect();
    const delta = computeVerticalScrollDelta(targetRect, ancestorRect, margin);
    if (delta !== 0) {
      if (typeof ancestor.scrollBy === 'function') {
        ancestor.scrollBy({ top: delta, behavior });
      } else {
        ancestor.scrollTop += delta;
      }
    }
  }

  if (!win || typeof win.innerHeight !== 'number') {
    return;
  }

  const viewportRect: RectLike = {
    top: 0,
    bottom: win.innerHeight,
    left: 0,
    right: 0,
  };
  const viewportDelta = computeVerticalScrollDelta(targetRect, viewportRect, margin);
  if (viewportDelta === 0 || typeof win.scrollBy !== 'function') {
    return;
  }

  win.scrollBy({ top: viewportDelta, behavior });
}
