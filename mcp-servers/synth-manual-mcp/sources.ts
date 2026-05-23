import fs from 'fs';
import path from 'path';

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  sourcesTried: string[];
  pdfLinksFound?: string[];
  error?: string;
}

const FETCH_OPTS: RequestInit = {
  redirect: 'follow',
  signal: AbortSignal.timeout(30000),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/pdf,*/*',
  },
};

// ---------------------------------------------------------------------------
// 1. Manufacturer support page URLs — these are stable landing pages, not
//    guesses at direct PDF paths. We fetch these pages and scrape for PDF links.
// ---------------------------------------------------------------------------

interface SupportPageConfig {
  /** Support/downloads page URL pattern */
  urls: (model: string, modelSlug: string, modelUnderscore: string) => string[];
  /** Optional direct PDF URL guesses (fast path) */
  directPdfs?: (model: string, modelSlug: string, modelUnderscore: string) => string[];
}

const MANUFACTURER_SUPPORT: Record<string, SupportPageConfig> = {
  behringer: {
    urls: (model, modelSlug) => [
      `https://www.behringer.com/product.html?modelCode=${modelSlug.toUpperCase()}`,
      `https://www.behringer.com/Categories/Behringer/Keyboards/Synthesizers-and-Samplers/${modelSlug.toUpperCase()}/p/${modelSlug.toUpperCase()}`,
    ],
    directPdfs: (_model, _slug, modelUnderscore) => [
      `https://mediadl.musictribe.com/media/PLM/data/docs/P0ACY/${modelUnderscore}_M_EN.pdf`,
      `https://mediadl.musictribe.com/media/PLM/data/docs/P0ACY/${modelUnderscore}_QSG_EN.pdf`,
    ],
  },
  'music tribe': {
    urls: (model, modelSlug) => MANUFACTURER_SUPPORT.behringer.urls(model, modelSlug),
    directPdfs: (model, slug, und) => MANUFACTURER_SUPPORT.behringer.directPdfs!(model, slug, und),
  },
  roland: {
    urls: (_model, modelSlug) => [
      `https://www.roland.com/global/products/${modelSlug}/support/`,
      `https://www.roland.com/global/support/by_product/${modelSlug}/updates_drivers/`,
      `https://www.roland.com/us/products/${modelSlug}/support/`,
    ],
    directPdfs: (_model, _slug, modelUnderscore) => [
      `https://static.roland.com/assets/media/pdf/${modelUnderscore}_e.pdf`,
      `https://static.roland.com/assets/media/pdf/${modelUnderscore}_eng.pdf`,
    ],
  },
  boss: {
    urls: (_model, modelSlug) => [
      `https://www.boss.info/global/products/${modelSlug}/support/`,
      `https://www.roland.com/global/products/${modelSlug}/support/`,
    ],
    directPdfs: (_model, _slug, modelUnderscore) => [
      `https://static.roland.com/assets/media/pdf/${modelUnderscore}_e.pdf`,
    ],
  },
  korg: {
    urls: (_model, modelSlug) => [
      `https://www.korg.com/us/support/download/product/0/1/${modelSlug}/`,
      `https://www.korg.com/us/products/synthesizers/${modelSlug}/`,
    ],
  },
  yamaha: {
    urls: (_model, modelSlug) => [
      `https://usa.yamaha.com/products/music_production/synthesizers/${modelSlug}/downloads.html`,
      `https://usa.yamaha.com/support/updates/${modelSlug}_downloads.html`,
    ],
  },
  moog: {
    urls: (_model, modelSlug) => [
      `https://www.moogmusic.com/products/${modelSlug}`,
    ],
    directPdfs: (_model, _slug, modelUnderscore) => [
      `https://api.moogmusic.com/sites/default/files/${modelUnderscore}_Manual.pdf`,
    ],
  },
  arturia: {
    urls: (_model, modelSlug) => [
      `https://www.arturia.com/products/${modelSlug}/resources`,
      `https://www.arturia.com/products/${modelSlug}/manual`,
    ],
  },
  novation: {
    urls: (model) => [
      `https://customer.novationmusic.com/en/support/downloads?brand=Novation&search=${encodeURIComponent(model)}`,
      `https://novationmusic.com/products/${model.replace(/\s+/g, '-').toLowerCase()}`,
    ],
  },
  sequential: {
    urls: (_model, modelSlug) => [
      `https://www.sequential.com/${modelSlug}/`,
    ],
    directPdfs: (_model, _slug, modelUnderscore) => [
      `https://www.sequential.com/wp-content/uploads/${modelUnderscore}_Operation_Manual.pdf`,
    ],
  },
  'dave smith': {
    urls: (_model, modelSlug) => MANUFACTURER_SUPPORT.sequential.urls(_model, modelSlug),
    directPdfs: (m, s, u) => MANUFACTURER_SUPPORT.sequential.directPdfs!(m, s, u),
  },
  nord: {
    urls: (_model, modelSlug) => [
      `https://www.nordkeyboards.com/products/${modelSlug}`,
      `https://www.nordkeyboards.com/downloads`,
    ],
  },
  clavia: {
    urls: (_model, modelSlug) => MANUFACTURER_SUPPORT.nord.urls(_model, modelSlug),
  },
  elektron: {
    urls: (_model, modelSlug) => [
      `https://www.elektron.se/products/${modelSlug}/`,
      `https://www.elektron.se/support/?product=${modelSlug}`,
    ],
  },
  akai: {
    urls: (_model, modelSlug) => [
      `https://www.akaipro.com/products/${modelSlug}`,
      `https://www.akaipro.com/${modelSlug}`,
    ],
  },
  'teenage engineering': {
    urls: (_model, modelSlug) => [
      `https://teenage.engineering/guides/${modelSlug}`,
      `https://teenage.engineering/products/${modelSlug}`,
    ],
  },
  access: {
    urls: (_model, modelSlug) => [
      `https://www.virus.info/downloads`,
    ],
  },
  waldorf: {
    urls: (_model, modelSlug) => [
      `https://waldorfmusic.com/products/${modelSlug}`,
    ],
  },
  'dave smith instruments': {
    urls: (_model, modelSlug) => MANUFACTURER_SUPPORT.sequential.urls(_model, modelSlug),
  },
  asm: {
    urls: (_model, modelSlug) => [
      `https://www.asmsynths.com/${modelSlug}`,
    ],
  },
};

