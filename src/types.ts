import type { Type } from "@mikro-orm/core";

export type SerializablePrimitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | bigint;

export type SerializableType =
  | SerializablePrimitive
  | ReadableStream
  | WritableStream
  | Array<SerializablePrimitive>
  | ArrayBuffer
  | Buffer
  | Type;

export type Serializable<E extends object, Allowed = never> = {
  [K in keyof E]: E[K] extends object
    ? SerializableType | Allowed | Serializable<E[K]>
    : SerializableType | Allowed;
};
