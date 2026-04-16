import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultMemberMessageConfig,
  sanitizeMemberMessageRoleIds,
} from "../src/validators/memberMessages.js";

test("createDefaultMemberMessageConfig initialise les roles auto vides", () => {
  const config = createDefaultMemberMessageConfig();

  assert.equal(config.enabled, false);
  assert.equal(config.channelId, null);
  assert.equal(config.messageType, "simple");
  assert.deepEqual(config.autoRoleIds, []);
});

test("sanitizeMemberMessageRoleIds filtre les valeurs invalides et dedupe", () => {
  const roleIds = sanitizeMemberMessageRoleIds([
    "123456789012345678",
    "123456789012345678",
    " 223456789012345678 ",
    "not-a-role",
    "",
  ]);

  assert.deepEqual(roleIds, ["123456789012345678", "223456789012345678"]);
});
