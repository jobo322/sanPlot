import { getNoiseLevel } from '../src/sanPlot';
import random from 'distributions-normal-random';
import { createArray } from '../src/util/createArray';

describe('phaseCorrection', () => {
  it('test phaseCorrection even', () => {
    let width = 0.008;
    let shift = 8.08;
    let x = createArray(4, 10, 0.001);
    let re = new Float32Array(x.length);
    let factor = 1 / width / Math.sqrt(2 * Math.PI);
    let denominator = 0.5 / Math.pow(width, 2);
    for (let i = re.length / 2; i < re.length; i++) {
      re[i] = factor * Math.exp(-Math.pow(x[i] - shift, 2) * denominator);
    }
    addNoise(re, 0, 1, 22);
    let result = getNoiseLevel(re, {refine: true});
    expect(result.positive).toBeCloseTo(1, 1);
  });
});

function addNoise(arr, mu, sigma, seed) {
  
  let noise = random(arr.length, { mu, sigma, seed });
  for (let i = 0; i < arr.length; i++) {
    let randomValue = Math.random() //* 6 - 3;
    arr[i] += noise[i];
  }
}
