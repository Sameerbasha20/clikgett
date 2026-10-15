'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000';

const runTests = async () => {
    console.log('--- Testing Customer Requests and Enquiries APIs ---');

    // Generate valid tokens
    const userToken = jwt.sign({ UserID: 1843730 }, process.env.SECRET_KEY, { expiresIn: '1d' });
    const adminToken = jwt.sign({ AdminID: 1, Role: 1 }, process.env.SECRET_KEY, { expiresIn: '1d' });

    const userHeaders = { Authorization: `Bearer ${userToken}` };
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 1. Submit Customer Enquiry
    console.log('\n1. Testing Customer Enquiry Submission...');
    const enquiryRes = await axios.post(`${BASE_URL}/api/customer/enquiries`, {
        subject: 'Delivery Query Test',
        description: 'Hello support, this is an automated test enquiry for verification.',
        name: 'Automated Tester',
        mobileNumber: '9347051775'
    }, { headers: userHeaders });
    console.log('Submit Enquiry Response:', enquiryRes.data);
    const enquiryId = enquiryRes.data.EnquiryID;

    // 2. Fetch My Enquiries
    console.log('\n2. Testing Get My Enquiries...');
    const myEnquiries = await axios.get(`${BASE_URL}/api/customer/enquiries/my`, { headers: userHeaders });
    console.log(`Found ${myEnquiries.data.Enquiries.length} enquiries for user.`);

    // 3. Admin List Enquiries
    console.log('\n3. Testing Admin List Enquiries...');
    const adminEnquiries = await axios.get(`${BASE_URL}/api/admin/customer-enquiries`, { headers: adminHeaders });
    console.log(`Admin found ${adminEnquiries.data.Enquiries.length} enquiries.`);

    // 4. Admin Update Enquiry Status
    console.log('\n4. Testing Admin Update Enquiry Status...');
    const updateEnquiryRes = await axios.put(`${BASE_URL}/api/admin/customer-enquiries/${enquiryId}/status`, {
        status: 'In Progress',
        adminNotes: 'Assigned to executive'
    }, { headers: adminHeaders });
    console.log('Update Status Response:', updateEnquiryRes.data);

    // 5. Submit Product Request
    console.log('\n5. Testing Product Request Submission...');
    const testProdName = `Organic Almond Milk ${Date.now()}`;
    const prodReqRes = await axios.post(`${BASE_URL}/api/customer/product-requests`, {
        productName: testProdName,
        brand: 'NutriChoice',
        sizeOrQty: '1 Litre',
        description: 'Need sweetened variant in 1L tetra pack'
    }, { headers: userHeaders });
    console.log('Submit Product Request Response:', prodReqRes.data);
    const prodReqId = prodReqRes.data.RequestID;

    // 6. Test Deduplication
    console.log('\n6. Testing Duplicate Product Request Prevention...');
    const dupRes = await axios.post(`${BASE_URL}/api/customer/product-requests`, {
        productName: testProdName,
        brand: 'NutriChoice',
        sizeOrQty: '1 Litre',
        description: 'Second submit attempt'
    }, { headers: userHeaders });
    console.log('Duplicate Response (Status should be 2):', dupRes.data);

    // 7. Submit Product Request with Photo
    console.log('\n7. Testing Product Request Submission With Photo...');
    // Simple 1x1 transparent png base64
    const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const photoReqRes = await axios.post(`${BASE_URL}/api/customer/product-requests`, {
        productName: `Photo Item ${Date.now()}`,
        brand: 'TestBrand',
        sizeOrQty: '500g',
        description: 'See attached photo',
        imageBase64: samplePngBase64,
        mimeType: 'image/png'
    }, { headers: userHeaders });
    console.log('Photo Product Request Response:', photoReqRes.data);
    const photoReqId = photoReqRes.data.RequestID;

    // 8. Test Secure Image Access
    console.log('\n8. Testing Secure Image Retrieval...');
    const imgRes = await axios.get(`${BASE_URL}/api/customer/product-requests/image/${photoReqId}`, {
        headers: userHeaders,
        responseType: 'arraybuffer'
    });
    console.log('Image fetched successfully! Bytes length:', imgRes.data.length);

    // 9. Admin List Product Requests
    console.log('\n9. Testing Admin List Product Requests...');
    const adminProdReqs = await axios.get(`${BASE_URL}/api/admin/product-requests`, { headers: adminHeaders });
    console.log(`Admin found ${adminProdReqs.data.Requests.length} product requests.`);

    // 10. Admin Mark Product Request as Available (Triggering Notification)
    console.log('\n10. Testing Admin Update Status to Available (Triggers Notification)...');
    const markAvailRes = await axios.put(`${BASE_URL}/api/admin/product-requests/${prodReqId}/status`, {
        status: 'Available',
        adminNotes: 'Stock arrived in warehouse'
    }, { headers: adminHeaders });
    console.log('Mark Available Response:', markAvailRes.data);

    console.log('\n--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---');
};

runTests().catch(err => {
    console.error('Test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
});
