import {useState} from 'react';
import cn from 'bem-cn-lite';
import {Popover} from '@gravity-ui/uikit';

import {formatBytesCustom, IBytesSizes, IProcessSpeedStats} from '../../utils/bytesParsers';

import './SpeedMultiMeter.scss';

import i18n from './i18n';

const b = cn('speed-multimeter');

interface SpeedMultiMeterProps {
    data?: IProcessSpeedStats;
    speedSize?: IBytesSizes;
    withValue?: boolean;
    withPopover?: boolean;
}

export const SpeedMultiMeter = ({
    data,
    speedSize = 'kb',
    withValue = true,
    withPopover = true,
}: SpeedMultiMeterProps) => {
    const {perMinute = 0, perHour = 0, perDay = 0} = data || {};
    const rawValues = [perMinute, perHour, perDay];

    const formatValue = (value: number) =>
        formatBytesCustom({value: value, size: speedSize, isSpeed: true});

    const formattedValues = [
        {value: formatValue(perMinute), label: i18n('perMinute')},
        {value: formatValue(perHour), label: i18n('perHour')},
        {value: formatValue(perDay), label: i18n('perDay')},
    ];

    const [valueToDisplay, setValueToDisplay] = useState(perMinute);
    const [highlightedValueIndex, setHighlightedValueIndex] = useState(withValue ? 0 : undefined);
    const [highlightedContainerIndex, setHighlightedContainerIndex] = useState<
        number | undefined
    >();

    const onEnterDiagram = (values: number[], index: number) => {
        setValueToDisplay(values[index]);
        setHighlightedValueIndex(index);
        setHighlightedContainerIndex(index);
    };

    const onLeaveDiagram = () => {
        setValueToDisplay(perMinute);
        setHighlightedValueIndex(withValue ? 0 : undefined);
        setHighlightedContainerIndex(undefined);
    };

    const isValueHighlighted = (index: number) => highlightedValueIndex === index;
    const isContainerHighlighted = (index: number) => highlightedContainerIndex === index;

    const getModifier = (flag: boolean) => (flag ? {color: 'primary'} : {color: 'secondary'});

    const renderValues = () => {
        const max = Math.max(...rawValues, 0) || 1;

        return rawValues.map((value, index) => (
            <div
                key={index}
                className={b('bar-container', {
                    highlighted: isContainerHighlighted(index),
                })}
                onMouseEnter={onEnterDiagram.bind(null, rawValues, index)}
            >
                <div
                    className={b('bar', {
                        color: isValueHighlighted(index) ? 'dark' : 'light',
                    })}
                    style={{width: `${(100 * value) / max}%`}}
                />
            </div>
        ));
    };

    const renderPopoverContent = () => {
        return (
            <div className={b('popover-content')}>
                <span className={b('popover-header')}>{i18n('averageSpeed')}</span>
                {formattedValues.map((formattedValue, index) => (
                    <span
                        key={index}
                        className={b('popover-row', getModifier(isValueHighlighted(index)))}
                    >
                        {`${formattedValue.label}: ${formattedValue.value}`}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className={b()}>
            <div className={b('content')}>
                {withValue && (
                    <div className={b('displayed-value')}>{formatValue(valueToDisplay)}</div>
                )}
                <div className={b('popover-container')}>
                    <Popover
                        content={renderPopoverContent()}
                        placement={'bottom'}
                        disabled={!withPopover}
                        hasArrow={true}
                        size="s"
                    >
                        <div className={b('bars')} onMouseLeave={onLeaveDiagram}>
                            {renderValues()}
                        </div>
                    </Popover>
                </div>
            </div>
        </div>
    );
};
