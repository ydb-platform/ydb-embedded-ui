import React from 'react';

import type {LabelProps} from '@gravity-ui/uikit';
import {ActionTooltip, Flex, HelpMark, Label} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {StatusIcon} from '../StatusIconNew/StatusIcon';

import i18n from './i18n';
import {EFlagToDescription} from './utils';

import './EntityStatus.scss';

const b = cn('ydb-entity-status');

export const EFlagToLabelTheme: Record<EFlag, LabelProps['theme']> = {
    [EFlag.Red]: 'danger',
    [EFlag.Blue]: 'success',
    [EFlag.Green]: 'success',
    [EFlag.Grey]: 'unknown',
    [EFlag.Orange]: 'danger',
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

interface EntityStatusLabelBaseProps {
    status: EFlag;
    className?: string;
    size?: LabelProps['size'];
    iconSize?: number;
    checkIcon?: React.ComponentProps<typeof StatusIcon>['checkIcon'];
    tooltipTitle?: string;
    qa?: string;
}

interface DefaultEntityStatusLabelProps {
    view?: 'default';
    note?: React.ReactNode;
    children?: React.ReactNode;
    endContent?: React.ReactNode;
    withStatusName?: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    'aria-label'?: never;
    tabIndex?: never;
}

interface CompactEntityStatusLabelProps {
    view: 'compact';
    note?: never;
    children?: never;
    endContent?: never;
    withStatusName?: never;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    'aria-label'?: string;
    /** Tab index for a noninteractive tooltip anchor. Clickable labels use their button. */
    tabIndex?: number;
}

type EntityStatusLabelProps = EntityStatusLabelBaseProps &
    (DefaultEntityStatusLabelProps | CompactEntityStatusLabelProps);

function EntityStatusLabel({
    children,
    className,
    endContent,
    status,
    withStatusName = true,
    view = 'default',
    note,
    size = 'm',
    iconSize = 14,
    checkIcon,
    tooltipTitle,
    onClick,
    qa,
    'aria-label': ariaLabel,
    tabIndex,
}: EntityStatusLabelProps) {
    if (view === 'compact') {
        const statusName = EFlagToStatusName[status];
        const accessibleName = ariaLabel ?? statusName;
        const label = (
            <Label
                theme={status === EFlag.Blue ? 'info' : EFlagToLabelTheme[status]}
                icon={<StatusIcon size={iconSize} status={status} checkIcon={checkIcon} />}
                size={size}
                className={b(null, className)}
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
    const theme = EFlagToLabelTheme[status];
    const isClickable = Boolean(onClick);
    return (
        <ActionTooltip title={tooltipTitle ?? EFlagToDescription[status]} disabled={Boolean(note)}>
            <Label
                theme={theme}
                icon={<StatusIcon size={iconSize} status={status} checkIcon={checkIcon} />}
                size={size}
                className={b({critical: status === EFlag.Red, clickable: isClickable}, className)}
                onClick={onClick}
                interactive={isClickable}
                qa={qa}
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
EntityStatus.displayName = 'EntityStatus';
