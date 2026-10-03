export interface GuardrailCheckResult {
  passed: boolean;
  violation?: 'prompt_injection' | 'clinical_demand' | 'harm_instruction';
  calmResponse?: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(the\s+)?(system|previous|all)\s+(instructions|prompt)/i,
  /act\s+as\s+a\s+(licensed\s+)?(therapist|psychologist|psychiatrist|doctor|physician)/i,
  /give\s+me\s+a\s+(clinical\s+)?(diagnosis|medical\s+assessment|prescription)/i,
  /you\s+are\s+now\s+(DAN|unrestricted|jailbroken)/i,
  /bypass\s+(all\s+)?(safety|content|rules)/i,
  /reveal\s+(your\s+)?(system\s+prompt|developer\s+instructions)/i
];

/**
 * Checks prompt for adversarial injection or demands to violate non-clinical boundaries.
 */
export function checkPromptGuardrails(text: string): GuardrailCheckResult {
  if (!text || typeof text !== 'string') {
    return { passed: true };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      if (/therapist|psychologist|doctor|diagnosis|medical/i.test(text)) {
        return {
          passed: false,
          violation: 'clinical_demand',
          calmResponse:
            "Unsaid operates strictly as a personal, non-clinical reflection space. I cannot diagnose conditions, prescribe treatments, or act as a licensed medical therapist. If you'd like, we can explore how you are feeling in your own words."
        };
      }

      return {
        passed: false,
        violation: 'prompt_injection',
        calmResponse:
          "Unsaid is a private personal reflection tool. System guidelines and privacy boundaries remain fixed to ensure this space stays safe, grounded, and non-prescriptive."
      };
    }
  }

  return { passed: true };
}
