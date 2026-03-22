import type { GameState } from "@/engine/core/state";
import { createNewState } from "@/engine/core/state";
import { N, isNum, serializeNum } from "@/engine/math/num";

const SAVE_KEY = "dream-energy-incremental-save";
const SAVE_PREFIX = "DreamEnergyIncremental";
const SAVE_VERSION = 1;

type SerializedNum = {
  $type: "num";
  value: string;
};

type SaveFile = {
  version: number;
  state: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serializeValue(value: unknown): unknown {
  if (value === null) return null;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (isNum(value)) {
    return {
      $type: "num",
      value: serializeNum(value),
    } satisfies SerializedNum;
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, serializeValue(inner)])
    );
  }

  return value;
}

function isSerializedNum(value: unknown): value is SerializedNum {
  return (
    isPlainObject(value) &&
    value.$type === "num" &&
    typeof value.value === "string"
  );
}

function deserializeValue(value: unknown): unknown {
  if (value === null) return null;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (isSerializedNum(value)) {
    return N(value.value);
  }

  if (Array.isArray(value)) {
    return value.map(deserializeValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, deserializeValue(inner)])
    );
  }

  return value;
}

function deepMerge<T>(target: T, source: unknown): T {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return (source as T) ?? target;
  }

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = (target as Record<string, unknown>)[key];

    if (Array.isArray(sourceValue)) {
      (target as Record<string, unknown>)[key] = sourceValue;
      continue;
    }

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      deepMerge(targetValue, sourceValue);
      continue;
    }

    (target as Record<string, unknown>)[key] = sourceValue;
  }

  return target;
}

export function saveGame(state: GameState): void {
  const raw = exportSave(state);
  localStorage.setItem(SAVE_KEY, raw);
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    return importSave(raw);
  } catch (error) {
    console.error("Failed to load save:", error);
    return null;
  }
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function importSave(raw: string): GameState {
  const parts = raw.split("|");

  if (parts.length < 3) {
    throw new Error("Invalid save format.");
  }

  const prefix = parts[0];
  const versionText = parts[1];
  const payload = parts.slice(2).join("|");

  if (prefix !== SAVE_PREFIX) {
    throw new Error("This is not a Dream Energy Incremental save.");
  }

  const version = Number(versionText);
  if (!Number.isFinite(version)) {
    throw new Error("Invalid save version.");
  }

  const json = decodeBase64Utf8(payload);
  const parsed = JSON.parse(json) as SaveFile;

  if (parsed.version !== version) {
    console.warn("Save header version and file version do not match.");
  }

  const fresh = createNewState();
  const restored = deserializeValue(parsed.state);

  return deepMerge(fresh, restored);
}

export function exportSave(state: GameState): string {
  const file: SaveFile = {
    version: SAVE_VERSION,
    state: serializeValue(state),
  };

  const json = JSON.stringify(file);
  const payload = encodeBase64Utf8(json);

  return `${SAVE_PREFIX}|${SAVE_VERSION}|${payload}`;
}
