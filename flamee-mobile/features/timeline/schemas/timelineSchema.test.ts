import { timelineDetailsSchema, timelineReminderSchema } from './timelineSchema';

describe('timelineDetailsSchema', () => {
  it('rejects a blank title and invalid calendar date', () => {
    const result = timelineDetailsSchema.safeParse({
      title: '  ',
      eventDate: '2026-02-31',
      recurrence: 'none',
    });

    expect(result.success).toBe(false);
  });

  it('accepts trimmed valid details', () => {
    const result = timelineDetailsSchema.safeParse({
      title: '  Kỉ niệm đầu tiên  ',
      eventDate: '2026-06-12',
      recurrence: 'yearly',
      note: '  Một ngày đáng nhớ  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Kỉ niệm đầu tiên');
      expect(result.data.note).toBe('Một ngày đáng nhớ');
    }
  });
});

describe('timelineReminderSchema', () => {
  it('accepts a disabled reminder without reminder-only fields', () => {
    expect(timelineReminderSchema.safeParse({ enabled: false }).success).toBe(true);
  });

  it('accepts a complete enabled reminder', () => {
    expect(
      timelineReminderSchema.safeParse({
        enabled: true,
        leadDays: 3,
        time: '09:00',
        recipient: 'couple',
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid enabled reminder time', () => {
    expect(
      timelineReminderSchema.safeParse({
        enabled: true,
        leadDays: 3,
        time: '25:90',
        recipient: 'self',
      }).success,
    ).toBe(false);
  });
});
