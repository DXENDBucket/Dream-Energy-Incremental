import { format, formatInt } from "@/engine/math/format";
import { mul, type Num } from "@/engine/math/num";

export function formatMultiplierText(value: Num): string {
  return `×${format(value)}`;
}

export function formatPercentagePerSecondText(ratio: Num): string {
  return `+${format(mul(ratio, 100))}%/s`;
}

export function formatRequirementAmount(value: Num): string {
  return formatInt(value);
}
