import Anthropic from '@anthropic-ai/sdk';

// 1リクエストあたりの Claude 呼び出し回数と待ち時間の上限
// SDK 内部のリトライは無効化し、ここでの試行回数だけが上限になる
export const CLAUDE_MAX_ATTEMPTS = 3;
export const CLAUDE_BACKOFF_MS = [2000, 4000];

export function createAnthropicClient({ timeoutMs }) {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxRetries: 0,
    timeout: timeoutMs,
  });
}

export function isOverloadedError(error) {
  return (
    error?.status === 529 ||
    error?.error?.type === 'overloaded_error' ||
    error?.error?.error?.type === 'overloaded_error'
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callClaudeWithRetry(anthropic, params, { sleepFn = sleep } = {}) {
  for (let i = 0; i < CLAUDE_MAX_ATTEMPTS; i++) {
    try {
      console.log(`Attempt ${i + 1}/${CLAUDE_MAX_ATTEMPTS}`);
      return await anthropic.messages.create(params);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);

      if (isOverloadedError(error) && i < CLAUDE_MAX_ATTEMPTS - 1) {
        const waitTime = CLAUDE_BACKOFF_MS[i];
        console.log(`Waiting ${waitTime}ms before retry...`);
        await sleepFn(waitTime);
        continue;
      }

      throw error;
    }
  }
}
