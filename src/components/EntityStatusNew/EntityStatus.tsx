import React from 'react';

import type {LabelProps} from '@gravity-ui/uikit';
import {ActionTooltip, Flex, HelpMark, Icon, Label} from '@gravity-ui/uikit';

import type {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {getEFlagView} from '../../utils/healthStatus/healthCheck';

import './EntityStatus.scss';

const b = cn('ydb-entity-status-new');

interface EntityStatusLabelProps {
    status: EFlag;
    note?: React.ReactNode;
    children?: React.ReactNode;
    withStatusName?: boolean;
    size?: LabelProps['size'];
    iconSize?: number;
    withIcon?: boolean;
    withTooltip?: boolean;
}

function EntityStatusLabel({
    children,
    status,
    withStatusName = true,
    note,
    size = 'm',
    iconSize = 14,
    withIcon = true,
    withTooltip = true,
}: EntityStatusLabelProps) {
    const {theme, icon, title, description} = getEFlagView(status);

    const label = (
        <Label
            className={b({critical: theme === 'critical'})}
            theme={theme === 'critical' ? undefined : theme}
            icon={withIcon ? <Icon size={iconSize} data={icon} /> : undefined}
            size={size}
        >
            <Flex gap="2" wrap="nowrap">
                {children}
                {withStatusName ? title : null}
                {note && <HelpMark className={b('note')}>{note}</HelpMark>}
            </Flex>
        </Label>
    );

    if (!withTooltip) {
        return label;
    }

    return (
        <ActionTooltip title={description} disabled={Boolean(note)}>
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
