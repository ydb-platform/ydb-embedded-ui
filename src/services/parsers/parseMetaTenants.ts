import type {MetaTenants} from '../../types/api/meta';
import type {TTenantInfo} from '../../types/api/tenant';

export const parseMetaTenants = (data: MetaTenants): TTenantInfo => {
    return {
        TenantInfo: data?.databases,
        ...(data?.errors !== undefined ? {errors: data.errors} : {}),
    };
};
