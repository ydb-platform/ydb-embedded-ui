import React from 'react';

import {
    ArrowsRotateRight,
    Check,
    CircleExclamation,
    Flame,
    Ghost,
    TriangleExclamation,
} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {ActionTooltip, Flex, HelpMark, Icon, Label} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {StatusIcon} from '../StatusIconNew/StatusIcon';

import i18n from './i18n';
import {EFlagToDescription} from './utils';

import './EntityStatus.scss';

const b = cn('ydb-entity-status-new');

const EFlagToLabelTheme: Record<EFlag, LabelProps['theme'] | 'orange'> = {
    [EFlag.Red]: 'danger',
    [EFlag.Blue]: 'info',
    [EFlag.Green]: 'success',
    [EFlag.Grey]: 'unknown',
    [EFlag.Orange]: 'orange',
    [EFlag.Yellow]: 'warning',
};

export const EFlagToStatusName: Record<EFlag, string> = {
    get [EFlag.Red]() {
        return i18n('title_red');
    },
    get [EFlag.Yellow]() {
        return i18n('title_yellow');
    },
    get [EFlag.Orange]() {
        return i18n('title_orange');
    },
    get [EFlag.Green]() {
        return i18n('title_green');
    },
    get [EFlag.Grey]() {
        return i18n('title_grey');
    },
    get [EFlag.Blue]() {
        return i18n('title_blue');
    },
};

interface EntityStatusLabelProps {
    status: EFlag;
    note?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    endContent?: React.ReactNode;
    qa?: string;
    withStatusName?: boolean;
    size?: LabelProps['size'];
    iconSize?: number;
    onClick?: () => void;
}

function EntityStatusLabel({
    children,
    className,
    endContent,
    qa,
    status,
    withStatusName = true,
    note,
    size = 'm',
    iconSize = 14,
    onClick,
}: EntityStatusLabelProps) {
    const theme = EFlagToLabelTheme[status];
    const isClickable = Boolean(onClick);
    return (
        <ActionTooltip title={EFlagToDescription[status]} disabled={Boolean(note)}>
            <Label
                theme={theme === 'orange' ? undefined : theme}
                icon={<StatusIcon size={iconSize} status={status} />}
                size={size}
                className={b({orange: theme === 'orange', clickable: isClickable}, className)}
                qa={qa}
                onClick={onClick}
                interactive={isClickable}
            >
                <Flex gap="2" wrap="nowrap">
                    {children}
                    {withStatusName ? EFlagToStatusName[status] : null}
                    {endContent ? <Flex alignSelf="center">{endContent}</Flex> : null}
                    {note && <HelpMark className={b('note')}>{note}</HelpMark>}
                </Flex>
            </Label>
        </ActionTooltip>
    );
}

const compactStatusIcons: Record<EFlag, IconData> = {
    [EFlag.Blue]: ArrowsRotateRight,
    [EFlag.Yellow]: TriangleExclamation,
    [EFlag.Orange]: Flame,
    [EFlag.Red]: CircleExclamation,
    [EFlag.Green]: Check,
    [EFlag.Grey]: Ghost,
};

interface CompactEntityStatusLabelProps {
    status: EFlag;
    size?: LabelProps['size'];
    iconSize?: number;
    onClick?: () => void;
    qa?: string;
    tooltipTitle?: string;
    'aria-label'?: string;
    tabIndex?: number;
}

function CompactEntityStatusLabel({
    status,
    size,
    iconSize,
    onClick,
    qa,
    tooltipTitle,
    'aria-label': ariaLabel,
    tabIndex,
}: CompactEntityStatusLabelProps) {
    const statusName = EFlagToStatusName[status];
    const accessibleName = ariaLabel ?? statusName;
    const theme = EFlagToLabelTheme[status];
    const label = (
        <Label
            theme={theme === 'orange' ? 'danger' : theme}
            icon={<Icon size={iconSize} data={compactStatusIcons[status]} />}
            size={size}
            interactive={Boolean(onClick)}
        />
    );

    return (
        <ActionTooltip title={tooltipTitle ?? statusName}>
            <span
                className={b('compact')}
                role={onClick ? undefined : 'img'}
                aria-label={onClick ? undefined : accessibleName}
                tabIndex={onClick ? undefined : tabIndex}
                data-qa={qa}
            >
                {onClick ? (
                    <button
                        type="button"
                        className={b('compact-button')}
                        onClick={onClick}
                        aria-label={accessibleName}
                    >
                        {label}
                    </button>
                ) : (
                    label
                )}
            </span>
        </ActionTooltip>
    );
}

interface EntityStatusProps {
    children?: React.ReactNode;
    className?: string;
}

export function EntityStatus({className, children}: EntityStatusProps) {
    return (
        <Flex gap="2" wrap="nowrap" alignItems="center" className={b(null, className)}>
            {children}
        </Flex>
    );
}

EntityStatus.Label = EntityStatusLabel;
EntityStatus.CompactLabel = CompactEntityStatusLabel;
EntityStatus.displayName = 'EntityStatus';
