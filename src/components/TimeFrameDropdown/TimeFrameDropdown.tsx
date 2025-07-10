import React from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import type {ButtonProps} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {TIMEFRAMES} from '../../utils/timeframes';
import type {TimeFrame} from '../../utils/timeframes';

import i18n from './i18n';

const getTimeFrameLabel = (timeFrame: TimeFrame) => {
    switch (timeFrame) {
        case '30m':
            return i18n('value_30m');
        case '1h':
            return i18n('value_1h');
        case '1d':
            return i18n('value_1d');
        case '1w':
            return i18n('value_1w');
        default:
            return timeFrame;
    }
};

const b = cn('ydb-timeframe-dropdown');

interface TimeFrameDropdownProps {
    value: TimeFrame;
    onChange: (value: TimeFrame) => void;
    className?: string;
    size?: ButtonProps['size'];
    view?: ButtonProps['view'];
}

export const TimeFrameDropdown = ({
    value,
    onChange,
    className,
    size = 's',
    view = 'flat-secondary',
}: TimeFrameDropdownProps) => {
    const items = React.useMemo(
        () =>
            Object.keys(TIMEFRAMES).map((timeFrame) => ({
                text: getTimeFrameLabel(timeFrame as TimeFrame),
                action: () => onChange(timeFrame as TimeFrame),
            })),
        [onChange],
    );

    const renderSwitcher = (props: ButtonProps) => (
        <Button {...props} size={size} view={view} className={b(null, className)}>
            {getTimeFrameLabel(value)}
            <Icon data={ChevronDown} size={12} />
        </Button>
    );

    return (
        <DropdownMenu
            renderSwitcher={renderSwitcher}
            items={items}
            popupProps={{placement: 'bottom-start'}}
        />
    );
};
