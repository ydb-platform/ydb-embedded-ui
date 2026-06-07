import React from 'react';

import {Check} from '@gravity-ui/icons';
import type {LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {loadFromSessionStorage, saveToSessionStorage} from '../../../../utils';
import {b} from '../constants';
import i18n from '../i18n';

import './SpaceLegend.scss';

interface SpaceLegendProps {
    className?: string;
}

interface SpaceLegendItem {
    id: string;
    text: string;
    theme?: LabelProps['theme'];
    customClass?: string;
}

const STORAGE_KEY = 'ydb-space-legend-selected';

const legendItems: SpaceLegendItem[] = [
    {id: 'green', text: i18n('space_green'), customClass: b('label', {green: true})},
    {id: 'cyan', text: i18n('space_cyan'), customClass: b('label', {cyan: true})},
    {
        id: 'light-yellow',
        text: i18n('space_light-yellow'),
        customClass: b('label', {'light-yellow': true}),
    },
    {id: 'yellow', text: i18n('space_yellow'), customClass: b('label', {yellow: true})},
    {
        id: 'light-orange',
        text: i18n('space_light-orange'),
        customClass: b('label', {'light-orange': true}),
    },
    {
        id: 'pre-orange',
        text: i18n('space_pre-orange'),
        customClass: b('label', {'pre-orange': true}),
    },
    {id: 'orange', text: i18n('space_orange'), customClass: b('label', {orange: true})},
    {id: 'red', text: i18n('space_red'), customClass: b('label', {red: true})},
    {id: 'black', text: i18n('space_black'), customClass: b('label', {black: true})},
];

const defaultSelected = new Set(
    legendItems.map((item) => item.id).filter((id) => id !== 'green' && id !== 'cyan'),
);

function loadSelectedItems(): Set<string> {
    const stored = loadFromSessionStorage(STORAGE_KEY);
    if (Array.isArray(stored)) {
        return new Set(stored);
    }
    return defaultSelected;
}

export function SpaceLegend({className}: SpaceLegendProps) {
    const [selectedItems, setSelectedItems] = React.useState<Set<string>>(loadSelectedItems);

    const toggleItem = React.useCallback((id: string) => {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            saveToSessionStorage(STORAGE_KEY, Array.from(next));
            return next;
        });
    }, []);

    return (
        <Flex className={className} gap={2} alignItems="center" wrap="wrap">
            <Flex gap={2} alignItems="center" wrap="wrap">
                {legendItems.map(({id, text, theme, customClass}) => {
                    const isSelected = selectedItems.has(id);

                    return (
                        <Label
                            key={id}
                            size="xs"
                            theme={theme}
                            className={customClass}
                            onClick={() => toggleItem(id)}
                            icon={
                                <div className={b('label-icon', {selected: isSelected})}>
                                    {isSelected ? <Icon data={Check} size={12} /> : null}
                                </div>
                            }
                        >
                            {text}
                        </Label>
                    );
                })}
            </Flex>
            <Text className={b('empty-statistics')} color="secondary">
                {i18n('context_no-statistics')}
            </Text>
        </Flex>
    );
}
