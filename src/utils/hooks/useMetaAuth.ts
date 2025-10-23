import {useLocation} from 'react-router-dom';

import {checkIsClustersPage} from '../../routes';
import {useMetaLoginAvailable} from '../../store/reducers/capabilities/hooks';

function useMetaAuthState() {
    const location = useLocation();
    const isClustersPage = checkIsClustersPage(location.pathname);
    const metaLoginAvailable = useMetaLoginAvailable();

    return {isClustersPage, metaLoginAvailable};
}

export function useMetaAuth() {
    const {isClustersPage, metaLoginAvailable} = useMetaAuthState();

    return isClustersPage && metaLoginAvailable;
}

export function useMetaAuthUnavailable() {
    const {isClustersPage, metaLoginAvailable} = useMetaAuthState();

    return isClustersPage && !metaLoginAvailable;
}
