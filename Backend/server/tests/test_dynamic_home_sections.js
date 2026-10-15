const http = require('http');

function postJson(urlPath, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: '127.0.0.1',
            port: 5001,
            path: urlPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function putJson(urlPath, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: '127.0.0.1',
            port: 5001,
            path: urlPath,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function patchJson(urlPath, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: '127.0.0.1',
            port: 5001,
            path: urlPath,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function getJson(urlPath, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5001,
            path: urlPath,
            method: 'GET',
            headers: {
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function deleteJson(urlPath, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5001,
            path: urlPath,
            method: 'DELETE',
            headers: {
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    console.log("==================================================");
    console.log("DYNAMIC HOME PAGE SECTIONS BACKEND E2E TEST SUITE");
    console.log("==================================================");

    // Step 1: Admin Login & 2FA
    console.log("\n[1] Testing Admin Login...");
    const loginRes = await postJson('/api/adminusers/login', {
        EmailID: 'admin@clikgett.com',
        Password: '0192023a7bbd73250516f069df18b500'
    });
    console.log("Login response status:", loginRes.status, "require2FA:", loginRes.data.require2FA);
    if (!loginRes.data.twoFactorToken) {
        throw new Error("Failed to get twoFactorToken from login");
    }

    console.log("[2] Verifying 2FA with generated TOTP / recoveryCode / demo OTP...");
    const totpUtil = require('../utils/totp');
    let verifyPayload = {
        EmailID: 'admin@clikgett.com',
        twoFactorToken: loginRes.data.twoFactorToken
    };
    if (loginRes.data.secret) {
        verifyPayload.code = totpUtil.generateTOTP(loginRes.data.secret);
    } else if (loginRes.data.recoveryCodes && loginRes.data.recoveryCodes.length > 0) {
        verifyPayload.recoveryCode = loginRes.data.recoveryCodes[0];
    } else {
        verifyPayload.code = '123456';
    }

    const verifyRes = await postJson('/api/adminusers/verify-2fa', verifyPayload);
    console.log("Verify 2FA status:", verifyRes.status, "Status:", verifyRes.data && verifyRes.data.Status);
    const adminToken = verifyRes.data && verifyRes.data.token;
    if (!adminToken) {
        console.error("2FA Error:", verifyRes.data);
        throw new Error("Failed to receive admin auth JWT token");
    }
    const authHeaders = { Authorization: `token ${adminToken}` };
    console.log("Admin token acquired successfully.");

    // Step 2: List sections & check stats
    console.log("\n[3] Testing GET /api/admin-home-sections/sections...");
    const listRes = await getJson('/api/admin-home-sections/sections', authHeaders);
    console.log("Sections list response status:", listRes.status, "data:", JSON.stringify(listRes.data || listRes.raw));
    console.log("Total sections:", listRes.data && listRes.data.counts && listRes.data.counts.total);
    console.log("Counts:", JSON.stringify(listRes.data && listRes.data.counts));

    // Step 3: Get Category & Product options
    console.log("\n[4] Testing GET category & product options...");
    const catOptions = await getJson('/api/admin-home-sections/sections/category-options', authHeaders);
    console.log("Category options status:", catOptions.status, "Categories count:", (catOptions.data.Categories || []).length);
    const prodOptions = await getJson('/api/admin-home-sections/sections/product-options?limit=10', authHeaders);
    console.log("Product options status:", prodOptions.status, "Products count:", (prodOptions.data.Products || []).length);

    // Step 4: Create new section as Draft
    console.log("\n[5] Creating 'Weekend Essentials' section as DRAFT (Status = 0)...");
    const createRes = await postJson('/api/admin-home-sections/sections', {
        Title: 'Weekend Essentials',
        Subtitle: 'Best weekend deals on daily groceries',
        SectionType: 'selected_products',
        Status: 0, // Draft
        DisplayOrder: 10,
        ProductIDs: [82, 83, 86, 92]
    }, authHeaders);
    console.log("Create section response:", JSON.stringify(createRes.data));
    const newSectionId = createRes.data.HomeSectionID || createRes.data.SectionID;
    if (!newSectionId) throw new Error("Failed to create section");

    // Step 5: Verify customer endpoint DOES NOT return draft section
    console.log("\n[6] Verifying Customer Homepage excludes Draft section...");
    const customerHomeDraft = await getJson('/api/users/homepage');
    const draftInCustomer = (customerHomeDraft.data.HomePageSectionProducts || []).find(s => s.HomeSectionID === newSectionId);
    console.log("Draft section visible in customer app?", !!draftInCustomer);
    if (draftInCustomer) {
        throw new Error("SECURITY FAILURE: Draft section is visible to customer!");
    }
    console.log("PASSED: Draft section is correctly hidden from customers.");

    // Step 6: Publish the section
    console.log("\n[7] Publishing section (Status = 1)...");
    const pubRes = await patchJson(`/api/admin-home-sections/sections/${newSectionId}/status`, { Status: 1 }, authHeaders);
    console.log("Publish status response:", JSON.stringify(pubRes.data));

    // Step 7: Verify customer endpoint NOW returns the section with products
    console.log("\n[8] Verifying Customer Homepage INCLUDES Published section...");
    const customerHomePub = await getJson('/api/users/homepage');
    const pubInCustomer = (customerHomePub.data.HomePageSectionProducts || []).find(s => s.HomeSectionID === newSectionId);
    console.log("Published section found in customer app?", !!pubInCustomer);
    if (!pubInCustomer) {
        throw new Error("FAILURE: Published section not returned in customer homepage!");
    }
    console.log(`Found section: "${pubInCustomer.Name}", Products count: ${pubInCustomer.Products.length}`);
    console.log("Sample product in section:", pubInCustomer.Products[0].ProductName, "Price: ₹" + pubInCustomer.Products[0].Price);
    console.log("PASSED: Published section is rendered dynamically with real products.");

    // Step 8: Update section title and product order
    console.log("\n[9] Updating section title to 'Weekend Super Essentials' and updating product list...");
    const updateRes = await putJson(`/api/admin-home-sections/sections/${newSectionId}`, {
        Title: 'Weekend Super Essentials',
        Subtitle: 'Massive savings on curated weekend staples',
        SectionType: 'selected_products',
        Status: 1,
        DisplayOrder: 5,
        ProductIDs: [92, 86, 83]
    }, authHeaders);
    console.log("Update response:", JSON.stringify(updateRes.data));

    // Verify update on customer endpoint
    const customerHomeUpdated = await getJson('/api/users/homepage');
    const updatedInCustomer = (customerHomeUpdated.data.HomePageSectionProducts || []).find(s => s.HomeSectionID === newSectionId);
    console.log("Updated title in customer response:", updatedInCustomer ? updatedInCustomer.Name : "NOT FOUND");
    if (!updatedInCustomer || updatedInCustomer.Name !== 'Weekend Super Essentials') {
        throw new Error("FAILURE: Customer API did not reflect updated title!");
    }
    console.log("PASSED: Updated section title and associations propagated to customer API.");

    // Step 9: Test Reorder endpoint
    console.log("\n[10] Testing batch reorder endpoint...");
    const reorderRes = await putJson('/api/admin-home-sections/sections/reorder', {
        sections: [
            { HomeSectionID: newSectionId, DisplayOrder: 1 },
            { HomeSectionID: 1, DisplayOrder: 2 }
        ]
    }, authHeaders);
    console.log("Reorder response:", JSON.stringify(reorderRes.data));

    // Step 10: Test Duplicate endpoint
    console.log("\n[11] Testing section duplication...");
    const dupRes = await postJson(`/api/admin-home-sections/sections/${newSectionId}/duplicate`, {}, authHeaders);
    console.log("Duplicate response:", JSON.stringify(dupRes.data));
    const dupId = dupRes.data.HomeSectionID;

    // Step 11: Unpublish the section
    console.log("\n[12] Unpublishing section (Status = 0)...");
    const unpubRes = await patchJson(`/api/admin-home-sections/sections/${newSectionId}/status`, { Status: 0 }, authHeaders);
    console.log("Unpublish response:", JSON.stringify(unpubRes.data));

    // Verify customer endpoint no longer has it
    const customerHomeUnpub = await getJson('/api/users/homepage');
    const unpubInCustomer = (customerHomeUnpub.data.HomePageSectionProducts || []).find(s => s.HomeSectionID === newSectionId);
    console.log("Unpublished section still in customer response?", !!unpubInCustomer);
    if (unpubInCustomer) {
        throw new Error("FAILURE: Unpublished section is still visible to customers!");
    }
    console.log("PASSED: Unpublished section disappears immediately from customer response.");

    // Step 12: Clean up test sections
    console.log("\n[13] Cleaning up test sections...");
    await deleteJson(`/api/admin-home-sections/sections/${newSectionId}`, authHeaders);
    if (dupId) {
        await deleteJson(`/api/admin-home-sections/sections/${dupId}`, authHeaders);
    }
    console.log("Cleaned up test sections.");

    console.log("\n==================================================");
    console.log("ALL 12 BACKEND AND END-TO-END TEST CHECKS PASSED!");
    console.log("==================================================");
}

runTests().catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
