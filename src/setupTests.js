/* eslint-disable import/order, no-undef */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import {TextDecoder, TextEncoder} from 'util';

import '@testing-library/jest-dom';
import {configure as configureUiKit} from '@gravity-ui/uikit';

import {Lang, i18n} from '../src/utils/i18n';

i18n.setLang(Lang.En);
configureUiKit({lang: Lang.En});

// jsdom does not provide the Encoding API (used e.g. for decoding topic messages).
if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
    globalThis.TextDecoder = TextDecoder;
}

// only to prevent warnings from history lib
// all api calls in tests should be mocked
window.custom_backend = '/';

// Mock multipart-parser globally for all tests
jest.mock('@mjackson/multipart-parser', () => ({
    parseMultipart: jest.fn(),
}));
