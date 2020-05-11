import { determineCutOff } from './determineCutOff';
import { simpleNormInv } from './simpleNormInv';

export function getNoiseLevel(data, options = {}) {
  const {
    cutOff,
    refine = true,
    magnitudeMode = false,
    scaleFactor = 1,
    factorStd = 5,
    fixOffset = true,
  } = options;

  let input = data.slice();
  if (scaleFactor > 1) {
    for (let i = 0; i < re.length; i++) {
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

  let cutOffDist = cutOff
    ? cutOff
    : determineCutOff(signPositive, { magnitudeMode });

  let initialNoiseLevelPositive =
    signPositive[Math.round(signPositive.length * cutOffDist)];

  let skyPoint = signPositive[0];

  let firstNoisePositiveIndex = signPositive.findIndex(
    (e) => e - initialNoiseLevelPositive === 0,
  ); //@TODO: check if is it robust
  let coordPointNoisePositive = [
    firstNoisePositiveIndex,
    initialNoiseLevelPositive,
  ];
  let coordPointNoiseNegRefined = coordPointNoisePositive;

  let initialNoiseLevelNegative;
  if (signNegative.length > 0) {
    initialNoiseLevelNegative =
      -1 * signNegative[Math.round(signNegative.length * (1 - cutOffDist))];
    let firstNoiseNegativeIndex =
      signNegative.length -
      signNegative.findIndex((e) => e + initialNoiseLevelNegative === 0); //@TODO: check if is it robust
    coordPointNoiseNegRefined = [
      firstNoiseNegativeIndex,
      initialNoiseLevelNegative,
    ];
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
        cloneSignPositive[Math.round(cloneSignPositive.length * cutOffDist)];
    }

    cutOffSignals = noiseLevelNegative * factorStd;
    cutOffSignalsIndexNeg = signNegative.findIndex((e) => e < cutOffSignals);
    if (cutOffSignalsIndexNeg > -1) {
      cloneSignNegative = signNegative.slice(cutOffSignalsIndexNeg);
      noiseLevelNegative =
        cloneSignPositive[
          Math.round(cloneSignNegative.length * (1 - cutOffDist))
        ];
    }
  }

  let correctionFactor = -simpleNormInv(cutOffDist / 2, { magnitudeMode });
  initialNoiseLevelPositive = initialNoiseLevelPositive / correctionFactor;
  initialNoiseLevelNegative = initialNoiseLevelNegative / correctionFactor;

  let effectiveCutOffDist, refinedCorrectionFactor;
  if (refine) {
    effectiveCutOffDist =
      (cutOffDist * cloneSignPositive.length + cutOffSignalsIndexPlus) /
      (cloneSignPositive.length + cutOffSignalsIndexPlus);
    refinedCorrectionFactor =
      -1 * simpleNormInv(effectiveCutOffDist / 2, { magnitudeMode });
    noiseLevelPositive /= refinedCorrectionFactor;

    effectiveCutOffDist =
      (cutOffDist * cloneSignNegative.length + cutOffSignalsIndexNeg) /
      (cloneSignNegative.length + cutOffSignalsIndexNeg);
    refinedCorrectionFactor =
      -1 * simpleNormInv(effectiveCutOffDist / 2, { magnitudeMode });
    if (noiseLevelNegative !== 0) {
      noiseLevelNegative /= refinedCorrectionFactor;
    }
  } else {
    noiseLevelPositive /= correctionFactor;
    noiseLevelNegative /= correctionFactor;
  }

  return { positive: noiseLevelPositive, negative: noiseLevelNegative };
}
