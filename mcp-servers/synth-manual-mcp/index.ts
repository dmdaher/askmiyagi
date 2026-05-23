#!/usr/bin/env npx tsx
/**
 * Synth Manual MCP Server
 *
 * Provides tools for searching and downloading synthesizer/music equipment manuals.
 * Used by the pipeline runner's preflight phase to auto-download manuals.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { searchAndDownload, downloadFromUrl } from './sources.js';

const server = new McpServer({
  name: 'synth-manual-mcp',
  version: '1.0.0',
});

server.tool(
  'download_device_manual',
  'Search for and download a synthesizer/music equipment manual PDF. Crawls manufacturer support pages for PDF links, tries aggregator sites (SynthManuals, ManualsLib, archive.org), and scores results by relevance. Returns pdfLinksFound even on failure so you can try them with download_pdf_from_url.',
  {
    manufacturer: z.string().describe('Equipment manufacturer (e.g. Behringer, Roland, Korg, Moog)'),
    model: z.string().describe('Equipment model name (e.g. DeepMind 12, JD-Xi, Minilogue)'),
    outputDir: z.string().describe('Directory path where the PDF should be saved'),
  },
  async ({ manufacturer, model, outputDir }) => {
    const result = await searchAndDownload(manufacturer, model, outputDir);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

server.tool(
  'download_pdf_from_url',
  'Download a PDF from a specific URL. Use this after finding a manual URL via web search.',
  {
    url: z.string().url().describe('Direct URL to the PDF file'),
    outputDir: z.string().describe('Directory path where the PDF should be saved'),
    filename: z.string().describe('Filename for the saved PDF (e.g. "behringer-deepmind-12-manual.pdf")'),
  },
  async ({ url, outputDir, filename }) => {
    const result = await downloadFromUrl(url, outputDir, filename);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
