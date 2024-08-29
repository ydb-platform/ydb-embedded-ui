import type {TClusterInfo} from '../../types/api/cluster';
import type {MetaCluster} from '../../types/api/meta';
import type {TTraceCheck, TTraceView} from '../../types/api/trace';

export const parseMetaCluster = (data: MetaCluster): TClusterInfo => {
    const {cluster = {}} = data;

    const {
        cluster: generalClusterInfo,
        balancer,
        solomon,
        trace_check: traceCheck,
        trace_view: traceView,
    } = cluster;

    let TraceCheck: TTraceCheck | undefined;
    let TraceView: TTraceView | undefined;

    try {
        TraceCheck = traceCheck ? (JSON.parse(traceCheck) as TTraceCheck) : undefined;
        TraceView = traceView ? (JSON.parse(traceView) as TTraceView) : undefined;
    } catch (e) {
        TraceCheck = undefined;
        TraceView = undefined;
    }

    return {
        ...generalClusterInfo,
        Name: cluster.title || generalClusterInfo?.Name,

        Balancer: balancer,
        Solomon: solomon,
        TraceCheck,
        TraceView,
    };
};
