import { firstStratumId } from "../../strata/defs/ids.ts";

export interface LiftState {
    isLiftUnlocked: boolean;
    currentLiftPosition: string;
}

export function createLiftState(): LiftState {
    return {
        isLiftUnlocked: false,
        currentLiftPosition: firstStratumId,
    };
}