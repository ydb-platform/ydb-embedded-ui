import {formatPercent, roundToDecimalPlaces} from '../dataFormatters/dataFormatters';
import {getMetricPercentPrecision} from '../metrics';
import {calculateProgressStatus} from '../progress';
import type {ProgressStatus} from '../progress';

export interface DiagramValuesBaseParams {
    colorizeProgress?: boolean;
    warningThreshold?: number;
    dangerThreshold?: number;
}

export interface DiagramValuesCommonParams extends DiagramValuesBaseParams {
    value: number | string;
    capacity: number | string;
}

export type DiagramValuesStatus = ProgressStatus | 'unavailable';

export interface DiagramValuesFallback {
    percents?: string | undefined;
    status: DiagramValuesStatus;
}

export interface DiagramValues {
    percents: string;
    progressValue: number;
    status: ProgressStatus;
}

export interface DiagramValuesWithFallback {
    percents?: string | undefined;
    progressValue: number;
    status: DiagramValuesStatus;
}

type CalculateBaseDiagramValuesParams = DiagramValuesBaseParams & {fillWidth: number};

type WithFallback<TParams> = TParams & {fallback: DiagramValuesFallback};
type WithLegend<TValues> = TValues & {legend?: string | undefined};

type DiagramLegendFormatter = (params: {value: number; capacity: number}) => string | undefined;

type GetDiagramValuesParams = DiagramValuesCommonParams & {
    legendFormatter?: DiagramLegendFormatter;
};

function parseDiagramValue(value: number | string) {
    if (typeof value === 'string' && value.trim() === '') {
        return NaN;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : NaN;
}

function calculateFillWidth(value: number, capacity: number) {
    if (!Number.isFinite(value) || !Number.isFinite(capacity) || capacity <= 0) {
        return NaN;
    }

    return (value / capacity) * 100;
}

export function calculateBaseDiagramValues(
    params: WithFallback<CalculateBaseDiagramValuesParams>,
): DiagramValuesWithFallback;
export function calculateBaseDiagramValues(params: CalculateBaseDiagramValuesParams): DiagramValues;
export function calculateBaseDiagramValues({
    colorizeProgress = true,
    warningThreshold,
    dangerThreshold,
    fillWidth,
    fallback,
}: CalculateBaseDiagramValuesParams & {
    fallback?: DiagramValuesFallback;
}): DiagramValues | DiagramValuesWithFallback {
    const isPercentAvailable = Number.isFinite(fillWidth);
    const safeFillWidth = isPercentAvailable ? fillWidth : 0;
    const percentPrecision = getMetricPercentPrecision(safeFillWidth);
    const progressValue = roundToDecimalPlaces(Math.max(safeFillWidth, 0), percentPrecision);
    const status = calculateProgressStatus({
        fillWidth: safeFillWidth,
        warningThreshold,
        dangerThreshold,
        colorizeProgress,
    });

    const percents = formatPercent(safeFillWidth / 100, percentPrecision);

    const values = {
        status,
        percents,
        progressValue,
    };

    if (!isPercentAvailable && fallback) {
        return {
            ...values,
            ...fallback,
        };
    }

    return values;
}

export function getDiagramValues(
    params: WithFallback<GetDiagramValuesParams>,
): WithLegend<DiagramValuesWithFallback>;
export function getDiagramValues(params: GetDiagramValuesParams): WithLegend<DiagramValues>;
export function getDiagramValues({
    value,
    capacity,
    fallback,
    legendFormatter,
    ...rest
}: GetDiagramValuesParams & {
    fallback?: DiagramValuesFallback;
}): WithLegend<DiagramValues> | WithLegend<DiagramValuesWithFallback> {
    const parsedValue = parseDiagramValue(value);
    const parsedCapacity = parseDiagramValue(capacity);
    const fillWidth = calculateFillWidth(parsedValue, parsedCapacity);
    const diagramValues = calculateBaseDiagramValues({
        fillWidth,
        ...rest,
        ...(fallback === undefined ? {} : {fallback}),
    } as WithFallback<CalculateBaseDiagramValuesParams>);

    return {
        ...diagramValues,
        legend: legendFormatter?.({
            value: parsedValue,
            capacity: parsedCapacity,
        }),
    };
}
