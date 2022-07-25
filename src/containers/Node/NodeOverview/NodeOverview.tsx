
//@ts-ignore
import FullNodeViewer from '../../../components/FullNodeViewer/FullNodeViewer';
import {backend} from '../../../store';

interface NodeOverviewProps {
    node: any;
    className?: string;
}

function NodeOverview({node, className}: NodeOverviewProps) {
    return (
        <FullNodeViewer
            node={node}
            backend={backend}
            className={className}
        />
    );
}

export default NodeOverview;
