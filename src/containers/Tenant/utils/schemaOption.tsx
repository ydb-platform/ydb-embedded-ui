import {Dispatch} from 'react';

import {NavigationTreeNodeType} from 'ydb-ui-components';

import {Button} from '@gravity-ui/uikit';

import {SetQueryModeIfAvailable} from '../../../utils/hooks';
import {setShowPreview} from '../../../store/reducers/schema/schema';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import {TENANT_PAGES_IDS, TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {Icon} from '../../../components/Icon';

interface ActionsAdditionalEffects {
    setQueryMode: SetQueryModeIfAvailable;
    setActivePath: (path: string) => void;
}

const bindOptions = (
    path: string,
    dispatch: Dispatch<any>,
    additionalEffects: ActionsAdditionalEffects,
) => {
    const {setActivePath} = additionalEffects;

    return {
        openPreview: () => {
            dispatch(setShowPreview(true));
            dispatch(setTenantPage(TENANT_PAGES_IDS.query));
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
            setActivePath(path);
        },
    };
};

export const getOptions = (
    dispatch: Dispatch<any>,
    path: string,
    type: NavigationTreeNodeType,
    additionalEffects: ActionsAdditionalEffects,
) => {
    const options = bindOptions(path, dispatch, additionalEffects);
    const openPreview = options.openPreview;

    const JUST_OPEN_PREVIEW = (
        <Button view="flat-secondary" onClick={openPreview} title={'Open preview'}>
            <Icon name="tablePreview" viewBox={'0 0 16 16'} height={16} width={16} />
        </Button>
    );

    const nodeTypeToOptions = {
        database: undefined,
        directory: undefined,

        table: JUST_OPEN_PREVIEW,
        column_table: JUST_OPEN_PREVIEW,

        index_table: undefined,
        topic: undefined,

        index: undefined,

        external_table: JUST_OPEN_PREVIEW,
        external_data_source: undefined,
    };

    return nodeTypeToOptions[type];
};
