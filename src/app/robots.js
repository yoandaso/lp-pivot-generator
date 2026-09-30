// クローラー方針（docs/PRODUCTION_COST_SAFETY.md 参照）
// 学習用クローラーは拒否、検索・ユーザー起点の取得は許可、API は全クローラー対象外
export const TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot'];
export const SEARCH_AND_USER_CRAWLERS = ['OAI-SearchBot', 'Claude-SearchBot', 'ChatGPT-User', 'Claude-User'];

export default function robots() {
  return {
    rules: [
      { userAgent: TRAINING_CRAWLERS, disallow: '/' },
      { userAgent: SEARCH_AND_USER_CRAWLERS, allow: '/', disallow: '/api/' },
      { userAgent: '*', allow: '/', disallow: '/api/' },
    ],
  };
}
