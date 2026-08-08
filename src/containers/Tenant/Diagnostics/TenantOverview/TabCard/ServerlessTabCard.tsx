import React from 'react';

import {CircleQuestion} from '@gravity-ui/icons';
import {Card, Flex, Icon, Popover, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';

import './TabCard.scss';

const b = cn('tenant-tab-card');

function handleHelpMarkPopoverClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
}

interface ServerlessTabCardProps {
    title: string;
    active?: boolean;
    description: string;
    helpText?: string;
}

export function ServerlessTabCard({title, active, description, helpText}: ServerlessTabCardProps) {
    const helpMark = helpText ? (
        <Popover
            content={
                <div className={b('help-mark-popover')} onClick={handleHelpMarkPopoverClick}>
                    {helpText}
                </div>
            }
            hasArrow
            placement={['top', 'bottom']}
        >
            <span className={b('help-mark', {serverless: true})}>
                <Icon data={CircleQuestion} size={14} />
            </span>
        </Popover>
    ) : null;

    return (
        <Card className={b({active})} type="container" view={active ? 'outlined' : 'filled'}>
            <Flex direction="column" gap={0.5}>
                <Flex alignItems="center" gap={1}>
                    <Text variant="subheader-2" data-qa="tenant-metric-tab-title">
                        {title}
                    </Text>
                    {helpMark}
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
