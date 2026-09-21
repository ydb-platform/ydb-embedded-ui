import React from 'react';

import {Flex, SegmentedRadioGroup, Text} from '@gravity-ui/uikit';

import {b} from '../constants';

import '../StorageExpertModePanel.scss';

export interface ExpertModeOption<T extends string> {
    value: T;
    content: React.ReactNode;
}

interface ExpertModePanelLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function ExpertModePanelLayout({children, className}: ExpertModePanelLayoutProps) {
    return <div className={b(null, className)}>{children}</div>;
}

interface ExpertModeRowProps<T extends string> {
    label: React.ReactNode;
    value: T;
    onUpdate: (value: T) => void;
    options: readonly ExpertModeOption<T>[];
    legend: React.ReactNode;
    qa?: string;
}

export function ExpertModeRow<T extends string>({
    label,
    value,
    onUpdate,
    options,
    legend,
    qa,
}: ExpertModeRowProps<T>) {
    const labelId = React.useId();

    return (
        <Flex gap={3} alignItems="center">
            <Text id={labelId} variant="subheader-1">
                {label}
            </Text>
            <SegmentedRadioGroup
                aria-labelledby={labelId}
                qa={qa}
                value={value}
                onUpdate={(nextValue) => onUpdate(nextValue as T)}
                size="s"
            >
                {options.map((option) => (
                    <SegmentedRadioGroup.Option key={option.value} value={option.value}>
                        {option.content}
                    </SegmentedRadioGroup.Option>
                ))}
            </SegmentedRadioGroup>
            {legend}
        </Flex>
    );
}
