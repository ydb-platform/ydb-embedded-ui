import {useDispatch} from 'react-redux';
import {useEffect} from 'react';
import cn from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';

import type {TACE} from '../../../types/api/acl';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useTypedSelector} from '../../../utils/hooks';
import {getSchemaAcl, setAclWasNotLoaded} from '../../../store/reducers/schemaAcl/schemaAcl';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Loader} from '../../../components/Loader';

import './Acl.scss';

const b = cn('ydb-acl');

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

export const Acl = () => {
    const dispatch = useDispatch();

    const {currentSchemaPath} = useTypedSelector((state) => state.schema);
    const {loading, error, acl, owner, wasLoaded} = useTypedSelector((state) => state.schemaAcl);

    useEffect(() => {
        if (currentSchemaPath) {
            dispatch(getSchemaAcl({path: currentSchemaPath}));
        }

        return () => {
            // Ensures correct acl on path change
            dispatch(setAclWasNotLoaded());
        };
    }, [currentSchemaPath, dispatch]);

    const renderTable = () => {
        if (!acl || !acl.length) {
            return null;
        }

        return (
            <DataTable
                theme="yandex-cloud"
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
                <span className={b('owner-label')}>Owner: </span>
                {prepareLogin(owner)}
            </div>
        );
    };

    if (loading && !wasLoaded) {
        return <Loader />;
    }

    if (error) {
        return <ResponseError error={error} className={b('message-container')} />;
    }

    if (!loading && !acl && !owner) {
        return <div className={b('message-container')}>Empty</div>;
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
