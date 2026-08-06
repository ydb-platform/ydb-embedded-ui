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

export function MetricTabCard({
    title,
    status,
    value,
    description,
    helpText,
    active,
}: MetricTabCardProps) {
    return (
        <Card className={b({active})} type="container" view={active ? 'outlined' : 'filled'}>
            <Flex direction="column" gap={0.5}>
                <Flex alignItems="center" gap={1}>
                    <Text variant="subheader-2" data-qa="tenant-metric-tab-title">
                        {title}
                    </Text>
                    <Flex alignItems="center" gap={1}>
                        <Text variant="body-1" color="secondary" data-qa="tenant-metric-tab-value">
                            {value}
                        </Text>
                        {helpText ? (
                            <Popover
                                content={
                                    <div className={b('status-help-mark-popover')}>{helpText}</div>
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
                                    <StatusIcon status={status} mode="icons" size="s" />
                                </button>
                            </Popover>
                        ) : (
                            <StatusIcon status={status} mode="icons" size="s" />
                        )}
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
