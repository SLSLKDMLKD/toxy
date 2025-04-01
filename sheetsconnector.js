// Google Sheets API configuration
const API_KEY = 'YOUR_API_KEY'; // Replace with your Google API Key
const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your Google Client ID

// Discovery docs and scopes for Google Sheets API
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

// School information
const schoolLogo = "https://raw.githubusercontent.com/SLSLKDMLKD/hhj/refs/heads/main/images/Screenshot_2025-03-28_182234-removebg-preview.png"; // School logo path
const schoolName = "Pimburuwellegama College";

// Spreadsheet IDs for each grade and class
// Format: 'grade_class': 'spreadsheetId'
const SPREADSHEET_IDS = {
    // Grade 6
    '6_A': 'SPREADSHEET_ID_FOR_6A', // Replace with actual spreadsheet ID
    '6_B': 'SPREADSHEET_ID_FOR_6B',
    '6_C': 'SPREADSHEET_ID_FOR_6C',
    
    // Grade 7
    '7_A': 'SPREADSHEET_ID_FOR_7A',
    '7_B': 'SPREADSHEET_ID_FOR_7B',
    '7_C': 'SPREADSHEET_ID_FOR_7C',
    
    // Grade 8
    '8_A': 'SPREADSHEET_ID_FOR_8A',
    '8_B': 'SPREADSHEET_ID_FOR_8B',
    '8_C': 'SPREADSHEET_ID_FOR_8C',
    
    // Grade 9
    '9_A': 'SPREADSHEET_ID_FOR_9A',
    '9_B': 'SPREADSHEET_ID_FOR_9B',
    '9_C': 'SPREADSHEET_ID_FOR_9C',
    
    // Grade 10
    '10_A': 'SPREADSHEET_ID_FOR_10A',
    '10_B': 'SPREADSHEET_ID_FOR_10B',
    '10_C': 'SPREADSHEET_ID_FOR_10C',
    
    // Grade 11
    '11_A': 'SPREADSHEET_ID_FOR_11A',
    '11_B': 'SPREADSHEET_ID_FOR_11B',
    '11_C': 'SPREADSHEET_ID_FOR_11C',
    
    // Grade 12
    '12_A': 'SPREADSHEET_ID_FOR_12A',
    '12_B': 'SPREADSHEET_ID_FOR_12B',
    '12_C': 'SPREADSHEET_ID_FOR_12C',
    
    // Grade 13
    '13_A': 'SPREADSHEET_ID_FOR_13A',
    '13_B': 'SPREADSHEET_ID_FOR_13B',
    '13_C': 'SPREADSHEET_ID_FOR_13C'
};

// Range to fetch from each spreadsheet (A1 notation)
const RANGE = 'A1:Z1000'; // Adjust based on your data size

// DOM elements
const gradeSelect = document.getElementById('grade-select');
const classSelect = document.getElementById('class-select');
const resultsContainer = document.getElementById('results-container');
const updateTimeElement = document.getElementById('update-time');
const indexSearchInput = document.getElementById('student-index');
const searchButton = document.getElementById('search-button');
const clearSearchButton = document.getElementById('clear-search');
const printButton = document.getElementById('print-button');
const printButtonContainer = document.getElementById('print-button-container');

// Global variables to store data
let currentData = null;
let headers = null;
let fullDataset = null;

// Event listeners
document.addEventListener('DOMContentLoaded', initialize);
gradeSelect.addEventListener('change', handleGradeChange);
classSelect.addEventListener('change', applyFilters);
searchButton.addEventListener('click', applyFilters);
clearSearchButton.addEventListener('click', clearSearch);
printButton.addEventListener('click', printResults);

// Initialize the application
function initialize() {
    showLoading();
    
    // Load the Google API client
    gapi.load('client:auth2', initClient);
    
    // Populate grade dropdown
    populateGradeDropdown();
}

// Initialize Google API client
async function initClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        });
        
        // Listen for sign-in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        
        // Handle the initial sign-in state
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    } catch (error) {
        showError(`Error initializing Google API client: ${error.message}`);
    }
}

// Update UI based on sign-in status
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        // User is signed in, fetch data for the default selection
        const selectedGrade = gradeSelect.value;
        const selectedClass = classSelect.value;
        
        if (selectedGrade !== 'all' && selectedClass !== 'all') {
            fetchSheetData(selectedGrade, selectedClass);
        } else {
            showMessage('Please select a grade and class to view results.');
        }
    } else {
        // User is not signed in, show sign-in button
        showSignInButton();
    }
}

