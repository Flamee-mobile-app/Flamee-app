import { render } from '@testing-library/react-native';

import { FlameeIcon } from './FlameeIcon';

describe('FlameeIcon', () => {
  it.each(['mood', 'ai'] as const)('renders the %s Flamee icon', async (name) => {
    const screen = await render(<FlameeIcon color="#FF7158" name={name} size={24} />);

    expect(screen.getByTestId(`flamee-icon-${name}`)).toBeTruthy();
  });
});
