export interface DistItem {
  name: string;
  percent: number;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const round = (value: number, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const getRemainingPercent = (items: DistItem[]) => {
  const total = items.reduce((sum, item) => sum + item.percent, 0);
  return round(Math.max(0, 100 - total), 0);
};

export const normalizeDistribution = (
  items: DistItem[],
  changedIndex: number,
  nextValue: number
) => {
  if (!items.length) return [];

  const clamped = clamp(nextValue);
  const next = items.map((item) => ({ ...item }));
  const remaining = 100 - clamped;
  const totalOthers = items.reduce(
    (sum, item, idx) => (idx === changedIndex ? sum : sum + item.percent),
    0
  );

  next[changedIndex].percent = clamped;

  if (items.length === 1) {
    next[0].percent = 100;
    return next;
  }

  if (totalOthers <= 0) {
    const evenSplit = remaining / (items.length - 1);
    next.forEach((item, idx) => {
      if (idx !== changedIndex) {
        item.percent = evenSplit;
      }
    });
  } else {
    const scale = remaining / totalOthers;
    next.forEach((item, idx) => {
      if (idx !== changedIndex) {
        item.percent = item.percent * scale;
      }
    });
  }

  // Normalize rounding drift to keep total at 100%
  const rounded = next.map((item) => ({
    ...item,
    percent: round(item.percent, 0),
  }));
  const totalRounded = rounded.reduce((sum, item) => sum + item.percent, 0);
  const diff = round(100 - totalRounded, 0);
  if (Math.abs(diff) > 0.01) {
    const targetIndex =
      changedIndex === 0 ? 1 : Math.min(changedIndex, rounded.length - 1);
    rounded[targetIndex].percent = clamp(rounded[targetIndex].percent + diff);
  }

  return rounded;
};
