import { useCallback, useMemo, useReducer } from 'react';
import type { ZodIssue } from 'zod';

import {
  timelineDetailsSchema,
  timelineReminderSchema,
  type TimelineDetailsValues,
  type TimelineReminderValues,
} from '@/features/timeline/schemas/timelineSchema';
import {
  addTimeline,
  createTimelineSeed,
  createRelationshipSummary,
  filterTimeline,
  removeTimeline,
  updateTimeline,
} from '@/features/timeline/services/timelineService';
import type {
  CreateTimelineStep,
  TimelineView,
  TimelineDraft,
  TimelineFilter,
  TimelineItem,
  TimelineType,
} from '@/features/timeline/types';

export const DEFAULT_TIMELINE_FILTER: TimelineFilter = {
  status: 'all',
  type: 'all',
  range: 'all',
};

const EMPTY_CREATE_DRAFT: Partial<TimelineDraft> = {
  recurrence: 'none',
};

const EMPTY_REMINDER: TimelineReminderValues = {
  enabled: false,
};

export type TimelineState = {
  items: TimelineItem[];
  view: TimelineView;
  createStep: CreateTimelineStep;
  createDraft: Partial<TimelineDraft>;
  createReminder: TimelineReminderValues;
  selectedTimelineId?: string;
  editDraft?: TimelineDraft;
  appliedFilter: TimelineFilter;
  stagedFilter: TimelineFilter;
  validationErrors: Record<string, string>;
  deleteConfirmationVisible: boolean;
  nextTimelineSequence: number;
};

type TimelineAction =
  | { type: 'OPEN_FILTER' }
  | { type: 'UPDATE_STAGED_FILTER'; patch: Partial<TimelineFilter> }
  | { type: 'APPLY_FILTER' }
  | { type: 'CLOSE_FILTER' }
  | { type: 'CLEAR_FILTER' }
  | { type: 'OPEN_CREATE' }
  | { type: 'SELECT_CREATE_TYPE'; timelineType: TimelineType }
  | { type: 'UPDATE_CREATE_DETAILS'; patch: Partial<TimelineDetailsValues> }
  | { type: 'UPDATE_CREATE_REMINDER'; reminder: TimelineReminderValues }
  | { type: 'SET_VALIDATION_ERRORS'; errors: Record<string, string> }
  | { type: 'SET_CREATE_STEP'; step: CreateTimelineStep }
  | { type: 'CLOSE_CREATE' }
  | { type: 'ADD_MEMORY'; timeline: TimelineItem }
  | { type: 'OPEN_EDIT'; timelineId: string }
  | { type: 'UPDATE_EDIT_DRAFT'; patch: Partial<TimelineDraft> }
  | { type: 'SAVE_EDIT'; timeline: TimelineItem }
  | { type: 'CLOSE_EDIT' }
  | { type: 'REQUEST_DELETE' }
  | { type: 'CANCEL_DELETE' }
  | { type: 'CONFIRM_DELETE' };

function resetCreateState(state: TimelineState): TimelineState {
  return {
    ...state,
    view: 'overview',
    createStep: 1,
    createDraft: { ...EMPTY_CREATE_DRAFT },
    createReminder: { ...EMPTY_REMINDER },
    validationErrors: {},
  };
}

export function createInitialTimelineState(
  referenceDate = new Date(),
): TimelineState {
  return {
    items: createTimelineSeed(referenceDate),
    view: 'overview',
    createStep: 1,
    createDraft: { ...EMPTY_CREATE_DRAFT },
    createReminder: { ...EMPTY_REMINDER },
    appliedFilter: { ...DEFAULT_TIMELINE_FILTER },
    stagedFilter: { ...DEFAULT_TIMELINE_FILTER },
    validationErrors: {},
    deleteConfirmationVisible: false,
    nextTimelineSequence: 1,
  };
}

