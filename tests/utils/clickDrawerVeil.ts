import type {Locator, Page} from '@playwright/test';
import {expect} from '@playwright/test';

export async function clickDrawerVeil(page: Page, overlay: Locator) {
    await expect(overlay).toHaveAttribute('data-floating-ui-status', 'open');
    await expect
        .poll(() =>
            overlay.evaluate((element) =>
                element
                    .getAnimations({subtree: true})
                    .filter(
                        (animation) =>
                            animation.effect?.getComputedTiming().iterations !== Infinity,
                    )
                    .every((animation) => animation.playState === 'finished'),
            ),
        )
        .toBe(true);

    const overlayBox = await overlay.boundingBox();
    const panelBox = await overlay.locator('.g-drawer__item').boundingBox();
    if (!overlayBox || !panelBox) {
        throw new Error('The drawer and its veil must be visible before an outside click');
    }

    expect(panelBox.x).toBeGreaterThan(overlayBox.x);
    const point = {
        x: (overlayBox.x + panelBox.x) / 2,
        y: overlayBox.y + overlayBox.height / 2,
    };
    await expect
        .poll(() =>
            overlay.evaluate(
                (element, {x, y}) => document.elementFromPoint(x, y) === element,
                point,
            ),
        )
        .toBe(true);
    await page.mouse.click(point.x, point.y);
}
