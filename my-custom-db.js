const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

async function setupCustomDatabase() {
  console.log('Setting up custom TruthGuard database...');
  
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
    
    CREATE TABLE IF NOT EXISTS user_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_hash TEXT UNIQUE,
        user_verdict TEXT,
        system_verdict TEXT,
        confidence REAL,
        feedback_count INTEGER DEFAULT 1,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('Tables created/verified');
  
  // Add your custom true news examples
  const myTrueNews = [
    {
      title: 'NASA Confirms Water on Mars',
      content: 'According to a recent study published in Science journal, NASA scientists have confirmed the presence of liquid water on Mars. The data was collected by the Mars Reconnaissance Orbiter, which detected hydrated salts flowing down hillsides on the planet. This discovery increases the possibility that Mars could support some form of microbial life.',
      source: 'NASA.gov'
    },
    {
      title: 'New Cancer Treatment Shows Promise',
      content: 'Researchers at Stanford Medical Center have developed a new immunotherapy treatment that showed a 70% response rate in clinical trials for patients with advanced melanoma. The findings, published in the New England Journal of Medicine, demonstrate significant improvement over current standard treatments. The research team, led by Dr. Sarah Johnson, is now proceeding with larger Phase 3 trials.',
      source: 'Stanford Medicine'
    }
    // Add more true articles as needed
  ];
  
  // Add your custom false news examples
  const myFalseNews = [
    {
      title: '5G Towers Linked to Strange Illness',
      content: 'BREAKING!!! 5G towers have been SECRETLY causing a mysterious illness in local residents!! Multiple people report strange symptoms after 5G installation in their neighborhood!!! The government doesn\'t want you to know about this COVERUP! Share this post before they DELETE IT!!!',
      source: 'TruthRevealed.net'
    },
    {
      title: 'Celebrity Discovers Fountain of Youth',
      content: 'Famous actress reveals MIRACLE anti-aging secret that doctors DON\'T want you to know!!! She looks 30 years younger in just ONE WEEK using this ONE WEIRD TRICK!!! Big Pharma is trying to SILENCE her!!!',
      source: 'CelebritySecrets.org'
    }
    // Add more false articles as needed
  ];
  
  // Add your trusted sources with high credibility scores
  const myTrustedSources = [
    { domain: 'reuters.com', credibility_score: 0.95 },
    { domain: 'apnews.com', credibility_score: 0.93 },
    { domain: 'nasa.gov', credibility_score: 0.97 },
    { domain: 'cdc.gov', credibility_score: 0.92 },
    { domain: 'mayoclinic.org', credibility_score: 0.90 },
    { domain: 'nih.gov', credibility_score: 0.94 }
    // Add more trusted domains as needed
  ];
  
  // Add your untrusted sources with low credibility scores
  const myUntrustedSources = [
    { domain: 'conspiracyalert.net', credibility_score: 0.15 },
    { domain: 'truthrevealed.com', credibility_score: 0.20 },
    { domain: 'alternativefacts.org', credibility_score: 0.25 },
    { domain: 'secretcures.biz', credibility_score: 0.10 }
    // Add more untrusted domains as needed
  ];
  
  // Insert your custom data
  console.log('Adding custom true news articles...');
  for (const news of myTrueNews) {
    await db.run(
      'INSERT INTO known_true_news (title, content, source) VALUES (?, ?, ?)',
      [news.title, news.content, news.source]
    );
  }
  
  console.log('Adding custom false news articles...');
  for (const news of myFalseNews) {
    await db.run(
      'INSERT INTO known_false_news (title, content, source) VALUES (?, ?, ?)',
      [news.title, news.content, news.source]
    );
  }
  
  console.log('Adding custom domain credibility data...');
  for (const source of [...myTrustedSources, ...myUntrustedSources]) {
    // Use INSERT OR REPLACE to handle duplicates
    await db.run(
      'INSERT OR REPLACE INTO credibility_sources (domain, credibility_score) VALUES (?, ?)',
      [source.domain, source.credibility_score]
    );
  }
  
  console.log('Custom database setup complete. You can now run the application with:');
  console.log('  npm start');
  
  // Close the database
  await db.close();
}

// Run the setup
setupCustomDatabase().catch(error => {
  console.error('Error setting up custom database:', error);
  process.exit(1);
}); 