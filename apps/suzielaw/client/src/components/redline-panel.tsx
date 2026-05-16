import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  LoadingState,
  RedlineRuns,
  type RedlineParagraph as UpstreamRedlineParagraph,
} from '@teamsuzie/ui';
import type {
  FocusCardEventDetail,
  FocusRevisionEventDetail,
} from './tracked-changes-panel.js';

/**
 * Inline redline preview rendered as a side-panel tab. Fetches
 * `/api/files/:sessionId/:fileId/redline-view` (server-side OOXML walk
 * via `extractRedlineParagraphs`) and renders one paragraph per
 * main-document `<w:p>`, including table-cell paragraphs, with each run
 * as either equal text, an `<ins>` span (emerald), or a `<del>` span
 * (struck-through destructive). Each ins/del span carries
 * `data-revision-id` so the chat-side cards and this panel can sync via
 * window CustomEvents:
 *   - inline span click → `redline:focus-card { key: chatId:revisionId }`
 *   - external (`redline:focus-revision`) → scroll to first matching span
 *
 * On `redline:refresh` (fired after an accept/reject mutates the file)
 * the panel re-fetches its paragraphs.
 *
 * The server `/redline-view` endpoint speaks the legacy suzielaw wire
 * vocabulary (`kind: 'ins' | 'del' | 'equal'`); upstream renderers use
 * `'insert' | 'delete' | 'equal'`. We normalize at the boundary in
 * `toUpstreamKind` before handing paragraphs to `<RedlineRuns>`.
 */

// Wire shape from the server's `/redline-view` endpoint. Keep `ins`/`del`
// here — the server convention is intentionally legacy.
interface WireRedlineRun {
  kind: 'equal' | 'ins' | 'del';
  text: string;
  revisionId?: number;
}

interface WireRedlineParagraph {
  index: number;
  runs: WireRedlineRun[];
}

interface ApiResponse {
  paragraphs: WireRedlineParagraph[];
}

interface RedlineRefreshDetail {
  sessionId: string;
  fileId: string;
  paragraphs?: WireRedlineParagraph[];
}

function toUpstreamKind(
  kind: WireRedlineRun['kind'],
): 'equal' | 'insert' | 'delete' {
  return kind === 'ins' ? 'insert' : kind === 'del' ? 'delete' : 'equal';
}

export function RedlinePanelContent({
  sessionId,
  fileId,
  fileName,
  chatId,
  revisionCardKeys,
}: {
  sessionId: string;
  fileId: string;
  fileName: string;
  chatId: string;
  revisionCardKeys?: Record<number, string>;
}) {
  const [paragraphs, setParagraphs] = useState<WireRedlineParagraph[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Pending revision-id focus that came in before the paragraphs loaded.
  const pendingFocusRef = useRef<number | null>(null);

  const fetchParagraphs = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await fetch(
          `/api/files/${encodeURIComponent(sessionId)}/${encodeURIComponent(fileId)}/redline-view`,
          { credentials: 'include', signal, cache: 'no-store' },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ApiResponse;
        setParagraphs(data.paragraphs);
        setError(null);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      }
    },
    [sessionId, fileId],
  );

  useEffect(() => {
    const ac = new AbortController();
    void fetchParagraphs(ac.signal);
    return () => ac.abort();
  }, [fetchParagraphs]);

  // Listen for refresh (after an accept/reject) and external focus events.
  useEffect(() => {
    function onRefresh(ev: Event) {
      const ce = ev as CustomEvent<RedlineRefreshDetail>;
      if (ce.detail?.sessionId !== sessionId || ce.detail?.fileId !== fileId) return;
      if (ce.detail.paragraphs) {
        setParagraphs(ce.detail.paragraphs);
        setError(null);
        return;
      }
      void fetchParagraphs();
    }
    function onFocusRevision(ev: Event) {
      const ce = ev as CustomEvent<FocusRevisionEventDetail>;
      const rid = ce.detail?.revisionId;
      if (rid === undefined) return;
      if (!paragraphs) {
        pendingFocusRef.current = rid;
        return;
      }
      focusRevision(rid);
    }
    window.addEventListener('redline:refresh', onRefresh as EventListener);
    window.addEventListener(
      'redline:focus-revision',
      onFocusRevision as EventListener,
    );
    return () => {
      window.removeEventListener('redline:refresh', onRefresh as EventListener);
      window.removeEventListener(
        'redline:focus-revision',
        onFocusRevision as EventListener,
      );
    };
  }, [sessionId, fileId, fetchParagraphs, paragraphs]);

  // Once paragraphs land, fire any pending focus.
  useEffect(() => {
    if (!paragraphs) return;
    const rid = pendingFocusRef.current;
    if (rid === null) return;
    pendingFocusRef.current = null;
    // Defer so the DOM has painted.
    window.requestAnimationFrame(() => focusRevision(rid));
  }, [paragraphs]);

  function focusRevision(revisionId: number) {
    const root = containerRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      `[data-revision-id="${revisionId}"]`,
    );
    if (!target) return;
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target.classList.add('redline-flash');
    window.setTimeout(() => target.classList.remove('redline-flash'), 1200);
  }

  function handleSpanClick(revisionId: number) {
    const key = revisionCardKeys?.[revisionId] ?? `${chatId}:${revisionId}`;
    window.dispatchEvent(
      new CustomEvent<FocusCardEventDetail>('redline:focus-card', {
        detail: { key },
      }),
    );
  }

  const upstreamParagraphs = useMemo<UpstreamRedlineParagraph[] | null>(() => {
    if (!paragraphs) return null;
    return paragraphs.map((p) => ({
      index: p.index,
      runs: p.runs.map((r) => ({
        kind: toUpstreamKind(r.kind),
        text: r.text,
        revisionId: r.revisionId,
      })),
    }));
  }, [paragraphs]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight">
            {fileName}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Inline tracked changes — click an edit to find its card
          </div>
        </div>
        <a
          href={`/api/files/${encodeURIComponent(sessionId)}/${encodeURIComponent(fileId)}/content`}
          download
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent/40"
          title="Download the .docx with native Word tracked changes"
        >
          <Download className="size-3.5" aria-hidden />
          Download
        </a>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed"
      >
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!upstreamParagraphs && !error && (
          <LoadingState>Loading redline…</LoadingState>
        )}
        {upstreamParagraphs && upstreamParagraphs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No paragraphs in document.
          </p>
        )}
        {upstreamParagraphs && upstreamParagraphs.length > 0 && (
          <RedlineRuns
            paragraphs={upstreamParagraphs}
            onRunSelect={(revisionId) =>
              handleSpanClick(Number(revisionId))
            }
          />
        )}
      </div>
    </div>
  );
}
