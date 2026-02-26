import {useLocation} from 'react-router-dom';

import {checkIsHomePage} from '../../routes';
import {useEmMetaAvailable} from '../../store/reducers/capabilities/hooks';

function useMetaAuthState(path?: string) {
    const location = useLocation();
    const isHomePage = path ? checkIsHomePage(path) : checkIsHomePage(location.pathname);
    const metaAuthAvailable = useEmMetaAvailable();

    return {isHomePage, metaAuthAvailable};
}

export function useMetaAuth(path?: string) {
    const {isHomePage, metaAuthAvailable} = useMetaAuthState(path);

    return isHomePage && metaAuthAvailable;
}

export function useMetaAuthUnavailable(path?: string) {
    const {isHomePage, metaAuthAvailable} = useMetaAuthState(path);

    return isHomePage && !metaAuthAvailable;
}
