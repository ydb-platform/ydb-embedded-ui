import {Dots9, Ellipsis, GripHorizontal} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {b} from '../constants';
import i18n from '../i18n';

interface FrontQueuesLegendProps {
    className?: string;
}

interface FrontQueuesLegendItem {
    text: string;
    theme: LabelProps['theme'];
    icon?: IconData;
    className?: string;
}

const iconSize = 12;

const legendItems: FrontQueuesLegendItem[] = [
    {text: i18n('front-queues_ok'), theme: 'success'},
    {text: i18n('front-queues_notice'), theme: 'warning', icon: Ellipsis},
    {text: i18n('front-queues_warning'), theme: 'danger', icon: GripHorizontal},
    {
        text: i18n('front-queues_impaired'),
        theme: 'danger',
        icon: Dots9,
        className: b('label-danger-heavy'),
    },
];

export function FrontQueuesLegend({className}: FrontQueuesLegendProps) {
    return (
        <Flex className={className} gap={3} alignItems="center" wrap="wrap">
            <Flex gap={2} alignItems="center" wrap="wrap">
                {legendItems.map(({text, theme, icon, className: labelClassName}) => (
                    <Label
                        key={text}
                        size="xs"
                        theme={theme}
                        className={labelClassName}
                        icon={icon ? <Icon data={icon} size={iconSize} /> : undefined}
                    >
                        {text}
                    </Label>
                ))}
            </Flex>
            <Text className={b('empty-statistics')} color="secondary">
                {i18n('context_no-statistics')}
            </Text>
        </Flex>
    );
}
