import {traceCheckSchema, traceViewSchema} from '../../types/api/trace';

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
