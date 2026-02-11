#!/usr/bin/env node

/**
 * send-drafts.js — Kinetic Draft Sender
 *
 * Reads markdown blog post drafts, converts them to webhook-ready JSON payloads,
 * and POSTs them to the Oregon Exterior Experts admin dashboard.
 *
 * Usage:
 *   node scripts/send-drafts.js --next              Send the next unsent wave
 *   node scripts/send-drafts.js --wave 1            Send a specific wave
 *   node scripts/send-drafts.js --next --dry-run    Preview payloads without POSTing
 *   node scripts/send-drafts.js --wave 1 --force    Re-send a completed wave
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const matter = require('gray-matter');
const { Marked } = require('marked');
const katex = require('katex');
const axios = require('axios');

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DRAFTS_BASE = path.join(PROJECT_ROOT, 'blog', 'drafts', 'oregonexterior-blog');
const WAVE_MANIFEST_PATH = path.join(PROJECT_ROOT, 'blog', 'data', 'wave-manifest.json');
const ROLLOUT_STATE_PATH = path.join(PROJECT_ROOT, 'blog', 'data', 'rollout-state.json');

const API_ENDPOINT = 'https://api.oregonexteriorexperts.com/api/external/kinetic-draft';
const CANONICAL_BASE = 'https://oregonexteriorexperts.com/blog/post.html?slug=';
const WORDS_PER_MINUTE = 225;
const BATCH_SIZE = 18;
const DELAY_BETWEEN_POSTS_MS = 2000;
const DELAY_BETWEEN_BATCHES_MS = 3600000; // 1 hour

// Cluster ID map for the admin backend (matches DB CHECK constraint)
const CLUSTER_ID_MAP = {
  1: 'moss-algae-prevention',
  2: 'gutter-drainage-foundation',
  3: 'pnw-siding-durability',
  4: 'localized-cost-roi',
  5: 'rain-ready-roofing',
  6: 'gutter-guard-skeptic',
  7: 'home-exterior-health',
  8: 'residential-exterior-painting'
};

// Cluster name map for meta_keywords context
const CLUSTER_CONTEXT = {
  1: 'moss prevention, algae removal, roof biology, PNW roof maintenance',
  2: 'gutter drainage, foundation defense, downspout, water management',
  3: 'siding durability, PNW siding, exterior cladding, fiber cement',
  4: 'exterior cost, ROI, home improvement value, cost guide',
  5: 'roofing, rain ready, Oregon roofing, roof repair',
  6: 'gutter guards, gutter protection, leaf guards, gutter skeptic',
  7: 'home exterior, inspection, exterior health, maintenance checklist',
  8: 'exterior painting, residential painting, house painting, paint services'
};

// ──────────────────────────────────────────────
// CLI Argument Parsing
// ──────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { next: false, wave: null, dryRun: false, force: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--next':
        opts.next = true;
        break;
      case '--wave':
        opts.wave = parseInt(args[++i], 10);
        if (isNaN(opts.wave)) {
          console.error('Error: --wave requires a number (e.g., --wave 1)');
          process.exit(1);
        }
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--force':
        opts.force = true;
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  if (!opts.next && opts.wave === null) {
    console.error('Error: must specify --next or --wave <N>');
    console.error('Usage:');
    console.error('  node scripts/send-drafts.js --next');
    console.error('  node scripts/send-drafts.js --wave 1');
    console.error('  node scripts/send-drafts.js --next --dry-run');
    process.exit(1);
  }

  return opts;
}

// ──────────────────────────────────────────────
// Environment Validation
// ──────────────────────────────────────────────

function validateEnv(dryRun) {
  const authToken = process.env.KINETIC_AUTH_TOKEN;
  const authorId = process.env.KINETIC_AUTHOR_ID;

  if (!dryRun && !authToken) {
    console.error('Error: KINETIC_AUTH_TOKEN is not set in .env');
    process.exit(1);
  }

  if (!authorId) {
    console.error('Error: KINETIC_AUTHOR_ID is not set in .env');
    process.exit(1);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(authorId)) {
    console.error(`Error: KINETIC_AUTHOR_ID is not a valid UUID: ${authorId}`);
    process.exit(1);
  }

  return { authToken, authorId };
}

// ──────────────────────────────────────────────
// Wave Manifest & Rollout State
// ──────────────────────────────────────────────

function loadWaveManifest() {
  if (!fs.existsSync(WAVE_MANIFEST_PATH)) {
    console.error(`Error: wave manifest not found at ${WAVE_MANIFEST_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(WAVE_MANIFEST_PATH, 'utf-8'));
}

function loadRolloutState() {
  if (!fs.existsSync(ROLLOUT_STATE_PATH)) {
    return { last_completed_wave: 0, waves: {} };
  }
  return JSON.parse(fs.readFileSync(ROLLOUT_STATE_PATH, 'utf-8'));
}

function saveRolloutState(state) {
  fs.writeFileSync(ROLLOUT_STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

function resolveWave(manifest, state, opts) {
  if (opts.next) {
    // Find the lowest wave number not yet completed
    const completedWaves = new Set(
      Object.keys(state.waves).map(k => parseInt(k, 10))
    );
    const nextEntry = manifest.find(e => !completedWaves.has(e.wave));
    if (!nextEntry) {
      console.log('All waves in the manifest have been completed.');
      process.exit(0);
    }
    return nextEntry;
  }

  // --wave N
  const entry = manifest.find(e => e.wave === opts.wave);
  if (!entry) {
    console.error(`Error: wave ${opts.wave} not found in wave-manifest.json`);
    process.exit(1);
  }

  const padded = String(entry.wave).padStart(3, '0');
  if (state.waves[padded] && !opts.force) {
    console.error(`Error: wave ${padded} was already completed on ${state.waves[padded].completed_at}`);
    console.error('Use --force to re-send.');
    process.exit(1);
  }

  return entry;
}

// ──────────────────────────────────────────────
// Markdown → HTML Conversion
// ──────────────────────────────────────────────

function latexToReadable(latex) {
  // Convert LaTeX notation to readable plain text
  return latex
    .replace(/\\text\{([^}]*)\}/g, '$1')       // \text{annual} → annual
    .replace(/\\approx/g, '≈')                  // \approx → ≈
    .replace(/\\times/g, '×')                    // \times → ×
    .replace(/\\div/g, '÷')                      // \div → ÷
    .replace(/\\leq/g, '≤')                      // \leq → ≤
    .replace(/\\geq/g, '≥')                      // \geq → ≥
    .replace(/\\neq/g, '≠')                      // \neq → ≠
    .replace(/\\pm/g, '±')                        // \pm → ±
    .replace(/\\infty/g, '∞')                    // \infty → ∞
    .replace(/\\sum/g, 'Σ')                      // \sum → Σ
    .replace(/\\rho/g, 'ρ')                      // \rho → ρ
    .replace(/\\pi/g, 'π')                        // \pi → π
    .replace(/\\Delta/g, 'Δ')                    // \Delta → Δ
    .replace(/\\Rightarrow/g, '⇒')              // \Rightarrow → ⇒
    .replace(/\\rightarrow/g, '→')              // \rightarrow → →
    .replace(/\\cdot/g, '·')                      // \cdot → ·
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1 / $2)') // \frac{a}{b} → (a / b)
    .replace(/\{([^}]*)\}/g, '$1')               // {,} → , and other braces
    .replace(/_([A-Za-z0-9])/g, '_$1')           // keep simple subscripts readable
    .replace(/_\{([^}]*)\}/g, '_$1')             // V_{annual} → V_annual (already handled by brace strip)
    .replace(/\^([A-Za-z0-9])/g, '^$1')          // keep simple superscripts
    .replace(/\^\{([^}]*)\}/g, '^($1)')          // x^{2n} → x^(2n)
    .replace(/\\\s/g, ' ')                        // escaped spaces
    .replace(/\s+/g, ' ')                         // collapse whitespace
    .trim();
}

function renderLatex(text) {
  // Replace display math $$...$$ with a styled blockquote (TipTap-compatible)
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const readable = latexToReadable(latex.trim());
    return `<pre><code>${readable}</code></pre>`;
  });

  // Replace inline math $...$ (but not $$ and not dollar amounts like $350)
  // Negative lookbehind/ahead for $ avoids $$ boundaries.
  // Negative lookahead for digit after opening $ skips currency like $350.
  text = text.replace(/(?<!\$)\$(?!\$)(?!\d)(.*?)(?<!\$)\$(?!\$)/g, (match, latex) => {
    if (!latex.trim()) return match;
    const readable = latexToReadable(latex.trim());
    return `<code>${readable}</code>`;
  });

  return text;
}

function stripH1(markdown) {
  // Remove the first # Title line (only the first H1)
  return markdown.replace(/^# .+$/m, '').trim();
}

function stripImageBlocks(html) {
  // Remove <p><strong>Image: ... Alt text: "..."</strong></p> blocks
  return html.replace(/<p><strong>Image:[\s\S]*?<\/strong><\/p>/gi, '').trim();
}

function convertMarkdownToHtml(markdownBody) {
  // 1. Strip the H1 line
  let body = stripH1(markdownBody);

  // 2. Convert LaTeX to KaTeX HTML before Markdown parsing
  body = renderLatex(body);

  // 3. Convert Markdown to HTML
  //    Custom table renderer: TipTap's ProseMirror schema strips <table>, <div>,
  //    and any element outside its whitelist. Convert markdown tables into a
  //    structured list layout using only TipTap-safe elements:
  //    <p>, <strong>, <ul>, <li>, <br>
  const marked = new Marked();
  marked.use({
    renderer: {
      table(token) {
        // Render header labels (skip first column — it becomes the row label)
        const headerLabels = token.header.map(cell =>
          this.parser.parseInline(cell.tokens)
        );

        let html = '';

        for (const row of token.rows) {
          const cells = row.map(cell => this.parser.parseInline(cell.tokens));

          // First cell is the row label, remaining cells pair with headers.
          // If the cell markdown already rendered as <strong>, don't double-wrap.
          const rowLabel = cells[0] || '';
          const alreadyBold = rowLabel.startsWith('<strong>') && rowLabel.endsWith('</strong>');
          html += alreadyBold
            ? `<p>${rowLabel}</p>\n`
            : `<p><strong>${rowLabel}</strong></p>\n`;

          if (cells.length > 1) {
            html += '<ul>\n';
            for (let i = 1; i < cells.length; i++) {
              const header = headerLabels[i] || '';
              html += `<li>${header}: ${cells[i]}</li>\n`;
            }
            html += '</ul>\n';
          }
        }

        return html;
      }
    }
  });
  let html = marked.parse(body);

  // 4. Strip image placeholder blocks
  html = stripImageBlocks(html);

  return html.trim();
}

// ──────────────────────────────────────────────
// Field Derivation
// ──────────────────────────────────────────────

function deriveMetaDescription(summary) {
  if (!summary) return '';
  if (summary.length <= 160) return summary;
  // Truncate at word boundary
  const truncated = summary.substring(0, 160);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 120 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

function deriveMetaKeywords(primaryKeyword, cluster) {
  const context = CLUSTER_CONTEXT[cluster] || '';
  const parts = [primaryKeyword.toLowerCase()];
  if (context) {
    parts.push(context);
  }
  parts.push('Oregon exterior', 'Portland');
  return parts.join(', ');
}

function deriveReadingTime(text) {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}

function deriveKineticId(wave, cluster, postType, slug) {
  const paddedWave = String(wave).padStart(3, '0');
  return `kinetic-${paddedWave}-c${cluster}-${postType}-${slug}`;
}

// ──────────────────────────────────────────────
// Frontmatter Validation
// ──────────────────────────────────────────────

const REQUIRED_FIELDS = ['cluster', 'post_type', 'slug', 'h1_title'];

function validateFrontmatter(data, filename) {
  const missing = REQUIRED_FIELDS.filter(f => !data[f] && data[f] !== 0);
  if (missing.length > 0) {
    return `Missing required frontmatter fields: ${missing.join(', ')}`;
  }
  if (typeof data.cluster !== 'number' || data.cluster < 1 || data.cluster > 8) {
    return `Invalid cluster value: ${data.cluster} (must be 1-8)`;
  }
  if (!['pillar', 'spoke'].includes(data.post_type)) {
    return `Invalid post_type: ${data.post_type} (must be "pillar" or "spoke")`;
  }
  return null;
}

// ──────────────────────────────────────────────
// Payload Assembly
// ──────────────────────────────────────────────

function assemblePayload(frontmatter, markdownBody, wave, authorId) {
  const html = convertMarkdownToHtml(markdownBody);

  return {
    title: frontmatter.h1_title,
    slug: frontmatter.slug,
    cluster_id: CLUSTER_ID_MAP[frontmatter.cluster],
    content: html,
    excerpt: frontmatter.one_sentence_summary || '',
    meta_description: deriveMetaDescription(frontmatter.one_sentence_summary),
    meta_keywords: deriveMetaKeywords(frontmatter.primary_keyword, frontmatter.cluster),
    canonical_url: `${CANONICAL_BASE}${frontmatter.slug}`,
    reading_time: deriveReadingTime(markdownBody),
    kinetic_id: deriveKineticId(wave, frontmatter.cluster, frontmatter.post_type, frontmatter.slug),
    featured_image_url: '',
    featured_image_alt: '',
    author_id: authorId,
    content_role: frontmatter.post_type
  };
}

// ──────────────────────────────────────────────
// HTTP Sender
// ──────────────────────────────────────────────

async function sendPayload(payload, authToken) {
  const response = await axios.post(API_ENDPOINT, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-KINETIC-AUTH': authToken
    },
    timeout: 30000
  });
  return response;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  const { authToken, authorId } = validateEnv(opts.dryRun);

  // Load manifest and state
  const manifest = loadWaveManifest();
  const state = loadRolloutState();

  // Resolve wave
  const waveEntry = resolveWave(manifest, state, opts);
  const waveNum = waveEntry.wave;
  const paddedWave = String(waveNum).padStart(3, '0');
  const waveDir = path.join(DRAFTS_BASE, waveEntry.dir);

  console.log(`\n=== Kinetic Draft Sender ===`);
  console.log(`Wave:      ${paddedWave}`);
  console.log(`Phase:     ${waveEntry.phase}`);
  console.log(`Directory: ${waveEntry.dir}`);
  console.log(`Mode:      ${opts.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Verify directory exists
  if (!fs.existsSync(waveDir)) {
    console.error(`Error: wave directory not found: ${waveDir}`);
    process.exit(1);
  }

  // Glob markdown files
  const pattern = path.join(waveDir, '*.md').replace(/\\/g, '/');
  const files = await glob(pattern);

  if (files.length === 0) {
    console.error(`Error: no .md files found in ${waveDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} markdown file(s)\n`);

  // Process each file
  const results = { sent: [], failed: [] };

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const filename = path.basename(filePath);

    console.log(`[${i + 1}/${files.length}] ${filename}`);

    // Parse frontmatter + body
    let parsed;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      parsed = matter(raw);
    } catch (err) {
      console.log(`  SKIP — failed to parse file: ${err.message}`);
      results.failed.push({ file: filename, error: `Parse error: ${err.message}` });
      continue;
    }

    const frontmatter = parsed.data;
    const body = parsed.content;

    // Validate frontmatter
    const validationError = validateFrontmatter(frontmatter, filename);
    if (validationError) {
      console.log(`  SKIP — ${validationError}`);
      results.failed.push({ file: filename, error: validationError });
      continue;
    }

    // Assemble payload
    let payload;
    try {
      payload = assemblePayload(frontmatter, body, waveNum, authorId);
    } catch (err) {
      console.log(`  SKIP — payload assembly failed: ${err.message}`);
      results.failed.push({ file: filename, error: `Assembly error: ${err.message}` });
      continue;
    }

    // Dry run: print and continue
    if (opts.dryRun) {
      console.log(`  kinetic_id: ${payload.kinetic_id}`);
      console.log(`  title:      ${payload.title}`);
      console.log(`  slug:       ${payload.slug}`);
      console.log(`  cluster_id: ${payload.cluster_id}`);
      console.log(`  content_role: ${payload.content_role}`);
      console.log(`  reading_time: ${payload.reading_time} min`);
      console.log(`  meta_description: ${payload.meta_description}`);
      console.log(`  content length: ${payload.content.length} chars`);
      console.log(`  OK (dry run)\n`);
      results.sent.push({ file: filename, kinetic_id: payload.kinetic_id });
      continue;
    }

    // POST to API
    try {
      const response = await sendPayload(payload, authToken);
      console.log(`  OK — ${response.status} ${response.statusText}`);
      if (response.data && response.data.post) {
        console.log(`  DB ID: ${response.data.post.id}`);
      }
      results.sent.push({ file: filename, kinetic_id: payload.kinetic_id });
    } catch (err) {
      const status = err.response?.status || 'N/A';
      const msg = err.response?.data?.error || err.message;
      console.log(`  FAIL — ${status}: ${msg}`);
      results.failed.push({ file: filename, error: `${status}: ${msg}` });
    }

    // Rate limiting: delay between posts
    if (i < files.length - 1) {
      // Check if we need to pause for rate limit
      const postsSentSoFar = results.sent.length;
      if (postsSentSoFar > 0 && postsSentSoFar % BATCH_SIZE === 0) {
        console.log(`\n--- Rate limit: sent ${BATCH_SIZE} posts. Pausing 1 hour... ---\n`);
        await delay(DELAY_BETWEEN_BATCHES_MS);
      } else {
        await delay(DELAY_BETWEEN_POSTS_MS);
      }
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Sent:    ${results.sent.length}`);
  console.log(`Failed:  ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed files:');
    for (const f of results.failed) {
      console.log(`  - ${f.file}: ${f.error}`);
    }
  }

  // Write rollout state (skip for dry runs)
  if (!opts.dryRun) {
    state.last_completed_wave = Math.max(state.last_completed_wave || 0, waveNum);
    state.waves[paddedWave] = {
      dir: waveEntry.dir,
      posts_sent: results.sent.length,
      posts_failed: results.failed.length,
      failed_files: results.failed.map(f => f.file),
      completed_at: new Date().toISOString()
    };
    saveRolloutState(state);
    console.log(`\nRollout state saved to ${ROLLOUT_STATE_PATH}`);
  }

  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
