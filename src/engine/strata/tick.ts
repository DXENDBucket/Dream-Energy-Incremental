import type { GameState } from "../core/state";
import type { StratumState } from "./state";
import { mul } from "../math/num";
import type { Num } from "../math/num";
import { getActiveStratum } from "./manager/selectors";
import { tickDreamCrystals } from "./common/dream-crystals";
import { tickDreamCrystalAutobuyers } from "./common/dream-crystals/autobuyers";
import { tickDreamEnergy } from "./common/dream-energy";
import { tickEntropy } from "./common/entropy";
import { tickConceptCrystals } from "./common/concept-crystals";
import { tickCoherenceAutobuyer } from "./common/coherence/autobuyer";
import { tickPassiveCoherencePointGain } from "./common/coherence";
import { syncCoherenceProgressionDreamCrystalMultipliers } from "./common/coherence/upgrades";
import { tickElectromagneticCrystals } from "@/engine/electromagnetic-crystals";

export function tickStratum(stratum: StratumState, dtSec: Num): void {
  tickDreamEnergy(stratum, dtSec);
  tickDreamCrystals(stratum, dtSec);
  tickEntropy(stratum, dtSec);
  tickDreamCrystalAutobuyers(stratum, dtSec);
  tickConceptCrystals(stratum, dtSec);
  tickElectromagneticCrystals(stratum, dtSec);
}

export function tickActiveStratum(state: GameState, dtSec: Num): void {
  const stratum = getActiveStratum(state);
  syncCoherenceProgressionDreamCrystalMultipliers(state);
  let computedDtSec = dtSec;
  computedDtSec = mul(computedDtSec,stratum.stratumSpeed);
  tickStratum(stratum, computedDtSec);
  tickPassiveCoherencePointGain(stratum, computedDtSec);
  tickCoherenceAutobuyer(state, computedDtSec);
  syncCoherenceProgressionDreamCrystalMultipliers(state);
}
