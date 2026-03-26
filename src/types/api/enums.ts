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
    LIGHTYELLOWMOVE = 'LIGHT_YELLOW',
    YELLOWSTOP = 'YELLOW',
    LIGHTORANGE = 'LIGHT_ORANGE',
    PREORANGE = 'PRE_ORANGE',
    ORANGE = 'ORANGE',
    RED = 'RED',
    BLACK = 'BLACK',
}
