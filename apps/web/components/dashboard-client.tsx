"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useT } from "../i18n/client";

type User = {
  id: string;
  tenantId: string;
  username: string;
  avatarUrl: string | null;
  role: "owner" | "member";
};

type BotStatus = "stopped" | "starting" | "running" | "stopping" | "error";

type Bot = {
  id: string;
  tenantId: string;
  discordBotId: string;
  displayName: string;
  status: BotStatus;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

type DashboardClientProps = {
  apiBaseUrl: string;
};

type BotAction = "start" | "stop" | "restart";

export function DashboardClient({ apiBaseUrl }: DashboardClientProps) {
  const t = useT();

  const statusLabel: Record<BotStatus, string> = {
    stopped: t("dashboard.status.stopped"),
    starting: t("dashboard.status.starting"),
    running: t("dashboard.status.running"),
    stopping: t("dashboard.status.stopping"),
    error: t("dashboard.status.error"),
  };

  const actionLabel: Record<BotAction, string> = {
    start: t("dashboard.actions.start"),
    stop: t("dashboard.actions.stop"),
    restart: t("dashboard.actions.restart"),
  };

  const [user, setUser] = useState<User | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [token, setToken] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const meResponse = await fetch(`${apiBaseUrl}/api/me`, {
        credentials: "include",
      });

      if (meResponse.status === 401) {
        setUser(null);
        setBots([]);
        setLoading(false);
        return;
      }

      if (!meResponse.ok) {
        throw new Error(t("dashboard.errors.fetchSession"));
      }

      const meJson = await meResponse.json();
      setUser(meJson.user as User);

      const botsResponse = await fetch(`${apiBaseUrl}/api/bots`, {
        credentials: "include",
      });

      if (!botsResponse.ok) {
        throw new Error(t("dashboard.errors.fetchBots"));
      }

      const botsJson = await botsResponse.json();
      setBots((botsJson.bots ?? []) as Bot[]);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t("dashboard.errors.unexpected");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, t]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const handleLogout = async () => {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setBots([]);
  };

  const handleAddBot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/bots`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          displayName: displayName.trim().length > 0 ? displayName : undefined,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error ?? t("dashboard.errors.addBot"));
      }

      setToken("");
      setDisplayName("");
      await refreshData();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t("dashboard.errors.unexpected");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerAction = async (botId: string, action: BotAction) => {
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/bots/${botId}/${action}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error ?? t("dashboard.errors.actionFailed", { action: actionLabel[action] }));
      }

      await refreshData();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t("dashboard.errors.unexpected");
      setError(message);
    }
  };

  if (loading) {
    return <p className="muted">{t("dashboard.loading")}</p>;
  }

  if (!user) {
    return (
      <div className="stack">
        <p className="eyebrow">{t("dashboard.sessionRequired")}</p>
        <h1>{t("dashboard.loginRequired")}</h1>
        <p>{t("dashboard.loginDescription")}</p>
        <a className="button-primary" href={`${apiBaseUrl}/auth/discord/login`}>
          {t("dashboard.loginCta")}
        </a>
      </div>
    );
  }

  return (
    <div className="stack">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">{t("dashboard.tenant", { tenantId: user.tenantId })}</p>
          <h1>{user.username}</h1>
          <p className="muted">{t("dashboard.role", { role: user.role })}</p>
        </div>
        <button className="button-ghost" onClick={handleLogout} type="button">
          {t("dashboard.logout")}
        </button>
      </header>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="card-grid">
        <article className="card add-bot-card">
          <h2>{t("dashboard.addBot.title")}</h2>
          <p>{t("dashboard.addBot.description")}</p>
          <form className="stack-tight" onSubmit={handleAddBot}>
            <label>
              {t("dashboard.addBot.tokenLabel")}
              <input
                autoComplete="off"
                name="token"
                onChange={(event) => setToken(event.target.value)}
                placeholder="MTIz..."
                required
                type="password"
                value={token}
              />
            </label>
            <label>
              {t("dashboard.addBot.displayNameLabel")}
              <input
                name="displayName"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Bot support EU"
                type="text"
                value={displayName}
              />
            </label>
            <button className="button-primary" disabled={submitting} type="submit">
              {submitting ? t("dashboard.addBot.submitPending") : t("dashboard.addBot.submit")}
            </button>
          </form>
        </article>

        <article className="card bots-card">
          <div className="row-between">
            <h2>{t("dashboard.bots.title")}</h2>
            <button className="button-ghost" onClick={() => void refreshData()} type="button">
              {t("dashboard.bots.refresh")}
            </button>
          </div>

          {bots.length === 0 ? (
            <p className="muted">{t("dashboard.bots.empty")}</p>
          ) : (
            <ul className="bot-list">
              {bots.map((bot) => (
                <li className="bot-item" key={bot.id}>
                  <div className="bot-main">
                    <p className="bot-name">{bot.displayName}</p>
                    <p className="muted mono">{t("dashboard.bots.discordId", { discordBotId: bot.discordBotId })}</p>
                    <p className={`status status-${bot.status}`}>{statusLabel[bot.status]}</p>
                    {bot.lastError ? <p className="error-inline">{t("dashboard.bots.lastError", { message: bot.lastError })}</p> : null}
                  </div>
                  <div className="actions">
                    <button onClick={() => void triggerAction(bot.id, "start")} type="button">
                      {actionLabel.start}
                    </button>
                    <button onClick={() => void triggerAction(bot.id, "stop")} type="button">
                      {actionLabel.stop}
                    </button>
                    <button onClick={() => void triggerAction(bot.id, "restart")} type="button">
                      {actionLabel.restart}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
