const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Serve static files
app.use(express.static(path.join(__dirname, './')));

// Database setup
let db;
async function setupDatabase() {
    // Create database directory if it doesn't exist
    const dbDir = path.join(__dirname, 'database');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir);
    }
    
    // Open database connection
    db = await open({
        filename: path.join(dbDir, 'news_detector.db'),
        driver: sqlite3.Database
    });
    
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
    
    // Seed the database with some initial known credible sources if empty
    const sourceCount = await db.get('SELECT COUNT(*) as count FROM credibility_sources');
    if (sourceCount.count === 0) {
        const credibleSources = [
            { domain: 'reuters.com', credibility_score: 0.95 },
            { domain: 'apnews.com', credibility_score: 0.95 },
            { domain: 'bbc.com', credibility_score: 0.9 },
            { domain: 'npr.org', credibility_score: 0.9 },
            { domain: 'nature.com', credibility_score: 0.95 },
            { domain: 'science.org', credibility_score: 0.95 },
            { domain: 'scientificamerican.com', credibility_score: 0.9 },
            { domain: 'nejm.org', credibility_score: 0.95 },
            { domain: 'who.int', credibility_score: 0.9 }
        ];
        
        const unreliableSources = [
            { domain: 'infowars.com', credibility_score: 0.1 },
            { domain: 'naturalcures.com', credibility_score: 0.2 },
            { domain: 'theonion.com', credibility_score: 0.2 }, // Satire site
            { domain: 'clickbait-news.com', credibility_score: 0.15 }
        ];
        
        for (const source of [...credibleSources, ...unreliableSources]) {
            await db.run(
                'INSERT INTO credibility_sources (domain, credibility_score) VALUES (?, ?)',
                [source.domain, source.credibility_score]
            );
        }
        
        console.log('Database seeded with initial credibility sources');
    }
    
    console.log('Database setup complete');
}

// Initialize database
setupDatabase().catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API route for text analysis
app.post('/api/analyze/text', async (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }
    
    try {
        // Use enhanced analysis with database lookup
        const result = await analyzeTextWithDb(content);
        res.json(result);
    } catch (error) {
        console.error('Error analyzing text:', error);
        res.status(500).json({ error: 'Failed to analyze text' });
    }
});

// API route for URL analysis
app.post('/api/analyze/url', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        // Fetch the content from the URL
        const response = await axios.get(url);
        const html = response.data;
        
        // Extract text content using Cheerio
        const $ = cheerio.load(html);
        
        // Remove script and style elements
        $('script, style').remove();
        
        // Get text content
        const content = $('body').text().trim();
        
        // Get domain for credibility check
        const domain = new URL(url).hostname.replace('www.', '');
        
        // Analyze the content with domain credibility check
        const result = await analyzeTextWithDb(content, domain);
        
        // Add metadata about the source
        result.source = {
            url,
            title: $('title').text(),
            domain
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).json({ error: 'Failed to fetch and analyze URL' });
    }
});

// API route for file analysis
app.post('/api/analyze/file', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
    }
    
    try {
        // Read the file content
        const filePath = req.file.path;
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Analyze the content with database enhancements
        const result = await analyzeTextWithDb(content);
        
        // Add file metadata
        result.source = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype
        };
        
        // Delete the temporary file
        fs.unlinkSync(filePath);
        
        res.json(result);
    } catch (error) {
        console.error('Error analyzing file:', error);
        res.status(500).json({ error: 'Failed to analyze file' });
    }
});

// API route for web crawling
app.post('/api/crawl', async (req, res) => {
    const { url, depth = 1, maxPages = 5 } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        const results = await crawlWebsite(url, depth, maxPages);
        res.json(results);
    } catch (error) {
        console.error('Error crawling website:', error);
        res.status(500).json({ error: 'Failed to crawl website' });
    }
});

// API route to add new training data
app.post('/api/training/add', async (req, res) => {
    const { content, title, source, is_true } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }
    
    try {
        const table = is_true ? 'known_true_news' : 'known_false_news';
        await db.run(
            `INSERT INTO ${table} (title, content, source) VALUES (?, ?, ?)`,
            [title || 'Untitled', content, source || 'Manual entry']
        );
        
        res.json({ success: true, message: 'Training data added successfully' });
    } catch (error) {
        console.error('Error adding training data:', error);
        res.status(500).json({ error: 'Failed to add training data' });
    }
});

