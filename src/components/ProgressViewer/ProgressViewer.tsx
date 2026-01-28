import {useTheme} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {calculateProgressStatus, defaultFormatProgressValues} from '../../utils/progress';
import type {FormatProgressViewerValues} from '../../utils/progress';
import {isNumeric} from '../../utils/utils';

import './ProgressViewer.scss';

const b = cn('progress-viewer');

type ProgressViewerSize = 'xs' | 's' | 'ns' | 'm' | 'n' | 'l' | 'head';

/*

Props description:
1) value - the amount of progress
2) capacity - maximum possible progress value
3) formatValues - function for formatting the value and capacity
4) percents - display progress in percents
5) colorizeProgress - change the color of the progress bar depending on its value
6) inverseColorize - invert the colors of the progress bar
7) warningThreshold - the percentage of fullness at which the color of the progress bar changes to yellow
8) dangerThreshold - the percentage of fullness at which the color of the progress bar changes to red
9) withOverflow - percents may be more that 100%
*/

export interface ProgressViewerProps {
    value?: number | string;
    capacity?: number | string;
    formatValues?: FormatProgressViewerValues;
    percents?: boolean;
    className?: string;
    size?: ProgressViewerSize;
    colorizeProgress?: boolean;
    inverseColorize?: boolean;
    warningThreshold?: number;
    dangerThreshold?: number;
    hideCapacity?: boolean;
    withOverflow?: boolean;
}

export function ProgressViewer({
    value,
    capacity,
    formatValues = defaultFormatProgressValues,
    percents,
    withOverflow,
    className,
    size = 'xs',
    colorizeProgress,
    inverseColorize,
    warningThreshold,
    dangerThreshold,
    hideCapacity,
}: ProgressViewerProps) {
    const theme = useTheme();

    let fillWidth =
        Math.floor((parseFloat(String(value)) / parseFloat(String(capacity))) * 100) || 0;
    const rawFillWidth = fillWidth;
    fillWidth = fillWidth > 100 ? 100 : fillWidth;
    let valueText: number | string | undefined = value,
        capacityText: number | string | undefined = capacity,
        divider = '/';
    if (percents) {
        valueText = (withOverflow ? rawFillWidth : fillWidth) + '%';
        capacityText = '';
        divider = '';
    } else if (formatValues) {
        [valueText, capacityText] = formatValues(Number(value), Number(capacity));
    }

    const status = calculateProgressStatus({
        fillWidth,
        warningThreshold,
        dangerThreshold,
        colorizeProgress,
        inverseColorize,
    });
    if (colorizeProgress && !isNumeric(capacity)) {
        fillWidth = 100;
    }

    const lineStyle = {
        width: fillWidth + '%',
    };

    const renderContent = () => {
        if (isNumeric(capacity) && !hideCapacity) {
            return `${valueText} ${divider} ${capacityText}`;
        }

        return valueText;
    };

    if (isNumeric(value)) {
        return (
            <div className={b({size, theme, status}, className)}>
                <div className={b('line')} style={lineStyle}></div>
                <span className={b('text')}>{renderContent()}</span>
            </div>
        );
    }

    return <div className={`${b({size})} ${className} error`}>{EMPTY_DATA_PLACEHOLDER}</div>;
}
