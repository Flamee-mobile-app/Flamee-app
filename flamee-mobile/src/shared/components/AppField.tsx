import { CircleAlert } from "@tamagui/lucide-icons-2/icons/CircleAlert";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Platform, type TextInputProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Input, Label, Text, TextArea, XStack, YStack, type InputProps } from "tamagui";
import { colors, fieldTokens, spacing } from "../constants/tokens";

type AppFieldProps = Pick<
  TextInputProps,
  | "value"
  | "onChangeText"
  | "placeholder"
  | "keyboardType"
  | "secureTextEntry"
  | "autoCapitalize"
  | "autoCorrect"
  | "maxLength"
  | "editable"
  | "accessibilityLabel"
> & Pick<InputProps, "autoComplete" | "textContentType" | "returnKeyType" | "submitBehavior" | "onSubmitEditing" | "inputMode" | "type"> & {
  inputRef?: ComponentProps<typeof Input>["ref"];
  startIcon?: ReactNode;
  endAction?: ReactNode;
  id?: string;
  label: string;
  showLabel?: boolean;
  error?: string;
  help?: string;
  multiline?: boolean;
  characterCount?: string;
  onBlur?: () => void;
};

export function AppField({
  label,
  showLabel = true,
  error,
  help,
  multiline = false,
  characterCount,
  id,
  accessibilityLabel,
  editable,
  onBlur,
  inputRef,
  startIcon,
  endAction,
  ...props
}: AppFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? `field-${generatedId}`;
  const messageId = `${fieldId}-message`;
  const countId = `${fieldId}-count`;
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const disabled = editable === false;
  const active = focused && !disabled;
  const message = error || help;
  const transition: ["200ms", { duration: number }] | undefined = reducedMotion
    ? undefined
    : ["200ms", { duration: fieldTokens.focusDuration }];
  const resetStyle = { borderWidth: 0, outlineWidth: 0, outlineStyle: "none", backgroundColor: "transparent" } as const;
  const fieldProps = {
    ...props,
    type: props.type ?? (props.secureTextEntry ? "password" : props.keyboardType === "email-address" ? "email" : "text"),
    unstyled: true,
    id: fieldId,
    "aria-label": accessibilityLabel ?? label,
    ...(Platform.OS === "web" ? {
      "aria-invalid": !!error,
      "aria-describedby": [message ? messageId : undefined, characterCount ? countId : undefined].filter(Boolean).join(" ") || undefined,
    } : { accessibilityHint: message }),
    disabled,
    position: "relative" as const,
    zIndex: 1,
    borderRadius: fieldTokens.radius,
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: "none" as const,
    backgroundColor: "transparent" as const,
    color: disabled ? ("$textSecondary" as const) : ("$textPrimary" as const),
    placeholderTextColor: "$textSecondary" as const,
    // iOS uses selectionColor for its caret as well as the selection highlight.
    selectionColor: Platform.OS === "ios" ? ("$accentText" as const) : ("$accentSoft" as const),
    cursorColor: "$accentText" as const,
    selectionHandleColor: "$accentText" as const,
    ...(Platform.OS === "web" ? { caretColor: colors.accentText } : {}),
    underlineColorAndroid: "$colorTransparent" as const,
    fontFamily: "$body" as const,
    fontSize: "$bodyL" as const,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: startIcon ? spacing.md : fieldTokens.paddingHorizontal,
    paddingVertical: fieldTokens.paddingVertical,
    hoverStyle: resetStyle,
    focusStyle: resetStyle,
    focusVisibleStyle: resetStyle,
    pressStyle: resetStyle,
    onFocus: () => {
      if (!disabled) setFocused(true);
    },
    onBlur: () => {
      setFocused(false);
      onBlur?.();
    },
  };
  return (
    <YStack gap="$sm">
      {showLabel ? <Label
        htmlFor={fieldId}
        fontFamily="$body"
        fontSize="$bodyM"
        lineHeight="$bodyM"
        color={disabled ? "$textSecondary" : error ? "$accentText" : "$textPrimary"}
      >
        {label}
      </Label> : null}
      <YStack
        testID={`${fieldId}-surface`}
        borderRadius={fieldTokens.radius}
        backgroundColor={disabled ? "$fieldDisabled" : error ? "$accentSoft" : "$fieldSurface"}
        transform={[{ translateY: active && !reducedMotion ? -fieldTokens.focusLift : 0 }]}
        transition={transition}
        animateOnly={["transform"]}
        zIndex={active ? 1 : 0}
        {...(Platform.OS !== "web" ? {
          shadowColor: fieldTokens.nativeFocusShadow.shadowColor,
          shadowOffset: fieldTokens.nativeFocusShadow.shadowOffset,
          shadowRadius: fieldTokens.nativeFocusShadow.shadowRadius,
          shadowOpacity: active ? fieldTokens.nativeFocusShadow.shadowOpacity : 0,
          ...(Platform.OS === "android" ? { elevation: active ? fieldTokens.nativeFocusShadow.elevation : 0 } : {}),
        } : {})}
      >
        <YStack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          borderRadius={fieldTokens.radius}
          boxShadow={Platform.OS === "web" ? fieldTokens.surfaceShadow : undefined}
          opacity={active ? 0 : 1}
          pointerEvents="none"
          transition={transition}
          animateOnly={["opacity"]}
        />
        <YStack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          borderRadius={fieldTokens.radius}
          pointerEvents="none"
          boxShadow={Platform.OS === "web" ? fieldTokens.focusShadow : undefined}
          opacity={active ? 1 : 0}
          transition={transition}
          animateOnly={["opacity"]}
        />
        <XStack alignItems="center" position="relative" zIndex={1}>
          {startIcon ? <YStack paddingLeft={fieldTokens.paddingHorizontal} pointerEvents="none">{startIcon}</YStack> : null}
          {multiline ? (
            <TextArea minHeight={fieldTokens.multilineMinHeight} textAlignVertical="top" {...fieldProps} />
          ) : (
            <Input ref={inputRef} minHeight={fieldTokens.minHeight} {...fieldProps} />
          )}
          {endAction ? <YStack paddingRight="$xs">{endAction}</YStack> : null}
        </XStack>
      </YStack>
      {error || help || characterCount ? (
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$sm">
          {message ? (
            <XStack flex={1} alignItems="flex-start" gap="$xs">
              {error ? <CircleAlert size={fieldTokens.errorIconSize} color="$accentText" aria-hidden={true} /> : null}
              <Text id={messageId} flex={1} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color={error ? "$accentText" : "$textSecondary"} aria-live={error ? "polite" : undefined}>
                {message}
              </Text>
            </XStack>
          ) : <YStack flex={1} />}
          {characterCount ? (
            <Text id={countId} flexShrink={0} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">
              {characterCount}
            </Text>
          ) : null}
        </XStack>
      ) : null}
    </YStack>
  );
}
