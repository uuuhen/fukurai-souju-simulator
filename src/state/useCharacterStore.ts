import { create } from "zustand";
import { CharacterSpecies, CharacterState } from "@/types";
import { createCharacter, getCharacter, updateCharacter } from "@/db/characterRepo";
import { applyBoostToCharacter, applySaveToCharacter, applySpendToCharacter } from "@/domain/character";

interface CharacterStoreState {
  character: CharacterState | null;
  isLoaded: boolean;
  load: () => Promise<void>;
  chooseSpecies: (species: CharacterSpecies) => Promise<void>;
  registerSave: (amount: number) => Promise<void>;
  registerSpend: (amount: number) => Promise<void>;
  boost: (points: number) => Promise<void>;
}

export const useCharacterStore = create<CharacterStoreState>((set, get) => ({
  character: null,
  isLoaded: false,
  load: async () => {
    const character = await getCharacter();
    set({ character, isLoaded: true });
  },
  chooseSpecies: async (species) => {
    const previousGeneration = get().character?.generation ?? 0;
    const character = await createCharacter(species, previousGeneration + 1);
    set({ character });
  },
  registerSave: async (amount) => {
    const current = get().character;
    if (!current || !current.isAlive) return;
    const next = applySaveToCharacter(current, amount);
    await updateCharacter(next);
    set({ character: next });
  },
  registerSpend: async (amount) => {
    const current = get().character;
    if (!current || !current.isAlive) return;
    const next = applySpendToCharacter(current, amount);
    await updateCharacter(next);
    set({ character: next });
  },
  boost: async (points) => {
    const current = get().character;
    if (!current || !current.isAlive) return;
    const next = applyBoostToCharacter(current, points);
    await updateCharacter(next);
    set({ character: next });
  },
}));
