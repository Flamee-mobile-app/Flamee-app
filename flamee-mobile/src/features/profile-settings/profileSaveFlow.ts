import type { AuthSession } from "../auth";

type ProfileSaveDependencies = {
  updateProfile: (profile: { full_name: string; username: string }) => Promise<AuthSession>;
  updateAvatar: (file: { uri: string; name: string; type: string }) => Promise<AuthSession>;
};

type ProfileSaveInput = {
  currentSession: AuthSession;
  profileChanged: boolean;
  fullName: string;
  username: string;
  avatarUri: string | null;
};

export type ProfileSaveResult =
  | { kind: "saved"; session: AuthSession }
  | { kind: "profile_error" }
  | { kind: "avatar_error"; session: AuthSession };

export function hasProfileTextChanged(
  draft: { fullName: string; username: string },
  saved: { fullName: string; username: string },
) {
  return draft.fullName.trim() !== saved.fullName.trim()
    || draft.username.trim() !== saved.username.trim();
}

export async function saveProfileChanges(input: ProfileSaveInput, dependencies: ProfileSaveDependencies): Promise<ProfileSaveResult> {
  let session = input.currentSession;
  if (input.profileChanged) {
    try {
      session = await dependencies.updateProfile({ full_name: input.fullName, username: input.username });
    } catch {
      return { kind: "profile_error" };
    }
  }
  if (!input.avatarUri) return { kind: "saved", session };
  try {
    const avatarSession = await dependencies.updateAvatar({ uri: input.avatarUri, name: "avatar.jpg", type: "image/jpeg" });
    return { kind: "saved", session: avatarSession };
  } catch {
    return { kind: "avatar_error", session };
  }
}
