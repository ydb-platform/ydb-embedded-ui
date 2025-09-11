import React from 'react';

import {isEmpty} from 'lodash';

import type {Location} from '../../../../../types/api/healthcheck';
import i18n from '../../i18n';

import type {LocationFieldCompute} from './ComputeLocation';
import {ComputeLocation} from './ComputeLocation';
import {NodeInfo} from './NodeInfo';
import type {LocationFieldStorage} from './StorageLocation';
import {StorageLocation} from './StorageLocation';
import {SectionWithTitle} from './utils';

interface IssueLocationProps {
    location?: Location;
    hiddenStorageFields?: LocationFieldStorage[];
    hiddenComputeFields?: LocationFieldCompute[];
}

export function IssueLocation({
    location,
    hiddenStorageFields,
    hiddenComputeFields,
}: IssueLocationProps) {
    return (
        <React.Fragment>
            <StorageLocation location={location?.storage} hiddenFields={hiddenStorageFields} />
            <ComputeLocation location={location?.compute} hiddenFields={hiddenComputeFields} />
            <NodeLocation location={location?.node} />
            <PeerLocation location={location?.peer} />
        </React.Fragment>
    );
}

interface NodeLocationProps {
    location: Location['node'];
}

function NodeLocation({location}: NodeLocationProps) {
    if (!location || isEmpty(location)) {
        return null;
    }

    return (
        <SectionWithTitle title={i18n('label_node_location')}>
            <NodeInfo node={location} />
        </SectionWithTitle>
    );
}

interface PeerLocationProps {
    location: Location['peer'];
}

function PeerLocation({location}: PeerLocationProps) {
    if (!location || isEmpty(location)) {
        return null;
    }

    return (
        <SectionWithTitle title={i18n('label_peer_location')}>
            <NodeInfo node={location} />
        </SectionWithTitle>
    );
}
