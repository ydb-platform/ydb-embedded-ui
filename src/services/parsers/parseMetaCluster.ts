import type {TClusterInfo} from '../../types/api/cluster';
import type {MetaCluster} from '../../types/api/meta';
import type {TTraceCheck, TTraceView} from '../../types/api/trace';

function isTraceCheck(obj: Partial<TTraceCheck>): obj is TTraceCheck {
    return Boolean(obj instanceof Object && obj.url);
}

function isTraceView(obj: Partial<TTraceView>): obj is TTraceView {
    return Boolean(obj instanceof Object && obj.url);
}

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
        if (traceCheck) {
            const parsedTraceCheck = JSON.parse(traceCheck);
            if (isTraceCheck(parsedTraceCheck)) {
                TraceCheck = parsedTraceCheck;
            } else {
                console.error('Parsed traceCheck does not match TTraceCheck structure');
            }
        }

        if (traceView) {
            const parsedTraceView = JSON.parse(traceView);
            if (isTraceView(parsedTraceView)) {
                TraceView = parsedTraceView;
            } else {
                console.error('Parsed traceView does not match TTraceView structure');
            }
        }
    } catch (e) {
        console.error('Error parsing JSON:', e);
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
