import type {ButtonSize} from '@gravity-ui/uikit';
import {Button, Icon} from '@gravity-ui/uikit';
import type {NavigationTreeNodeType} from 'ydb-ui-components';

import {api} from '../../../store/reducers/api';
import {setShowPreview} from '../../../store/reducers/schema/schema';
import {TENANT_PAGES_IDS, TENANT_QUERY_TABS_ID} from '../../../store/reducers/tenant/constants';
import {setQueryTab} from '../../../store/reducers/tenant/tenant';
import type {TenantPage} from '../../../store/reducers/tenant/types';
import {EPathSubType} from '../../../types/api/schema';
import i18n from '../i18n';

import type {YdbNavigationTreeProps} from './types';

import EyeIcon from '@gravity-ui/icons/svgs/eye.svg';

interface ControlsAdditionalEffects {
    setActivePath: (path: string) => void;
    setTenantPage: (page: TenantPage) => void;
}

const bindActions = (
    path: string,
    dispatch: React.Dispatch<any>,
    additionalEffects: ControlsAdditionalEffects,
) => {
    const {setActivePath, setTenantPage} = additionalEffects;

    return {
        openPreview: () => {
            dispatch(api.util.invalidateTags(['PreviewData']));
            dispatch(setShowPreview(true));
            setTenantPage(TENANT_PAGES_IDS.query);
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
            setActivePath(path);
        },
    };
};

type Controls = ReturnType<Required<YdbNavigationTreeProps>['renderAdditionalNodeElements']>;

type SummaryType = 'preview';

const getPreviewControl = (options: ReturnType<typeof bindActions>, size?: ButtonSize) => {
    return (
        <Button
            view="flat-secondary"
            onClick={options.openPreview}
            title={i18n('actions.openPreview')}
            size={size || 's'}
        >
            <Icon data={EyeIcon} />
        </Button>
    );
};

export const getSchemaControls =
    (
        dispatch: React.Dispatch<any>,
        additionalEffects: ControlsAdditionalEffects,
        size?: ButtonSize,
        isTopicPreviewAvailable?: boolean,
    ): YdbNavigationTreeProps['renderAdditionalNodeElements'] =>
    (path, type, meta) => {
        const options = bindActions(path, dispatch, additionalEffects);
        const openPreview = getPreviewControl(options, size);

        const isCdcTopic = meta?.subType === EPathSubType.EPathSubTypeStreamImpl;

        const nodeTypeToControls: Record<NavigationTreeNodeType, Controls> = {
            async_replication: undefined,
            transfer: undefined,

            database: undefined,
            directory: undefined,
            resource_pool: undefined,

            table: openPreview,
            column_table: openPreview,
            system_table: openPreview,

            index_table: openPreview,
            topic: isTopicPreviewAvailable && !isCdcTopic ? openPreview : undefined,
            stream: undefined,

            index: undefined,

            external_table: openPreview,
            external_data_source: undefined,

            view: openPreview,

            streaming_query: undefined,
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
