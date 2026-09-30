// ページ本体はクライアント側で /api/get-lp を呼ぶだけなので、サーバー側の描画結果は ID に依存しない。
// 空の generateStaticParams で初回アクセス時に生成・キャッシュ（ISR）し、毎回の SSR を避ける。
export function generateStaticParams() {
  return [];
}

export default function SharedLPLayout({ children }) {
  return children;
}
