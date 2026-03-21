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