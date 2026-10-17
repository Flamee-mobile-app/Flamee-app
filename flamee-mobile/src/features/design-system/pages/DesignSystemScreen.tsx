import { Bell, Heart, Plus, Trash2 } from "@tamagui/lucide-icons-2";
import { useState } from "react";
import {
  Dialog,
  Label,
  Sheet,
  Text,
  XStack,
  YStack,
} from "tamagui";
import {
  AppButton,
  AppCheckbox,
  AppDialogContent,
  AppField,
  AppFilterChip,
  AppIconButton,
  AppSwitch,
  FeatureScreen,
  SectionCard,
  appToast,
} from "../../../shared/components";
import { buttonTokens, glassTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import {
  designSystemCatalog,
  type DesignSystemComponentId,
} from "../designSystemCatalog";

const locale = "vi" as const;

function SourceLabel({ id }: { id: DesignSystemComponentId }) {
  const entry = designSystemCatalog.find((candidate) => candidate.id === id);
  if (!entry) return null;

  return (
    <YStack
      alignSelf="flex-start"
      borderRadius="$md"
      backgroundColor="$surfaceMuted"
      paddingHorizontal="$md"
      paddingVertical="$sm"
      gap="$xs"
    >
      <Text fontFamily="$body" fontSize="$caption" color="$textSecondary">
        {getMessage(locale, "designSystemImplementationSource")}
      </Text>
      <Text fontFamily="$body" fontSize="$bodyS" fontWeight="$semibold" color="$textPrimary">
        {entry.implementation}
      </Text>
      <Text fontFamily="$body" fontSize="$caption" color="$textSecondary">
        {entry.importPath}
      </Text>
    </YStack>
  );
}

function PreviewSection({
  id,
  children,
  last = false,
}: {
  id: DesignSystemComponentId;
  children: React.ReactNode;
  last?: boolean;
}) {
  const entry = designSystemCatalog.find((candidate) => candidate.id === id);
  if (!entry) return null;

  return (
    <YStack gap="$lg" paddingBottom={last ? 0 : "$xl"} borderBottomWidth={last ? 0 : 1} borderBottomColor="$border">
      <YStack gap="$sm">
        <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">
          {entry.title}
        </Text>
        <SourceLabel id={id} />
      </YStack>
      {children}
    </YStack>
  );
}

function ButtonPreview() {
  const [filter, setFilter] = useState("all");
  const [multipleFilters, setMultipleFilters] = useState<string[]>(["text"]);
  const toggleFilter = (value: string) => setMultipleFilters((current) => (
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
  ));

  return (
    <YStack gap="$md">
      <AppButton fill icon={<Heart size={buttonTokens.iconSize} />} onPress={() => undefined}>
        {getMessage(locale, "continue")}
      </AppButton>
      <AppButton fill variant="secondary" icon={<Bell size={buttonTokens.iconSize} />} onPress={() => undefined}>
        {getMessage(locale, "allowNotifications")}
      </AppButton>
      <AppButton fill variant="ghost" onPress={() => undefined}>
        {getMessage(locale, "skipForNow")}
      </AppButton>
      <AppButton fill variant="destructive" icon={<Trash2 size={buttonTokens.iconSize} />} onPress={() => undefined}>
        {getMessage(locale, "deleteMoment")}
      </AppButton>
      <XStack gap="$sm" flexWrap="wrap">
        <AppButton grow loading onPress={() => undefined}>
          {getMessage(locale, "loadingTitle")}
        </AppButton>
        <AppButton grow disabled variant="secondary" onPress={() => undefined}>
          {getMessage(locale, "continue")}
        </AppButton>
      </XStack>
      <XStack alignItems="center" gap="$sm" flexWrap="wrap">
        <AppIconButton
          tone="accent"
          icon={<Plus size={20} color="$accentText" />}
          accessibilityLabel={getMessage(locale, "createMoment")}
          onPress={() => undefined}
        />
        <AppButton variant="ghost" onPress={() => undefined}>
          {getMessage(locale, "homeViewAll")}
        </AppButton>
      </XStack>
      <YStack gap="$xs">
        <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage(locale, "designSystemSingleFilter")}</Text>
        <XStack gap="$xs" flexWrap="wrap" role="radiogroup" aria-label={getMessage(locale, "designSystemSingleFilter")}>
          <AppFilterChip testID="filter-single-all" label={getMessage(locale, "designSystemAll")} selected={filter === "all"} selectionMode="single" onPress={() => setFilter("all")} />
          <AppFilterChip testID="filter-single-text" label={getMessage(locale, "momentText")} selected={filter === "text"} selectionMode="single" onPress={() => setFilter("text")} />
          <AppFilterChip testID="filter-single-photo" label={getMessage(locale, "momentPhoto")} selected={filter === "photo"} selectionMode="single" onPress={() => setFilter("photo")} />
        </XStack>
      </YStack>
      <YStack gap="$xs">
        <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage(locale, "designSystemMultipleFilter")}</Text>
        <XStack gap="$xs" flexWrap="wrap" role="group" aria-label={getMessage(locale, "designSystemMultipleFilter")}>
          <AppFilterChip testID="filter-multiple-text" label={getMessage(locale, "momentText")} selected={multipleFilters.includes("text")} selectionMode="multiple" onPress={() => toggleFilter("text")} />
          <AppFilterChip testID="filter-multiple-photo" label={getMessage(locale, "momentPhoto")} selected={multipleFilters.includes("photo")} selectionMode="multiple" onPress={() => toggleFilter("photo")} />
          <AppFilterChip testID="filter-multiple-voice" label={getMessage(locale, "momentVoice")} selected={multipleFilters.includes("voice")} selectionMode="multiple" onPress={() => toggleFilter("voice")} />
        </XStack>
        <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage(locale, "designSystemFilterHint")}</Text>
      </YStack>
    </YStack>
  );
}

