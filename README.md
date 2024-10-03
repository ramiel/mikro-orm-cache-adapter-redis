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
      // Base options
      // An optional key prefix. By default is `mikro`
      keyPrefix: 'mikro'
      // Optional: print debug informations
      debug: false,


      // Here goes IORedis connection options (the library will instantiate the client)
      host: '...',
      port: 6379,
      password: 'yourpassword'
    }
  }
});
```

Instead of passing options, you can pass directly an IORedis instance

```js
import { RedisCacheAdapter } from "mikro-orm-cache-adapter-redis";
import Redis from "ioredis";

const myRedisClient = new Redis();

const orm = await MikroORM.init({
  // Your options
  resultCache: {
    adapter: RedisCacheAdapter,
    options: {
      client: myRedisClient,
    },
  },
});
```

## Using Serializable

`Serializable` is a type that helps you to define your entity as serializable.

Allowed types are:
 - Primitives except symbol
 - ReadableStream
 - WritableStream
 - Array
 - ArrayBuffer
 - Buffer
 - Type (mikro orm type)
 - Serializable

```ts
@Entity()
class Book implements Serializable<Book> {
  @Property()
  title!: string;

  @Property()
  symbol!: symbol; // ❌ Type Error! symbol is not serializable
}
```

> [!NOTE]
> If serializing fails, the data will be loaded from the database.

### Use Custom Types to allow any type you want

If you want to use a type that is not serializable, you can use it with a custom type.

```ts
class FunctionType extends Type<Func, string> {  
  convertToDatabaseValue(value: Func): string {
    return value.toString();
  }

  convertToJSValue(value: string): Func {
    return new Function(value).toString() as Func;
  }

  getColumnType(): string {
    return "text";
  }
}

// Use AnyType instead of any
@Entity()
class Book implements Serializable<Book, Func> { // Add your custom type
  @Property({ type: AnyType })
  title!: string;

  @Property({ type: FunctionType })
  fn!: Func
}
```

## Serializing

This package uses [`serialize`](https://nodejs.org/api/v8.html#v8serializevalue) and [`deserialize`](https://nodejs.org/api/v8.html#v8deserializebuffer) functions from the Node.js v8 API instead of `JSON.stringify` and `JSON.parse`.

They are inadequate for certain primitive data types like Buffer and Typed Array, as they cannot accurately reproduce same data after serialization.
You can checkout its limitation [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description).

But, there're still some primitives that `serialize` cannot handle.

- function
- symbol
- any uncopyable data

If you need to serialize these types of data, you should using a custom [serializer](https://mikro-orm.io/docs/serializing#property-serializers) or [custom type](https://mikro-orm.io/docs/custom-types)

If you're in debug mode, you will see JSON stringified data at your console. This is solely for debugging purposes. `serialize` is used for actual cache.

## Testing

You need docker compose to run the tests.

```bash
# Start test services
npm run test:services:start

# Run tests
npm test
```