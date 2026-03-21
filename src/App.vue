<script setup lang="ts">
import { createGameStore } from "./store/gameStore";
import MainPage from "./ui/pages/MainPage.vue";

const game = createGameStore();
</script>

<template>
  <MainPage :game="game" />
</template>