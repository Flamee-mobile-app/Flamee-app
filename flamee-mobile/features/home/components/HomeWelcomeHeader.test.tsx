import { render } from '@testing-library/react-native';

import { HomeWelcomeHeader } from './HomeWelcomeHeader';

describe('HomeWelcomeHeader', () => {
  it('renders the time-aware greeting and supporting quote', async () => {
    const screen = await render(
      <HomeWelcomeHeader
        content={{
          greeting: 'Chào buổi sáng',
          quote: 'Tình yêu được nuôi dưỡng từ những kỷ niệm.',
        }}
        greetingStyle={{ opacity: 1, transform: [{ translateY: 0 }] }}
        quoteStyle={{ opacity: 1, transform: [{ translateY: 0 }] }}
      />,
    );

    expect(screen.getByTestId('home-welcome-header')).toBeTruthy();
    expect(screen.getByText('Chào buổi sáng')).toBeTruthy();
    expect(screen.getByText('Tình yêu được nuôi dưỡng từ những kỷ niệm.')).toBeTruthy();
    expect(screen.queryByText('FLAMEE HÔM NAY')).toBeNull();
  });
});
