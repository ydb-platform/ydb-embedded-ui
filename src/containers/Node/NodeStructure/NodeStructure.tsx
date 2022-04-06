import {useEffect, useRef, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import url from 'url';
import _ from 'lodash';

import cn from 'bem-cn-lite';

import {Loader} from '@yandex-cloud/uikit';

import {PDisk} from './Pdisk';

import {getNodeStructure, selectNodeStructure} from '../../../store/reducers/node';

import {AutoFetcher} from '../../../utils/autofetcher';

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

function NodeStructure(props: NodeStructureProps) {
    const dispatch = useDispatch();

    const nodeStructure: any = useSelector((state: any) => selectNodeStructure(state));

    const {loadingStructure, wasLoadedStructure} = useSelector((state: any) => state.node);
    const nodeData = useSelector((state: any) => state.node?.data?.SystemStateInfo?.[0]);

    const nodeHref = useMemo(() => {
        return props.additionalNodesInfo?.getNodeRef
            ? props.additionalNodesInfo.getNodeRef(nodeData)
            : undefined;
    }, [nodeData, props.additionalNodesInfo]);

    const {pdiskId: pdiskIdFromUrl, vdiskId: vdiskIdFromUrl} = url.parse(
        window.location.href,
        true,
    ).query;

    const isReady = useRef(false);

    const scrolled = useRef(false);

    const scrollContainer = useRef<Element>();

    useEffect(() => {
        return () => {
            if (scrollContainer.current) {
                scrollContainer.current.scrollTo({
                    behavior: 'smooth',
                    top: 0,
                });
            }
        };
    }, []);

    useEffect(() => {
        dispatch(getNodeStructure(props.nodeId));
        autofetcher.start();
        autofetcher.fetch(() => dispatch(getNodeStructure(props.nodeId)));

        return () => {
            scrolled.current = false;
            isReady.current = false;
            autofetcher.stop();
        };
    }, [props.nodeId, dispatch]);

    useEffect(() => {
        if (!_.isEmpty(nodeStructure)) {
            isReady.current = true;
        }
    }, [nodeStructure]);

    useEffect(() => {
        if (isReady.current && !scrolled.current) {
            const element = document.getElementById(
                generateId({type: 'pdisk', id: pdiskIdFromUrl as string}),
            );

            const container = document.querySelector('.node__content');

            let scrollToVdisk = 0;

            if (vdiskIdFromUrl) {
                const vDisks = nodeStructure[pdiskIdFromUrl as string]?.vDisks;
                const vDisk = vDisks?.find((el: any) => el.id === vdiskIdFromUrl);
                const dataTable = vDisk ? document.querySelector('.data-table') : undefined;
                const order = vDisk?.order;

                if (dataTable) {
                    scrollToVdisk += (dataTable as HTMLElement).offsetTop + 40 * (order + 1);
                }
            }

            if (element && container) {
                scrollContainer.current = container;
                container.scrollTo({
                    behavior: 'smooth',
                    // should subtract 20 to avoid sticking the element to tabs
                    top: scrollToVdisk ? scrollToVdisk : element.offsetTop - 20,
                });
                scrolled.current = true;
            }
        }
        return () => {
            isReady.current = false;
        };
    }, [isReady, pdiskIdFromUrl, vdiskIdFromUrl, nodeStructure]);

    const renderLoader = () => {
        return <Loader className={b('loader')} size="m" />;
    };

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
            return renderLoader();
        }
        return renderStructure();
    };

    return <div className={b(null, props.className)}>{renderContent()}</div>;
}

export default NodeStructure;
