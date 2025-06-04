import { Hunt } from '../models/hunt.model';

export const INITIAL_HUNTS: Hunt[] = [
  {
    id: 1,
    title: 'Secret Location',
    description: 'Find the secret spot',
    isCompleted: false,
    isUnlocked: true,
    maxDuration: 300,
  }, // 5 minutes
  /* {
    id: 2,
    title: 'Walk the walk',
    description: 'Walk a certain distance',
    isCompleted: false,
    isUnlocked: false,
    maxDuration: 240,
  }, */
  // 4 minutes
  {
    id: 2,
    title: 'Scan the truth',
    description: 'Scan the true QR code',
    isCompleted: false,
    isUnlocked: false,
    maxDuration: 120,
  }, // 2 minutes
  /*{
  id: 4,
  title: 'Do a barrel roll',
  description: 'Rotate the phone to the correct angle',
  isCompleted: false,
  isUnlocked: false,
    maxDuration: 30,
  }, // 0.5 minutes
  */
  {
    id: 3,
    title: 'Power Play',
    description: 'Test your device charging skills',
    isCompleted: false,
    isUnlocked: false,
    maxDuration: 60,
  }, // 1 minute
  {
    id: 4,
    title: 'Connectivity',
    description: 'Test your connectivity skills',
    isCompleted: false,
    isUnlocked: false,
    maxDuration: 120,
  }, // 2 minutes
];
