// Build PDF + DOCX from documents/Pacific_Sunday_User_Manual.md.
//
// Both formats run through the same HTML intermediate. Pandoc's markdown
// reader treats inline <img> tags as raw HTML pass-through and skips
// embedding the referenced files, so we render markdown → HTML with marked
// first, then convert that HTML to both PDF (Playwright) and DOCX (pandoc).
// This way the screenshot images land inside word/media/ in the .docx.
//
// Outputs land next to the source markdown:
//   documents/Pacific_Sunday_User_Manual.pdf
//   documents/Pacific_Sunday_User_Manual.docx

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('@playwright/test');
const { marked } = require('marked');

const DOCS_DIR = path.resolve(__dirname, '..', '..', 'documents');
const SRC_MD   = path.join(DOCS_DIR, 'Pacific_Sunday_User_Manual.md');
const OUT_PDF  = path.join(DOCS_DIR, 'Pacific_Sunday_User_Manual.pdf');
const OUT_DOCX = path.join(DOCS_DIR, 'Pacific_Sunday_User_Manual.docx');
const PANDOC   = 'C:\\Users\\hp\\AppData\\Local\\Pandoc\\pandoc.exe';

// Render markdown to a self-contained HTML string. Reused for PDF + DOCX.
function renderHtml() {
  const md = fs.readFileSync(SRC_MD, 'utf8');
  // Marked passes through raw HTML (our <img> and <table> tags), so the
  // side-by-side screenshot tables in the manual render correctly.
  const bodyHtml = marked.parse(md);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Pacific Sunday — User Manual</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    line-height: 1.55;
    font-size: 11pt;
  }
  body { margin: 0; }
  h1 {
    color: #1e293b;
    border-bottom: 2px solid #E8C96A;
    padding-bottom: 6px;
    font-size: 22pt;
    margin-top: 0;
  }
  h2 {
    color: #1e293b;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 28pt;
    font-size: 16pt;
    page-break-after: avoid;
  }
  h3 {
    color: #334155;
    margin-top: 18pt;
    font-size: 13pt;
    page-break-after: avoid;
  }
  p, ul, ol { margin: 8pt 0; }
  li { margin: 3pt 0; }
  blockquote {
    border-left: 3px solid #E8C96A;
    background: #fef9e7;
    margin: 12pt 0;
    padding: 8pt 12pt;
    color: #475569;
    font-size: 10pt;
  }
  strong { color: #1e293b; }
  code, pre {
    font-family: "Consolas", "SF Mono", Menlo, monospace;
    font-size: 10pt;
  }
  code { background: #f1f5f9; padding: 1pt 4pt; border-radius: 3px; }
  pre { background: #f1f5f9; padding: 10pt; border-radius: 5px; }
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }
  table {
    margin: 12pt auto;
    border-collapse: separate;
    border-spacing: 12pt 0;
  }
  table td { vertical-align: top; padding: 0; }
  table img { margin-bottom: 6pt; }
  sub { font-size: 9pt; color: #64748b; }
  hr { border: none; border-top: 1px solid #cbd5e1; margin: 20pt 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// ───── PDF — print rendered HTML via headless Chromium ──────────────────
async function buildPdf(htmlPath) {
  console.log('[PDF] printing HTML → PDF');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.pdf({
    path: OUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  });
  await browser.close();
  console.log(`[PDF] wrote ${OUT_PDF}`);
}

// ───── DOCX — pandoc converts the SAME HTML we used for the PDF ─────────
// Feeding HTML (not markdown) to pandoc means it treats <img> tags as real
// image references and embeds them in word/media/. Reading the markdown
// directly skipped this because raw <img> tags became HTML pass-through.
function buildDocx(htmlPath) {
  console.log('[DOCX] pandoc converting HTML → DOCX');
  try {
    execFileSync(PANDOC, [
      '-f', 'html',
      '-t', 'docx',
      htmlPath,
      '-o', OUT_DOCX,
      '--resource-path=' + DOCS_DIR,
      '--standalone',
    ], { stdio: 'inherit' });
    console.log(`[DOCX] wrote ${OUT_DOCX}`);
  } catch (err) {
    console.error('[DOCX] pandoc failed:', err.message);
    process.exit(1);
  }
}

(async () => {
  console.log('[HTML] rendering markdown');
  const html = renderHtml();
  const tmpHtml = path.join(DOCS_DIR, '.manual-build.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  try {
    await buildPdf(tmpHtml);
    buildDocx(tmpHtml);
  } finally {
    fs.existsSync(tmpHtml) && fs.unlinkSync(tmpHtml);
  }
  console.log('\nDone.');
})().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
