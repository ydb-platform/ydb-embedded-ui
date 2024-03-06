import React from 'react';
import {useTypedDispatch} from '../../utils/hooks';
import {fetchClustersList} from '../../store/reducers/clusters/clusters';

export function useClustersList() {
    const dispatch = useTypedDispatch();

    React.useEffect(() => {
        dispatch(fetchClustersList());
    }, [dispatch]);
}
