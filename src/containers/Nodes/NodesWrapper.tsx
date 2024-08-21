import type {AdditionalNodesProps} from '../../types/additionalProps';
import {USE_PAGINATED_TABLES_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {Nodes} from './Nodes';
import {PaginatedNodes} from './PaginatedNodes';

interface NodesWrapperProps {
    path?: string;
    database?: string;
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const NodesWrapper = ({parentContainer, ...props}: NodesWrapperProps) => {
    const [usePaginatedTables] = useSetting<boolean>(USE_PAGINATED_TABLES_KEY);

    if (usePaginatedTables) {
        return <PaginatedNodes parentContainer={parentContainer} {...props} />;
    }

    return <Nodes {...props} />;
};
