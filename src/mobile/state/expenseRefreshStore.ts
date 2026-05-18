export type ExpenseRefreshState = {
  refreshVersion: number;
};

type ExpenseRefreshListener = (state: ExpenseRefreshState) => void;

const state: ExpenseRefreshState = {
  refreshVersion: 0,
};

const listeners = new Set<ExpenseRefreshListener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener({ ...state }));
}

export function getExpenseRefreshState(): ExpenseRefreshState {
  return { ...state };
}

export function markExpenseSaved(): void {
  state.refreshVersion += 1;
  notifyListeners();
}

export function subscribeExpenseRefresh(listener: ExpenseRefreshListener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
}
