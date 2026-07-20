import { memoryDetailsSchema, memoryReminderSchema } from './memorySchema';

describe('memoryDetailsSchema', () => {
  it('rejects a blank title and invalid calendar date', () => {
    const result = memoryDetailsSchema.safeParse({
      title: '  ',
      eventDate: '2026-02-31',
      recurrence: 'none',
    });

    expect(result.success).toBe(false);
  });

  it('accepts trimmed valid details', () => {
    const result = memoryDetailsSchema.safeParse({
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

describe('memoryReminderSchema', () => {
  it('accepts a disabled reminder without reminder-only fields', () => {
    expect(memoryReminderSchema.safeParse({ enabled: false }).success).toBe(true);
  });

  it('accepts a complete enabled reminder', () => {
    expect(
      memoryReminderSchema.safeParse({
        enabled: true,
        leadDays: 3,
        time: '09:00',
        recipient: 'couple',
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid enabled reminder time', () => {
    expect(
      memoryReminderSchema.safeParse({
        enabled: true,
        leadDays: 3,
        time: '25:90',
        recipient: 'self',
      }).success,
    ).toBe(false);
  });
});
