import type {LabelProps} from '@gravity-ui/uikit';

import {EFlag} from '../types/api/enums';
import {ETabletState} from '../types/api/tablet';

// Similar to mapping in https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/viewer.cpp
const tabletStateToColorState: Record<ETabletState, EFlag> = {
    [ETabletState.Dead]: EFlag.Red,

    [ETabletState.Created]: EFlag.Yellow,
    [ETabletState.ResolveStateStorage]: EFlag.Yellow,
    [ETabletState.Candidate]: EFlag.Yellow,
    [ETabletState.BlockBlobStorage]: EFlag.Yellow,
    [ETabletState.WriteZeroEntry]: EFlag.Yellow,
    [ETabletState.Restored]: EFlag.Yellow,
    [ETabletState.Discover]: EFlag.Yellow,
    [ETabletState.Lock]: EFlag.Yellow,
    [ETabletState.Stopped]: EFlag.Yellow,
    [ETabletState.ResolveLeader]: EFlag.Yellow,
    [ETabletState.RebuildGraph]: EFlag.Yellow,
    [ETabletState.Terminating]: EFlag.Yellow,

    [ETabletState.Deleted]: EFlag.Green,
    [ETabletState.Active]: EFlag.Green,
};

// Tablet State in different versions or in different endpoint
// could be represented as ETabletState of EFlag
export const mapTabletStateToColorState = (state?: ETabletState | EFlag): EFlag => {
    if (!state) {
        return EFlag.Grey;
    }

    const isEFlag = (value: ETabletState | EFlag): value is EFlag =>
        Object.values(EFlag).includes(value as EFlag);

    if (isEFlag(state)) {
        return state;
    }

    return tabletStateToColorState[state];
};

export function mapTabletStateToLabelTheme(state?: ETabletState): LabelProps['theme'] {
    if (!state) {
        return 'unknown';
    }
    switch (state) {
        case ETabletState.Dead:
            return 'danger';
        case ETabletState.Active:
        case ETabletState.Deleted:
            return 'success';
        default:
            return 'warning';
    }
}
