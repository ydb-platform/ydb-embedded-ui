import type {ControlPlaneOperation} from '../../types/api/controlPlaneOperations';
import type {TOperation} from '../../types/api/operations';
import {parseProtobufTimestampToMs} from '../../utils/timeParsers';

export interface ControlPlaneOperationRow extends TOperation {
    description?: string;
    controlPlaneStatus?: 'ERROR' | 'DONE' | 'PENDING';
    created_at?: number;
    modified_at?: number;
}

export function parseControlPlaneOperation(
    operation: ControlPlaneOperation,
): ControlPlaneOperationRow {
    return {
        id: operation.id,
        description: operation.description,
        controlPlaneStatus: getControlPlaneOperationStatus(operation),
        modified_at: parseTimestamp(operation.modified_at),
        issues: operation.error?.message ? [{message: operation.error.message}] : undefined,
        created_by: operation.created_by,
        created_at: parseTimestamp(operation.created_at),
    };
}

function getControlPlaneOperationStatus(
    operation: ControlPlaneOperation,
): 'ERROR' | 'DONE' | 'PENDING' {
    if (operation.error) {
        return 'ERROR';
    }
    return operation.done ? 'DONE' : 'PENDING';
}

function parseTimestamp(timestamp: ControlPlaneOperation['created_at']): number | undefined {
    if (!timestamp || (typeof timestamp === 'object' && timestamp.seconds === undefined)) {
        return undefined;
    }
    const milliseconds = parseProtobufTimestampToMs(timestamp);
    return Number.isFinite(milliseconds) ? milliseconds : undefined;
}
