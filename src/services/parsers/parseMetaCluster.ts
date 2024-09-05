import type {TClusterInfo} from '../../types/api/cluster';
import type {MetaCluster} from '../../types/api/meta';
import {traceCheckSchema, traceViewSchema} from '../../types/api/trace';

export const parseMetaCluster = (data: MetaCluster): TClusterInfo => {
    const {cluster = {}} = data;

    const {
        cluster: generalClusterInfo,
        balancer,
        solomon,
        trace_check: traceCheck,
        trace_view: traceView,
    } = cluster;

    const {traceCheck: TraceCheck, traceView: TraceView} = parseTraceFields({
        traceCheck,
        traceView,
    });

    return {
        ...generalClusterInfo,
        Name: cluster.title || generalClusterInfo?.Name,

        Balancer: balancer,
        Solomon: solomon,
        TraceCheck,
        TraceView,
    };
};

export function parseTraceFields({
    traceCheck,
    traceView,
}: {
    traceCheck?: string;
    traceView?: string;
}) {
    try {
        return {
            traceCheck: traceCheck ? traceCheckSchema.parse(JSON.parse(traceCheck)) : undefined,
            traceView: traceView ? traceViewSchema.parse(JSON.parse(traceView)) : undefined,
        };
    } catch (e) {
        console.error('Error parsing trace fields:', e);
    }

    return {};
}
