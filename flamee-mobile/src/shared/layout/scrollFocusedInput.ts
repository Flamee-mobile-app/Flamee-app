import { TextInput, type ScrollView } from "react-native";

/** Scroll an already focused native input into the visible keyboard area. */
export function scrollFocusedInputToKeyboard(scroll: ScrollView | null, offset: number) {
  const input = TextInput.State.currentlyFocusedInput();
  if (input) scroll?.getScrollResponder()?.scrollResponderScrollNativeHandleToKeyboard(input, offset, true);
}
