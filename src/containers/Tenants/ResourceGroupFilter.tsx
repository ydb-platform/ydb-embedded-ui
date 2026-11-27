import {Flex, Select, Spin, Text} from '@gravity-ui/uikit';

import i18n from './i18n';
import {RESOURCE_GROUPINGS} from './resourceUsage';
import type {ResourceGrouping, ResourceUsageGroup} from './resourceUsage';

export function resourceGroupTitle({lower, upper, notApplicable}: ResourceUsageGroup) {
    if (notApplicable) {
        return i18n('group_none');
    }
    if (lower === undefined) {
        return i18n('group_unknown');
    }
    if (upper === undefined) {
        return i18n('group_at-least', {lower});
    }
    return lower === 0 ? i18n('group_below', {upper}) : i18n('group_range', {lower, upper});
}

export function ResourceGroupFilter({
    mode,
    onChange,
    loading,
}: {
    mode?: ResourceGrouping;
    onChange: (mode?: ResourceGrouping) => void;
    loading: boolean;
}) {
    const label = i18n('label_group-by');
    const options = RESOURCE_GROUPINGS.map((value) => ({
        value,
        content: i18n(`value_group-by-${value}`),
    }));
    return (
        <Flex alignItems="center" gap={2}>
            <Text variant="body-2">{label}</Text>
            <Select
                aria-label={label}
                hasClear
                placeholder="–"
                width={280}
                value={mode ? [mode] : []}
                onUpdate={([value]) => onChange(RESOURCE_GROUPINGS.find((item) => item === value))}
                options={options}
            />
            {loading && <Spin size="xs" aria-label={i18n('label_loading-presets')} />}
        </Flex>
    );
}
