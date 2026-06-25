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
        <Card className={b({active})} type="container" view={active ? 'outlined' : 'raised'}>
            <Flex direction="column" gap={0.5} className={b('content')}>
                <Flex alignItems="center" gap={1} className={b('header')}>
                    <Text
                        variant="subheader-2"
                        className={b('title')}
                        data-qa="tenant-metric-tab-title"
                    >
                        {title}
                    </Text>
                    <Flex alignItems="center" gap={1} className={b('status')}>
                        <StatusIcon
                            status={status}
                            mode="icons"
                            size="s"
                            className={b('status-icon')}
                        />
                        <Text
                            variant="body-2"
                            className={b('status-value')}
                            data-qa="tenant-metric-tab-value"
                        >
                            {value}
                        </Text>
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
