// CoupleProfile（情侣档案）— 对齐 schema v0.1

import type { FlavorTag } from './recipe';

export type SkillLevel = 1 | 2 | 3;
export type PatienceLevel = 1 | 2 | 3;

export interface PersonPreferences {
  likes: string[];
  dislikes: string[];
  allergies: string[];
  restrictions: string[];
  currentlyAvoiding: string[];
}

export interface PersonCooking {
  skillLevel: SkillLevel;
  patience: PatienceLevel;
  cooksMoreOften: boolean;
}

export interface PersonProfile {
  nickname: string;
  displayName?: string;
  preferences: PersonPreferences;
  cooking: PersonCooking;
  frequentDishes: string[];
}

export interface CoupleProfile {
  id: string;
  inviteCode: string;
  personA: PersonProfile;
  personB: PersonProfile;
  createdAt: string;
}
