import Decimal from "break_eternity.js";
import { markRaw, toRaw } from "vue";

export type Num = Decimal
export type NumInput = Num | number | string

function unwrapValue<T>(value: T): T {
  return typeof value === "object" && value !== null ? toRaw(value) : value
}

function rawNum(value: Decimal): Num {
  return markRaw(value)
}

function rawInput(value: NumInput): NumInput {
  return unwrapValue(value) as NumInput
}

function rawDecimal(value: Num): Decimal {
  return unwrapValue(value) as Decimal
}

export const N = (x: NumInput): Num => rawNum(new Decimal(rawInput(x)))

export const ZERO = N(0)
export const ONE = N(1)
export const TEN = N(10)

export const add = (a: Num, b: NumInput): Num => rawNum(rawDecimal(a).add(rawInput(b)))
export const sub = (a: Num, b: NumInput): Num => rawNum(rawDecimal(a).sub(rawInput(b)))
export const mul = (a: Num, b: NumInput): Num => rawNum(rawDecimal(a).mul(rawInput(b)))
export const div = (a: Num, b: NumInput): Num => rawNum(rawDecimal(a).div(rawInput(b)))

export const max = (a: Num, b: NumInput): Num => rawNum(Decimal.max(rawDecimal(a), rawInput(b)))
export const min = (a: Num, b: NumInput): Num => rawNum(Decimal.min(rawDecimal(a), rawInput(b)))

export const gt = (a: Num, b: NumInput): boolean => rawDecimal(a).gt(rawInput(b))
export const gte = (a: Num, b: NumInput): boolean => rawDecimal(a).gte(rawInput(b))
export const lt = (a: Num, b: NumInput): boolean => rawDecimal(a).lt(rawInput(b))
export const lte = (a: Num, b: NumInput): boolean => rawDecimal(a).lte(rawInput(b))

export const floor = (x: Num): Num => rawNum(rawDecimal(x).floor())
export const ceil = (x: Num): Num => rawNum(rawDecimal(x).ceil())

export const pow = (a: Num, b: NumInput): Num => rawNum(rawDecimal(a).pow(rawInput(b)))
export const log10 = (x: Num): Num => rawNum(rawDecimal(x).log10())
export const logn = (a: Num, n: NumInput): Num => rawNum(rawDecimal(a).log(rawInput(n)))
export const sqrt = (x: Num): Num => rawNum(rawDecimal(x).sqrt())
export const rt = (a: Num, n: NumInput): Num => rawNum(rawDecimal(a).root(rawInput(n)))

export const isZero = (x: Num): boolean => rawDecimal(x).eq(ZERO)
export const clampMin = (x: Num, lo: NumInput): Num => max(x, lo)

export const isNum = (value: unknown): value is Num => unwrapValue(value) instanceof Decimal
export const serializeNum = (value: Num): string => rawDecimal(value).toString()
export const deserializeNum = (value: string): Num => N(value)

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !isNum(value)
}

export function tryRestoreNum(value: unknown): Num | null {
  const rawValue = unwrapValue(value)
  if (rawValue instanceof Decimal) return rawNum(rawValue)

  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? N(rawValue) : null
  }

  if (typeof rawValue === "string") {
    if (rawValue.trim() === "") return null
    try {
      return N(rawValue)
    } catch {
      return null
    }
  }

  if (!isPlainRecord(rawValue)) return null

  if (rawValue.$type === "num" && typeof rawValue.value === "string") {
    return tryRestoreNum(rawValue.value)
  }

  const { sign, layer, mag } = rawValue
  if (
    typeof sign === "number" &&
    typeof layer === "number" &&
    typeof mag === "number" &&
    Number.isFinite(sign) &&
    Number.isFinite(layer) &&
    Number.isFinite(mag)
  ) {
    return rawNum(Decimal.fromComponents(sign, layer, mag))
  }

  return null
}

export function normalizeNum(value: unknown, fallback: NumInput = 0): Num {
  return tryRestoreNum(value) ?? N(fallback)
}
