import {EFlag} from '../types/api/enums';
import {ETabletState} from '../types/api/tablet';

const tabletStateToColorState: Record<ETabletState, EFlag> = {
    [ETabletState.Active]: EFlag.Green,
    [ETabletState.Deleted]: EFlag.Green,

    [ETabletState.RebuildGraph]: EFlag.Orange,
    [ETabletState.ResolveLeader]: EFlag.Yellow,

    [ETabletState.Created]: EFlag.Red,
    [ETabletState.ResolveStateStorage]: EFlag.Red,
    [ETabletState.Candidate]: EFlag.Red,
    [ETabletState.BlockBlobStorage]: EFlag.Red,
    [ETabletState.WriteZeroEntry]: EFlag.Red,
    [ETabletState.Restored]: EFlag.Red,
    [ETabletState.Discover]: EFlag.Red,
    [ETabletState.Lock]: EFlag.Red,
    [ETabletState.Dead]: EFlag.Red,
    [ETabletState.Stopped]: EFlag.Red,
};

// Tablet State in different versions or in different endpoint
// could be represented as ETabletState of EFlag
export const mapTabletStateToColorState = (state?: ETabletState | EFlag): EFlag => {
    if (!state) {
        return EFlag.Grey;
    }

    if (Object.values(EFlag).includes(state as EFlag)) {
        return state as EFlag;
    }

    return tabletStateToColorState[state as ETabletState];
};
