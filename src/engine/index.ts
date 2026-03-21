import * as Num from "@/engine/math/num"
import type { GameState  } from "./core/state";
import { tickActiveStratum } from "./strata/tick";

export function createEngine(state: GameState) {
    function tick(nowMs: number) {
        nowMs = performance.now();
        const dtMs = nowMs - state.lastTickMs;
        state.lastTickMs = nowMs;
        
        if (dtMs <= 0) return;
        
        const dtSec = dtMs / 1000;
        state.simTimeSec += dtSec;
        
        tickActiveStratum(state, dtSec);
    }

    return { tick }
}

export interface Game {
  state: GameState;
  tick: () => void;
}