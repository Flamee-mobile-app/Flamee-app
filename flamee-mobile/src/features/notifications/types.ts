export type NotificationPermission = "not_requested" | "granted" | "denied" | "unavailable";

export type NotificationSettings = {
  accountId: string;
  permission: NotificationPermission;
  firstCheckInCompleted: boolean;
  promptDismissed: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
};

export type NotificationIntent =
  | { kind: "nudge"; id: string }
  | { kind: "moment"; id: string };

export type NotificationSettingsResult =
  | { kind: "updated"; settings: NotificationSettings }
  | { kind: "permission_required"; settings: NotificationSettings }
  | { kind: "invalid_time"; settings: NotificationSettings }
  | { kind: "unavailable"; settings: NotificationSettings };
