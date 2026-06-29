const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function extractHeaders(html) {
  return Array.from(html.matchAll(/<th>(.*?)<\/th>/g), (match) => match[1].trim());
}

test('holdings table puts score, action, and details before editable holding inputs', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const headers = extractHeaders(html);

  assert.deepEqual(headers.slice(0, 6), ['종목', '점수', '액션', '내용', '코드', '수량']);
});

test('Kakao sharing workflow exposes entry-link and result-share actions', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.match(html, /id="copyEntryLinkButton"/);
  assert.match(html, /id="shareResultButton"/);
  assert.match(html, /id="sharePreview"/);
});
