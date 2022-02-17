import {ASIDE_HEADER_STORE_KEY} from './constants';
import {AsideHeaderLocalStorage} from './types';

function store<T = unknown>(key: string, data: T) {
    try {
        window.localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
        console.error(`data not saved in localeStorage: ${err}`);
    }
}

function restore<T = any>(key: string): T | null {
    try {
        const data = window.localStorage.getItem(key);
        if (data === null) {
            return null;
        }
        return JSON.parse(data) as T;
    } catch (err) {
        return null;
    }
}

export function getLocalData() {
    return restore<AsideHeaderLocalStorage>(ASIDE_HEADER_STORE_KEY);
}

export function setLocalData(data: Partial<AsideHeaderLocalStorage> | null) {
    const storeData = getLocalData();
    store<AsideHeaderLocalStorage>(ASIDE_HEADER_STORE_KEY, {
        ...storeData,
        ...data,
    });
}
