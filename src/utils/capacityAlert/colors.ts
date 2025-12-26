import {ECapacityAlert} from '../../types/api/enums';

const CAPACITY_ALERT_COLORS: Record<ECapacityAlert, string> = {
    [ECapacityAlert.GREEN]: '#00b377', // = no flags
    [ECapacityAlert.CYAN]: '#66e0ff',
    [ECapacityAlert.LIGHTYELLOWMOVE]: '#fbffb3',
    [ECapacityAlert.YELLOWSTOP]: '#dae600',
    [ECapacityAlert.LIGHTORANGE]: '#baa600',
    [ECapacityAlert.PREORANGE]: '#996600',
    [ECapacityAlert.ORANGE]: '#803e00',
    [ECapacityAlert.RED]: '#660000',
    [ECapacityAlert.BLACK]: '#000000',
};

const DEFAULT_CAPACITY_ALERT_COLOR = CAPACITY_ALERT_COLORS.GREEN;

const isCapacityAlert = (value: string): value is ECapacityAlert => {
    return value in CAPACITY_ALERT_COLORS;
};

export const getCapacityAlertColor = (value?: string): string | undefined => {
    if (!value) {
        return undefined;
    }

    if (isCapacityAlert(value)) {
        return CAPACITY_ALERT_COLORS[value];
    }

    return DEFAULT_CAPACITY_ALERT_COLOR;
};
