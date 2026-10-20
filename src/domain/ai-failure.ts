export const aiFailureCodes = [
  'timeout',
  'rate-limit',
  'authentication',
  'model-unavailable',
  'output-limit',
  'invalid-output',
  'network',
  'unavailable',
] as const;

export type AiFailureCode = (typeof aiFailureCodes)[number];

const notices: Record<AiFailureCode, string> = {
  timeout: 'Gemini took too long to respond. Please try again.',
  'rate-limit':
    'Gemini reached a rate or quota limit. Check your AI Studio allowance or try again later.',
  authentication:
    'Gemini could not authorize this request. Check the server API key and project access.',
  'model-unavailable':
    'The configured Gemini model is unavailable. Check the server model setting and project access.',
  'output-limit':
    'Gemini could not finish within the response limit. Try a shorter planning request.',
  'invalid-output':
    'Gemini returned an incomplete or invalid response. Please try again.',
  network:
    'The server could not reach Gemini. Check its connection and try again.',
  unavailable: 'Gemini is temporarily unavailable. Please try again later.',
};
const LOCAL_PLAN_NOTICE =
  'Your complete plan is ready from the local planning engine.';

export class AiFailure extends Error {
  constructor(public readonly code: AiFailureCode) {
    super(code);
    this.name = 'AiFailure';
  }
}

export function getAiFallbackNotice(error: unknown): string {
  const detail =
    error instanceof AiFailure
      ? notices[error.code]
      : 'Gemini is unavailable right now.';
  return `${detail} ${LOCAL_PLAN_NOTICE}`;
}
