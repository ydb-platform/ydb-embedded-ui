import {useRouteMatch} from 'react-router';
import cn from 'bem-cn-lite';

import type {AdditionalVersionsProps} from '../../types/additionalProps';
import routes, {CLUSTER_PAGES} from '../../routes';

import {ClusterInfo} from '../ClusterInfo/ClusterInfo';
import Tenants from '../Tenants/Tenants';
import {Nodes} from '../Nodes/Nodes';
import Storage from '../Storage/Storage';

import './Cluster.scss';

const b = cn('cluster');

interface ClusterProps {
    additionalClusterInfo?: any;
    additionalTenantsInfo?: any;
    additionalNodesInfo?: any;
    additionalVersionsProps?: AdditionalVersionsProps;
}

function Cluster(props: ClusterProps) {
    const match = useRouteMatch<{activeTab?: string}>(routes.cluster);
    const activeTab = match?.params?.activeTab ?? CLUSTER_PAGES.tenants.id;
    const renderRoutes = () => {
        switch (activeTab) {
            case CLUSTER_PAGES.tenants.id: {
                return <Tenants {...props} />;
            }
            case CLUSTER_PAGES.nodes.id: {
                return <Nodes additionalNodesInfo={props.additionalNodesInfo} />;
            }
            case CLUSTER_PAGES.storage.id: {
                //@ts-ignore
                return <Storage {...props} />;
            }
            case CLUSTER_PAGES.cluster.id: {
                return (
                    <ClusterInfo
                        additionalClusterInfo={props.additionalClusterInfo}
                        additionalVersionsProps={props.additionalVersionsProps}
                    />
                );
            }
            default: {
                return null;
            }
        }
    };

    return <div className={b({tab: activeTab})}>{renderRoutes()}</div>;
}

export default Cluster;
