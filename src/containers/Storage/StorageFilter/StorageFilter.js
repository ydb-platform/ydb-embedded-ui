import {useEffect, useState} from 'react';
import {TextInput} from '@yandex-cloud/uikit';
import {StorageTypes} from '../../../store/reducers/storage';

function StorageFilter(props) {
    const [filter, setFilter] = useState('');
    let timer;

    useEffect(() => {
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setFilter('');
        props.changeReduxStorageFilter('');
    }, [props.storageType]);

    const changeFilter = (value) => {
        clearTimeout(timer);
        setFilter(value);
        timer = setTimeout(() => {
            props.changeReduxStorageFilter(value);
        }, 200);
    };
    const placeholder =
        props.storageType === StorageTypes.groups ? 'Group ID, Pool name' : 'Node ID, FQDN';

    return <TextInput placeholder={placeholder} value={filter} onUpdate={changeFilter} hasClear />;
}

export default StorageFilter;
