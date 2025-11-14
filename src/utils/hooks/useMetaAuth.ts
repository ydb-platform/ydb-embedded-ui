import {useLocation} from 'react-router-dom';

import {checkIsClustersPage} from '../../routes';
import {
    useMetaLoginAvailable,
    useMetaWhoAmIAvailable,
} from '../../store/reducers/capabilities/hooks';

function useMetaAuthState(path?: string) {
    const location = useLocation();
    const isClustersPage = path
        ? checkIsClustersPage(path)
        : checkIsClustersPage(location.pathname);
    const metaLoginAvailable = useMetaLoginAvailable();
    const metaWhoAmIAvailable = useMetaWhoAmIAvailable();

    return {isClustersPage, metaAuthAvailable: metaLoginAvailable && metaWhoAmIAvailable};
}

export function useMetaAuth(path?: string) {
    const {isClustersPage, metaAuthAvailable} = useMetaAuthState(path);

    return isClustersPage && metaAuthAvailable;
}

export function useMetaAuthUnavailable(path?: string) {
    const {isClustersPage, metaAuthAvailable} = useMetaAuthState(path);

    return isClustersPage && !metaAuthAvailable;
}
