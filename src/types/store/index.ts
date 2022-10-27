import {IDescribeRootStateSlice} from './describe';
import {IHealthcheckInfoRootStateSlice} from './healthcheck';

export interface IRootState extends IHealthcheckInfoRootStateSlice, IDescribeRootStateSlice {}