// API route for user feedback
app.post('/api/feedback', async (req, res) => {
    const { content, user_verdict, system_verdict, confidence } = req.body;
    
    if (!content || !user_verdict) {
        return res.status(400).json({ error: 'Content and verdict are required' });
    }
    
    try {
        // Create a simple hash of the content for identification
        const contentHash = require('crypto')
            .createHash('md5')
            .update(content.substring(0, 1000)) // Use first 1000 chars to avoid large texts
            .digest('hex');
        
        // Check if feedback for this content already exists
        const existing = await db.get(
            'SELECT * FROM user_feedback WHERE content_hash = ?',
            [contentHash]
        );
        
        if (existing) {
            // Update existing feedback
            await db.run(
                'UPDATE user_feedback SET feedback_count = feedback_count + 1 WHERE content_hash = ?',
                [contentHash]
            );
        } else {
            // Add new feedback
            await db.run(
                'INSERT INTO user_feedback (content_hash, user_verdict, system_verdict, confidence) VALUES (?, ?, ?, ?)',
                [contentHash, user_verdict, system_verdict, confidence]
            );
        }
        
        res.json({ success: true, message: 'Feedback recorded successfully' });
    } catch (error) {
        console.error('Error recording feedback:', error);
        res.status(500).json({ error: 'Failed to record feedback' });
    }
});

