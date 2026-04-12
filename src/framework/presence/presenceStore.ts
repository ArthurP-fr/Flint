import { Pool } from "pg";

import { env } from "../config/env.js";
import {
  createDefaultPresenceState,
  isPresenceActivityTypeValue,
  isPresenceStatusValue,
  sanitizeActivityText,
  type PresenceActivityTypeValue,
  type PresenceState,
  type PresenceStatusValue,
} from "./presenceTypes.js";

interface PresenceRow {
  status: string;
  activity_type: string;
  activity_text: string;
}

const tableSql = `
CREATE TABLE IF NOT EXISTS bot_presence_states (
  bot_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const toPresenceState = (row: PresenceRow): PresenceState | null => {
  if (!isPresenceStatusValue(row.status) || !isPresenceActivityTypeValue(row.activity_type)) {
    return null;
  }

  return {
    status: row.status as PresenceStatusValue,
    activity: {
      type: row.activity_type as PresenceActivityTypeValue,
      text: sanitizeActivityText(row.activity_text),
    },
  };
};

class PresenceStore {
  public constructor(private readonly pool: Pool) {}

  public async init(): Promise<void> {
    await this.pool.query(tableSql);
  }

  public async getByBotId(botId: string): Promise<PresenceState> {
    const result = await this.pool.query<PresenceRow>(
      "SELECT status, activity_type, activity_text FROM bot_presence_states WHERE bot_id = $1 LIMIT 1",
      [botId],
    );

    const row = result.rows[0];
    if (!row) {
      return createDefaultPresenceState();
    }

    return toPresenceState(row) ?? createDefaultPresenceState();
  }

  public async upsertByBotId(botId: string, state: PresenceState): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO bot_presence_states (bot_id, status, activity_type, activity_text, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (bot_id)
        DO UPDATE SET
          status = EXCLUDED.status,
          activity_type = EXCLUDED.activity_type,
          activity_text = EXCLUDED.activity_text,
          updated_at = NOW()
      `,
      [botId, state.status, state.activity.type, sanitizeActivityText(state.activity.text)],
    );
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

let store: PresenceStore | null = null;

export const initPresenceStore = async (): Promise<PresenceStore> => {
  if (store) {
    return store;
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize PostgreSQL presence storage.");
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  });

  const nextStore = new PresenceStore(pool);
  await nextStore.init();
  store = nextStore;
  return nextStore;
};

export const getPresenceStore = (): PresenceStore => {
  if (!store) {
    throw new Error("PresenceStore is not initialized. Call initPresenceStore() during bootstrap.");
  }

  return store;
};

export const shutdownPresenceStore = async (): Promise<void> => {
  if (!store) {
    return;
  }

  await store.close();
  store = null;
};
