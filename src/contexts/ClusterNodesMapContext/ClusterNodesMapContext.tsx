import {type ReactNode, createContext, useEffect, useContext} from 'react';

import type {NodesMap} from '../../types/store/nodesList';
import {getNodesList, selectNodesMap} from '../../store/reducers/nodesList';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';

type ClusterNodesMapContextProps = {
    children: ReactNode;
};

const ClusterNodesMapContext = createContext<NodesMap | undefined>(undefined);

/** NodesMap - almost constant cluster nodes to hosts mapping */
export function ClusterNodesMapContextProvider({children}: ClusterNodesMapContextProps) {
    const dispatch = useTypedDispatch();

    const nodesMap = useTypedSelector(selectNodesMap);

    useEffect(() => {
        dispatch(getNodesList());
    }, [dispatch]);

    return (
        <ClusterNodesMapContext.Provider value={nodesMap}>
            {children}
        </ClusterNodesMapContext.Provider>
    );
}

export function useClusterNodesMap() {
    return useContext(ClusterNodesMapContext);
}
