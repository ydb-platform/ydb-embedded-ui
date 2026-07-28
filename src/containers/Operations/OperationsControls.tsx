import React from 'react';

import {Select} from '@gravity-ui/uikit';

import {Search} from '../../components/Search';
import type {OperationKind} from '../../types/api/operations';

import i18n from './i18n';
import {b} from './shared';

import './Operations.scss';

interface OperationsControlsProps {
    kind: OperationKind;
    operationKinds: {value: OperationKind; content: string}[];
    searchValue: string;
    handleKindChange: (kind: OperationKind) => void;
    handleSearchChange: (value: string) => void;
}

export function OperationsControls({
    kind,
    operationKinds,
    searchValue,
    handleKindChange,
    handleSearchChange,
}: OperationsControlsProps) {
    return (
        <React.Fragment>
            <Search
                value={searchValue}
                onChange={handleSearchChange}
                placeholder={i18n('pleaceholder_search')}
                className={b('search')}
            />
            <Select
                value={[kind]}
                width={150}
                options={operationKinds}
                onUpdate={(value) => handleKindChange(value[0] as OperationKind)}
            />
        </React.Fragment>
    );
}
