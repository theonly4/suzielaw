import type { AnyToolDefinition } from '@teamsuzie/agent-loop';

const INFOLEG_BASE = 'https://servicios.infoleg.gob.ar/infolegInternet';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TEXT_CHARS = 20_000;

// -- Helpers ------------------------------------------------------------------

/** Fetch a page from Infoleg and decode from windows-1252 to UTF-8 string. */
async function fetchInfoleg(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Infoleg ${response.status}: ${text.slice(0, 300)}`);
  }
  const buf = await response.arrayBuffer();
  return new TextDecoder('windows-1252').decode(buf);
}

/** Extract JSESSIONID cookie from Set-Cookie headers. */
function extractSessionCookie(response: Response): string | undefined {
  // Node 20+ supports getSetCookie()
  const cookies = (response.headers as any).getSetCookie?.() as string[] | undefined;
  if (cookies) {
    for (const c of cookies) {
      const match = c.match(/JSESSIONID=([^;]+)/);
      if (match) return match[1];
    }
  }
  // Fallback: parse combined header
  const combined = response.headers.get('set-cookie') ?? '';
  const match = combined.match(/JSESSIONID=([^;]+)/);
  return match?.[1];
}

/** Strip HTML tags and decode common entities. Returns plain text. */
function stripHtml(html: string): string {
  return html
    // Remove script and style blocks entirely (including their content)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Truncate text to max chars if needed. */
function truncateText(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return {
    text: text.slice(0, max) + `\n\n[...truncated; original length ${text.length} chars]`,
    truncated: true,
  };
}

// Norm type enum values used by Infoleg search form
const NORM_TYPE_LABELS: Record<string, string> = {
  '1': 'Ley',
  '2': 'Decreto',
  '3': 'Resolución',
  '4': 'Disposición',
  '8': 'Decisión Administrativa',
  '7': 'Decreto/Ley',
};

// -- Search parser ------------------------------------------------------------

interface SearchResult {
  infoleg_id: number;
  norm_type: string;
  number: string;
  agency: string;
  date_published: string;
  subject: string;
  summary: string;
  url: string;
}

function parseSearchResults(html: string): { total: number; results: SearchResult[] } {
  const results: SearchResult[] = [];

  // Total results count
  const totalMatch = html.match(/Se\s+encontraron\s+(\d+)\s+resultado/i) ??
    html.match(/(\d+)\s+resultado/i);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  // Each result block links to verNorma.do?id=NNNN
  const blocks = html.split(/verNorma\.do\?id=/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const idMatch = block.match(/^(\d+)/);
    if (!idMatch) continue;
    const infoleg_id = parseInt(idMatch[1], 10);

    // Norm type + number: e.g. "Ley 19550", "Decreto 70/2023"
    const typeNumMatch = block.match(
      /(Ley|Decreto|Resoluci[oó]n|Disposici[oó]n|Decisi[oó]n\s+Administrativa)\s+([\d\w/.]+)/i,
    );
    const norm_type = typeNumMatch?.[1] ?? '';
    const number = typeNumMatch?.[2] ?? '';

    // Agency / Organismo
    const agencyMatch = block.match(/Organismo[^:]*:\s*([^<\n]+)/i) ??
      block.match(/Emisor[^:]*:\s*([^<\n]+)/i);
    const agency = agencyMatch ? stripHtml(agencyMatch[1]).trim() : '';

    // Date
    const dateMatch = block.match(/Fecha[^:]*:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i) ??
      block.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{4})/);
    const date_published = dateMatch?.[1] ?? '';

    // Subject / Sumario — grab the next text blob
    const subjectMatch = block.match(/Sumario|Tema|Asunto/i);
    let subject = '';
    let summary = '';
    if (subjectMatch) {
      const afterSubject = block.slice(subjectMatch.index! + subjectMatch[0].length);
      const textChunk = stripHtml(afterSubject.slice(0, 1000));
      const lines = textChunk.split('\n').filter(Boolean);
      subject = lines[0]?.trim().slice(0, 300) ?? '';
      summary = lines.slice(1).join(' ').trim().slice(0, 500);
    } else {
      // Fallback: grab the biggest text blob in the block
      const plainBlock = stripHtml(block.slice(0, 2000));
      const lines = plainBlock.split('\n').filter((l) => l.trim().length > 20);
      subject = lines[0]?.trim().slice(0, 300) ?? '';
      summary = lines.slice(1, 3).join(' ').trim().slice(0, 500);
    }

    results.push({
      infoleg_id,
      norm_type,
      number,
      agency,
      date_published,
      subject: subject || `${norm_type} ${number}`.trim(),
      summary,
      url: `${INFOLEG_BASE}/verNorma.do?id=${infoleg_id}`,
    });
  }

  return { total, results };
}

// -- Norm metadata parser -----------------------------------------------------

interface NormMetadata {
  infoleg_id: number;
  norm_type: string;
  number: string;
  agency: string;
  date_published: string;
  subject: string;
  summary: string;
  has_consolidated_text: boolean;
  modifies_count: number;
  modified_by_count: number;
  url: string;
}

function parseNormPage(html: string, id: number): NormMetadata {
  const field = (pattern: RegExp): string => {
    const m = html.match(pattern);
    return m ? stripHtml(m[1]).trim() : '';
  };

  const norm_type = field(/Tipo\s+de\s+Norma[^:]*:\s*([^<\n]+)/i) ||
    field(/(Ley|Decreto|Resoluci[oó]n|Disposici[oó]n|Decisi[oó]n\s+Administrativa)/i);
  const number = field(/N[uú]mero[^:]*:\s*([^<\n]+)/i) || field(/Nro[.\s]*:\s*([^<\n]+)/i);
  const agency = field(/Organismo[^:]*:\s*([^<\n]+)/i) || field(/Emisor[^:]*:\s*([^<\n]+)/i);
  const date_published = field(/Fecha[^:]*:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
  const subject = field(/Sumario[^:]*:\s*([^<]+)/i) || field(/Tema[^:]*:\s*([^<]+)/i);
  const summary = field(/Observaciones[^:]*:\s*([^<]+)/i);

  const has_consolidated_text = /texact\.htm/i.test(html) || /texto\s+actualizado/i.test(html);

  const modifiesMatch = html.match(/Modifica\s+a[^(]*\((\d+)\)/i);
  const modifiedByMatch = html.match(/Modificada\s+por[^(]*\((\d+)\)/i);

  return {
    infoleg_id: id,
    norm_type,
    number,
    agency,
    date_published,
    subject: subject.slice(0, 500),
    summary: summary.slice(0, 500),
    has_consolidated_text,
    modifies_count: modifiesMatch ? parseInt(modifiesMatch[1], 10) : 0,
    modified_by_count: modifiedByMatch ? parseInt(modifiedByMatch[1], 10) : 0,
    url: `${INFOLEG_BASE}/verNorma.do?id=${id}`,
  };
}

// -- Modifications parser -----------------------------------------------------

interface ModificationEntry {
  infoleg_id: number;
  norm_type: string;
  number: string;
  date_published: string;
  subject: string;
  url: string;
}

function parseModificationsPage(html: string): ModificationEntry[] {
  const results: ModificationEntry[] = [];
  const blocks = html.split(/verNorma\.do\?id=/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const idMatch = block.match(/^(\d+)/);
    if (!idMatch) continue;
    const infoleg_id = parseInt(idMatch[1], 10);

    const typeNumMatch = block.match(
      /(Ley|Decreto|Resoluci[oó]n|Disposici[oó]n|Decisi[oó]n\s+Administrativa)\s+([\d\w/.]+)/i,
    );
    const dateMatch = block.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{4})/);
    const plainBlock = stripHtml(block.slice(0, 1000));
    const lines = plainBlock.split('\n').filter((l) => l.trim().length > 10);

    results.push({
      infoleg_id,
      norm_type: typeNumMatch?.[1] ?? '',
      number: typeNumMatch?.[2] ?? '',
      date_published: dateMatch?.[1] ?? '',
      subject: lines[0]?.trim().slice(0, 300) ?? '',
      url: `${INFOLEG_BASE}/verNorma.do?id=${infoleg_id}`,
    });
  }
  return results;
}

// -- Article extraction -------------------------------------------------------

interface Article {
  article_number: string;
  text: string;
}

function extractArticles(plainText: string): Article[] {
  // Split on ARTICULO / Art. boundaries
  const pattern = /\b(ART[IÍ]CULO|Art\.?)\s+(\d+[°º]?\s*(?:bis|ter|qu[aá]ter|quinquies)?)\s*[-–—.:]/gi;
  const articles: Article[] = [];
  const matches: { index: number; number: string }[] = [];

  let m: RegExpExecArray | null;
  while ((m = pattern.exec(plainText)) !== null) {
    matches.push({ index: m.index, number: m[2].replace(/[°º\s]/g, '').trim() });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : plainText.length;
    articles.push({
      article_number: matches[i].number,
      text: plainText.slice(start, end).trim(),
    });
  }

  return articles;
}

/** Parse an article range string like "256-270" into [min, max]. */
function parseArticleRange(range: string): [number, number] | null {
  const m = range.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (!m) {
    const single = range.match(/^(\d+)$/);
    if (single) {
      const n = parseInt(single[1], 10);
      return [n, n];
    }
    return null;
  }
  return [parseInt(m[1], 10), parseInt(m[2], 10)];
}

// -- Text URL helpers ---------------------------------------------------------

function textUrl(id: number, version: 'consolidated' | 'original'): string {
  const rangeStart = Math.floor(id / 5000) * 5000;
  const rangeEnd = rangeStart + 4999;
  const file = version === 'consolidated' ? 'texact.htm' : 'norma.htm';
  return `${INFOLEG_BASE}/anexos/${rangeStart}-${rangeEnd}/${id}/${file}`;
}

// -- Tool builder -------------------------------------------------------------

export function buildInfolegTools(): AnyToolDefinition[] {
  // ---- infoleg_search -------------------------------------------------------
  const searchTool: AnyToolDefinition = {
    name: 'infoleg_search',
    description:
      'Search Argentina\'s official legislative database (Infoleg) for norms — leyes, decretos, resoluciones, disposiciones, and decisiones administrativas. At least 2 of (norm_type, number, text, year) must be provided (Infoleg requires this). Returns norm IDs, types, numbers, dates, subjects, and Infoleg URLs. Use the returned infoleg_id with the other infoleg tools to fetch full text or metadata.',
    parameters: {
      type: 'object',
      properties: {
        norm_type: {
          type: 'string',
          enum: ['1', '2', '3', '4', '7', '8'],
          description: 'Norm type: "1"=Ley, "2"=Decreto, "3"=Resolución, "4"=Disposición, "7"=Decreto/Ley, "8"=Decisión Administrativa.',
        },
        number: {
          type: 'string',
          description: 'Norm number, e.g. "19550", "70/2023".',
        },
        text: {
          type: 'string',
          description: 'Free-text keyword search within the norm\'s subject/content. IMPORTANT: Infoleg requires at least two search criteria — norm_type + number alone is not enough. Always include text (even a broad keyword) or year as an additional criterion.',
        },
        year: {
          type: 'string',
          description: 'Year of enactment/publication, e.g. "2023".',
        },
        page: {
          type: 'integer',
          minimum: 1,
          description: 'Page of results (default 1).',
        },
      },
      additionalProperties: false,
    },
    async execute(args: {
      norm_type?: string;
      number?: string;
      text?: string;
      year?: string;
      page?: number;
    }) {
      // Validate at least 2 params
      const provided = [args.norm_type, args.number, args.text, args.year].filter(Boolean).length;
      if (provided < 2) {
        throw new Error(
          'infoleg_search requires at least 2 of (norm_type, number, text, year). Infoleg rejects searches with fewer criteria.',
        );
      }

      // Step 1: GET to get JSESSIONID
      const getResponse = await fetch(`${INFOLEG_BASE}/buscarNormas.do`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
      // Read body to completion
      await getResponse.arrayBuffer();
      const sessionId = extractSessionCookie(getResponse);

      // Step 2: POST search using Infoleg's actual form field names
      const formData = new URLSearchParams();
      if (args.norm_type) formData.set('tipoNorma', args.norm_type);
      if (args.number) formData.set('numero', args.number);
      if (args.text) formData.set('texto', args.text);
      if (args.year) formData.set('anioSancion', args.year);
      formData.set('offset', String(((args.page ?? 1) - 1) * 10));

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      if (sessionId) {
        headers['Cookie'] = `JSESSIONID=${sessionId}`;
      }

      const html = await fetchInfoleg(`${INFOLEG_BASE}/buscarNormas.do`, {
        method: 'POST',
        headers,
        body: formData.toString(),
      });

      const parsed = parseSearchResults(html);
      const page = args.page ?? 1;
      return {
        total: parsed.total,
        page,
        has_more: page * 10 < parsed.total,
        results: parsed.results,
      };
    },
  };

  // ---- infoleg_get_norm -----------------------------------------------------
  const getNormTool: AnyToolDefinition = {
    name: 'infoleg_get_norm',
    description:
      'Get metadata for a specific Argentine norm by its Infoleg ID. Returns norm type, number, agency, publication date, subject, summary, whether a consolidated text exists, and counts of norms it modifies / is modified by.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Infoleg norm ID (from search results).' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    async execute(args: { id: number }) {
      const html = await fetchInfoleg(`${INFOLEG_BASE}/verNorma.do?id=${args.id}`);
      return parseNormPage(html, args.id);
    },
  };

  // ---- infoleg_get_text -----------------------------------------------------
  const getTextTool: AnyToolDefinition = {
    name: 'infoleg_get_text',
    description:
      'Get the full text of an Argentine norm by Infoleg ID. Can return the consolidated ("texto actualizado") or original version. Optionally filter to a specific article range (e.g. "256-270") or truncate long texts. Default truncation is 20k chars.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Infoleg norm ID.' },
        version: {
          type: 'string',
          enum: ['consolidated', 'original'],
          description: 'Which version to fetch: "consolidated" (texto actualizado, default) or "original".',
        },
        article_range: {
          type: 'string',
          description: 'Optional article range to extract, e.g. "256-270" or "10". Only matching articles are returned.',
        },
        truncate_text: {
          type: 'boolean',
          description: 'Truncate text to ~20k chars (default true). Set false for the complete text.',
        },
      },
      required: ['id'],
      additionalProperties: false,
    },
    async execute(args: {
      id: number;
      version?: 'consolidated' | 'original';
      article_range?: string;
      truncate_text?: boolean;
    }) {
      const version = args.version ?? 'consolidated';
      const url = textUrl(args.id, version);

      let html: string;
      try {
        html = await fetchInfoleg(url);
      } catch (err) {
        // If consolidated doesn't exist, try original as fallback
        if (version === 'consolidated') {
          const fallbackUrl = textUrl(args.id, 'original');
          html = await fetchInfoleg(fallbackUrl);
        } else {
          throw err;
        }
      }

      let plainText = stripHtml(html);
      const fullLength = plainText.length;

      // Article range filtering
      if (args.article_range) {
        const range = parseArticleRange(args.article_range);
        if (range) {
          const articles = extractArticles(plainText);
          const [min, max] = range;
          const filtered = articles.filter((a) => {
            const num = parseInt(a.article_number, 10);
            return !isNaN(num) && num >= min && num <= max;
          });
          if (filtered.length > 0) {
            plainText = filtered.map((a) => a.text).join('\n\n');
          }
        }
      }

      const shouldTruncate = args.truncate_text !== false;
      const result = shouldTruncate ? truncateText(plainText, MAX_TEXT_CHARS) : { text: plainText, truncated: false };

      return {
        infoleg_id: args.id,
        version,
        full_length_chars: fullLength,
        truncated: result.truncated,
        text: result.text,
        url,
      };
    },
  };

  // ---- infoleg_get_modifications --------------------------------------------
  const getModificationsTool: AnyToolDefinition = {
    name: 'infoleg_get_modifications',
    description:
      'List norms that a given Argentine norm modifies or is modified by. Use direction "modifies" to see what the norm changed, or "modified_by" to see what later norms changed it.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Infoleg norm ID.' },
        direction: {
          type: 'string',
          enum: ['modifies', 'modified_by'],
          description: '"modifies" = norms this one modifies; "modified_by" = norms that modified this one.',
        },
      },
      required: ['id', 'direction'],
      additionalProperties: false,
    },
    async execute(args: { id: number; direction: 'modifies' | 'modified_by' }) {
      const modo = args.direction === 'modifies' ? '1' : '2';
      const html = await fetchInfoleg(
        `${INFOLEG_BASE}/verVinculos.do?modo=${modo}&id=${args.id}`,
      );
      const results = parseModificationsPage(html);
      return {
        infoleg_id: args.id,
        direction: args.direction,
        results,
      };
    },
  };

  // ---- infoleg_find_article -------------------------------------------------
  const findArticleTool: AnyToolDefinition = {
    name: 'infoleg_find_article',
    description:
      'Find articles containing a keyword within a specific Argentine law. Searches Infoleg for the norm, fetches its full text, splits it into articles, and filters to those containing the keyword. Returns matching articles with their text. Ideal for questions like "What does Ley 19550 say about domicilio?"',
    parameters: {
      type: 'object',
      properties: {
        norm_type: {
          type: 'string',
          enum: ['1', '2', '3', '4', '7', '8'],
          description: 'Norm type: "1"=Ley, "2"=Decreto, "3"=Resolución, "4"=Disposición, "7"=Decreto/Ley, "8"=Decisión Administrativa.',
        },
        number: {
          type: 'string',
          description: 'Norm number, e.g. "19550", "70/2023".',
        },
        keyword: {
          type: 'string',
          description: 'Keyword or phrase to search for within article text (case-insensitive).',
        },
        max_articles: {
          type: 'integer',
          minimum: 1,
          maximum: 20,
          description: 'Maximum articles to return (default 5).',
        },
      },
      required: ['norm_type', 'number', 'keyword'],
      additionalProperties: false,
    },
    async execute(args: {
      norm_type: string;
      number: string;
      keyword: string;
      max_articles?: number;
    }) {
      const maxArticles = args.max_articles ?? 5;

      // Step 1: Search to resolve infoleg_id
      // Infoleg requires at least 2 "real" criteria — tipoNorma + numero alone
      // is rejected. We include the keyword as `texto` to satisfy this.
      const getResponse = await fetch(`${INFOLEG_BASE}/buscarNormas.do`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
      await getResponse.arrayBuffer();
      const sessionId = extractSessionCookie(getResponse);

      const formData = new URLSearchParams();
      formData.set('tipoNorma', args.norm_type);
      formData.set('numero', args.number);
      // Use the keyword as the texto field so Infoleg accepts the search
      formData.set('texto', args.keyword);

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      if (sessionId) {
        headers['Cookie'] = `JSESSIONID=${sessionId}`;
      }

      const searchHtml = await fetchInfoleg(`${INFOLEG_BASE}/buscarNormas.do`, {
        method: 'POST',
        headers,
        body: formData.toString(),
      });

      const parsed = parseSearchResults(searchHtml);
      if (parsed.results.length === 0) {
        throw new Error(
          `No results found for ${NORM_TYPE_LABELS[args.norm_type] ?? 'Norma'} ${args.number} on Infoleg.`,
        );
      }

      const infoleg_id = parsed.results[0].infoleg_id;

      // Step 2: Fetch full text (consolidated, then fallback to original)
      let html: string;
      try {
        html = await fetchInfoleg(textUrl(infoleg_id, 'consolidated'));
      } catch {
        html = await fetchInfoleg(textUrl(infoleg_id, 'original'));
      }
      const plainText = stripHtml(html);

      // Step 3: Extract + filter articles
      const allArticles = extractArticles(plainText);
      const kw = args.keyword.toLowerCase();
      const matching = allArticles
        .filter((a) => a.text.toLowerCase().includes(kw))
        .slice(0, maxArticles);

      return {
        norm_type: NORM_TYPE_LABELS[args.norm_type] ?? args.norm_type,
        number: args.number,
        infoleg_id,
        keyword: args.keyword,
        matching_articles: matching,
        total_articles_in_norm: allArticles.length,
        url: `${INFOLEG_BASE}/verNorma.do?id=${infoleg_id}`,
      };
    },
  };

  return [searchTool, getNormTool, getTextTool, getModificationsTool, findArticleTool];
}
