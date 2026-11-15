import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {useCapabilitiesQuery} from '../../../../store/reducers/capabilities/hooks';
import type {AccessPageContext} from '../../../../uiFactory/types';
import {uiFactory} from '../../../../uiFactory/uiFactory';

import {AccessRights} from './AccessRights';

type AccessPageProps = Omit<AccessPageContext, 'capabilities'>;

export function AccessPage(props: AccessPageProps) {
    return uiFactory.access?.renderPage ? <ConfiguredAccessPage {...props} /> : <AccessRights />;
}

function ConfiguredAccessPage(props: AccessPageProps) {
    const {currentData: capabilities, isFetching} = useCapabilitiesQuery();
    const loading = isFetching && !capabilities;

    return (
        <LoaderWrapper loading={loading}>
            {loading
                ? null
                : (uiFactory.access?.renderPage?.({...props, capabilities}) ?? <AccessRights />)}
        </LoaderWrapper>
    );
}
