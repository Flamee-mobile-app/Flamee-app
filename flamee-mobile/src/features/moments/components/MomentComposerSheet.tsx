import { Camera, MessageCircle, Mic, Radio, Send } from "@tamagui/lucide-icons-2";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Text, XStack, YStack } from "tamagui";
import type { MomentDraft } from "../types";
import { AppButton, AppField, ChoiceChip, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import { localMediaAdapter } from "../../media/localMediaAdapter";
import { momentDraftSchema } from "../schemas";
import { VoiceDraftControl } from "./VoiceDraftControl";

type Kind = MomentDraft["kind"];
type Props = {
  initialText?: string;
  initialKind?: Kind;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (draft: MomentDraft) => void;
};

const signals: Array<{ value: string; label: MessageKey }> = [
  { value: "miss_you", label: "signalMissYou" },
  { value: "thinking_of_you", label: "signalThinkingOfYou" },
  { value: "good_night", label: "signalGoodNight" },
];

export function MomentComposerSheet({ initialText = "", initialKind, busy, onCancel, onSubmit }: Props) {
  const [kind, setKind] = useState<Kind>(initialKind ?? (initialText ? "text" : "signal"));
  const [text, setText] = useState(initialKind === "voice" || initialKind === "photo" ? "" : initialText);
  const [caption, setCaption] = useState(initialKind === "voice" || initialKind === "photo" ? initialText.slice(0, 100) : "");
  const [place, setPlace] = useState("");
  const [mediaUri, setMediaUri] = useState("");
  const [duration, setDuration] = useState(0);
  const [mediaState, setMediaState] = useState<"idle" | "denied" | "cancelled" | "unavailable" | "ready">("idle");
  const [error, setError] = useState("");
  const ownedMediaUri = useRef<string | null>(null);
  const preserveMediaOnUnmount = useRef(false);
  const mounted = useRef(true);
  const mediaGeneration = useRef(0);

  const discardOwnedMedia = useCallback(async () => {
    const uri = ownedMediaUri.current;
    ownedMediaUri.current = null;
    await localMediaAdapter.cleanup(uri);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      mediaGeneration.current += 1;
      if (!preserveMediaOnUnmount.current) void localMediaAdapter.cleanup(ownedMediaUri.current);
    };
  }, []);

  const selectPhoto = async (source: "camera" | "library") => {
    const generation = ++mediaGeneration.current;
    const result = await localMediaAdapter.selectPhoto(source);
    if (!mounted.current || generation !== mediaGeneration.current) {
      if (result.kind === "selected") await localMediaAdapter.cleanup(result.uri);
      return;
    }
    if (result.kind === "selected") { await discardOwnedMedia(); ownedMediaUri.current = result.uri; setMediaUri(result.uri); setMediaState("ready"); }
    else if (result.kind === "unavailable") { await discardOwnedMedia(); setMediaUri(""); setMediaState("unavailable"); }
    else if (result.kind === "denied") setMediaState("denied");
    else if (result.kind === "cancelled") setMediaState("cancelled");
  };
  const onVoiceReady = useCallback((uri: string, seconds: number) => {
    const previousUri = ownedMediaUri.current;
    ownedMediaUri.current = uri;
    if (previousUri !== uri) void localMediaAdapter.cleanup(previousUri);
    setMediaUri(uri); setDuration(seconds); setMediaState("ready");
  }, []);
  const submit = () => {
    const draft: MomentDraft = kind === "text" || kind === "signal"
      ? { kind, text }
      : kind === "photo"
        ? { kind, mediaUri, caption, place }
        : { kind, mediaUri, durationSeconds: duration, caption, place };
    const parsed = momentDraftSchema.safeParse(draft);
    if (!parsed.success) { setError(getMessage("vi", "momentValidationError")); return; }
    setError("");
    mediaGeneration.current += 1;
    if (parsed.data.kind === "photo" || parsed.data.kind === "voice") {
      preserveMediaOnUnmount.current = parsed.data.mediaUri === ownedMediaUri.current;
      if (!preserveMediaOnUnmount.current) void discardOwnedMedia();
    } else {
      preserveMediaOnUnmount.current = false;
      void discardOwnedMedia();
    }
    onSubmit(parsed.data);
  };

  return (
    <SectionCard title={getMessage("vi", "createMomentTitle")} description={getMessage("vi", "createMomentBody")}>
      <XStack flexWrap="wrap" gap="$sm">
        <ChoiceChip label={getMessage("vi", "momentText")} selected={kind === "text"} onPress={() => setKind("text")} />
        <ChoiceChip label={getMessage("vi", "momentPhoto")} selected={kind === "photo"} onPress={() => setKind("photo")} />
        <ChoiceChip label={getMessage("vi", "momentVoice")} selected={kind === "voice"} onPress={() => setKind("voice")} />
        <ChoiceChip label={getMessage("vi", "momentSignal")} selected={kind === "signal"} onPress={() => setKind("signal")} />
      </XStack>
      {kind === "text" ? <AppField multiline label={getMessage("vi", "momentTextLabel")} value={text} onChangeText={setText} maxLength={200} characterCount={`${text.length}/200`} /> : null}
      {kind === "signal" ? <XStack flexWrap="wrap" gap="$sm">{signals.map((signal) => <ChoiceChip key={signal.value} label={getMessage("vi", signal.label)} selected={text === getMessage("vi", signal.label)} onPress={() => setText(getMessage("vi", signal.label))} />)}</XStack> : null}
      {kind === "photo" ? (
        <YStack gap="$sm">
          <XStack gap="$sm"><AppButton flex={1} variant="secondary" icon={<Camera size={18} />} onPress={() => void selectPhoto("camera")}>{getMessage("vi", "takePhoto")}</AppButton><AppButton flex={1} variant="ghost" onPress={() => void selectPhoto("library")}>{getMessage("vi", mediaUri ? "chooseAnotherPhoto" : "choosePhoto")}</AppButton></XStack>
          {mediaState === "ready" && mediaUri ? <Image source={{ uri: mediaUri }} width="100%" height={220} borderRadius="$lg" resizeMode="cover" accessibilityLabel={getMessage("vi", "photoPreviewLabel")} /> : null}
          {mediaState === "denied" ? <StatusBanner tone="warning" title={getMessage("vi", "photoPermissionDeniedTitle")} description={getMessage("vi", "photoPermissionDeniedBody")} /> : null}
          {mediaState === "unavailable" ? <StatusBanner tone="info" title={getMessage("vi", "photoFallbackTitle")} description={getMessage("vi", "photoFallbackBody")} /> : null}
        </YStack>
      ) : null}
      {kind === "voice" ? <VoiceDraftControl onReady={onVoiceReady} onReset={() => { void discardOwnedMedia(); setMediaUri(""); setDuration(0); setMediaState("idle"); }} /> : null}
      {kind === "photo" || kind === "voice" ? (
        <YStack gap="$sm">
          <AppField label={getMessage("vi", "captionLabel")} value={caption} onChangeText={setCaption} maxLength={100} characterCount={`${caption.length}/100`} />
          <AppField label={getMessage("vi", "placeLabel")} value={place} onChangeText={setPlace} maxLength={80} help={getMessage("vi", "placeHelp")} />
        </YStack>
      ) : null}
      {error ? <Text color="$error" fontSize="$bodyS">{error}</Text> : null}
      <XStack gap="$sm">
        <AppButton flex={1} variant="ghost" disabled={busy} onPress={() => { void discardOwnedMedia(); onCancel(); }}>{getMessage("vi", "cancel")}</AppButton>
        <AppButton flex={1} icon={kind === "voice" ? <Mic size={18} /> : kind === "photo" ? <Camera size={18} /> : kind === "signal" ? <Radio size={18} /> : <MessageCircle size={18} />} disabled={busy} onPress={submit}>{getMessage("vi", "sendMoment")}</AppButton>
      </XStack>
    </SectionCard>
  );
}
