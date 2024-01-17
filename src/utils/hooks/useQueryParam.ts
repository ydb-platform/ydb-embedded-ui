import {useHistory, useLocation} from 'react-router';
import qs from 'qs';

import {parseQuery} from '../../routes';

export const useQueryParam = (
    paramName: string,
    defaultValue?: string,
): [string, (value: string) => void] => {
    const history = useHistory();
    const location = useLocation();

    const query = parseQuery(location);

    let param = query[paramName] || defaultValue || '';
    param = String(param);

    const setParam = (value: string) => {
        const newSearchQuery = {
            ...query,
            [paramName]: value,
        };

        history.replace({
            search: qs.stringify(newSearchQuery),
        });
    };

    return [param, setParam];
};
