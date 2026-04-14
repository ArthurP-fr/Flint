import type { Redis } from "ioredis";

import type { CommandExecutionJob, CommandJobPublisher } from "./dispatch.js";

export class RedisCommandJobPublisher implements CommandJobPublisher {
  public constructor(
    private readonly redis: Redis,
    private readonly queueName = "bot:command-jobs",
  ) {}

  public async publish(job: CommandExecutionJob): Promise<void> {
    await this.redis.lpush(this.queueName, JSON.stringify(job));
  }
}
