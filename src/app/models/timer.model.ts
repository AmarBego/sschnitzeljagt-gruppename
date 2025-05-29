export interface TimerState {
  isRunning: boolean;
  startTime?: Date;
  elapsedTime: number;
  huntId?: number;
}

export interface AppLifecycleState {
  backgroundTime?: Date;
  foregroundTime?: Date;
  isInBackground: boolean;
}
