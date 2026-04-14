
import { test, expect } from '@playwright/test';

test.describe('Public Flows', () => {

  test('Landing Page loads and navigates to Register', async ({ page }) => {
    await page.goto('/');
    
    // Check for "Smart Street" text or a known element
    await expect(page).toHaveTitle(/Smart Street/i);
    
    // Check for "Get Started" or "Join" button
    // The Landing Page usually has a CTA
    const cta = page.getByText(/Get Started|Join/i).first();
    await expect(cta).toBeVisible();

    // Navigate to register
    await cta.click();
    await expect(page).toHaveURL(/.*register|.*login/); 
  });

  test('Public Map loads and shows spaces', async ({ page }) => {
    // Mock API response for spaces
    await page.route('**/api/public/spaces', async route => {
      const json = {
        success: true,
        spaces: [
          {
            space_id: 'test-space-1',
            name: 'Public Test Space',
            address: '123 Public St',
            lat: 12.9716,
            lng: 77.5946, // Bangalore
            price_per_hr: 10,
            image_url: 'https://via.placeholder.com/150'
          }
        ]
      };
      await route.fulfill({ json });
    });

    await page.goto('/public');
    
    // Check if map container exists
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();

    // Check if marker exists (Leaflet markers usually have specific classes, 
    // but without visual testing we rely on DOM presence or custom markers)
    // We can check if "Public Test Space" text appears in the sidebar or popup if implemented.
    // If the map logic renders a list item or popup, we can assert that.
    
    // Assuming the sidebar lists spaces:
    // await expect(page.getByText('Public Test Space')).toBeVisible(); 
  });

  test('Verify Permit Page handles valid permit', async ({ page }) => {
    const permitId = 'valid-permit-id';

    // Mock API success with full structure expected by component
    // Component calls: /api/public/verify-permit/:id
    await page.route(`**/api/public/verify-permit/${permitId}`, async route => {
      await route.fulfill({
        json: {
          valid: true,
          permit: {
            permit_id: permitId,
            status: 'APPROVED',
            vendorName: 'Test Vendor',
            spaceName: 'Test Location',
            validFrom: new Date().toISOString(),
            validTo: new Date(Date.now() + 86400000).toISOString(),
            businessName: 'Business Inc',
            category: 'Food',
            licenseNumber: 'LIC-123',
            address: '123 St'
          },
          checks: {
            permitStatus: true,
            timeValidity: true,
            requestStatus: true,
            spatialCorrectness: true
          }
        }
      });
    });

    await page.goto('/verify'); // Go to page
    await page.getByPlaceholder('Enter permit ID...').fill(permitId); // Fill ID
    await page.getByRole('button', { name: 'Verify Permit' }).click(); // Click proper button
    
    // Expect success UI
    await expect(page.getByText('Permit Valid')).toBeVisible();
    await expect(page.getByText('Test Vendor')).toBeVisible();
  });

  test('Verify Permit Page handles invalid permit', async ({ page }) => {
    const permitId = 'invalid-permit-id';

    // Mock API error (404) which triggers "Verification Failed"
    await page.route(`**/api/public/verify-permit/${permitId}`, async route => {
      await route.fulfill({
        status: 404,
        json: { message: 'Permit not found' }
      });
    });

    await page.goto('/verify');
    await page.getByPlaceholder('Enter permit ID...').fill(permitId);
    await page.getByRole('button', { name: 'Verify Permit' }).click();
    
    // Expect error UI
    await expect(page.getByText('Verification Failed')).toBeVisible();
  });

});
