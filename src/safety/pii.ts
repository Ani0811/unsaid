export interface PIIMaskResult {
  maskedText: string;
  hasRedactions: boolean;
  redactionCount: number;
}

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /\b(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g;

/**
 * Anonymizes PII from reflection text locally before passing to the model.
 */
export function maskPII(text: string): PIIMaskResult {
  if (!text) return { maskedText: '', hasRedactions: false, redactionCount: 0 };

  let count = 0;
  let masked = text.replace(EMAIL_REGEX, () => {
    count++;
    return '[email]';
  });

  masked = masked.replace(PHONE_REGEX, () => {
    count++;
    return '[phone]';
  });

  masked = masked.replace(SSN_REGEX, () => {
    count++;
    return '[id-number]';
  });

  return {
    maskedText: masked,
    hasRedactions: count > 0,
    redactionCount: count
  };
}
