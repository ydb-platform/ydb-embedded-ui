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

const EFlagToLabelTheme: Record<EFlag, LabelProps['theme']> = {
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

interface EntityStatusLabelProps {
    status: EFlag;
    note?: React.ReactNode;
    children?: React.ReactNode;
    withStatusName?: boolean;
    size?: LabelProps['size'];
    iconSize?: number;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

function EntityStatusLabel({
    children,
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
                theme={theme}
                icon={<StatusIcon size={iconSize} status={status} />}
                size={size}
                className={b({critical: status === EFlag.Red, clickable: isClickable})}
                onClick={onClick}
                interactive={isClickable}
            >
                <Flex gap="2" wrap="nowrap">
                    {children}
                    {withStatusName ? EFlagToStatusName[status] : null}
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
