import {test, expect} from '@playwright/test';

test.describe('Comparison wizard', () => {
  test('choose places, keep the newest year, no conversion, and read the table', async ({page}) => {
    await page.goto('/financial-comparison');
    await expect(page.locator('h1')).toContainText('Finanzen vergleichen');

    // Step 1: places. Start with one, then add a suggestion for it
    await page.getByTestId('place-search').fill('aargau');
    await expect(page.getByTestId('place-picker')).toContainText('Alle Gemeinden des Kantons Aargau');
    await page.getByRole('button', {name: 'Mit Alle Gemeinden des Kantons Aargau beginnen'}).click();
    await page
      .getByTestId('suggestions-sameCanton')
      .getByRole('button', {name: 'Kanton Aargau inklusive allen Gemeinden'})
      .click();
    await expect(page.getByTestId('selected-places').locator('li')).toHaveCount(2);

    // Step 2: years (the newest year both have is preselected)
    await page.getByTestId('step-next').click();
    await expect(page.getByTestId('year-2024')).toHaveAttribute('aria-pressed', 'true');

    // Step 3: no conversion
    await page.getByTestId('step-next').click();
    await expect(page.getByTestId('scaling-choice-none')).toHaveClass(/is-active/);

    // Step 4: the result, charts first, then the table
    await page.getByTestId('step-next').click();
    await expect(page.getByTestId('financial-charts')).toBeVisible({timeout: 60000});
    await page.getByTestId('view-table').click();
    await expect(page.locator('[data-testid="tree-table"] thead')).toContainText('Alle Gemeinden des Kantons Aargau');
    await expect(page.locator('[data-testid="tree-table"] thead')).toContainText('Kanton Aargau inklusive allen Gemeinden');

    // Total assets of all Aargau municipalities in the newest year (gdn_ag 2024, EFV release of 2026)
    await expect(page.locator('#app')).toContainText('14.886.062.686 CHF');
    expect(new URL(page.url()).searchParams.get('datasets')).toBe('std/fs/gdn_ag:2024,std/fs/ktn_gdn_ag:2024');
  });


  test('comparison view loads with correct headers', async ({page}) => {
    await page.goto('/c?datasets=gdn/fs/194141:2022,std/fs/ktn_ag:2022,std/fs/bund:2022,std/fs/sv_ahv:2022');
    
    // Wait for table to be visible first
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 60000 });
    
    // Then check for headers with longer timeout
    await expect(page.locator('thead')).toContainText('Reinach (AG)', { timeout: 30000 });
    await expect(page.locator('thead')).toContainText('Kanton Aargau', { timeout: 10000 });
    await expect(page.locator('thead')).toContainText('Bund (CH)', { timeout: 10000 });
    await expect(page.locator('thead')).toContainText('Alters- und Hinterlassenenversicherung (AHV)', { timeout: 10000 });
  });


  test('comparison view loads with correct data', async ({page}) => {
    await page.goto('/c?datasets=gdn/fs/194141:2022,std/fs/ktn_ag:2022,std/fs/bund:2022,std/fs/sv_ahv:2022');
    
    // Wait for table to be visible first
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 60000 });
    
    // Then check for data with longer timeout
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Reinach' }).first()).toContainText('135.302.448 CHF', { timeout: 30000 });
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Kanton' }).first()).toContainText('4.865.841.581 CHF', { timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Bund (' }).first()).toContainText('181.414.424.516 CHF', { timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Alters' }).first()).toContainText('48.744.054.697 CHF', { timeout: 10000 });
  });

  test('select different scaling factors', async ({page}) => {
    await page.goto('/c?datasets=gdn/fs/194141:2022,std/fs/ktn_ag:2022,std/fs/bund:2022,std/fs/sv_ahv:2022');

    // Per capita with the population of the dataset's own year (2022), from public/data/stats/pop
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Bevölkerung' }).click();
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Reinach' }).first()).toContainText('14.681 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Kanton' }).first()).toContainText('6.841 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Bund (' }).first()).toContainText('20.579 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Alters' }).first()).toContainText('5.529 CHF');
  });


  test('scaling should be applied from params', async ({page}) => {
    await page.goto('/c?datasets=gdn/fs/194141:2022,std/fs/ktn_ag:2022,std/fs/bund:2022,std/fs/sv_ahv:2022&scaling=pop');

    // Wait for the data to load by checking for specific content
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Reinach' }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Reinach' }).first()).toContainText('14.681 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Kanton' }).first()).toContainText('6.841 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Bund (' }).first()).toContainText('20.579 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Alters' }).first()).toContainText('5.529 CHF');
  });

});
