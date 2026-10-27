import { useAppHeader } from "../navigation/appHeaderContext";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  eyebrow?: string;
  titleTone?: "default" | "accent";
};

export function AppHeader({ title, showBack = false, onBack }: AppHeaderProps) {
  useAppHeader({ title, showBack, onBack });
  return null;
}
