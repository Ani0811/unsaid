import type { SafetyCheckResult } from '../types';

/**
 * Modular safety detector for Unsaid.
 * Focuses strictly on detecting clear, immediate intent for self-harm or crisis,
 * halting conversational generation and providing immediate, calm crisis resources.
 */

// Pattern detectors for imminent self-harm or suicidal intent
const SELF_HARM_PATTERNS = [
  /\b(kill\s*myself|want\s*to\s*die|end\s*(my\s*life|it\s*all)|commit\s*suicide|suicidal)\b/i,
  /\b(hang\s*myself|slit\s*my\s*(wrists|throat)|overdose\s*(on|myself))\b/i,
  /\b(don'?t\s*want\s*to\s*(live|wake\s*up)\s*anymore|better\s*off\s*dead|no\s*reason\s*to\s*live)\b/i,
  /\b(hurt\s*myself|hurting\s*myself|harm\s*myself|harming\s*myself|self[\s-]harm|cutting\s*myself)\b/i
];

export const CRISIS_GUIDANCE_MESSAGE = `
### You are not alone, and help is here right now.

It sounds like you are going through an overwhelming amount of pain. Unsaid is an automated reflection tool, and because your safety and well-being are paramount, please reach out to someone who can truly support you right now.

**Immediate steps for this moment:**
1. **Step away** from anything you could use to harm yourself, and move to a safe, quiet space or near someone you trust.
2. **Reach out to a trusted person** — a close friend, family member, roommate, or someone nearby who can sit with you.
3. **Connect with dedicated crisis support immediately (free, confidential, available 24/7):**
   - **United States & Canada:** Call or text **988** (Suicide & Crisis Lifeline)
   - **United Kingdom:** Call **111** (NHS) or call the Samaritans at **116 123**
   - **Text Crisis Line (US/UK/Canada):** Text **HOME** to **741741**
   - **International:** Visit **[findahelpline.com](https://findahelpline.com)** or **[befrienders.org](https://www.befrienders.org)** to find immediate confidential local support in your country.
   - **Emergency:** If you are in immediate physical danger, call your local emergency services (such as 911, 999, 112, etc.) or go to the nearest emergency department.

Please take care of yourself right now. People do care, and support is available this very second.
`;

/**
 * Checks if a given input text contains indicators of imminent self-harm or crisis.
 */
export function checkSafety(text: string): SafetyCheckResult {
  if (!text || typeof text !== 'string') {
    return { isSafe: true };
  }

  const clean = text.trim();
  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isSafe: false,
        reason: 'self_harm_risk',
        guidanceMessage: CRISIS_GUIDANCE_MESSAGE
      };
    }
  }

  return { isSafe: true };
}
