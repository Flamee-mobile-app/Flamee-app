import { render } from '@testing-library/react-native';

import { MascotArtwork } from './MascotArtwork';
import { MascotRiveArtwork } from './MascotRiveArtwork';

describe('MascotArtwork', () => {
  it('renders official Figma mascot artwork for given mood', async () => {
    const screen = await render(<MascotArtwork mood="happy" />);
    expect(screen.getByTestId('flamee-mascot-artwork')).toBeTruthy();
  });
});

describe('MascotRiveArtwork', () => {
  it('renders mascot artwork fallback cleanly when Rive is unmounted', async () => {
    const screen = await render(<MascotRiveArtwork mood="calm" size={64} />);
    expect(screen.getByTestId('flamee-mascot-artwork')).toBeTruthy();
  });
});


