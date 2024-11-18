import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasNetworkStats,
} from '../../../../store/reducers/capabilities/hooks';
import {ENABLE_NETWORK_TABLE_KEY} from '../../../../utils/constants';
import {useSetting} from '../../../../utils/hooks';
import type {PaginatedNodesProps} from '../../../Nodes/PaginatedNodes';
import {PaginatedNodes} from '../../../Nodes/PaginatedNodes';

import {Network} from './Network';
import {getNetworkTableNodesColumns} from './NetworkTable/columns';
import {
    NETWORK_DEFAULT_NODES_COLUMNS,
    NETWORK_NODES_GROUP_BY_PARAMS,
    NETWORK_NODES_TABLE_SELECTED_COLUMNS_KEY,
    NETWORK_REQUIRED_NODES_COLUMNS,
} from './NetworkTable/constants';

interface NetworkWrapperProps
    extends Pick<PaginatedNodesProps, 'path' | 'parentRef' | 'additionalNodesProps'> {
    database: string;
}

export function NetworkWrapper({
    database,
    path,
    parentRef,
    additionalNodesProps,
}: NetworkWrapperProps) {
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const viewerNodesHasNetworkStats = useViewerNodesHandlerHasNetworkStats();
    const [networkTableEnabled] = useSetting(ENABLE_NETWORK_TABLE_KEY);

    const shouldUseNetworkNodesTable = viewerNodesHasNetworkStats && networkTableEnabled;

    const renderContent = () => {
        if (shouldUseNetworkNodesTable) {
            return (
                <PaginatedNodes
                    path={path}
                    database={database}
                    parentRef={parentRef}
                    additionalNodesProps={additionalNodesProps}
                    columns={getNetworkTableNodesColumns({
                        database: database,
                        getNodeRef: additionalNodesProps?.getNodeRef,
                    })}
                    defaultColumnsIds={NETWORK_DEFAULT_NODES_COLUMNS}
                    requiredColumnsIds={NETWORK_REQUIRED_NODES_COLUMNS}
                    selectedColumnsKey={NETWORK_NODES_TABLE_SELECTED_COLUMNS_KEY}
                    groupByParams={NETWORK_NODES_GROUP_BY_PARAMS}
                />
            );
        }

        return <Network tenantName={database} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}
