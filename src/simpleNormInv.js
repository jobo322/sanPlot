import erfcinv from 'compute-erfcinv';
import rayleighCdf from 'distributions-rayleigh-cdf';
import SplineInterpolator from 'spline-interpolator';

export function simpleNormInv(data, options = {}) {
  const { magnitudeMode = false } = options;

  if (!Array.isArray(data)) data = [data];

  let from = 0;
  let to = 2;
  let step = 0.01;
  let xTraining = createArray(from, to, step);

  let result = new Float64Array(data.length);
  let yTraining = new Float64Array(xTraining.length);
  if (magnitudeMode) {
    let factor = 1;
    for (let i = 0; i < yTraining.length; i++) {
      let finalInput = xTraining[i] * factor;
      yTraining[i] = 1 - rayleighCdf(finalInput);
    }
    let interp = new SplineInterpolator(xTraining, yTraining);
    for (let i = 0; i < result.length; i++) {
      let yValue = 2 * data[i];
      result[i] = -1 * interp.interpolate(yValue);
    }
  } else {
    for (let i = 0; i < result.length; i++) {
      result[i] = -1 * Math.SQRT2 * erfcinv(2 * data[i]);
    }
  }
  return result.length === 1 ? result[0] : result;
}

function createArray(from, to, step) {
  let result = new Float32Array(Math.abs((from - to) / step + 1));
  for (let i = 0; i < result.length; i++) {
    result[i] = from + i * step;
  }
  return Array.from(result);
}
