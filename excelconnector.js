// Microsoft Authentication Library configuration
const msalConfig = {
    auth: {
        clientId: "YOUR_CLIENT_ID", // Replace with your registered app's client ID
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin + "/examresult.html",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

// Excel file details
const excelFileId = "YOUR_EXCEL_FILE_ID"; // Replace with your Excel file ID
const excelSheetName = "Results"; // Replace with your sheet name
const schoolLogo = "path/to/school-logo.png"; // Replace with your school logo path

// Initialize MSAL instance
const msalInstance = new msal.PublicClientApplication(msalConfig);

// DOM elements
const gradeSelect = document.getElementById('grade-select');
const resultsContainer = document.getElementById('results-container');
const updateTimeElement = document.getElementById('update-time');
const indexSearchInput = document.getElementById('student-index');
const searchButton = document.getElementById('search-button');
const clearSearchButton = document.getElementById('clear-search');
const printButton = document.getElementById('print-button');

// Event listeners
document.addEventListener('DOMContentLoaded', initialize);
gradeSelect.addEventListener('change', applyFilters);
searchButton.addEventListener('click', applyFilters);
clearSearchButton.addEventListener('click', clearSearch);
if (printButton) {
    printButton.addEventListener('click', printResults);
}

// Initialize the application
async function initialize() {
    try {
        // Check if user is signed in
        const accounts = msalInstance.getAllAccounts();
        
        if (accounts.length === 0) {
            // User is not signed in, initiate login
            await signIn();
        } else {
            // User is already signed in, fetch data
            await fetchExcelData();
        }
    } catch (error) {
        showError("Failed to initialize: " + error.message);
    }
}

// Clear search function
function clearSearch() {
    indexSearchInput.value = '';
    applyFilters();
}

// Sign in function
async function signIn() {
    try {
        const loginRequest = {
            scopes: ["Files.Read", "Sites.Read.All"]
        };
        
        await msalInstance.loginPopup(loginRequest);
        await fetchExcelData();
    } catch (error) {
        showError("Sign-in failed: " + error.message);
    }
}

// Fetch data from Excel Online
async function fetchExcelData() {
    showLoading();
    
    try {
        const accounts = msalInstance.getAllAccounts();
        
        if (accounts.length === 0) {
            throw new Error("No signed-in account found");
        }
        
        const silentRequest = {
            scopes: ["Files.Read", "Sites.Read.All"],
            account: accounts[0]
        };
        
        const tokenResponse = await msalInstance.acquireTokenSilent(silentRequest);
        const accessToken = tokenResponse.accessToken;
        
        // Call Microsoft Graph API to get Excel data
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${excelFileId}/workbook/worksheets/${excelSheetName}/range(address='A1:Z1000')`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        displayResults(data.values);
        updateLastUpdatedTime();
        
        // Set up automatic refresh every 5 minutes
        setTimeout(fetchExcelData, 5 * 60 * 1000);
    } catch (error) {
        showError("Failed to fetch Excel data: " + error.message);
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
    
    // Store the full dataset for filtering
    window.fullDataset = rows;
    window.headers = headers;
    
    // Populate grade dropdown if not already populated
    if (gradeSelect.options.length <= 1) {
        populateGradeDropdown(rows);
    }
    
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
            tableHTML += `<td>${cell}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    
    resultsContainer.innerHTML = tableHTML;
    
    // Apply initial filter
    applyFilters();
}

// Populate grade dropdown with available grades (1-13)
function populateGradeDropdown(rows) {
    // Clear existing options except "All Grades"
    while (gradeSelect.options.length > 1) {
        gradeSelect.remove(1);
    }
    
    // Find the grade column index
    let gradeColumnIndex = -1;
    for (let i = 0; i < window.headers.length; i++) {
        const headerText = window.headers[i].toLowerCase();
        if (headerText.includes('grade')) {
            gradeColumnIndex = i;
            break;
        }
    }
    
    if (gradeColumnIndex !== -1) {
        // Get unique grades
        const grades = new Set();
        rows.forEach(row => {
            if (row[gradeColumnIndex]) {
                grades.add(row[gradeColumnIndex]);
            }
        });
        
        // Add grade options (1-13)
        for (let i = 1; i <= 13; i++) {
            if (grades.has(i.toString()) || grades.has(i)) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Grade ${i}`;
                gradeSelect.appendChild(option);
            }
        }
    }
}

// Apply all filters (grade and student index)
function applyFilters() {
    const selectedGrade = gradeSelect.value;
    const studentIndex = indexSearchInput.value.trim().toLowerCase();
    
    if (!window.fullDataset) return;
    
    const rows = window.fullDataset;
    const headers = window.headers;
    
    // Find the grade column index
    let gradeColumnIndex = -1;
    let indexColumnIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
        const headerText = headers[i].toLowerCase();
        if (headerText.includes('grade')) {
            gradeColumnIndex = i;
        }
        if (headerText.includes('index') || headerText.includes('id') || headerText.includes('number')) {
            indexColumnIndex = i;
        }
    }
    
    // Filter rows based on selected grade and student index
    const tableRows = document.querySelectorAll('table tbody tr');
    let visibleCount = 0;
    
    tableRows.forEach((row, index) => {
        let showRow = true;
        
        // Apply grade filter if valid
        if (gradeColumnIndex !== -1 && selectedGrade !== 'all') {
            const gradeCell = rows[index][gradeColumnIndex];
            if (gradeCell != selectedGrade) {
                showRow = false;
            }
        }
        
        // Apply student index filter if provided
        if (showRow && studentIndex && indexColumnIndex !== -1) {
            const indexCell = String(rows[index][indexColumnIndex]).toLowerCase();
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
    if (visibleCount === 0 && (selectedGrade !== 'all' || studentIndex)) {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.className = 'no-results';
        noResultsMessage.innerHTML = `<p>No results found${studentIndex ? ' for index "' + studentIndex + '"' : ''}${selectedGrade !== 'all' ? ' in Grade ' + selectedGrade : ''}.</p>`;
        resultsContainer.appendChild(noResultsMessage);
    }
    
    // Show print button if results are found and student index is provided
    const printButtonContainer = document.getElementById('print-button-container');
    if (printButtonContainer) {
        if (visibleCount > 0 && studentIndex) {
            printButtonContainer.style.display = 'block';
        } else {
            printButtonContainer.style.display = 'none';
        }
    }
}

// Print student results
function printResults() {
    const studentIndex = indexSearchInput.value.trim();
    if (!studentIndex || !window.fullDataset) return;
    
    // Find the student data
    const headers = window.headers;
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
    const studentRow = window.fullDataset.find(row => 
        String(row[indexColumnIndex]).toLowerCase().includes(studentIndex.toLowerCase())
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
                <div class="school-name">School Examination Results</div>
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
            printWindow.document.write(`<p><strong>${header}:</strong> ${studentRow[index]}</p>`);
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
            printWindow.document.write(`<td>${studentRow[index]}</td>`);
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

// Update the last updated time
function updateLastUpdatedTime() {
    const now = new Date();
    updateTimeElement.textContent = now.toLocaleString();
}

// Show loading indicator
function showLoading() {
    resultsContainer.innerHTML = '<div class="loading">Loading results...</div>';
}

// Show error message
function showError(message) {
    resultsContainer.innerHTML = `<div class="error" style="color: red; padding: 20px;">${message}</div>`;
}