// Show sign-in button
function showSignInButton() {
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <p>Please sign in with your Google account to access student results.</p>
            <button id="sign-in-button" style="padding: 10px 20px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Sign In with Google
            </button>
        </div>
    `;
    
    document.getElementById('sign-in-button').addEventListener('click', () => {
        gapi.auth2.getAuthInstance().signIn();
    });
}

// Populate grade dropdown (6-13)
function populateGradeDropdown() {
    // Clear existing options except "All Grades"
    while (gradeSelect.options.length > 1) {
        gradeSelect.remove(1);
    }
    
    // Add grade options (6-13)
    for (let i = 6; i <= 13; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Grade ${i}`;
        gradeSelect.appendChild(option);
    }
}

// Handle grade change - update class dropdown
function handleGradeChange() {
    const selectedGrade = gradeSelect.value;
    
    // Clear class dropdown
    while (classSelect.options.length > 1) {
        classSelect.remove(1);
    }
    
    // If "All Grades" is selected, disable class selection
    if (selectedGrade === 'all') {
        classSelect.disabled = true;
        return;
    }
    
    // Enable class selection
    classSelect.disabled = false;
    
    // Add class options (A, B, C) for the selected grade
    const classes = ['A', 'B', 'C'];
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = `${className}`;
        classSelect.appendChild(option);
    });
    
    // If a specific class is already selected, try to fetch data
    if (classSelect.value !== 'all') {
        fetchSheetData(selectedGrade, classSelect.value);
    }
}

// Fetch data from Google Sheets
async function fetchSheetData(grade, className) {
    showLoading();
    
    try {
        // Check if user is signed in
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            showSignInButton();
            return;
        }
        
        // Get spreadsheet ID for the selected grade and class
        const spreadsheetId = SPREADSHEET_IDS[`${grade}_${className}`];
        
        if (!spreadsheetId) {
            showError(`No data available for Grade ${grade}${className}`);
            return;
        }
        
        // Fetch data from Google Sheets API
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: RANGE
        });
        
        // Process and display the data
        const values = response.result.values;
        
        if (!values || values.length === 0) {
            showError('No data found in the spreadsheet.');
            return;
        }
        
        // Store data globally
        headers = values[0];
        fullDataset = values.slice(1);
        
        // Display the results
        displayResults(values);
        
        // Update last updated time
        updateLastUpdatedTime();
    } catch (error) {
        showError(`Error fetching data: ${error.message}`);
    }
}

