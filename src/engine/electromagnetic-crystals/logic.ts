import type { StratumState } from "@/engine/strata/state";
import { N, ONE, ZERO, add, div, gte, lte, max, mul, normalizeNum, pow, sqrt, sub, type Num } from "@/engine/math/num";
import { isElectromagneticCrystalsUnlocked } from "@/engine/strata/common/milestones";
import { getCoherenceElectromagneticPowerGainMultiplier } from "@/engine/strata/common/coherence/upgrades";
import {
  ELECTROMAGNETIC_DEFAULT_INITIAL_DIRECTION_DEG,
  ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED,
  createElectromagneticCrystalsState,
  type ElectromagneticCrystalsState,
} from "./state";
import {
  ensureElectromagneticUpgradesState,
  getElectromagneticUpgradeAdvancedPowerGainMultiplier,
  getElectromagneticUpgradeDecayRateMultiplier,
  getElectromagneticUpgradeConversionExponentBonus,
  getElectromagneticUpgradePowerGainMultiplier,
  hasElectromagneticElectricFieldRangeUpgrade,
  hasElectromagneticHorizontalJudgeLines,
  hasElectromagneticThreeHorizontalJudgeLines,
  hasElectromagneticMagneticFieldRangeUpgrade,
  hasElectromagneticVerticalJudgeLineUpgrade,
} from "./upgrades";

export const ELECTROMAGNETIC_JUDGE_LINE_X = [1 / 3, 2 / 3] as const;
export const ELECTROMAGNETIC_UPGRADED_JUDGE_LINE_X = [1 / 4, 1 / 2, 3 / 4] as const;
export const ELECTROMAGNETIC_JUDGE_LINE_Y = [1 / 3, 2 / 3] as const;
export const ELECTROMAGNETIC_UPGRADED_JUDGE_LINE_Y = [1 / 4, 1 / 2, 3 / 4] as const;
export const ELECTROMAGNETIC_POWER_PER_CROSSING = N(10);
export const ELECTROMAGNETIC_POWER_DECAY_DIVISOR_PER_SECOND = N(1.05);
export const ELECTROMAGNETIC_DEFAULT_DREAM_CRYSTAL_EXPONENT = N(8);
export const ELECTROMAGNETIC_MIN_INITIAL_SPEED = 0.01;
export const ELECTROMAGNETIC_MAX_INITIAL_SPEED = 0.5;
export const ELECTROMAGNETIC_MIN_ELECTRIC_FIELD_STRENGTH = 0;
export const ELECTROMAGNETIC_MAX_ELECTRIC_FIELD_STRENGTH = 2;
export const ELECTROMAGNETIC_UPGRADED_MAX_ELECTRIC_FIELD_STRENGTH = 3;
export const ELECTROMAGNETIC_MIN_MAGNETIC_FIELD_STRENGTH = -2;
export const ELECTROMAGNETIC_MAX_MAGNETIC_FIELD_STRENGTH = 2;
export const ELECTROMAGNETIC_UPGRADED_MIN_MAGNETIC_FIELD_STRENGTH = -3;
export const ELECTROMAGNETIC_UPGRADED_MAX_MAGNETIC_FIELD_STRENGTH = 3;
export const ELECTROMAGNETIC_FORCE_SCALE = 0.2;

const BASE_ELECTRIC_FIELD_ACCELERATION = 0.22;
const BASE_MAGNETIC_FIELD_STRENGTH = 1.35;
const LEGACY_DEFAULT_INITIAL_SPEED = 0.32;
const MAX_PARTICLE_SPEED = 2.5;
const PHYSICS_STEP_SECONDS = 0.1;
const MAX_PHYSICS_STEPS_PER_TICK = 240;
const CROSSING_EPSILON = 1e-12;

