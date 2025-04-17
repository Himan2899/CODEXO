const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Serve static files
app.use(express.static(path.join(__dirname, './')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API route for text analysis
app.post('/api/analyze/text', (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }
    
    // In a real implementation, this would call an AI model
    // For now, we'll use the simple keyword-based algorithm
    const result = analyzeText(content);
    
    res.json(result);
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
        
        // Analyze the content
        const result = analyzeText(content);
        
        // Add metadata about the source
        result.source = {
            url,
            title: $('title').text(),
            domain: new URL(url).hostname
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).json({ error: 'Failed to fetch and analyze URL' });
    }
});

// API route for file analysis
app.post('/api/analyze/file', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
    }
    
    try {
        // Read the file content
        const filePath = req.file.path;
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Analyze the content
        const result = analyzeText(content);
        
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

// Function to analyze text content
function analyzeText(content) {
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
    
    // Check truth indicators - now with 2x weight
    truthIndicators.forEach(indicator => {
        const regex = new RegExp('\\b' + indicator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
            // Give truth indicators 2x weight to balance the algorithm
            truthScore += matches.length * 2;
        }
    });
    
    // Calculate total score and confidence
    const totalScore = fakeScore + truthScore;
    let trueConfidence = 0;
    
    if (totalScore > 0) {
        trueConfidence = (truthScore / totalScore) * 100;
    } else {
        // If no indicators found, use a more balanced default approach
        const sourceCount = countSources(content);
        const contentLength = content.length;
        
        // Short content with no sources is more likely to be fake
        if (contentLength < 100 && sourceCount === 0) {
            trueConfidence = 45; // Less negative toward short content
        } else if (sourceCount > 0) {
            trueConfidence = 70; // More positive if any sources are found
        } else if (contentLength > 300) {
            trueConfidence = 60; // Longer content gets benefit of the doubt
        } else {
            trueConfidence = 55; // Default now leans toward true
        }
    }
    
    // Additional checks that might indicate false content
    // Check for excessive use of capital letters (shouting)
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.3 && content.length > 50) {
        trueConfidence -= 20; // Reduce confidence if excessive caps
    }
    
    // Check for excessive punctuation (!!!???)
    const excessivePunctuation = (content.match(/[!?]{2,}/g) || []).length;
    if (excessivePunctuation > 2) {
        trueConfidence -= 15; // Reduce confidence if sensationalist punctuation
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
    
    if (weaselCount > 3) {
        trueConfidence -= 15; // Reduce confidence for excessive weasel words
    } else if (weaselCount <= 1 && content.length > 150) {
        trueConfidence += 10; // Boost confidence for clear, direct statements
    }
    
    // Check for source citations
    const sourceCount = countSources(content);
    if (sourceCount >= 1) {
        trueConfidence += 10; // Significant boost for each source cited
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
            contentLength: content.length,
            fakeIndicators: fakeScore,
            truthIndicators: Math.round(truthScore / 2), // Display the original count
            sentiment: analyzeSentiment(content),
            sourcesCount: sourceCount,
            weaselWords: weaselCount,
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
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            positiveCount += matches.length;
        }
    });
    
    negativeWords.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
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
            
            // Analyze content
            const analysis = analyzeText(content);
            
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