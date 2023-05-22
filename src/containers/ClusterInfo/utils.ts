import {TTabletStateInfo, EType} from '../../types/api/tablet';

export const compareTablets = (tablet1: TTabletStateInfo, tablet2: TTabletStateInfo) => {
    if (tablet1.Type === EType.TxAllocator) {
        return 1;
    }

    if (tablet2.Type === EType.TxAllocator) {
        return -1;
    }

    return 0;
};