function finiteOr(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeDegrees(value: unknown, fallback: number): number {
  const numeric = finiteOr(value, fallback);
  return ((numeric % 360) + 360) % 360;
}

function wrapUnit(value: number): number {
  return ((value % 1) + 1) % 1;
}

function countPeriodicLineCrossings(start: number, end: number, offset: number): number {
  if (end > start) {
    const firstPeriod = Math.floor(start - offset + CROSSING_EPSILON) + 1;
    const lastPeriod = Math.floor(end - offset + CROSSING_EPSILON);
    return Math.max(0, lastPeriod - firstPeriod + 1);
  }
  if (end < start) {
    const firstPeriod = Math.ceil(end - offset - CROSSING_EPSILON);
    const lastPeriod = Math.ceil(start - offset - CROSSING_EPSILON) - 1;
    return Math.max(0, lastPeriod - firstPeriod + 1);
  }
  return 0;
}

function countBoundaryTeleports(unwrappedEnd: number): number {
  if (unwrappedEnd >= 1) return Math.floor(unwrappedEnd);
  if (unwrappedEnd < 0) return Math.ceil(-unwrappedEnd);
  return 0;
}

export function ensureElectromagneticCrystalsState(state: StratumState): ElectromagneticCrystalsState {
  const defaults = createElectromagneticCrystalsState();
  state.electromagneticCrystals ??= defaults;
  const electromagnetic = state.electromagneticCrystals;
  ensureElectromagneticUpgradesState(state);

  electromagnetic.power = max(ZERO, normalizeNum(electromagnetic.power, ZERO));
  electromagnetic.electricFieldDirectionDeg = normalizeDegrees(
    electromagnetic.electricFieldDirectionDeg,
    defaults.electricFieldDirectionDeg,
  );
  electromagnetic.electricFieldStrength = clamp(
    finiteOr(electromagnetic.electricFieldStrength, defaults.electricFieldStrength),
    ELECTROMAGNETIC_MIN_ELECTRIC_FIELD_STRENGTH,
    getElectromagneticMaxElectricFieldStrength(state),
  );
  const legacyElectromagnetic = electromagnetic as ElectromagneticCrystalsState & {
    magneticFieldDirection?: 1 | -1;
  };
  const legacyMagneticStrength = legacyElectromagnetic.magneticFieldDirection === -1 ? 1 : -1;
  electromagnetic.magneticFieldStrength = clamp(
    finiteOr(electromagnetic.magneticFieldStrength, legacyMagneticStrength),
    getElectromagneticMinMagneticFieldStrength(state),
    getElectromagneticMaxMagneticFieldStrength(state),
  );
  delete legacyElectromagnetic.magneticFieldDirection;
  const storedInitialSpeed = finiteOr(
    electromagnetic.initialSpeed,
    ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED,
  );
  const hasLegacyDefaultSpeed = Math.abs(storedInitialSpeed - LEGACY_DEFAULT_INITIAL_SPEED) < 1e-9;
  electromagnetic.initialSpeed = clamp(
    hasLegacyDefaultSpeed ? ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED : storedInitialSpeed,
    ELECTROMAGNETIC_MIN_INITIAL_SPEED,
    ELECTROMAGNETIC_MAX_INITIAL_SPEED,
  );
  electromagnetic.initialDirectionDeg = normalizeDegrees(
    electromagnetic.initialDirectionDeg,
    ELECTROMAGNETIC_DEFAULT_INITIAL_DIRECTION_DEG,
  );
  electromagnetic.particle ??= defaults.particle;
  electromagnetic.particle.x = wrapUnit(finiteOr(electromagnetic.particle.x, 0.5));
  electromagnetic.particle.y = wrapUnit(finiteOr(electromagnetic.particle.y, 0.5));
  electromagnetic.particle.velocityX = finiteOr(
    electromagnetic.particle.velocityX,
    defaults.particle.velocityX,
  );
  electromagnetic.particle.velocityY = finiteOr(
    electromagnetic.particle.velocityY,
    defaults.particle.velocityY,
  );
  if (hasLegacyDefaultSpeed) {
    const migrationScale = ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED / LEGACY_DEFAULT_INITIAL_SPEED;
    electromagnetic.particle.velocityX *= migrationScale;
    electromagnetic.particle.velocityY *= migrationScale;
  }

  return electromagnetic;
}

export function getElectromagneticPower(state: StratumState): Num {
  return state.electromagneticCrystals.power;
}

export function getElectromagneticPowerPerCrossing(state: StratumState): Num {
  return mul(
    mul(
      mul(
        mul(
          ELECTROMAGNETIC_POWER_PER_CROSSING,
          state.characterElectromagneticPowerGainMultiplier ?? ONE,
        ),
        getElectromagneticUpgradePowerGainMultiplier(state),
      ),
      getElectromagneticUpgradeAdvancedPowerGainMultiplier(state),
    ),
    getCoherenceElectromagneticPowerGainMultiplier(state),
  );
}

export function getElectromagneticVerticalJudgeLines(state: StratumState): readonly number[] {
  return hasElectromagneticVerticalJudgeLineUpgrade(state)
    ? ELECTROMAGNETIC_UPGRADED_JUDGE_LINE_X
    : ELECTROMAGNETIC_JUDGE_LINE_X;
}

export function getElectromagneticHorizontalJudgeLines(state: StratumState): readonly number[] {
  if (!hasElectromagneticHorizontalJudgeLines(state)) return [];
  return hasElectromagneticThreeHorizontalJudgeLines(state)
    ? ELECTROMAGNETIC_UPGRADED_JUDGE_LINE_Y
    : ELECTROMAGNETIC_JUDGE_LINE_Y;
}

export function getElectromagneticPowerDecayDivisorPerSecond(state: StratumState): Num {
  return pow(
    ELECTROMAGNETIC_POWER_DECAY_DIVISOR_PER_SECOND,
    getElectromagneticUpgradeDecayRateMultiplier(state),
  );
}

export function spendElectromagneticPower(state: StratumState, cost: Num): boolean {
  const normalizedCost = max(ZERO, cost);
  const currentPower = getElectromagneticPower(state);
  if (!gte(currentPower, normalizedCost)) return false;
  state.electromagneticCrystals.power = max(ZERO, sub(currentPower, normalizedCost));
  return true;
}

export function getElectromagneticDreamCrystalExponent(state: StratumState): Num {
  return add(
    ELECTROMAGNETIC_DEFAULT_DREAM_CRYSTAL_EXPONENT,
    getElectromagneticUpgradeConversionExponentBonus(state),
  );
}

export function getElectromagneticMaxElectricFieldStrength(state: StratumState): number {
  return hasElectromagneticElectricFieldRangeUpgrade(state)
    ? ELECTROMAGNETIC_UPGRADED_MAX_ELECTRIC_FIELD_STRENGTH
    : ELECTROMAGNETIC_MAX_ELECTRIC_FIELD_STRENGTH;
}

export function getElectromagneticMinMagneticFieldStrength(state: StratumState): number {
  return hasElectromagneticMagneticFieldRangeUpgrade(state)
    ? ELECTROMAGNETIC_UPGRADED_MIN_MAGNETIC_FIELD_STRENGTH
    : ELECTROMAGNETIC_MIN_MAGNETIC_FIELD_STRENGTH;
}

export function getElectromagneticMaxMagneticFieldStrength(state: StratumState): number {
  return hasElectromagneticMagneticFieldRangeUpgrade(state)
    ? ELECTROMAGNETIC_UPGRADED_MAX_MAGNETIC_FIELD_STRENGTH
    : ELECTROMAGNETIC_MAX_MAGNETIC_FIELD_STRENGTH;
}

export function getElectromagneticDreamCrystalMultiplier(state: StratumState): Num {
  if (!isElectromagneticCrystalsUnlocked(state)) return ONE;
  return pow(
    max(ONE, getElectromagneticPower(state)),
    getElectromagneticDreamCrystalExponent(state),
  );
}

export function setElectricFieldDirection(state: StratumState, directionDeg: number): void {
  ensureElectromagneticCrystalsState(state).electricFieldDirectionDeg = normalizeDegrees(directionDeg, 0);
}

export function setElectricFieldStrength(state: StratumState, strength: number): void {
  ensureElectromagneticCrystalsState(state).electricFieldStrength = clamp(
    finiteOr(strength, 1),
    ELECTROMAGNETIC_MIN_ELECTRIC_FIELD_STRENGTH,
    getElectromagneticMaxElectricFieldStrength(state),
  );
}

export function setMagneticFieldStrength(state: StratumState, strength: number): void {
  ensureElectromagneticCrystalsState(state).magneticFieldStrength = clamp(
    finiteOr(strength, 0),
    getElectromagneticMinMagneticFieldStrength(state),
    getElectromagneticMaxMagneticFieldStrength(state),
  );
}

export function setElectromagneticInitialSpeed(state: StratumState, speed: number): void {
  ensureElectromagneticCrystalsState(state).initialSpeed = clamp(
    finiteOr(speed, ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED),
    ELECTROMAGNETIC_MIN_INITIAL_SPEED,
    ELECTROMAGNETIC_MAX_INITIAL_SPEED,
  );
}

export function setElectromagneticInitialDirection(state: StratumState, directionDeg: number): void {
  ensureElectromagneticCrystalsState(state).initialDirectionDeg = normalizeDegrees(directionDeg, 0);
}

export function resetElectromagneticParticle(state: StratumState): void {
  const electromagnetic = ensureElectromagneticCrystalsState(state);
  const angle = electromagnetic.initialDirectionDeg * Math.PI / 180;
  electromagnetic.particle.x = 0.5;
  electromagnetic.particle.y = 0.5;
  electromagnetic.particle.velocityX = Math.cos(angle) * electromagnetic.initialSpeed;
  electromagnetic.particle.velocityY = Math.sin(angle) * electromagnetic.initialSpeed;
}

function decayElectromagneticPower(state: StratumState, dtSec: Num): void {
  state.electromagneticCrystals.power = div(
    state.electromagneticCrystals.power,
    pow(getElectromagneticPowerDecayDivisorPerSecond(state), dtSec),
  );
}

interface ElectromagneticStepEvents {
  judgeCrossings: number;
  teleports: number;
}

function simulateParticleStep(
  electromagnetic: ElectromagneticCrystalsState,
  dtSec: number,
  horizontalJudgeLines: readonly number[],
  verticalJudgeLines: readonly number[],
): ElectromagneticStepEvents {
  const particle = electromagnetic.particle;
  const electricAngle = electromagnetic.electricFieldDirectionDeg * Math.PI / 180;
  const electricAcceleration = BASE_ELECTRIC_FIELD_ACCELERATION
    * electromagnetic.electricFieldStrength
    * ELECTROMAGNETIC_FORCE_SCALE;
  const electricAccelerationX = Math.cos(electricAngle) * electricAcceleration;
  const electricAccelerationY = Math.sin(electricAngle) * electricAcceleration;

  // Split the electric impulse around an exact magnetic rotation. This keeps a
  // magnetic-only orbit stable instead of adding numerical energy every tick.
  particle.velocityX += electricAccelerationX * dtSec * 0.5;
  particle.velocityY += electricAccelerationY * dtSec * 0.5;
  const magneticRotation = electromagnetic.magneticFieldStrength
    * BASE_MAGNETIC_FIELD_STRENGTH
    * ELECTROMAGNETIC_FORCE_SCALE
    * dtSec;
  const rotationCos = Math.cos(magneticRotation);
  const rotationSin = Math.sin(magneticRotation);
  const rotatedVelocityX = particle.velocityX * rotationCos - particle.velocityY * rotationSin;
  const rotatedVelocityY = particle.velocityX * rotationSin + particle.velocityY * rotationCos;
  particle.velocityX = rotatedVelocityX + electricAccelerationX * dtSec * 0.5;
  particle.velocityY = rotatedVelocityY + electricAccelerationY * dtSec * 0.5;

  const speed = Math.hypot(particle.velocityX, particle.velocityY);
  if (speed > MAX_PARTICLE_SPEED) {
    const speedScale = MAX_PARTICLE_SPEED / speed;
    particle.velocityX *= speedScale;
    particle.velocityY *= speedScale;
  }

  const previousX = particle.x;
  const previousY = particle.y;
  const unwrappedNextX = previousX + particle.velocityX * dtSec;
  const unwrappedNextY = particle.y + particle.velocityY * dtSec;
  let crossings = verticalJudgeLines.reduce(
    (total, lineX) => total + countPeriodicLineCrossings(previousX, unwrappedNextX, lineX),
    0,
  );
  if (horizontalJudgeLines.length > 0) {
    crossings += horizontalJudgeLines.reduce(
      (total, lineY) => total + countPeriodicLineCrossings(previousY, unwrappedNextY, lineY),
      0,
    );
  }
  const teleports = countBoundaryTeleports(unwrappedNextX)
    + countBoundaryTeleports(unwrappedNextY);

  particle.x = wrapUnit(unwrappedNextX);
  particle.y = wrapUnit(unwrappedNextY);
  return { judgeCrossings: crossings, teleports };
}

function applyElectromagneticBoundaryPenalty(power: Num, teleports: number): Num {
  if (teleports <= 0 || lte(power, ZERO)) return power;
  if (teleports === 1) return sqrt(power);
  return pow(power, pow(N(0.5), teleports));
}

export function tickElectromagneticCrystals(state: StratumState, dtSec: Num): void {
  if (!isElectromagneticCrystalsUnlocked(state)) return;
  const electromagnetic = state.electromagneticCrystals;
  decayElectromagneticPower(state, dtSec);

  const elapsedSeconds = dtSec.toNumber();
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return;

  const stepCount = Math.min(
    MAX_PHYSICS_STEPS_PER_TICK,
    Math.max(1, Math.ceil(elapsedSeconds / PHYSICS_STEP_SECONDS)),
  );
  const stepSeconds = elapsedSeconds / stepCount;
  const horizontalJudgeLines = getElectromagneticHorizontalJudgeLines(state);
  const verticalJudgeLines = getElectromagneticVerticalJudgeLines(state);
  for (let step = 0; step < stepCount; step++) {
    const events = simulateParticleStep(
      electromagnetic,
      stepSeconds,
      horizontalJudgeLines,
      verticalJudgeLines,
    );
    if (events.judgeCrossings > 0) {
      electromagnetic.power = add(
        electromagnetic.power,
        mul(getElectromagneticPowerPerCrossing(state), events.judgeCrossings),
      );
    }
    electromagnetic.power = applyElectromagneticBoundaryPenalty(
      electromagnetic.power,
      events.teleports,
    );
  }
}
