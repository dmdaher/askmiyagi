import fs from 'fs';
import path from 'path';

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  sourcesTried: string[];
  error?: string;
}

/**
 * Known URL patterns for major synthesizer/music equipment manufacturers.
 * Returns candidate direct PDF URLs to try.
 */
function getManufacturerUrls(manufacturer: string, model: string): string[] {
  const mfr = manufacturer.toLowerCase();
  const modelSlug = model.replace(/\s+/g, '-').toLowerCase();
  const modelUnderscore = model.replace(/\s+/g, '_');

  const urls: string[] = [];

  switch (mfr) {
    case 'behringer':
    case 'music tribe':
      urls.push(
        `https://mediadl.musictribe.com/media/PLM/data/docs/P0ACY/${modelUnderscore}_M_EN.pdf`,
        `https://mediadl.musictribe.com/media/PLM/data/docs/P0ACY/${modelUnderscore}_QSG_EN.pdf`,
      );
      break;
    case 'roland':
      urls.push(
        `https://static.roland.com/assets/media/pdf/${modelUnderscore}_e.pdf`,
        `https://static.roland.com/assets/media/pdf/${modelUnderscore}_eng.pdf`,
      );
      break;
    case 'korg':
      urls.push(
        `https://www.korg.com/us/support/download/manual/0/1/${modelSlug}/`,
      );
      break;
    case 'arturia':
      urls.push(
        `https://www.arturia.com/products/${modelSlug}/manual`,
      );
      break;
    case 'novation':
      urls.push(
        `https://customer.novationmusic.com/en/support/downloads?brand=Novation&product_by_type=702&product_by_range=702`,
      );
      break;
    case 'sequential':
    case 'dave smith':
      urls.push(
        `https://www.sequential.com/wp-content/uploads/${modelUnderscore}_Operation_Manual.pdf`,
      );
      break;
    case 'moog':
      urls.push(
        `https://api.moogmusic.com/sites/default/files/${modelUnderscore}_Manual.pdf`,
      );
      break;
    case 'yamaha':
      urls.push(
        `https://download.yamaha.com/api/asset/file/?language=en&site=countrysite-master.prod.yamaha.cloud&asset_id=${modelSlug}_en_om`,
      );
      break;
    case 'boss':
      urls.push(
        `https://static.roland.com/assets/media/pdf/${modelUnderscore}_e.pdf`,
      );
      break;
    case 'nord':
    case 'clavia':
      urls.push(
        `https://www.nordkeyboards.com/sites/default/files/files/downloads/${modelSlug}/${modelUnderscore}-English-User-Manual-v1.x.pdf`,
      );
      break;
    case 'elektron':
      urls.push(
        `https://www.elektron.se/wp-content/uploads/${modelUnderscore}_user_manual.pdf`,
      );
      break;
    case 'teenage engineering':
      urls.push(
        `https://teenage.engineering/guides/${modelSlug}`,
      );
      break;
    case 'akai':
      urls.push(
        `https://www.akaipro.com/amfile/file/download/file/${modelSlug}-user-guide.pdf`,
      );
      break;
  }

  return urls;
}

/**
 * Get aggregator site search URLs for a given manufacturer + model.
 */
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

/**
 * Try to download a PDF from a URL. Validates the response is actually a PDF.
 */
async function tryDownloadPdf(
  url: string,
  outputDir: string,
  filename: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    const buffer = Buffer.from(await res.arrayBuffer());

    // Validate PDF magic bytes (%PDF-)
    if (buffer.length < 5) return null;
    const magic = buffer.toString('utf-8', 0, 5);
    if (magic !== '%PDF-') {
      // Not a PDF — might be an HTML page or redirect
      if (!contentType.includes('pdf')) return null;
    }

    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch {
    return null;
  }
}

/**
 * Search for and download a device manual from known sources.
 */
export async function searchAndDownload(
  manufacturer: string,
  model: string,
  outputDir: string
): Promise<DownloadResult> {
  const sourcesTried: string[] = [];
  const filename = `${manufacturer}-${model}-manual.pdf`
    .replace(/\s+/g, '-')
    .toLowerCase();

  // 1. Try manufacturer-specific direct URLs
  const mfrUrls = getManufacturerUrls(manufacturer, model);
  for (const url of mfrUrls) {
    sourcesTried.push(url);
    const result = await tryDownloadPdf(url, outputDir, filename);
    if (result) {
      return { success: true, filePath: result, sourcesTried };
    }
  }

  // 2. Try aggregator sites (these usually return HTML pages, not direct PDFs)
  // We record them as sources tried; Claude can visit them with WebFetch if needed
  const aggregatorUrls = getAggregatorUrls(manufacturer, model);
  sourcesTried.push(...aggregatorUrls);

  return {
    success: false,
    sourcesTried,
    error: `Could not find a direct PDF download for ${manufacturer} ${model}. Aggregator URLs listed in sourcesTried may have the manual — try visiting them with WebFetch to find a PDF link.`,
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
    error: `Failed to download PDF from ${url} — either not found, not a valid PDF, or timed out.`,
  };
}
