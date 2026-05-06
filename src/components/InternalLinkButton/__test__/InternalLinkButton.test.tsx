import React from 'react';

import {fireEvent, render, screen} from '@testing-library/react';

import {InternalLinkButton} from '../InternalLinkButton';

const mockPush = jest.fn();
const mockCreateHref = jest.fn(({pathname, search, hash}) => `${pathname}${search}${hash}`);

jest.mock('react-router-dom', () => ({
    useHistory: () => ({
        push: mockPush,
        createHref: mockCreateHref,
    }),
}));

describe('InternalLinkButton', () => {
    beforeEach(() => {
        mockPush.mockClear();
        mockCreateHref.mockClear();
        mockCreateHref.mockImplementation(
            ({pathname, search, hash}) => `/base${pathname}${search}${hash}`,
        );
    });

    test('renders browser href created by history.createHref', () => {
        render(
            <InternalLinkButton href="/vDisk?nodeId=4&vDiskId=0-1-0-3-0">VDisk</InternalLinkButton>,
        );

        const link = screen.getByRole('link', {name: 'VDisk'});

        expect(mockCreateHref).toHaveBeenCalledWith({
            pathname: '/vDisk',
            search: '?nodeId=4&vDiskId=0-1-0-3-0',
            hash: '',
        });
        expect(link.getAttribute('href')).toBe('/base/vDisk?nodeId=4&vDiskId=0-1-0-3-0');
    });

    test('navigates internally on unmodified left click', () => {
        const onClick = jest.fn();

        render(
            <InternalLinkButton href="/pDisk?nodeId=4&pDiskId=1001" onClick={onClick}>
                PDisk
            </InternalLinkButton>,
        );

        const link = screen.getByRole('link', {name: 'PDisk'});
        const wasNotPrevented = fireEvent.click(link, {button: 0});

        expect(wasNotPrevented).toBe(false);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/pDisk?nodeId=4&pDiskId=1001');
    });

    test('does not navigate internally when onClick prevents default', () => {
        const onClick = jest.fn((event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
        });

        render(
            <InternalLinkButton href="/pDisk?nodeId=4&pDiskId=1001" onClick={onClick}>
                PDisk
            </InternalLinkButton>,
        );

        const link = screen.getByRole('link', {name: 'PDisk'});
        const wasNotPrevented = fireEvent.click(link, {button: 0});

        expect(wasNotPrevented).toBe(false);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    test.each([
        ['meta click', {button: 0, metaKey: true}],
        ['ctrl click', {button: 0, ctrlKey: true}],
        ['shift click', {button: 0, shiftKey: true}],
        ['alt click', {button: 0, altKey: true}],
        ['middle click', {button: 1}],
    ])('lets browser handle %s', (_name, eventInit) => {
        const onClick = jest.fn();

        render(
            <InternalLinkButton href="/vDisk?nodeId=4&vDiskId=0-1-0-3-0" onClick={onClick}>
                VDisk
            </InternalLinkButton>,
        );

        const link = screen.getByRole('link', {name: 'VDisk'});
        const wasNotPrevented = fireEvent.click(link, eventInit);

        expect(wasNotPrevented).toBe(true);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });

    test('lets browser handle links with non-self target', () => {
        render(
            <InternalLinkButton href="/vDisk?nodeId=4&vDiskId=0-1-0-3-0" target="_blank">
                VDisk
            </InternalLinkButton>,
        );

        const link = screen.getByRole('link', {name: 'VDisk'});
        const wasNotPrevented = fireEvent.click(link, {button: 0});

        expect(wasNotPrevented).toBe(true);
        expect(link.getAttribute('target')).toBe('_blank');
        expect(mockPush).not.toHaveBeenCalled();
    });
});
