import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Flex, Icon, Text} from '@gravity-ui/uikit';

import EnableFullscreenButton from '../../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../../components/Fullscreen/Fullscreen';
import {LoaderWrapper} from '../../../../../components/LoaderWrapper/LoaderWrapper';
import {setShowPreview} from '../../../../../store/reducers/schema/schema';
import {useTypedDispatch} from '../../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../../utils/query';
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
                    {i18n('preview.title')}
                    <Text color="secondary" variant="body-2">
                        {truncated ? `${i18n('preview.truncated')} ` : ''}({quantity})
                    </Text>
                    <div className={b('table-name')}>{path}</div>
                </Flex>
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
            </Flex>
        );
    };

    const renderContent = () => {
        let message;

        if (error) {
            message = (
                <div className={b('message-container', 'error')}>
                    {parseQueryErrorToString(error)}
                </div>
            );
        }
        if (message) {
            return message;
        }
        return <div className={b('result')}>{renderResult?.()}</div>;
    };

    return (
        <LoaderWrapper loading={loading}>
            <div className={b()}>
                {renderHeader()}
                <Fullscreen>{renderContent()}</Fullscreen>
            </div>
        </LoaderWrapper>
    );
}
