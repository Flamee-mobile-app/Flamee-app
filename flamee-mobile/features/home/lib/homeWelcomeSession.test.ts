import {
  consumeHomeWelcomeSession,
  resetHomeWelcomeSessionForTests,
} from './homeWelcomeSession';

describe('home welcome session', () => {
  beforeEach(resetHomeWelcomeSessionForTests);

  it('consumes the welcome entrance once per session', () => {
    expect(consumeHomeWelcomeSession()).toBe(true);
    expect(consumeHomeWelcomeSession()).toBe(false);
  });
});
