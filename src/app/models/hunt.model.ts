export interface Hunt {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  startTime?: Date;
  completionTime?: Date;
  duration?: number; // in seconds
  maxDuration?: number; // maximum expected duration in seconds
  isSkipped?: boolean;
  isLateCompletion?: boolean;
}

export interface HuntProgress {
  hunts: Hunt[];
  currentActiveHunt?: number;
  totalCompleted: number;
}
