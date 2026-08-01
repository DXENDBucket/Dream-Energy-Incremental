<script setup lang="ts">
import { createGameStore } from "./store/gameStore";
import MainPage from "./ui/pages/MainPage.vue";
import OfflineProgressModal from "./ui/components/OfflineProgressModal.vue";

const game = createGameStore();
</script>

<template>
  <MainPage :game="game" />
  <OfflineProgressModal :game="game" />
</template>
