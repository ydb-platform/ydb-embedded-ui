import url from 'url';

import React from 'react';

import isEmpty from 'lodash/isEmpty';

import {Loader} from '../.././../components/Loader';
import {ResponseError} from '../../../components/Errors/ResponseError';
import {nodeApi} from '../../../store/reducers/node/node';
import {selectNodeStructure} from '../../../store/reducers/node/selectors';
import {cn} from '../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../utils/hooks';

import {PDisk} from './Pdisk';

import './NodeStructure.scss';

const b = cn('kv-node-structure');

function generateId({type, id}: {type: 'pdisk' | 'vdisk'; id: string}) {
    return `${type}-${id}`;
}

interface NodeStructureProps {
    nodeId: string;
    className?: string;
}

function NodeStructure({nodeId, className}: NodeStructureProps) {
    const nodeStructure = useTypedSelector((state) => selectNodeStructure(state, nodeId));

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = nodeApi.useGetNodeStructureQuery(
        {nodeId},
        {pollingInterval: autoRefreshInterval},
    );

    const loadingStructure = isFetching && currentData === undefined;

    const {pdiskId: pdiskIdFromUrl, vdiskId: vdiskIdFromUrl} = url.parse(
        window.location.href,
        true,
    ).query;

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scrolled = React.useRef(false);

    React.useEffect(() => {
        if (!isEmpty(nodeStructure) && !scrolled.current && scrollContainerRef.current) {
            const element = document.getElementById(
                generateId({type: 'pdisk', id: pdiskIdFromUrl as string}),
            );

            let scrollToVdisk = 0;

            if (vdiskIdFromUrl) {
                const vDisks = nodeStructure[pdiskIdFromUrl as string]?.vDisks;
                const vDisk = vDisks?.find((el) => el.id === vdiskIdFromUrl);
                const dataTable = vDisk ? document.querySelector('.data-table') : undefined;
                const order = vDisk?.order || 0;

                if (dataTable) {
                    scrollToVdisk += (dataTable as HTMLElement).offsetTop + 40 * order;
                }
            }

            if (element) {
                scrollContainerRef.current.scrollTo({
                    behavior: 'smooth',
                    // should subtract 20 to avoid sticking the element to tabs
                    top: scrollToVdisk ? scrollToVdisk : element.offsetTop,
                });
                scrolled.current = true;
            }
        }
    }, [nodeStructure, pdiskIdFromUrl, vdiskIdFromUrl]);

    const renderStub = () => {
        return 'There is no information about node structure.';
    };

    const renderStructure = () => {
        const pDisksIds = Object.keys(nodeStructure);
        return pDisksIds.length > 0
            ? pDisksIds.map((pDiskId) => (
                  <PDisk
                      data={nodeStructure[pDiskId]}
                      key={pDiskId}
                      id={generateId({type: 'pdisk', id: pDiskId})}
                      unfolded={pdiskIdFromUrl === pDiskId}
                      selectedVdiskId={vdiskIdFromUrl as string}
                      nodeId={nodeId}
                  />
              ))
            : renderStub();
    };

    const renderContent = () => {
        if (loadingStructure) {
            return <Loader size="m" />;
        }
        if (error && !currentData) {
            return null;
        }
        return renderStructure();
    };

    return (
        <div className={b()} ref={scrollContainerRef}>
            {error ? <ResponseError error={error} className={b('error')} /> : null}
            <div className={className}>{renderContent()}</div>
        </div>
    );
}

export default NodeStructure;
