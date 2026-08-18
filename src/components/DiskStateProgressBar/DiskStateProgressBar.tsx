import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {cn} from '../../utils/cn';
import type {DiskDisplayMode} from '../../utils/disks/displayState';
import type {DiskBarTone} from '../../utils/disks/types';
import {useSetting} from '../../utils/hooks';
import {isNumeric} from '../../utils/utils';

import './DiskStateProgressBar.scss';

const b = cn('storage-disk-progress-bar');

interface DiskStateProgressBarProps {
    allocation?: number;
    tone: DiskBarTone;
    mode?: DiskDisplayMode;
    compact?: boolean;
    faded?: boolean;
    inactive?: boolean;
    empty?: boolean;
    striped?: boolean;
    filled?: boolean;
    leading?: React.ReactNode;
    content?: React.ReactNode;
    overlay?: React.ReactNode;
    className?: string;
    highlighted?: boolean;
    strongFill?: boolean;
    borderless?: boolean;
    overflowVisible?: boolean;
}

function getToneModifier(tone: DiskBarTone) {
    return tone === 'LightGrey' ? 'light-grey' : tone.toLowerCase();
}

export function DiskStateProgressBar({
    allocation,
    tone,
    mode,
    compact,
    faded,
    inactive,
    empty,
    striped,
    filled,
    leading,
    content,
    overlay,
    className,
    highlighted,
    strongFill,
    borderless,
    overflowVisible,
}: DiskStateProgressBarProps) {
    const [inverted] = useSetting<boolean | undefined>(SETTING_KEYS.INVERTED_DISKS);

    const mods: Record<string, boolean | undefined> = {
        inverted,
        compact,
        faded,
        empty,
        inactive,
        striped,
        filled,
        highlighted,
        'all-mode-has-issues': mode === 'all' && strongFill,
        'legend-inactive': borderless,
        'overlap-icon-at-top-left': overflowVisible,
        [getToneModifier(tone)]: true,
    };

    if (mode) {
        mods[`mode-${mode.toLowerCase()}`] = true;
        mods['expert-mode'] = true;
    }

    const hasAllocation = isNumeric(allocation) && allocation >= 0;

    let allocationElement: React.ReactNode = null;
    if (!compact && hasAllocation) {
        // Allocation could be more than 100.
        let fillWidth = Math.min(allocation, 100);
        if (inverted) {
            fillWidth = Math.max(100 - allocation, 0);
        }

        allocationElement = (
            <div className={b('fill-bar', mods)} style={{width: `${fillWidth}%`}} />
        );
    }

    return (
        <Flex
            alignItems="center"
            justifyContent={leading ? 'space-between' : 'flex-end'}
            className={b(mods, className)}
            role="meter"
            aria-label="Disk allocated space"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={hasAllocation ? allocation : undefined}
        >
            {leading}
            {allocationElement}
            {content}
            {overlay}
        </Flex>
    );
}