// ---------------------------------------------------------------------------
// 2. Aggregator / archive search URLs
// ---------------------------------------------------------------------------

function getAggregatorUrls(manufacturer: string, model: string): string[] {
  const query = encodeURIComponent(`${manufacturer} ${model} manual`);
  const modelSlug = model.replace(/\s+/g, '_').toLowerCase();
  const mfr = manufacturer.toLowerCase();

  return [
    `https://www.synthmanuals.com/manuals/${mfr}/${modelSlug}/`,
    `https://www.manualslib.com/manual-search/${encodeURIComponent(`${manufacturer} ${model}`)}/`,
    `https://www.manualsonline.com/search?q=${encodeURIComponent(`${manufacturer} ${model}`)}`,
    `https://www.vintagesynth.com/search/node/${encodeURIComponent(`${manufacturer} ${model}`)}`,
    `https://archive.org/search?query=${query}&and[]=mediatype%3A%22texts%22`,
  ];
}

// ---------------------------------------------------------------------------
// 3. PDF link extraction from HTML pages
// ---------------------------------------------------------------------------

/**
 * Fetch an HTML page and extract all PDF links from it.
 * Looks for <a href="...pdf">, data-download-url, and common JS download patterns.
 */
async function extractPdfLinksFromPage(pageUrl: string): Promise<string[]> {
  try {
    const res = await fetch(pageUrl, FETCH_OPTS);
    if (!res.ok) return [];

    const contentType = res.headers.get('content-type') ?? '';

    // If the URL itself returns a PDF, that's our answer
    if (contentType.includes('pdf')) {
      return [pageUrl];
    }

    if (!contentType.includes('html') && !contentType.includes('text')) return [];

    const html = await res.text();
    const pdfLinks: string[] = [];

    // Match href="...pdf" patterns (case-insensitive)
    const hrefPattern = /(?:href|src|data-url|data-download-url|data-href|content)\s*=\s*["']([^"']*\.pdf(?:\?[^"']*)?)["']/gi;
    let match;
    while ((match = hrefPattern.exec(html)) !== null) {
      pdfLinks.push(match[1]);
    }

    // Match window.open or location.href patterns pointing to PDFs
    const jsPattern = /(?:window\.open|location\.href|window\.location)\s*[=(]\s*["']([^"']*\.pdf(?:\?[^"']*)?)["']/gi;
    while ((match = jsPattern.exec(html)) !== null) {
      pdfLinks.push(match[1]);
    }

    // Resolve relative URLs to absolute
    const base = new URL(pageUrl);
    return [...new Set(pdfLinks.map((link) => {
      try {
        return new URL(link, base).href;
      } catch {
        return null;
      }
    }).filter((u): u is string => u !== null))];
  } catch {
    return [];
  }
}

