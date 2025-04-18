const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function importExampleCSV() {
  console.log('Starting example CSV import for TruthGuard database...');
  
  // Check if CSV files exist in the example-csv directory
  const trueNewsPath = path.join(__dirname, 'example-csv', 'true_news.csv');
  const falseNewsPath = path.join(__dirname, 'example-csv', 'false_news.csv');
  const sourcesPath = path.join(__dirname, 'example-csv', 'sources.csv');
  
  if (!fs.existsSync(trueNewsPath)) {
    console.error(`File not found: ${trueNewsPath}`);
    console.log('Make sure true_news.csv exists in the example-csv directory');
    return;
  }
  
  if (!fs.existsSync(falseNewsPath)) {
    console.error(`File not found: ${falseNewsPath}`);
    console.log('Make sure false_news.csv exists in the example-csv directory');
    return;
  }
  
  if (!fs.existsSync(sourcesPath)) {
    console.error(`File not found: ${sourcesPath}`);
    console.log('Make sure sources.csv exists in the example-csv directory');
    return;
  }

  // Create database directory if it doesn't exist
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
    console.log('Created database directory');
  }
  
  // Use a new database file to avoid conflicts
  const dbFile = path.join(dbDir, 'example_news.db');
  
  // Remove existing database file if it exists to start fresh
  if (fs.existsSync(dbFile)) {
    try {
      fs.unlinkSync(dbFile);
      console.log('Removed existing database file to start fresh');
    } catch (err) {
      console.error('Could not remove existing database file:', err.message);
      console.log('Will attempt to use it anyway');
    }
  }
  
  try {
    // Open database connection
    const db = await open({
      filename: dbFile,
      driver: sqlite3.Database
    });
    
    console.log('Database connection established');
    
    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS known_true_news (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT,
          source TEXT,
          date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS known_false_news (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT,
          source TEXT,
          date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS credibility_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          domain TEXT UNIQUE,
          credibility_score REAL,
          date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Tables created/verified');
    
    // Process true news CSV
    const trueNews = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(trueNewsPath)
        .pipe(csv())
        .on('data', (row) => trueNews.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Read ${trueNews.length} rows from true_news.csv`);
    
    // Process false news CSV
    const falseNews = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(falseNewsPath)
        .pipe(csv())
        .on('data', (row) => falseNews.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Read ${falseNews.length} rows from false_news.csv`);
    
    // Process sources CSV
    const sources = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(sourcesPath)
        .pipe(csv())
        .on('data', (row) => sources.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Read ${sources.length} rows from sources.csv`);
    
    // Begin transaction for better performance
    await db.exec('BEGIN TRANSACTION');
    
    // Insert true news
    let importedTrueNews = 0;
    for (const row of trueNews) {
      try {
        await db.run(
          'INSERT INTO known_true_news (title, content, source) VALUES (?, ?, ?)',
          [row.title, row.content, row.source]
        );
        importedTrueNews++;
      } catch (err) {
        console.error('Error importing true news row:', err.message);
      }
    }
    
    // Insert false news
    let importedFalseNews = 0;
    for (const row of falseNews) {
      try {
        await db.run(
          'INSERT INTO known_false_news (title, content, source) VALUES (?, ?, ?)',
          [row.title, row.content, row.source]
        );
        importedFalseNews++;
      } catch (err) {
        console.error('Error importing false news row:', err.message);
      }
    }
    
    // Insert sources
    let importedSources = 0;
    for (const row of sources) {
      try {
        await db.run(
          'INSERT OR REPLACE INTO credibility_sources (domain, credibility_score) VALUES (?, ?)',
          [row.domain, parseFloat(row.credibility_score)]
        );
        importedSources++;
      } catch (err) {
        console.error('Error importing source row:', err.message);
      }
    }
    
    // Commit the transaction
    await db.exec('COMMIT');
    
    console.log(`\nImport complete!`);
    console.log(`- ${importedTrueNews} true news articles imported`);
    console.log(`- ${importedFalseNews} false news articles imported`);
    console.log(`- ${importedSources} sources imported`);
    console.log(`\nDatabase file: ${dbFile}`);
    
    // Close the database connection
    await db.close();
    console.log('Database connection closed');
    
  } catch (err) {
    console.error('Error during database operations:', err.message);
    process.exit(1);
  }
}

// Run the import
importExampleCSV().catch(error => {
  console.error('Error during example CSV import:', error);
  process.exit(1);
}); 