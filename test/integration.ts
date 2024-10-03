import { randomUUID } from "node:crypto";
import {
  BigIntType,
  DateType,
  DecimalType,
  Embeddable,
  Embedded,
  Entity,
  JsonType,
  PrimaryKey,
  Property,
  TimeType,
  Type,
} from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { afterAll, beforeAll, expect, test } from "vitest";
import {
  RedisCacheAdapter,
  type Serializable,
  type RedisCacheAdapterOptions,
} from "../src";

@Embeddable()
class Emb {
  @Property({ type: "text" })
  string1!: string;

  constructor() {
    this.string1 = "string";
  }
}

type Func = (...args: unknown[]) => unknown;

class FunctionType extends Type<Func, string> {
  convertToDatabaseValue(value: Func): string {
    return value.toString();
  }

  convertToJSValue(value: string): Func {
    return new Function(value) as Func;
  }

  getColumnType(): string {
    return "text";
  }
}

@Entity()
class A implements Serializable<A, Func> {
  @PrimaryKey()
  id: string = randomUUID();

  @Property({ type: "text" })
  string1!: string;

  @Property({ type: "text" })
  string2?: string | null = null;

  @Property()
  number1!: number;

  @Property({ type: DecimalType })
  number2!: string;

  @Property()
  boolean!: boolean;

  @Property()
  stringArray!: string[];

  @Property()
  numberArray!: number[];

  @Property({ type: new BigIntType("bigint") })
  bigInt1!: bigint;

  @Property({ type: new BigIntType("number") })
  bigInt2!: number;

  @Property({ type: new BigIntType("string") })
  bigInt3!: string;

  @Property()
  blob1!: Buffer;

  @Property()
  blob2!: Uint8Array;

  @Property({ type: JsonType })
  object!: { animal: string }[];

  @Property({ type: DateType })
  date!: string;

  @Property({ type: TimeType })
  time!: string;

  @Embedded()
  emb!: Emb;

  @Property({ type: FunctionType })
  fn!: Func;

  constructor(data: Omit<A, "id" | "string2">) {
    Object.assign(this, data);
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    host: "localhost",
    port: 5445,
    user: "postgres",
    password: "postgres",
    dbName: "postgres",
    entities: [A, Emb],
    metadataProvider: TsMorphMetadataProvider,
    allowGlobalContext: true,
    resultCache: {
      adapter: RedisCacheAdapter,
      options: {
        host: "localhost",
        port: 6379,
      } satisfies RedisCacheAdapterOptions,
    },
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close();
});

test("integration test", async () => {
  const a = new A({
    string1: "string",
    number1: 1,
    number2: "2",
    boolean: true,
    stringArray: ["string1", "string2"],
    numberArray: [1, 2],
    bigInt1: BigInt(1),
    bigInt2: 2,
    bigInt3: "3",
    blob1: Buffer.from([1, 2, 3]),
    blob2: new Uint8Array([1, 2, 3]),
    object: [{ animal: "dog" }],
    date: "2023-01-01",
    time: "12:00:00",
    emb: new Emb(),
    fn: () => "hello",
  });

  await orm.em.persistAndFlush(a);

  const aFromDB = await orm.em.findOneOrFail(A, a.id);
  const aFromCache = await orm.em.findOneOrFail(A, a.id);

  expect(aFromDB).toEqual(a);
  expect(aFromCache).toEqual(a);
  expect(aFromCache.fn()).toEqual("hello");
});
