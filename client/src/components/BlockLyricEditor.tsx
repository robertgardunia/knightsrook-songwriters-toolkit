import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LyricsContent, LyricsBlock, LyricsLine } from '../lib/lyricsBlocks';
import { newLine, newBlock } from '../lib/lyricsBlocks';

interface Props {
  content: LyricsContent;
  onChange: (content: LyricsContent) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findLine(blocks: LyricsBlock[], lineId: string): { block: LyricsBlock; line: LyricsLine } | null {
  for (const block of blocks) {
    const line = block.lines.find(l => l.id === lineId);
    if (line) return { block, line };
  }
  return null;
}

function isBlockId(blocks: LyricsBlock[], id: string) {
  return blocks.some(b => b.id === id);
}

// ── Drag handle icon ─────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
      <circle cx="4" cy="3"  r="1.2"/><circle cx="8" cy="3"  r="1.2"/>
      <circle cx="4" cy="8"  r="1.2"/><circle cx="8" cy="8"  r="1.2"/>
      <circle cx="4" cy="13" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
    </svg>
  );
}

// ── SortableLine ──────────────────────────────────────────────────────────────

interface LineProps {
  line: LyricsLine;
  blockId: string;
  isSelected: boolean;
  selectionMode: boolean;
  pendingFocus: boolean;
  onChange: (lineId: string, blockId: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent, lineId: string, blockId: string) => void;
  onLongPress: (lineId: string) => void;
  onTap: (lineId: string) => void;
}

function SortableLine({ line, blockId, isSelected, selectionMode, pendingFocus, onChange, onKeyDown, onLongPress, onTap }: LineProps) {
  const {
    attributes, listeners,
    setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: line.id, data: { type: 'line', blockId } });

  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const didLongPress = useRef(false);

  useEffect(() => {
    if (pendingFocus) inputRef.current?.focus();
  }, [pendingFocus]);

  const handlePointerDown = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(line.id);
    }, 480);
  };
  const cancelLongPress = () => clearTimeout(longPressTimer.current);

  const handleClick = () => {
    if (didLongPress.current) return;
    if (selectionMode) onTap(line.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`block-line${isSelected ? ' block-line--selected' : ''}${isDragging ? ' block-line--dragging' : ''}`}
    >
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="block-line__handle"
        tabIndex={-1}
        aria-label="Drag line"
      >
        <GripIcon />
      </button>
      <input
        ref={inputRef}
        value={line.text}
        onChange={e => onChange(line.id, blockId, e.target.value)}
        onKeyDown={e => onKeyDown(e, line.id, blockId)}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelLongPress}
        onPointerMove={cancelLongPress}
        onClick={handleClick}
        className="block-line__input"
        placeholder="…"
      />
    </div>
  );
}

// ── SortableBlock ─────────────────────────────────────────────────────────────

interface BlockProps {
  block: LyricsBlock;
  selectedLines: Set<string>;
  selectionMode: boolean;
  pendingFocusId: string | null;
  onLabelChange: (blockId: string, label: string) => void;
  onLineChange: (lineId: string, blockId: string, text: string) => void;
  onLineKeyDown: (e: React.KeyboardEvent, lineId: string, blockId: string) => void;
  onLongPress: (lineId: string) => void;
  onLineTap: (lineId: string) => void;
  onAddLine: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
}

