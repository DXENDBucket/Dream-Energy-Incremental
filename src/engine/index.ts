import * as Num from "@/engine/math/num"
import type { GameState  } from "./core/state";
import { N } from "@/engine/math/num";
import { tickActiveStratum } from "./strata/tick";

export function createEngine(state: GameState) {
    function tick(nowMs: number) {
        nowMs = performance.now();
        const dtMs = nowMs - state.lastTickMs;
        state.lastTickMs = nowMs;
        
        if (dtMs <= 0) return;
        
        const dtSec = dtMs / 1000;
        state.simTimeSec += dtSec;

        let numDtSec = N(dtSec)
        
        tickActiveStratum(state, numDtSec);
    }

    return { tick }
}

export interface Game {
  state: GameState;
  tick: () => void;
}