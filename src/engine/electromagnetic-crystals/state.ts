import { ZERO, type Num } from "@/engine/math/num";

export interface ElectromagneticParticleState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export interface ElectromagneticCrystalsState {
  power: Num;
  electricFieldDirectionDeg: number;
  electricFieldStrength: number;
  magneticFieldStrength: number;
  initialSpeed: number;
  initialDirectionDeg: number;
  particle: ElectromagneticParticleState;
}

export const ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED = 0.32;
export const ELECTROMAGNETIC_DEFAULT_INITIAL_DIRECTION_DEG = 0;

export function createElectromagneticCrystalsState(): ElectromagneticCrystalsState {
  return {
    power: ZERO,
    electricFieldDirectionDeg: 90,
    electricFieldStrength: 1,
    magneticFieldStrength: -1,
    initialSpeed: ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED,
    initialDirectionDeg: ELECTROMAGNETIC_DEFAULT_INITIAL_DIRECTION_DEG,
    particle: {
      x: 0.5,
      y: 0.5,
      velocityX: ELECTROMAGNETIC_DEFAULT_INITIAL_SPEED,
      velocityY: 0,
    },
  };
}
