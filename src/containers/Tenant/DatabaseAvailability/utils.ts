import type {TTenant} from '../../../types/api/tenant';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';

function displayValue(value?: string | number | null) {
    return value === undefined || value === null || value === '' ? EMPTY_DATA_PLACEHOLDER : value;
}

export function prepareControlPlaneInfo(tenant: TTenant) {
    const cp = tenant.ControlPlane ?? {};
    const {fixed_scale: fixedScale} = cp.scale_policy ?? {};
    const {storage_size_limit: storageLimit, storage_options: storageOptions} =
        cp.storage_config ?? {};
    return {
        name: displayValue(cp.name),
        id: displayValue(cp.id),
        path: displayValue(tenant.Name),
        endpoint: displayValue(cp.endpoint),
        folder: displayValue(cp.folder_id),
        location: displayValue(cp.location_id),
        type: displayValue(tenant.Type || cp.type),
        status: displayValue(cp.status),
        preset: displayValue(cp.resource_preset_id),
        size: displayValue(fixedScale?.size),
        storageLimit: displayValue(storageLimit),
        storageOptions: displayValue(
            storageOptions
                ?.map(
                    (option) =>
                        `${displayValue(option.storage_type_id)}: ${displayValue(option.group_count)}`,
                )
                .join(', '),
        ),
    };
}

export type ControlPlaneTab = 'overview' | 'backups' | 'monitoring';

export function getControlPlaneTab(
    requestedTab: unknown,
    hasBackups: boolean,
    hasMonitoring: boolean,
): ControlPlaneTab {
    if (requestedTab === 'backups' && hasBackups) {
        return 'backups';
    }
    if (requestedTab === 'monitoring' && hasMonitoring) {
        return 'monitoring';
    }
    return 'overview';
}
