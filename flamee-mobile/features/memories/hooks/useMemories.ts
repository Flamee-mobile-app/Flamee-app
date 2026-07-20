import { useCallback, useMemo, useReducer } from 'react';
import type { ZodIssue } from 'zod';

import {
  memoryDetailsSchema,
  memoryReminderSchema,
  type MemoryDetailsValues,
  type MemoryReminderValues,
} from '@/features/memories/schemas/memorySchema';
import {
  addMemory,
  createMemorySeed,
  createRelationshipSummary,
  filterMemories,
  removeMemory,
  updateMemory,
} from '@/features/memories/services/memoryService';
import type {
  CreateMemoryStep,
  MemoriesView,
  MemoryDraft,
  MemoryFilter,
  MemoryItem,
  MemoryType,
} from '@/features/memories/types';

export const DEFAULT_MEMORY_FILTER: MemoryFilter = {
  status: 'all',
  type: 'all',
  range: 'all',
};

const EMPTY_CREATE_DRAFT: Partial<MemoryDraft> = {
  recurrence: 'none',
};

const EMPTY_REMINDER: MemoryReminderValues = {
  enabled: false,
};

export type MemoriesState = {
  items: MemoryItem[];
  view: MemoriesView;
  createStep: CreateMemoryStep;
  createDraft: Partial<MemoryDraft>;
  createReminder: MemoryReminderValues;
  selectedMemoryId?: string;
  editDraft?: MemoryDraft;
  appliedFilter: MemoryFilter;
  stagedFilter: MemoryFilter;
  validationErrors: Record<string, string>;
  deleteConfirmationVisible: boolean;
  nextMemorySequence: number;
};

type MemoriesAction =
  | { type: 'OPEN_FILTER' }
  | { type: 'UPDATE_STAGED_FILTER'; patch: Partial<MemoryFilter> }
  | { type: 'APPLY_FILTER' }
  | { type: 'CLOSE_FILTER' }
  | { type: 'CLEAR_FILTER' }
  | { type: 'OPEN_CREATE' }
  | { type: 'SELECT_CREATE_TYPE'; memoryType: MemoryType }
  | { type: 'UPDATE_CREATE_DETAILS'; patch: Partial<MemoryDetailsValues> }
  | { type: 'UPDATE_CREATE_REMINDER'; reminder: MemoryReminderValues }
  | { type: 'SET_VALIDATION_ERRORS'; errors: Record<string, string> }
  | { type: 'SET_CREATE_STEP'; step: CreateMemoryStep }
  | { type: 'CLOSE_CREATE' }
  | { type: 'ADD_MEMORY'; memory: MemoryItem }
  | { type: 'OPEN_EDIT'; memoryId: string }
  | { type: 'UPDATE_EDIT_DRAFT'; patch: Partial<MemoryDraft> }
  | { type: 'SAVE_EDIT'; memory: MemoryItem }
  | { type: 'CLOSE_EDIT' }
  | { type: 'REQUEST_DELETE' }
  | { type: 'CANCEL_DELETE' }
  | { type: 'CONFIRM_DELETE' };

function resetCreateState(state: MemoriesState): MemoriesState {
  return {
    ...state,
    view: 'overview',
    createStep: 1,
    createDraft: { ...EMPTY_CREATE_DRAFT },
    createReminder: { ...EMPTY_REMINDER },
    validationErrors: {},
  };
}

export function createInitialMemoriesState(
  referenceDate = new Date(),
): MemoriesState {
  return {
    items: createMemorySeed(referenceDate),
    view: 'overview',
    createStep: 1,
    createDraft: { ...EMPTY_CREATE_DRAFT },
    createReminder: { ...EMPTY_REMINDER },
    appliedFilter: { ...DEFAULT_MEMORY_FILTER },
    stagedFilter: { ...DEFAULT_MEMORY_FILTER },
    validationErrors: {},
    deleteConfirmationVisible: false,
    nextMemorySequence: 1,
  };
}

