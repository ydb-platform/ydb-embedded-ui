import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Loader} from '@gravity-ui/uikit';

import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {QueryResultTable} from '../../../../components/QueryResultTable';
import {previewApi} from '../../../../store/reducers/preview';
import {setShowPreview} from '../../../../store/reducers/schema/schema';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {isExternalTableType, isTableType} from '../../utils/schema';
import i18n from '../i18n';

import './Preview.scss';

const b = cn('kv-preview');

interface PreviewProps {
    database: string;
    type: EPathType | undefined;
}

export const Preview = ({database, type}: PreviewProps) => {
    const dispatch = useTypedDispatch();

    const isPreviewAvailable = isTableType(type);

    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);
    const isFullscreen = useTypedSelector((state) => state.fullscreen);

    const query = `--!syntax_v1\nselect * from \`${currentSchemaPath}\` limit 32`;
    const {currentData, isFetching, error} = previewApi.useSendQueryQuery(
        {database, query, action: isExternalTableType(type) ? 'execute-query' : 'execute-scan'},
        {pollingInterval: autorefresh, skip: !isPreviewAvailable},
    );
    const loading = isFetching && currentData === undefined;
    const data = currentData ?? {};

    const handleClosePreview = () => {
        dispatch(setShowPreview(false));
    };

    const renderHeader = () => {
        return (
            <div className={b('header')}>
                <div className={b('title')}>
                    {i18n('preview.title')}{' '}
                    <div className={b('table-name')}>{currentSchemaPath}</div>
                </div>
                <div className={b('controls-left')}>
                    <EnableFullscreenButton disabled={Boolean(error)} />
                    <Button
                        view="flat-secondary"
                        onClick={handleClosePreview}
                        title={i18n('preview.close')}
                    >
                        <Icon data={Xmark} size={18} />
                    </Button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={b('loader-container')}>
                <Loader size="m" />
            </div>
        );
    }

    let message;

    if (!isPreviewAvailable) {
        message = <div className={b('message-container')}>{i18n('preview.not-available')}</div>;
    } else if (error) {
        message = (
            <div className={b('message-container', 'error')}>{parseQueryErrorToString(error)}</div>
        );
    }

    const content = message ?? (
        <div className={b('result')}>
            <QueryResultTable data={data.result} columns={data.columns} />
        </div>
    );

    return (
        <div className={b()}>
            {renderHeader()}
            {isFullscreen ? <Fullscreen>{content}</Fullscreen> : content}
        </div>
    );
};
