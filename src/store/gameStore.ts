import { reactive } from "vue";
import type { GameState } from "@/engine/core/state";
import { createNewState } from "@/engine/core/state";
import { createEngine } from "@/engine";
import {
  saveGame,
  loadGame,
  clearLocalSave,
  exportSave,
  getLocalSaveBackupSummaries,
  importSave,
  loadLocalSaveBackup,
} from "@/engine/save/logic";
import { normalizeGameState } from "@/engine/strata/manager/normalize";
import {
  OFFLINE_PROGRESS_SKIP_STEPS,
  getOfflineElapsedSec,
  getOfflineProgressTickCount,
  simulateActiveStratumProgress,
  simulateActiveStratumProgressStep,
} from "@/engine/offline";

export type GameStore = ReturnType<typeof createGameStore>;

export interface OfflineProgressState {
  isActive: boolean;
  totalSec: number;
  simulatedSec: number;
  remainingSec: number;
  completedTicks: number;
  plannedTicks: number;
  remainingTicks: number;
  currentStepSec: number;
  speedUpCount: number;
  isSkipping: boolean;
}

const OFFLINE_PROGRESS_MODAL_MIN_SEC = 2;
const OFFLINE_PROGRESS_FRAME_BUDGET_MS = 8;

function resetRuntimeClocks(state: GameState): void {
  state.lastTickMs = performance.now();
  state.lastWallClockMs = Date.now();
}

