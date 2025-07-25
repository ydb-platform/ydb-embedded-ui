import {Flex, Text} from '@gravity-ui/uikit';

import {ProgressViewer} from '../../../../components/ProgressViewer/ProgressViewer';
import {cn} from '../../../../utils/cn';

import './CpuUsageBar.scss';

const b = cn('cpu-usage-bar');

interface CpuUsageBarProps {
    systemUsage?: number;
    userUsage?: number;
    className?: string;
}

export function CpuUsageBar({systemUsage = 0, userUsage = 0, className}: CpuUsageBarProps) {
    const totalUsage = systemUsage + userUsage;
    const systemPercent = Math.round(systemUsage * 100);
    const userPercent = Math.round(userUsage * 100);
    const totalPercent = Math.round(totalUsage * 100);

    return (
        <Flex gap={2} className={b(null, className)}>
            <div className={b('progress')}>
                <ProgressViewer
                    value={totalPercent}
                    percents={true}
                    colorizeProgress={true}
                    capacity={100}
                    className={b('progress')}
                />
            </div>
            <Text color="secondary">
                (Sys: {systemPercent}%, U: {userPercent}%)
            </Text>
        </Flex>
    );
}
