import type {AdditionalNodesProps} from '../../types/additionalProps';
import {USE_PAGINATED_TABLES_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {Nodes} from './Nodes';
import {VirtualNodes} from './VirtualNodes';

interface NodesWrapperProps {
    path?: string;
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const NodesWrapper = ({parentContainer, ...props}: NodesWrapperProps) => {
    const [useVirtualTable] = useSetting<boolean>(USE_PAGINATED_TABLES_KEY);

    if (useVirtualTable) {
        return <VirtualNodes parentContainer={parentContainer} {...props} />;
    }

    return <Nodes {...props} />;
};
