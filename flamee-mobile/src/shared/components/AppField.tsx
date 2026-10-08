import type { TextInputProps } from "react-native";
import { Input, Label, Text, TextArea, YStack } from "tamagui";

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
> & {
  id?: string;
  label: string;
  error?: string;
  help?: string;
  multiline?: boolean;
  characterCount?: string;
  onBlur?: () => void;
};

export function AppField({
  label,
  error,
  help,
  multiline = false,
  characterCount,
  id,
  ...props
}: AppFieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const fieldProps = {
    id: fieldId,
    borderRadius: "$md" as const,
    borderWidth: 1,
    borderColor: error ? ("$error" as const) : ("$border" as const),
    backgroundColor: "$surface" as const,
    color: "$textPrimary" as const,
    placeholderTextColor: "$textSecondary" as const,
    fontFamily: "$body" as const,
    fontSize: "$bodyL" as const,
    paddingHorizontal: "$md" as const,
    ...props,
  };
  return (
    <YStack gap="$xs">
      <Label htmlFor={fieldId} fontFamily="$body" fontSize="$bodyM" color="$textPrimary">
        {label}
      </Label>
      {multiline ? (
        <TextArea minHeight={96} textAlignVertical="top" {...fieldProps} />
      ) : (
        <Input minHeight="$control" {...fieldProps} />
      )}
      {error || help || characterCount ? (
        <YStack flexDirection="row" justifyContent="space-between" gap="$sm">
          <Text flex={1} fontFamily="$body" fontSize="$bodyS" color={error ? "$error" : "$textSecondary"}>
            {error ?? help}
          </Text>
          {characterCount ? (
            <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">
              {characterCount}
            </Text>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  );
}
