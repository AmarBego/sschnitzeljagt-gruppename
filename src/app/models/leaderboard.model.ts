export interface LeaderboardEntry {
  userName: string;
  totalDuration: number; // in seconds
  numHuntsCompleted: number; // Count of completed, non-skipped hunts
  numLateCompletions: number;
  numHuntsSkipped: number; // Count of hunts marked as skipped
}
