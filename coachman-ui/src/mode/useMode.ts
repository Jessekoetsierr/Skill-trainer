import { useSyncExternalStore } from "react";
import {
  clearLocation,
  getSnapshot,
  requestLocation,
  setFallback,
  setPreference,
  subscribe,
  type ModeState,
} from "./store";

export type UseMode = ModeState & {
  setPreference: typeof setPreference;
  setFallback: typeof setFallback;
  requestLocation: typeof requestLocation;
  clearLocation: typeof clearLocation;
};

/**
 * Huidige dag/nacht-modus + bron (auto/handmatig).
 * Werkt zonder provider; zet zelf data-mode op <html>.
 */
export function useMode(): UseMode {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...state, setPreference, setFallback, requestLocation, clearLocation };
}
