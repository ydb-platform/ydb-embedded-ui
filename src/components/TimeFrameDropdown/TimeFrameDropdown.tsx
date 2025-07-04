import React from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import type {ButtonProps} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {TIMEFRAMES} from '../../utils/timeframes';
import type {TimeFrame} from '../../utils/timeframes';

import i18n from './i18n';

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
                text: i18n(timeFrame as TimeFrame),
                action: () => onChange(timeFrame as TimeFrame),
            })),
        [onChange],
    );

    const renderSwitcher = (props: ButtonProps) => (
        <Button {...props} size={size} view={view} className={b(null, className)}>
            {i18n(value)}
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
