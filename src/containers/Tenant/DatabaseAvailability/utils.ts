import type {TTenant} from '../../../types/api/tenant';

function displayValue(value?: string | number | null) {
    return value === undefined || value === null || value === '' ? undefined : value;
}

/** Control plane fields of a database; a missing value is `undefined`. */
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
                ?.filter((option) => option.storage_type_id)
                .map((option) => `${option.storage_type_id}: ${option.group_count ?? 0}`)
                .join(', '),
        ),
    };
}
