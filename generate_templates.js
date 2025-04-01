/**
 * Template Generator for Student Result System
 * This script generates CSV template files for grades 6-13 with classes A, B, C
 * These templates can be uploaded to Google Sheets for use with the student result system
 */

const fs = require('fs');
const path = require('path');

// Create templates directory if it doesn't exist
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir);
    console.log('Created templates directory');
}

// Define subject lists by grade level
const primarySubjects = [
    'Mathematics', 'Science', 'English', 'First Language', 
    'History', 'Geography', 'Religion', 'ICT', 
    'Health', 'Aesthetics', 'Technical Subjects', 'Average Marks', 'Rank'
];

const secondarySubjects = [
    'Mathematics', 'Science', 'English', 'First Language', 
    'History', 'Geography', 'Religion', 'ICT', 
    'Health', 'Aesthetics', 'Technical Subjects', 'Average Marks', 'Rank'
];

const olevelSubjects = [
    'Mathematics', 'Science', 'English', 'First Language', 
    'History', 'Religion', 'ICT', 'Optional Subject 1', 
    'Optional Subject 2', 'Optional Subject 3', 'Average Marks', 'Rank'
];

const alevelSubjects = [
    'Subject 1', 'Subject 2', 'Subject 3', 'General English', 
    'General IT', 'Z-Score', 'Average Marks', 'Rank'
];

// Function to get subjects based on grade
function getSubjectsForGrade(grade) {
    if (grade >= 6 && grade <= 9) {
        return primarySubjects;
    } else if (grade >= 10 && grade <= 11) {
        return olevelSubjects;
    } else if (grade >= 12 && grade <= 13) {
        return alevelSubjects;
    }
    return primarySubjects; // Default
}

// Function to generate CSV content
function generateCSVContent(grade, className) {
    const subjects = getSubjectsForGrade(grade);
    
    // Create header row with student info and subjects
    let csvContent = 'Student Name,Index Number,Grade,Class';
    subjects.forEach(subject => {
        csvContent += ',' + subject;
    });
    csvContent += '\n';
    
    // Add 20 empty rows with sample student data
    for (let i = 1; i <= 20; i++) {
        const indexNum = `${grade}${className}${i.toString().padStart(3, '0')}`;
        csvContent += `Student ${i},${indexNum},${grade},${className}`;
        
        // Add empty cells for each subject
        subjects.forEach(() => {
            csvContent += ',';
        });
        csvContent += '\n';
    }
    
    return csvContent;
}

// Generate templates for all grades and classes
function generateAllTemplates() {
    const grades = [6, 7, 8, 9, 10, 11, 12, 13];
    const classes = ['A', 'B', 'C'];
    
    let filesCreated = 0;
    
    grades.forEach(grade => {
        classes.forEach(className => {
            const fileName = `Grade${grade}_Class${className}_Template.csv`;
            const filePath = path.join(templatesDir, fileName);
            const csvContent = generateCSVContent(grade, className);
            
            fs.writeFileSync(filePath, csvContent);
            filesCreated++;
            console.log(`Created: ${fileName}`);
        });
    });
    
    console.log(`\nSuccessfully created ${filesCreated} template files in the 'templates' directory.`);
    console.log('These files can be uploaded to Google Sheets for use with the student result system.');
}

// Run the generator
generateAllTemplates();