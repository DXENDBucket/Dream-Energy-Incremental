import type { StratumState } from "@/engine/strata/state";
import { N, ZERO, add, div, max, mul, normalizeNum, pow, type Num } from "@/engine/math/num";
import {
  ELECTROMAGNETIC_DEFAULT_INITIAL_DIRECTION_DEG,
  ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED,
  createElectromagneticCrystalsState,
  type ElectromagneticCrystalsState,
} from "./state";

export const ELECTROMAGNETIC_JUDGE_LINE_X = [1 / 3, 2 / 3] as const;
export const ELECTROMAGNETIC_POWER_PER_CROSSING = N(10);
export const ELECTROMAGNETIC_POWER_DECAY_DIVISOR_PER_SECOND = N(1.05);
export const ELECTROMAGNETIC_MIN_INITIAL_SPEED = 0.05;
export const ELECTROMAGNETIC_MAX_INITIAL_SPEED = 0.8;

const ELECTRIC_FIELD_ACCELERATION = 0.22;
const MAGNETIC_FIELD_STRENGTH = 1.35;
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

export function ensureElectromagneticCrystalsState(state: StratumState): ElectromagneticCrystalsState {
  const defaults = createElectromagneticCrystalsState();
  state.electromagneticCrystals ??= defaults;
  const electromagnetic = state.electromagneticCrystals;

  electromagnetic.power = max(ZERO, normalizeNum(electromagnetic.power, ZERO));
  electromagnetic.electricFieldDirectionDeg = normalizeDegrees(
    electromagnetic.electricFieldDirectionDeg,
    defaults.electricFieldDirectionDeg,
  );
  electromagnetic.magneticFieldDirection = electromagnetic.magneticFieldDirection === -1 ? -1 : 1;
  electromagnetic.initialSpeed = clamp(
    finiteOr(electromagnetic.initialSpeed, ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED),
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

  return electromagnetic;
}

export function getElectromagneticPower(state: StratumState): Num {
  return ensureElectromagneticCrystalsState(state).power;
}

export function setElectricFieldDirection(state: StratumState, directionDeg: number): void {
  ensureElectromagneticCrystalsState(state).electricFieldDirectionDeg = normalizeDegrees(directionDeg, 0);
}

export function setMagneticFieldDirection(state: StratumState, direction: number): void {
  ensureElectromagneticCrystalsState(state).magneticFieldDirection = direction < 0 ? -1 : 1;
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

function decayElectromagneticPower(electromagnetic: ElectromagneticCrystalsState, dtSec: Num): void {
  electromagnetic.power = div(
    electromagnetic.power,
    pow(ELECTROMAGNETIC_POWER_DECAY_DIVISOR_PER_SECOND, dtSec),
  );
}

function simulateParticleStep(electromagnetic: ElectromagneticCrystalsState, dtSec: number): number {
  const particle = electromagnetic.particle;
  const electricAngle = electromagnetic.electricFieldDirectionDeg * Math.PI / 180;
  const electricAccelerationX = Math.cos(electricAngle) * ELECTRIC_FIELD_ACCELERATION;
  const electricAccelerationY = Math.sin(electricAngle) * ELECTRIC_FIELD_ACCELERATION;

  // Split the electric impulse around an exact magnetic rotation. This keeps a
  // magnetic-only orbit stable instead of adding numerical energy every tick.
  particle.velocityX += electricAccelerationX * dtSec * 0.5;
  particle.velocityY += electricAccelerationY * dtSec * 0.5;
  const magneticRotation = -electromagnetic.magneticFieldDirection
    * MAGNETIC_FIELD_STRENGTH
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
  const unwrappedNextX = previousX + particle.velocityX * dtSec;
  const unwrappedNextY = particle.y + particle.velocityY * dtSec;
  const crossings = ELECTROMAGNETIC_JUDGE_LINE_X.reduce(
    (total, lineX) => total + countPeriodicLineCrossings(previousX, unwrappedNextX, lineX),
    0,
  );

  particle.x = wrapUnit(unwrappedNextX);
  particle.y = wrapUnit(unwrappedNextY);
  return crossings;
}

export function tickElectromagneticCrystals(state: StratumState, dtSec: Num): void {
  const electromagnetic = ensureElectromagneticCrystalsState(state);
  decayElectromagneticPower(electromagnetic, dtSec);

  const elapsedSeconds = dtSec.toNumber();
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return;

  const stepCount = Math.min(
    MAX_PHYSICS_STEPS_PER_TICK,
    Math.max(1, Math.ceil(elapsedSeconds / PHYSICS_STEP_SECONDS)),
  );
  const stepSeconds = elapsedSeconds / stepCount;
  let crossings = 0;
  for (let step = 0; step < stepCount; step++) {
    crossings += simulateParticleStep(electromagnetic, stepSeconds);
  }

  if (crossings > 0) {
    electromagnetic.power = add(
      electromagnetic.power,
      mul(ELECTROMAGNETIC_POWER_PER_CROSSING, crossings),
    );
  }
}
