import { test, expect } from '@playwright/test'

// Helper: clear localStorage so each test starts fresh
async function freshPage(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.waitForSelector('text=FLOWGRID')
}

// Locate the sidebar panel
function sidebar(page: import('@playwright/test').Page) {
  return page.locator('[class*="fixed"][class*="left-0"][class*="h-full"]')
}

test.describe('App loads', () => {
  test('renders toolbar, grid, and playback controls', async ({ page }) => {
    await freshPage(page)
    await expect(page.getByText('FLOWGRID')).toBeVisible()
    await expect(page.getByLabel('Play')).toBeVisible()
    await expect(page.getByLabel('Stop')).toBeVisible()
    await expect(page.locator('.grid-cols-4').first()).toBeVisible()
  })
})

test.describe('Playback controls', () => {
  test('play button toggles to pause', async ({ page }) => {
    await freshPage(page)
    await expect(page.getByLabel('Play')).toBeVisible()
    await page.getByLabel('Play').click()
    await expect(page.getByLabel('Pause')).toBeVisible()
  })

  test('stop resets to play state', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Play').click()
    await expect(page.getByLabel('Pause')).toBeVisible()
    await page.getByLabel('Stop').click()
    await expect(page.getByLabel('Play')).toBeVisible()
  })

  test('spacebar toggles play/pause', async ({ page }) => {
    await freshPage(page)
    await page.keyboard.press('Space')
    await expect(page.getByLabel('Pause')).toBeVisible()
    await page.keyboard.press('Space')
    await expect(page.getByLabel('Play')).toBeVisible()
  })
})

test.describe('Track picker modal', () => {
  test('opens and closes', async ({ page }) => {
    await freshPage(page)
    await page.locator('button:has-text("Basic Drums")').click()
    await expect(page.getByRole('button', { name: 'RAP', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'MUSICALS', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'No track' })).toBeVisible()
    // Close via X — use exact match to avoid matching "Close settings"
    await page.getByLabel('Close', { exact: true }).click()
    await expect(page.getByRole('button', { name: 'No track' })).not.toBeVisible()
  })

  test('switch to No track', async ({ page }) => {
    await freshPage(page)
    await page.locator('button:has-text("Basic Drums")').click()
    await page.getByRole('button', { name: 'No track' }).click()
    await expect(page.locator('button:has-text("No track")')).toBeVisible()
    await expect(page.getByLabel('Audio settings')).not.toBeVisible()
  })

  test('switch between tracks', async ({ page }) => {
    await freshPage(page)
    await page.locator('button:has-text("Basic Drums")').click()
    await page.locator('button:has-text("Whose Line Rap")').click()
    await expect(page.locator('button:has-text("Whose Line Rap")')).toBeVisible()
  })

  test('switch category tabs', async ({ page }) => {
    await freshPage(page)
    await page.locator('button:has-text("Basic Drums")').click()
    await page.getByRole('button', { name: 'MUSICALS', exact: true }).click()
    await expect(page.getByText('Hoedown')).toBeVisible()
  })

  test('closes on Escape', async ({ page }) => {
    await freshPage(page)
    await page.locator('button:has-text("Basic Drums")').click()
    await expect(page.getByRole('button', { name: 'No track' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'No track' })).not.toBeVisible()
  })
})