// Display results in the table
function displayResults(data) {
    if (!data || data.length < 2) {
        resultsContainer.innerHTML = '<p>No data available</p>';
        return;
    }
    
    // Extract headers and data rows
    const headers = data[0];
    const rows = data.slice(1);
    
    // Create table
    let tableHTML = '<table><thead><tr>';
    
    // Add headers
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    
    tableHTML += '</tr></thead><tbody>';
    
    // Add rows
    rows.forEach(row => {
        tableHTML += '<tr>';
        row.forEach(cell => {
            tableHTML += `<td>${cell || ''}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    
    resultsContainer.innerHTML = tableHTML;
    
    // Apply initial filter
    applyFilters();
}

// Apply all filters (student index)
function applyFilters() {
    const studentIndex = indexSearchInput.value.trim().toLowerCase();
    
    if (!fullDataset || !headers) return;
    
    // Find the index column
    let indexColumnIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
        const headerText = headers[i].toLowerCase();
        if (headerText.includes('index') || headerText.includes('id') || headerText.includes('number')) {
            indexColumnIndex = i;
            break;
        }
    }
    
    // Filter rows based on student index
    const tableRows = document.querySelectorAll('table tbody tr');
    let visibleCount = 0;
    
    tableRows.forEach((row, index) => {
        let showRow = true;
        
        // Apply student index filter if provided
        if (studentIndex && indexColumnIndex !== -1) {
            const indexCell = String(fullDataset[index][indexColumnIndex] || '').toLowerCase();
            if (!indexCell.includes(studentIndex)) {
                showRow = false;
            }
        }
        
        // Show or hide the row
        if (showRow) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show message if no results found
    if (visibleCount === 0 && studentIndex) {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.className = 'no-results';
        noResultsMessage.innerHTML = `<p>No results found for index "${studentIndex}".</p>`;
        resultsContainer.appendChild(noResultsMessage);
    }
    
    // Show print button if results are found and student index is provided
    if (visibleCount > 0 && studentIndex) {
        printButtonContainer.style.display = 'block';
    } else {
        printButtonContainer.style.display = 'none';
    }
}

// Clear search function
function clearSearch() {
    indexSearchInput.value = '';
    applyFilters();
}

// Print student results
function printResults() {
    const studentIndex = indexSearchInput.value.trim();
    if (!studentIndex || !fullDataset || !headers) return;
    
    // Find the index column
    let indexColumnIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
        const headerText = headers[i].toLowerCase();
        if (headerText.includes('index') || headerText.includes('id') || headerText.includes('number')) {
            indexColumnIndex = i;
            break;
        }
    }
    
    if (indexColumnIndex === -1) return;
    
    // Find the student row
    const studentRow = fullDataset.find(row => 
        String(row[indexColumnIndex] || '').toLowerCase().includes(studentIndex.toLowerCase())
    );
    
    if (!studentRow) return;
    
    // Create a printable page
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Exam Results - ${studentRow[indexColumnIndex]}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .logo { max-width: 150px; max-height: 150px; }
                .school-name { font-size: 24px; font-weight: bold; margin: 10px 0; }
                .result-card { border: 1px solid #ccc; padding: 20px; max-width: 800px; margin: 0 auto; }
                .student-info { margin-bottom: 20px; }
                .student-info p { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                @media print {
                    .no-print { display: none; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${schoolLogo}" alt="School Logo" class="logo">
                <div class="school-name">${schoolName} Examination Results</div>
                <div>Date: ${new Date().toLocaleDateString()}</div>
            </div>
            
            <div class="result-card">
                <div class="student-info">
    `);
    
    // Add student information
    headers.forEach((header, index) => {
        if (header.toLowerCase().includes('name') || 
            header.toLowerCase().includes('index') || 
            header.toLowerCase().includes('grade') || 
            header.toLowerCase().includes('class')) {
            printWindow.document.write(`<p><strong>${header}:</strong> ${studentRow[index] || ''}</p>`);
        }
    });
    
    printWindow.document.write(`
                </div>
                
                <table>
                    <thead>
                        <tr>
    `);
    
    // Add subject headers
    headers.forEach(header => {
        if (!header.toLowerCase().includes('name') && 
            !header.toLowerCase().includes('index') && 
            !header.toLowerCase().includes('grade') && 
            !header.toLowerCase().includes('class')) {
            printWindow.document.write(`<th>${header}</th>`);
        }
    });
    
    printWindow.document.write(`
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
    `);
    
    // Add subject marks
    headers.forEach((header, index) => {
        if (!header.toLowerCase().includes('name') && 
            !header.toLowerCase().includes('index') && 
            !header.toLowerCase().includes('grade') && 
            !header.toLowerCase().includes('class')) {
            printWindow.document.write(`<td>${studentRow[index] || ''}</td>`);
        }
    });
    
    printWindow.document.write(`
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>This is a computer-generated result. No signature is required.</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="no-print" onclick="window.print()">Print Result</button>
                <button class="no-print" onclick="window.close()">Close</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Update last updated time
function updateLastUpdatedTime() {
    const now = new Date();
    updateTimeElement.textContent = now.toLocaleString();
}

// Show loading message
function showLoading() {
    resultsContainer.innerHTML = `
        <div class="loading" style="text-align: center; padding: 30px;">
            <img src="${schoolLogo}" alt="School Logo" style="max-width: 100px; margin-bottom: 15px; animation: pulse 1.5s infinite;">
            <p style="color: #2196F3; font-size: 18px;">Loading results...</p>
            <div class="loading-spinner" style="margin-top: 10px; border: 4px solid #f3f3f3; border-top: 4px solid #2196F3; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; display: inline-block;"></div>
        </div>
        <style>
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// Show error message
function showError(message) {
    resultsContainer.innerHTML = `<div class="error" style="color: red; padding: 20px;">${message}</div>`;
}

// Show general message
function showMessage(message) {
    resultsContainer.innerHTML = `<div style="padding: 20px; text-align: center;">${message}</div>`;
}