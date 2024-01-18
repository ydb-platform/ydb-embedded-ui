import React from 'react';
import {useDispatch} from 'react-redux';
import {fetchClustersList} from '../../store/reducers/clusters/clusters';

export function useClustersList() {
    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchClustersList());
    }, [dispatch]);
}
