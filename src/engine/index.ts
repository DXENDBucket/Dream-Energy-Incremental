import type { GameState  } from "./core/state";
import { simulateActiveStratumProgress } from "./offline";

export function createEngine(state: GameState) {
    function tick(nowMs: number) {
        const dtMs = nowMs - state.lastTickMs;
        state.lastTickMs = nowMs;
        state.lastWallClockMs = Date.now();
        
        if (dtMs <= 0) return;
        
        const dtSec = dtMs / 1000;
        simulateActiveStratumProgress(state, dtSec);
    }

    return { tick }
}

export interface Game {
  state: GameState;
  tick: () => void;
}
