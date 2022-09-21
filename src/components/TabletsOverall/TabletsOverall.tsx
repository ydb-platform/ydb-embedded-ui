import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import {Progress} from '@gravity-ui/uikit';

import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {COLORS_PRIORITY} from '../../utils/constants';

import './TabletsOverall.scss';

// to be able to see problem places with very small percentage, we'll set minimum percentage to 3.
const minOverallPercentValue = 3;

const colors = {
    grey: 'var(--yc-color-base-misc-heavy)',
    green: 'var(--yc-color-base-positive-heavy)',
    yellow: ' var(--yc-color-base-warning-heavy)',
    orange: 'var( --yc-color-base-warning-orange)',
    red: 'var(--yc-color-base-danger-heavy)',
    blue: 'var(--yc-color-base-info-heavy)',
};

const b = cn('kv-tablets-overall');

type Color = keyof typeof colors;

interface TabletsOverallProps {
    tablets: {Overall: string}[];
}

function TabletsOverall({tablets}: TabletsOverallProps) {
    const dispatch = useDispatch();

    const tabletsCount = tablets.length;

    const substractPercentsFromMaxPercents = (
        statesForOverallProgress: Record<Color, number>,
        substractValue: number,
    ) => {
        Object.keys(statesForOverallProgress).some((key) => {
            if (statesForOverallProgress[key as Color] > 10) {
                statesForOverallProgress[key as Color] -= minOverallPercentValue - substractValue;
                return true;
            }
            return false;
        });
    };

    // determine how many tablets of what color are in "tablets"
    const statesForOverallProgress: Record<string, number> = tablets.reduce((acc, tablet) => {
        const color = tablet.Overall.toLowerCase();
        if (!acc[color]) {
            acc[color] = 1;
        } else {
            acc[color]++;
        }

        return acc;
    }, {} as Record<string, number>);

    const tooltipData: {color: string; percents: number; value: number; total: number}[] = [];

    // determine how many percents is every color in statesForOverallProgress and by the way generate information for tooltip
    Object.keys(statesForOverallProgress).forEach((key) => {
        const percents = (statesForOverallProgress[key] / tabletsCount) * 100;
        const value = statesForOverallProgress[key];
        statesForOverallProgress[key] = percents;
        tooltipData.push({color: key, percents, value, total: tablets.length});
    });

    // replace percents which are smaller then 3 to 3.
    Object.keys(statesForOverallProgress).forEach((key) => {
        if (statesForOverallProgress[key] < minOverallPercentValue) {
            substractPercentsFromMaxPercents(
                statesForOverallProgress,
                statesForOverallProgress[key],
            );
            statesForOverallProgress[key] = minOverallPercentValue;
        }
    });

    const memoryProgress = 100;
    const stack = Object.keys(statesForOverallProgress).map((key) => ({
        color: colors[key as Color],
        colorKey: key as Color,
        value: statesForOverallProgress[key],
    }));

    // sort stack to achieve order "green, orange, yellow, red, blue, gray"
    stack.sort((a, b) => COLORS_PRIORITY[b.colorKey] - COLORS_PRIORITY[a.colorKey]);

    return (
        <div className={b('row', {overall: true})}>
            <span className={b('label', {overall: true})}>Overall:</span>
            <div
                onMouseLeave={() => dispatch(hideTooltip())}
                onMouseEnter={(e) => dispatch(showTooltip(e.target, tooltipData, 'tabletsOverall'))}
            >
                <Progress value={memoryProgress} stack={stack} />
            </div>
        </div>
    );
}

export default TabletsOverall;
