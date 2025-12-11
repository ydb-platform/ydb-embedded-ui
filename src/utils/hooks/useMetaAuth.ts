import {useLocation} from 'react-router-dom';

import {checkIsHomePage} from '../../routes';
import {
    useMetaLoginAvailable,
    useMetaWhoAmIAvailable,
} from '../../store/reducers/capabilities/hooks';

function useMetaAuthState(path?: string) {
    const location = useLocation();
    const isHomePage = path ? checkIsHomePage(path) : checkIsHomePage(location.pathname);
    const metaLoginAvailable = useMetaLoginAvailable();
    const metaWhoAmIAvailable = useMetaWhoAmIAvailable();

    return {isHomePage, metaAuthAvailable: metaLoginAvailable && metaWhoAmIAvailable};
}

export function useMetaAuth(path?: string) {
    const {isHomePage, metaAuthAvailable} = useMetaAuthState(path);

    return isHomePage && metaAuthAvailable;
}

export function useMetaAuthUnavailable(path?: string) {
    const {isHomePage, metaAuthAvailable} = useMetaAuthState(path);

    return isHomePage && !metaAuthAvailable;
}
