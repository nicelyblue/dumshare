export type ActiveShareState = {
  activeShareId: string | null;
};

type ActiveShareListener = (state: ActiveShareState) => void;

const state: ActiveShareState = {
  activeShareId: null,
};

const listeners = new Set<ActiveShareListener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener({ ...state }));
}

export function getActiveShareState(): ActiveShareState {
  return { ...state };
}

export function setActiveShareId(activeShareId: string | null): void {
  state.activeShareId = activeShareId;
  notifyListeners();
}

export function subscribeActiveShare(listener: ActiveShareListener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
}
