import { determineCutOff } from './determineCutOff';
import { simpleNormInv } from './simpleNormInv';

export function getNoiseLevel(data, options = {}) {
  const {
    mask,
    cutOff,
    refine = true,
    magnitudeMode = false,
    scaleFactor = 1,
    factorStd = 5,
    fixOffset = true,
  } = options;

  let input;
  if (Array.isArray(mask) && mask.length === data.length) {
    input = data.filter((_e, i) => !mask[i]);
  } else {
    input = data.slice();
  }

  if (scaleFactor > 1) {
    for (let i = 0; i < input.length; i++) {
      input[i] *= scaleFactor;
    }
  }

  input.sort((a, b) => b - a);

  if (fixOffset && !magnitudeMode) {
    let medianIndex = Math.floor(input.length / 2);
    let median = 0.5 * (input[medianIndex] + input[medianIndex + 1]);
    for (let i = 0; i < input.length; i++) {
      input[i] -= median;
    }
  }

  let firstNegativeValueIndex = input.findIndex((e) => e < 0);
  let lastPositiveValueIndex = firstNegativeValueIndex - 1;
  for (let i = lastPositiveValueIndex; i >= 0; i--) {
    if (input[i] > 0) {
      lastPositiveValueIndex = i;
      break;
    }
  }

  let signPositive = new Float64Array(
    input.slice(0, lastPositiveValueIndex + 1),
  );
  let signNegative = new Float64Array(input.slice(firstNegativeValueIndex));

  let cutOffDist = cutOff || determineCutOff(signPositive, { magnitudeMode });

  let pIndex = Math.floor(signPositive.length * cutOffDist);
  let initialNoiseLevelPositive = signPositive[pIndex];

  let skyPoint = signPositive[0];

  let initialNoiseLevelNegative;
  if (signNegative.length > 0) {
    let nIndex = Math.floor(signNegative.length * (1 - cutOffDist));
    initialNoiseLevelNegative = -1 * signNegative[nIndex];
  } else {
    initialNoiseLevelNegative = 0;
  }

  let noiseLevelPositive = initialNoiseLevelPositive;
  let noiseLevelNegative = initialNoiseLevelNegative;
  let cloneSignPositive = signPositive.slice();
  let cloneSignNegative = signNegative.slice();

  let cutOffSignalsIndexPlus = 0;
  let cutOffSignalsIndexNeg = 2;
  if (refine) {
    let cutOffSignals = noiseLevelPositive * factorStd;
    cutOffSignalsIndexPlus = signPositive.findIndex((e) => e < cutOffSignals);

    if (cutOffSignalsIndexPlus > -1) {
      cloneSignPositive = signPositive.slice(cutOffSignalsIndexPlus);
      noiseLevelPositive =
        cloneSignPositive[Math.floor(cloneSignPositive.length * cutOffDist)];
    }

    cutOffSignals = noiseLevelNegative * factorStd;
    cutOffSignalsIndexNeg = signNegative.findIndex((e) => e < cutOffSignals);
    if (cutOffSignalsIndexNeg > -1) {
      cloneSignNegative = signNegative.slice(cutOffSignalsIndexNeg);
      noiseLevelNegative =
        cloneSignPositive[
          Math.floor(cloneSignNegative.length * (1 - cutOffDist))
        ];
    }
  }
  let correctionFactor = -simpleNormInv(cutOffDist / 2, { magnitudeMode });
  initialNoiseLevelPositive = initialNoiseLevelPositive / correctionFactor;
  initialNoiseLevelNegative = initialNoiseLevelNegative / correctionFactor;

  let effectiveCutOffDist, refinedCorrectionFactor;
  if (refine && cutOffSignalsIndexPlus > -1) {
    effectiveCutOffDist =
      (cutOffDist * cloneSignPositive.length + cutOffSignalsIndexPlus) /
      (cloneSignPositive.length + cutOffSignalsIndexPlus);
    refinedCorrectionFactor =
      -1 * simpleNormInv(effectiveCutOffDist / 2, { magnitudeMode });

    noiseLevelPositive /= refinedCorrectionFactor;

    if (cutOffSignalsIndexNeg > -1) {
      effectiveCutOffDist =
        (cutOffDist * cloneSignNegative.length + cutOffSignalsIndexNeg) /
        (cloneSignNegative.length + cutOffSignalsIndexNeg);
      refinedCorrectionFactor =
        -1 * simpleNormInv(effectiveCutOffDist / 2, { magnitudeMode });
      if (noiseLevelNegative !== 0) {
        noiseLevelNegative /= refinedCorrectionFactor;
      }
    }
  } else {
    noiseLevelPositive /= correctionFactor;
    noiseLevelNegative /= correctionFactor;
  }

  return {
    positive: noiseLevelPositive,
    negative: noiseLevelNegative,
    snr: skyPoint / noiseLevelPositive,
  };
}