export function createGameStore() {
  const initialState = normalizeGameState(loadGame() ?? createNewState());
  const initialOfflineElapsedSec = getOfflineElapsedSec(initialState);
  resetRuntimeClocks(initialState);
  const state = reactive(initialState);
  const offlineProgress = reactive<OfflineProgressState>({
    isActive: false,
    totalSec: 0,
    simulatedSec: 0,
    remainingSec: 0,
    completedTicks: 0,
    plannedTicks: 0,
    remainingTicks: 0,
    currentStepSec: 0,
    speedUpCount: 0,
    isSkipping: false,
  });
  const engine = createEngine(state);

  let autoSaveElapsedSec = 0;
  let lastLoopMs = performance.now();
  let offlineRunId = 0;
  let loopAnimationFrameId: number | null = null;
  let isDisposed = false;

  function finishOfflineProgress(runId: number) {
    if (runId !== offlineRunId) return;

    offlineProgress.simulatedSec = offlineProgress.totalSec;
    offlineProgress.remainingSec = 0;
    offlineProgress.remainingTicks = 0;
    offlineProgress.currentStepSec = 0;
    offlineProgress.isActive = false;
    resetRuntimeClocks(state);
    lastLoopMs = performance.now();
    autoSaveElapsedSec = 0;
    saveGame(state);
  }

  function runOfflineProgressBatch(runId: number) {
    if (isDisposed || runId !== offlineRunId || !offlineProgress.isActive) return;

    const frameStartMs = performance.now();
    let processedThisFrame = 0;

    while (
      offlineProgress.remainingTicks > 0 &&
      (processedThisFrame === 0 || performance.now() - frameStartMs < OFFLINE_PROGRESS_FRAME_BUDGET_MS)
    ) {
      const stepSec = offlineProgress.remainingSec / offlineProgress.remainingTicks;
      offlineProgress.currentStepSec = stepSec;
      simulateActiveStratumProgressStep(state, stepSec);
      offlineProgress.remainingSec = Math.max(0, offlineProgress.remainingSec - stepSec);
      offlineProgress.remainingTicks -= 1;
      offlineProgress.completedTicks += 1;
      offlineProgress.simulatedSec = Math.min(
        offlineProgress.totalSec,
        offlineProgress.totalSec - offlineProgress.remainingSec,
      );
      processedThisFrame += 1;
    }

    if (offlineProgress.remainingTicks <= 0 || offlineProgress.remainingSec <= 0) {
      finishOfflineProgress(runId);
      return;
    }

    requestAnimationFrame(() => runOfflineProgressBatch(runId));
  }

  function startOfflineProgress(elapsedSec: number) {
    if (isDisposed) return;

    offlineRunId += 1;
    const runId = offlineRunId;
    const tickCount = getOfflineProgressTickCount(elapsedSec);

    if (tickCount <= 0) {
      offlineProgress.isActive = false;
      resetRuntimeClocks(state);
      return;
    }

    if (elapsedSec < OFFLINE_PROGRESS_MODAL_MIN_SEC) {
      simulateActiveStratumProgress(state, elapsedSec);
      resetRuntimeClocks(state);
      return;
    }

    Object.assign(offlineProgress, {
      isActive: true,
      totalSec: elapsedSec,
      simulatedSec: 0,
      remainingSec: elapsedSec,
      completedTicks: 0,
      plannedTicks: tickCount,
      remainingTicks: tickCount,
      currentStepSec: elapsedSec / tickCount,
      speedUpCount: 0,
      isSkipping: false,
    });

    requestAnimationFrame(() => runOfflineProgressBatch(runId));
  }

  function speedUpOfflineProgress() {
    if (!offlineProgress.isActive || offlineProgress.remainingTicks <= 1) return;

    offlineProgress.remainingTicks = Math.max(1, Math.ceil(offlineProgress.remainingTicks / 2));
    offlineProgress.plannedTicks = offlineProgress.completedTicks + offlineProgress.remainingTicks;
    offlineProgress.currentStepSec = offlineProgress.remainingSec / offlineProgress.remainingTicks;
    offlineProgress.speedUpCount += 1;
  }

  function skipOfflineProgress() {
    if (!offlineProgress.isActive) return;

    offlineProgress.remainingTicks = Math.max(
      1,
      Math.min(offlineProgress.remainingTicks, OFFLINE_PROGRESS_SKIP_STEPS),
    );
    offlineProgress.plannedTicks = offlineProgress.completedTicks + offlineProgress.remainingTicks;
    offlineProgress.currentStepSec = offlineProgress.remainingSec / offlineProgress.remainingTicks;
    offlineProgress.isSkipping = true;
  }

  function replaceState(next: GameState, applyOfflineProgress = true) {
    const elapsedSec = applyOfflineProgress ? getOfflineElapsedSec(next) : 0;
    offlineRunId += 1;
    offlineProgress.isActive = false;
    normalizeGameState(next);
    resetRuntimeClocks(next);
    Object.assign(state, next);
    autoSaveElapsedSec = 0;
    lastLoopMs = performance.now();
    startOfflineProgress(elapsedSec);
  }

  function saveNow() {
    state.lastWallClockMs = Date.now();
    saveGame(state);
  }

  function loadFromDisk() {
    const loaded = loadGame();
    if (!loaded) return false;

    replaceState(loaded);
    return true;
  }

  function restoreLatestLocalBackup() {
    const loaded = loadLocalSaveBackup(0);
    if (!loaded) return false;

    replaceState(loaded);
    if (!offlineProgress.isActive) saveGame(state);
    return true;
  }

  function exportSaveString() {
    return exportSave(state);
  }

  function importSaveString(raw: string) {
    try {
      const loaded = importSave(raw);
      // Manual imports are exact snapshot restores. Applying wall-clock time here
      // can launch a long offline simulation and make the import appear to do nothing.
      replaceState(loaded, false);
      saveGame(state);
      return true;
    } catch (error) {
      console.error("Failed to import save:", error);
      return false;
    }
  }

  function hardReset() {
    const fresh = normalizeGameState(createNewState());
    clearLocalSave();
    replaceState(fresh, false);
    saveGame(state);
  }

  function loop() {
    if (isDisposed) return;

    const now = performance.now();
    const realDtSec = Math.max(0, (now - lastLoopMs) / 1000);
    lastLoopMs = now;

    if (!offlineProgress.isActive) {
      engine.tick(now);
    }

    const interval = state.settings.autoSaveIntervalSec;
    if (!offlineProgress.isActive && interval > 0) {
      autoSaveElapsedSec += realDtSec;
      if (autoSaveElapsedSec >= interval) {
        saveNow();
        autoSaveElapsedSec = 0;
      }
    } else {
      autoSaveElapsedSec = 0;
    }

    loopAnimationFrameId = requestAnimationFrame(loop);
  }

  function dispose() {
    if (isDisposed) return;

    isDisposed = true;
    offlineRunId += 1;
    offlineProgress.isActive = false;

    if (loopAnimationFrameId !== null) {
      cancelAnimationFrame(loopAnimationFrameId);
      loopAnimationFrameId = null;
    }
  }

  loop();
  startOfflineProgress(initialOfflineElapsedSec);

  return {
    state,
    offlineProgress,
    speedUpOfflineProgress,
    skipOfflineProgress,
    saveNow,
    loadFromDisk,
    getLocalSaveBackupSummaries,
    restoreLatestLocalBackup,
    exportSaveString,
    importSaveString,
    hardReset,
    dispose,
  };
}
