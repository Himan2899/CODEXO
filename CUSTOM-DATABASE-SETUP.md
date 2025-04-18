# Setting Up TruthGuard with Your Custom Databases

This guide explains how to integrate your custom databases into the TruthGuard fake news detection system.

## Files Used by the Import Script

The system is configured to use these specific CSV files:
- `test (1).csv` - Your testing database
- `train (2).csv` - Your training database
- `evaluation.csv` - Your evaluation database

## Prerequisites

1. Make sure you have Node.js installed on your system
2. Ensure your CSV files are in the correct format (see below)
3. Place your CSV files in the root directory of the project (C:\Users\ASUS\news2.0)

## CSV File Format

The import script supports flexible CSV formats, but for best results, your files should include at least these columns:

For a standard news database:
```
content,verdict
"This is the article text content","true"
"This is another article text","false"
```

For a more detailed database:
```
title,content,source,verdict
"Article Title","This is the article text content","sourcename.com","true"
"Another Title","This is another article","othersource.org","false"
```

For a domain credibility database:
```
domain,credibility
"reliablesource.com","0.9"
"unreliablesource.net","0.2"
```

## Setup Steps

1. **Verify your CSV files are in the correct location:**
   
   Your files should be in the main project directory:
   - C:\Users\ASUS\news2.0\test (1).csv
   - C:\Users\ASUS\news2.0\train (2).csv
   - C:\Users\ASUS\news2.0\evaluation.csv

2. **Install dependencies:**
   ```
   npm install
   ```
   This will install all required packages, including csv-parser.

3. **Run the custom import script:**
   ```
   npm run import-custom
   ```
   This script will:
   - Look for your three CSV files with the correct names
   - Determine the structure of each file automatically
   - Import the data into the TruthGuard database
   - Label each entry with its source dataset (testing, training, or evaluation)

4. **Start the TruthGuard application:**
   ```
   npm start
   ```
   The application will now use your custom databases for fake news detection.

## Troubleshooting

If you encounter issues during import:

1. **File not found errors:**
   - Make sure your CSV files are named exactly as shown above
   - Check the files are in the root directory of the project (C:\Users\ASUS\news2.0)
   - Verify with `dir *.csv` in the terminal

2. **Parsing errors:**
   - Check that your CSV files are properly formatted
   - Ensure there are no encoding issues (save files as UTF-8)
   - Make sure column names are in the first row

3. **CSV format issues:**
   - Ensure your CSV files use commas as separators
   - If your files use different separators, convert them to standard CSV format

## Customizing the Import Script

If you need to modify file names or how your data is imported:

1. Open `import-custom-databases.js` in a text editor
2. Update the file names in the `customDatabases` array if needed
3. Save your changes and run the import again

## Advanced: Creating a New Database

If you want to create additional databases:

1. Create a CSV file with at least a `content` column
2. Add a `verdict` column with values `true` or `false`
3. Optional: Add `title`, `source`, and other metadata columns 
4. Add the new file to the `customDatabases` array in the import script 