import { Platform } from "react-native";
import { Dialog, styled } from "tamagui";
import { glassTokens } from "../constants/tokens";

// Translucency works on both platforms; backdropFilter adds real blur on web.
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
  backgroundColor: "$glassDialog",
  backdropFilter: glassTokens.dialogBackdrop,
  backgroundImage: glassTokens.dialogSheen,
  boxShadow: Platform.OS === "web" ? glassTokens.dialogReflection : undefined,
  padding: "$xl",
  gap: "$lg",
  shadowColor: Platform.OS === "web" ? undefined : glassTokens.dialogShadow.shadowColor,
  shadowOffset: Platform.OS === "web" ? undefined : glassTokens.dialogShadow.shadowOffset,
  shadowOpacity: Platform.OS === "web" ? undefined : glassTokens.dialogShadow.shadowOpacity,
  shadowRadius: Platform.OS === "web" ? undefined : glassTokens.dialogShadow.shadowRadius,
  elevation: Platform.OS === "android" ? glassTokens.dialogShadow.elevation : undefined,
});
