import React from 'react';

import type {DefinitionListItem} from '@gravity-ui/components';
import {DefinitionList} from '@gravity-ui/components';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Loader} from '../../../components/Loader';
import {schemaAclApi} from '../../../store/reducers/schemaAcl/schemaAcl';
import type {TACE} from '../../../types/api/acl';
import {cn} from '../../../utils/cn';
import i18n from '../i18n';

import './Acl.scss';

const b = cn('ydb-acl');

const prepareLogin = (value: string | undefined) => {
    if (value && value.endsWith('@staff') && !value.startsWith('svc_')) {
        const login = value.split('@')[0];
        return login;
    }

    return value;
};

const aclParams = ['access', 'type', 'inheritance'] as const;

const aclParamToName: Record<(typeof aclParams)[number], string> = {
    access: 'Access',
    type: 'Access type',
    inheritance: 'Inheritance type',
};

const defaultInheritanceType = new Set(['Object', 'Container']);

function normalizeAcl(acl: TACE[]) {
    return acl.map((ace) => {
        const {AccessRules = [], AccessRights = [], AccessType, InheritanceType, Subject} = ace;
        const access = AccessRules.concat(AccessRights);
        //"Allow" is default access type. We want to show it only if it isn't default
        const type = AccessType === 'Allow' ? undefined : AccessType;
        let inheritance;
        // ['Object', 'Container'] - is default inheritance type. We want to show it only if it isn't default
        if (
            InheritanceType?.length !== defaultInheritanceType.size ||
            InheritanceType.some((t) => !defaultInheritanceType.has(t))
        ) {
            inheritance = InheritanceType;
        }
        return {
            access,
            type,
            inheritance,
            Subject,
        };
    });
}

export const Acl = ({path}: {path: string}) => {
    const {currentData, isFetching, error} = schemaAclApi.useGetSchemaAclQuery({path});

    const loading = isFetching && !currentData;
    const {acl, owner} = currentData || {};

    const renderTable = () => {
        if (!acl || !acl.length) {
            return null;
        }

        const normalizedAcl = normalizeAcl(acl);

        const items = normalizedAcl.map(({Subject, ...data}) => {
            return {
                label: Subject,
                items: aclParams
                    .map((key) => {
                        const value = data[key];
                        if (!value) {
                            return undefined;
                        }
                        const normalizedValue = typeof value === 'string' ? [value] : value;
                        return {
                            name: aclParamToName[key],
                            content: (
                                <div className={b('definition-content')}>
                                    {normalizedValue.map((el) => (
                                        <span key={el}>{el}</span>
                                    ))}
                                </div>
                            ),
                        };
                    })
                    .filter(Boolean),
            };
        }) as DefinitionListItem[];

        return <DefinitionList items={items} nameMaxWidth={200} />;
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
