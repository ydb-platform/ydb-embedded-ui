import {Dispatch} from 'react';
import cn from 'bem-cn-lite';

import {NavigationTreeNodeType, NavigationTreeProps} from 'ydb-ui-components';

import {Button} from '@gravity-ui/uikit';
import {setShowPreview} from '../../../store/reducers/schema/schema';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import {TENANT_PAGES_IDS, TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {IconWrapper} from '../../../components/Icon';

import i18n from '../i18n';

interface ActionsAdditionalEffects {
    setActivePath: (path: string) => void;
}

const bindActions = (
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

type Controls = ReturnType<Required<NavigationTreeProps>['renderAdditionalNodeElements']>;

const b = cn('show-preview-button');

export const getControls =
    (dispatch: Dispatch<any>, additionalEffects: ActionsAdditionalEffects) =>
    (path: string, type: NavigationTreeNodeType) => {
        const options = bindActions(path, dispatch, additionalEffects);
        const openPreview = (
            <Button
                view="flat-secondary"
                onClick={options.openPreview}
                className={b()}
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
