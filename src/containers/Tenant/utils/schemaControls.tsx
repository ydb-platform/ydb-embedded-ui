import {Dispatch} from 'react';

import {NavigationTreeNodeType, NavigationTreeProps} from 'ydb-ui-components';
import {Button} from '@gravity-ui/uikit';

import {setShowPreview} from '../../../store/reducers/schema/schema';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import {TENANT_PAGES_IDS, TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {IconWrapper} from '../../../components/Icon';

import i18n from '../i18n';

interface ControlsAdditionalEffects {
    setActivePath: (path: string) => void;
}

const bindActions = (
    path: string,
    dispatch: Dispatch<any>,
    additionalEffects: ControlsAdditionalEffects,
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

type Controls = ReturnType<Required<NavigationTreeProps>['renderAdditionalNodeElements']>;

export const getControls =
    (dispatch: Dispatch<any>, additionalEffects: ControlsAdditionalEffects) =>
    (path: string, type: NavigationTreeNodeType) => {
        const options = bindActions(path, dispatch, additionalEffects);
        const openPreview = (
            <Button
                view="flat-secondary"
                onClick={options.openPreview}
                title={i18n('actions.openPreview')}
                size="s"
            >
                <IconWrapper name="tablePreview" />
            </Button>
        );

        const nodeTypeToControls: Record<NavigationTreeNodeType, Controls> = {
            database: undefined,
            directory: undefined,

            table: openPreview,
            column_table: openPreview,

            index_table: undefined,
            topic: undefined,
            stream: undefined,

            index: undefined,

            external_table: openPreview,
            external_data_source: undefined,
        };

        return nodeTypeToControls[type];
    };