// Enhanced analysis function using database lookup
async function analyzeTextWithDb(content, domain = null) {
    // First, check if we have this exact content or similar in our database
    const contentSample = content.substring(0, 500).replace(/'/g, "''"); // Get first 500 chars for comparison
    
    try {
        // Check in known true news
        const knownTrueMatch = await db.get(
            `SELECT * FROM known_true_news WHERE content LIKE '%${contentSample}%' LIMIT 1`
        );
        
        if (knownTrueMatch) {
            return {
                verdict: 'True',
                confidence: 95,
                source: 'Database match',
                metrics: {
                    contentLength: content.split(/\s+/).filter(Boolean).length + " words",
                    databaseMatch: 'Known true news',
                    matchConfidence: 'High'
                }
            };
        }
        
        // Check in known false news
        const knownFalseMatch = await db.get(
            `SELECT * FROM known_false_news WHERE content LIKE '%${contentSample}%' LIMIT 1`
        );
        
        if (knownFalseMatch) {
            return {
                verdict: 'False',
                confidence: 95,
                source: 'Database match',
                metrics: {
                    contentLength: content.split(/\s+/).filter(Boolean).length + " words",
                    databaseMatch: 'Known false news',
                    matchConfidence: 'High'
                }
            };
        }
        
        // Check domain credibility if provided
        let domainCredibility = null;
        if (domain) {
            const domainInfo = await db.get(
                'SELECT * FROM credibility_sources WHERE domain = ?',
                [domain]
            );
            
            if (domainInfo) {
                domainCredibility = domainInfo.credibility_score;
            }
        }
        
        // If no exact match found, use our enhanced algorithm and incorporate domain credibility
        const algorithmResult = analyzeText(content);
        
        // Adjust confidence based on domain credibility if available
        if (domainCredibility !== null) {
            // Blend algorithm confidence with domain reputation (70% algorithm, 30% domain)
            const originalConfidence = algorithmResult.confidence;
            algorithmResult.confidence = 
                (originalConfidence * 0.7) + (domainCredibility * 100 * 0.3);
            
            // Ensure confidence is within bounds
            algorithmResult.confidence = Math.max(0, Math.min(100, algorithmResult.confidence));
            
            // Round to 2 decimal places
            algorithmResult.confidence = Math.round(algorithmResult.confidence * 100) / 100;
            
            // Update verdict based on adjusted confidence
            algorithmResult.verdict = algorithmResult.confidence >= 50 ? 'True' : 'False';
            
            // Add domain credibility to metrics
            algorithmResult.metrics.domainCredibility = (domainCredibility * 100).toFixed(0) + '%';
        }
        
        return algorithmResult;
        
    } catch (error) {
        console.error('Database lookup error:', error);
        // Fall back to standard algorithm if database lookup fails
        return analyzeText(content);
    }
}

// Original text analysis function - kept as fallback
function analyzeText(content) {
    // Starting with a baseline confidence of 65% 
    // We assume content is more likely true than false by default
    let trueConfidence = 65;
    
    // Define lists of keywords that might indicate fake vs. true news
    const fakeNewsIndicators = [
        'conspiracy', 'hoax', 'fraud', 'scam', 'fake', 
        'clickbait', 'shocking', 'you won\'t believe', 
        'secret', 'they don\'t want you to know',
        'miraculous', 'cure', 'exclusive', 'anonymous sources',
        'hidden truth', 'cover-up', 'what they don\'t tell you',
        'mainstream media won\'t report', 'doctors hate this',
        'one weird trick', 'without a prescription', 'banned',
        'censored', 'the truth about', 'they refused to publish',
        'what the government doesn\'t want you to know',
        'shocking revelation', 'suppressed', 'exposed',
        'wake up', 'sheeple', 'mind control', 'plandemic'
    ];
    
    const truthIndicators = [
        'research', 'study', 'evidence', 'according to experts',
        'scientists', 'verified', 'official', 'fact check',
        'investigation', 'confirmed', 'source', 'data',
        'peer-reviewed', 'published in', 'journal', 'university',
        'professor', 'expert', 'analyzed', 'statistics',
        'survey', 'clinical trial', 'experiment', 'meta-analysis',
        'research paper', 'findings suggest', 'evidence indicates',
        'researchers found', 'according to the study',
        'multiple sources confirmed', 'citation', 'reference',
        'statistical significance', 'correlation', 'causation'
    ];
    
    // Count occurrences of indicators
    let fakeScore = 0;
    let truthScore = 0;
    
    // Convert content to lowercase for case-insensitive matching
    const lowerContent = content.toLowerCase();
    
    // Check fake news indicators
    fakeNewsIndicators.forEach(indicator => {
        const regex = new RegExp('\\b' + indicator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
            fakeScore += matches.length;
        }
    });
    
    // Check truth indicators with 3x weight
    truthIndicators.forEach(indicator => {
        const regex = new RegExp('\\b' + indicator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
            truthScore += matches.length * 3;
        }
    });
    
    // Calculate indicator-based adjustment
    const totalIndicators = fakeScore + (truthScore / 3); // Use original count for total
    
    if (totalIndicators > 0) {
        // Calculate percentage of truth indicators
        const truthPercentage = (truthScore / 3) / totalIndicators;
        
        // Adjust confidence based on indicators ratio
        if (truthPercentage >= 0.7) {
            // Strong truth indicators
            trueConfidence += 20;
        } else if (truthPercentage >= 0.5) {
            // Moderate truth indicators
            trueConfidence += 10;
        } else if (truthPercentage <= 0.3) {
            // Strong fake indicators
            trueConfidence -= 35;
        } else if (truthPercentage <= 0.5) {
            // Moderate fake indicators
            trueConfidence -= 20;
        }
    }
    
    // Content structure checks
    
    // Word count is a better measure than character count
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    
    // Adjust for content length
    if (wordCount < 20) {
        trueConfidence -= 15; // Very short content is suspicious
    } else if (wordCount > 100) {
        trueConfidence += 10; // Longer, more detailed content is more likely true
    }
    
    // Check for excessive use of capital letters (shouting)
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.3 && content.length > 50) {
        trueConfidence -= 25; // Heavily reduce confidence if excessive caps
    } else if (upperCaseRatio > 0.2 && content.length > 50) {
        trueConfidence -= 15; // Moderate reduction for somewhat high caps
    }
    
    // Check for excessive punctuation (!!!???)
    const excessivePunctuation = (content.match(/[!?]{2,}/g) || []).length;
    if (excessivePunctuation > 3) {
        trueConfidence -= 25; // Heavy penalty for very excessive punctuation
    } else if (excessivePunctuation > 1) {
        trueConfidence -= 15; // Moderate penalty for some excessive punctuation
    }
    
    // Check for weasel words (may, might, could, possibly, allegedly)
    const weaselWords = ['may', 'might', 'could', 'possibly', 'allegedly', 'reportedly', 'some say', 'they say', 'many people', 'sources say', 'rumored', 'supposedly'];
    let weaselCount = 0;
    weaselWords.forEach(word => {
        const regex = new RegExp('\\b' + word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
            weaselCount += matches.length;
        }
    });
    
    // Adjust for weasel words
    if (weaselCount > 4) {
        trueConfidence -= 20; // Heavy reduction for many weasel words
    } else if (weaselCount > 2) {
        trueConfidence -= 10; // Moderate reduction for some weasel words
    } else if (weaselCount == 0 && wordCount > 50) {
        trueConfidence += 10; // Boost for clear, direct statements with no weasel words
    }
    
    // Check for source citations
    const sourceCount = countSources(content);
    if (sourceCount >= 3) {
        trueConfidence += 20; // Strong boost for multiple sources
    } else if (sourceCount >= 1) {
        trueConfidence += 15; // Moderate boost for at least one source
    }
    
    // Additional checks for factual language patterns in news
    const factualPhrases = ['according to', 'stated that', 'reported by', 'confirms that', 'found that'];
    let factualCount = 0;
    
    factualPhrases.forEach(phrase => {
        const regex = new RegExp(phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
            factualCount += matches.length;
        }
    });
    
    if (factualCount >= 2) {
        trueConfidence += 15; // Boost for multiple factual phrases
    } else if (factualCount >= 1) {
        trueConfidence += 10; // Smaller boost for at least one factual phrase
    }
    
    // Check for quotations (often a sign of legitimate reporting)
    const quoteMatches = content.match(/[""][^""]+[""]/g);
    if (quoteMatches && quoteMatches.length >= 2) {
        trueConfidence += 10; // Boost for multiple quotations
    } else if (quoteMatches && quoteMatches.length >= 1) {
        trueConfidence += 5; // Smaller boost for at least one quotation
    }
    
    // Round to 2 decimal places
    trueConfidence = Math.round(trueConfidence * 100) / 100;
    
    // Ensure confidence is within bounds
    trueConfidence = Math.max(0, Math.min(100, trueConfidence));
    
    // Determine verdict (true if confidence > 50%)
    const isTrue = trueConfidence >= 50;
    
    return {
        verdict: isTrue ? 'True' : 'False',
        confidence: trueConfidence,
        metrics: {
            contentLength: wordCount + " words",
            fakeIndicators: fakeScore,
            truthIndicators: Math.round(truthScore / 3), // Display the original count
            sentiment: analyzeSentiment(content),
            sourcesCount: sourceCount,
            weaselWords: weaselCount,
            factualPhrases: factualCount,
            allCaps: (upperCaseRatio * 100).toFixed(1) + '%'
        }
    };
}

