import { render } from '@testing-library/react-native';

import { FlameeIcon } from './FlameeIcon';

describe('FlameeIcon', () => {
  it('renders the canonical Home artwork without a fill', async () => {
    const screen = await render(
      <FlameeIcon color="#FFFFFF" filled={false} name="home" size={32} />,
    );

    expect(screen.getByTestId('flamee-icon-home')).toBeTruthy();
    expect(screen.getByTestId('flamee-icon-home-roof').props.fill).toBeNull();
    expect(screen.getByTestId('flamee-icon-home-body').props.fill).toBeNull();
    expect(screen.getByTestId('flamee-icon-home-heart').props.fill).toBeNull();
  });

  it.each(['mood', 'ai'] as const)('renders the %s Flamee icon', async (name) => {
    const screen = await render(<FlameeIcon color="#FF7158" name={name} size={24} />);

    expect(screen.getByTestId(`flamee-icon-${name}`)).toBeTruthy();
  });
});
