const CRIT = {r: 255, g: 4, b: 0};
const WARN = {r: 255, g: 219, b: 77};
const OK = {r: 59, g: 201, b: 53};

export const COLORS_RANGE_SIZE = 500;
export const LIMITED_METRICS = {
    CPU: {
        min: 0,
        max: 1000000,
    },
    Network: {
        min: 0,
        max: 1000000000,
    },
    Storage: {
        min: 0,
        max: 2000000000,
    },
    DataSize: {
        min: 0,
        max: 2000000000,
    },
    RowCount: {
        min: 0,
    },
    IndexSize: {
        min: 0,
    },
};

const cToHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
};
const rgbToHex = ({r, g, b}) => {
    return `#${cToHex(r)}${cToHex(g)}${cToHex(b)}`;
};

export const getRangeBetweenColors = (range, color1, color2) => {
    if (range === 1) {
        return [color1];
    }

    if (range === 2) {
        return [color1, color2];
    }

    const redDiff = color1.r - color2.r;
    const redStep = redDiff / (range - 1);

    const greenDiff = color1.g - color2.g;
    const greenStep = greenDiff / (range - 1);

    const blueDiff = color1.b - color2.b;
    const blueStep = blueDiff / (range - 1);

    const colors = [];

    for (let i = 0; i < range; i++) {
        colors.push({
            r: Math.round(color1.r - redStep * i),
            g: Math.round(color1.g - greenStep * i),
            b: Math.round(color1.b - blueStep * i),
        });
    }

    return colors.map((color) => rgbToHex(color));
};
export const getColorRange = (range) => {
    const halfRange = Math.floor(range / 2);
    const range1 = range % 2 === 0 ? halfRange : halfRange + 1;
    const range2 = halfRange + 1;

    const firstInterval = getRangeBetweenColors(range1, OK, WARN);
    const secondInterval = getRangeBetweenColors(range2, WARN, CRIT);

    const colorsRange = [...firstInterval, ...secondInterval.slice(1)];

    return colorsRange;
};
export const getColorIndex = (value, min, max) => {
    if (max === 0) {
        return 0;
    } else {
        return Math.round(((value - min) / (max - min)) * (COLORS_RANGE_SIZE - 1));
    }
};

export const getCurrentMetricLimits = (metric, tablets) => {
    const limits = new Set();
    const limitedMetric = LIMITED_METRICS[metric] || {};

    tablets.forEach((tablet) => {
        limits.add(Number(tablet.metrics[metric]));
    });

    if (Number.isInteger(limitedMetric.min)) {
        limits.add(limitedMetric.min);
    }
    if (Number.isInteger(limitedMetric.max)) {
        limits.add(limitedMetric.max);
    }

    const sortedLimits = Array.from(limits.values()).sort((a, b) => a - b);

    return {
        min: sortedLimits[0],
        max: sortedLimits[sortedLimits.length - 1],
    };
};
