export const percent = (p: number): number => {
  return Math.floor((p / 100) * 4294967295); // unit32 max value
};
