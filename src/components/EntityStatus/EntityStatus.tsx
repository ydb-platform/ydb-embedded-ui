import React from 'react';

import type {LabelProps} from '@gravity-ui/uikit';
import {ActionTooltip, Flex, HelpMark, Label, Tooltip} from '@gravity-ui/uikit';

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

const EFlagToStatusName: Record<EFlag, string> = {
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
    qa?: string;
}

interface DefaultEntityStatusLabelProps {
    view?: 'default';
    ariaLabelPrefix?: string;
    note?: React.ReactNode;
    children?: React.ReactNode;
    endContent?: React.ReactNode;
    withStatusName?: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

interface CompactEntityStatusLabelProps {
    view: 'compact';
    ariaLabelPrefix?: never;
    note?: never;
    children?: never;
    endContent?: never;
    withStatusName?: never;
    onClick?: never;
}

type EntityStatusLabelProps = EntityStatusLabelBaseProps &
    (DefaultEntityStatusLabelProps | CompactEntityStatusLabelProps);

function EntityStatusLabel({
    ariaLabelPrefix,
    children,
    className,
    endContent,
    status,
    withStatusName = true,
    view = 'default',
    note,
    size = 'm',
    iconSize = 14,
    onClick,
    qa,
}: EntityStatusLabelProps) {
    if (view === 'compact') {
        const statusName = EFlagToStatusName[status];
        return (
            <ActionTooltip title={statusName}>
                <span className={b('compact')} role="img" aria-label={statusName}>
                    <Label
                        theme={status === EFlag.Blue ? 'info' : EFlagToLabelTheme[status]}
                        icon={<StatusIcon size={iconSize} status={status} />}
                        size={size}
                        className={b(null, className)}
                        qa={qa}
                    />
                </span>
            </ActionTooltip>
        );
    }
    const theme = EFlagToLabelTheme[status];
    const isClickable = Boolean(onClick);
    const label = (
        <Label
            theme={theme}
            icon={<StatusIcon size={iconSize} status={status} />}
            size={size}
            className={b({critical: status === EFlag.Red, clickable: isClickable}, className)}
            interactive={isClickable}
            qa={qa}
        >
            <Flex gap="2" wrap="nowrap">
                {children}
                {withStatusName ? EFlagToStatusName[status] : null}
                {endContent ? <Flex alignSelf="center">{endContent}</Flex> : null}
                {note && !isClickable && <HelpMark className={b('note')}>{note}</HelpMark>}
            </Flex>
        </Label>
    );

    if (isClickable) {
        return (
            <Tooltip
                openDelay={500}
                content={
                    <Flex direction="column" gap="1">
                        <span>{EFlagToDescription[status]}</span>
                        {note ? <span>{note}</span> : null}
                    </Flex>
                }
            >
                <button
                    type="button"
                    className={b('button')}
                    onClick={onClick}
                    aria-label={
                        ariaLabelPrefix
                            ? `${ariaLabelPrefix} ${EFlagToStatusName[status]}`
                            : undefined
                    }
                >
                    {label}
                </button>
            </Tooltip>
        );
    }

    return (
        <ActionTooltip title={EFlagToDescription[status]} disabled={Boolean(note)}>
            {label}
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
