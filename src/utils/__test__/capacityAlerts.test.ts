import {ECapacityAlert} from '../../types/api/enums';
import {getCapacityAlertSeverity, getCapacityAlertTheme} from '../capacityAlerts';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../disks/constants';

describe('getCapacityAlertSeverity', () => {
    test('Should return Green severity for GREEN and CYAN alerts', () => {
        expect(getCapacityAlertSeverity(ECapacityAlert.GREEN)).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        );
        expect(getCapacityAlertSeverity(ECapacityAlert.CYAN)).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        );
    });

    test('Should return Yellow severity for LIGHT_YELLOW alert', () => {
        expect(getCapacityAlertSeverity(ECapacityAlert.LIGHTYELLOW)).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        );
    });

    test('Should return Red severity for YELLOW through BLACK alerts', () => {
        const dangerAlerts: ECapacityAlert[] = [
            ECapacityAlert.YELLOW,
            ECapacityAlert.LIGHTORANGE,
            ECapacityAlert.PREORANGE,
            ECapacityAlert.ORANGE,
            ECapacityAlert.RED,
            ECapacityAlert.BLACK,
        ];
        for (const alert of dangerAlerts) {
            expect(getCapacityAlertSeverity(alert)).toEqual(
                DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
            );
        }
    });

    test('Should return Grey severity for undefined or unknown alerts', () => {
        expect(getCapacityAlertSeverity(undefined)).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
        );
        expect(getCapacityAlertSeverity('UNKNOWN' as ECapacityAlert)).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
        );
    });
});

describe('getCapacityAlertTheme', () => {
    test('Should return success theme for GREEN and CYAN alerts', () => {
        expect(getCapacityAlertTheme(ECapacityAlert.GREEN)).toEqual('success');
        expect(getCapacityAlertTheme(ECapacityAlert.CYAN)).toEqual('success');
    });

    test('Should return warning theme for LIGHT_YELLOW alert', () => {
        expect(getCapacityAlertTheme(ECapacityAlert.LIGHTYELLOW)).toEqual('warning');
    });

    test('Should return danger theme for YELLOW through BLACK alerts', () => {
        const dangerAlerts: ECapacityAlert[] = [
            ECapacityAlert.YELLOW,
            ECapacityAlert.LIGHTORANGE,
            ECapacityAlert.PREORANGE,
            ECapacityAlert.ORANGE,
            ECapacityAlert.RED,
            ECapacityAlert.BLACK,
        ];
        for (const alert of dangerAlerts) {
            expect(getCapacityAlertTheme(alert)).toEqual('danger');
        }
    });

    test('Should return normal theme for undefined or unknown alerts', () => {
        expect(getCapacityAlertTheme(undefined)).toEqual('normal');
        expect(getCapacityAlertTheme('UNKNOWN' as ECapacityAlert)).toEqual('normal');
    });
});
