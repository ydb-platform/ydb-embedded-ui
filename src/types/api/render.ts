/**
 * endpoint: /viewer/json/render
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/json_render.h
 */

export type JsonRenderResponse = JsonRenderErrorResponse | MetricData[];

/** Response could be a plain html with 404 on ydb versions without charts support */
type JsonRenderErrorResponse =
    | {
          error?: string;
          status?: string;
      }
    | string;

export interface MetricData {
    datapoints: MetricDatapoint[];
    target: string;
    title: string;
    tags: MetricTags;
}

interface MetricTags {
    name: string;
}

/** [metric value - null or double, timestamp - seconds] */
export type MetricDatapoint = [null | number, number];

export interface JsonRenderRequestParams {
    /** metrics names in format "target=queries.latencies.p50&target=queries.latencies.p75&target=queries.latencies.p90" */
    target: string;
    from: number;
    until: number;
    maxDataPoints: number;
}
