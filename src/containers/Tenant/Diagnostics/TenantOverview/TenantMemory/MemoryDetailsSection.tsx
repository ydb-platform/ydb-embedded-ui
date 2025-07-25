import {Text} from '@gravity-ui/uikit';

import i18n from '../../../../../components/MemoryViewer/i18n';
import {getMemorySegments} from '../../../../../components/MemoryViewer/utils';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {formatBytes} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import {ProgressWrapper} from '../TenantStorage/ProgressWrapper';

import {MemorySegmentItem} from './MemorySegmentItem';

import './MemoryDetailsSection.scss';

const b = cn('memory-details');

interface MemoryDetailsSectionProps {
    memoryStats: TMemoryStats;
}

export function MemoryDetailsSection({memoryStats}: MemoryDetailsSectionProps) {
    let memoryUsage: number;
    if (memoryStats.AnonRss === undefined) {
        memoryUsage =
            Number(memoryStats.AllocatedMemory || 0) +
            Number(memoryStats.AllocatorCachesMemory || 0);
    } else {
        memoryUsage = Number(memoryStats.AnonRss);
    }

    const memorySegments = getMemorySegments(memoryStats, Number(memoryUsage));
    const displaySegments = memorySegments.filter(
        (segment) => !segment.isInfo && segment.value > 0,
    );

    return (
        <div className={b()}>
            <div className={b('header')}>
                <Text variant="body-1" className={b('title')}>
                    {i18n('text_memory-details')}
                </Text>
            </div>
            <div className={b('content')}>
                <div className={b('main-progress')}>
                    <ProgressWrapper
                        stack={memorySegments}
                        totalCapacity={memoryStats.HardLimit}
                        formatValues={(value?: number, total?: number): [string, string] => [
                            formatBytes({
                                value: value || 0,
                                size: 'gb',
                                withSizeLabel: false,
                                precision: 2,
                            }),
                            formatBytes({
                                value: total || 0,
                                size: 'gb',
                                withSizeLabel: true,
                                precision: 1,
                            }),
                        ]}
                        className={b('main-progress-bar')}
                        size="m"
                        width="full"
                    />
                </div>
                <div className={b('segments-container')}>
                    {displaySegments.map((segment) => (
                        <MemorySegmentItem key={segment.key} segment={segment} />
                    ))}
                </div>
            </div>
        </div>
    );
}
