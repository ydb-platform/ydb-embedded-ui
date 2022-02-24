import cn from 'bem-cn-lite';
//@ts-ignore
import Tenants from '../Tenants/Tenants';
//@ts-ignore
import Nodes from '../Nodes/Nodes';
//@ts-ignore
import Storage from '../Storage/Storage';
import routes, {CLUSTER_PAGES} from '../../routes';

import './Cluster.scss';
import {useRouteMatch} from 'react-router';
import ClusterInfo from '../../components/ClusterInfo/ClusterInfo';

const b = cn('cluster');

interface ClusterProps {
    additionalClusterInfo: any;
    additionalTenantsInfo: any;
    additionalNodesInfo: any;
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
                return <Nodes {...props} />;
            }
            case CLUSTER_PAGES.storage.id: {
                //@ts-ignore
                return <Storage {...props} />;
            }
            case CLUSTER_PAGES.cluster.id: {
                return <ClusterInfo />;
            }
            default: {
                return null;
            }
        }
    };

    return <div className={b()}>{renderRoutes()}</div>;
}

export default Cluster;
