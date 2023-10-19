export const generateEvaluator =
    <OkLevel extends string, WarnLevel extends string, CritLevel extends string>(
        warn: number,
        crit: number,
        levels: [OkLevel, WarnLevel, CritLevel],
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
