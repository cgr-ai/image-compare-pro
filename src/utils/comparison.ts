import { getContext } from './canvas';

export function pixelByPixelComparison(
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement,
  subMode: string = 'tolerance',
  toleranceValue: number = 10,
  transparencyValue: number = 50
): ImageData {
  const ctx1 = getContext(canvas1);
  const ctx2 = getContext(canvas2);

  const img1Data = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  const img2Data = ctx2.getImageData(
    0, 0,
    Math.min(canvas2.width, canvas1.width),
    Math.min(canvas2.height, canvas1.height)
  );

  const resultData = new ImageData(canvas1.width, canvas1.height);
  const tolerance = (toleranceValue / 100) * 255;
  const weight1 = (100 - transparencyValue) / 100;
  const weight2 = transparencyValue / 100;

  for (let i = 0; i < img1Data.data.length; i += 4) {
    if (i >= img2Data.data.length) {
      resultData.data[i] = 255;
      resultData.data[i + 1] = 0;
      resultData.data[i + 2] = 0;
      resultData.data[i + 3] = 255;
      continue;
    }

    const r1 = img1Data.data[i], g1 = img1Data.data[i + 1], b1 = img1Data.data[i + 2];
    const r2 = img2Data.data[i], g2 = img2Data.data[i + 1], b2 = img2Data.data[i + 2];
    const diffR = Math.abs(r1 - r2), diffG = Math.abs(g1 - g2), diffB = Math.abs(b1 - b2);
    const maxDiff = Math.max(diffR, diffG, diffB);

    switch (subMode) {
      case 'tolerance':
        if (maxDiff === 0) {
          resultData.data[i] = 128; resultData.data[i + 1] = 128; resultData.data[i + 2] = 128;
        } else if (maxDiff <= tolerance) {
          resultData.data[i] = 0; resultData.data[i + 1] = 0; resultData.data[i + 2] = 200;
        } else {
          resultData.data[i] = 220; resultData.data[i + 1] = 0; resultData.data[i + 2] = 0;
        }
        resultData.data[i + 3] = 255;
        break;
      case 'range':
        if (maxDiff === 0) {
          resultData.data[i] = 0; resultData.data[i + 1] = 0; resultData.data[i + 2] = 0;
        } else {
          const yellowIntensity = Math.min(255, (maxDiff / 255) * 255);
          resultData.data[i] = yellowIntensity; resultData.data[i + 1] = yellowIntensity; resultData.data[i + 2] = 0;
        }
        resultData.data[i + 3] = 255;
        break;
      case 'blend':
        resultData.data[i] = Math.round(r1 * weight1 + r2 * weight2);
        resultData.data[i + 1] = Math.round(g1 * weight1 + g2 * weight2);
        resultData.data[i + 2] = Math.round(b1 * weight1 + b2 * weight2);
        resultData.data[i + 3] = 255;
        break;
      default:
        if (maxDiff > tolerance) {
          resultData.data[i] = 255; resultData.data[i + 1] = 0; resultData.data[i + 2] = 0;
        } else {
          resultData.data[i] = r1; resultData.data[i + 1] = g1; resultData.data[i + 2] = b1;
        }
        resultData.data[i + 3] = 255;
    }
  }
  return resultData;
}

