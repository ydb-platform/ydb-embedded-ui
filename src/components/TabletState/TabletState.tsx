import {Label} from '@gravity-ui/uikit';

import type {ETabletState} from '../../types/api/tablet';
import {mapTabletStateToLabelTheme} from '../../utils/tablet';

interface TabletStateProps {
    state?: ETabletState;
}

export function TabletState({state}: TabletStateProps) {
    return <Label theme={mapTabletStateToLabelTheme(state)}>{state}</Label>;
}
