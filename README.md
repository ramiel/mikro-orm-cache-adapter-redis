# Mikro-orm - Redis cache adapter

This is an adapter for redis to be used with mikro-orm. 

Install it with its peer dependencies

```
npm i mikro-orm-cache-adapter-redis ioredis
```

and pass it as option to mikro-orm

```js
import { MikroORM } from '@mikro-orm/core/MikroORM';
import { RedisCacheAdapter } from 'mikro-orm-cache-adapter-redis';

const orm = await MikroORM.init({
  // Your options
  resultCache: {
    adapter: RedisCacheAdapter,
    options: {
      // Here goes IORedis connection options
      host: '...',
      port: 6379,
      password: 'yourpassword'
    }
  }
});
```

Instead of passing options, you can pass directly an IORedis instance

```js

import Redis from 'ioredis';

const myRedisClient = new Redis();

const orm = await MikroORM.init({
  // Your options
  resultCache: {
    adapter: RedisCacheAdapter,
    options: {
      client: myRedisClient
    }
  }
});
```