function InputPreview() {
  const [name, setName] = useState("Linh");
  const [email, setEmail] = useState("email-chua-hop-le");
  const [note, setNote] = useState("Hôm nay mình muốn dành một chút thời gian cho bản thân.");

  return (
    <YStack gap="$lg">
      <AppField
        id="design-input-name"
        label={getMessage(locale, "displayNameLabel")}
        value={name}
        onChangeText={setName}
        placeholder={getMessage(locale, "displayNamePlaceholder")}
        help={getMessage(locale, "designSystemNameHelp")}
      />
      <AppField
        id="design-input-email"
        label={getMessage(locale, "loginEmailLabel")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        error={getMessage(locale, "loginEmailInvalid")}
      />
      <AppField
        id="design-input-note"
        label={getMessage(locale, "careNoteLabel")}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={140}
        characterCount={`${note.length}/140`}
      />
      <AppField
        id="design-input-disabled"
        label={getMessage(locale, "phoneLabel")}
        value="0912 345 678"
        onChangeText={() => undefined}
        editable={false}
        help={getMessage(locale, "designSystemDisabledFieldHelp")}
      />
    </YStack>
  );
}

function CardPreview() {
  const [pressCount, setPressCount] = useState(0);
  return (
    <YStack gap="$md">
      <SectionCard testID="design-card-static" title={getMessage(locale, "homeSmallGesture")} description={getMessage(locale, "homeSmallGestureBody")}>
        <AppButton testID="design-card-inner-button" variant="ghost" iconAfter={<Heart size={18} color="$accentText" />} onPress={() => appToast.info(getMessage(locale, "designSystemCardInnerFeedback"))}>
          {getMessage(locale, "shareAMoment")}
        </AppButton>
      </SectionCard>
      <SectionCard testID="design-card-peach" tone="peach" title={getMessage(locale, "homeEmotionEyebrow")} description={getMessage(locale, "homeCheckInDescription")} />
      <SectionCard testID="design-card-lavender" tone="lavender" title={getMessage(locale, "dailyPromptTitle")} description={getMessage(locale, "dailyPromptLocal")} />
      <SectionCard
        testID="design-card-action"
        title={getMessage(locale, "designSystemCardActionTitle")}
        description={getMessage(locale, "designSystemCardActionBody")}
        accessibilityLabel={getMessage(locale, "designSystemCardActionTitle")}
        onPress={() => setPressCount((count) => count + 1)}
      />
      <Text testID="design-card-feedback" minHeight={20} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" aria-live="polite">
        {pressCount ? formatMessage(locale, "designSystemCardFeedback", { count: pressCount }) : ""}
      </Text>
      <SectionCard
        testID="design-card-disabled"
        title={getMessage(locale, "designSystemCardDisabledTitle")}
        description={getMessage(locale, "designSystemCardDisabledBody")}
        accessibilityLabel={getMessage(locale, "designSystemCardDisabledTitle")}
        disabled
        onPress={() => setPressCount((count) => count + 1)}
      />
    </YStack>
  );
}

function DialogPreview() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <YStack
        minHeight={200}
        padding="$xl"
        borderRadius="$xl"
        backgroundColor="$glassDialog"
        backdropFilter={glassTokens.dialogBackdrop}
        overflow="hidden"
        justifyContent="center"
        gap="$lg"
      >
        <YStack gap="$xs">
          <Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">{getMessage(locale, "designSystemGlassTitle")}</Text>
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{getMessage(locale, "designSystemGlassBody")}</Text>
        </YStack>
        <AppButton fill variant="ghost" onPress={() => setOpen(true)}>
          {getMessage(locale, "recreateInviteConfirmTitle")}
        </AppButton>
      </YStack>
      <Dialog modal open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            backgroundColor="$textPrimary"
            opacity={glassTokens.overlayOpacity}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <AppDialogContent
            key="content"
          >
            <YStack gap="$sm">
              <Dialog.Title fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">
                {getMessage(locale, "recreateInviteConfirmTitle")}
              </Dialog.Title>
              <Dialog.Description fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
                {getMessage(locale, "recreateInviteConfirmBody")}
              </Dialog.Description>
            </YStack>
            <XStack gap="$sm">
              <AppButton grow variant="ghost" onPress={() => setOpen(false)}>
                {getMessage(locale, "keepCurrentInvite")}
              </AppButton>
              <AppButton grow variant="destructive" onPress={() => setOpen(false)}>
                {getMessage(locale, "confirmRecreateInvite")}
              </AppButton>
            </XStack>
          </AppDialogContent>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}

