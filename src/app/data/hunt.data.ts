import { Hunt } from '../models/hunt.model';

export const INITIAL_HUNTS: Hunt[] = [
  { id: 1, title: 'First Discovery', description: 'Find your first clue', isCompleted: false, isUnlocked: true, maxDuration: 300 }, // 5 minutes
  { id: 2, title: 'Hidden Path', description: 'Follow the hidden trail', isCompleted: false, isUnlocked: false, maxDuration: 450 }, // 7.5 minutes
  { id: 3, title: 'Secret Location', description: 'Discover the secret spot', isCompleted: false, isUnlocked: false, maxDuration: 600 }, // 10 minutes
  { id: 4, title: 'Ancient Marker', description: 'Find the ancient marker', isCompleted: false, isUnlocked: false, maxDuration: 360 }, // 6 minutes
  { id: 5, title: 'Final Treasure', description: 'Locate the final treasure', isCompleted: false, isUnlocked: false, maxDuration: 540 }, // 9 minutes
  { id: 6, title: 'Ultimate Prize', description: 'Claim your ultimate prize', isCompleted: false, isUnlocked: false, maxDuration: 420 } // 7 minutes
];
