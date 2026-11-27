import {Flex, Select, Spin, Text} from '@gravity-ui/uikit';

import i18n from './i18n';
import type {ResourceGrouping} from './resourceUsage';

export function resourceGroupTitle(lower?: number, upper?: number) {
    if (lower === undefined) {
        return i18n('group_unknown');
    }
    if (upper === undefined) {
        return i18n('group_at-least', {lower});
    }
    return lower === 0 ? i18n('group_below', {upper}) : i18n('group_range', {lower, upper});
}

type GroupingOption = {value: ResourceGrouping; content: string};

export function getResourceGroupingOptions(): GroupingOption[] {
    return [
        {value: 'allocated', content: i18n('group-by_allocated')},
        {value: 'memory-allocated', content: i18n('group-by_memory-allocated')},
    ];
}

export function ResourceGroupFilter({
    mode,
    options,
    onChange,
    loading,
}: {
    mode?: ResourceGrouping;
    options: GroupingOption[];
    onChange: (mode?: string) => void;
    loading: boolean;
}) {
    const label = i18n('label_group-by');
    return (
        <Flex alignItems="center" gap={2}>
            <Text variant="body-2">{label}</Text>
            <Select
                aria-label={label}
                hasClear
                placeholder="–"
                width={280}
                value={mode ? [mode] : []}
                onUpdate={([value]) => onChange(value || undefined)}
                options={options}
            />
            {loading && <Spin size="xs" aria-label={i18n('label_loading-presets')} />}
        </Flex>
    );
}
