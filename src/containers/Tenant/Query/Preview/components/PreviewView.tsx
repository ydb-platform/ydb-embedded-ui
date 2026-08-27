import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Flex, Icon, Text} from '@gravity-ui/uikit';

import {EnableFullscreenButton} from '../../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Fullscreen} from '../../../../../components/Fullscreen/Fullscreen';
import {LoaderWrapper} from '../../../../../components/LoaderWrapper/LoaderWrapper';
import {setShowPreview} from '../../../../../store/reducers/schema/schema';
import {useTypedDispatch} from '../../../../../utils/hooks';
import i18n from '../../i18n';
import {b} from '../shared';

interface PreviewProps {
    path: string;
    quantity?: number;
    truncated?: boolean;
    renderResult?: () => React.ReactNode;
    loading?: boolean;
    error?: unknown;
}

export function Preview({
    path,
    quantity = 0,
    truncated,
    renderResult,
    loading,
    error,
}: PreviewProps) {
    const dispatch = useTypedDispatch();

    const handleClosePreview = () => {
        dispatch(setShowPreview(false));
    };

    const renderHeader = () => {
        return (
            <Flex justifyContent="space-between" alignItems="center" className={b('header')}>
                <Flex gap={1}>
                    {i18n('title_query-preview')}
                    <Text color="secondary" variant="body-2">
                        {truncated ? `${i18n('value_truncated-query-preview')} ` : ''}({quantity})
                    </Text>
                    <div className={b('table-name')}>{path}</div>
                </Flex>
                <div className={b('controls-left')}>
                    <EnableFullscreenButton disabled={Boolean(error)} />
                    <Button
                        view="flat-secondary"
                        onClick={handleClosePreview}
                        title={i18n('action_close-query-preview')}
                    >
                        <Icon data={Xmark} size={18} />
                    </Button>
                </div>
            </Flex>
        );
    };

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }
        return renderResult?.();
    };

    return (
        <LoaderWrapper loading={loading}>
            <div className={b()}>
                {renderHeader()}
                <Fullscreen>
                    <div className={b('result')}>{renderContent()}</div>
                </Fullscreen>
            </div>
        </LoaderWrapper>
    );
}
