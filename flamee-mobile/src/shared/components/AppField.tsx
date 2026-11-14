import { CircleAlert } from "@tamagui/lucide-icons-2/icons/CircleAlert";
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Platform, type TextInput, type TextInputProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Input, Label, Text, TextArea, XStack, YStack, type InputProps, type TamaguiElement } from "tamagui";
import { colors, fieldTokens, radii, spacing, typography } from "../constants/tokens";

type AppFieldProps = Pick<
  TextInputProps,
  | "value"
  | "onChangeText"
  | "placeholder"
  | "keyboardType"
  | "secureTextEntry"
  | "autoCapitalize"
  | "autoCorrect"
  | "autoFocus"
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
  labelSize?: "default" | "large";
  labelSpacing?: "default" | "comfortable";
  error?: string;
  help?: string;
  multiline?: boolean;
  multilineSize?: "regular" | "compact";
  autoGrow?: boolean;
  maxAutoGrowLines?: number;
  autoGrowMinHeight?: number;
  autoGrowPaddingHorizontal?: number;
  autoGrowPaddingVertical?: number;
  autoGrowTextAlignVertical?: TextInputProps["textAlignVertical"];
  characterCount?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  surfaceTone?: "default" | "bright" | "outlined" | "elevated" | "thought";
};

