import { exhaustiveSwitchGuard } from '@Utils';
import memoize from 'fast-memoize';

enum VideoAspectRatio {
  AUTO = 'AUTO',
  VIDEO = 'VIDEO',
  SQUARE = 'SQUARE',
  PORTRAIT = 'PORTRAIT'
}

enum VideoFillMode {
  CONTAIN = 'CONTAIN',
  COVER = 'COVER',
  FILL = 'FILL'
}

const LAYOUT_CONFIG = {
  maxCols: 6,
  gridGap: 12,
  videoFillMode: VideoFillMode.COVER,
  videoAspectRatio: VideoAspectRatio.VIDEO
};

interface BestFit {
  cols: number;
  rows: number;
  count: number;
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  cssAspectRatio?: React.CSSProperties['aspectRatio'];
}

interface BestFitWithOverflow extends BestFit {
  overflow: number;
}

interface BestFitInput {
  count: number;
  aspectRatio: number;
  containerWidth: number;
  containerHeight: number;
}

interface RecursiveBestFitInput extends BestFitInput {
  maxBestFitAttempts: number;
  maxItemAspectRatio: number;
}

function getComputedVideoAspectRatio(videoAspectRatio: VideoAspectRatio) {
  switch (videoAspectRatio) {
    case VideoAspectRatio.AUTO:
      return 5 / 4; // Heuristic used to inform best-fit calculations for AUTO aspect ratios

    case VideoAspectRatio.VIDEO:
      return 16 / 9;

    case VideoAspectRatio.SQUARE:
      return 1;

    case VideoAspectRatio.PORTRAIT:
      return 3 / 4;

    default:
      exhaustiveSwitchGuard(videoAspectRatio);
  }
}

function getCssVideoAspectRatio(
  videoAspectRatio: VideoAspectRatio
): React.CSSProperties['aspectRatio'] {
  if (videoAspectRatio === VideoAspectRatio.AUTO) {
    return 'auto';
  }

  return getComputedVideoAspectRatio(videoAspectRatio);
}

function getRenderedVideoAspectRatio(isScreen = false) {
  /**
   * Return AUTO for screens (to use the screen's intrinsic aspect ratio)
   * otherwise, return the videoAspectRatio from the layout configuration.
   */
  return isScreen ? VideoAspectRatio.AUTO : LAYOUT_CONFIG.videoAspectRatio;
}

function getRenderedVideoFillMode(isScreen = false) {
  /**
   * Return CONTAIN for screens (to ensure the entire screen is visible);
   * otherwise, return the videoFillMode from the layout configuration.
   */
  return isScreen ? VideoFillMode.CONTAIN : LAYOUT_CONFIG.videoFillMode;
}

function isVideoResizedToFit(videoFillMode: VideoFillMode) {
  /**
   * Only CONTAIN resizes the video to stay contained within its container.
   */
  return videoFillMode === VideoFillMode.CONTAIN;
}

const getBestFitWithOverflow = memoize(
  (
    count = 0,
    containerWidth = 0,
    containerHeight = 0,
    isScreen = false
  ): BestFitWithOverflow => {
    const { maxCols } = LAYOUT_CONFIG;
    const bestFit = getBestFit(
      count,
      containerWidth,
      containerHeight,
      isScreen
    );
    let overflow = 0;

    if (bestFit.cols > maxCols) {
      bestFit.cols = maxCols;
      bestFit.itemWidth = containerWidth / bestFit.cols;
      overflow = bestFit.count - bestFit.rows * bestFit.cols + 1;
    }

    return { ...bestFit, overflow };
  },
  { strategy: memoize.strategies.variadic }
);

const getBestFit = memoize(
  (count = 0, containerWidth = 0, containerHeight = 0, isScreen = false) => {
    const videoFillMode = getRenderedVideoFillMode(isScreen);
    const videoAspectRatio = getRenderedVideoAspectRatio(isScreen);
    const bestFitInput: BestFitInput = {
      count,
      containerWidth,
      containerHeight,
      aspectRatio: getComputedVideoAspectRatio(videoAspectRatio)
    };

    let bestFit: BestFit;
    if (
      !isVideoResizedToFit(videoFillMode) &&
      videoAspectRatio === VideoAspectRatio.AUTO
    ) {
      const recursiveBestFitInput: RecursiveBestFitInput = {
        ...bestFitInput,
        maxBestFitAttempts: 4,
        maxItemAspectRatio: 3
      };

      bestFit = recursiveBestFitItemsToContainer(recursiveBestFitInput);
    } else {
      bestFit = bestFitItemsToContainer(bestFitInput);
    }

    bestFit.cssAspectRatio = getCssVideoAspectRatio(videoAspectRatio);

    return bestFit;
  },
  { strategy: memoize.strategies.variadic }
);

function recursiveBestFitItemsToContainer(input: RecursiveBestFitInput) {
  const { count, maxBestFitAttempts, maxItemAspectRatio } = input;
  let bestFitAttempts = 0;

  function runBestFit(currentCount: number) {
    const bestFit = bestFitItemsToContainer({ ...input, count: currentCount });
    const itemAspectRatio = bestFit.itemWidth / bestFit.itemHeight;
    bestFitAttempts += 1;

    if (
      bestFitAttempts < maxBestFitAttempts &&
      itemAspectRatio > maxItemAspectRatio
    ) {
      return runBestFit(currentCount + 1);
    }

    return bestFit;
  }

  const bestFit = runBestFit(count);
  bestFit.count = count;

  return bestFit;
}

