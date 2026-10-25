import {Flex} from '@gravity-ui/uikit';

import {DatacenterLabel} from '../../../../../components/Datacenter/DatacenterLabel';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import type {DatacenterNodes} from '../../../../../utils/datacenters';

export function DatabaseDatacenters({datacenters}: {datacenters?: DatacenterNodes[] | null}) {
    if (!datacenters?.length) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return (
        <Flex gap={2} wrap="wrap" qa="database-datacenters">
            {datacenters.map(({name, count}) => (
                <DatacenterLabel key={name ?? ''} name={name} count={count} />
            ))}
        </Flex>
    );
}
