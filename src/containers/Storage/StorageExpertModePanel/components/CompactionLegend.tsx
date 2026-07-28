import {
    CircleCheckFill,
    CircleExclamationFill,
    CircleXmarkFill,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {b} from '../constants';
import i18n from '../i18n';

interface CompactionLegendProps {
    className?: string;
}

interface CompactionLegendItem {
    text: string;
    theme: LabelProps['theme'];
    icon: IconData;
    className?: string;
}

const iconSize = 12;

const legendItems: CompactionLegendItem[] = [
    {text: i18n('compaction_ok'), theme: 'success', icon: CircleCheckFill},
    {text: i18n('compaction_notice'), theme: 'warning', icon: TriangleExclamationFill},
    {text: i18n('compaction_warning'), theme: 'danger', icon: CircleExclamationFill},
    {
        text: i18n('compaction_impaired'),
        theme: 'danger',
        icon: CircleXmarkFill,
        className: b('label-danger-heavy'),
    },
];

export function CompactionLegend({className}: CompactionLegendProps) {
    return (
        <Flex className={className} gap={3} alignItems="center" wrap="wrap">
            <Flex gap={2} alignItems="center" wrap="wrap">
                <Text color="secondary">{i18n('compaction_key')}</Text>
                {legendItems.map(({text, theme, icon, className: labelClassName}) => (
                    <Label
                        key={text}
                        size="xs"
                        theme={theme}
                        className={labelClassName}
                        icon={<Icon data={icon} size={iconSize} />}
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