export function AppField({
  label,
  showLabel = true,
  labelSize = "default",
  labelSpacing = "default",
  error,
  help,
  multiline = false,
  multilineSize = "regular",
  autoGrow = false,
  maxAutoGrowLines = fieldTokens.multilineAutoGrowMaxLines,
  autoGrowMinHeight = fieldTokens.multilineAutoGrowMinHeight,
  autoGrowPaddingHorizontal = spacing.xs,
  autoGrowPaddingVertical = spacing.xs,
  autoGrowTextAlignVertical = "top",
  characterCount,
  id,
  accessibilityLabel,
  autoFocus,
  editable,
  onFocus,
  onBlur,
  surfaceTone = "default",
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
  const [autoGrowHeight, setAutoGrowHeight] = useState<number>(autoGrowMinHeight);
  const textAreaRef = useRef<TamaguiElement | null>(null);
  const didAutoFocusRef = useRef(false);
  const autoGrowMaxHeight = typography.bodyL.lineHeight * maxAutoGrowLines + autoGrowPaddingVertical * 2;
  const reducedMotion = useReducedMotion();
  const disabled = editable === false;
  const active = focused && !disabled;
  const outlined = surfaceTone === "outlined";
  const elevated = surfaceTone === "elevated";
  const thought = surfaceTone === "thought";
  const radius = outlined ? fieldTokens.outlinedRadius : thought ? radii.xl : fieldTokens.radius;
  const message = error || help;
  const transition: ["200ms", { duration: number }] | undefined = reducedMotion
    ? undefined
    : ["200ms", { duration: fieldTokens.focusDuration }];
  useEffect(() => {
    if (!autoFocus || !autoGrow || !multiline || didAutoFocusRef.current) return;
    const frame = requestAnimationFrame(() => {
      if (didAutoFocusRef.current) return;
      didAutoFocusRef.current = true;
      (textAreaRef.current as unknown as TextInput | null)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, autoGrow, multiline]);
  const resetStyle = { borderWidth: 0, outlineWidth: 0, outlineStyle: "none", backgroundColor: "transparent" } as const;
  const fieldProps = {
    ...props,
    autoFocus: autoGrow && multiline ? undefined : autoFocus,
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
    selectionColor: Platform.OS === "ios" ? (thought ? "$primary" as const : "$accentText" as const) : ("$accentSoft" as const),
    cursorColor: thought ? "$primary" as const : "$accentText" as const,
    selectionHandleColor: thought ? "$primary" as const : "$accentText" as const,
    ...(Platform.OS === "web" ? { caretColor: thought ? colors.primary : colors.accentText } : {}),
    underlineColorAndroid: "$colorTransparent" as const,
    fontFamily: "$body" as const,
    fontSize: "$bodyL" as const,
    flex: autoGrow ? 0 : 1,
    minWidth: 0,
    paddingHorizontal: startIcon ? spacing.md : autoGrow ? autoGrowPaddingHorizontal : fieldTokens.paddingHorizontal,
    paddingVertical: autoGrow ? autoGrowPaddingVertical : fieldTokens.paddingVertical,
    ...(autoGrow && multiline ? {
      onContentSizeChange: (event: { nativeEvent: { contentSize: { height: number } } }) => {
        const contentHeight = Math.ceil(event.nativeEvent.contentSize.height + autoGrowPaddingVertical * 2);
        setAutoGrowHeight(Math.min(autoGrowMaxHeight, Math.max(autoGrowMinHeight, contentHeight)));
      },
    } : {}),
    hoverStyle: resetStyle,
    focusStyle: resetStyle,
    focusVisibleStyle: resetStyle,
    pressStyle: resetStyle,
    onFocus: () => {
      if (!disabled) {
        setFocused(true);
        onFocus?.();
      }
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
        marginBottom={labelSpacing === "comfortable" ? "$xs" : undefined}
        fontFamily="$body"
        fontSize={labelSize === "large" ? "$label" : "$bodyM"}
        lineHeight={labelSize === "large" ? "$label" : "$bodyM"}
        color={disabled ? "$textSecondary" : error ? "$accentText" : "$textPrimary"}
      >
        {label}
      </Label> : null}
      <YStack
        testID={`${fieldId}-surface`}
        borderRadius={radius}
        borderWidth={outlined ? (active ? 2 : 1) : surfaceTone === "bright" ? 1 : 0}
        borderColor={outlined ? (active ? "$primary" : "$border") : surfaceTone === "bright" ? "$accentText" : "transparent"}
        backgroundColor={disabled ? "$fieldDisabled" : error ? "$accentSoft" : thought ? "transparent" : outlined || surfaceTone === "bright" || elevated ? "$fieldSurfaceBright" : "$fieldSurface"}
        boxShadow={Platform.OS === "web" && surfaceTone === "bright" ? fieldTokens.brightSurfaceShadow : undefined}
        transform={[{ translateY: active && !thought && !reducedMotion ? -fieldTokens.focusLift : 0 }]}
        transition={transition}
        animateOnly={["transform"]}
        zIndex={active ? 1 : 0}
        {...(Platform.OS !== "web" ? {
          shadowColor: fieldTokens.nativeFocusShadow.shadowColor,
          shadowOffset: surfaceTone === "bright" ? fieldTokens.brightNativeShadow.shadowOffset : fieldTokens.nativeFocusShadow.shadowOffset,
          shadowRadius: surfaceTone === "bright" ? fieldTokens.brightNativeShadow.shadowRadius : fieldTokens.nativeFocusShadow.shadowRadius,
          shadowOpacity: disabled ? 0 : surfaceTone === "bright" ? fieldTokens.brightNativeShadow.shadowOpacity : (active || elevated ? fieldTokens.nativeFocusShadow.shadowOpacity : 0),
          ...(Platform.OS === "android" ? { elevation: disabled ? 0 : surfaceTone === "bright" ? fieldTokens.brightNativeShadow.elevation : (active || elevated ? fieldTokens.nativeFocusShadow.elevation : 0) } : {}),
        } : {})}
      >
        {!thought ? <>
          <YStack
            position="absolute"
            top={0}
            right={0}
            bottom={0}
            left={0}
            borderRadius={radius}
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
            borderRadius={radius}
            pointerEvents="none"
            boxShadow={Platform.OS === "web" ? fieldTokens.focusShadow : undefined}
            opacity={active ? 1 : 0}
            transition={transition}
            animateOnly={["opacity"]}
          />
        </> : null}
        <XStack alignItems="center" position="relative" zIndex={1}>
          {startIcon ? <YStack paddingLeft={fieldTokens.paddingHorizontal} pointerEvents="none">{startIcon}</YStack> : null}
          {multiline ? (
            <TextArea ref={autoGrow ? textAreaRef : undefined}
              minHeight={autoGrow ? autoGrowMinHeight : multilineSize === "compact" ? fieldTokens.multilineCompactMinHeight : fieldTokens.multilineMinHeight}
              height={autoGrow ? autoGrowHeight : undefined} maxHeight={autoGrow ? autoGrowMaxHeight : undefined}
              scrollEnabled={autoGrow} textAlignVertical={autoGrowTextAlignVertical} {...fieldProps} />
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