// Function to analyze sentiment
function analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'happy', 'wonderful', 'beneficial'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'sad', 'horrible', 'harmful'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    const lowerText = text.toLowerCase();
    
    positiveWords.forEach(word => {
        const regex = new RegExp('\\b' + word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            positiveCount += matches.length;
        }
    });
    
    negativeWords.forEach(word => {
        const regex = new RegExp('\\b' + word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            negativeCount += matches.length;
        }
    });
    
    // Determine overall sentiment
    if (positiveCount > negativeCount) {
        return 'Positive';
    } else if (negativeCount > positiveCount) {
        return 'Negative';
    } else {
        return 'Neutral';
    }
}

// Function to count sources
function countSources(text) {
    let sourceCount = 0;
    
    // Count URL-like patterns
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (urls) {
        sourceCount += urls.length;
    }
    
    // Count citation-like patterns
    const citationRegex = /\([^)]*\d{4}[^)]*\)/g; // (Author, 2020) pattern
    const citations = text.match(citationRegex);
    if (citations) {
        sourceCount += citations.length;
    }
    
    // Count "according to" phrases
    const accordingToRegex = /according to [^,.]+/gi;
    const accordingTo = text.match(accordingToRegex);
    if (accordingTo) {
        sourceCount += accordingTo.length;
    }
    
    return sourceCount;
}

// Web crawling function
async function crawlWebsite(startUrl, maxDepth = 1, maxPages = 5) {
    const visited = new Set();
    const queue = [{ url: startUrl, depth: 0 }];
    const results = [];
    
    while (queue.length > 0 && visited.size < maxPages) {
        const { url, depth } = queue.shift();
        
        if (visited.has(url) || depth > maxDepth) {
            continue;
        }
        
        // Mark as visited
        visited.add(url);
        
        try {
            // Fetch the page
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);
            
            // Remove script and style elements
            $('script, style').remove();
            
            // Get text content
            const content = $('body').text().trim();
            
            // Get domain for credibility check
            const domain = new URL(url).hostname.replace('www.', '');
            
            // Analyze content with domain credibility
            const analysis = await analyzeTextWithDb(content, domain);
            
            // Add to results
            results.push({
                url,
                title: $('title').text(),
                verdict: analysis.verdict,
                confidence: analysis.confidence,
                metrics: analysis.metrics
            });
            
            // Find links if not at max depth
            if (depth < maxDepth) {
                const links = $('a')
                    .map((i, el) => $(el).attr('href'))
                    .get()
                    .filter(href => href && href.startsWith('http'));
                
                // Add unique links to queue
                const uniqueLinks = [...new Set(links)];
                
                for (const link of uniqueLinks) {
                    if (!visited.has(link)) {
                        queue.push({ url: link, depth: depth + 1 });
                    }
                    
                    // Stop if we've queued enough pages
                    if (queue.length + visited.size >= maxPages) {
                        break;
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching ${url}:`, error.message);
            // Continue with next URL
        }
    }
    
    return {
        crawlStats: {
            startUrl,
            pagesVisited: visited.size,
            maxDepth,
            maxPages
        },
        results
    };
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 