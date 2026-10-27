import React from 'react';

import {selectNodesMap} from '../../../../../store/reducers/nodesList';
import {useTypedSelector} from '../../../../../utils/hooks/useTypedSelector';

import type {DBInfoProps} from './DatabaseInfo';
import {DatabaseInfo} from './DatabaseInfo';
import {countDatacenterNodes} from './utils';

export function DatabaseInfoWithDatacenters(props: DBInfoProps) {
    const nodes = useTypedSelector((state) => selectNodesMap(state, props.database));
    const datacenters = React.useMemo(() => countDatacenterNodes(nodes?.values() ?? []), [nodes]);
    return <DatabaseInfo {...props} datacenters={datacenters} />;
}
