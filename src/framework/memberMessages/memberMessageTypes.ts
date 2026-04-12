export const MEMBER_MESSAGE_KINDS = ["welcome", "goodbye"] as const;
export type MemberMessageKind = (typeof MEMBER_MESSAGE_KINDS)[number];

export const MEMBER_MESSAGE_RENDER_TYPES = ["simple", "embed", "container", "image"] as const;
export type MemberMessageRenderType = (typeof MEMBER_MESSAGE_RENDER_TYPES)[number];

export const DEFAULT_MEMBER_MESSAGE_RENDER_TYPE: MemberMessageRenderType = "simple";

export interface MemberMessageConfig {
  enabled: boolean;
  channelId: string | null;
  messageType: MemberMessageRenderType;
}

export const createDefaultMemberMessageConfig = (): MemberMessageConfig => ({
  enabled: false,
  channelId: null,
  messageType: DEFAULT_MEMBER_MESSAGE_RENDER_TYPE,
});

export const isMemberMessageKindValue = (value: string): value is MemberMessageKind => {
  return MEMBER_MESSAGE_KINDS.includes(value as MemberMessageKind);
};

export const isMemberMessageRenderTypeValue = (value: string): value is MemberMessageRenderType => {
  return MEMBER_MESSAGE_RENDER_TYPES.includes(value as MemberMessageRenderType);
};
