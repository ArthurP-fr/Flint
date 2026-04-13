import type { MemberMessageService } from "../features/memberMessages/service.js";
import type { PresenceService } from "../features/presence/service.js";

export interface AppFeatureServices {
  presenceService: PresenceService;
  memberMessageService: MemberMessageService;
}
