import { useCallback, useMemo, useReducer } from 'react';

import { memoryBookSchema } from '@/features/memory-book/schemas/memoryBookSchema';
import { addMemoryBookEntry, createMemoryBookSeed, removeMemoryBookEntry, updateMemoryBookEntry } from '@/features/memory-book/services/memoryBookService';
import type { MemoryBookDraft, MemoryBookEntry, MemoryBookView } from '@/features/memory-book/types';

type State = { entries: MemoryBookEntry[]; view: MemoryBookView; selectedId?: string; draft: Partial<MemoryBookDraft>; errors: Record<string, string>; sequence: number };
type Action =
  | { type: 'OPEN'; view: MemoryBookView; id?: string }
  | { type: 'UPDATE'; patch: Partial<MemoryBookDraft> }
  | { type: 'ERRORS'; errors: Record<string, string> }
  | { type: 'SAVE'; entry: MemoryBookEntry; create: boolean }
  | { type: 'DELETE' }
  | { type: 'CLOSE' };

const blankDraft = (): Partial<MemoryBookDraft> => ({ coverAssetKey: 'together', note: '' });
const toErrors = (issues: { path: PropertyKey[]; message: string }[]) => issues.reduce<Record<string, string>>((errors, issue) => ({ ...errors, [String(issue.path[0] ?? 'form')]: issue.message }), {});

function reducer(state: State, action: Action): State {
  if (action.type === 'OPEN') {
    const selected = state.entries.find((entry) => entry.id === action.id);
    return { ...state, view: action.view, selectedId: selected?.id, draft: action.view === 'create' ? blankDraft() : selected ? { ...selected } : state.draft, errors: {} };
  }
  if (action.type === 'UPDATE') return { ...state, draft: { ...state.draft, ...action.patch }, errors: {} };
  if (action.type === 'ERRORS') return { ...state, errors: action.errors };
  if (action.type === 'SAVE') return { ...state, entries: action.create ? addMemoryBookEntry(state.entries, action.entry) : updateMemoryBookEntry(state.entries, action.entry), view: 'overview', selectedId: undefined, draft: blankDraft(), errors: {}, sequence: state.sequence + (action.create ? 1 : 0) };
  if (action.type === 'DELETE') return state.selectedId ? { ...state, entries: removeMemoryBookEntry(state.entries, state.selectedId), view: 'overview', selectedId: undefined, draft: blankDraft() } : state;
  return { ...state, view: 'overview', selectedId: undefined, draft: blankDraft(), errors: {} };
}

export function useMemoryBook() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ entries: createMemoryBookSeed(), view: 'overview' as const, draft: blankDraft(), errors: {}, sequence: 4 }));
  const selectedEntry = useMemo(() => state.entries.find((entry) => entry.id === state.selectedId), [state.entries, state.selectedId]);
  const updateDraft = useCallback((patch: Partial<MemoryBookDraft>) => dispatch({ type: 'UPDATE', patch }), []);
  const save = useCallback((create: boolean) => {
    const parsed = memoryBookSchema.safeParse(state.draft);
    if (!parsed.success) { dispatch({ type: 'ERRORS', errors: toErrors(parsed.error.issues) }); return false; }
    const entry: MemoryBookEntry = { ...parsed.data, id: create ? `book-${state.sequence}` : state.selectedId! };
    dispatch({ type: 'SAVE', entry, create }); return true;
  }, [state.draft, state.selectedId, state.sequence]);
  return { entries: state.entries, view: state.view, selectedEntry, draft: state.draft, errors: state.errors, openDetail: (id: string) => dispatch({ type: 'OPEN', view: 'detail', id }), openCreate: () => dispatch({ type: 'OPEN', view: 'create' }), openEdit: (id: string) => dispatch({ type: 'OPEN', view: 'edit', id }), updateDraft, saveCreate: () => save(true), saveEdit: () => save(false), deleteSelected: () => dispatch({ type: 'DELETE' }), close: () => dispatch({ type: 'CLOSE' }) };
}
