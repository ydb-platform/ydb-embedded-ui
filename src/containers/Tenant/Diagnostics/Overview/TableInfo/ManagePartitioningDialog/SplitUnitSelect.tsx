import React from 'react';

import type {SelectProps} from '@gravity-ui/uikit';
import {ArrowToggle, Button, Flex, Select, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../../../utils/cn';

import type {UnitOptionsType} from './constants';

import './SplitUnitSelect.scss';

const b = cn('split-unit-select');

interface SplitUnitSelectProps {
    value: string;
    options: UnitOptionsType;
    width?: number;
    size?: SelectProps['size'];
    onChange: (nextValue: string) => void;
}

export function SplitUnitSelect({
    value,
    options,
    width = 55,
    size = 's',
    onChange,
}: SplitUnitSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const selected = React.useMemo(
        () => options.find((option) => option.value === value),
        [options, value],
    );
    const selectedLabel = selected?.content ?? value;

    const handleOpenChange = React.useCallback((nextOpen: boolean) => {
        setIsOpen(nextOpen);
    }, []);

    const handleToggleOpen = React.useCallback(() => {
        setIsOpen((open) => !open);
    }, []);

    const renderControl: SelectProps['renderControl'] = React.useCallback(
        () => (
            <Button type="button" className={b('button')} size={size} onClick={handleToggleOpen}>
                <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    gap="1"
                    className={b('button-content')}
                >
                    <Text>{selectedLabel}</Text>
                    <ArrowToggle direction="bottom" />
                </Flex>
            </Button>
        ),
        [handleToggleOpen, selectedLabel, size],
    );

    return (
        <Select
            size={size}
            className={b('select')}
            options={options}
            value={[value]}
            open={isOpen}
            width={width}
            onOpenChange={handleOpenChange}
            renderControl={renderControl}
            onUpdate={(next) => {
                const nextUnit = next?.[0] ?? value;
                onChange(nextUnit);
                setIsOpen(false);
            }}
        />
    );
}
