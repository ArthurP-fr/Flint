export const PRESENCE_STATUSES = ["online", "idle", "dnd", "invisible", "streaming"] as const;
export const PRESENCE_ACTIVITY_TYPES = [
  "PLAYING",
  "STREAMING",
  "WATCHING",
  "LISTENING",
  "COMPETING",
  "CUSTOM",
] as const;

export type PresenceStatusValue = (typeof PRESENCE_STATUSES)[number];
export type PresenceActivityTypeValue = (typeof PRESENCE_ACTIVITY_TYPES)[number];

export interface PresenceState {
  status: PresenceStatusValue;
  activity: {
    type: PresenceActivityTypeValue;
    text: string;
  };
}

export const DEFAULT_ACTIVITY_TEXT = "Ready to help";

export const createDefaultPresenceState = (): PresenceState => ({
  status: "online",
  activity: {
    type: "CUSTOM",
    text: DEFAULT_ACTIVITY_TEXT,
  },
});

export const isPresenceStatusValue = (value: string): value is PresenceStatusValue =>
  (PRESENCE_STATUSES as readonly string[]).includes(value);

export const isPresenceActivityTypeValue = (value: string): value is PresenceActivityTypeValue =>
  (PRESENCE_ACTIVITY_TYPES as readonly string[]).includes(value);

export const sanitizeActivityText = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return DEFAULT_ACTIVITY_TEXT;
  }

  return trimmed.slice(0, 128);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const parsePresenceState = (value: unknown): PresenceState | null => {
  if (!isRecord(value)) {
    return null;
  }

  const statusValue = value.status;
  const activityValue = value.activity;

  if (typeof statusValue !== "string" || !isPresenceStatusValue(statusValue) || !isRecord(activityValue)) {
    return null;
  }

  const activityType = activityValue.type;
  const activityText = activityValue.text;

  if (
    typeof activityType !== "string"
    || !isPresenceActivityTypeValue(activityType)
    || typeof activityText !== "string"
  ) {
    return null;
  }

  return {
    status: statusValue,
    activity: {
      type: activityType,
      text: sanitizeActivityText(activityText),
    },
  };
};
