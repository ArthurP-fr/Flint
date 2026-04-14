import {
  PermissionsBitField,
  type PermissionResolvable,
} from "discord.js";

import type { BotCommand, CommandExecutionContext } from "../../types/command.js";
import type { AppLogger } from "../logging/logger.js";
import type { CooldownStore } from "./cooldownStore.js";
import type {
  GlobalRateLimitPolicy,
  GlobalRateLimitStore,
} from "./globalRateLimitStore.js";

export interface CommandExecutorDeps {
  cooldownStore: CooldownStore;
  globalRateLimitStore: GlobalRateLimitStore;
  globalRateLimitPolicy: GlobalRateLimitPolicy;
  logger: AppLogger;
}

export class CommandExecutor {
  public constructor(private readonly deps: CommandExecutorDeps) {}

  public async run(command: BotCommand, ctx: CommandExecutionContext): Promise<void> {
    if (this.isSensitiveCommand(command) && !ctx.transport.guild) {
      await ctx.reply(
        ctx.t("errors.permissions.user", {
          permissions: this.formatPermissionLabel("ManageGuild"),
        }),
      );
      return;
    }

    const rateLimitRetryAfterSeconds = await this.consumeGlobalRateLimit(ctx);
    if (rateLimitRetryAfterSeconds > 0) {
      await ctx.reply(ctx.t("errors.rateLimit", { seconds: rateLimitRetryAfterSeconds }));
      return;
    }

    const availablePermissions = await this.resolveMemberPermissions(ctx);
    const missingUserPermissions = this.getMissingPermissions(command.permissions, availablePermissions);
    if (missingUserPermissions.length > 0) {
      await ctx.reply(ctx.t("errors.permissions.user", { permissions: missingUserPermissions.join(", ") }));
      return;
    }

    const remainingCooldownSeconds = await this.consumeCooldown(command, ctx.execution.actor.userId);
    if (remainingCooldownSeconds > 0) {
      await ctx.reply(ctx.t("errors.cooldown", { seconds: remainingCooldownSeconds }));
      return;
    }

    try {
      await command.execute(ctx);
    } catch (error) {
      this.deps.logger.error(
        {
          requestId: ctx.execution.requestId,
          command: command.meta.name,
          source: ctx.execution.source,
          userId: ctx.execution.actor.userId,
          err: error,
        },
        "command execution failed",
      );
      await ctx.reply(ctx.t("errors.execution"));
    }
  }

  private async resolveMemberPermissions(
    ctx: CommandExecutionContext,
  ): Promise<Readonly<PermissionsBitField> | null> {
    try {
      return await ctx.transport.resolveMemberPermissions();
    } catch (error) {
      this.deps.logger.warn(
        {
          requestId: ctx.execution.requestId,
          source: ctx.execution.source,
          userId: ctx.execution.actor.userId,
          err: error,
        },
        "permission resolution failed",
      );
      return null;
    }
  }

  private getMissingPermissions(
    required: PermissionResolvable[],
    available: Readonly<PermissionsBitField> | null,
  ): string[] {
    if (required.length === 0) {
      return [];
    }

    if (!available) {
      return [...new Set(required.flatMap((permission) => this.permissionToLabels(permission)))];
    }

    return [
      ...new Set(
        required
          .filter((permission) => !available.has(permission))
          .flatMap((permission) => this.permissionToLabels(permission)),
      ),
    ];
  }

  private permissionToLabels(permission: PermissionResolvable): string[] {
    try {
      const resolved = PermissionsBitField.resolve(permission);
      const labels = new PermissionsBitField(resolved).toArray().map(this.formatPermissionLabel);
      if (labels.length > 0) {
        return labels;
      }
    } catch {
      // Fallback handled below.
    }

    return [String(permission)];
  }

  private formatPermissionLabel(permission: string): string {
    return permission
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .trim();
  }

  private async consumeCooldown(command: BotCommand, userId: string): Promise<number> {
    if (command.cooldown === undefined || command.cooldown <= 0) {
      return 0;
    }

    try {
      const result = await this.deps.cooldownStore.consume(command.meta.name, userId, command.cooldown);
      return result.allowed ? 0 : result.retryAfterSeconds;
    } catch (error) {
      this.deps.logger.warn(
        {
          command: command.meta.name,
          userId,
          err: error,
        },
        "cooldown store unavailable, continuing without cooldown enforcement",
      );
      return 0;
    }
  }

  private async consumeGlobalRateLimit(ctx: CommandExecutionContext): Promise<number> {
    try {
      const result = await this.deps.globalRateLimitStore.consume(
        ctx.execution.actor.userId,
        this.deps.globalRateLimitPolicy,
      );

      if (result.allowed) {
        return 0;
      }

      return result.retryAfterSeconds;
    } catch (error) {
      this.deps.logger.warn(
        {
          requestId: ctx.execution.requestId,
          userId: ctx.execution.actor.userId,
          err: error,
        },
        "global rate limit store unavailable, continuing without rate limiting",
      );

      return 0;
    }
  }

  private isSensitiveCommand(command: BotCommand): boolean {
    return command.sensitive || command.permissions.length > 0;
  }
}
