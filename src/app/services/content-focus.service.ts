import { Injectable, signal, computed } from '@angular/core';

// ── Range types — WHERE inside a block the learner has focused ────────────────

export interface FocusRangeText {
  kind: 'text';
  charStart: number;
  charEnd: number;
  selectedText: string;
}

export interface FocusRangeVideo {
  kind: 'video';
  fromSeconds: number;
  toSeconds: number;
}

export interface FocusRangeImage {
  kind: 'image';
  x: number;      // percentage of image width  (0–100)
  y: number;      // percentage of image height (0–100)
  width: number;
  height: number;
}

export interface FocusRangeCell {
  kind: 'cell';
}

export interface FocusRangeBlock {
  kind: 'block';
}

export type FocusRange =
  | FocusRangeText
  | FocusRangeVideo
  | FocusRangeImage
  | FocusRangeCell
  | FocusRangeBlock;

// ── AI tools available in the right panel ────────────────────────────────────

export type AiTool =
  | 'explain'
  | 'quiz'
  | 'simplify'
  | 'expand'
  | 'translate'
  | 'debate'
  | 'summarise'
  | 'describe'
  | 'custom';

export interface AiToolMeta {
  label: string;
  icon: string;
  desc: string;
}

// ── What the learner currently has in focus ───────────────────────────────────

export interface ContentFocus {
  contentId: string;
  blockId: string;
  blockType: string;   // 'text' | 'video' | 'image' | 'audio' | 'animation' | 'canvas'
  cellId?: string;     // set when focus is inside a canvas cell
  range: FocusRange;
  label: string;       // human-readable short description, shown in panel header
  // The actual content text/url/description to send as AI context
  contentContext: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ContentFocusService {

  // ── Current focus ──────────────────────────────────────────────────────────
  readonly focus     = signal<ContentFocus | null>(null);
  readonly activeTool = signal<AiTool | null>(null);

  // ── Tool meta map ──────────────────────────────────────────────────────────
  readonly TOOL_META: Record<AiTool, AiToolMeta> = {
    explain:   { label: 'Explain',   icon: '💡', desc: 'Break it down at my level' },
    quiz:      { label: 'Quiz Me',   icon: '❓', desc: 'Test my understanding' },
    simplify:  { label: 'Simplify',  icon: '⬇',  desc: 'Make it simpler' },
    expand:    { label: 'Expand',    icon: '⬆',  desc: 'Go deeper' },
    translate: { label: 'Translate', icon: '🌐', desc: 'In another language' },
    debate:    { label: 'Debate',    icon: '⚖',  desc: 'Challenge this idea' },
    summarise: { label: 'Summarise', icon: '📝', desc: 'Key points only' },
    describe:  { label: 'Describe',  icon: '🔍', desc: 'What is this?' },
    custom:    { label: 'Ask',       icon: '💬', desc: 'Your own question' },
  };

  // ── Tools available based on the focused block type ───────────────────────
  readonly availableTools = computed<AiTool[]>(() => {
    const f = this.focus();
    if (!f) return [];

    switch (f.blockType) {
      case 'text':
        return ['explain', 'quiz', 'simplify', 'expand', 'translate', 'debate', 'custom'];
      case 'video':
        return ['summarise', 'quiz', 'explain', 'custom'];
      case 'audio':
        return ['summarise', 'explain', 'translate', 'custom'];
      case 'image':
        return ['describe', 'explain', 'custom'];
      case 'animation':
        return ['explain', 'describe', 'custom'];
      case 'canvas':
        return ['explain', 'quiz', 'describe', 'custom'];
      case 'code':
        return ['explain', 'simplify', 'expand', 'quiz', 'custom'];
      default:
        return ['explain', 'custom'];
    }
  });

  // ── Panel header label ────────────────────────────────────────────────────
  readonly focusLabel = computed(() => this.focus()?.label ?? null);

  // ── Whether a specific block (or cell) is currently focused ──────────────
  isFocused(blockId: string, cellId?: string): boolean {
    const f = this.focus();
    if (!f || f.blockId !== blockId) return false;
    if (cellId !== undefined) return f.cellId === cellId;
    return true;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  setFocus(focus: ContentFocus): void {
    this.focus.set(focus);
    this.activeTool.set(null);
  }

  clearFocus(): void {
    this.focus.set(null);
    this.activeTool.set(null);
  }

  selectTool(tool: AiTool): void {
    this.activeTool.set(tool);
  }

  // ── Focus builders (called from content-view interaction layer) ───────────

  focusBlock(contentId: string, blockId: string, blockType: string, label: string, contentContext: string): void {
    this.setFocus({
      contentId,
      blockId,
      blockType,
      range: { kind: 'block' },
      label,
      contentContext,
    });
  }

  focusTextSelection(
    contentId: string,
    blockId: string,
    charStart: number,
    charEnd: number,
    selectedText: string,
  ): void {
    this.setFocus({
      contentId,
      blockId,
      blockType: 'text',
      range: { kind: 'text', charStart, charEnd, selectedText },
      label: `"${selectedText.slice(0, 60)}${selectedText.length > 60 ? '…' : ''}"`,
      contentContext: selectedText,
    });
  }

  focusVideoRange(
    contentId: string,
    blockId: string,
    fromSeconds: number,
    toSeconds: number,
    videoTitle: string,
  ): void {
    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    this.setFocus({
      contentId,
      blockId,
      blockType: 'video',
      range: { kind: 'video', fromSeconds, toSeconds },
      label: `${videoTitle || 'Video'} · ${fmt(fromSeconds)}–${fmt(toSeconds)}`,
      contentContext: `Video clip from ${fmt(fromSeconds)} to ${fmt(toSeconds)}`,
    });
  }

  focusImageRegion(
    contentId: string,
    blockId: string,
    region: { x: number; y: number; width: number; height: number },
    imageCaption: string,
  ): void {
    this.setFocus({
      contentId,
      blockId,
      blockType: 'image',
      range: { kind: 'image', ...region },
      label: `Image · ${imageCaption || 'selected region'}`,
      contentContext: `Image: ${imageCaption || 'untitled image'}`,
    });
  }

  focusCanvasCell(
    contentId: string,
    blockId: string,
    cellId: string,
    cellTool: string,
    cellContext: string,
  ): void {
    this.setFocus({
      contentId,
      blockId,
      blockType: cellTool,
      cellId,
      range: { kind: 'cell' },
      label: `Canvas · ${cellTool} cell`,
      contentContext: cellContext,
    });
  }
}