function SortableBlock({ block, selectedLines, selectionMode, pendingFocusId, onLabelChange, onLineChange, onLineKeyDown, onLongPress, onLineTap, onAddLine, onDeleteBlock }: BlockProps) {
  const {
    attributes, listeners,
    setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: block.id, data: { type: 'block' } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`lyric-block${isDragging ? ' lyric-block--dragging' : ''}`}
    >
      <div className="lyric-block__header">
        <button ref={setActivatorNodeRef} {...listeners} {...attributes} className="lyric-block__drag-handle" tabIndex={-1} aria-label="Drag block">
          <GripIcon />
        </button>
        <input
          value={block.label}
          onChange={e => onLabelChange(block.id, e.target.value)}
          className="lyric-block__label"
          placeholder="Section…"
        />
        <button onClick={() => onDeleteBlock(block.id)} className="lyric-block__delete" tabIndex={-1}>✕</button>
      </div>

      <SortableContext items={block.lines.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {block.lines.map(line => (
          <SortableLine
            key={line.id}
            line={line}
            blockId={block.id}
            isSelected={selectedLines.has(line.id)}
            selectionMode={selectionMode}
            pendingFocus={pendingFocusId === line.id}
            onChange={onLineChange}
            onKeyDown={onLineKeyDown}
            onLongPress={onLongPress}
            onTap={onLineTap}
          />
        ))}
      </SortableContext>

      <button onClick={() => onAddLine(block.id)} className="block-add-line">+ line</button>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

export default function BlockLyricEditor({ content, onChange }: Props) {
  const [blocks, setBlocks] = useState<LyricsBlock[]>(content.blocks);
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const pendingFocusId = useRef<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  // Sync if content prop changes (e.g. song switch)
  useEffect(() => {
    setBlocks(content.blocks);
    setSelectedLines(new Set());
    setSelectionMode(false);
  }, [content]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const update = useCallback((next: LyricsBlock[]) => {
    setBlocks(next);
    onChange({ version: 1, blocks: next });
  }, [onChange]);

  // ── Block ops ───────────────────────────────────────────────────────────────

  const addBlock = () => update([...blocks, newBlock()]);

  const deleteBlock = (blockId: string) => {
    if (blocks.length === 1) return; // keep at least one
    update(blocks.filter(b => b.id !== blockId));
  };

  const updateLabel = (blockId: string, label: string) =>
    update(blocks.map(b => b.id === blockId ? { ...b, label } : b));

  // ── Line ops ────────────────────────────────────────────────────────────────

  const updateLine = (lineId: string, blockId: string, text: string) =>
    update(blocks.map(b => b.id !== blockId ? b : {
      ...b, lines: b.lines.map(l => l.id === lineId ? { ...l, text } : l),
    }));

  const handleLineKeyDown = (e: React.KeyboardEvent, lineId: string, blockId: string) => {
    const block = blocks.find(b => b.id === blockId)!;
    const idx = block.lines.findIndex(l => l.id === lineId);

    if (e.key === 'Enter') {
      e.preventDefault();
      const nl = newLine();
      pendingFocusId.current = nl.id;
      const next = blocks.map(b => b.id !== blockId ? b : {
        ...b,
        lines: [...b.lines.slice(0, idx + 1), nl, ...b.lines.slice(idx + 1)],
      });
      update(next);
      setFocusTick(t => t + 1);
    }

    if (e.key === 'Backspace' && block.lines[idx].text === '') {
      e.preventDefault();
      if (block.lines.length === 1) return;
      const prev = block.lines[idx - 1];
      if (prev) pendingFocusId.current = prev.id;
      update(blocks.map(b => b.id !== blockId ? b : {
        ...b, lines: b.lines.filter(l => l.id !== lineId),
      }));
      setFocusTick(t => t + 1);
    }
  };

  const addLine = (blockId: string) => {
    const nl = newLine();
    pendingFocusId.current = nl.id;
    update(blocks.map(b => b.id !== blockId ? b : { ...b, lines: [...b.lines, nl] }));
    setFocusTick(t => t + 1);
  };

  // ── Selection ───────────────────────────────────────────────────────────────

  const enterSelectionMode = (lineId: string) => {
    setSelectionMode(true);
    setSelectedLines(new Set([lineId]));
  };

  const toggleLine = (lineId: string) => {
    if (!selectionMode) return;
    setSelectedLines(prev => {
      const next = new Set(prev);
      next.has(lineId) ? next.delete(lineId) : next.add(lineId);
      return next;
    });
  };

  const exitSelection = () => { setSelectionMode(false); setSelectedLines(new Set()); };

  // ── DnD ─────────────────────────────────────────────────────────────────────

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(active.id as string);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const aid = active.id as string;
    const oid = over.id as string;

    // Block reorder
    if (isBlockId(blocks, aid)) {
      const oi = blocks.findIndex(b => b.id === oid);
      const ai = blocks.findIndex(b => b.id === aid);
      if (oi !== -1 && ai !== -1) update(arrayMove(blocks, ai, oi));
      return;
    }

    // Line move
    const srcBlock = blocks.find(b => b.lines.some(l => l.id === aid));
    if (!srcBlock) return;

    // Lines to move: selected group or just the active line
    const moving = (selectionMode && selectedLines.has(aid))
      ? srcBlock.lines.filter(l => selectedLines.has(l.id))
      : [srcBlock.lines.find(l => l.id === aid)!];

    const dstBlock = blocks.find(b => b.lines.some(l => l.id === oid) || b.id === oid);
    if (!dstBlock) return;

    if (srcBlock.id === dstBlock.id) {
      // Same block — reorder
      const stripped = srcBlock.lines.filter(l => !moving.some(m => m.id === l.id));
      const insertAt  = stripped.findIndex(l => l.id === oid);
      const newLines  = insertAt === -1
        ? [...stripped, ...moving]
        : [...stripped.slice(0, insertAt + 1), ...moving, ...stripped.slice(insertAt + 1)];
      update(blocks.map(b => b.id === srcBlock.id ? { ...b, lines: newLines } : b));
    } else {
      // Cross-block move
      const newSrc = srcBlock.lines.filter(l => !moving.some(m => m.id === l.id));
      const dstStripped = dstBlock.lines.filter(l => !moving.some(m => m.id === l.id));
      const insertAt = dstStripped.findIndex(l => l.id === oid);
      const newDst = insertAt === -1
        ? [...dstStripped, ...moving]
        : [...dstStripped.slice(0, insertAt + 1), ...moving, ...dstStripped.slice(insertAt + 1)];
      update(blocks.map(b => {
        if (b.id === srcBlock.id) return { ...b, lines: newSrc };
        if (b.id === dstBlock.id) return { ...b, lines: newDst };
        return b;
      }));
    }

    if (selectionMode) exitSelection();
  };

  // Overlay label
  const overlayLabel = (() => {
    if (!activeId) return '';
    if (isBlockId(blocks, activeId)) return blocks.find(b => b.id === activeId)?.label ?? '';
    if (selectionMode && selectedLines.has(activeId) && selectedLines.size > 1)
      return `${selectedLines.size} lines`;
    return findLine(blocks, activeId)?.line.text || '…';
  })();

  return (
    <div className={`block-lyric-editor${selectionMode ? ' block-lyric-editor--selecting' : ''}`}>
      {selectionMode && (
        <div className="selection-bar">
          <span>{selectedLines.size} line{selectedLines.size !== 1 ? 's' : ''} selected — drag any handle to move</span>
          <button onClick={exitSelection}>Cancel</button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map(block => (
            <SortableBlock
              key={block.id}
              block={block}
              selectedLines={selectedLines}
              selectionMode={selectionMode}
              pendingFocusId={focusTick > 0 ? pendingFocusId.current : null}
              onLabelChange={updateLabel}
              onLineChange={updateLine}
              onLineKeyDown={handleLineKeyDown}
              onLongPress={enterSelectionMode}
              onLineTap={toggleLine}
              onAddLine={addLine}
              onDeleteBlock={deleteBlock}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId && <div className="drag-overlay-pill">{overlayLabel}</div>}
        </DragOverlay>
      </DndContext>

      <button onClick={addBlock} className="add-block-btn">+ Add section</button>
    </div>
  );
}
