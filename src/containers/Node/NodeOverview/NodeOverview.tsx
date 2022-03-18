
//@ts-ignore
import FullNodeViewer from '../../../components/FullNodeViewer/FullNodeViewer';
import {backend} from '../../../store';

interface NodeOverviewProps {
    node: any;
    additionalNodesInfo: any;
    className?: string;
}

function NodeOverview({node, additionalNodesInfo, className}: NodeOverviewProps) {
    return (
        <FullNodeViewer
            node={node}
            backend={backend}
            additionalNodesInfo={additionalNodesInfo}
            className={className}
        />
    );
}

export default NodeOverview;