/**
 * Score a PDF link by how relevant it is to the target model.
 * Higher = more likely to be the right manual.
 */
function scorePdfLink(url: string, manufacturer: string, model: string): number {
  const lower = url.toLowerCase();
  const modelWords = model.toLowerCase().split(/\s+/);
  let score = 0;

  // Contains model name words
  for (const word of modelWords) {
    if (lower.includes(word)) score += 3;
  }

  // Contains "manual" or "user guide"
  if (lower.includes('manual')) score += 5;
  if (lower.includes('user_guide') || lower.includes('user-guide') || lower.includes('userguide')) score += 5;
  if (lower.includes('owner')) score += 3;

  // English language indicators
  if (lower.includes('_en') || lower.includes('-en') || lower.includes('_eng') || lower.includes('english')) score += 2;
  if (lower.includes('_e.pdf')) score += 2;

  // Penalty for quick start guides (we want the full manual)
  if (lower.includes('quick') || lower.includes('qsg') || lower.includes('start_guide')) score -= 3;

  // Penalty for non-English
  if (lower.includes('_de.pdf') || lower.includes('_fr.pdf') || lower.includes('_ja.pdf') || lower.includes('_es.pdf')) score -= 5;

  // Penalty for firmware/driver/software downloads
  if (lower.includes('firmware') || lower.includes('driver') || lower.includes('update')) score -= 8;

  return score;
}

// ---------------------------------------------------------------------------
// 4. PDF download with validation
// ---------------------------------------------------------------------------

