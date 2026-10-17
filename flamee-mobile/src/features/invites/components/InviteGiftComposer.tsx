import { Camera } from "@tamagui/lucide-icons-2/icons/Camera";
import { useEffect, useRef, useState } from "react";
import { Image, XStack, YStack } from "tamagui";
import { AppButton, AppField, AppFilterChip, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { localMediaAdapter } from "../../media";
import { VoiceDraftControl } from "../../moments/screens";
import { FlameeMascot } from "./FlameeMascot";
import type { InviteGift } from "../types";

type Kind = "none" | "mascot" | "photo" | "voice";
type MascotGift = Extract<InviteGift, { kind: "mascot" }>["gift"];

export function InviteGiftComposer({ initialGift = null, initialMessage = "", onSave }: {
  initialGift?: InviteGift | null; initialMessage?: string;
  onSave: (gift: InviteGift | null, message: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<Kind>(initialGift?.kind === "text" ? "none" : initialGift?.kind ?? "none");
  const [message, setMessage] = useState(initialMessage || (initialGift?.kind === "text" ? initialGift.text : ""));
  const [mascotGift, setMascotGift] = useState<MascotGift>(initialGift?.kind === "mascot" ? initialGift.gift : "heart");
  const [mediaUri, setMediaUri] = useState(initialGift && "uri" in initialGift ? initialGift.uri : "");
  const [seconds, setSeconds] = useState(initialGift?.kind === "voice" ? initialGift.durationSeconds : 0);
  const [caption, setCaption] = useState(initialGift?.kind === "photo" ? initialGift.caption : "");
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const committedUri = useRef<string | null>(initialGift && "uri" in initialGift ? initialGift.uri : null);
  const draftUri = useRef<string | null>(null);
  const mounted = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (draftUri.current !== committedUri.current) void localMediaAdapter.cleanup(draftUri.current); };
  }, []);

  const discardDraft = () => {
    if (draftUri.current !== committedUri.current) void localMediaAdapter.cleanup(draftUri.current);
    draftUri.current = null;
    setMediaUri(""); setSeconds(0); setSaved(false);
  };
  const choose = (next: Kind) => { if (busy || next === kind) return; discardDraft(); setKind(next); setUnavailable(false); setSaved(false); };
  const selectPhoto = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setUnavailable(false);
    try {
      const result = await localMediaAdapter.selectPhoto("library");
      if (!mounted.current) { if (result.kind === "selected") await localMediaAdapter.cleanup(result.uri); return; }
      if (result.kind === "selected") {
        if (draftUri.current !== committedUri.current) await localMediaAdapter.cleanup(draftUri.current);
        draftUri.current = result.uri; setMediaUri(result.uri); setSaved(false);
      } else if (result.kind === "denied" || result.kind === "unavailable") setUnavailable(true);
    } catch { if (mounted.current) setUnavailable(true); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  const save = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setFailed(false); setUnavailable(false);
    try {
      if ((kind === "photo" && !mediaUri) || (kind === "voice" && (!mediaUri || seconds <= 0))) { setUnavailable(true); return; }
      const gift: InviteGift | null = kind === "none" ? null
        : kind === "mascot" ? { kind: "mascot", mascot: "flamee", gift: mascotGift }
        : kind === "photo" ? { kind: "photo", uri: mediaUri, caption: caption.trim() }
        : { kind: "voice", uri: mediaUri, durationSeconds: seconds };
      // Transfer ownership before awaiting: navigation cannot delete saved media.
      const previousCommitted = committedUri.current;
      committedUri.current = gift && "uri" in gift ? gift.uri : null;
      try { await onSave(gift, message.trim()); }
      catch (error) { committedUri.current = previousCommitted; throw error; }
      if (mounted.current) setSaved(true);
    } catch { if (mounted.current) setFailed(true); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  };

  return <SectionCard title={getMessage("vi", "giftTitle")} description={getMessage("vi", "inviteOptionalGiftBody")}>
    <AppField multiline label={getMessage("vi", "giftMessageLabel")} placeholder={getMessage("vi", "giftMessagePlaceholder")} value={message} editable={!busy} maxLength={200} onChangeText={(value) => { setMessage(value); setSaved(false); }} characterCount={message.length + "/200"} />
    <XStack flexWrap="wrap" gap="$sm">
      <AppFilterChip selectionMode="single" label={getMessage("vi", "giftMessageOnly")} selected={kind === "none"} onPress={() => choose("none")} />
      <AppFilterChip selectionMode="single" label={getMessage("vi", "giftMascot")} selected={kind === "mascot"} onPress={() => choose("mascot")} />
      <AppFilterChip selectionMode="single" label={getMessage("vi", "giftPhoto")} selected={kind === "photo"} onPress={() => choose("photo")} />
      <AppFilterChip selectionMode="single" label={getMessage("vi", "giftVoice")} selected={kind === "voice"} onPress={() => choose("voice")} />
    </XStack>
    {kind === "mascot" ? <YStack gap="$sm" alignItems="center">
      <FlameeMascot gift={mascotGift} />
      <XStack flexWrap="wrap" justifyContent="center" gap="$sm">
        {(["heart", "hug", "flower"] as const).map((gift) => <AppFilterChip key={gift} selectionMode="single" label={getMessage("vi", gift === "heart" ? "mascotHeart" : gift === "hug" ? "mascotHug" : "mascotFlower")} selected={mascotGift === gift} onPress={() => { if (!busy) { setMascotGift(gift); setSaved(false); } }} />)}
      </XStack>
    </YStack> : kind === "photo" ? <YStack gap="$sm">
      <AppButton variant="secondary" disabled={busy} icon={<Camera size={18} />} onPress={() => void selectPhoto()}>{getMessage("vi", "giftPhotoReady")}</AppButton>
      {mediaUri ? <Image source={{ uri: mediaUri }} width="100%" height={180} borderRadius="$md" resizeMode="cover" aria-label={getMessage("vi", "photoPreviewLabel")} /> : null}
      <AppField label={getMessage("vi", "photoCaptionLabel")} value={caption} editable={!busy} maxLength={100} onChangeText={(value) => { setCaption(value); setSaved(false); }} />
    </YStack> : kind === "voice" ? <VoiceDraftControl onReady={(uri, duration) => { draftUri.current = uri; setMediaUri(uri); setSeconds(duration); setSaved(false); }} onReset={discardDraft} /> : null}
    {unavailable ? <StatusBanner tone="info" title={getMessage("vi", "giftMediaUnavailable")} description={getMessage("vi", "photoFallbackBody")} /> : null}
    {failed ? <StatusBanner tone="warning" title={getMessage("vi", "localSaveErrorTitle")} description={getMessage("vi", "localSaveErrorBody")} /> : null}
    {saved ? <StatusBanner tone="success" title={getMessage("vi", "giftSavedLocal")} /> : null}
    <AppButton variant="secondary" disabled={busy} onPress={() => void save()}>{getMessage("vi", "saveInvitationContent")}</AppButton>
  </SectionCard>;
}
