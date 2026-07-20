import {
  getMemoryContentWidth,
  getMemoryGridItemWidth,
  MEMORY_LAYOUT,
} from './memoryLayout';

describe('memories responsive layout', () => {
  it('keeps compact and standard phones inside their horizontal padding', () => {
    expect(getMemoryContentWidth(320)).toBe(272);
    expect(getMemoryContentWidth(402)).toBe(354);
  });

  it('caps tablet content at the approved design width', () => {
    expect(getMemoryContentWidth(430)).toBe(MEMORY_LAYOUT.maxContentWidth);
    expect(getMemoryContentWidth(768)).toBe(MEMORY_LAYOUT.maxContentWidth);
    expect(getMemoryContentWidth(1024)).toBe(MEMORY_LAYOUT.maxContentWidth);
  });

  it('derives two equal grid columns without overflow', () => {
    expect(getMemoryGridItemWidth(354)).toBe(
      (354 - MEMORY_LAYOUT.gridGap) / 2,
    );
    expect(getMemoryGridItemWidth(272)).toBe(
      (272 - MEMORY_LAYOUT.gridGap) / 2,
    );
  });

  it('never produces negative content or grid widths', () => {
    expect(getMemoryContentWidth(20)).toBe(0);
    expect(getMemoryGridItemWidth(8)).toBe(0);
  });
});
