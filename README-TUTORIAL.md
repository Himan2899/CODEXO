# TruthGuard Database Import Tutorial

This tutorial explains how to import data into the TruthGuard fake news detection system using different methods.

## Prerequisites

Before you begin, make sure you have:

1. Node.js installed on your system
2. All required dependencies installed:
   ```
   npm install
   ```

## Option 1: Import Example CSV Data

We've included example CSV files in the `example-csv` directory that contain a small set of sample true news, false news, and source credibility data.

### Steps:

1. **Verify the example CSV files are in place:**
   - `example-csv/true_news.csv` - Example true news articles
   - `example-csv/false_news.csv` - Example false news articles
   - `example-csv/sources.csv` - Example credibility sources

2. **Run the example import script:**
   ```
   node import-example-csv.js
   ```

3. This will:
   - Create a new database file called `example_news.db` in the `database` directory
   - Import all articles and sources from the example files
   - Display the number of imported entries

## Option 2: Import Your Custom Databases

You can import your own custom CSV files for larger datasets. The system expects three main files:

### Steps:

1. **Place your CSV files in the root directory:**
   - `test (1).csv` - Your testing database
   - `train (2).csv` - Your training database
   - `evaluation.csv` - Your evaluation database

2. **Run the custom import script:**
   ```
   node import-custom-databases.js
   ```

3. This will:
   - Create a new database file called `custom_news_detector.db` in the `database` directory
   - Import all entries from your custom CSV files
   - Process them in batches to handle large datasets

## Troubleshooting Database Locking Issues

If you encounter "SQLITE_BUSY: database is locked" errors:

1. **Close any programs that might be accessing the database files**

2. **Try running with a new database name to avoid conflicts:**
   - The `import-custom-databases.js` script already uses a separate database name
   - Database files are stored in the `database` directory

3. **If errors persist, try restarting your computer** to release any locked files

## Using the Imported Database

After importing your data, you can use it in the TruthGuard application:

1. **Open server.js**

2. **Find the database connection setup section**

3. **Update the database filename:**
   ```javascript
   const db = await open({
     filename: path.join(dbDir, 'example_news.db'), // or 'custom_news_detector.db'
     driver: sqlite3.Database
   });
   ```

4. **Start the application:**
   ```
   npm start
   ```

## Database Structure

The import scripts create the following tables:

1. **known_true_news** - Contains verified true news articles
   - id, title, content, source, date_added

2. **known_false_news** - Contains known false news articles
   - id, title, content, source, date_added

3. **credibility_sources** - Contains source credibility scores
   - id, domain, credibility_score, date_updated

4. **custom_dataset_entries** - Used for entries with ambiguous classification
   - id, content, verdict, confidence, dataset, date_added 