export function timelineReducer(
  state: TimelineState,
  action: TimelineAction,
): TimelineState {
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
        stagedFilter: { ...DEFAULT_TIMELINE_FILTER },
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
        createDraft: { ...state.createDraft, type: action.timelineType },
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
        items: addTimeline(state.items, action.timeline),
        nextTimelineSequence: state.nextTimelineSequence + 1,
      });
    case 'OPEN_EDIT': {
      const timeline = state.items.find((item) => item.id === action.timelineId);

      if (!timeline) {
        return state;
      }

      const { id: _id, ...editDraft } = timeline;
      return {
        ...state,
        view: 'edit',
        selectedTimelineId: timeline.id,
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
        items: updateTimeline(state.items, action.timeline),
        view: 'overview',
        selectedTimelineId: undefined,
        editDraft: undefined,
        validationErrors: {},
      };
    case 'CLOSE_EDIT':
      return {
        ...state,
        view: 'overview',
        selectedTimelineId: undefined,
        editDraft: undefined,
        validationErrors: {},
        deleteConfirmationVisible: false,
      };
    case 'REQUEST_DELETE':
      return state.selectedTimelineId
        ? { ...state, deleteConfirmationVisible: true }
        : state;
    case 'CANCEL_DELETE':
      return { ...state, deleteConfirmationVisible: false };
    case 'CONFIRM_DELETE':
      if (!state.selectedTimelineId) {
        return state;
      }

      return {
        ...state,
        items: removeTimeline(state.items, state.selectedTimelineId),
        view: 'overview',
        selectedTimelineId: undefined,
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

function parseCreateDetails(draft: Partial<TimelineDraft>) {
  return timelineDetailsSchema.safeParse({
    title: draft.title,
    eventDate: draft.eventDate,
    recurrence: draft.recurrence,
    coverAssetKey: draft.coverAssetKey,
    note: draft.note,
  });
}

export function useTimeline(referenceDate = new Date()) {
  const [state, dispatch] = useReducer(
    timelineReducer,
    referenceDate,
    createInitialTimelineState,
  );

  const visibleItems = useMemo(
    () => filterTimeline(state.items, state.appliedFilter, referenceDate),
    [referenceDate, state.appliedFilter, state.items],
  );
  const selectedTimeline = useMemo(
    () => state.items.find((item) => item.id === state.selectedTimelineId),
    [state.items, state.selectedTimelineId],
  );
  const relationshipSummary = useMemo(() => createRelationshipSummary(), []);

  const openFilter = useCallback(() => dispatch({ type: 'OPEN_FILTER' }), []);
  const updateStagedFilter = useCallback(
    (patch: Partial<TimelineFilter>) =>
      dispatch({ type: 'UPDATE_STAGED_FILTER', patch }),
    [],
  );
  const applyFilter = useCallback(() => dispatch({ type: 'APPLY_FILTER' }), []);
  const closeFilter = useCallback(() => dispatch({ type: 'CLOSE_FILTER' }), []);
  const clearFilter = useCallback(() => dispatch({ type: 'CLEAR_FILTER' }), []);
  const openCreate = useCallback(() => dispatch({ type: 'OPEN_CREATE' }), []);
  const selectCreateType = useCallback(
    (timelineType: TimelineType) =>
      dispatch({ type: 'SELECT_CREATE_TYPE', timelineType }),
    [],
  );
  const updateCreateDetails = useCallback(
    (patch: Partial<TimelineDetailsValues>) =>
      dispatch({ type: 'UPDATE_CREATE_DETAILS', patch }),
    [],
  );
  const updateCreateReminder = useCallback(
    (reminder: TimelineReminderValues) =>
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
        step: (state.createStep - 1) as CreateTimelineStep,
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
    const reminder = timelineReminderSchema.safeParse(state.createReminder);
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

    const timeline: TimelineItem = {
      id: `timeline-${state.nextTimelineSequence}`,
      type: state.createDraft.type,
      ...details.data,
      ...(reminder.data.enabled ? { reminder: reminder.data } : {}),
    };
    dispatch({ type: 'ADD_MEMORY', timeline });
    return true;
  }, [state.createDraft, state.createReminder, state.nextTimelineSequence]);

  const openEdit = useCallback(
    (timelineId: string) => dispatch({ type: 'OPEN_EDIT', timelineId }),
    [],
  );
  const updateEditDraft = useCallback(
    (patch: Partial<TimelineDraft>) =>
      dispatch({ type: 'UPDATE_EDIT_DRAFT', patch }),
    [],
  );
  const saveEdit = useCallback(() => {
    if (!state.selectedTimelineId || !state.editDraft) {
      return false;
    }

    const details = parseCreateDetails(state.editDraft);
    const reminder = timelineReminderSchema.safeParse(
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
      timeline: {
        id: state.selectedTimelineId,
        type: state.editDraft.type,
        ...details.data,
        ...(reminder.data.enabled ? { reminder: reminder.data } : {}),
      },
    });
    return true;
  }, [state.editDraft, state.selectedTimelineId]);

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
    selectedTimeline,
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
