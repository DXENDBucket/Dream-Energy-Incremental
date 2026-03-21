import { reactive } from "vue";
import { createNewState } from "@/engine/core/state";
import { createEngine } from "@/engine";

export function createGameStore() {
    const state = reactive(createNewState());
    const engine = createEngine(state);

    function loop() {
        engine.tick(performance.now());
        requestAnimationFrame(loop);
    }

    loop();

    return {
        state,
    };
}