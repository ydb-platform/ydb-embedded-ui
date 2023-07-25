import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader, Button} from '@gravity-ui/uikit';

import type {EPathType} from '../../../../types/api/schema';
import {sendQuery, setQueryOptions} from '../../../../store/reducers/preview';
import {setShowPreview} from '../../../../store/reducers/schema/schema';
import {prepareQueryError} from '../../../../utils/query';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';

import {Icon} from '../../../../components/Icon';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {QueryResultTable} from '../../../../components/QueryResultTable';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';

import {isExternalTable, isTableType} from '../../utils/schema';

import i18n from '../i18n';

import './Preview.scss';

const b = cn('kv-preview');

interface PreviewProps {
    database: string;
    type: EPathType | undefined;
}

export const Preview = ({database, type}: PreviewProps) => {
    const dispatch = useDispatch();

    const {data = {}, loading, error, wasLoaded} = useTypedSelector((state) => state.preview);
    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);
    const isFullscreen = useTypedSelector((state) => state.fullscreen);

    const sendQueryForPreview = useCallback(
        (isBackground) => {
            if (!isTableType(type)) {
                return;
            }

            if (!isBackground) {
                dispatch(
                    setQueryOptions({
                        wasLoaded: false,
                        data: undefined,
                    }),
                );
            }

            const query = `--!syntax_v1\nselect * from \`${currentSchemaPath}\` limit 32`;

            dispatch(
                sendQuery({
                    query,
                    database,
                    action: isExternalTable(type) ? 'execute-query' : 'execute-scan',
                }),
            );
        },
        [dispatch, database, currentSchemaPath, type],
    );

    useAutofetcher(sendQueryForPreview, [sendQueryForPreview], autorefresh);

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
                        <Icon name="close" viewBox={'0 0 16 16'} width={16} height={16} />
                    </Button>
                </div>
            </div>
        );
    };

    if (loading && !wasLoaded) {
        return (
            <div className={b('loader-container')}>
                <Loader size="m" />
            </div>
        );
    }

    let message;

    if (!isTableType(type)) {
        message = <div className={b('message-container')}>{i18n('preview.not-available')}</div>;
    } else if (error) {
        message = <div className={b('message-container', 'error')}>{prepareQueryError(error)}</div>;
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
