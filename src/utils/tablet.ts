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

export const tabletStates = Object.keys(ETabletState);

export const tabletColorToTabletState = Object.entries(tabletStateToColorState).reduce(
    (acc, [state, color]) => {
        if (acc[color]) {
            acc[color].push(state as ETabletState);
        } else {
            acc[color] = [state as ETabletState];
        }

        return acc;
    },
    {} as Record<EFlag, ETabletState[]>,
);

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
