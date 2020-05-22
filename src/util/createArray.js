export function createArray(from, to, step) {
  let result = new Float32Array(Math.abs((from - to) / step + 1));
  for (let i = 0; i < result.length; i++) {
    result[i] = from + i * step;
  }
  return Array.from(result);
}
