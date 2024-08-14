import {LayoutHeaderCellsLargeFill} from '@gravity-ui/icons';
import type {ButtonSize} from '@gravity-ui/uikit';
import {Button, Icon} from '@gravity-ui/uikit';
import type {NavigationTreeNodeType, NavigationTreeProps} from 'ydb-ui-components';

import {api} from '../../../store/reducers/api';
import {setShowPreview} from '../../../store/reducers/schema/schema';
import {TENANT_PAGES_IDS, TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {setQueryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import i18n from '../i18n';

interface ControlsAdditionalEffects {
    setActivePath: (path: string) => void;
}

const bindActions = (
    path: string,
    dispatch: React.Dispatch<any>,
    additionalEffects: ControlsAdditionalEffects,
) => {
    const {setActivePath} = additionalEffects;

    return {
        openPreview: () => {
            dispatch(api.util.invalidateTags(['PreviewData']));
            dispatch(setShowPreview(true));
            dispatch(setTenantPage(TENANT_PAGES_IDS.query));
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
            setActivePath(path);
        },
    };
};

type Controls = ReturnType<Required<NavigationTreeProps>['renderAdditionalNodeElements']>;

type SummaryType = 'preview';

const getPreviewControl = (options: ReturnType<typeof bindActions>, size?: ButtonSize) => {
    return (
        <Button
            view="flat-secondary"
            onClick={options.openPreview}
            title={i18n('actions.openPreview')}
            size={size || 's'}
        >
            <Icon data={LayoutHeaderCellsLargeFill} />
        </Button>
    );
};

export const getSchemaControls =
    (
        dispatch: React.Dispatch<any>,
        additionalEffects: ControlsAdditionalEffects,
        size?: ButtonSize,
    ) =>
    (path: string, type: NavigationTreeNodeType) => {
        const options = bindActions(path, dispatch, additionalEffects);
        const openPreview = getPreviewControl(options, size);

        const nodeTypeToControls: Record<NavigationTreeNodeType, Controls> = {
            async_replication: undefined,

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

            view: openPreview,
        };

        return nodeTypeToControls[type];
    };

export const getSummaryControls =
    (
        dispatch: React.Dispatch<any>,
        additionalEffects: ControlsAdditionalEffects,
        size?: ButtonSize,
    ) =>
    (path: string, type: SummaryType) => {
        const options = bindActions(path, dispatch, additionalEffects);
        const openPreview = getPreviewControl(options, size);

        const summaryControls: Record<SummaryType, Controls> = {preview: openPreview};

        return summaryControls[type];
    };
