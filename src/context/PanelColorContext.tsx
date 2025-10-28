'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppConfiguration } from '@/types';
import {
  PANEL_COLOR_DEFAULT_VALUE,
  PANEL_COLOR_VALUE_SET,
  getPanelColorOption,
  type PanelColorOption,
  type PanelColorValue,
} from '@/lib/panel-colors';

type PanelColorContextValue = {
  activePanelColorOption: PanelColorOption;
  panelColorOverrideEnabled: boolean;
  panelColorOverrideOption: PanelColorOption;
  panelColorMessage: string;
  userPanelColor: PanelColorValue;
  selectPanelColor: (value: PanelColorValue) => void;
  hasLoadedPanelColor: boolean;
};

const PanelColorContext = createContext<PanelColorContextValue | undefined>(undefined);

interface PanelColorProviderProps {
  children: ReactNode;
  config: AppConfiguration;
  currentUser: { username: string } | null;
}

export function PanelColorProvider({ children, config, currentUser }: PanelColorProviderProps) {
  const panelColorOverrideEnabled = config.panelColorOverrideEnabled ?? false;
  const panelColorOverrideValue = config.panelColorOverride;

  const [userPanelColor, setUserPanelColor] = useState<PanelColorValue>(PANEL_COLOR_DEFAULT_VALUE);
  const [hasLoadedPanelColor, setHasLoadedPanelColor] = useState(false);

  const storageKey = useMemo(
    () => `bookly:panel-color:${currentUser?.username ?? 'anonymous'}`,
    [currentUser?.username]
  );

  useEffect(() => {
    setHasLoadedPanelColor(false);

    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue && PANEL_COLOR_VALUE_SET.has(storedValue as PanelColorValue)) {
      setUserPanelColor(storedValue as PanelColorValue);
    } else {
      setUserPanelColor(PANEL_COLOR_DEFAULT_VALUE);
    }

    setHasLoadedPanelColor(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedPanelColor || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageKey, userPanelColor);
  }, [storageKey, userPanelColor, hasLoadedPanelColor]);

  const selectPanelColor = useCallback(
    (value: PanelColorValue) => {
      if (panelColorOverrideEnabled) {
        return;
      }
      if (PANEL_COLOR_VALUE_SET.has(value)) {
        setUserPanelColor(value);
      }
    },
    [panelColorOverrideEnabled]
  );

  const panelColorOverrideOption = useMemo(
    () => getPanelColorOption(panelColorOverrideValue),
    [panelColorOverrideValue]
  );

  const activePanelColorOption = useMemo(
    () =>
      panelColorOverrideEnabled
        ? panelColorOverrideOption
        : getPanelColorOption(userPanelColor),
    [panelColorOverrideEnabled, panelColorOverrideOption, userPanelColor]
  );

  const panelColorMessage = panelColorOverrideEnabled
    ? 'Panel colour set by your administrator.'
    : 'Choose the panel colour used for room cards.';

  const value = useMemo<PanelColorContextValue>(
    () => ({
      activePanelColorOption,
      panelColorOverrideEnabled,
      panelColorOverrideOption,
      panelColorMessage,
      userPanelColor,
      selectPanelColor,
      hasLoadedPanelColor,
    }),
    [
      activePanelColorOption,
      panelColorOverrideEnabled,
      panelColorOverrideOption,
      panelColorMessage,
      userPanelColor,
      selectPanelColor,
      hasLoadedPanelColor,
    ]
  );

  return <PanelColorContext.Provider value={value}>{children}</PanelColorContext.Provider>;
}

export function usePanelColor() {
  const context = useContext(PanelColorContext);
  if (!context) {
    throw new Error('usePanelColor must be used within a PanelColorProvider');
  }
  return context;
}
