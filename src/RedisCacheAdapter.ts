import { CacheAdapter } from '@mikro-orm/core';
import IORedis, {Redis, RedisOptions} from 'ioredis';

export default class RedisCacheAdapter implements CacheAdapter {
  private readonly client: Redis;

  constructor(options: RedisOptions) {
    this.client = new IORedis(options);
  }

  async get(key: string) {
    const data = await this.client.get(key);
    if(!data) return null;
    return JSON.parse(data)
  }

  async set(
    name: string,
    data: any,
    origin: string,
    expiration?: number,
  ): Promise<void> {
    if(expiration) {
      await this.client.set(name, JSON.stringify(data),'PX', expiration)
    } else {
      await this.client.set(name, JSON.stringify(data))
    }
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
  }
}
