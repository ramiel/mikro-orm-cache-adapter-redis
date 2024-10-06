import { it, vi, expect, beforeEach } from "vitest";
import { CacheRemoveError, RedisCacheAdapter } from "../src";
import IORedis from "ioredis";

const client = new IORedis("redis://localhost:6379");
const adapter = new RedisCacheAdapter({
  client,
  logger: vi.fn()
});

beforeEach(async () => {
  await client.flushall();
});

it.each([
  { test: "test" },
  {
    a: 123123,
    c: true,
    d: false,
    e: { a: 1, b: 2 },
    f: /^test$/,
  },
  {
    a: [1, 2, 3],
    b: Buffer.from([1, 2, 3]),
    ta: new Uint8Array([1, 2, 3]),
    d: new Date(),
    e: new Error(),
    f: new Map([
      [1, 2],
      [3, 4],
    ]),
    g: new Set([1, 2, 3]),
  },
])(`Save a cache and load it: %o`, async (data) => {
  await adapter.set("key", data, "origin");

  const result = await adapter.get("key");

  expect(result).toEqual(data);
});

it("Failed to serialize the data, return undefined", async () => {
  await adapter.set("key", { a: () => undefined }, "origin");

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("Failed to save a cache, return undefined", async () => {
  vi.spyOn(client, "set").mockRejectedValueOnce(new Error());

  await adapter.set("key", "test", "origin");

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("Failed to load the cache, return undefined", async () => {
  vi.spyOn(client, "getBuffer").mockRejectedValueOnce(new Error());

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("When cache is not found, return undefined", async () => {
  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("Failed to deserialize the data, return undefined", async () => {
  await adapter.set("key", "test", "origin");
  vi.spyOn(client, "getBuffer").mockResolvedValueOnce(Buffer.from("test"));

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it('Failed to remove the cache, throw CacheRemoveError', async () => {
  vi.spyOn(client, "del").mockRejectedValueOnce(new Error());

  expect(adapter.remove("key")).rejects.toThrowError(CacheRemoveError)
});

it("Clear all cache", async () => {
  await adapter.set("key1", "test", "origin");
  await adapter.set("key2", "test", "origin");

  await adapter.clear();

  const result = await adapter.get("key1");
  const result2 = await adapter.get("key2");

  expect(result).toBe(undefined);
  expect(result2).toBe(undefined);
});
