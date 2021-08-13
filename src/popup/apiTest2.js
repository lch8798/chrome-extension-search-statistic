/**
 * 네이버 검색광고 API 전용 모듈
 */

const CUSTOMER_ID = 2321595;
const API_KEY =
  "0100000000dd0b7d7ade9e835ecbcaef80cdd6bf6ecce2ba7b71feff04bb3fe0880dd8545d";
const API_SECRET = "AQAAAADdC3163p6DXsvK74DN1r9uGkZkNUnWzIPuYzwMcXEA9A==";
export const BASE_URL = "https://api.naver.com";

/**
 * sha256-hmac 단방향 암호화
 * @param {string} key
 * @param {string} message
 * @returns {string}
 */
async function sha256_hmac(key, message) {
  const g = (str) =>
      new Uint8Array(
        [...unescape(encodeURIComponent(str))].map((c) => c.charCodeAt(0))
      ),
    k = g(key),
    m = g(message),
    c = await crypto.subtle.importKey(
      "raw",
      k,
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign"]
    ),
    s = await crypto.subtle.sign("HMAC", c, m);
  [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return btoa(String.fromCharCode(...new Uint8Array(s)));
}

/**
 * HTTP Headers 생성
 * @param {'GET' | 'POST'} method
 * @param {string} requestUri
 * @returns {Headers}
 */
async function getHeaders(method, requestUri) {
  if (!Boolean(method) || !Boolean(requestUri)) throw "invalid args";

  const nowTimestamp = Date.now();
  const signature = await sha256_hmac(
    API_SECRET,
    `${nowTimestamp}.${method}.${requestUri}`
  );

  return new Headers({
    "X-Timestamp": nowTimestamp,
    "X-API-KEY": API_KEY,
    "X-Customer": CUSTOMER_ID,
    "X-Signature": signature,
  });
}

/**
 *
 * @param {'GET' | 'POST'} method
 * @param {string} requestUri
 * @param {any} request_body
 * @returns {Primise<JSON>}
 */
export async function fetchData(method, requestUri, request_body) {
  const headers = await getHeaders(method, requestUri);
  const queryString =
    method === "GET" && Boolean(request_body)
      ? "?" +
        Object.entries(request_body)
          .map((e) => e.join("="))
          .join("&")
      : "";

  console.log(headers);
  console.log(queryString);
  const result = await fetch(`${BASE_URL}${requestUri}${queryString}`, {
    method,
    headers,
    body: method === "GET" ? null : JSON.stringify(request_body),
  });
  const payload = await result.json();

  console.log(payload);
  return payload;
}

/**
 * @typedef KeywordInfo
 * @property {number | '< 10'} relKeyword 키워드
 * @property {string} compIdx 키워드 광고 경쟁률
 * @property {number | '< 10'} monthlyPcQcCnt 월간 PC 검색 수
 * @property {number | '< 10'} monthlyMobileQcCnt 월간 Mobile 검색 수
 * @property {number} monthlyAvePcClkCnt 월간 평균 PC 클릭 수
 * @property {number} monthlyAveMobileClkCnt 월간 평균 Mobile 클릭 수
 * @property {number} monthlyAvePcCtr 월간 평균 PC 노출 대비 클릭률
 * @property {number} monthlyAveMobileCtr 월간 평균 Mobile 노출 대비 클릭률
 *
 * @example
 * {
 *     compIdx: "높음",
 *     monthlyAveMobileClkCnt: 380.3,
 *     monthlyAveMobileCtr: 2.84,
 *     monthlyAvePcClkCnt: 16,
 *     monthlyAvePcCtr: 0.42,
 *     monthlyMobileQcCnt: 14900,
 *     monthlyPcQcCnt: 4440,
 *     plAvgDepth: 15,
 *     relKeyword: "여주즙",
 * }
 */

const FEW = "< 10";
const FEW_LABEL = "10회 미만";
const COLUMNS = {
  relKeyword: "키워드",
  compIdx: "광고 경쟁률",
  monthlyQcCnt: "월 검색",
  monthlyPcQcCnt: "월 PC 검색",
  monthlyMobileQcCnt: "월 Mobile 검색",
  monthlyAveClkCnt: "월 평균 클릭",
  monthlyAvePcClkCnt: "월 평균 PC 클릭",
  monthlyAveMobileClkCnt: "월 평균 Mobile 클릭",
  // monthlyAvePcCtr: ' 월 평균 PC 노출 대비 클릭률',
  // monthlyAveMobileCtr: ' 월간 평균 Mobile 노출 대비 클릭률',
};

/**
 *
 * @param {KeywordInfo[]} keywordInfos
 * @returns {(KeywordInfo & { monthlyQcCnt: number, monthlyAveClkCnt: number })[]}
 */
export function parseKeywordInfos(keywordInfos) {
  return keywordInfos
    .map(parseKeywordInfo)
    .sort((v1, v2) => v2.monthlyQcCnt - v1.monthlyQcCnt);
}

/**
 *
 * @param {KeywordInfo} keywordInfo
 * @returns {KeywordInfo & { monthlyQcCnt: number, monthlyAveClkCnt: number }}
 */
export function parseKeywordInfo(keywordInfo) {
  if (keywordInfo.monthlyPcQcCnt === FEW)
    keywordInfo.monthlyPcQcCnt = FEW_LABEL;
  if (keywordInfo.monthlyMobileQcCnt === FEW)
    keywordInfo.monthlyMobileQcCnt = FEW_LABEL;

  return {
    ...keywordInfo,
    monthlyQcCnt: addForUsedFew(
      keywordInfo.monthlyPcQcCnt,
      keywordInfo.monthlyMobileQcCnt
    ),
    monthlyAveClkCnt: Math.round(
      keywordInfo.monthlyAvePcClkCnt + keywordInfo.monthlyAveMobileClkCnt
    ),
  };
}

/**
 *
 * @param {number | FEW_LABEL} var1
 * @param {number | FEW_LABEL} var2
 * @returns {number | FEW_LABEL}
 */
function addForUsedFew(var1, var2) {
  if (var1 === FEW_LABEL || var2 === FEW_LABEL) return FEW_LABEL;
  return var1 + var2;
}

/**
 * @returns {string}
 */
export async function getCurrentSearchKeyword() {
  const SEARCH_BASE_URL = "https://search.naver.com";

  // check current page info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // check domain
  if (tab.url.indexOf(SEARCH_BASE_URL) !== 0) return null;

  const params = new URLSearchParams(tab.url);
  const keyword = params.get("query");

  return Boolean(keyword) ? keyword : null;
}

/**
 *
 * @param {*} selector
 * @param {(KeywordInfo & { monthlyQcCnt: number, monthlyAveClkCnt: number })[]} keywordInfos
 */
export function renderParseKeywordInfos(selector, keywordInfos) {
  const wrapEl = document.querySelector(selector);

  let html = "";

  // render columns
  let rowHeaderHTML = '<div class="table-row table-row__header">';
  for (let col in COLUMNS) {
    rowHeaderHTML += `<div class="table-cell table-cell__${col} table-cell__column">${getColumnLabel(
      col
    )}</div>`;
  }
  rowHeaderHTML += "</div>";
  html += rowHeaderHTML;

  // render rows
  html += keywordInfos
    .map((keywordInfo, i) => {
      let rowHTML = '<div class="table-row">';

      // sort by column
      for (let col in COLUMNS) {
        rowHTML += `<div class="table-cell table-cell__${col}">${keywordInfo[col]}</div>`;
      }

      rowHTML += "</div>";

      return rowHTML;
    })
    .join("");

  wrapEl.innerHTML = html;
}

/**
 *
 * @param {string} key
 * @returns {string}
 */
function getColumnLabel(key) {
  const label = COLUMNS[key];

  return Boolean(label) ? label : "Error";
}
