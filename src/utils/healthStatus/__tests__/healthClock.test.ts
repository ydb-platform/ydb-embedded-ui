import {createHealthClock} from '../healthClock';

afterEach(() => jest.useRealTimers());

test('keeps counting elapsed time and resume after forward and backward wall-clock corrections', () => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    const now = createHealthClock();
    expect(now()).toBe(1000);
    jest.setSystemTime(10000);
    expect(now()).toBe(10000);
    jest.setSystemTime(0);
    expect(now()).toBe(10000);
    jest.advanceTimersByTime(1000);
    expect(now()).toBe(11000);
    // Simulate system sleep on browsers whose performance clock stops ticking.
    jest.setSystemTime(6000);
    expect(now()).toBe(16000);
});
