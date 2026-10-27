import {selectNodesMap} from '../../store/reducers/nodesList';

import {useNodesListQueryArgs} from './useNodesListQueryArgs';
import {useTypedSelector} from './useTypedSelector';

export function useNodesMap() {
    const {database, include_storage: includeStorage} = useNodesListQueryArgs();
    return useTypedSelector((state) => selectNodesMap(state, database, includeStorage));
}
