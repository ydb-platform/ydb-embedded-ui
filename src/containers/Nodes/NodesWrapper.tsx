import type {AdditionalNodesProps} from '../../types/additionalProps';
import {USE_PAGINATED_TABLES_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {Nodes} from './Nodes';
import {PaginatedNodes} from './PaginatedNodes';

interface NodesWrapperProps {
    path?: string;
    database?: string;
    parentRef?: React.RefObject<HTMLElement>;
    additionalNodesProps?: AdditionalNodesProps;
}

export const NodesWrapper = ({parentRef, ...props}: NodesWrapperProps) => {
    const [usePaginatedTables] = useSetting<boolean>(USE_PAGINATED_TABLES_KEY);

    if (usePaginatedTables) {
        return <PaginatedNodes parentRef={parentRef} {...props} />;
    }

    return <Nodes {...props} />;
};
