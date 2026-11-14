const INVITE_CODE_LENGTH = 6;

export type InviteCountdown = {
  expired: boolean;
  hours: string;
  minutes: string;
  seconds: string;
};

export function splitInviteCode(code: string): string[] {
  const normalized = code.trim().toUpperCase().slice(0, INVITE_CODE_LENGTH);
  return Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => normalized[index] ?? "");
}

export function getInviteCountdown(expiresAt: string, now = Date.now()): InviteCountdown {
  const remainingSeconds = Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return {
    expired: remainingSeconds === 0,
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}
