<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { createGameStore } from "./store/gameStore";
import MainPage from "./ui/pages/MainPage.vue";
import OfflineProgressModal from "./ui/components/OfflineProgressModal.vue";

const game = createGameStore();
let isTornDown = false;

function saveIfReady(): void {
  // Keep the last complete save intact while offline progress is only partially simulated.
  if (!game.offlineProgress.isActive) game.saveNow();
}

function saveWhenHidden(): void {
  if (document.visibilityState === "hidden") saveIfReady();
}

function teardown(): void {
  if (isTornDown) return;

  isTornDown = true;
  saveIfReady();
  game.dispose();
  window.removeEventListener("pagehide", saveIfReady);
  document.removeEventListener("visibilitychange", saveWhenHidden);
}

onMounted(() => {
  window.addEventListener("pagehide", saveIfReady);
  document.addEventListener("visibilitychange", saveWhenHidden);
});

onBeforeUnmount(() => {
  teardown();
});

if (import.meta.hot) {
  import.meta.hot.dispose(teardown);
}
</script>

<template>
  <MainPage :game="game" />
  <OfflineProgressModal :game="game" />
</template>