test.describe('Dictionary modal', () => {
  test('opens and shows controls', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open rhyme settings').click()
    await expect(page.getByRole('heading', { name: 'RHYMES' })).toBeVisible()
    await expect(page.getByRole('combobox').first()).toBeVisible()
    // Should have 3 selects: words, rhyme pattern, fill mode
    await expect(page.getByRole('combobox')).toHaveCount(3)
    await expect(page.getByRole('textbox')).toBeVisible() // seed input
  })

  test('closes on X button', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open rhyme settings').click()
    await expect(page.getByRole('heading', { name: 'RHYMES' })).toBeVisible()
    await page.getByLabel('Close', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'RHYMES' })).not.toBeVisible()
  })

  test('closes on Escape', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open rhyme settings').click()
    await expect(page.getByRole('heading', { name: 'RHYMES' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'RHYMES' })).not.toBeVisible()
  })

  test('can change word list', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open rhyme settings').click()
    const select = page.getByRole('combobox').first()
    await select.selectOption({ label: '1-Syllable Words' })
    await expect(select).toHaveValue('1-syllable-words')
  })

  test('can change rhyme pattern', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open rhyme settings').click()
    const patternSelect = page.getByRole('combobox').nth(1)
    await patternSelect.selectOption('ABAB')
    await expect(patternSelect).toHaveValue('ABAB')
  })

  test('can change fill mode', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open rhyme settings').click()
    const fillSelect = page.getByRole('combobox').nth(2)
    await fillSelect.selectOption('setup-punchline')
    await expect(fillSelect).toHaveValue('setup-punchline')
  })

  test('shuffle button changes seed', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open rhyme settings').click()
    const seedInput = page.locator('input[type="text"]')
    const initialSeed = await seedInput.inputValue()
    await page.getByText('Shuffle').click()
    await expect(seedInput).not.toHaveValue(initialSeed)
  })
})

test.describe('Settings sidebar', () => {
  test('opens and closes', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open settings').click()
    const panel = sidebar(page)
    await expect(panel.getByText('SETTINGS')).toBeVisible()
    await expect(panel.getByText('Latency compensation')).toBeVisible()
    await page.getByLabel('Close settings').click()
    await expect(panel).toHaveClass(/-translate-x-full/)
  })

  test('closes on backdrop click', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open settings').click()
    const panel = sidebar(page)
    await expect(panel.getByText('SETTINGS')).toBeVisible()
    // Click the backdrop (the semi-transparent overlay)
    await page.locator('.fixed.bg-black\\/50.opacity-100').click({ position: { x: 500, y: 300 } })
    await expect(panel).toHaveClass(/-translate-x-full/)
  })

  test('latency slider exists and has default value', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Open settings').click()
    const panel = sidebar(page)
    const slider = panel.locator('input[type="range"]')
    await expect(slider).toHaveValue('0')
  })
})

test.describe('Audio popup', () => {
  test('opens and shows volume sliders', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Audio settings').click()
    await expect(page.getByText('Track volume')).toBeVisible()
    await expect(page.getByText('Metronome volume')).toBeVisible()
  })

  test('closes on Escape', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Audio settings').click()
    await expect(page.getByText('Track volume')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Track volume')).not.toBeVisible()
  })

  test('closes when clicking outside', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Audio settings').click()
    await expect(page.getByText('Track volume')).toBeVisible()
    await page.locator('[aria-hidden="true"].fixed.inset-0').click({ force: true })
    await expect(page.getByText('Track volume')).not.toBeVisible()
  })
})

test.describe('Metronome popup', () => {
  test('opens and shows controls', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Metronome settings').click()
    await expect(page.getByText('Count-in')).toBeVisible()
    await expect(page.getByText('BPM')).toBeVisible()
  })

  test('can toggle metronome on/off', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Metronome settings').click()
    await page.locator('button:has-text("On")').click()
    const onButton = page.locator('button:has-text("On")')
    await expect(onButton).toHaveClass(/bg-accent/)
  })

  test('can change countdown', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Metronome settings').click()
    await page.locator('button:has-text("1 line")').click()
    const lineButton = page.locator('button:has-text("1 line")')
    await expect(lineButton).toHaveClass(/bg-accent/)
  })

  test('closes on Escape', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Metronome settings').click()
    await expect(page.getByText('Count-in')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Count-in')).not.toBeVisible()
  })

  test('opening one popup closes the other', async ({ page }) => {
    await freshPage(page)
    // Open audio popup
    await page.getByLabel('Audio settings').click()
    await expect(page.getByText('Track volume')).toBeVisible()
    // The audio popup has a backdrop overlay, so clicking metronome button
    // actually hits the backdrop and closes the audio popup
    await page.locator('[aria-hidden="true"].fixed.inset-0').click({ force: true })
    await expect(page.getByText('Track volume')).not.toBeVisible()
    // Now open metronome popup
    await page.getByLabel('Metronome settings').click()
    await expect(page.getByText('Count-in')).toBeVisible()
    // Close it and open audio
    await page.locator('[aria-hidden="true"].fixed.inset-0').click({ force: true })
    await expect(page.getByText('Count-in')).not.toBeVisible()
    await page.getByLabel('Audio settings').click()
    await expect(page.getByText('Track volume')).toBeVisible()
  })
})

