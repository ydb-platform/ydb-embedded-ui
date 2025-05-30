import type {Location} from '../../../../../types/api/healthcheck';
import i18n from '../../i18n';

import {LocationDetails} from './utils';

interface PoolInfoProps {
    location?: Location['storage'] | Location['compute'];
}

export function PoolInfo({location}: PoolInfoProps) {
    const {pool} = location ?? {};
    const {name} = pool ?? {};

    if (!name) {
        return null;
    }

    return (
        <LocationDetails
            title={i18n('label_pool')}
            fields={[{value: name, title: i18n('label_pool-name')}]}
        />
    );
}
