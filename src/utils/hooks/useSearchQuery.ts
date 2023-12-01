import {useLocation} from 'react-router';

import {parseQuery} from '../../routes';

export const useSearchQuery = () => {
    const location = useLocation();

    return parseQuery(location);
};
