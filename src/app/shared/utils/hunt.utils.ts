import { Hunt, HuntProgress } from '../../models/hunt.model';

export function findHuntOrFail(progress: HuntProgress, huntId: number): Hunt {
  const hunt = progress.hunts.find(h => h.id === huntId);
  if (!hunt) {
    throw new Error(`Hunt with ID ${huntId} not found.`);
  }
  return hunt;
}

export function ensureHuntIsUnlocked(hunt: Hunt): void {
  if (!hunt.isUnlocked) {
    throw new Error(`Hunt '${hunt.title}' (ID ${hunt.id}) is locked and cannot be started.`);
  }
}

export function ensureHuntIsNotCompleted(hunt: Hunt): void {
  if (hunt.isCompleted) {
    throw new Error(`Hunt '${hunt.title}' (ID ${hunt.id}) is already completed.`);
  }
}

export function ensureHuntHasStartTime(hunt: Hunt): void {
  if (!hunt.startTime) {
    throw new Error(`Hunt '${hunt.title}' (ID ${hunt.id}). Start time is missing.`);
  }
}

export function calculateHuntDuration(startTime: Date | undefined, completionTime: Date): number {
  if (!startTime) {
    return 0;
  }
  return Math.floor((completionTime.getTime() - new Date(startTime).getTime()) / 1000);
}

export function unlockNextHunt(progress: HuntProgress, completedHuntId: number): void {
  const nextHunt = progress.hunts.find(h => h.id === completedHuntId + 1);
  if (nextHunt) {
    nextHunt.isUnlocked = true;
  }
}

export function checkIfHuntIsOverdue(hunt: Hunt, elapsedTime: number): boolean {
  if (!hunt.startTime || !hunt.maxDuration) {
    return false;
  }
  return elapsedTime > hunt.maxDuration;
}
