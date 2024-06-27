import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Loader} from '../../../components/Loader';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {schemaAclApi} from '../../../store/reducers/schemaAcl/schemaAcl';
import type {TACE} from '../../../types/api/acl';
import {cn} from '../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import i18n from '../i18n';

import './Acl.scss';

const b = cn('ydb-acl');

const ACL_COLUMNS_WIDTH_LS_KEY = 'aclTableColumnsWidth';

const TABLE_SETTINGS = {
    ...DEFAULT_TABLE_SETTINGS,
    dynamicRender: false,
    stickyTop: 36,
};

const prepareLogin = (value: string | undefined) => {
    if (value && value.endsWith('@staff') && !value.startsWith('svc_')) {
        const login = value.split('@')[0];
        return login;
    }

    return value;
};

const columns: Column<TACE>[] = [
    {
        name: 'AccessType',
        header: 'Access Type',
        sortable: false,
        render: ({row}) => row.AccessType,
    },
    {
        name: 'AccessRights',
        header: 'Access Rights',
        render: ({row}) => {
            return row.AccessRights?.map((item, index) => {
                return <div key={index}>{item}</div>;
            });
        },
        sortable: false,
    },
    {
        name: 'Subject',
        sortable: false,
        render: ({row}) => {
            return prepareLogin(row.Subject);
        },
        width: 140,
    },
    {
        name: 'InheritanceType',
        header: 'Inheritance Type',
        render: ({row}) => {
            return row.InheritanceType?.map((item, index) => {
                return <div key={index}>{item}</div>;
            });
        },
        sortable: false,
    },
];

export const Acl = ({path}: {path: string}) => {
    const {currentData, isFetching, error} = schemaAclApi.useGetSchemaAclQuery({path});

    const loading = isFetching && !currentData;
    const {acl, owner} = currentData || {};

    const renderTable = () => {
        if (!acl || !acl.length) {
            return null;
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={ACL_COLUMNS_WIDTH_LS_KEY}
                columns={columns}
                data={acl}
                settings={TABLE_SETTINGS}
            />
        );
    };

    const renderOwner = () => {
        if (!owner) {
            return null;
        }

        return (
            <div className={b('owner-container')}>
                <span className={b('owner-label')}>{`${i18n('acl.owner')}: `}</span>
                {prepareLogin(owner)}
            </div>
        );
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <ResponseError error={error} />;
    }

    if (!acl && !owner) {
        return <React.Fragment>{i18n('acl.empty')}</React.Fragment>;
    }

    return (
        <div className={b()}>
            <div className={b('result')}>
                {renderOwner()}
                {renderTable()}
            </div>
        </div>
    );
};
