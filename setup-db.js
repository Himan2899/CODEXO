const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('Setting up TruthGuard database with sample data...');
    
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
    
    console.log('Tables created');
    
    // Add sample true news
    const trueNews = [
        {
            title: 'New Study on Exercise Benefits',
            content: 'According to a recent research study published in the Journal of Medicine, scientists at Harvard University have confirmed that regular exercise reduces the risk of heart disease by 30%. The data was collected over a 10-year period, involving 5,000 participants. The research was verified by multiple independent laboratories and was funded by the National Institute of Health.',
            source: 'Sample Data'
        },
        {
            title: 'COVID-19 Vaccine Effectiveness',
            content: 'A peer-reviewed study published in Nature Medicine shows that COVID-19 vaccines reduced hospitalizations by 85% among those fully vaccinated. Researchers analyzed data from 32,000 patients across multiple hospitals. The findings were consistent across different age groups, according to the lead scientist Dr. Robert Chen.',
            source: 'Sample Data'
        }
    ];
    
    // Add sample false news
    const falseNews = [
        {
            title: 'Secret Miracle Cure Revealed',
            content: 'SHOCKING NEWS!!! Scientists don\'t want you to know this MIRACLE cure for ALL diseases!!! A secret conspiracy of doctors is HIDING this from you because they want you to stay sick!!! Anonymous sources confirm this EXCLUSIVE information that Big Pharma doesn\'t want you to see!!! Share before they take this down!!!',
            source: 'Sample Data'
        },
        {
            title: 'Aliens Among Us',
            content: 'Some people say that there might possibly be aliens living among us. They could be your neighbors or coworkers. They might be planning something big, according to anonymous sources. The government allegedly knows about this but is keeping it secret.',
            source: 'Sample Data'
        }
    ];
    
    // Insert sample data
    for (const news of trueNews) {
        await db.run(
            'INSERT INTO known_true_news (title, content, source) VALUES (?, ?, ?)',
            [news.title, news.content, news.source]
        );
    }
    
    for (const news of falseNews) {
        await db.run(
            'INSERT INTO known_false_news (title, content, source) VALUES (?, ?, ?)',
            [news.title, news.content, news.source]
        );
    }
    
    console.log('Sample news data added');
    
    // Add credible news sources
    const credibleSources = [
        { domain: 'reuters.com', credibility_score: 0.95 },
        { domain: 'apnews.com', credibility_score: 0.95 },
        { domain: 'bbc.com', credibility_score: 0.9 },
        { domain: 'npr.org', credibility_score: 0.9 },
        { domain: 'nature.com', credibility_score: 0.95 },
        { domain: 'science.org', credibility_score: 0.95 },
        { domain: 'scientificamerican.com', credibility_score: 0.9 },
        { domain: 'nejm.org', credibility_score: 0.95 },
        { domain: 'who.int', credibility_score: 0.9 },
        { domain: 'cdc.gov', credibility_score: 0.9 },
        { domain: 'nih.gov', credibility_score: 0.95 },
        { domain: 'harvard.edu', credibility_score: 0.9 },
        { domain: 'mit.edu', credibility_score: 0.9 }
    ];
    
    // Add unreliable sources
    const unreliableSources = [
        { domain: 'infowars.com', credibility_score: 0.1 },
        { domain: 'naturalcures.com', credibility_score: 0.2 },
        { domain: 'theonion.com', credibility_score: 0.2 }, // Satire site
        { domain: 'clickbait-news.com', credibility_score: 0.15 }
    ];
    
    // Clear existing sources and add new ones
    await db.run('DELETE FROM credibility_sources');
    
    for (const source of [...credibleSources, ...unreliableSources]) {
        await db.run(
            'INSERT INTO credibility_sources (domain, credibility_score) VALUES (?, ?)',
            [source.domain, source.credibility_score]
        );
    }
    
    console.log('Domain credibility data added');
    console.log('Database setup complete. You can now run the application with:');
    console.log('  npm start');
    
    // Close the database
    await db.close();
}

// Run the setup
setupDatabase().catch(error => {
    console.error('Error setting up database:', error);
    process.exit(1);
}); 