import React, {useRef, useState} from 'react';
import cn from 'bem-cn-lite';
import _ from 'lodash';
import {Button, Popup} from '@yandex-cloud/uikit';
import TruncatedQuery from '../../../../components/TruncatedQuery/TruncatedQuery';
import {useSelector} from 'react-redux';

import './QueriesHistory.scss';

const b = cn('kv-queries-history');

const MAX_QUERY_HEIGHT = 3;

interface QueriesHistoryProps {
    changeUserInput: (value: {input: string}) => void;
}

function QueriesHistory(props: QueriesHistoryProps) {
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const history: string[] =
        useSelector((state: any) => state.executeQuery.history?.queries) ?? [];
    const anchor = useRef(null);

    const onShowHistoryClick = () => {
        setIsHistoryVisible(true);
    };

    const onCloseHistory = () => {
        setIsHistoryVisible(false);
    };

    const onQueryClick = (queryText: string) => {
        const {changeUserInput} = props;
        return () => {
            changeUserInput({input: queryText});
            onCloseHistory();
        };
    };

    const renderSavedQueries = () => {
        const reversedHistory = ([] as string[]).concat(history).reverse();
        return (
            <Popup
                className={b('popup-wrapper')}
                anchorRef={anchor}
                open={isHistoryVisible}
                placement={['bottom-end']}
                onClose={onCloseHistory}
            >
                <div className={b()}>
                    {reversedHistory.length === 0 ? (
                        <div className={b('empty')}>History is empty</div>
                    ) : (
                        <React.Fragment>
                            <div className={b('saved-queries-row', {header: true})}>
                                <div className={b('query-body', {header: true})}>
                                    <span>QueryText</span>
                                </div>
                            </div>
                            <div>
                                {reversedHistory.map((query, index) => {
                                    return (
                                        <div
                                            className={b('saved-queries-row')}
                                            onClick={onQueryClick(query)}
                                            key={index}
                                        >
                                            <div className={b('query-body')}>
                                                <TruncatedQuery
                                                    value={query}
                                                    maxQueryHeight={MAX_QUERY_HEIGHT}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </React.Fragment>
                    )}
                </div>
            </Popup>
        );
    };

    return (
        <React.Fragment>
            <Button ref={anchor} onClick={onShowHistoryClick}>
                Query history
            </Button>
            {isHistoryVisible && renderSavedQueries()}
        </React.Fragment>
    );
}

export default QueriesHistory;
