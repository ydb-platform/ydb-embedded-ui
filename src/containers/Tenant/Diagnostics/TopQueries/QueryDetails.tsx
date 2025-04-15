import {Code, Link, Xmark} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import type {InfoViewerItem} from '../../../../components/InfoViewer';
import {InfoViewer} from '../../../../components/InfoViewer';
import {YDBSyntaxHighlighter} from '../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import {cn} from '../../../../utils/cn';

import i18n from './i18n';

import './QueryDetails.scss';

const b = cn('kv-query-details');

interface QueryDetailsProps {
    queryText: string;
    infoItems: InfoViewerItem[];
    onClose: () => void;
    onOpenInEditor: () => void;
}

export const QueryDetails = ({
    queryText,
    infoItems,
    onClose,
    onOpenInEditor,
}: QueryDetailsProps) => {
    return (
        <div className={b()}>
            <div className={b('header')}>
                <div className={b('title')}>Query</div>
                <div className={b('actions')}>
                    <Button view="flat-secondary" onClick={onClose}>
                        <Icon data={Link} size={16} />
                    </Button>
                    <EnableFullscreenButton />
                    <Button view="flat-secondary" onClick={onClose}>
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
            </div>

            <Fullscreen>
                <div className={b('content')}>
                    <InfoViewer info={infoItems} />

                    <div className={b('query-content')}>
                        <div className={b('query-header')}>
                            <div className={b('query-title')}>
                                {i18n('query-details.query.title')}
                            </div>
                            <Button
                                view="flat-secondary"
                                size="m"
                                onClick={onOpenInEditor}
                                className={b('editor-button')}
                            >
                                <Icon data={Code} size={16} />
                                {i18n('query-details.open-in-editor')}
                            </Button>
                        </div>
                        <YDBSyntaxHighlighter
                            language="yql"
                            text={queryText}
                            withClipboardButton={{alwaysVisible: true, withLabel: false}}
                        />
                    </div>
                </div>
            </Fullscreen>
        </div>
    );
};
