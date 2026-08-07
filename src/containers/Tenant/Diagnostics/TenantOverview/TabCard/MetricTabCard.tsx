import React from 'react';

import {Card, Flex, Popover, Text} from '@gravity-ui/uikit';

import {StatusIcon} from '../../../../../components/StatusIcon/StatusIcon';
import type {EFlag} from '../../../../../types/api/enums';
import {cn} from '../../../../../utils/cn';

import './TabCard.scss';

const b = cn('tenant-tab-card');

interface MetricTabCardProps {
    title: string;
    status: EFlag;
    value: string;
    description: string;
    helpText?: string;
    active?: boolean;
}

function handleHelpMarkClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
}

function handleHelpMarkPopoverClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
}

export function MetricTabCard({
    title,
    status,
    value,
    description,
    helpText,
    active,
}: MetricTabCardProps) {
    const statusIcon = <StatusIcon status={status} mode="icons" size="s" />;
    const statusHelpMark = helpText ? (
        <Popover
            content={
                <div className={b('status-help-mark-popover')} onClick={handleHelpMarkPopoverClick}>
                    {helpText}
                </div>
            }
            hasArrow
            placement={['top', 'bottom']}
        >
            <button
                type="button"
                className={b('status-help-mark')}
                aria-label={helpText}
                onClick={handleHelpMarkClick}
            >
                {statusIcon}
            </button>
        </Popover>
    ) : (
        statusIcon
    );

    return (
        <Card className={b({active})} type="container" view={active ? 'outlined' : 'filled'}>
            <Flex direction="column" gap={0.5}>
                <Flex alignItems="baseline" gap={1}>
                    <Text variant="subheader-2" data-qa="tenant-metric-tab-title">
                        {title}
                    </Text>
                    <Flex alignItems="center" gap={1}>
                        <Text variant="body-2" color="secondary" data-qa="tenant-metric-tab-value">
                            {value}
                        </Text>
                        {statusHelpMark}
                    </Flex>
                </Flex>
                <Text
                    variant="caption-2"
                    color="secondary"
                    className={b('description')}
                    data-qa="tenant-metric-tab-description"
                >
                    {description}
                </Text>
            </Flex>
        </Card>
    );
}
