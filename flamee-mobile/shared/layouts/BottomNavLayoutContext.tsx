import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { LayoutRectangle } from 'react-native';

type BottomNavLayoutContextValue = {
  frame: LayoutRectangle | null;
  setFrame: (frame: LayoutRectangle) => void;
};

const defaultValue: BottomNavLayoutContextValue = {
  frame: null,
  setFrame: () => undefined,
};

const BottomNavLayoutContext = createContext<BottomNavLayoutContextValue>(defaultValue);

export function BottomNavLayoutProvider({ children }: PropsWithChildren) {
  const [frame, setFrame] = useState<LayoutRectangle | null>(null);
  const updateFrame = useCallback((nextFrame: LayoutRectangle) => {
    setFrame(nextFrame);
  }, []);
  const value = useMemo(
    () => ({ frame, setFrame: updateFrame }),
    [frame, updateFrame],
  );

  return <BottomNavLayoutContext.Provider value={value}>{children}</BottomNavLayoutContext.Provider>;
}

export function useBottomNavLayout() {
  return useContext(BottomNavLayoutContext);
}
