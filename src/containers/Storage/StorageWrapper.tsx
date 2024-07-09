import type {AdditionalNodesProps} from '../../types/additionalProps';
import {USE_PAGINATED_TABLES_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {PaginatedStorage} from './PaginatedStorage';
import {Storage} from './Storage';

interface StorageWrapperProps {
    tenant?: string;
    nodeId?: string;
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const StorageWrapper = ({parentContainer, ...props}: StorageWrapperProps) => {
    const [usePaginatedTables] = useSetting<boolean>(USE_PAGINATED_TABLES_KEY);

    if (usePaginatedTables) {
        return <PaginatedStorage parentContainer={parentContainer} {...props} />;
    }

    return <Storage {...props} />;
};
