import type {TTenantInfo} from '../../types/api/tenant';

import type {MetaTenants} from '../../types/api/meta';

export const parseMetaTenants = (data: MetaTenants): TTenantInfo => {
    return {
        TenantInfo: data?.databases,
    };
};
