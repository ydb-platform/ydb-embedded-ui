// todo: tableTree is very smart, so it is impossible to update it without re-render
// It is need change NavigationTree to dump component and pass props from parent component
// In this case we can store state of tree - uploaded entities, opened nodes, selected entity and so on
import React from 'react';

import {Dialog, TextInput} from '@gravity-ui/uikit';
import {NavigationTree} from 'ydb-ui-components';

import {schemaApi} from '../../../../store/reducers/schema/schema';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {useQueryModes, useTypedDispatch} from '../../../../utils/hooks';
import i18n from '../../i18n';
import {isChildlessPathType, mapPathTypeToNavigationTreeType} from '../../utils/schema';
import {getActions} from '../../utils/schemaActions';
import {getControls} from '../../utils/schemaControls';

import './SchemaTree.scss';
const b = cn('ydb-schema-tree');

interface SchemaTreeProps {
    rootPath: string;
    rootName: string;
    rootType?: EPathType;
    currentPath?: string;
    onActivePathUpdate: (path: string) => void;
}

export function SchemaTree(props: SchemaTreeProps) {
    const {rootPath, rootName, rootType, currentPath, onActivePathUpdate} = props;
    const dispatch = useTypedDispatch();

    const [_, setQueryMode] = useQueryModes();
    const [open, setOpen] = React.useState(false);
    const [parent, setParent] = React.useState<string>('');
    const [child, setChild] = React.useState('');

    const [createDirectory, {requestId}] = schemaApi.useCreateDirectoryMutation();

    const fetchPath = async (path: string) => {
        const promise = dispatch(
            schemaApi.endpoints.getSchema.initiate({path}, {forceRefetch: true}),
        );
        const {data} = await promise;
        promise.unsubscribe();
        if (!data) {
            throw new Error(`no describe data about path ${path}`);
        }
        const {PathDescription: {Children = []} = {}} = data;

        const childItems = Children.map((childData) => {
            const {Name = '', PathType, PathSubType} = childData;

            return {
                name: Name,
                type: mapPathTypeToNavigationTreeType(PathType, PathSubType),
                // FIXME: should only be explicitly set to true for tables with indexes
                // at the moment of writing there is no property to determine this, fix later
                expandable: !isChildlessPathType(PathType, PathSubType),
            };
        });

        return childItems;
    };

    React.useEffect(() => {
        // if the cached path is not in the current tree, show root
        if (!currentPath?.startsWith(rootPath)) {
            onActivePathUpdate(rootPath);
        }
    }, [currentPath, onActivePathUpdate, rootPath]);

    const handleCreateDirectoryClose = () => {
        setChild('');
        setOpen(false);
    };

    const handleCreateDirectory = () => {
        createDirectory({database: parent, path: `${parent}/${child}`});

        onActivePathUpdate(`${parent}/${child}`);

        handleCreateDirectoryClose();
    };

    const handleOpenCreateDirectoryDialog = (path: string) => {
        setParent(path);
        setOpen(true);
    };

    return (
        <React.Fragment>
            <Dialog open={open} onClose={handleCreateDirectoryClose}>
                <Dialog.Header caption={i18n('schema.tree.dialog.header')} />
                <Dialog.Body className={b('modal')}>
                    <div className={b('label')}>
                        <div className={b('description')}>
                            {i18n('schema.tree.dialog.description')}
                        </div>
                        <div>{`${parent}/`}</div>
                    </div>
                    <TextInput
                        placeholder={i18n('schema.tree.dialog.placeholder')}
                        value={child}
                        onUpdate={setChild}
                    />
                </Dialog.Body>
                <Dialog.Footer
                    textButtonApply={i18n('schema.tree.dialog.buttonApply')}
                    textButtonCancel={i18n('schema.tree.dialog.buttonCancel')}
                    onClickButtonCancel={handleCreateDirectoryClose}
                    onClickButtonApply={handleCreateDirectory}
                />
            </Dialog>
            <NavigationTree
                key={requestId}
                rootState={{
                    path: rootPath,
                    name: rootName,
                    type: mapPathTypeToNavigationTreeType(rootType),
                    collapsed: false,
                }}
                fetchPath={fetchPath}
                getActions={getActions(dispatch, {
                    setActivePath: onActivePathUpdate,
                    setQueryMode,
                    showCreateDirectoryDialog: handleOpenCreateDirectoryDialog,
                })}
                renderAdditionalNodeElements={getControls(dispatch, {
                    setActivePath: onActivePathUpdate,
                })}
                activePath={currentPath}
                onActivePathUpdate={onActivePathUpdate}
                cache={false}
                virtualize
            />
        </React.Fragment>
    );
}
