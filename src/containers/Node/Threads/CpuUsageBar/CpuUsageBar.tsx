import {Progress} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';

import './CpuUsageBar.scss';

const b = cn('cpu-usage-bar');

interface CpuUsageBarProps {
    systemUsage?: number;
    userUsage?: number;
    className?: string;
}

/**
 * Component to display CPU usage as a progress bar showing both system and user usage
 */
export function CpuUsageBar({systemUsage = 0, userUsage = 0, className}: CpuUsageBarProps) {
    const totalUsage = systemUsage + userUsage;
    const systemPercent = Math.round(systemUsage * 100);
    const userPercent = Math.round(userUsage * 100);
    const totalPercent = Math.round(totalUsage * 100);

    // Determine color based on total load
    const getProgressTheme = (): 'success' | 'warning' | 'danger' => {
        if (totalUsage >= 1.0) {
            return 'danger';
        } // 100% or more load
        if (totalUsage >= 0.8) {
            return 'warning';
        } // 80% or more load
        return 'success';
    };

    return (
        <div className={b(null, className)}>
            <div className={b('progress')}>
                <Progress value={Math.min(totalPercent, 100)} theme={getProgressTheme()} size="s" />
            </div>
            <div className={b('text')}>
                <span className={b('total')}>{totalPercent}%</span>
                <span className={b('breakdown')}>
                    (S: {systemPercent}%, U: {userPercent}%)
                </span>
            </div>
        </div>
    );
}
