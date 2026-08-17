import {Ban, Wrench} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {b} from '../constants';
import i18n from '../i18n';

interface PDiskMaintenanceLegendProps {
    className?: string;
}

interface PDiskMaintenanceLegendItem {
    text: string;
    theme: LabelProps['theme'];
    icon?: IconData;
}

const iconSize = 12;

const legendItems: PDiskMaintenanceLegendItem[] = [
    {
        text: i18n('value_maintenance-long-term-planned'),
        theme: 'danger',
        icon: Wrench,
    },
    {
        text: i18n('value_maintenance-no-new-vdisks'),
        theme: 'warning',
        icon: Ban,
    },
    {text: i18n('value_maintenance-no-request'), theme: 'success'},
];

export function PDiskMaintenanceLegend({className}: PDiskMaintenanceLegendProps) {
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
