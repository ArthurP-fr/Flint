CREATE TABLE IF NOT EXISTS bot_presence_states (
  bot_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('online', 'idle', 'dnd', 'invisible', 'streaming')),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('PLAYING', 'STREAMING', 'WATCHING', 'LISTENING', 'COMPETING', 'CUSTOM')),
  activity_text TEXT NOT NULL,
  activity_texts TEXT NOT NULL DEFAULT '[]',
  rotation_interval_seconds INTEGER NOT NULL DEFAULT 30 CHECK (rotation_interval_seconds BETWEEN 5 AND 3600),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_member_message_configs (
  bot_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('welcome', 'goodbye')),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  channel_id TEXT,
  message_type TEXT NOT NULL DEFAULT 'simple' CHECK (message_type IN ('simple', 'embed', 'container', 'image')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bot_id, guild_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_bot_member_message_configs_bot_guild
  ON bot_member_message_configs (bot_id, guild_id);
