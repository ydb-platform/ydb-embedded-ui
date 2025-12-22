import {getDefaultNodePath} from '../../routes';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {InternalLink} from '../InternalLink';

interface NodeIdProps {
    id: string | number;
}

export function NodeId({id}: NodeIdProps) {
    const database = useDatabaseFromQuery();
    return <InternalLink to={getDefaultNodePath({id}, {database})}>{id}</InternalLink>;
}
