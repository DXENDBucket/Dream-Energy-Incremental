import Decimal from "break_eternity.js";

export type Num = Decimal
export type NumInput = Num | number | string

export const N = (x: NumInput): Num => new Decimal(x)

export const ZERO = N(0)
export const ONE = N(1)
export const TEN = N(10)

export const add = (a: Num, b: NumInput): Num => a.add(b)
export const sub = (a: Num, b: NumInput): Num => a.sub(b)
export const mul = (a: Num, b: NumInput): Num => a.mul(b)
export const div = (a: Num, b: NumInput): Num => a.div(b)

export const max = (a: Num, b: NumInput): Num => Decimal.max(a, N(b))
export const min = (a: Num, b: NumInput): Num => Decimal.min(a, N(b))

export const gt = (a: Num, b: NumInput): boolean => a.gt(b)
export const gte = (a: Num, b: NumInput): boolean => a.gte(b)
export const lt = (a: Num, b: NumInput): boolean => a.lt(b)
export const lte = (a: Num, b: NumInput): boolean => a.lte(b)

export const floor = (x: Num): Num => x.floor()
export const ceil = (x: Num): Num => x.ceil()

export const pow = (a: Num, b: NumInput): Num => a.pow(b)
export const log10 = (x: Num): Num => x.log10()
export const logn = (a: Num, n: NumInput): Num => a.log(N(n))
export const sqrt = (x: Num): Num => x.sqrt()
export const rt = (a: Num, n: NumInput): Num => a.root(N(n))

export const isZero = (x: Num): boolean => x.eq(ZERO)
export const clampMin = (x: Num, lo: NumInput): Num => max(x, lo)

export const isNum = (value: unknown): value is Num => value instanceof Decimal
export const serializeNum = (value: Num): string => value.toString()
export const deserializeNum = (value: string): Num => N(value)

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !isNum(value)
}

export function tryRestoreNum(value: unknown): Num | null {
  if (isNum(value)) return value

  if (typeof value === "number") {
    return Number.isFinite(value) ? N(value) : null
  }

  if (typeof value === "string") {
    if (value.trim() === "") return null
    try {
      return N(value)
    } catch {
      return null
    }
  }

  if (!isPlainRecord(value)) return null

  if (value.$type === "num" && typeof value.value === "string") {
    return tryRestoreNum(value.value)
  }

  const { sign, layer, mag } = value
  if (
    typeof sign === "number" &&
    typeof layer === "number" &&
    typeof mag === "number" &&
    Number.isFinite(sign) &&
    Number.isFinite(layer) &&
    Number.isFinite(mag)
  ) {
    return Decimal.fromComponents(sign, layer, mag)
  }

  return null
}

export function normalizeNum(value: unknown, fallback: NumInput = 0): Num {
  return tryRestoreNum(value) ?? N(fallback)
}
