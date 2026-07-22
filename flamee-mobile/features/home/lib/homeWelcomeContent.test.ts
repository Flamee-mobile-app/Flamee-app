import { getHomeWelcomeContent } from './homeWelcomeContent';

describe('getHomeWelcomeContent', () => {
  it.each([
    [5, 'Chào buổi sáng'],
    [11, 'Chào buổi trưa'],
    [14, 'Chào buổi chiều'],
    [18, 'Chào buổi tối'],
  ])('uses %s:00 for %s', (hour, greeting) => {
    expect(getHomeWelcomeContent(new Date(2026, 6, 23, hour)).greeting).toBe(greeting);
  });

  it('keeps the quote deterministic for the same calendar day', () => {
    expect(getHomeWelcomeContent(new Date(2026, 6, 23, 8)).quote).toBe(
      getHomeWelcomeContent(new Date(2026, 6, 23, 20)).quote,
    );
  });
});
