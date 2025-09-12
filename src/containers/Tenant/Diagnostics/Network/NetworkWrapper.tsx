import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {NetworkTable} from '../../../../components/NetworkTable/NetworkTable';
import {useShouldShowDatabaseNetworkTable} from '../../../../components/NetworkTable/hooks';
import {useCapabilitiesLoaded} from '../../../../store/reducers/capabilities/hooks';
import type {NodesProps} from '../../../Nodes/Nodes';

import {Network} from './Network';

interface NetworkWrapperProps
    extends Pick<NodesProps, 'path' | 'scrollContainerRef' | 'additionalNodesProps'> {
    database: string;
    databaseFullPath: string;
}

export function NetworkWrapper({
    database,
    path,
    databaseFullPath,
    scrollContainerRef,
    additionalNodesProps,
}: NetworkWrapperProps) {
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const shouldUseNetworkNodesTable = useShouldShowDatabaseNetworkTable();

    const renderContent = () => {
        if (shouldUseNetworkNodesTable) {
            return (
                <NetworkTable
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                    scrollContainerRef={scrollContainerRef}
                    additionalNodesProps={additionalNodesProps}
                />
            );
        }

        return <Network database={database} databaseFullPath={databaseFullPath} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}
