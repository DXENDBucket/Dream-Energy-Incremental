<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { CHARACTER_MAX_LEVEL } from "@/engine/characters";

const { t } = useI18n();
</script>

<template>
  <section class="levels-placeholder">
    <div class="level-icon">↑</div>
    <h2>{{ t("characterLevels.title") }}</h2>
    <p>{{ t("characterLevels.placeholder", { max: CHARACTER_MAX_LEVEL }) }}</p>
  </section>
</template>

<style scoped>
.levels-placeholder {
  width: min(720px, 94%);
  margin: 40px auto;
  padding: 42px 28px;
  border: 1px solid #3c455d;
  border-radius: 9px;
  color: #edf0ff;
  background: linear-gradient(145deg, rgba(23,29,45,0.96), rgba(9,13,22,0.98));
  text-align: center;
}

.level-icon { color: #dce5ff; font-size: 3rem; }
h2 { margin: 10px 0; }
p { margin: 0; color: #aeb8d3; }
</style>
