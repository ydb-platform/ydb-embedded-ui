import {getCapacityAlertSeverity, getCapacityAlertTheme} from '../capacityAlerts';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../disks/constants';

describe('getCapacityAlertSeverity', () => {
    test('Should return Green severity for GREEN and CYAN alerts', () => {
        expect(getCapacityAlertSeverity('GREEN')).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        );
        expect(getCapacityAlertSeverity('CYAN')).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        );
    });

    test('Should return Yellow severity for LIGHT_YELLOW alert', () => {
        expect(getCapacityAlertSeverity('LIGHT_YELLOW')).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        );
    });

    test('Should return Red severity for YELLOW through BLACK alerts', () => {
        const dangerAlerts = ['YELLOW', 'LIGHT_ORANGE', 'PRE_ORANGE', 'ORANGE', 'RED', 'BLACK'];
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
        expect(getCapacityAlertSeverity('UNKNOWN')).toEqual(
            DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
        );
    });
});

describe('getCapacityAlertTheme', () => {
    test('Should return success theme for GREEN and CYAN alerts', () => {
        expect(getCapacityAlertTheme('GREEN')).toEqual('success');
        expect(getCapacityAlertTheme('CYAN')).toEqual('success');
    });

    test('Should return warning theme for LIGHT_YELLOW alert', () => {
        expect(getCapacityAlertTheme('LIGHT_YELLOW')).toEqual('warning');
    });

    test('Should return danger theme for YELLOW through BLACK alerts', () => {
        const dangerAlerts = ['YELLOW', 'LIGHT_ORANGE', 'PRE_ORANGE', 'ORANGE', 'RED', 'BLACK'];
        for (const alert of dangerAlerts) {
            expect(getCapacityAlertTheme(alert)).toEqual('danger');
        }
    });

    test('Should return normal theme for undefined or unknown alerts', () => {
        expect(getCapacityAlertTheme(undefined)).toEqual('normal');
        expect(getCapacityAlertTheme('UNKNOWN')).toEqual('normal');
    });
});
