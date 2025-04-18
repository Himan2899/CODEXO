const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function importCustomDatabases() {
  console.log('Starting import of custom databases for TruthGuard...');
  
  // Define custom database files with the actual names from the file explorer
  const customDatabases = [
    { file: 'test (1).csv', purpose: 'testing' },
    { file: 'train (2).csv', purpose: 'training' },
    { file: 'evaluation.csv', purpose: 'evaluation' }
  ];
  
  // Check if database files exist
  for (const db of customDatabases) {
    if (!fs.existsSync(db.file)) {
      console.error(`File not found: ${db.file}`);
      console.log(`Please make sure your ${db.purpose} database file exists in the current directory.`);
      return;
    }
  }
  
  console.log('All database files found. Proceeding with import...');

  // Create database directory if it doesn't exist
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
    console.log('Created database directory');
  }
  
  // Use a new database file to avoid conflicts
  const dbFile = path.join(dbDir, 'custom_news_detector.db');
  
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
  
  // Delay to ensure file system operations complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Open database connection with a longer timeout
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
          dataset TEXT,
          date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS known_false_news (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT,
          source TEXT,
          dataset TEXT,
          date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS credibility_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          domain TEXT UNIQUE,
          credibility_score REAL,
          date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS custom_dataset_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT,
          verdict TEXT,
          confidence REAL,
          dataset TEXT,
          date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Tables created/verified');
    
    // Process each database file sequentially
    for (const database of customDatabases) {
      console.log(`\nProcessing ${database.file} (${database.purpose} database)...`);
      
      // Read the CSV file in memory first
      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(database.file)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
      
      console.log(`Read ${rows.length} rows from ${database.file}`);
      
      if (rows.length === 0) {
        console.log(`No data found in ${database.file}, skipping`);
        continue;
      }
      
      // Process data in batches
      const batchSize = 100;
      let entriesAdded = 0;
      
      // Analyze first row to determine structure
      const sampleRow = rows[0];
      const hasVerdict = 'verdict' in sampleRow;
      const hasTitle = 'title' in sampleRow;
      const hasSource = 'source' in sampleRow;
      
      console.log(`CSV structure: ${hasVerdict ? 'Has verdict' : 'No verdict'}, ${hasTitle ? 'Has title' : 'No title'}, ${hasSource ? 'Has source' : 'No source'}`);
      
      // Use a single transaction per file for better performance
      await db.exec('BEGIN TRANSACTION');
      
      try {
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, Math.min(i + batchSize, rows.length));
          
          if (i % 1000 === 0) {
            console.log(`Processing rows ${i+1}-${Math.min(i+batchSize, rows.length)} of ${rows.length}`);
          }
          
          // Process each row in the batch
          for (const row of batch) {
            try {
              if (hasVerdict) {
                const verdict = String(row.verdict || '').toLowerCase();
                const isTrue = verdict === 'true' || verdict === '1' || verdict === 'yes';
                const isFalse = verdict === 'false' || verdict === '0' || verdict === 'no';
                
                const title = hasTitle ? row.title : 'Untitled';
                const source = hasSource ? row.source : database.purpose;
                
                if (isTrue) {
                  await db.run(
                    'INSERT INTO known_true_news (title, content, source, dataset) VALUES (?, ?, ?, ?)',
                    [title, row.content, source, database.purpose]
                  );
                } else if (isFalse) {
                  await db.run(
                    'INSERT INTO known_false_news (title, content, source, dataset) VALUES (?, ?, ?, ?)',
                    [title, row.content, source, database.purpose]
                  );
                } else {
                  await db.run(
                    'INSERT INTO custom_dataset_entries (content, verdict, confidence, dataset) VALUES (?, ?, ?, ?)',
                    [row.content, verdict, parseFloat(row.confidence || '0.5'), database.purpose]
                  );
                }
              } else {
                // No verdict - store as custom entry
                await db.run(
                  'INSERT INTO custom_dataset_entries (content, dataset) VALUES (?, ?)',
                  [row.content, database.purpose]
                );
              }
              
              // Handle source credibility if available
              if (row.domain && row.credibility) {
                await db.run(
                  'INSERT OR REPLACE INTO credibility_sources (domain, credibility_score) VALUES (?, ?)',
                  [row.domain, parseFloat(row.credibility)]
                );
              }
              
              entriesAdded++;
            } catch (err) {
              console.error(`Error processing row: ${err.message}`);
            }
          }
        }
        
        // Commit the transaction
        await db.exec('COMMIT');
        console.log(`Added ${entriesAdded} entries from ${database.file}`);
        
      } catch (err) {
        // Roll back on error
        console.error(`Error processing batch: ${err.message}`);
        try {
          await db.exec('ROLLBACK');
        } catch (rollbackErr) {
          console.error('Error during rollback:', rollbackErr.message);
        }
      }
    }
    
    console.log('\nDatabase import complete!');
    console.log(`Your custom databases are now integrated into TruthGuard.`);
    console.log(`Database file: ${dbFile}`);
    
    // Add instructions for using this database in the application
    console.log('\nTo use this database in your TruthGuard application:');
    console.log('1. Open server.js');
    console.log('2. Look for the database connection setup');
    console.log('3. Change the database filename to "custom_news_detector.db"');
    
    // Close the database connection
    await db.close();
    console.log('Database connection closed');
    
  } catch (err) {
    console.error('Fatal error during database setup:', err.message);
    process.exit(1);
  }
}

// Run the import
importCustomDatabases().catch(error => {
  console.error('Error during database import:', error);
  process.exit(1);
}); 