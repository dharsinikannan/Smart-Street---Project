import { test, expect } from '@playwright/test';

// Generate dynamic timestamp for unique data
const timestamp = Date.now();
const ownerEmail = `owner${timestamp}@test.com`;
const vendorEmail = `vendor${timestamp}@test.com`;
const adminEmail = `admin@smartstreet.com`;

test.describe('Smart Street Golden Path', () => {

  // --- USER REGISTRATION FLOW ---
  test('User Registration Flow', async ({ page }) => {
    // Mock Auth (Login/Register)
    await page.route('**/api/auth/register', async route => {
        const data = JSON.parse(route.request().postData());
        await route.fulfill({ 
            status: 201, 
            contentType: 'application/json', 
            body: JSON.stringify({ token: 'mock-reg-token', user: { role: data.role, name: data.name } }) 
        });
    });
    // Critical: Mock notifications to prevent 401 -> Logout
    await page.route('**/api/notifications', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [], unreadCount: 0 }) });
    });
    // Mock dashboard endpoints to prevents 401s on redirect
    await page.route('**/api/owner/spaces', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ spaces: [] }) }) });
    await page.route('**/api/vendor/spaces', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ spaces: [] }) }) });
    await page.route('**/api/admin/requests', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ requests: [] }) }) });
    await page.route('**/api/admin/stats', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ active_vendors: 0, total_revenue: 0, pending_requests: 0 }) }) });

    // 1. Register Owner
    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill('Test Owner');
    await page.getByPlaceholder('john@example.com').fill(ownerEmail);
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByPlaceholder('+1 234 567 890').fill('1234567890');
    
    // Select Owner Role
    await page.getByRole('button', { name: 'Owner' }).click();
    
    // Fill Owner specific fields (Required for form submission)
    await page.getByPlaceholder('City Council / Pvt Ltd').fill('Test Owner Entity');
    await page.getByPlaceholder('Public helpline or email').fill('contact@owner.com');

    await page.getByRole('button', { name: 'Complete Registration' }).click();
    
    // Expect redirect to dashboard
    await expect(page).toHaveURL('/owner');

    // 2. Register Vendor
    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill('Test Vendor');
    await page.getByPlaceholder('john@example.com').fill(vendorEmail);
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByPlaceholder('+1 234 567 890').fill('1234567890');

    // Select Vendor Role
    await page.getByRole('button', { name: 'Vendor' }).click();

    // Vendor specific fields
    await page.getByPlaceholder("John's Food Truck").fill('Test Truck');
    await page.getByPlaceholder('Food & Beverage').fill('Food');
    await page.getByPlaceholder('LIC-12345678').fill('LIC-TEST');

    await page.getByRole('button', { name: 'Complete Registration' }).click();
    await expect(page).toHaveURL('/vendor');
    
    // 3. Register Admin
    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill('Test Admin');
    await page.getByPlaceholder('john@example.com').fill(adminEmail);
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByPlaceholder('+1 234 567 890').fill('1234567890');

    await page.getByRole('button', { name: 'Admin' }).click();
    
    // Admin Code
    await page.getByPlaceholder('Enter secure registration code').fill('ADMIN123'); 
    await page.getByRole('button', { name: 'Complete Registration' }).click();
    
    await expect(page).toHaveURL('/admin'); 
  });

  // --- BUSINESS LOGIC FLOW ---
  test('Golden Path Execution', async ({ browser }) => {
    
    // --- STEP 1: OWNER CREATES SPACE ---
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();

    // Mock Owner API
    await ownerPage.route('**/api/auth/login', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'mock-token', user: { id: 1, name: 'Owner', role: 'OWNER' } }) });
    });
    await ownerPage.route('**/api/notifications', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [], unreadCount: 0 }) });
    });
    // Respond to GET /owner/spaces and POST /owner/spaces
    await ownerPage.route('**/api/owner/spaces', async route => {
        if (route.request().method() === 'POST') {
             await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'Space created successfully' }) });
        } else {
             await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ spaces: [] }) });
        }
    });

    await ownerPage.goto('/login');
    await ownerPage.getByPlaceholder('name@example.com').fill(ownerEmail);
    await ownerPage.getByPlaceholder('••••••••').fill('password123');
    await ownerPage.getByRole('button', { name: 'Sign In' }).click();
    await expect(ownerPage).toHaveURL('/owner');

    // Create Space
    // 1. Switch to "Create New" tab in sidebar
    await ownerPage.click('button:has-text("Create New")');
    
    // 2. Click on map to set pin
    await ownerPage.locator('.leaflet-container').click({ position: { x: 400, y: 300 } }); 
    
    // 3. Fill form
    await ownerPage.fill('input[placeholder="e.g. Central Park Lot"]', `Space ${timestamp}`);
    await ownerPage.fill('input[placeholder="Street address"]', '123 Test St');
    await ownerPage.fill('input[placeholder="Radius (m)"]', '50');
    
    await ownerPage.click('button:has-text("Create Space")');
    await expect(ownerPage.locator('text=Space created successfully')).toBeVisible();
    await ownerPage.close();


    // --- STEP 2: VENDOR BOOKS SPACE ---
    const vendorContext = await browser.newContext();
    const vendorPage = await vendorContext.newPage();
    
    // Debug Logging
    vendorPage.on('console', msg => console.log(`VENDOR LOG: ${msg.text()}`));
    vendorPage.on('pageerror', err => console.log(`VENDOR ERROR: ${err}`));
    vendorPage.on('requestfailed', req => console.log(`VENDOR REQ FAILED: ${req.url()} ${req.failure().errorText}`));
    vendorPage.on('response', res => console.log(`VENDOR RES: ${res.status()} ${res.url()}`));
    
    // Mock Vendor API
    await vendorPage.route('**/api/auth/login', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'mock-token', user: { id: 2, name: 'Vendor', role: 'VENDOR' } }) });
    });
    // Critical: Notifications
    await vendorPage.route('**/api/notifications', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [], unreadCount: 0 }) });
    });
    
    // Mock Active Mock Spaces
    // Match strict path
    await vendorPage.route('**/api/vendor/spaces', async route => {
        await route.fulfill({ 
            status: 200, 
            contentType: 'application/json', 
            body: JSON.stringify({ 
                spaces: [{ 
                    space_id: 100, 
                    space_name: `Space ${timestamp}`, 
                    // Update Coords to match default map center [11.3410, 77.7172]
                    lat: 11.3410, 
                    lng: 77.7172, 
                    allowed_radius: 50, 
                    owner_id: 1, 
                    address: '123 Mock St' 
                }] 
            }) 
        });
    });

    // Mock Booking Submission & Requests List
    await vendorPage.route('**/api/vendor/requests', async route => {
        if (route.request().method() === 'POST') {
             await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'Request submitted successfully' }) });
        } else {
             // GET
             await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ requests: [] }) });
        }
    });

    // Mock other vendor calls to prevent 401 logout
    await vendorPage.route('**/api/**/permits', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ permits: [] }) }) });
    await vendorPage.route('**/api/analytics', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ stats: [] }) }) });
    await vendorPage.route('**/api/vendor/analytics', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ stats: [] }) }) });
    
    
    await vendorPage.goto('/login');
    await vendorPage.getByPlaceholder('name@example.com').fill(vendorEmail);
    await vendorPage.getByPlaceholder('••••••••').fill('password123');
    await vendorPage.getByRole('button', { name: 'Sign In' }).click();
    await expect(vendorPage).toHaveURL('/vendor');

    // 1. Select "Owner Location" intent
    await vendorPage.click('button:has-text("Owner Location")');
    
    // 2. Select Space from Dropdown
    // Mock space has id 100. Dropdown is populated.
    await vendorPage.selectOption('select', { label: `Space ${timestamp}` });
    
    // 3. Set Time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    await vendorPage.locator('input[type="datetime-local"]').nth(0).fill(`${dateStr}T10:00`);
    await vendorPage.locator('input[type="datetime-local"]').nth(1).fill(`${dateStr}T12:00`);
    
    // 3. Submit
    await vendorPage.getByRole('button', { name: 'Submit request' }).click();
    await expect(vendorPage.locator('text=Request submitted successfully')).toBeVisible();
    await vendorPage.close();


    // --- STEP 3: ADMIN APPROVES ---
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Mock Admin API
    await adminPage.route('**/api/auth/login', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'mock-token', user: { id: 3, name: 'Admin', role: 'ADMIN' } }) });
    });
    await adminPage.route('**/api/notifications', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [], unreadCount: 0 }) });
    });
    
    // Mock Requests List
    await adminPage.route('**/api/admin/requests*', async route => {
        if(route.request().method() === 'GET') {
             await route.fulfill({ 
                status: 200, 
                contentType: 'application/json', 
                body: JSON.stringify({ 
                    requests: [{ 
                        request_id: "REQ-500", 
                        status: 'PENDING', 
                        space_name: `Space ${timestamp}`, 
                        vendor_name: 'Test Vendor', 
                        business_name: 'Test Truck',
                        lat: 51.505,
                        lng: -0.09,
                        max_width: 5,
                        max_length: 5,
                        submitted_at: new Date().toISOString(),
                        start_time: new Date().toISOString(), 
                        end_time: new Date().toISOString() 
                    }]
                }) 
            });
        } else {
            route.continue();
        }
    });

    // Mock Stats
     await adminPage.route('**/api/admin/stats', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active_vendors: 10, total_revenue: 5000, pending_requests: 1 }) });
    });
    // Mock Other Admin Calls
    await adminPage.route('**/api/admin/vendors', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ vendors: [] }) }) });
    await adminPage.route('**/api/admin/owners', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ owners: [] }) }) });
    await adminPage.route('**/api/admin/permits', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ permits: [] }) }) });
    await adminPage.route('**/api/admin/audit-logs', async route => { await route.fulfill({ status: 200, body: JSON.stringify({ logs: [] }) }) });

    // Mock Approval Action
    await adminPage.route('**/api/admin/requests/*/approve', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Request approved and permit issued' }) });
    });


    await adminPage.goto('/login');
    await adminPage.getByPlaceholder('name@example.com').fill(adminEmail);
    await adminPage.getByPlaceholder('••••••••').fill(defaultPass);
    await adminPage.getByRole('button', { name: 'Sign In' }).click();
    await expect(adminPage).toHaveURL('/admin');
    
    // Navigate to Map Tab
    await adminPage.getByRole('button', { name: 'Map & Requests' }).click();

    // 1. Select Pending Request
    // Wait for the specific request card in sidebar or map list
    await adminPage.waitForSelector('text=Space ' + timestamp);
    await adminPage.click('text=Space ' + timestamp); // Click the item in list
    
    // 2. Approve
    await adminPage.getByRole('button', { name: 'Approve + Issue Permit' }).click();
    
    // 3. Confirm Modal
    await adminPage.getByRole('button', { name: 'Approve & Issue' }).click();
    
    // 4. Verify Success
    await expect(adminPage.locator('text=Request approved and permit issued')).toBeVisible();
    await adminPage.close();
  });

});

const defaultPass = 'password123';
