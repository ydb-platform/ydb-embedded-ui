import React, {useRef, useState} from 'react';
import _ from 'lodash';
import cn from 'bem-cn-lite';
import {Dialog, Popup, Button} from '@gravity-ui/uikit';

import TruncatedQuery from '../../../../components/TruncatedQuery/TruncatedQuery';
import Icon from '../../../../components/Icon/Icon';
import './SavedQueries.scss';
import {setQueryNameToEdit} from '../../../../store/reducers/saveQuery';
import {useDispatch} from 'react-redux';

const b = cn('saved-queries');

const MAX_QUERY_HEIGHT = 3;

function SavedQueries({savedQueries, changeUserInput, onDeleteQuery}) {
    const [isSavedQueriesVisible, setIsSavedQueriesVisible] = useState(false);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const [queryNameToDelete, setQueryNameToDelete] = useState(null);

    const [popupForceRender, setPopupForceRender] = useState(null);

    const dispatch = useDispatch();
    const anchor = useRef(null);

    const onShowSavedQueriesClick = () => {
        setIsSavedQueriesVisible(true);
    };

    const onCloseSavedQueries = () => {
        setIsSavedQueriesVisible(false);
    };

    const onSavedQueryClick = (queryText, queryName) => {
        return () => {
            changeUserInput({input: queryText});
            dispatch(setQueryNameToEdit(queryName));
            setIsSavedQueriesVisible(false);
        };
    };

    const onDeleteQueryClick = (queryName) => {
        return (event) => {
            event.stopPropagation();
            setIsDeleteDialogVisible(true);
            setQueryNameToDelete(queryName);
        };
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogVisible(false);
        setQueryNameToDelete(null);
    };

    const onClickCancelDelete = (e) => {
        e.stopPropagation();
        closeDeleteDialog();
    };

    const onConfirmDeleteClick = (e) => {
        e.stopPropagation();
        onDeleteQuery(queryNameToDelete);
        closeDeleteDialog();
        setPopupForceRender(queryNameToDelete);
    };

    const renderDialog = () => {
        return (
            <Dialog
                open={isDeleteDialogVisible}
                hasCloseButton={false}
                size="s"
                onClose={onClickCancelDelete}
                onEnterKeyDown={onConfirmDeleteClick}
            >
                <Dialog.Header caption="Delete query" />
                <Dialog.Body className={b('dialog-body')}>
                    Are you sure you want to delete query
                    <span className={b('dialog-query-name')}>{` ${queryNameToDelete}?`}</span>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonApply="Delete"
                    textButtonCancel="Cancel"
                    onClickButtonCancel={onClickCancelDelete}
                    onClickButtonApply={onConfirmDeleteClick}
                />
            </Dialog>
        );
    };
    const renderSavedQueries = () => {
        return (
            <Popup
                key={popupForceRender}
                className={b('popup-wrapper')}
                anchorRef={anchor}
                open={isSavedQueriesVisible}
                placement={['bottom-end']}
                onClose={onCloseSavedQueries}
            >
                <div className={b()}>
                    <div className={b('saved-queries-row', {header: true})}>
                        <div className={b('query-name')}>Name</div>
                        <div className={b('query-body', {header: true})}>
                            <span>QueryText</span>
                        </div>
                    </div>
                    <div>
                        {_.sortBy(savedQueries, (query) => query.name.toLowerCase()).map(
                            (query) => {
                                return (
                                    <div
                                        className={b('saved-queries-row')}
                                        onClick={onSavedQueryClick(query.body, query.name)}
                                        key={query.name}
                                    >
                                        <div className={b('query-name')}>{query.name}</div>
                                        <div className={b('query-body')}>
                                            <TruncatedQuery
                                                value={query.body}
                                                maxQueryHeight={MAX_QUERY_HEIGHT}
                                            />
                                        </div>
                                        <div className={b('query-controls')}>
                                            <Icon
                                                name="pencil"
                                                viewBox="0 0 24 24"
                                                height={14}
                                                width={14}
                                                className={b('control-button')}
                                            />
                                            <Icon
                                                name="trash"
                                                viewBox="0 0 24 24"
                                                height={14}
                                                width={14}
                                                className={b('control-button')}
                                                onClick={onDeleteQueryClick(query.name)}
                                            />
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>
            </Popup>
        );
    };

    return (
        <React.Fragment>
            <Button ref={anchor} onClick={onShowSavedQueriesClick}>
                Saved queries
            </Button>
            {isSavedQueriesVisible && renderSavedQueries()}
            {isDeleteDialogVisible && queryNameToDelete && renderDialog()}
        </React.Fragment>
    );
}

export default SavedQueries;
