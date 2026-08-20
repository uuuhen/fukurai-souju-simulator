import { CharacterState } from "@/types";
import { DISAPPEAR_THRESHOLD, levelFromPoints, stageFromLevel } from "@/constants/characters";

export function applySaveToCharacter(current: CharacterState, amount: number): CharacterState {
  const points = current.points + amount;
  const level = levelFromPoints(points);
  return {
    ...current,
    points,
    level,
    stage: stageFromLevel(current.species, level),
    lastAction: "save",
  };
}

export function applySpendToCharacter(current: CharacterState, amount: number): CharacterState {
  const points = current.points - amount;
  if (points <= DISAPPEAR_THRESHOLD) {
    return {
      ...current,
      points,
      isAlive: false,
      lastAction: "spend",
    };
  }
  const level = levelFromPoints(points);
  return {
    ...current,
    points,
    level,
    stage: stageFromLevel(current.species, level),
    lastAction: "spend",
  };
}

// 課金によるブースト。指定ポイント分を即座に加算する。
export function applyBoostToCharacter(current: CharacterState, boostPoints: number): CharacterState {
  const points = current.points + boostPoints;
  const level = levelFromPoints(points);
  return {
    ...current,
    points,
    level,
    stage: stageFromLevel(current.species, level),
  };
}
