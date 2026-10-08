import { Camera, MessageCircle } from "@tamagui/lucide-icons-2";
import { useEffect, useRef, useState } from "react";
import { Image, XStack, YStack } from "tamagui";
import { AppButton, AppField, ChoiceChip, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { localMediaAdapter } from "../../media/localMediaAdapter";
import { VoiceDraftControl } from "../../moments/components/VoiceDraftControl";
import type { InviteGift } from "../types";

type InviteGiftComposerProps = {
  onSave: (gift: InviteGift) => Promise<void>;
};

export function InviteGiftComposer({ onSave }: InviteGiftComposerProps) {
  const [kind, setKind] = useState<InviteGift["kind"]>("text");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [mediaUnavailable, setMediaUnavailable] = useState(false);
  const [mediaUri, setMediaUri] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [caption, setCaption] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const ownedMediaUri = useRef<string | null>(null);
  const preserveMediaOnUnmount = useRef(false);

  useEffect(() => () => {
    if (!preserveMediaOnUnmount.current) void localMediaAdapter.cleanup(ownedMediaUri.current);
  }, []);

  const selectPhoto = async () => {
    const result = await localMediaAdapter.selectPhoto("library");
    if (result.kind === "selected") {
      await localMediaAdapter.cleanup(ownedMediaUri.current);
      ownedMediaUri.current = result.uri;
      setMediaUri(result.uri);
      setMediaUnavailable(false);
    } else if (result.kind === "denied" || result.kind === "unavailable") {
      resetMedia();
      setMediaUnavailable(true);
    }
  };

  const resetMedia = () => {
    void localMediaAdapter.cleanup(ownedMediaUri.current);
    ownedMediaUri.current = null;
    preserveMediaOnUnmount.current = false;
    setMediaUri("");
    setDurationSeconds(0);
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setMediaUnavailable(false);
    setSaveFailed(false);
    try {
      if ((kind === "photo" && !mediaUri) || (kind === "voice" && (!mediaUri || durationSeconds <= 0))) {
        setMediaUnavailable(true);
        return;
      }
      const gift: InviteGift = kind === "text"
        ? { kind: "text", text: text.trim() || getMessage("vi", "defaultInviteGiftMessage") }
        : kind === "photo" && mediaUri
          ? { kind: "photo", uri: mediaUri, caption: caption.trim() }
        : kind === "voice" && mediaUri && durationSeconds > 0
          ? { kind: "voice", uri: mediaUri, durationSeconds }
          : { kind: "text", text: text.trim() || getMessage("vi", "defaultInviteGiftMessage") };
      await onSave(gift);
      preserveMediaOnUnmount.current = Boolean("uri" in gift && gift.uri === ownedMediaUri.current);
      setSaved(true);
    } catch {
      setSaveFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title={getMessage("vi", "giftTitle")} description={getMessage("vi", "giftBody")}>
      <XStack flexWrap="wrap" gap="$sm">
        <ChoiceChip label={getMessage("vi", "giftText")} selected={kind === "text"} onPress={() => { resetMedia(); setKind("text"); setSaved(false); }} />
        <ChoiceChip label={getMessage("vi", "giftPhoto")} selected={kind === "photo"} onPress={() => { resetMedia(); setKind("photo"); setSaved(false); }} />
        <ChoiceChip label={getMessage("vi", "giftVoice")} selected={kind === "voice"} onPress={() => { resetMedia(); setKind("voice"); setSaved(false); }} />
      </XStack>
      {kind === "voice" ? (
        <VoiceDraftControl onReady={(uri, seconds) => { ownedMediaUri.current = uri; setMediaUri(uri); setDurationSeconds(seconds); setMediaUnavailable(false); }} onReset={resetMedia} />
      ) : kind === "photo" ? (
        <YStack gap="$sm">
          <AppButton variant="secondary" icon={<Camera size={18} />} onPress={() => void selectPhoto()}>{getMessage("vi", "giftPhotoReady")}</AppButton>
          {mediaUri ? <Image source={{ uri: mediaUri }} width="100%" height={180} borderRadius="$md" resizeMode="cover" accessibilityLabel={getMessage("vi", "photoPreviewLabel")} /> : null}
          <AppField label={getMessage("vi", "giftMessageLabel")} value={caption} maxLength={100} onChangeText={setCaption} />
        </YStack>
      ) : (
        <AppField multiline label={getMessage("vi", "giftMessageLabel")} placeholder={getMessage("vi", "giftMessagePlaceholder")} value={text} maxLength={200} onChangeText={setText} characterCount={`${text.length}/200`} />
      )}
      {mediaUnavailable ? <StatusBanner tone="info" title={getMessage("vi", "giftMediaUnavailable")} description={getMessage("vi", "photoFallbackBody")} /> : null}
      {saveFailed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
      {saved ? <StatusBanner tone="success" title={getMessage("vi", "giftSavedLocal")} /> : null}
      <AppButton variant="secondary" disabled={busy} icon={<MessageCircle size={18} />} onPress={() => void save()}>
        {getMessage("vi", "attachGift")}
      </AppButton>
    </SectionCard>
  );
}
