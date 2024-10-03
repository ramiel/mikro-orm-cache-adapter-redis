import { it, vi, expect, beforeEach } from "vitest";
import { RedisCacheAdapter } from "../src";
import IORedis from "ioredis";

const client = new IORedis("redis://localhost:6379");
const adapter = new RedisCacheAdapter({
  client,
  logger: vi.fn(),
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
])(`save a cache and load it: %o`, async (data) => {
  await adapter.set("key", data, "origin");

  const result = await adapter.get("key");

  expect(result).toEqual(data);
});

it("return void when failed to serialize the data", async () => {
  await adapter.set("key", { a: () => undefined }, "origin");

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("return void when failed to store the cache", async () => {
  vi.spyOn(client, "set").mockRejectedValueOnce(new Error());

  await adapter.set("key", "test", "origin");

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("return undefined when failed to load the cache", async () => {
  vi.spyOn(client, "getBuffer").mockRejectedValueOnce(new Error());

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("return undefined when cache is not found", async () => {
  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("return undefined when failed to deserialize the data", async () => {
  await adapter.set("key", "test", "origin");
  vi.spyOn(client, "getBuffer").mockResolvedValueOnce(Buffer.from("test"));

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("delete a cache, return undefined for it", async () => {
  await adapter.set("key", "test", "origin");

  await adapter.remove("key");

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("failed to delete a cache, return undefined for it", async () => {
  await adapter.set("key", "test", "origin");
  vi.spyOn(client, "del").mockRejectedValueOnce(new Error());
  await adapter.remove("key");

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("set new data after failed to delete a cache, return the new data", async () => {
  await adapter.set("key", "test", "origin");
  vi.spyOn(client, "del").mockRejectedValueOnce(new Error());

  await adapter.set("key", "test2", "origin");

  const result = await adapter.get("key");

  expect(result).toBe("test2");
});

it("succeed to delete a cahe after failed to delete it, return undefined for it", async () => {
  await adapter.set("key", "test", "origin");
  vi.spyOn(client, "del").mockRejectedValueOnce(new Error());

  await adapter.remove("key");

  const result = await adapter.get("key");

  expect(result).toBe(undefined);
});

it("clear all cache", async () => {
  await adapter.set("key1", "test", "origin");
  await adapter.set("key2", "test", "origin");

  await adapter.clear();

  const result = await adapter.get("key1");
  const result2 = await adapter.get("key2");

  expect(result).toBe(undefined);
  expect(result2).toBe(undefined);
});
