import { Mic, Play, RotateCcw, Square } from "@tamagui/lucide-icons-2";
import { RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { localMediaAdapter } from "../../media/localMediaAdapter";

type Props = { onReady: (uri: string, durationSeconds: number) => void; onReset: () => void };

export function VoiceDraftControl({ onReady, onReset }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState<"native" | "unavailable" | "denied">("native");
  const [readyUri, setReadyUri] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nativeRecording = useRef(false);
  const mounted = useRef(true);
  const operationGeneration = useRef(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(readyUri);

  const stop = async (duration = seconds) => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecording(false);
    let nativeUri: string | null = null;
    if (nativeRecording.current) {
      nativeRecording.current = false;
      try {
        await recorder.stop();
        nativeUri = recorder.uri ?? null;
      } catch {
        if (mounted.current) setMode("unavailable");
      }
    }
    await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    if (!mounted.current) {
      if (nativeUri) {
        localMediaAdapter.prepareVoiceForReview(nativeUri, 1);
        await localMediaAdapter.cleanup(nativeUri);
      }
      return;
    }
    if (duration <= 0) {
      if (nativeUri) {
        localMediaAdapter.prepareVoiceForReview(nativeUri, 1);
        await localMediaAdapter.cleanup(nativeUri);
      }
      setReadyUri(null);
      onReset();
      return;
    }
    if (nativeUri) {
      const result = localMediaAdapter.prepareVoiceForReview(nativeUri, duration);
      if (result.kind === "selected") {
        setReadyUri(result.uri);
        onReady(result.uri, duration);
      } else {
        localMediaAdapter.prepareVoiceForReview(nativeUri, 1);
        await localMediaAdapter.cleanup(nativeUri);
        setMode("unavailable");
      }
      return;
    }
    setReadyUri(null);
    setMode("unavailable");
  };

  const start = async () => {
    const generation = ++operationGeneration.current;
    const operationIsActive = () => mounted.current && operationGeneration.current === generation;
    setSeconds(0);
    setReadyUri(null);
    onReset();
    const permission = await localMediaAdapter.requestVoicePermission();
    if (!operationIsActive()) return;
    if (permission.kind === "denied") {
      setMode("denied");
      return;
    }
    if (permission.kind === "unavailable") {
      setMode("unavailable");
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (!operationIsActive()) {
        await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
        return;
      }
      await recorder.prepareToRecordAsync();
      if (!operationIsActive()) {
        await recorder.stop().catch(() => undefined);
        await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
        return;
      }
      recorder.record({ forDuration: 30 });
      nativeRecording.current = true;
      setMode("native");
    } catch {
      if (!operationIsActive()) {
        await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
        return;
      }
      nativeRecording.current = false;
      setMode("unavailable");
    }
    if (!operationIsActive()) return;
    setRecording(true);
  };

  useEffect(() => {
    if (!recording) return;
    timer.current = setInterval(() => {
      setSeconds((value) => {
        const next = Math.min(value + 1, 30);
        return next;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [recording, onReady]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      operationGeneration.current += 1;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      if (nativeRecording.current) {
        nativeRecording.current = false;
        void recorder.stop().then(() => {
          if (recorder.uri) {
            localMediaAdapter.prepareVoiceForReview(recorder.uri, 1);
            return localMediaAdapter.cleanup(recorder.uri);
          }
        }).catch(() => undefined).finally(() => {
          void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
        });
      } else {
        void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      }
    };
  }, [recorder]);

  useEffect(() => {
    if (recording && seconds >= 30) void stop(30);
  }, [recording, seconds]);

  return (
    <YStack gap="$sm">
      <StatusBanner
        tone={mode === "denied" ? "warning" : "info"}
        title={getMessage("vi", mode === "denied" ? "voicePermissionDeniedTitle" : mode === "unavailable" ? "voiceFallbackTitle" : "voiceNativeTitle")}
        description={getMessage("vi", mode === "denied" ? "voicePermissionDeniedBody" : mode === "unavailable" ? "voiceFallbackBody" : "voiceNativeBody")}
      />
      <XStack alignItems="center" gap="$md">
        <YStack width={64} height={64} borderRadius="$xl" backgroundColor="$supportLavenderLight" alignItems="center" justifyContent="center">
          <Text fontSize="$h4" color="$primary">{seconds}s</Text>
        </YStack>
        <YStack flex={1} gap="$sm">
          {recording ? (
            <AppButton icon={<Square size={18} />} onPress={() => void stop()}>{getMessage("vi", "stopRecording")}</AppButton>
          ) : (
            <AppButton icon={seconds ? <RotateCcw size={18} /> : <Mic size={18} />} onPress={() => void start()}>
              {getMessage("vi", seconds ? "recordAgain" : "startRecording")}
            </AppButton>
          )}
          {readyUri ? <AppButton variant="ghost" icon={<Play size={18} />} onPress={() => player.play()}>{getMessage("vi", "playRecording")}</AppButton> : null}
          <Text fontSize="$bodyS" color="$textSecondary">{formatMessage("vi", "voiceLimit", { seconds: 30 })}</Text>
        </YStack>
      </XStack>
    </YStack>
  );
}
