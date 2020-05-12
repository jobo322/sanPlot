import { simpleNormInv } from './simpleNormInv';

export function determineCutOff(signPositive, options = {}) {
    let {
        magnitudeMode = false,
        considerList = {from: 0.5, step: 0.1, to: 0.9},
    } = options;
    //generate a list of values for 
    let cutOff = [];
    let indexMax = signPositive.length - 1;
    for (let i = 0.01; i <= 0.99; i += 0.01) {
        let index = Math.round(indexMax * i)
        let value = -signPositive[index] / simpleNormInv([i/2], { magnitudeMode })
        cutOff.push([i, value]);
    }

    let minKi = Number.MAX_SAFE_INTEGER;
    let { from, to, step } = considerList;
    let delta = step  / 2;
    let whereToCutStat = 0.5;
    for (let i = from; i <= to; i += step) {
        let floor = i - delta;
        let top = i + delta;
        let elementsOfCutOff = cutOff.filter((e) => e[0] < top && e[0] > floor);
        let averageValue = elementsOfCutOff.reduce((a, b) => a + Math.abs(b[1]), 0);
        let kiSqrt = 0;
        for (let j = 0; j < elementsOfCutOff.length; j++) {
            kiSqrt += Math.pow( elementsOfCutOff[j][1] - averageValue, 2 ) 
        }

        if (kiSqrt < minKi) {
            minKi = kiSqrt;
            whereToCutStat = i;
        }
    }

    return whereToCutStat;
}
