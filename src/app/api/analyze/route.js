import { NextResponse } from 'next/server';

function extractImportantContent(html) {
  // タイトル
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  // メタディスクリプション
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  
  // OGディスクリプション
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : '';
  
  // h1タグ（すべて取得）
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const h1s = h1Matches
    .map(h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter(h => h.length > 0)
    .join(' | ');
  
  // h2タグ（最初の8つ）
  const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const h2s = h2Matches
    .map(h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter(h => h.length > 0)
    .slice(0, 8)
    .join(' | ');
  
  // mainまたはarticleの内容
  let mainContent = '';
  const mainMatch = html.match(/<main[^>]*>(.*?)<\/main>/is);
  const articleMatch = html.match(/<article[^>]*>(.*?)<\/article>/is);
  const sectionMatch = html.match(/<section[^>]*class=["'][^"']*hero[^"']*["'][^>]*>(.*?)<\/section>/is);
  
  const contentSource = mainMatch || articleMatch || sectionMatch;
  
  if (contentSource) {
    mainContent = contentSource[1]
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<nav[^>]*>.*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>.*?<\/footer>/gi, '')
      .replace(/<header[^>]*>.*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1500);
  } else {
    // mainタグがない場合、bodyから抽出
    const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
    if (bodyMatch) {
      mainContent = bodyMatch[1]
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<nav[^>]*>.*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>.*?<\/footer>/gi, '')
        .replace(/<header[^>]*>.*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1500);
    }
  }
  
  // CTA（Call to Action）テキスト
  const ctaMatches = html.match(/<button[^>]*>(.*?)<\/button>/gi) || [];
  const ctas = ctaMatches
    .map(c => c.replace(/<[^>]+>/g, '').trim())
    .filter(c => c.length > 0 && c.length < 50)
    .slice(0, 5)
    .join(' | ');
  
  return `
【タイトル】
${title}

【メタ説明】
${description || ogDescription}

【主要見出し（H1）】
${h1s || 'なし'}

【サブ見出し（H2）】
${h2s || 'なし'}

【CTAボタン】
${ctas || 'なし'}

【メインコンテンツ】
${mainContent}
  `.trim();
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    console.log('分析開始:', url);
    
    let websiteContent = '';
    let fetchSuccess = false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      const siteResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (siteResponse.ok) {
        const html = await siteResponse.text();
        websiteContent = extractImportantContent(html);
        fetchSuccess = true;
        console.log('サイト内容取得成功、文字数:', websiteContent.length);
      }
    } catch (fetchError) {
      console.log('サイト取得失敗:', fetchError.message);
      console.log('URLのみで分析を試みます');
    }
    
    // Claude APIで分析
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `以下のウェブサイトを詳細に分析してください。

URL: ${url}

${websiteContent ? `
ウェブサイトから抽出した情報:
${websiteContent}

` : '（ウェブサイトの内容を取得できませんでした。URLから推測して分析してください）'}

【重要な指示】
${fetchSuccess ? 
  '- 上記のウェブサイト内容に実際に記載されている情報のみを使用してください\n- 推測や一般的な想定は避け、具体的に書かれている内容を抽出してください' : 
  '- URLとドメイン名から慎重に推測してください\n- 確実でない情報は「情報不足」と記載してください'
}
- サービスの種類（ライティングツール、データ分析、マーケティング等）を正確に判断してください
- ターゲット顧客は具体的に記載してください
- 主要機能は実際に提供されている機能を列挙してください

以下の形式のJSONで返してください（JSON以外の文字は一切含めないでください）:
{
  "serviceName": "サービス名",
  "features": ["具体的な機能1", "具体的な機能2", "具体的な機能3"],
  "targetCustomer": "ターゲット顧客（例: ライター、マーケター、開発者など）",
  "valueProposition": "提供価値の説明",
  "category": "サービスカテゴリ（例: ライティングツール、データ分析ツール、マーケティングツールなど）"
}`
        }]
      })
    });

    const data = await response.json();
    console.log('Claude API応答受信');
    
    const content = data.content[0].text.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analyzed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    console.log('分析完了:', analyzed.serviceName);
    
    return NextResponse.json(analyzed);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '分析に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}