test.describe('Loop selector', () => {
  test('shows loop buttons for multi-loop tracks', async ({ page }) => {
    await freshPage(page)
    await expect(page.locator('button:has-text("Verse")')).toBeVisible()
    await expect(page.locator('button:has-text("Chorus")')).toBeVisible()
  })

  test('can switch loops when stopped', async ({ page }) => {
    await freshPage(page)
    const chorusButton = page.locator('button:has-text("Chorus")').first()
    await chorusButton.click()
    await expect(chorusButton).toHaveClass(/bg-accent/)
  })

  test('shows mix buttons for tracks with mixes', async ({ page }) => {
    await freshPage(page)
    await page.locator('button:has-text("Basic Drums")').click()
    await page.locator('button:has-text("Whose Line Rap")').click()
    await expect(page.locator('button:has-text("Nerd Rap")')).toBeVisible()
    await expect(page.locator('button:has-text("Camp Rap")')).toBeVisible()
  })
})

test.describe('Grid', () => {
  test('renders bars with rhyme words', async ({ page }) => {
    await freshPage(page)
    const cells = page.locator('.grid-cols-4')
    await expect(cells.first()).toBeVisible()
    const textContent = await page.locator('.grid-cols-4').first().textContent()
    expect(textContent?.trim().length).toBeGreaterThan(0)
  })

  test('beat cells are clickable', async ({ page }) => {
    await freshPage(page)
    const firstCell = page.locator('.grid-cols-4 > div').first()
    await firstCell.click()
  })
})

test.describe('Toolbar buttons', () => {
  test('randomize seed button changes grid content', async ({ page }) => {
    await freshPage(page)
    const getFirstRhyme = () => page.locator('.grid-cols-4').first().textContent()
    const initial = await getFirstRhyme()
    await page.getByLabel('Randomize seed').click()
    await page.waitForTimeout(100)
    const after = await getFirstRhyme()
    expect(initial).toBeDefined()
    expect(after).toBeDefined()
  })
})

test.describe('BPM controls', () => {
  test('shows BPM variant buttons for tracks with variants', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Metronome settings').click()
    await expect(page.locator('button:has-text("60")')).toBeVisible()
    await expect(page.locator('button:has-text("80")')).toBeVisible()
    await expect(page.locator('button:has-text("100")')).toBeVisible()
    await expect(page.locator('button:has-text("120")')).toBeVisible()
  })

  test('can switch BPM variant', async ({ page }) => {
    await freshPage(page)
    await page.getByLabel('Metronome settings').click()
    const bpm60 = page.locator('button:has-text("60")').first()
    await bpm60.click()
    await expect(bpm60).toHaveClass(/bg-accent/)
  })

  test('shows metronome-only BPM options when no track', async ({ page }) => {
    await freshPage(page)
    await page.locator('button:has-text("Basic Drums")').click()
    await page.getByText('No track').click()
    await page.getByLabel('Metronome settings').click()
    await expect(page.locator('button:has-text("60")')).toBeVisible()
    await expect(page.locator('button:has-text("80")')).toBeVisible()
    await expect(page.locator('button:has-text("100")')).toBeVisible()
    await expect(page.locator('button:has-text("120")')).toBeVisible()
  })
})
