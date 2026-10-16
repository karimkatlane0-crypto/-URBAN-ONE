const patterns = [
  [/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/gi, '[IBAN_REDACTED]'],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL_REDACTED]'],
  [/\+?\d[\d .()-]{7,}\d/g, '[PHONE_REDACTED]'],
  [/\b(sk-[A-Za-z0-9_-]{12,}|AIza[\w-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,})\b/g, '[SECRET_REDACTED]']
];
export function sanitizeText(input='') {
  return patterns.reduce((s,[re,r]) => s.replace(re,r), String(input));
}
export function sanitizeObject(value) {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeObject);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,sanitizeObject(v)]));
  return value;
}
