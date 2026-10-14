/**
 * Bjorklund's algorithm for Euclidean rhythm generation.
 * Generates an array of booleans of length `steps`, containing `pulses` active hits as evenly spaced as possible.
 */
export function generateEuclideanRhythm(steps: number, pulses: number, rotation: number = 0): boolean[] {
  const nSteps = Math.max(1, Math.min(64, Math.round(steps)));
  const nPulses = Math.max(0, Math.min(nSteps, Math.round(pulses)));

  if (nPulses === 0) {
    return new Array(nSteps).fill(false);
  }
  if (nPulses >= nSteps) {
    return new Array(nSteps).fill(true);
  }

  const pattern: number[][] = [];
  for (let i = 0; i < nPulses; i++) {
    pattern.push([1]);
  }
  for (let i = 0; i < nSteps - nPulses; i++) {
    pattern.push([0]);
  }

  let count = nSteps - nPulses;
  let numSubarrays = nPulses;

  while (count > 0 && numSubarrays > 0) {
    const minCount = Math.min(numSubarrays, count);
    for (let i = 0; i < minCount; i++) {
      pattern[i] = pattern[i].concat(pattern[pattern.length - 1 - i]);
    }
    pattern.splice(pattern.length - minCount, minCount);
    count = count - minCount;
    numSubarrays = minCount;
  }

  const flat: boolean[] = [];
  for (const group of pattern) {
    for (const val of group) {
      flat.push(val === 1);
    }
  }

  // Handle rotation
  const rotated: boolean[] = new Array(flat.length);
  const rot = ((rotation % flat.length) + flat.length) % flat.length;
  for (let i = 0; i < flat.length; i++) {
    rotated[(i + rot) % flat.length] = flat[i];
  }

  return rotated;
}
