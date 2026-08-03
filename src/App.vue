<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { createGameStore } from "./store/gameStore";
import MainPage from "./ui/pages/MainPage.vue";
import OfflineProgressModal from "./ui/components/OfflineProgressModal.vue";

const game = createGameStore();

function saveIfReady(): void {
  // Keep the last complete save intact while offline progress is only partially simulated.
  if (!game.offlineProgress.isActive) game.saveNow();
}

function saveWhenHidden(): void {
  if (document.visibilityState === "hidden") saveIfReady();
}

onMounted(() => {
  window.addEventListener("pagehide", saveIfReady);
  document.addEventListener("visibilitychange", saveWhenHidden);
});

onBeforeUnmount(() => {
  saveIfReady();
  window.removeEventListener("pagehide", saveIfReady);
  document.removeEventListener("visibilitychange", saveWhenHidden);
});

if (import.meta.hot) {
  import.meta.hot.dispose(saveIfReady);
}
</script>

<template>
  <MainPage :game="game" />
  <OfflineProgressModal :game="game" />
</template>
