import {useLocation} from 'react-router-dom';

/** Build a stable scope from the route and query parameters selected by the caller. */
export function useQueryParamsScope(keys: readonly string[]) {
    const {pathname, search} = useLocation();
    const params = new URLSearchParams(search);
    return JSON.stringify([pathname, ...keys.map((key) => [key, params.get(key)])]);
}
