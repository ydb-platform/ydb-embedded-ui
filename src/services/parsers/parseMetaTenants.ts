import type {MetaTenants} from '../../types/api/meta';
import type {TTenantInfo, TenantSourceErrors} from '../../types/api/tenant';

function normalizeSourceErrors(errors: MetaTenants['errors']): TenantSourceErrors | undefined {
    const nonemptyError = (value: unknown) =>
        typeof value === 'string' && value.trim() ? value : undefined;
    const viewer = nonemptyError(errors?.viewer);
    const controlPlane = nonemptyError(errors?.control_plane);
    return viewer || controlPlane ? {viewer, control_plane: controlPlane} : undefined;
}

export const parseMetaTenants = (data: MetaTenants): TTenantInfo => {
    return {
        TenantInfo: data?.databases,
        sourceErrors: normalizeSourceErrors(data?.errors),
    };
};
