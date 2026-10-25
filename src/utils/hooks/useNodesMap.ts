import React from 'react';

import {selectNodesMap} from '../../store/reducers/nodesList';
import type {NodesMap} from '../../types/store/nodesList';

import {useDatabaseFromQuery} from './useDatabaseFromQuery';
import {useTypedSelector} from './useTypedSelector';

// null means that the component is rendered outside the page's metadata provider.
export const NodeMetadataContext = React.createContext<NodesMap | undefined | null>(null);

export function useNodesMap() {
    const nodes = React.useContext(NodeMetadataContext);
    const database = useDatabaseFromQuery();
    return useTypedSelector((state) => (nodes === null ? selectNodesMap(state, database) : nodes));
}
