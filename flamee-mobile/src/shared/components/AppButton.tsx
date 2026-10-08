import type { ComponentProps } from "react";
import { Button } from "tamagui";

type BaseButtonProps = Omit<ComponentProps<typeof Button>, "variant">;
type AppButtonProps = BaseButtonProps & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
};

const variants = {
  primary: { backgroundColor: "$primary", color: "$white", borderColor: "$primary" },
  secondary: { backgroundColor: "$supportPeachLight", color: "$textPrimary", borderColor: "$supportPeach" },
  ghost: { backgroundColor: "transparent", color: "$textPrimary", borderColor: "$border" },
  destructive: { backgroundColor: "$error", color: "$white", borderColor: "$error" },
} as const;

export function AppButton({ variant = "primary", ...props }: AppButtonProps) {
  const visual = variants[variant];
  return (
    <Button
      minHeight="$control"
      borderRadius="$md"
      borderWidth={variant === "ghost" || variant === "secondary" ? 1 : 0}
      fontFamily="$body"
      fontSize="$button"
      fontWeight="$semibold"
      pressStyle={{ opacity: 0.84, scale: 0.99 }}
      {...visual}
      {...props}
    />
  );
}
