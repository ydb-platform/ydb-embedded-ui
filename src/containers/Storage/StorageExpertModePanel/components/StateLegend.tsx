import {CircleExclamation, CircleXmark, Clock} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {b} from '../constants';
import i18n from '../i18n';

interface StateLegendProps {
    className?: string;
}

interface StateLegendItem {
    text: string;
    theme: LabelProps['theme'];
    icon?: IconData;
    className?: string;
}

const iconSize = 12;

const legendItems: StateLegendItem[] = [
    {text: i18n('value_ok'), theme: 'success'},
    {text: i18n('value_replication'), theme: 'info'},
    {text: i18n('value_initial'), theme: 'warning', icon: Clock},
    {text: i18n('value_pdisk-error'), theme: 'danger', icon: CircleExclamation},
    {
        text: i18n('value_error'),
        theme: 'danger',
        icon: CircleXmark,
        className: b('label-danger-heavy'),
    },
    {text: i18n('value_no-data'), theme: 'unknown'},
];

export function StateLegend({className}: StateLegendProps) {
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
