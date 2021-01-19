import { CacheAdapter } from '@mikro-orm/core';
import IORedis, {Redis, RedisOptions} from 'ioredis';

export interface RedisCacheAdapterOptions extends RedisOptions {
  expiration?: number
  debug?:boolean;
}

export class RedisCacheAdapter implements CacheAdapter {
  private readonly client: Redis;
  private readonly debug: boolean;
  private readonly expiration?: number;

  constructor(options: RedisCacheAdapterOptions) {
    const {debug = false, expiration, ...redisOpt} = options;
    this.client = new IORedis(redisOpt);
    this.debug = debug;
    this.expiration = expiration;
    if(this.debug) {
      console.log(`redis client created`, redisOpt);
    }
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
    expiration = this.expiration,
  ): Promise<void> {
    const stringData = JSON.stringify(data);
    if(this.debug) {
      console.log(`set "${name}": "${stringData}" with expiration ${expiration}`);
    }
    if(expiration) {
      await this.client.set(name, stringData,'PX', expiration)
    } else {
      await this.client.set(name, stringData)
    }
  }

  async clear(): Promise<void> {
    if(this.debug) {
      console.log('clear cache');
    }
    await this.client.flushdb();
  }
}
