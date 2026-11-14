import { Platform } from "react-native";
import { Dialog, styled } from "tamagui";
import { glassTokens } from "../constants/tokens";

// Popup surfaces are opaque white on every platform.
export const AppDialogContent = styled(Dialog.Content, {
  name: "AppDialogContent",
  unstyled: true,
  position: "relative",
  pointerEvents: "auto",
  elevate: false,
  width: "90%",
  maxWidth: 420,
  borderWidth: 0,
  borderColor: "transparent",
  borderRadius: "$xl",
  backgroundColor: "$white",
  backdropFilter: "none",
  backgroundImage: "none",
  boxShadow: "none",
  padding: "$xl",
  gap: "$lg",
  shadowColor: Platform.OS === "web" ? undefined : glassTokens.dialogShadow.shadowColor,
  shadowOffset: Platform.OS === "web" ? undefined : glassTokens.dialogShadow.shadowOffset,
  shadowOpacity: Platform.OS === "web" ? undefined : glassTokens.dialogShadow.shadowOpacity,
  shadowRadius: Platform.OS === "web" ? undefined : glassTokens.dialogShadow.shadowRadius,
  elevation: Platform.OS === "android" ? glassTokens.dialogShadow.elevation : undefined,
});
