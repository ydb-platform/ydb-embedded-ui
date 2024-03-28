import {useEffect, useRef} from 'react';
import url from 'url';
import isEmpty from 'lodash/isEmpty';

import cn from 'bem-cn-lite';

import {Loader} from '../.././../components/Loader';

import {getNodeStructure} from '../../../store/reducers/node/node';
import {selectNodeStructure} from '../../../store/reducers/node/selectors';

import {AutoFetcher} from '../../../utils/autofetcher';
import {useTypedSelector, useTypedDispatch} from '../../../utils/hooks';

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

const autofetcher = new AutoFetcher();

function NodeStructure({nodeId, className}: NodeStructureProps) {
    const dispatch = useTypedDispatch();

    const nodeStructure = useTypedSelector(selectNodeStructure);

    const {loadingStructure, wasLoadedStructure} = useTypedSelector((state) => state.node);

    const {pdiskId: pdiskIdFromUrl, vdiskId: vdiskIdFromUrl} = url.parse(
        window.location.href,
        true,
    ).query;

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const isReady = useRef(false);

    const scrolled = useRef(false);

    useEffect(() => {
        dispatch(getNodeStructure(nodeId));
        autofetcher.start();
        autofetcher.fetch(() => dispatch(getNodeStructure(nodeId)));

        return () => {
            scrolled.current = false;
            isReady.current = false;
            autofetcher.stop();
        };
    }, [nodeId, dispatch]);

    useEffect(() => {
        if (!isEmpty(nodeStructure) && scrollContainerRef.current) {
            isReady.current = true;
        }
    }, [nodeStructure]);

    useEffect(() => {
        if (isReady.current && !scrolled.current && scrollContainerRef.current) {
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
        if (loadingStructure && !wasLoadedStructure) {
            return <Loader size="m" />;
        }
        return renderStructure();
    };

    return (
        <div className={b()} ref={scrollContainerRef}>
            <div className={className}>{renderContent()}</div>
        </div>
    );
}

export default NodeStructure;
