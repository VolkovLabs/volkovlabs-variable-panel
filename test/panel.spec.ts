import { test, expect } from '@grafana/plugin-e2e';
import { TEST_IDS } from '../src/constants/tests';

test.describe('Volkovlabs Variable Panel', () => {
  test('Check grafana version', async ({ grafanaVersion }) => {
    console.log('Grafana version: ', grafanaVersion);
    expect(grafanaVersion).toEqual(grafanaVersion);
  });

  test('Should display Alert Info', async ({ gotoDashboardPage, dashboardPage, page }) => {
    /**
     * Go To Panels dashboard panels.json
     * return dashboardPage
     */
    await gotoDashboardPage({ uid: 'O4tc_E6Gz' });

    /**
     * Await content load
     */
    await page.waitForTimeout(1500);

    /**
     * Find panel by title with Alert message
     * Should be visible
     */
    await expect(dashboardPage.getPanelByTitle('Empty').locator).toBeVisible();

    await expect(dashboardPage.getPanelByTitle('Empty').locator.getByTestId(TEST_IDS.tableView.root)).toBeVisible();
    await expect(
      dashboardPage
        .getPanelByTitle('Empty')
        .locator.getByTestId(TEST_IDS.tableView.root)
        .getByTestId('data-testid Alert info')
    ).toBeVisible();
  });

  test('Should display Device Variable content', async ({ gotoDashboardPage, dashboardPage, page }) => {
    /**
     * Go To Panels dashboard panels.json
     * return dashboardPage
     */
    await gotoDashboardPage({ uid: 'O4tc_E6Gz' });

    /**
     * Await content load
     */
    await page.waitForTimeout(1500);

    /**
     * Find panel by title Device
     * Should be visible
     */
    await expect(dashboardPage.getPanelById('6').locator.getByTestId(TEST_IDS.tableView.root)).toBeVisible();

    /**
     * Compare Screenshot
     */
    await expect(dashboardPage.getPanelById('6').locator.getByTestId(TEST_IDS.tableView.root)).toHaveScreenshot(
      'actual-screenshot.png',
      { maxDiffPixelRatio: 0.1 }
    );
  });
});