export function memoriesReducer(
  state: MemoriesState,
  action: MemoriesAction,
): MemoriesState {
  switch (action.type) {
    case 'OPEN_FILTER':
      return {
        ...state,
        view: 'filter',
        stagedFilter: { ...state.appliedFilter },
      };
    case 'UPDATE_STAGED_FILTER':
      return {
        ...state,
        stagedFilter: { ...state.stagedFilter, ...action.patch },
      };
    case 'APPLY_FILTER':
      return {
        ...state,
        view: 'overview',
        appliedFilter: { ...state.stagedFilter },
      };
    case 'CLOSE_FILTER':
      return {
        ...state,
        view: 'overview',
        stagedFilter: { ...state.appliedFilter },
      };
    case 'CLEAR_FILTER':
      return {
        ...state,
        stagedFilter: { ...DEFAULT_MEMORY_FILTER },
      };
    case 'OPEN_CREATE':
      return {
        ...state,
        view: 'create',
        createStep: 1,
        createDraft: { ...EMPTY_CREATE_DRAFT },
        createReminder: { ...EMPTY_REMINDER },
        validationErrors: {},
      };
    case 'SELECT_CREATE_TYPE':
      return {
        ...state,
        createDraft: { ...state.createDraft, type: action.memoryType },
        validationErrors: { ...state.validationErrors, type: '' },
      };
    case 'UPDATE_CREATE_DETAILS':
      return {
        ...state,
        createDraft: { ...state.createDraft, ...action.patch },
      };
    case 'UPDATE_CREATE_REMINDER':
      return {
        ...state,
        createReminder: action.reminder,
      };
    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.errors,
      };
    case 'SET_CREATE_STEP':
      return {
        ...state,
        createStep: action.step,
        validationErrors: {},
      };
    case 'CLOSE_CREATE':
      return resetCreateState(state);
    case 'ADD_MEMORY':
      return resetCreateState({
        ...state,
        items: addMemory(state.items, action.memory),
        nextMemorySequence: state.nextMemorySequence + 1,
      });
    case 'OPEN_EDIT': {
      const memory = state.items.find((item) => item.id === action.memoryId);

      if (!memory) {
        return state;
      }

      const { id: _id, ...editDraft } = memory;
      return {
        ...state,
        view: 'edit',
        selectedMemoryId: memory.id,
        editDraft,
        validationErrors: {},
        deleteConfirmationVisible: false,
      };
    }
    case 'UPDATE_EDIT_DRAFT':
      if (!state.editDraft) {
        return state;
      }

      return {
        ...state,
        editDraft: { ...state.editDraft, ...action.patch },
      };
    case 'SAVE_EDIT':
      return {
        ...state,
        items: updateMemory(state.items, action.memory),
        view: 'overview',
        selectedMemoryId: undefined,
        editDraft: undefined,
        validationErrors: {},
      };
    case 'CLOSE_EDIT':
      return {
        ...state,
        view: 'overview',
        selectedMemoryId: undefined,
        editDraft: undefined,
        validationErrors: {},
        deleteConfirmationVisible: false,
      };
    case 'REQUEST_DELETE':
      return state.selectedMemoryId
        ? { ...state, deleteConfirmationVisible: true }
        : state;
    case 'CANCEL_DELETE':
      return { ...state, deleteConfirmationVisible: false };
    case 'CONFIRM_DELETE':
      if (!state.selectedMemoryId) {
        return state;
      }

      return {
        ...state,
        items: removeMemory(state.items, state.selectedMemoryId),
        view: 'overview',
        selectedMemoryId: undefined,
        editDraft: undefined,
        deleteConfirmationVisible: false,
        validationErrors: {},
      };
    default:
      return state;
  }
}

function issuesToErrors(issues: ZodIssue[]) {
  return issues.reduce<Record<string, string>>((errors, issue) => {
    const field = issue.path[0]?.toString() ?? 'form';
    errors[field] ??= issue.message;
    return errors;
  }, {});
}

function parseCreateDetails(draft: Partial<MemoryDraft>) {
  return memoryDetailsSchema.safeParse({
    title: draft.title,
    eventDate: draft.eventDate,
    recurrence: draft.recurrence,
    coverAssetKey: draft.coverAssetKey,
    note: draft.note,
  });
}

