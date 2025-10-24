import {useLocation} from 'react-router-dom';

import {checkIsClustersPage} from '../../routes';
import {
    useMetaLoginAvailable,
    useMetaWhoAmIAvailable,
} from '../../store/reducers/capabilities/hooks';

function useMetaAuthState() {
    const location = useLocation();
    const isClustersPage = checkIsClustersPage(location.pathname);
    const metaLoginAvailable = useMetaLoginAvailable();
    const metaWhoAmIAvailable = useMetaWhoAmIAvailable();

    return {isClustersPage, metaAuthAvailable: metaLoginAvailable && metaWhoAmIAvailable};
}

export function useMetaAuth() {
    const {isClustersPage, metaAuthAvailable} = useMetaAuthState();

    return isClustersPage && metaAuthAvailable;
}

export function useMetaAuthUnavailable() {
    const {isClustersPage, metaAuthAvailable} = useMetaAuthState();

    return isClustersPage && !metaAuthAvailable;
}
