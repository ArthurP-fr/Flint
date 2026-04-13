import type {
  MemberMessageConfig,
  MemberMessageKind,
  MemberMessageRenderType,
} from "./memberMessages.js";

export type { MemberMessageConfig, MemberMessageKind, MemberMessageRenderType } from "./memberMessages.js";

export const MEMBER_MESSAGE_KINDS: readonly MemberMessageKind[] = ["welcome", "goodbye"];

export const MEMBER_MESSAGE_RENDER_TYPES: readonly MemberMessageRenderType[] = ["simple", "embed", "container", "image"];

export const DEFAULT_MEMBER_MESSAGE_RENDER_TYPE: MemberMessageRenderType = "simple";

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
