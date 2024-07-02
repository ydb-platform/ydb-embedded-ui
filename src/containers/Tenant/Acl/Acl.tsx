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

type AclParameter = (typeof aclParams)[number];

const aclParamToName: Record<AclParameter, string> = {
    access: 'Access',
    type: 'Access type',
    inheritance: 'Inheritance type',
};

const defaultInheritanceType = ['Object', 'Container'];
const defaultAccessType = 'Allow';

const defaultInheritanceTypeSet = new Set(defaultInheritanceType);

function normalizeAcl(acl: TACE[]) {
    return acl.map((ace) => {
        const {AccessRules = [], AccessRights = [], AccessType, InheritanceType, Subject} = ace;
        const access = AccessRules.concat(AccessRights);
        //"Allow" is default access type. We want to show it only if it isn't default
        const type = AccessType === defaultAccessType ? undefined : AccessType;
        let inheritance;
        // ['Object', 'Container'] - is default inheritance type. We want to show it only if it isn't default
        if (
            InheritanceType?.length !== defaultInheritanceTypeSet.size ||
            InheritanceType.some((t) => !defaultInheritanceTypeSet.has(t))
        ) {
            inheritance = InheritanceType;
        }
        return {
            access: access.length ? access : undefined,
            type,
            inheritance,
            Subject,
        };
    });
}

interface DefinitionValueProps {
    value: string | string[];
}

function DefinitionValue({value}: DefinitionValueProps) {
    const normalizedValue = typeof value === 'string' ? [value] : value;
    return (
        <div className={b('definition-content')}>
            {normalizedValue.map((el) => (
                <span key={el}>{el}</span>
            ))}
        </div>
    );
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
            const definedDataEntries = Object.entries(data).filter(([_key, value]) => value) as [
                AclParameter,
                string | string[],
            ][];

            if (definedDataEntries.length === 1 && definedDataEntries[0][0] === 'access') {
                return {
                    name: Subject,
                    content: <DefinitionValue value={definedDataEntries[0][1]} />,
                };
            }
            const definedData = Object.fromEntries(definedDataEntries);
            return {
                label: Subject,
                items: aclParams
                    .map((key) => {
                        const value = definedData[key];
                        return {
                            name: aclParamToName[key],
                            content: <DefinitionValue value={value} />,
                        };
                    })
                    .filter(Boolean),
            };
        }) as DefinitionListItem[];

        const preparedOwner = prepareLogin(owner);

        if (preparedOwner) {
            items.unshift({
                name: <span className={b('owner')}>{preparedOwner}</span>,
                content: <span className={b('owner')}>{i18n('acl.owner')}</span>,
            });
        }

        return <DefinitionList items={items} nameMaxWidth={200} />;
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
            <div className={b('result')}>{renderTable()}</div>
        </div>
    );
};
