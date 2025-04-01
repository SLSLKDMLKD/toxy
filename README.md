# Online Student Result System

This system allows you to display and print student examination results using Google Sheets as the data source. The system supports grades 6-13 with class subdivisions (A, B, C) for each grade.

## Setup Instructions

### 1. Create Google Sheets for Each Class

1. Create separate Google Sheets for each class (e.g., 6A, 6B, 6C, etc.)
2. Use the following column structure for each sheet:
   - Student Name
   - Index Number
   - Grade
   - Class
   - Subject 1
   - Subject 2
   - ... (add all relevant subjects)

### 2. Set Up Google API Access

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API for your project
4. Create credentials (API Key and OAuth 2.0 Client ID)
   - For the OAuth consent screen, add the domain where your application will be hosted
   - For authorized JavaScript origins, add your website URL

### 3. Configure the Application

Open the `sheetsconnector.js` file and update the following:

```javascript
// Replace with your Google API credentials
const API_KEY = 'YOUR_API_KEY';
const CLIENT_ID = 'YOUR_CLIENT_ID';

// Update with your actual spreadsheet IDs
const SPREADSHEET_IDS = {
    '6_A': 'SPREADSHEET_ID_FOR_6A',
    '6_B': 'SPREADSHEET_ID_FOR_6B',
    // ... add all your spreadsheet IDs
};
```

To find a spreadsheet ID, open your Google Sheet and look at the URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

### 4. Publish Your Sheets

For each Google Sheet:
1. Go to File > Share > Publish to web
2. Select the entire sheet or specific ranges
3. Click Publish

## Using the System

1. Open `studentResult.html` in a web browser
2. Sign in with a Google account that has access to the spreadsheets
3. Select a grade and class from the dropdown menus
4. Enter a student index number to filter results
5. Click the Print button to generate a printable report

## Updating Results

Simply update the Google Sheets with new data. The changes will be reflected in the system when users reload the page or select a different grade/class.

## Troubleshooting

- If you see "No data available" message, check that:
  - The spreadsheet ID is correct
  - The sheet has been published
  - The user has permission to access the sheet
- If authentication fails, verify your API Key and Client ID

## System Requirements

- Modern web browser with JavaScript enabled
- Internet connection to access Google Sheets API