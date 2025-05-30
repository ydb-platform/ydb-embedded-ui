import {
    CircleCheck,
    CircleExclamation,
    CircleInfo,
    PlugConnection,
    TriangleExclamation,
} from '@gravity-ui/icons';
import type {LabelProps} from '@gravity-ui/uikit';
import {Icon, Label} from '@gravity-ui/uikit';

import {SelfCheckResult} from '../../types/api/healthcheck';

import i18n from './i18n';

const SelfCheckResultToLabelTheme: Record<SelfCheckResult, LabelProps['theme']> = {
    [SelfCheckResult.GOOD]: 'success',
    [SelfCheckResult.DEGRADED]: 'info',
    [SelfCheckResult.MAINTENANCE_REQUIRED]: 'warning',
    [SelfCheckResult.EMERGENCY]: 'danger',
    [SelfCheckResult.UNSPECIFIED]: 'normal',
};

const SelfCheckResultToIcon: Record<
    SelfCheckResult,
    (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
> = {
    [SelfCheckResult.GOOD]: CircleCheck,
    [SelfCheckResult.DEGRADED]: CircleInfo,
    [SelfCheckResult.MAINTENANCE_REQUIRED]: TriangleExclamation,
    [SelfCheckResult.EMERGENCY]: CircleExclamation,
    [SelfCheckResult.UNSPECIFIED]: PlugConnection,
};

const SelfCheckResultToText: Record<SelfCheckResult, string> = {
    get [SelfCheckResult.GOOD]() {
        return i18n('title_good');
    },
    get [SelfCheckResult.DEGRADED]() {
        return i18n('title_degraded');
    },
    get [SelfCheckResult.MAINTENANCE_REQUIRED]() {
        return i18n('title_maintenance');
    },
    get [SelfCheckResult.EMERGENCY]() {
        return i18n('title_emergency');
    },
    get [SelfCheckResult.UNSPECIFIED]() {
        return i18n('title_unspecified');
    },
};

interface HealthcheckStatusProps {
    status: SelfCheckResult;
    size?: LabelProps['size'];
}

export function HealthcheckStatus({status, size = 'm'}: HealthcheckStatusProps) {
    const theme = SelfCheckResultToLabelTheme[status];

    return (
        <Label
            theme={theme}
            icon={<Icon size={14} data={SelfCheckResultToIcon[status]} />}
            size={size}
        >
            {SelfCheckResultToText[status]}
        </Label>
    );
}
