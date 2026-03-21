import type { Num } from "./num"
import { N, ZERO } from "./num"

export function format(x: Num): string {
  if (!x || x.eq(ZERO)) return "0"
  if (!x.isFinite()) return x.sign < 0 ? "-Infinity" : "Infinity"

  const neg = x.lt(0)
  const abs = x.abs()

  // 小于 1000：直接显示整数
  if (abs.lt(1000)) {
    const s = abs.toNumber().toFixed(2).toString()
    return neg ? `-${s}` : s
  }

  // 大于等于 1000：科学计数法，mantissa 和 exponent 都只显示整数
  let exponent = abs.log10().floor().toNumber()
  let mantissa = abs.div(N(10).pow(exponent)).toNumber()

  

  // 处理 9.5eN -> 10eN -> 1e(N+1)
  if (mantissa >= 10) {
    mantissa = 1
    exponent += 1
  }

  // mantissa 2位小数
  let mantissaInt = mantissa.toFixed(2);

  const s = `${mantissaInt}e${exponent}`
  return neg ? `-${s}` : s
}

export function formatInt(x: Num): string {
  if (!x || x.eq(ZERO)) return "0"
  if (!x.isFinite()) return x.sign < 0 ? "-Infinity" : "Infinity"

  const neg = x.lt(0)
  const abs = x.abs()

  // 小于 1000：直接显示整数
  if (abs.lt(1000)) {
    const s = Math.round(abs.toNumber()).toString()
    return neg ? `-${s}` : s
  }

  // 大于等于 1000：科学计数法，mantissa 和 exponent 都只显示整数
  let exponent = abs.log10().floor().toNumber()
  let mantissa = abs.div(N(10).pow(exponent)).toNumber()

  

  // 处理 9.5eN -> 10eN -> 1e(N+1)
  if (mantissa >= 10) {
    mantissa = 1
    exponent += 1
  }

  // mantissa 2位小数
  let mantissaInt = mantissa.toFixed(2);

  const s = `${mantissaInt}e${exponent}`
  return neg ? `-${s}` : s
}

export function formatGain(x: Num): string {
  return `${format(x)}/s`
}

export function formatPercentageGain(x: Num): string {
  return `${format(x)}%/s`
}