export function useMemories(referenceDate = new Date()) {
  const [state, dispatch] = useReducer(
    memoriesReducer,
    referenceDate,
    createInitialMemoriesState,
  );

  const visibleItems = useMemo(
    () => filterMemories(state.items, state.appliedFilter, referenceDate),
    [referenceDate, state.appliedFilter, state.items],
  );
  const selectedMemory = useMemo(
    () => state.items.find((item) => item.id === state.selectedMemoryId),
    [state.items, state.selectedMemoryId],
  );
  const relationshipSummary = useMemo(() => createRelationshipSummary(), []);

  const openFilter = useCallback(() => dispatch({ type: 'OPEN_FILTER' }), []);
  const updateStagedFilter = useCallback(
    (patch: Partial<MemoryFilter>) =>
      dispatch({ type: 'UPDATE_STAGED_FILTER', patch }),
    [],
  );
  const applyFilter = useCallback(() => dispatch({ type: 'APPLY_FILTER' }), []);
  const closeFilter = useCallback(() => dispatch({ type: 'CLOSE_FILTER' }), []);
  const clearFilter = useCallback(() => dispatch({ type: 'CLEAR_FILTER' }), []);
  const openCreate = useCallback(() => dispatch({ type: 'OPEN_CREATE' }), []);
  const selectCreateType = useCallback(
    (memoryType: MemoryType) =>
      dispatch({ type: 'SELECT_CREATE_TYPE', memoryType }),
    [],
  );
  const updateCreateDetails = useCallback(
    (patch: Partial<MemoryDetailsValues>) =>
      dispatch({ type: 'UPDATE_CREATE_DETAILS', patch }),
    [],
  );
  const updateCreateReminder = useCallback(
    (reminder: MemoryReminderValues) =>
      dispatch({ type: 'UPDATE_CREATE_REMINDER', reminder }),
    [],
  );

  const nextCreateStep = useCallback(() => {
    if (state.createStep === 1) {
      if (!state.createDraft.type) {
        dispatch({
          type: 'SET_VALIDATION_ERRORS',
          errors: { type: 'Vui lòng chọn loại cột mốc' },
        });
        return false;
      }

      dispatch({ type: 'SET_CREATE_STEP', step: 2 });
      return true;
    }

    if (state.createStep === 2) {
      const details = parseCreateDetails(state.createDraft);
      if (!details.success) {
        dispatch({
          type: 'SET_VALIDATION_ERRORS',
          errors: issuesToErrors(details.error.issues),
        });
        return false;
      }

      dispatch({ type: 'UPDATE_CREATE_DETAILS', patch: details.data });
      dispatch({ type: 'SET_CREATE_STEP', step: 3 });
      return true;
    }

    return false;
  }, [state.createDraft, state.createStep]);

  const previousCreateStep = useCallback(() => {
    if (state.createStep > 1) {
      dispatch({
        type: 'SET_CREATE_STEP',
        step: (state.createStep - 1) as CreateMemoryStep,
      });
    }
  }, [state.createStep]);

  const closeCreate = useCallback(() => dispatch({ type: 'CLOSE_CREATE' }), []);

  const completeCreate = useCallback(() => {
    if (!state.createDraft.type) {
      dispatch({
        type: 'SET_VALIDATION_ERRORS',
        errors: { type: 'Vui lòng chọn loại cột mốc' },
      });
      return false;
    }

    const details = parseCreateDetails(state.createDraft);
    const reminder = memoryReminderSchema.safeParse(state.createReminder);
    const errors: Record<string, string> = {};

    if (!details.success) {
      Object.assign(errors, issuesToErrors(details.error.issues));
    }
    if (!reminder.success) {
      Object.assign(errors, issuesToErrors(reminder.error.issues));
    }
    if (!details.success || !reminder.success) {
      dispatch({ type: 'SET_VALIDATION_ERRORS', errors });
      return false;
    }

    const memory: MemoryItem = {
      id: `memory-${state.nextMemorySequence}`,
      type: state.createDraft.type,
      ...details.data,
      ...(reminder.data.enabled ? { reminder: reminder.data } : {}),
    };
    dispatch({ type: 'ADD_MEMORY', memory });
    return true;
  }, [state.createDraft, state.createReminder, state.nextMemorySequence]);

  const openEdit = useCallback(
    (memoryId: string) => dispatch({ type: 'OPEN_EDIT', memoryId }),
    [],
  );
  const updateEditDraft = useCallback(
    (patch: Partial<MemoryDraft>) =>
      dispatch({ type: 'UPDATE_EDIT_DRAFT', patch }),
    [],
  );
  const saveEdit = useCallback(() => {
    if (!state.selectedMemoryId || !state.editDraft) {
      return false;
    }

    const details = parseCreateDetails(state.editDraft);
    const reminder = memoryReminderSchema.safeParse(
      state.editDraft.reminder ?? EMPTY_REMINDER,
    );
    const errors: Record<string, string> = {};

    if (!details.success) {
      Object.assign(errors, issuesToErrors(details.error.issues));
    }
    if (!reminder.success) {
      Object.assign(errors, issuesToErrors(reminder.error.issues));
    }
    if (!details.success || !reminder.success) {
      dispatch({ type: 'SET_VALIDATION_ERRORS', errors });
      return false;
    }

    dispatch({
      type: 'SAVE_EDIT',
      memory: {
        id: state.selectedMemoryId,
        type: state.editDraft.type,
        ...details.data,
        ...(reminder.data.enabled ? { reminder: reminder.data } : {}),
      },
    });
    return true;
  }, [state.editDraft, state.selectedMemoryId]);

  const closeEdit = useCallback(() => dispatch({ type: 'CLOSE_EDIT' }), []);
  const requestDelete = useCallback(
    () => dispatch({ type: 'REQUEST_DELETE' }),
    [],
  );
  const cancelDelete = useCallback(
    () => dispatch({ type: 'CANCEL_DELETE' }),
    [],
  );
  const confirmDelete = useCallback(
    () => dispatch({ type: 'CONFIRM_DELETE' }),
    [],
  );

  return {
    state,
    visibleItems,
    selectedMemory,
    relationshipSummary,
    openFilter,
    updateStagedFilter,
    applyFilter,
    closeFilter,
    clearFilter,
    openCreate,
    selectCreateType,
    updateCreateDetails,
    updateCreateReminder,
    nextCreateStep,
    previousCreateStep,
    closeCreate,
    completeCreate,
    openEdit,
    updateEditDraft,
    saveEdit,
    closeEdit,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