function bestFitItemsToContainer(input: BestFitInput): BestFit {
  const { count, aspectRatio, containerWidth, containerHeight } = input;

  if (!count || !aspectRatio || !containerWidth || !containerHeight) {
    return {
      cols: 0,
      rows: 0,
      itemWidth: 0,
      itemHeight: 0,
      count,
      containerWidth,
      containerHeight
    };
  }

  const normalizedContainerWidth = containerWidth / aspectRatio;
  const normalizedAspectRatio = normalizedContainerWidth / containerHeight;
  const nColsFloat = Math.sqrt(count * normalizedAspectRatio);
  const nRowsFloat = count / nColsFloat;

  // Find the best option that fills the entire height
  let nRows1 = Math.ceil(nRowsFloat);
  let nCols1 = Math.ceil(count / nRows1);
  while (nRows1 * normalizedAspectRatio < nCols1) {
    nRows1 += 1;
    nCols1 = Math.ceil(count / nRows1);
  }

  // Find the best option that fills the entire width
  let nCols2 = Math.ceil(nColsFloat);
  let nRows2 = Math.ceil(count / nCols2);
  while (nCols2 < nRows2 * normalizedAspectRatio) {
    nCols2 += 1;
    nRows2 = Math.ceil(count / nCols2);
  }

  const cellSize1 = containerHeight / nRows1;
  const cellSize2 = normalizedContainerWidth / nCols2;
  const cols = cellSize1 < cellSize2 ? nCols2 : nCols1;
  const rows = Math.ceil(count / cols);
  const itemWidth = containerWidth / cols;
  const itemHeight = containerHeight / rows;

  return {
    count,
    cols,
    rows,
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight
  };
}

function getComputedMeetingGridStyle(isGridSplit: boolean) {
  const computedGridStyle: React.CSSProperties = { gap: LAYOUT_CONFIG.gridGap };

  if (isGridSplit) {
    computedGridStyle.gridTemplateRows = '70% auto';
  }

  return computedGridStyle;
}

function getComputedParticipantGridStyle(bestFit: BestFit, isScreen = false) {
  const { gridGap } = LAYOUT_CONFIG;
  const videoAspectRatio = getRenderedVideoAspectRatio(isScreen);
  const computedParticipantGridStyle: React.CSSProperties = {
    gap: gridGap,
    margin: gridGap,
    gridTemplateColumns: `repeat(${bestFit.cols * 2}, minmax(0, 1fr))`,
    ...getComputedGridDimensions(bestFit, gridGap, videoAspectRatio)
  };

  return computedParticipantGridStyle;
}

function getComputedGridDimensions(
  bestFit: BestFit,
  gridGap: number,
  videoAspectRatio: VideoAspectRatio
) {
  const dimensions: React.CSSProperties = { height: '100%', maxWidth: '100%' };

  if (
    bestFit.rows > 0 &&
    bestFit.cols > 0 &&
    videoAspectRatio !== VideoAspectRatio.AUTO
  ) {
    const computedVideoAspectRatio =
      getComputedVideoAspectRatio(videoAspectRatio);

    const totalXGap = gridGap * (bestFit.cols - 1); // gap_size * num_col_gaps
    const totalYGap = gridGap * (bestFit.rows - 1); // gap_size * num_row_gaps
    const slotHeight = (bestFit.containerHeight - totalYGap) / bestFit.rows;
    const slotWidth = slotHeight * computedVideoAspectRatio;
    const totalSlotsWidth = slotWidth * bestFit.cols;
    const maxSlotWidth = Math.min(
      bestFit.containerWidth,
      totalSlotsWidth + totalXGap
    );

    delete dimensions.height;
    dimensions.maxWidth = maxSlotWidth;
  }

  return dimensions;
}

function getComputedGridSlotStyle(index: number, bestFit: BestFit) {
  const isFirstSlot = index === 0;
  const isOneByTwo = bestFit.count === 2 && bestFit.cols === 1;
  const isTwoByOne = bestFit.count === 2 && bestFit.cols === 2;
  const remainingItemsOnLastRow = bestFit.count % bestFit.cols;
  const computedSlotStyle: React.CSSProperties = {
    aspectRatio: bestFit.cssAspectRatio,
    gridColumnStart: 'span 2',
    gridColumnEnd: 'span 2'
  };

  // If needed, shift the last row to align it with the center of the grid
  if (bestFit.count - index === remainingItemsOnLastRow) {
    const shiftSlotRowBy = bestFit.cols - remainingItemsOnLastRow + 1;
    computedSlotStyle.gridColumnStart = shiftSlotRowBy;
  }

  // Position 1-by-2 and 2-by-1 grid LAYOUT_CONFIG participants side-by-side
  if (isOneByTwo) {
    computedSlotStyle.alignItems = isFirstSlot ? 'flex-end' : 'flex-start';
  } else if (isTwoByOne) {
    computedSlotStyle.justifyContent = isFirstSlot ? 'flex-end' : 'flex-start';
  }

  return computedSlotStyle;
}

function getComputedVideoStyle(isScreen = false) {
  const computedVideoStyle: React.CSSProperties = {};

  const objectFit = getRenderedVideoFillMode(isScreen).toLowerCase();
  computedVideoStyle.objectFit = objectFit as React.CSSProperties['objectFit'];

  return computedVideoStyle;
}

export {
  getBestFit,
  getBestFitWithOverflow,
  getComputedGridSlotStyle,
  getComputedMeetingGridStyle,
  getComputedParticipantGridStyle,
  getComputedVideoAspectRatio,
  getComputedVideoStyle,
  VideoAspectRatio,
  VideoFillMode
};
