/**
 * Test Script: Direct API Call to Backend
 *
 * Usage:
 * 1. Get your access token from localStorage in browser console
 * 2. Replace TOKEN_HERE with your actual token
 * 3. Run: node test-direct-api.js
 */

import { $fetch } from 'ofetch';

const API_BASE_URL = 'https://apigwsand.telkomsigma.co.id/essbe';
const ACCESS_TOKEN = 'YOUR_TOKEN_HERE'; // Replace with actual token from browser localStorage

async function testEndpoints() {
  console.log('=== Testing Backend API Endpoints ===\n');

  const endpoints = [
    '/employee/change-request?page=1&limit=50',
    '/employee/change-request/?page=1&limit=50',  // With trailing slash
    '/employee/change-request',                    // Without query params
    '/employee/change-request/',                   // With trailing slash, no query
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint}`);
    console.log(`Full URL: ${API_BASE_URL}${endpoint}`);

    try {
      const response = await $fetch(endpoint, {
        method: 'GET',
        baseURL: API_BASE_URL,
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Accept': 'application/json',
        },
        timeout: 10000,
        ignoreResponseError: true,
      });

      console.log('✅ SUCCESS');
      console.log('Response type:', typeof response);
      console.log('Response preview:', JSON.stringify(response).substring(0, 200));

    } catch (error) {
      console.log('❌ ERROR');
      console.log('Status:', error.status || error.statusCode);
      console.log('Message:', error.message);
      console.log('Data:', error.data);
    }
  }
}

// Check if token is provided
if (ACCESS_TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ ERROR: Please replace YOUR_TOKEN_HERE with actual token from localStorage');
  console.log('\nHow to get token:');
  console.log('1. Open browser console');
  console.log('2. Run: localStorage.getItem("access_token")');
  console.log('3. Copy the token');
  console.log('4. Replace YOUR_TOKEN_HERE in this file');
  process.exit(1);
}

testEndpoints().catch(console.error);
