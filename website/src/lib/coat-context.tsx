"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatSettings } from "./catdraw";
import { PRESETS } from "./presets";

type CoatContextValue = {
  coat: CatSettings;
  presetId: string;
  setPresetId: (id: string) => void;
};

const CoatContext = createContext<CoatContextValue | null>(null);

export function CoatProvider({ children }: { children: ReactNode }) {
  const [presetId, setPresetIdState] = useState(PRESETS[0].id);

  const setPresetId = useCallback((id: string) => {
    setPresetIdState(id);
  }, []);

  const coat = useMemo(() => {
    const found = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
    return { ...found.s };
  }, [presetId]);

  const value = useMemo(
    () => ({ coat, presetId, setPresetId }),
    [coat, presetId, setPresetId],
  );

  return <CoatContext.Provider value={value}>{children}</CoatContext.Provider>;
}

export function useCoat() {
  const ctx = useContext(CoatContext);
  if (!ctx) throw new Error("useCoat must be used within CoatProvider");
  return ctx;
}
