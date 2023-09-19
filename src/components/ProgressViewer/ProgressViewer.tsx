import cn from 'bem-cn-lite';

import {ValueOf} from '../../types/common';

import './ProgressViewer.scss';

const b = cn('progress-viewer');

export const PROGRESS_VIEWER_SIZE_IDS = {
    xs: 'xs',
    s: 's',
    ns: 'ns',
    m: 'm',
    n: 'n',
    l: 'l',
    head: 'head',
} as const;

type ProgressViewerSize = ValueOf<typeof PROGRESS_VIEWER_SIZE_IDS>;

/*

Описание props:
1) value - величина прогресса
2) capacity - предельно возможный прогресс
3) formatValues - функция форматирования value и capacity
4) percents - отображать ли заполненость в виде процентов
5) className - кастомный класс
6) colorizeProgress - менять ли цвет полосы прогресса в зависимости от его величины
7) inverseColorize - инвертировать ли цвета при разукрашивании прогресса
*/

interface ProgressViewerProps {
    value?: number | string;
    capacity?: number | string;
    formatValues?: (value?: number, total?: number) => (string | undefined)[];
    percents?: boolean;
    className?: string;
    size?: ProgressViewerSize;
    colorizeProgress?: boolean;
    inverseColorize?: boolean;
}

export function ProgressViewer({
    value,
    capacity = 100,
    formatValues,
    percents,
    className,
    size = PROGRESS_VIEWER_SIZE_IDS.xs,
    colorizeProgress,
    inverseColorize,
}: ProgressViewerProps) {
    let fillWidth = Math.round((parseFloat(String(value)) / parseFloat(String(capacity))) * 100);
    fillWidth = fillWidth > 100 ? 100 : fillWidth;

    let valueText = String(Math.round(Number(value))),
        capacityText = capacity,
        divider = '/';
    let formattedValue: string | undefined;
    let formattedCapacity: string | undefined;
    if (formatValues) {
        [formattedValue, formattedCapacity] = formatValues(Number(value), Number(capacity));
    } else if (percents) {
        valueText = fillWidth + '%';
        capacityText = '';
        divider = '';
    }

    let bg = inverseColorize ? 'scarlet' : 'apple';
    if (colorizeProgress) {
        if (fillWidth > 60 && fillWidth <= 80) {
            bg = 'saffron';
        } else if (fillWidth > 80) {
            bg = inverseColorize ? 'apple' : 'scarlet';
        }
    }

    const lineStyle = {
        width: fillWidth + '%',
    };

    const text = fillWidth > 60 ? 'contrast0' : 'contrast70';

    if (!isNaN(fillWidth)) {
        return (
            <div className={b({size}, className)}>
                <div className={b('line', {bg})} style={lineStyle}></div>
                <span className={b('text', {text})}>{`${formattedValue || valueText} ${divider} ${
                    formattedCapacity || capacityText
                }`}</span>
            </div>
        );
    }

    return <div className={`${b({size})} ${className} error`}>no data</div>;
}
