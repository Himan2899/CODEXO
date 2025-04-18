const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function importFromCSV() {
  console.log('Starting CSV import for TruthGuard database...');
  
  // Check if CSV files exist
  const trueNewsPath = path.join(__dirname, 'true_news.csv');
  const falseNewsPath = path.join(__dirname, 'false_news.csv');
  const sourcesPath = path.join(__dirname, 'sources.csv');
  
  if (!fs.existsSync(trueNewsPath)) {
    console.error(`File not found: ${trueNewsPath}`);
    console.log('Create a CSV file with columns: title,content,source');
    return;
  }
  
  if (!fs.existsSync(falseNewsPath)) {
    console.error(`File not found: ${falseNewsPath}`);
    console.log('Create a CSV file with columns: title,content,source');
    return;
  }
  
  if (!fs.existsSync(sourcesPath)) {
    console.error(`File not found: ${sourcesPath}`);
    console.log('Create a CSV file with columns: domain,credibility_score');
    return;
  }

  // Create database directory if it doesn't exist
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
    console.log('Created database directory');
  }
  
  // Open database connection
  const db = await open({
    filename: path.join(dbDir, 'news_detector.db'),
    driver: sqlite3.Database
  });
  
  console.log('Database connection established');
  
  // Create tables if they don't exist
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
  let importedTrueNews = 0;
  await new Promise((resolve, reject) => {
    fs.createReadStream(trueNewsPath)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          await db.run(
            'INSERT INTO known_true_news (title, content, source) VALUES (?, ?, ?)',
            [row.title, row.content, row.source]
          );
          importedTrueNews++;
        } catch (err) {
          console.error('Error importing true news row:', err);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  // Process false news CSV
  let importedFalseNews = 0;
  await new Promise((resolve, reject) => {
    fs.createReadStream(falseNewsPath)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          await db.run(
            'INSERT INTO known_false_news (title, content, source) VALUES (?, ?, ?)',
            [row.title, row.content, row.source]
          );
          importedFalseNews++;
        } catch (err) {
          console.error('Error importing false news row:', err);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  // Process sources CSV
  let importedSources = 0;
  await new Promise((resolve, reject) => {
    fs.createReadStream(sourcesPath)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          await db.run(
            'INSERT OR REPLACE INTO credibility_sources (domain, credibility_score) VALUES (?, ?)',
            [row.domain, parseFloat(row.credibility_score)]
          );
          importedSources++;
        } catch (err) {
          console.error('Error importing source row:', err);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Import complete!`);
  console.log(`- ${importedTrueNews} true news articles imported`);
  console.log(`- ${importedFalseNews} false news articles imported`);
  console.log(`- ${importedSources} sources imported`);
  
  // Close the database
  await db.close();
  console.log('Database connection closed');
}

// Run the import
importFromCSV().catch(error => {
  console.error('Error during CSV import:', error);
  process.exit(1);
}); 