import {ArrowUpFromLine, HourglassStart, Xmark} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {b} from '../constants';
import i18n from '../i18n';

interface PDiskDecommitLegendProps {
    className?: string;
}

interface PDiskDecommitLegendItem {
    text: string;
    theme: LabelProps['theme'];
    icon?: IconData;
}

const iconSize = 12;

const legendItems: PDiskDecommitLegendItem[] = [
    {text: i18n('value_decommit-imminent'), theme: 'danger', icon: ArrowUpFromLine},
    {text: i18n('value_decommit-rejected'), theme: 'warning', icon: Xmark},
    {text: i18n('value_decommit-pending'), theme: 'info', icon: HourglassStart},
    {text: i18n('value_decommit-none'), theme: 'success'},
];

export function PDiskDecommitLegend({className}: PDiskDecommitLegendProps) {
    return (
        <Flex className={className} gap={3} alignItems="center" wrap="wrap">
            <Flex gap={2} alignItems="center" wrap="wrap">
                {legendItems.map(({text, theme, icon}) => (
                    <Label
                        key={text}
                        size="xs"
                        theme={theme}
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
