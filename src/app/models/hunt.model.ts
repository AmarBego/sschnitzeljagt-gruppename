export interface Hunt {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  startTime?: Date;
  completionTime?: Date;
  duration?: number; // in seconds
}

export interface HuntProgress {
  hunts: Hunt[];
  currentActiveHunt?: number;
  totalCompleted: number;
}
