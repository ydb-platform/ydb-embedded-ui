import {CircleExclamation, CircleXmark, Clock, TrashBin} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {b} from '../constants';
import i18n from '../i18n';

interface PDiskDriveLegendProps {
    className?: string;
}

interface PDiskDriveLegendItem {
    text: string;
    theme: LabelProps['theme'];
    icon?: IconData;
}

const iconSize = 12;

const legendItems: PDiskDriveLegendItem[] = [
    {text: i18n('drive_active'), theme: 'success'},
    {text: i18n('drive_inactive'), theme: 'warning', icon: Clock},
    {text: i18n('drive_to-be-removed'), theme: 'warning', icon: TrashBin},
    {text: i18n('drive_faulty'), theme: 'danger', icon: CircleExclamation},
    {text: i18n('drive_broken'), theme: 'danger', icon: CircleXmark},
];

export function PDiskDriveLegend({className}: PDiskDriveLegendProps) {
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
