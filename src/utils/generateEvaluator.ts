import {DEFAULT_DANGER_THRESHOLD, DEFAULT_WARNING_THRESHOLD} from './constants';

export const generateEvaluator =
    <OkLevel extends string, WarnLevel extends string, CritLevel extends string>(
        levels: [OkLevel, WarnLevel, CritLevel],
        warn = DEFAULT_WARNING_THRESHOLD,
        crit = DEFAULT_DANGER_THRESHOLD,
    ) =>
    (value: number) => {
        if (0 <= value && value < warn) {
            return levels[0];
        }

        if (warn <= value && value < crit) {
            return levels[1];
        }

        if (crit <= value) {
            return levels[2];
        }

        return undefined;
    };

export const getUsageSeverity = generateEvaluator(['success', 'warning', 'danger']);