export function structuralComparison(
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement
): ImageData {
  const ctx1 = getContext(canvas1);
  const ctx2 = getContext(canvas2);

  const img1Data = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  const img2Data = ctx2.getImageData(
    0, 0,
    Math.min(canvas2.width, canvas1.width),
    Math.min(canvas2.height, canvas1.height)
  );

  const resultData = new ImageData(canvas1.width, canvas1.height);
  const edgeDetectionKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  const width = canvas1.width;

  for (let y = 1; y < canvas1.height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      let edge1 = 0, edge2 = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
          if (pixelIdx >= 0 && pixelIdx < img1Data.data.length) {
            const gray1 = (img1Data.data[pixelIdx] + img1Data.data[pixelIdx + 1] + img1Data.data[pixelIdx + 2]) / 3;
            edge1 += gray1 * edgeDetectionKernel[kernelIdx];
            if (pixelIdx < img2Data.data.length) {
              const gray2 = (img2Data.data[pixelIdx] + img2Data.data[pixelIdx + 1] + img2Data.data[pixelIdx + 2]) / 3;
              edge2 += gray2 * edgeDetectionKernel[kernelIdx];
            }
          }
        }
      }

      edge1 = Math.abs(edge1) > 100 ? 255 : 0;
      edge2 = Math.abs(edge2) > 100 ? 255 : 0;

      if (edge1 !== edge2) {
        resultData.data[idx] = 255; resultData.data[idx + 1] = 255;
        resultData.data[idx + 2] = 0; resultData.data[idx + 3] = 255;
      } else {
        const gray = (img1Data.data[idx] + img1Data.data[idx + 1] + img1Data.data[idx + 2]) / 3;
        resultData.data[idx] = gray; resultData.data[idx + 1] = gray;
        resultData.data[idx + 2] = gray; resultData.data[idx + 3] = 255;
      }
    }
  }
  return resultData;
}

export function histogramComparison(
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement
): ImageData {
  const ctx1 = getContext(canvas1);
  const ctx2 = getContext(canvas2);

  const img1Data = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  const img2Data = ctx2.getImageData(
    0, 0,
    Math.min(canvas2.width, canvas1.width),
    Math.min(canvas2.height, canvas1.height)
  );

  const resultData = new ImageData(canvas1.width, canvas1.height);
  const hist1 = calculateHistogram(img1Data);
  const hist2 = calculateHistogram(img2Data);
  const histDiff = calculateHistogramDifference(hist1, hist2);
  const diffRatio = Math.min(histDiff / 0.5, 1);

  for (let i = 0; i < img1Data.data.length; i += 4) {
    resultData.data[i] = img1Data.data[i];
    resultData.data[i + 1] = img1Data.data[i + 1];
    resultData.data[i + 2] = img1Data.data[i + 2];
    resultData.data[i + 3] = img1Data.data[i + 3];
  }

  for (let i = 0; i < resultData.data.length; i += 4) {
    resultData.data[i] = Math.max(0, resultData.data[i] - diffRatio * 50);
    resultData.data[i + 1] = Math.max(0, resultData.data[i + 1] - diffRatio * 50);
    resultData.data[i + 2] = Math.min(255, resultData.data[i + 2] + diffRatio * 50);
  }
  return resultData;
}

function calculateHistogram(imageData: ImageData): number[] {
  const bins = 8;
  const binSize = 256 / bins;
  const hist = Array(bins * 3).fill(0);

  for (let i = 0; i < imageData.data.length; i += 4) {
    hist[Math.floor(imageData.data[i] / binSize)]++;
    hist[Math.floor(imageData.data[i + 1] / binSize) + bins]++;
    hist[Math.floor(imageData.data[i + 2] / binSize) + bins * 2]++;
  }

  const pixelCount = imageData.width * imageData.height;
  return hist.map((count) => count / pixelCount);
}

function calculateHistogramDifference(hist1: number[], hist2: number[]): number {
  let sum = 0;
  for (let i = 0; i < hist1.length; i++) {
    sum += Math.sqrt(hist1[i] * hist2[i]);
  }
  return 1 - sum;
}

export function runComparison(
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement,
  resultCanvas: HTMLCanvasElement,
  mode: string,
  subMode: string,
  toleranceVal: number,
  transparencyVal: number
): ImageData | null {
  resultCanvas.width = canvas1.width;
  resultCanvas.height = canvas1.height;
  const ctxResult = getContext(resultCanvas);

  let result: ImageData | null = null;
  try {
    switch (mode) {
      case 'pixel':
        result = pixelByPixelComparison(canvas1, canvas2, subMode, toleranceVal, transparencyVal);
        break;
      case 'structural':
        result = structuralComparison(canvas1, canvas2);
        break;
      case 'histogram':
        result = histogramComparison(canvas1, canvas2);
        break;
      default:
        result = pixelByPixelComparison(canvas1, canvas2, subMode, toleranceVal, transparencyVal);
    }
    if (result) {
      ctxResult.putImageData(result, 0, 0);
    }
  } catch (error) {
    console.error('Error updating comparison:', error);
  }
  return result;
}
