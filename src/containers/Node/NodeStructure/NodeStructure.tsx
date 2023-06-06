import {useEffect, useRef, useMemo} from 'react';
import {useDispatch} from 'react-redux';
import url from 'url';
import _ from 'lodash';

import cn from 'bem-cn-lite';

import {Loader} from '../.././../components/Loader';

import {getNodeStructure} from '../../../store/reducers/node/node';
import {selectNodeStructure} from '../../../store/reducers/node/selectors';

import {AutoFetcher} from '../../../utils/autofetcher';
import {useTypedSelector} from '../../../utils/hooks';

import {PDisk} from './Pdisk';

import './NodeStructure.scss';

const b = cn('kv-node-structure');

export function valueIsDefined(value: any) {
    return value !== null && value !== undefined;
}

function generateId({type, id}: {type: 'pdisk' | 'vdisk'; id: string}) {
    return `${type}-${id}`;
}

interface NodeStructureProps {
    nodeId: string;
    className?: string;
    additionalNodesInfo?: any;
}

const autofetcher = new AutoFetcher();

function NodeStructure({nodeId, className, additionalNodesInfo}: NodeStructureProps) {
    const dispatch = useDispatch();

    const nodeStructure = useTypedSelector(selectNodeStructure);

    const {loadingStructure, wasLoadedStructure} = useTypedSelector((state) => state.node);
    const nodeData = useTypedSelector((state) => state.node?.data?.SystemStateInfo?.[0]);

    const nodeHref = useMemo(() => {
        return additionalNodesInfo?.getNodeRef
            ? additionalNodesInfo.getNodeRef(nodeData)
            : undefined;
    }, [nodeData, additionalNodesInfo]);

    const {pdiskId: pdiskIdFromUrl, vdiskId: vdiskIdFromUrl} = url.parse(
        window.location.href,
        true,
    ).query;

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollContainer = scrollContainerRef.current;

    const isReady = useRef(false);

    const scrolled = useRef(false);

    useEffect(() => {
        return () => {
            if (scrollContainer) {
                scrollContainer.scrollTo({
                    behavior: 'smooth',
                    top: 0,
                });
            }
        };
    }, []);

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
        if (!_.isEmpty(nodeStructure) && scrollContainer) {
            isReady.current = true;
        }
    }, [nodeStructure]);

    useEffect(() => {
        if (isReady.current && !scrolled.current && scrollContainer) {
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
                scrollContainer.scrollTo({
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
                      nodeHref={nodeHref}
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
