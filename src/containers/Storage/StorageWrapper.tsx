import type {AdditionalNodesProps} from '../../types/additionalProps';
import {USE_BACKEND_PARAMS_FOR_TABLES_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {Storage} from './Storage';
import {VirtualStorage} from './VirtualStorage';

interface StorageWrapperProps {
    tenant?: string;
    nodeId?: string;
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const StorageWrapper = ({parentContainer, ...props}: StorageWrapperProps) => {
    const [useVirtualTable] = useSetting<boolean>(USE_BACKEND_PARAMS_FOR_TABLES_KEY);

    if (useVirtualTable) {
        return <VirtualStorage parentContainer={parentContainer} {...props} />;
    }

    return <Storage {...props} />;
};
