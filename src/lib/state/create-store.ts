"use client";

import { useSyncExternalStore } from "react";

type Listener = () => void;

type StateUpdater<TState> = TState | ((state: TState) => TState);

type StoreApi<TState> = {
  getState: () => TState;
  setState: (nextState: StateUpdater<TState>) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createStore<TState>(initialState: TState): StoreApi<TState> {
  let state = initialState;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (nextState) => {
      const resolvedState =
        typeof nextState === "function"
          ? (nextState as (state: TState) => TState)(state)
          : nextState;

      if (Object.is(resolvedState, state)) {
        return;
      }

      state = resolvedState;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useStore<TState, TSelected>(
  store: StoreApi<TState>,
  selector: (state: TState) => TSelected,
) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