function SheetPreview() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppButton fill variant="secondary" onPress={() => setOpen(true)}>
        {getMessage(locale, "createMomentTitle")}
      </AppButton>
      <Sheet modal open={open} onOpenChange={setOpen} snapPoints={[55]} dismissOnSnapToBottom zIndex={100_000}>
        <Sheet.Overlay backgroundColor="$textPrimary" opacity={0.45} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Sheet.Frame
          backgroundColor="$surface"
          borderTopLeftRadius="$xl"
          borderTopRightRadius="$xl"
          padding="$xl"
          gap="$lg"
        >
          <Sheet.Handle backgroundColor="$border" />
          <YStack width="100%" maxWidth={560} alignSelf="center" gap="$lg">
            <YStack gap="$sm">
              <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">
                {getMessage(locale, "createMomentTitle")}
              </Text>
              <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
                {getMessage(locale, "createMomentBody")}
              </Text>
            </YStack>
            <XStack gap="$sm" flexWrap="wrap">
              <AppFilterChip label={getMessage(locale, "momentText")} selected selectionMode="single" onPress={() => undefined} />
              <AppFilterChip label={getMessage(locale, "momentPhoto")} selected={false} selectionMode="single" onPress={() => undefined} />
              <AppFilterChip label={getMessage(locale, "momentVoice")} selected={false} selectionMode="single" onPress={() => undefined} />
            </XStack>
            <AppButton fill onPress={() => setOpen(false)}>
              {getMessage(locale, "continue")}
            </AppButton>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}

function ToastPreview() {
  return (
    <YStack gap="$sm">
      <AppButton fill variant="secondary" onPress={() => appToast.success(getMessage(locale, "successTitle"))}>
        Success toast
      </AppButton>
      <AppButton fill variant="secondary" onPress={() => appToast.error(getMessage(locale, "errorTitle"), { description: getMessage(locale, "errorDescription") })}>
        Error toast
      </AppButton>
      <AppButton fill variant="secondary" onPress={() => appToast.warning(getMessage(locale, "permissionTitle"), { description: getMessage(locale, "permissionDescription") })}>
        Warning toast
      </AppButton>
      <AppButton fill variant="secondary" onPress={() => appToast.info(getMessage(locale, "localSessionLabel"), { description: getMessage(locale, "localSessionDescription") })}>
        Info toast
      </AppButton>
      <AppButton fill variant="secondary" onPress={() => appToast.loading(getMessage(locale, "loadingTitle"), { description: getMessage(locale, "loadingDescription") })}>
        Loading toast
      </AppButton>
    </YStack>
  );
}

