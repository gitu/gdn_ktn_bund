import {test, expect} from '@playwright/test';

test.describe('Select Element from Dataset Selector', () => {
  test('select element from dataset selector and open full view', async ({page}) => {
    await page.goto('/financial-comparison');
    await expect(page.locator('h1')).toContainText('Finanzdatenvergleich');
    await page.getByRole('textbox', {name: 'Nach Datensätzen suchen...'}).click();
    await page.getByRole('textbox', {name: 'Nach Datensätzen suchen...'}).fill('aargau');
    await expect(page.locator('tbody')).toContainText('Alle Gemeinden des Kantons Aargau');
    await expect(page.getByRole('cell', {name: 'Kanton Aargau', exact: true})).toBeVisible();
    await page.getByRole('row', {name: 'Alle Gemeinden des Kantons'}).getByLabel('Hinzufügen (2022)').click();
    await expect(page.locator('#app')).toContainText('Alle Gemeinden des Kantons Aargau');
    await page.getByRole('button', {name: 'Hinzufügen (2022)'}).click();
    await expect(page.locator('#app')).toContainText('Kanton Aargau inklusive allen Gemeinden');
    await expect(page.locator('#app')).toContainText('Alle Gemeinden des Kantons Aargau2022');
    await expect(page.locator('#app')).toContainText('Kanton Aargau inklusive allen Gemeinden2022');

    await expect(page.locator('#app')).toContainText('14.347.795.806 CHF');
  });


  test('comarison view loads with correct headers', async ({page}) => {
    await page.goto('/c?datasets=gdn/fs/194141:2022,std/fs/ktn_ag:2022,std/fs/bund:2022,std/fs/sv_ahv:2022');
    await expect(page.locator('thead')).toContainText('Reinach (AG)');
    await expect(page.locator('thead')).toContainText('Kanton Aargau');
    await expect(page.locator('thead')).toContainText('Bund (CH)');
    await expect(page.locator('thead')).toContainText('Alters- und Hinterlassenenversicherung (AHV)');
  });


  test('comarison view loads with correct data', async ({page}) => {
    await page.goto('/c?datasets=gdn/fs/194141:2022,std/fs/ktn_ag:2022,std/fs/bund:2022,std/fs/sv_ahv:2022');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Reinach' }).first()).toContainText('135.302.448 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Kanton' }).first()).toContainText('4.865.841.581 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Bund (' }).first()).toContainText('180.271.592.516 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Alters' }).first()).toContainText('48.744.054.697 CHF');
  });

  test('select different scaling factors', async ({page}) => {
    await page.goto('/c?datasets=gdn/fs/194141:2022,std/fs/ktn_ag:2022,std/fs/bund:2022,std/fs/sv_ahv:2022');

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Anzahl Einwohner/-innen am' }).click();
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Reinach' }).first()).toContainText('14.244 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Kanton' }).first()).toContainText('6.718 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Bund (' }).first()).toContainText('20.115 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Alters' }).first()).toContainText('5.439 CHF');
  });


  test('scaling should be applied from params', async ({page}) => {
    await page.goto('/c?datasets=gdn/fs/194141:2022,std/fs/ktn_ag:2022,std/fs/bund:2022,std/fs/sv_ahv:2022&scaling=pop');

    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Reinach' }).first()).toContainText('14.244 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Kanton' }).first()).toContainText('6.718 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Bund (' }).first()).toContainText('20.115 CHF');
    await expect(page.getByRole('cell', { name: 'Finanzieller Wert für Alters' }).first()).toContainText('5.439 CHF');
  });

});
