/**
 * Cloudflare Worker - 애니빌드 → Google Apps Script 프록시
 *
 * 애니빌드 webhook이 Google Apps Script URL의 302 리다이렉트를 따라가지 못하므로
 * 이 Worker가 중간에서 요청을 받아 GAS로 전달합니다.
 *
 * 설정 방법:
 * 1. https://dash.cloudflare.com 가입/로그인
 * 2. Workers & Pages → Create → Create Worker
 * 3. 이 코드를 붙여넣기 → Deploy
 * 4. Worker URL을 애니빌드 webhook에 등록
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzg6DkY-6OyYZXZ46zxCqpPqXohj4vIxg6Trcb-XEADmvjTad1nIDcPYl130FF7CUhVHQ/exec';

export default {
  async fetch(request) {
    // GET 요청: 애니빌드 URL 검증 또는 대시보드 데이터 조회
    if (request.method === 'GET') {
      const url = new URL(request.url);
      // 대시보드에서 데이터 조회 시 파라미터 전달
      const gasUrl = new URL(GAS_URL);
      for (const [key, value] of url.searchParams) {
        gasUrl.searchParams.set(key, value);
      }

      const gasResponse = await fetch(gasUrl.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      const body = await gasResponse.text();
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // POST 요청: 애니빌드 webhook 수신 → GAS 전달
    if (request.method === 'POST') {
      const body = await request.text();

      const gasResponse = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body,
        redirect: 'follow'
      });

      const responseText = await gasResponse.text();
      return new Response(responseText, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    return new Response('APS Webhook Proxy', { status: 200 });
  }
};
