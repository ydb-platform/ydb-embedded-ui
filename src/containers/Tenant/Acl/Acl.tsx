import React from 'react';

import {DefinitionList} from '@gravity-ui/components';
import type {DefinitionListItem} from '@gravity-ui/components';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Loader} from '../../../components/Loader';
import {schemaAclApi} from '../../../store/reducers/schemaAcl/schemaAcl';
import type {TACE} from '../../../types/api/acl';
import {valueIsDefined} from '../../../utils';
import {cn} from '../../../utils/cn';

import i18n from './i18n';

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

function getAclListItems(acl?: TACE[]): DefinitionListItem[] {
    if (!acl || !acl.length) {
        return [];
    }

    const normalizedAcl = normalizeAcl(acl);

    return normalizedAcl.map(({Subject, ...data}) => {
        const definedDataEntries = Object.entries(data).filter(([_key, value]) =>
            Boolean(value),
        ) as [AclParameter, string | string[]][];

        if (definedDataEntries.length === 1 && definedDataEntries[0][0] === 'access') {
            return {
                name: Subject,
                content: <DefinitionValue value={definedDataEntries[0][1]} />,
            };
        }
        return {
            label: <span className={b('group-label')}>{Subject}</span>,
            items: aclParams
                .map((key) => {
                    const value = data[key];
                    if (value) {
                        return {
                            name: aclParamToName[key],
                            content: <DefinitionValue value={value} />,
                        };
                    }
                    return undefined;
                })
                .filter(valueIsDefined),
        };
    });
}

function getOwnerItem(owner?: string): DefinitionListItem[] {
    const preparedOwner = prepareLogin(owner);
    if (!preparedOwner) {
        return [];
    }
    return [
        {
            name: <span className={b('owner')}>{preparedOwner}</span>,
            content: <span className={b('owner')}>{i18n('title_owner')}</span>,
        },
    ];
}

export const Acl = ({path, database}: {path: string; database: string}) => {
    const {currentData, isFetching, error} = schemaAclApi.useGetSchemaAclQuery({path, database});

    const loading = isFetching && !currentData;

    const {acl, effectiveAcl, owner} = currentData || {};

    const aclListItems = getAclListItems(acl);
    const effectiveAclListItems = getAclListItems(effectiveAcl);

    const ownerItem = getOwnerItem(owner);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <ResponseError error={error} />;
    }

    if (!acl && !owner && !effectiveAcl) {
        return <React.Fragment>{i18n('description_empty')}</React.Fragment>;
    }

    const accessRightsItems = ownerItem.concat(aclListItems);

    return (
        <div className={b()}>
            {accessRightsItems.length ? (
                <React.Fragment>
                    <div className={b('list-title')}>{i18n('title_rights')}</div>
                    <DefinitionList
                        items={accessRightsItems}
                        nameMaxWidth={200}
                        className={b('result')}
                    />
                </React.Fragment>
            ) : null}
            {effectiveAclListItems.length ? (
                <React.Fragment>
                    <div className={b('list-title')}>{i18n('title_effective-rights')}</div>
                    <DefinitionList
                        items={effectiveAclListItems}
                        nameMaxWidth={200}
                        className={b('result')}
                    />
                </React.Fragment>
            ) : null}
        </div>
    );
};
