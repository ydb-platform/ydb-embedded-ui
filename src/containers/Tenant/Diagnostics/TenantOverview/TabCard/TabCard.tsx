import {Card, Flex, HelpMark, Text} from '@gravity-ui/uikit';

import {DoughnutMetrics} from '../../../../../components/DoughnutMetrics/DoughnutMetrics';
import {formatBytes} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import {formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import type {ProgressStatus} from '../../../../../utils/progress';

import './TabCard.scss';

const b = cn('tenant-tab-card');

interface TabCardProps {
    label: string;
    sublabel?: string;
    value: number;
    limit: number;
    unit?: string;
    active?: boolean;
    status?: ProgressStatus;
    helpText?: string;
    clickable?: boolean;
}

export function TabCard({
    label,
    sublabel,
    value,
    limit,
    unit = '',
    active,
    status = 'good',
    helpText,
    clickable = true,
}: TabCardProps) {
    const percentage = limit > 0 ? (value / limit) * 100 : 0;
    const formattedPercentage = formatPercent(percentage / 100);

    // Format values based on unit type
    let formattedValue: string;
    if (unit === 'bytes') {
        const formattedUsed = formatBytes({value});
        const formattedLimit = formatBytes({value: limit});
        formattedValue = `${formattedUsed} of ${formattedLimit}`;
    } else {
        formattedValue = `${value} of ${limit}${unit ? ' ' + unit : ''}`;
    }

    return (
        <div className={b({clickable, active})}>
            <Card
                className={b('card-container', {active})}
                type="container"
                view={active ? 'outlined' : 'filled'}
            >
                <Flex gap={3} alignItems="center">
                    <DoughnutMetrics
                        size="small"
                        status={status}
                        fillWidth={percentage}
                        className={b('doughnut')}
                    >
                        <DoughnutMetrics.Value variant="subheader-1">
                            {formattedPercentage}
                        </DoughnutMetrics.Value>
                    </DoughnutMetrics>
                    <Flex direction="column" gap={1}>
                        <Text variant="subheader-2" color="primary">
                            {formattedValue}
                        </Text>
                        <Flex alignItems="center" gap={1}>
                            <Text variant="body-1" color="secondary">
                                {sublabel || label}
                            </Text>
                            {helpText && <HelpMark className={b('help-icon')}>{helpText}</HelpMark>}
                        </Flex>
                    </Flex>
                </Flex>
            </Card>
        </div>
    );
}
