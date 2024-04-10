import React from 'react';

import {fetchClustersList} from '../../store/reducers/clusters/clusters';
import {useTypedDispatch} from '../../utils/hooks';

export function useClustersList() {
    const dispatch = useTypedDispatch();

    React.useEffect(() => {
        dispatch(fetchClustersList());
    }, [dispatch]);
}
