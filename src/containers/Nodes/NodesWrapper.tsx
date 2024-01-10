import type {AdditionalNodesProps} from '../../types/additionalProps';
import {USE_BACKEND_PARAMS_FOR_TABLES_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {VirtualNodes} from './VirtualNodes';
import {Nodes} from './Nodes';

interface NodesWrapperProps {
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const NodesWrapper = ({parentContainer, ...props}: NodesWrapperProps) => {
    const [useVirtualTable] = useSetting<boolean>(USE_BACKEND_PARAMS_FOR_TABLES_KEY);

    if (useVirtualTable) {
        return <VirtualNodes parentContainer={parentContainer} {...props} />;
    }

    return <Nodes {...props} />;
};
