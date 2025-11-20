// lib/generateLPHTML.js
// LPRendererと同じ構造のHTMLを生成する関数

export function generateLPHTML(lpData) {
  // アニメーション用CSS
  const animations = `
    @keyframes blob {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(20px, -50px) scale(1.1); }
      50% { transform: translate(-20px, 20px) scale(0.9); }
      75% { transform: translate(50px, 50px) scale(1.05); }
    }
    .animate-blob { animation: blob 7s infinite; }
    .animation-delay-2000 { animation-delay: 2s; }
    .animation-delay-4000 { animation-delay: 4s; }
  `;

  // SVGアイコンの定義
  const icons = {
    sparkles: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>',
    users: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>',
    star: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>',
    award: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>',
    alert: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>',
    zap: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>',
    checkCircle: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
    trendingUp: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>',
    arrowRight: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>'
  };

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lpData.serviceName}</title>
  <meta name="description" content="${lpData.catchphrase}">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; }
    ${animations}
  </style>
</head>
<body class="bg-white">

  <!-- ヒーローセクション -->
  <section class="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-32 px-4 overflow-hidden">
    <div class="absolute inset-0 opacity-30">
      <div class="absolute top-10 left-10 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div class="absolute top-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      <div class="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
    </div>

    <div class="max-w-6xl mx-auto text-center relative z-10">
      <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">${icons.sparkles}</svg>
        <span class="text-sm font-semibold">革新的なソリューション</span>
      </div>
      
      <h1 class="text-6xl md:text-7xl font-black mb-6 leading-tight">
        ${lpData.serviceName}
      </h1>
      
      <p class="text-3xl md:text-4xl mb-4 opacity-95 leading-relaxed font-bold">
        ${lpData.catchphrase}
      </p>
      
      ${lpData.subCatchphrase ? `
        <p class="text-xl md:text-2xl mb-10 opacity-90 max-w-4xl mx-auto">
          ${lpData.subCatchphrase}
        </p>
      ` : ''}
      
      <button class="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-5 px-12 rounded-full text-xl transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-2">
        ${lpData.ctaText}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons.arrowRight}</svg>
      </button>
      
      ${lpData.ctaSubtext ? `
        <p class="mt-6 text-sm opacity-90">${lpData.ctaSubtext}</p>
      ` : ''}
    </div>
  </section>

  <!-- 社会的証明バー -->
  <section class="py-6 bg-gray-900 text-white">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex flex-wrap items-center justify-center gap-8 text-center">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons.users}</svg>
          <span class="text-sm"><strong class="text-2xl font-bold">10,000+</strong> 社の導入実績</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">${icons.star}</svg>
          <span class="text-sm"><strong class="text-2xl font-bold">4.9</strong> / 5.0 顧客評価</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons.award}</svg>
          <span class="text-sm"><strong class="text-2xl font-bold">業界No.1</strong> シェア</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 問題提起セクション -->
  <section class="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <div class="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold mb-4">
          こんな悩み、ありませんか？
        </div>
        <h2 class="text-5xl font-bold mb-4 text-gray-900">
          多くの企業が同じ課題を抱えています
        </h2>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        ${lpData.problems.map(problem => `
          <div class="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border-l-4 border-red-500">
            <div class="flex items-start gap-4 mb-4">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons.alert}</svg>
              </div>
            </div>
            <p class="text-gray-700 leading-relaxed text-lg">${problem}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- ソリューションセクション -->
  <section class="py-24 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <div class="max-w-6xl mx-auto text-center">
      <div class="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons.zap}</svg>
        <span>ソリューション</span>
      </div>
      <h2 class="text-5xl font-bold mb-8 text-gray-900">
        すべての課題を、一つのツールで解決
      </h2>
      <p class="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
        ${lpData.solution}
      </p>
    </div>
  </section>

  <!-- 主要機能 -->
  <section class="py-24 px-4 bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-5xl font-bold text-center mb-16 text-gray-900">主要機能</h2>
      <div class="grid md:grid-cols-3 gap-8">
        ${lpData.features.map(feature => `
          <div class="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div class="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">${icons.sparkles}</svg>
            </div>
            <h3 class="text-2xl font-bold mb-3 text-gray-900 text-center">${feature.title}</h3>
            <p class="text-gray-600 mb-4 leading-relaxed text-center">${feature.description}</p>
            ${feature.benefit ? `
              <div class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-green-600 font-semibold text-center flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons.trendingUp}</svg>
                  ${feature.benefit}
                </p>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- 差別化ポイント -->
  <section class="py-24 px-4 bg-white">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-5xl font-bold text-center mb-16 text-gray-900">
        選ばれる3つの理由
      </h2>
      <div class="space-y-6">
        ${lpData.strengths.map((strength, idx) => `
          <div class="flex items-start gap-6 p-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-3xl hover:shadow-xl transition-all">
            <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              ${idx + 1}
            </div>
            <p class="text-xl text-gray-800 leading-relaxed pt-4">${strength}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- 導入ステップ -->
  <section class="py-24 px-4 bg-white">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-5xl font-bold text-center mb-16 text-gray-900">
        簡単3ステップで始められます
      </h2>
      <div class="grid md:grid-cols-3 gap-12">
        ${lpData.steps.map((step, idx) => `
          <div class="text-center">
            <div class="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto text-4xl font-black shadow-2xl mb-8">
              ${idx + 1}
            </div>
            <h3 class="text-2xl font-bold mb-4 text-gray-900">${step.title}</h3>
            <p class="text-gray-600 leading-relaxed text-lg">${step.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- 最終CTA -->
  <section class="py-32 px-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
    <div class="max-w-5xl mx-auto text-center">
      <h2 class="text-6xl font-black mb-6">今すぐ始めましょう</h2>
      <p class="text-3xl mb-12 opacity-90 font-bold">
        ${lpData.subCatchphrase || '無料で試せます'}
      </p>
      <button class="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-6 px-16 rounded-full text-2xl transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-3">
        ${lpData.ctaText}
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons.arrowRight}</svg>
      </button>
    </div>
  </section>

  <!-- フッター -->
  <footer class="py-12 px-4 bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto text-center">
      <h3 class="text-3xl font-bold mb-2">${lpData.serviceName}</h3>
      <p class="text-gray-400 mb-8">${lpData.catchphrase}</p>
      <div class="border-t border-gray-800 pt-8">
        <p class="text-gray-400">© 2025 ${lpData.serviceName}. All rights reserved.</p>
        <p class="text-sm text-gray-500 mt-4">
          このLPは 
          <a href="https://lp-pivot.com" class="text-indigo-400 hover:text-indigo-300 underline">
            LP PIVOT
          </a>
          で生成されました
        </p>
      </div>
    </div>
  </footer>

</body>
</html>`;
}
