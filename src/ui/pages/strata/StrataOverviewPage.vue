<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { GameState } from "@/engine/core/state";
import { firstStratumId } from "@/engine/strata/defs/ids";

const props = defineProps<{
  game: {
    state: GameState;
  };
}>();

const { t } = useI18n();
const realityIsActive = computed(() => props.game.state.activeStratumId === firstStratumId);
const realityIsAvailable = computed(() => firstStratumId in props.game.state.strata);
const depthBands = Array.from({ length: 5 }, (_, index) => index);
const shards = Array.from({ length: 14 }, (_, index) => index);

function selectReality() {
  if (!realityIsAvailable.value) return;
  props.game.state.activeStratumId = firstStratumId;
}
</script>

<template>
  <div class="strata-overview">
    <div class="depth-map">
      <div class="skyline" aria-hidden="true" />

      <div
        v-for="band in depthBands"
        :key="band"
        class="depth-band"
        :style="{
          '--band-index': band,
          '--band-width': `${86 - band * 9}%`,
          '--band-top': `${18 + band * 13}%`,
        }"
        aria-hidden="true"
      />

      <span
        v-for="shard in shards"
        :key="shard"
        class="dream-shard"
        :style="{
          '--shard-left': `${10 + ((shard * 17) % 78)}%`,
          '--shard-top': `${28 + ((shard * 19) % 58)}%`,
          '--shard-size': `${10 + (shard % 4) * 5}px`,
          '--shard-rotation': `${(shard * 29) % 180}deg`,
          '--shard-delay': `${shard * -0.18}s`,
        }"
        aria-hidden="true"
      />

      <button
        class="stratum-node reality-node"
        :class="{ active: realityIsActive }"
        :disabled="!realityIsAvailable"
        @click="selectReality"
      >
        <span class="node-orbit" aria-hidden="true" />
        <span class="node-core">
          <span class="node-title">{{ t("strataOverview.reality") }}</span>
          <span v-if="realityIsActive" class="node-state">{{ t("strataOverview.active") }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.strata-overview {
  width: min(980px, 96%);
  min-height: 560px;
}

.depth-map {
  position: relative;
  min-height: 560px;
  overflow: hidden;
  border: 1px solid rgba(71, 91, 145, 0.72);
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 5%, rgba(209, 238, 255, 0.16), transparent 22%),
    linear-gradient(180deg, rgba(17, 30, 53, 0.98) 0%, rgba(12, 20, 40, 0.98) 28%, rgba(24, 14, 45, 0.98) 64%, rgba(8, 8, 28, 0.98) 100%);
  box-shadow:
    0 14px 38px rgba(0, 0, 0, 0.34),
    inset 0 0 42px rgba(128, 154, 255, 0.08);
  isolation: isolate;
}

.depth-map::before {
  content: "";
  position: absolute;
  inset: 22% 0 0;
  background:
    linear-gradient(180deg, rgba(136, 207, 255, 0.24), transparent 16%),
    linear-gradient(125deg, transparent 0 44%, rgba(196, 149, 255, 0.12) 45% 48%, transparent 49%),
    linear-gradient(58deg, transparent 0 41%, rgba(99, 242, 217, 0.1) 42% 46%, transparent 47%);
  clip-path: polygon(6% 0, 94% 0, 82% 100%, 18% 100%);
  opacity: 0.85;
  z-index: -1;
}

.depth-map::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent 0 12%, rgba(218, 235, 255, 0.08) 13%, transparent 14% 86%, rgba(218, 235, 255, 0.08) 87%, transparent 88%),
    repeating-linear-gradient(180deg, transparent 0 42px, rgba(255, 255, 255, 0.035) 43px 44px);
  mask-image: linear-gradient(180deg, transparent 0%, #000 14%, #000 92%, transparent 100%);
  pointer-events: none;
}

.skyline {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 18%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(231, 244, 255, 0.72), transparent);
  box-shadow: 0 0 18px rgba(156, 214, 255, 0.46);
}

.depth-band {
  position: absolute;
  left: 50%;
  top: var(--band-top);
  width: var(--band-width);
  height: 12%;
  transform: translateX(-50%);
  border: 1px solid rgba(126, 148, 221, 0.2);
  border-radius: 50%;
  background:
    linear-gradient(90deg, transparent, rgba(120, 190, 255, 0.06), transparent),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent);
  opacity: calc(0.48 - var(--band-index) * 0.045);
}

.dream-shard {
  position: absolute;
  left: var(--shard-left);
  top: var(--shard-top);
  width: var(--shard-size);
  aspect-ratio: 1;
  transform: rotate(var(--shard-rotation));
  border: 1px solid rgba(203, 222, 255, 0.24);
  background: linear-gradient(135deg, rgba(111, 211, 255, 0.26), rgba(206, 130, 255, 0.1));
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  opacity: 0.45;
  animation: shard-glimmer 4.6s ease-in-out infinite;
  animation-delay: var(--shard-delay);
}

.stratum-node {
  position: absolute;
  left: 50%;
  top: 10%;
  width: 96px;
  aspect-ratio: 1;
  transform: translateX(-50%);
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #f7fbff;
  cursor: pointer;
  font: inherit;
}

.stratum-node:disabled {
  cursor: not-allowed;
}

.node-orbit {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(210, 234, 255, 0.62);
  border-radius: 50%;
  background:
    conic-gradient(from 18deg, transparent, rgba(121, 209, 255, 0.34), transparent 34%, rgba(225, 174, 255, 0.32), transparent 68%, rgba(129, 255, 210, 0.26), transparent),
    radial-gradient(circle, rgba(240, 249, 255, 0.18) 0 22%, transparent 58%);
  box-shadow:
    0 0 28px rgba(127, 199, 255, 0.28),
    inset 0 0 24px rgba(255, 255, 255, 0.08);
  animation: node-orbit 14s linear infinite;
}

.node-core {
  position: absolute;
  inset: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 26%, rgba(255, 255, 255, 0.32), transparent 30%),
    linear-gradient(180deg, rgba(87, 134, 184, 0.95), rgba(23, 46, 83, 0.95));
  box-shadow:
    inset 0 0 24px rgba(255, 255, 255, 0.12),
    0 10px 24px rgba(0, 0, 0, 0.28);
}

.node-title {
  font-size: 0.94rem;
  font-weight: 800;
  color: #ffffff;
}

.node-state {
  padding: 2px 7px;
  border: 1px solid rgba(220, 243, 255, 0.42);
  border-radius: 999px;
  background: rgba(10, 22, 43, 0.62);
  color: #c9edff;
  font-size: 0.68rem;
  font-weight: 700;
}

.stratum-node:hover .node-orbit {
  box-shadow:
    0 0 34px rgba(149, 218, 255, 0.44),
    inset 0 0 26px rgba(255, 255, 255, 0.1);
}

@keyframes node-orbit {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes shard-glimmer {
  0%,
  100% {
    opacity: 0.24;
  }

  50% {
    opacity: 0.56;
  }
}

@media (max-width: 720px) {
  .strata-overview {
    width: 100%;
    min-height: 500px;
  }

  .depth-map {
    min-height: 500px;
  }

  .stratum-node {
    width: 86px;
  }
}
</style>
