import { reactive } from "vue";
import type { GameState } from "@/engine/core/state";
import { createNewState } from "@/engine/core/state";
import { createEngine } from "@/engine";
import {
  saveGame,
  loadGame,
  exportSave,
  importSave,
} from "@/engine/save/logic";

export type GameStore = ReturnType<typeof createGameStore>;

export function createGameStore() {
  const initialState = loadGame() ?? createNewState();
  const state = reactive(initialState);
  const engine = createEngine(state);

  let autoSaveElapsedSec = 0;
  let lastLoopMs = performance.now();

  function replaceState(next: GameState) {
    next.lastTickMs = performance.now();
    Object.assign(state, next);
    autoSaveElapsedSec = 0;
    lastLoopMs = performance.now();
  }

  function saveNow() {
    saveGame(state);
  }

  function loadFromDisk() {
    const loaded = loadGame();
    if (!loaded) return false;

    replaceState(loaded);
    return true;
  }

  function exportSaveString() {
    return exportSave(state);
  }

  function importSaveString(raw: string) {
    try {
      const loaded = importSave(raw);
      replaceState(loaded);
      saveGame(state);
      return true;
    } catch (error) {
      console.error("Failed to import save:", error);
      return false;
    }
  }

  function hardReset() {
    const fresh = createNewState();
    replaceState(fresh);
    saveGame(state);
  }

  function loop() {
    const now = performance.now();
    const realDtSec = Math.max(0, (now - lastLoopMs) / 1000);
    lastLoopMs = now;

    engine.tick(now);

    const interval = state.settings.autoSaveIntervalSec;
    if (interval > 0) {
      autoSaveElapsedSec += realDtSec;
      if (autoSaveElapsedSec >= interval) {
        saveNow();
        autoSaveElapsedSec = 0;
      }
    } else {
      autoSaveElapsedSec = 0;
    }

    requestAnimationFrame(loop);
  }

  loop();

  return {
    state,
    saveNow,
    loadFromDisk,
    exportSaveString,
    importSaveString,
    hardReset,
  };
}