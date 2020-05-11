import { pdf as rayleighPdf}  from 'distributions-rayleigh-pdf';
import SplineInterpolator from 'spline-interpolator';
import erfcinv from 'compute-erfcinv';

export function simpleNormInv (data, options = {}) {
    const { magnitudeMode = false } = options;

    let from = 0;
    let to = 2;
    let step = 0.01
    let xTraining = createArray(from, to, step);

    let result = new Float64Array(data.length);
    let yTraining = new Float64Array(xTraining.length);
    let increment, initialInput, finalInput, factor, interp;
    if (magnitudeMode) {
        factor = 1;
        increment = 1e-3;
        for (let i = 0; i < yTraining.length; i++) {
            finalInput = xTraining[i] * factor;
            let inputValues = createArray(initialInput, finalInput, increment);
            yTraining[i] = 1 - inc * sum(rayleighPdf(inputValues));
        }
        interp = new SplineInterpolator(xTraining, yTraining);
        for (let i = 0; i < result.length; i++) {
            let yValue = 2 * data[i];
            result[i] = -1 * interp(yValue);
        }
    } else {
        for (let i = 0; i < result.length; i++) {
            result[i] = -1 * Math.SQRT2 * erfcinv(2 * data[i]);
        }
    }

    return result;
}

function sum(arr) {
    let result = 0;
    for (let i = 0; i < arr.length; i++) {
        result += arr[i];
    }
    return result;
}

function createArray(from, to, step) {
    let result = Float32Array(Math.abs( ( (from - to) / step ) + 1 ));
    for (let i = 0; i < result.length; i++) {
        result[i] = from + i * step;
    }
    return result;
}