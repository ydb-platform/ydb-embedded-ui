import {Card, Flex, Text} from '@gravity-ui/uikit';

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
    active?: boolean;
}

export function MetricTabCard({title, status, value, description, active}: MetricTabCardProps) {
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
                        <StatusIcon status={status} mode="icons" size="s" />
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
