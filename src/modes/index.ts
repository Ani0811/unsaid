import type { Mode } from '../types';

export interface ModeConfig {
  id: Mode;
  name: string;
  tagline: string;
  description: string;
  placeholder: string;
  badgeColor: string;
  accentBg: string;
  glowClass: string;
  starters: string[];
}

export const MODES: Record<Mode, ModeConfig> = {
  talk: {
    id: 'talk',
    name: 'TALK',
    tagline: "Say what's on your mind.",
    description: 'A thoughtful conversational space. A place to think aloud, explore uncertainties, and work through whatever is weighing on you at your own pace.',
    placeholder: "What's on your mind right now? (Shift + Enter for new line)",
    badgeColor: 'text-amber-300/90 border-amber-500/30 bg-amber-500/10',
    accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
    glowClass: 'ambient-warmth-talk',
    starters: [
      "I've been feeling overwhelmed lately, but I can't pin down why.",
      "I have an important decision coming up and I keep going in circles.",
      "There's something that happened today that I just can't shake off.",
      "I feel like I'm falling behind even though I'm trying my best."
    ]
  },
  unload: {
    id: 'unload',
    name: 'UNLOAD',
    tagline: 'Get it out without needing to solve it.',
    description: 'No action items. No unsolicited advice lists. Just dump everything swimming in your head into a quiet, private container where it can rest.',
    placeholder: 'Dump everything here. Write as much or as messy as you need...',
    badgeColor: 'text-sky-300/90 border-sky-500/30 bg-sky-500/10',
    accentBg: 'bg-sky-500/10 border-sky-500/20 text-sky-200',
    glowClass: 'ambient-warmth-unload',
    starters: [
      "Just dumping this so it stops buzzing in my head: ...",
      "I have too many tabs open in my mind right now...",
      "I'm tired of holding everything together today.",
      "Everything feels loud and chaotic right now, here is the raw brain dump:"
    ]
  },
  unsaid: {
    id: 'unsaid',
    name: 'UNSAID',
    tagline: 'Explore what you wish you could say.',
    description: 'A dedicated laboratory for the words left unspoken. Explore what you wish someone understood, organize your perspective, and separate facts from assumptions without guessing their mind.',
    placeholder: 'Who is this for, and what do you wish you could tell them?',
    badgeColor: 'text-purple-300/90 border-purple-500/30 bg-purple-500/10',
    accentBg: 'bg-purple-500/10 border-purple-500/20 text-purple-200',
    glowClass: 'ambient-warmth-unsaid',
    starters: [
      "I wish I could tell my friend that losing our friendship actually hurt me.",
      "I want to tell my manager that the workload is no longer sustainable.",
      "I wish my family understood why I need space right now.",
      "There is something I never got to say before we stopped talking."
    ]
  }
};
