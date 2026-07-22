import { BOTTOM_NAV_BAR_HEIGHT } from '@/shared/components/ui/bottomNavLayout';

const MASCOT_BOTTOM_GAP = 18;
const MASCOT_SIDE_GAP = 12;
const MASCOT_MIN_HALO_RADIUS = 64;
const MASCOT_MAX_HALO_RADIUS = 88;
const MASCOT_BUBBLE_MIN_WIDTH = 220;
const MASCOT_BUBBLE_MAX_WIDTH = 280;
const MASCOT_BUBBLE_MAX_HEIGHT = 80;

export const MASCOT_VISUAL_SIZE = 64;
export const MASCOT_ACTION_HIT_SIZE = 36;

type MascotBottomOffsetInput = {
  bottomNavFrame: { y: number; height: number } | null;
  safeBottom: number;
  windowHeight: number;
};

type MascotHaloLayoutInput = {
  window: { width: number; height: number };
  safeArea: { left: number; right: number; bottom: number };
  bottomNavFrame: { y: number; height: number } | null;
};

type MascotHaloActionId = 'mood' | 'ai';

type MascotHaloActionPosition = {
  id: MascotHaloActionId;
  offsetX: number;
  offsetY: number;
  labelSide: 'left';
};

export type MascotHaloLayout = {
  anchor: { right: number; bottom: number };
  bubble: { width: number; offsetX: number; offsetY: number };
  actions: readonly [MascotHaloActionPosition, MascotHaloActionPosition];
  mascotCenter: { x: number; y: number };
};

type MascotHaloActionFrame = {
  x: number;
  y: number;
  right: number;
  bottom: number;
};

export function getMascotBottomOffset({
  bottomNavFrame,
  safeBottom,
  windowHeight,
}: MascotBottomOffsetInput) {
  const navigationClearance = bottomNavFrame
    ? Math.max(0, windowHeight - bottomNavFrame.y)
    : BOTTOM_NAV_BAR_HEIGHT;

  return Math.max(safeBottom, navigationClearance) + MASCOT_BOTTOM_GAP;
}

export function resolveMascotHaloLayout({
  bottomNavFrame,
  safeArea,
  window,
}: MascotHaloLayoutInput): MascotHaloLayout {
  const anchor = {
    right: safeArea.right + MASCOT_SIDE_GAP,
    bottom: getMascotBottomOffset({
      bottomNavFrame,
      safeBottom: safeArea.bottom,
      windowHeight: window.height,
    }),
  };
  const mascotCenter = {
    x: window.width - anchor.right - MASCOT_VISUAL_SIZE / 2,
    y: window.height - anchor.bottom - MASCOT_VISUAL_SIZE / 2,
  };
  const navigationTop = bottomNavFrame?.y ?? window.height;
  const maximumHorizontalRadius = Math.max(
    MASCOT_ACTION_HIT_SIZE,
    mascotCenter.x - safeArea.left - MASCOT_ACTION_HIT_SIZE / 2,
  );
  const maximumVerticalRadius = Math.max(
    MASCOT_ACTION_HIT_SIZE,
    (mascotCenter.y - MASCOT_ACTION_HIT_SIZE / 2) / 0.82,
    navigationTop - mascotCenter.y - MASCOT_ACTION_HIT_SIZE / 2,
  );
  const preferredRadius = clamp(window.width * 0.21, MASCOT_MIN_HALO_RADIUS, MASCOT_MAX_HALO_RADIUS);
  const radius = Math.min(preferredRadius, maximumHorizontalRadius, maximumVerticalRadius);
  const bubbleWidth = clamp(
    mascotCenter.x + MASCOT_VISUAL_SIZE / 2 - safeArea.left - MASCOT_SIDE_GAP,
    MASCOT_BUBBLE_MIN_WIDTH,
    MASCOT_BUBBLE_MAX_WIDTH,
  );

  return {
    anchor,
    bubble: {
      width: bubbleWidth,
      offsetX: MASCOT_VISUAL_SIZE / 2 - bubbleWidth,
      offsetY: -MASCOT_VISUAL_SIZE - 60,
    },
    actions: [
      { id: 'mood', offsetX: -bubbleWidth + 24, offsetY: 12, labelSide: 'left' },
      { id: 'ai', offsetX: -bubbleWidth + 64, offsetY: 12, labelSide: 'left' },
    ],
    mascotCenter,
  };
}

export function getMascotHaloActionFrame(
  layout: MascotHaloLayout,
  actionId: MascotHaloActionId,
): MascotHaloActionFrame {
  const action = layout.actions.find(({ id }) => id === actionId);

  if (!action) {
    throw new Error(`Unknown mascot halo action: ${actionId}`);
  }

  const x = layout.mascotCenter.x + action.offsetX - MASCOT_ACTION_HIT_SIZE / 2;
  const y = layout.mascotCenter.y + action.offsetY - MASCOT_ACTION_HIT_SIZE / 2;

  return {
    x,
    y,
    right: x + MASCOT_ACTION_HIT_SIZE,
    bottom: y + MASCOT_ACTION_HIT_SIZE,
  };
}

export function getMascotHaloBubbleFrame(layout: MascotHaloLayout) {
  const x = layout.mascotCenter.x + layout.bubble.offsetX;
  const y = layout.mascotCenter.y + layout.bubble.offsetY;

  return {
    x,
    y,
    width: layout.bubble.width,
    right: x + layout.bubble.width,
    bottom: y + MASCOT_BUBBLE_MAX_HEIGHT,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
