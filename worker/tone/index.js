// Tone Profile System
// Centralized tone management with individual tone files

import friendly from './tones/friendly.js';
import corporate from './tones/corporate.js';
import momNPop from './tones/mom-n-pop.js';
import startup from './tones/startup.js';
import premium from './tones/premium.js';
import clinical from './tones/clinical.js';
import govtech from './tones/govtech.js';
import modernTech from './tones/modern-tech.js';

// Main tone profiles map
export const TONE_PROFILES = {
  friendly,
  corporate,
  'mom-n-pop': momNPop,
  'startup-new': startup,
  'premium-new': premium,
  clinical,
  govtech,
  'modern-tech': modernTech,
  
  // Aliases for backward compatibility
  'startup-old': startup,
  'local-shop': friendly,
  'local-expert': friendly,
  'premium-brand': premium,
  'helpful-calm': friendly,
  'classic-retail': modernTech
};

// Get tone profile by name, country for later expansion
export function getToneProfile(toneName, country) {
  return TONE_PROFILES[toneName] || TONE_PROFILES.friendly;
}
