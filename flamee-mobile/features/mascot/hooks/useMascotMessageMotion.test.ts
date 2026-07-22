import { act, renderHook } from '@testing-library/react-native';

import {
  MASCOT_MESSAGE_MOTION_DURATION,
  useMascotMessageMotion,
} from './useMascotMessageMotion';

type MotionProps = { isExpanded: boolean };

describe('useMascotMessageMotion', () => {
  it('uses the shared 200 ms contract and mounts an expanded bubble when requested', async () => {
    const { result, rerender } = await renderHook<
      ReturnType<typeof useMascotMessageMotion>,
      MotionProps
    >(
      ({ isExpanded }) => useMascotMessageMotion(isExpanded),
      { initialProps: { isExpanded: false } },
    );

    expect(MASCOT_MESSAGE_MOTION_DURATION).toBe(200);
    expect(result.current.shouldRenderExpandedBubble).toBe(false);

    await act(async () => {
      rerender({ isExpanded: true });
    });

    expect(result.current.shouldRenderExpandedBubble).toBe(true);
  });
});
