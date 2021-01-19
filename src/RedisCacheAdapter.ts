import { CacheAdapter } from '@mikro-orm/core';
import IORedis, {Redis, RedisOptions} from 'ioredis';

interface RedisCacheAdapterOptions extends RedisOptions {
  debug?:boolean;
}

export default class RedisCacheAdapter implements CacheAdapter {
  private readonly client: Redis;
  private readonly debug: boolean;

  constructor(options: RedisCacheAdapterOptions) {
    const {debug = false, ...redisOpt} = options;
    this.client = new IORedis(options);
    this.debug = debug;
  }

  async get(key: string) {
    const data = await this.client.get(key);
    if(this.debug) {
      console.log(`get "${key}": "${data}"`);
    }
    if(!data) return null;
    return JSON.parse(data)
  }

  async set(
    name: string,
    data: any,
    origin: string,
    expiration?: number,
  ): Promise<void> {
    if(this.debug) {
      console.log(`set "${name}": "${data}" with expiration ${expiration}`);
    }
    if(expiration) {
      await this.client.set(name, JSON.stringify(data),'PX', expiration)
    } else {
      await this.client.set(name, JSON.stringify(data))
    }
  }

  async clear(): Promise<void> {
    if(this.debug) {
      console.log('clear cache');
    }
    await this.client.flushdb();
  }
}
