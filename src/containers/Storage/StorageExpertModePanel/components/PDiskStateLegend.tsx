import {CircleExclamationFill, CircleStopFill, CircleXmarkFill, ClockFill} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {b} from '../constants';
import i18n from '../i18n';

interface PDiskStateLegendProps {
    className?: string;
}

interface PDiskStateLegendItem {
    text: string;
    theme: LabelProps['theme'];
    icon?: IconData;
    className?: string;
}

const iconSize = 12;

const legendItems: PDiskStateLegendItem[] = [
    {text: i18n('value_ok'), theme: 'success'},
    {text: i18n('value_initial'), theme: 'warning', icon: ClockFill},
    {text: i18n('value_attention'), theme: 'danger', icon: CircleExclamationFill},
    {text: i18n('value_stopped'), theme: 'danger', icon: CircleStopFill},
    {
        text: i18n('value_error'),
        theme: 'danger',
        icon: CircleXmarkFill,
        className: b('label-danger-heavy'),
    },
    {text: i18n('value_no-data'), theme: 'unknown'},
];

export function PDiskStateLegend({className}: PDiskStateLegendProps) {
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
