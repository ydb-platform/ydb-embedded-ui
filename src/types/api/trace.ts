import type {AxiosRequestConfig} from 'axios';

export interface TTraceCheck {
    url: AxiosRequestConfig['url'];
}

export interface TTraceView {
    url: string;
}
