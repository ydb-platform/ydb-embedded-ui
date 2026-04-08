// Shows system status
// Currently is used in response types viewer/json/ storage, nodes, compute
// pdiskinfo, vdiskinfo, tabletinfo, tenantinfo
export enum EFlag {
    Grey = 'Grey',
    Green = 'Green',
    Blue = 'Blue',
    Yellow = 'Yellow',
    Orange = 'Orange',
    Red = 'Red',
}

// СapacityAlert for capacity storage metrics
export enum ECapacityAlert {
    GREEN = 'GREEN',
    CYAN = 'CYAN',
    LIGHTYELLOW = 'LIGHT_YELLOW',
    YELLOW = 'YELLOW',
    LIGHTORANGE = 'LIGHT_ORANGE',
    PREORANGE = 'PRE_ORANGE',
    ORANGE = 'ORANGE',
    RED = 'RED',
    BLACK = 'BLACK',
}

const capacityAlertValues = new Set<string>(Object.values(ECapacityAlert));

export function isCapacityAlert(value?: string): value is ECapacityAlert {
    if (!value) {
        return false;
    }
    return capacityAlertValues.has(value);
}
