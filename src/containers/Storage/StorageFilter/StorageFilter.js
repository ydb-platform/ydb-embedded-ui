import {useEffect, useRef, useState} from 'react';
import {TextInput} from '@yandex-cloud/uikit';
import {StorageTypes} from '../../../store/reducers/storage';

function StorageFilter(props) {
    const [filter, setFilter] = useState('');
    const timer = useRef();

    useEffect(() => {
        setFilter('');
        props.changeReduxStorageFilter('');
    }, [props.storageType]);

    const changeFilter = (value) => {
        setFilter(value);

        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            props.changeReduxStorageFilter(value);
        }, 200);
    };
    const placeholder =
        props.storageType === StorageTypes.groups ? 'Group ID, Pool name' : 'Node ID, FQDN';

    return <TextInput placeholder={placeholder} value={filter} onUpdate={changeFilter} hasClear />;
}

export default StorageFilter;
