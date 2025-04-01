# Student Result System Templates

This directory contains CSV template files for the student result system. These templates are designed to be uploaded to Google Sheets and then connected to the system using the Google Sheets API.

## Template Files

The templates are organized by grade and class:
- Grade 6: Classes A, B, C
- Grade 7: Classes A, B, C
- Grade 8: Classes A, B, C
- Grade 9: Classes A, B, C
- Grade 10: Classes A, B, C
- Grade 11: Classes A, B, C
- Grade 12: Classes A, B, C
- Grade 13: Classes A, B, C

## How to Use These Templates

1. **Upload to Google Sheets**:
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet
   - Go to File > Import > Upload and select the CSV file
   - Choose "Replace spreadsheet" and click Import

2. **Get the Spreadsheet ID**:
   - After uploading, look at the URL in your browser
   - The Spreadsheet ID is the long string of characters in the URL:
     ```
     https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
     ```

3. **Update the Configuration**:
   - Open the `sheetsconnector.js` file in the main project directory
   - Update the `SPREADSHEET_IDS` object with your actual spreadsheet IDs
   - For example:
     ```javascript
     const SPREADSHEET_IDS = {
         '6_A': 'your_actual_spreadsheet_id_for_6A',
         '6_B': 'your_actual_spreadsheet_id_for_6B',
         // ... and so on for all grades and classes
     };
     ```

4. **Share the Spreadsheets**:
   - Make sure to share each Google Sheet with the Google account that will be used to access the API
   - Set the sharing permissions to at least "Viewer" access

## Template Structure

Each template includes the following columns:

### For Grades 6-9:
- Student Name
- Index Number
- Grade
- Class
- Mathematics
- Science
- English
- First Language
- History
- Geography
- Religion
- ICT
- Health
- Aesthetics
- Technical Subjects
- Average Marks
- Rank

### For Grades 10-11 (O-Level):
- Student Name
- Index Number
- Grade
- Class
- Mathematics
- Science
- English
- First Language
- History
- Religion
- ICT
- Optional Subject 1
- Optional Subject 2
- Optional Subject 3
- Average Marks
- Rank

### For Grades 12-13 (A-Level):
- Student Name
- Index Number
- Grade
- Class
- Subject 1
- Subject 2
- Subject 3
- General English
- General IT
- Z-Score
- Average Marks
- Rank

## Generating More Templates

If you need to regenerate these templates or create custom ones, you can use the `generate_templates.js` script in the main project directory:

```
node generate_templates.js
```

This will create all the template files in this directory.