function ControlRow({ label, children, disabled = false }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <XStack minHeight={48} alignItems="center" justifyContent="space-between" gap="$lg">
      <Text flex={1} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary" opacity={disabled ? buttonTokens.disabledOpacity : 1}>
        {label}
      </Text>
      {children}
    </XStack>
  );
}

function SwitchPreview() {
  const [reminder, setReminder] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);

  return (
    <YStack gap="$sm">
      <ControlRow label={getMessage(locale, "notificationReminderEnabled")}>
        <AppSwitch
          id="design-reminder-switch"
          checked={reminder}
          onCheckedChange={setReminder}
          accessibilityLabel={getMessage(locale, "notificationReminderEnabled")}
        />
      </ControlRow>
      <ControlRow label={getMessage(locale, "privacyModeLabel")}>
        <AppSwitch
          id="design-private-switch"
          checked={privateMode}
          onCheckedChange={setPrivateMode}
          accessibilityLabel={getMessage(locale, "privacyModeLabel")}
        />
      </ControlRow>
      <ControlRow label={getMessage(locale, "notificationFirstCheckInNeeded")} disabled>
        <AppSwitch id="design-disabled-switch" disabled checked={false} accessibilityLabel={getMessage(locale, "notificationFirstCheckInNeeded")} />
      </ControlRow>
    </YStack>
  );
}

function ReviewCheckbox({
  id,
  label,
  checked,
  disabled = false,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean | "indeterminate";
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <XStack minHeight={48} alignItems="center" gap="$md">
      <AppCheckbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onCheckedChange?.(next === true)}
        accessibilityLabel={label}
      />
      <Label htmlFor={id} flex={1} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary" opacity={disabled ? buttonTokens.disabledOpacity : 1}>
        {label}
      </Label>
    </XStack>
  );
}

function CheckboxPreview() {
  const [encouragement, setEncouragement] = useState(true);
  const [voice, setVoice] = useState(false);
  const [partial, setPartial] = useState<boolean | "indeterminate">("indeterminate");

  return (
    <YStack gap="$xs">
      <ReviewCheckbox id="design-check-encouragement" label={getMessage(locale, "careEncouragement")} checked={encouragement} onCheckedChange={setEncouragement} />
      <ReviewCheckbox id="design-check-voice" label={getMessage(locale, "careVoice")} checked={voice} onCheckedChange={setVoice} />
      <ReviewCheckbox id="design-check-partial" label={getMessage(locale, "designSystemPartialSelection")} checked={partial} onCheckedChange={setPartial} />
      <ReviewCheckbox id="design-check-disabled" label={getMessage(locale, "careGift")} checked={false} disabled />
    </YStack>
  );
}

export function DesignSystemScreen() {
  return (
    <FeatureScreen title={getMessage(locale, "designSystemTitle")} withBottomNavigation={false}>
      <YStack gap="$sm" paddingBottom="$xl" borderBottomWidth={1} borderBottomColor="$border">
        <Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">
          {getMessage(locale, "designSystemIntroTitle")}
        </Text>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
          {getMessage(locale, "designSystemIntroBody")}
        </Text>
      </YStack>
      <PreviewSection id="button"><ButtonPreview /></PreviewSection>
      <PreviewSection id="input"><InputPreview /></PreviewSection>
      <PreviewSection id="card"><CardPreview /></PreviewSection>
      <PreviewSection id="dialog"><DialogPreview /></PreviewSection>
      <PreviewSection id="sheet"><SheetPreview /></PreviewSection>
      <PreviewSection id="toast"><ToastPreview /></PreviewSection>
      <PreviewSection id="switch"><SwitchPreview /></PreviewSection>
      <PreviewSection id="checkbox" last><CheckboxPreview /></PreviewSection>
    </FeatureScreen>
  );
}
