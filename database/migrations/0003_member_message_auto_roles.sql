ALTER TABLE bot_member_message_configs
  ADD COLUMN IF NOT EXISTS auto_role_ids TEXT NOT NULL DEFAULT '[]';
