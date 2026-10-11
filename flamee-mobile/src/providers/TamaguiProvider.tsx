import type { PropsWithChildren } from "react";
import { TamaguiProvider as TamaguiRootProvider } from "tamagui";
import { tamaguiConfig } from "../../tamagui.config";

export function TamaguiProvider({ children }: PropsWithChildren) {
  return (
    <TamaguiRootProvider config={tamaguiConfig} defaultTheme="light">
      {children}
    </TamaguiRootProvider>
  );
}
