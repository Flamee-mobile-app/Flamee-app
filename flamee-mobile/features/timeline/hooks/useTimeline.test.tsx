import { act, renderHook } from '@testing-library/react-native';

import {
  createInitialTimelineState,
  timelineReducer,
  useTimeline,
} from './useTimeline';

const referenceDate = new Date('2026-05-31T00:00:00.000Z');

describe('timelineReducer', () => {
  it('opens create at step one and clears the draft when closed', () => {
    const initialState = createInitialTimelineState(referenceDate);
    const opened = timelineReducer(initialState, { type: 'OPEN_CREATE' });
    const selected = timelineReducer(opened, {
      type: 'SELECT_CREATE_TYPE',
      timelineType: 'together',
    });
    const closed = timelineReducer(selected, { type: 'CLOSE_CREATE' });

    expect(opened).toMatchObject({ view: 'create', createStep: 1 });
    expect(selected.createDraft.type).toBe('together');
    expect(closed).toMatchObject({
      view: 'overview',
      createStep: 1,
      createDraft: { recurrence: 'none' },
    });
  });

  it('cancels staged filters without changing the applied filter', () => {
    const initialState = createInitialTimelineState(referenceDate);
    const opened = timelineReducer(initialState, { type: 'OPEN_FILTER' });
    const staged = timelineReducer(opened, {
      type: 'UPDATE_STAGED_FILTER',
      patch: { status: 'past' },
    });
    const closed = timelineReducer(staged, { type: 'CLOSE_FILTER' });

    expect(closed.appliedFilter.status).toBe('all');
    expect(closed.stagedFilter.status).toBe('all');
    expect(closed.view).toBe('overview');
  });
});

describe('useTimeline', () => {
  it('applies staged filters only after confirmation', async () => {
    const { result } = await renderHook(() => useTimeline(referenceDate));

    await act(async () => {
      result.current.openFilter();
    });
    await act(async () => {
      result.current.updateStagedFilter({ status: 'past' });
    });

    expect(result.current.state.appliedFilter.status).toBe('all');

    await act(async () => {
      result.current.applyFilter();
    });

    expect(result.current.state.appliedFilter.status).toBe('past');
    expect(result.current.visibleItems).toHaveLength(0);
  });

  it('validates each create step and omits disabled reminder data', async () => {
    const { result } = await renderHook(() => useTimeline(referenceDate));

    await act(async () => {
      result.current.openCreate();
    });
    await act(async () => {
      result.current.nextCreateStep();
    });
    expect(result.current.state.createStep).toBe(1);
    expect(result.current.state.validationErrors.type).toBeTruthy();

    await act(async () => {
      result.current.selectCreateType('birthday');
    });
    await act(async () => {
      result.current.nextCreateStep();
    });
    expect(result.current.state.createStep).toBe(2);

    await act(async () => {
      result.current.updateCreateDetails({
        title: 'Sinh nhật của em',
        eventDate: '2026-07-01',
        recurrence: 'yearly',
      });
    });
    await act(async () => {
      result.current.nextCreateStep();
    });
    expect(result.current.state.createStep).toBe(3);

    await act(async () => {
      result.current.updateCreateReminder({ enabled: false });
    });
    await act(async () => {
      result.current.completeCreate();
    });

    expect(result.current.state.view).toBe('overview');
    expect(result.current.state.items).toHaveLength(4);
    const createdTimeline = result.current.state.items.at(-1);
    expect(createdTimeline).toMatchObject({
      type: 'birthday',
      title: 'Sinh nhật của em',
    });
    expect(createdTimeline).not.toHaveProperty('reminder');
  });

  it('preserves the create draft when moving backward', async () => {
    const { result } = await renderHook(() => useTimeline(referenceDate));

    await act(async () => {
      result.current.openCreate();
    });
    await act(async () => {
      result.current.selectCreateType('special');
    });
    await act(async () => {
      result.current.nextCreateStep();
    });
    await act(async () => {
      result.current.updateCreateDetails({
        title: 'Một ngày đặc biệt',
        eventDate: '2026-08-20',
        recurrence: 'none',
      });
    });
    await act(async () => {
      result.current.nextCreateStep();
    });
    await act(async () => {
      result.current.previousCreateStep();
    });

    expect(result.current.state.createStep).toBe(2);
    expect(result.current.state.createDraft.title).toBe('Một ngày đặc biệt');
  });

  it('prefills, saves, and deletes an existing timeline through explicit confirmation', async () => {
    const { result } = await renderHook(() => useTimeline(referenceDate));

    await act(async () => {
      result.current.openEdit('movie-date');
    });
    expect(result.current.state.editDraft?.title).toBe('Đi xem phim');

    await act(async () => {
      result.current.updateEditDraft({ title: 'Đi xem phim cùng nhau' });
    });
    await act(async () => {
      result.current.saveEdit();
    });
    expect(result.current.state.items.find((item) => item.id === 'movie-date')?.title).toBe(
      'Đi xem phim cùng nhau',
    );

    await act(async () => {
      result.current.openEdit('movie-date');
    });
    await act(async () => {
      result.current.requestDelete();
    });
    await act(async () => {
      result.current.cancelDelete();
    });
    expect(result.current.state.items.some((item) => item.id === 'movie-date')).toBe(true);

    await act(async () => {
      result.current.requestDelete();
    });
    await act(async () => {
      result.current.confirmDelete();
    });
    expect(result.current.state.items.some((item) => item.id === 'movie-date')).toBe(false);
    expect(result.current.state.view).toBe('overview');
  });
});
