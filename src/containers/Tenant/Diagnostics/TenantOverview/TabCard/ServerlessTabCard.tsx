import {Card, Flex, HelpMark, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';

import './TabCard.scss';

const b = cn('tenant-tab-card');

interface ServerlessTabCardProps {
    title: string;
    active?: boolean;
    description: string;
    helpText?: string;
}

export function ServerlessTabCard({title, active, description, helpText}: ServerlessTabCardProps) {
    return (
        <Card className={b({active})} type="container" view={active ? 'outlined' : 'filled'}>
            <Flex direction="column" gap={0.5}>
                <Flex alignItems="center" gap={1}>
                    <Text variant="subheader-2" data-qa="tenant-metric-tab-title">
                        {title}
                    </Text>
                    {helpText ? (
                        <HelpMark iconSize="s" popoverProps={{placement: 'right'}}>
                            {helpText}
                        </HelpMark>
                    ) : null}
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
