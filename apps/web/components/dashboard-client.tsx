"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { useT } from "../i18n/client";
import { Badge } from "./ui/Badge";
import { Button, buttonClassName } from "./ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/Card";
import { Input } from "./ui/Input";

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

  const statusBadgeVariant: Record<
    BotStatus,
    "neutral" | "warning" | "success" | "danger"
  > = {
    stopped: "neutral",
    starting: "warning",
    running: "success",
    stopping: "warning",
    error: "danger",
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
      const message =
        cause instanceof Error
          ? cause.message
          : t("dashboard.errors.unexpected");
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
      const message =
        cause instanceof Error
          ? cause.message
          : t("dashboard.errors.unexpected");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerAction = async (botId: string, action: BotAction) => {
    setError(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/bots/${botId}/${action}`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(
          errorJson.error ??
            t("dashboard.errors.actionFailed", { action: actionLabel[action] }),
        );
      }

      await refreshData();
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : t("dashboard.errors.unexpected");
      setError(message);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-xl">
        <CardContent>
          <p className="text-sm text-[var(--foreground-muted)]">
            {t("dashboard.loading")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="warning">
            {t("dashboard.sessionRequired")}
          </Badge>
          <CardTitle>{t("dashboard.loginRequired")}</CardTitle>
          <CardDescription>{t("dashboard.loginDescription")}</CardDescription>
        </CardHeader>

        <CardContent>
          <a
            className={buttonClassName({ size: "lg", variant: "primary" })}
            href={`${apiBaseUrl}/auth/discord/login`}
          >
            {t("dashboard.loginCta")}
          </a>
        </CardContent>
      </Card>
    );
  }

  const userRoleLabel =
    user.role === "owner"
      ? t("dashboard.roles.owner")
      : t("dashboard.roles.member");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="accent">
            {t("dashboard.tenant", { tenantId: user.tenantId })}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {user.username}
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            {t("dashboard.role", { role: userRoleLabel })}
          </p>
        </div>
        <Button onClick={handleLogout} variant="secondary">
          {t("dashboard.logout")}
        </Button>
      </header>

      {error ? (
        <Card className="border-[color:color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--danger)_10%,var(--surface))]">
          <CardContent>
            <p className="text-sm font-semibold text-[var(--danger)]">
              {error}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.2fr)]">
        <article>
          <Card className="h-full">
            <CardHeader className="space-y-2">
              <CardTitle>{t("dashboard.addBot.title")}</CardTitle>
              <CardDescription>
                {t("dashboard.addBot.description")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="space-y-4" onSubmit={handleAddBot}>
                <label htmlFor="bot-token">
                  <span>{t("dashboard.addBot.tokenLabel")}</span>
                  <Input
                    autoComplete="off"
                    id="bot-token"
                    name="token"
                    onChange={(event) => setToken(event.target.value)}
                    placeholder={t("dashboard.addBot.tokenPlaceholder")}
                    required
                    type="password"
                    value={token}
                  />
                </label>

                <label htmlFor="bot-display-name">
                  <span>{t("dashboard.addBot.displayNameLabel")}</span>
                  <Input
                    id="bot-display-name"
                    name="displayName"
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder={t("dashboard.addBot.displayNamePlaceholder")}
                    type="text"
                    value={displayName}
                  />
                </label>

                <Button
                  disabled={submitting}
                  fullWidth
                  type="submit"
                  variant="primary"
                >
                  {submitting
                    ? t("dashboard.addBot.submitPending")
                    : t("dashboard.addBot.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </article>

        <article>
          <Card className="h-full">
            <CardHeader className="mb-4 flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle>{t("dashboard.bots.title")}</CardTitle>
              <Button
                onClick={() => void refreshData()}
                size="sm"
                variant="secondary"
              >
                {t("dashboard.bots.refresh")}
              </Button>
            </CardHeader>

            <CardContent className="space-y-3">
              {bots.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">
                  {t("dashboard.bots.empty")}
                </p>
              ) : (
                <ul className="m-0 grid list-none gap-3 p-0">
                  {bots.map((bot) => (
                    <li
                      className="space-y-4 rounded-xl border border-[var(--border-muted)] bg-[var(--surface-subtle)] p-4"
                      key={bot.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-[var(--foreground)]">
                            {bot.displayName}
                          </p>
                          <p className="mono text-xs text-[var(--foreground-muted)]">
                            {t("dashboard.bots.discordId", {
                              discordBotId: bot.discordBotId,
                            })}
                          </p>
                        </div>

                        <Badge variant={statusBadgeVariant[bot.status]}>
                          {statusLabel[bot.status]}
                        </Badge>
                      </div>

                      {bot.lastError ? (
                        <p className="text-sm font-medium text-[var(--danger)]">
                          {t("dashboard.bots.lastError", {
                            message: bot.lastError,
                          })}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => void triggerAction(bot.id, "start")}
                          size="sm"
                          variant="secondary"
                        >
                          {actionLabel.start}
                        </Button>
                        <Button
                          onClick={() => void triggerAction(bot.id, "stop")}
                          size="sm"
                          variant="secondary"
                        >
                          {actionLabel.stop}
                        </Button>
                        <Button
                          onClick={() => void triggerAction(bot.id, "restart")}
                          size="sm"
                          variant="secondary"
                        >
                          {actionLabel.restart}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </article>
      </section>
    </div>
  );
}