async function tryDownloadPdf(
  url: string,
  outputDir: string,
  filename: string
): Promise<string | null> {
  try {
    const res = await fetch(url, FETCH_OPTS);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    const buffer = Buffer.from(await res.arrayBuffer());

    // Validate PDF magic bytes (%PDF-)
    if (buffer.length < 5) return null;
    const magic = buffer.toString('utf-8', 0, 5);
    if (magic !== '%PDF-') {
      if (!contentType.includes('pdf')) return null;
    }

    // Reject suspiciously small files (< 10KB is probably an error page)
    if (buffer.length < 10240) return null;

    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. Main search orchestration
// ---------------------------------------------------------------------------

/**
 * Search for and download a device manual.
 *
 * Strategy:
 * 1. Try direct PDF URLs (fast path — known CDN patterns)
 * 2. Crawl manufacturer support pages for PDF links
 * 3. Crawl aggregator sites for PDF links
 * 4. Return all found links so Claude can try alternatives
 */
export async function searchAndDownload(
  manufacturer: string,
  model: string,
  outputDir: string
): Promise<DownloadResult> {
  const sourcesTried: string[] = [];
  const allPdfLinksFound: string[] = [];
  const filename = `${manufacturer}-${model}-manual.pdf`
    .replace(/\s+/g, '-')
    .toLowerCase();

  const mfr = manufacturer.toLowerCase();
  const modelSlug = model.replace(/\s+/g, '-').toLowerCase();
  const modelUnderscore = model.replace(/\s+/g, '_');
  const config = MANUFACTURER_SUPPORT[mfr];

  // --- Phase 1: Try direct PDF URLs (fast path) ---
  if (config?.directPdfs) {
    const directUrls = config.directPdfs(model, modelSlug, modelUnderscore);
    for (const url of directUrls) {
      sourcesTried.push(url);
      const result = await tryDownloadPdf(url, outputDir, filename);
      if (result) {
        return { success: true, filePath: result, sourcesTried };
      }
    }
  }

  // --- Phase 2: Crawl manufacturer support pages ---
  if (config) {
    const supportUrls = config.urls(model, modelSlug, modelUnderscore);
    for (const pageUrl of supportUrls) {
      sourcesTried.push(pageUrl);
      const pdfLinks = await extractPdfLinksFromPage(pageUrl);

      if (pdfLinks.length > 0) {
        allPdfLinksFound.push(...pdfLinks);

        // Score and sort by relevance
        const scored = pdfLinks
          .map((link) => ({ link, score: scorePdfLink(link, manufacturer, model) }))
          .sort((a, b) => b.score - a.score);

        // Try the top 3 most relevant PDF links
        for (const { link } of scored.slice(0, 3)) {
          sourcesTried.push(link);
          const result = await tryDownloadPdf(link, outputDir, filename);
          if (result) {
            return { success: true, filePath: result, sourcesTried, pdfLinksFound: allPdfLinksFound };
          }
        }
      }
    }
  }

  // --- Phase 3: Crawl aggregator sites ---
  const aggregatorUrls = getAggregatorUrls(manufacturer, model);
  for (const pageUrl of aggregatorUrls) {
    sourcesTried.push(pageUrl);
    const pdfLinks = await extractPdfLinksFromPage(pageUrl);

    if (pdfLinks.length > 0) {
      allPdfLinksFound.push(...pdfLinks);

      const scored = pdfLinks
        .map((link) => ({ link, score: scorePdfLink(link, manufacturer, model) }))
        .sort((a, b) => b.score - a.score);

      for (const { link } of scored.slice(0, 2)) {
        sourcesTried.push(link);
        const result = await tryDownloadPdf(link, outputDir, filename);
        if (result) {
          return { success: true, filePath: result, sourcesTried, pdfLinksFound: allPdfLinksFound };
        }
      }
    }
  }

  // --- Phase 4: Return all findings for Claude to try ---
  return {
    success: false,
    sourcesTried,
    pdfLinksFound: allPdfLinksFound,
    error: allPdfLinksFound.length > 0
      ? `Found ${allPdfLinksFound.length} PDF links but none were downloadable as valid PDFs. Try these with download_pdf_from_url or WebFetch: ${allPdfLinksFound.slice(0, 10).join(', ')}`
      : `Could not find manual for ${manufacturer} ${model}. Try WebSearch for "${manufacturer} ${model} manual PDF" and use download_pdf_from_url with any direct PDF links found.`,
  };
}

/**
 * Download a PDF from a specific URL.
 */
export async function downloadFromUrl(
  url: string,
  outputDir: string,
  filename: string
): Promise<DownloadResult> {
  const result = await tryDownloadPdf(url, outputDir, filename);
  if (result) {
    return { success: true, filePath: result, sourcesTried: [url] };
  }
  return {
    success: false,
    sourcesTried: [url],
    error: `Failed to download PDF from ${url} — either not found, not a valid PDF, too small (<10KB), or timed out.`,
  };
}
