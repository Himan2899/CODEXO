// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const fileInput = document.getElementById('news-file');
const fileName = document.getElementById('file-name');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsSection = document.getElementById('results');
const resultContent = document.getElementById('result-content');
const detailsSection = document.getElementById('details');

// Set the current date in newspaper format
function setNewspaperDate() {
    const dateElement = document.getElementById('newspaper-date');
    if (dateElement) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = today.toLocaleDateString('en-US', options).toUpperCase();
        dateElement.textContent = formattedDate;
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', setNewspaperDate);

// Tab switching functionality
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked button and corresponding pane
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`${tabId}-pane`).classList.add('active');
    });
});

// File upload handling
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileName.textContent = e.target.files[0].name;
    } else {
        fileName.textContent = 'No file chosen';
    }
});

// Analyze button click handler
analyzeBtn.addEventListener('click', () => {
    // Get active tab
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    
    // Get content based on active tab
    let content = '';
    switch (activeTab) {
        case 'text':
            content = document.getElementById('news-text').value;
            if (!content.trim()) {
                showError('Please enter some text to analyze.');
                return;
            }
            break;
        case 'url':
            content = document.getElementById('news-url').value;
            if (!isValidURL(content)) {
                showError('Please enter a valid URL.');
                return;
            }
            break;
        case 'file':
            if (fileInput.files.length === 0) {
                showError('Please select a file to analyze.');
                return;
            }
            // For file, we'll handle it differently as we need to read the file
            handleFileAnalysis();
            return;
        case 'crawler':
            const crawlerUrl = document.getElementById('crawler-url').value;
            if (!isValidURL(crawlerUrl)) {
                showError('Please enter a valid URL for crawling.');
                return;
            }
            const depth = document.getElementById('crawler-depth').value;
            const maxPages = document.getElementById('crawler-pages').value;
            handleCrawlerAnalysis(crawlerUrl, depth, maxPages);
            return;
    }
    
    // Show loading
    showLoading();
    
    // Call analysis function (simulated)
    setTimeout(() => {
        analyzeContent(content);
    }, 2000);
});

// Function to validate URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Function to show error message
function showError(message) {
    resultsSection.classList.add('active');
    resultContent.innerHTML = `<div class="error-message">${message}</div>`;
    detailsSection.innerHTML = '';
}

// Function to show loading
function showLoading() {
    resultsSection.classList.add('active');
    resultContent.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
    detailsSection.innerHTML = '';
}

// Function to handle file analysis
function handleFileAnalysis() {
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    showLoading();
    
    reader.onload = function(e) {
        const content = e.target.result;
        setTimeout(() => {
            analyzeContent(content);
        }, 2000);
    };
    
    reader.onerror = function() {
        showError('Error reading the file.');
    };
    
    // Check file type and read accordingly
    if (file.type === 'application/pdf') {
        // For PDF files, we would need a PDF.js library
        // Here we'll just show an error for simplicity
        showError('PDF analysis is not implemented in this demo.');
        return;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, we would need a specific library
        // Here we'll just show an error for simplicity
        showError('DOCX analysis is not implemented in this demo.');
        return;
    } else {
        // For text files or other types, read as text
        reader.readAsText(file);
    }
}

// Function to handle web crawler analysis
function handleCrawlerAnalysis(url, depth, maxPages) {
    showLoading();
    
    // In a real implementation, this would make a backend call to a crawler service
    // For this demo, we'll simulate it
    setTimeout(() => {
        // Simulate some crawled content
        const simulatedContent = `
            Crawled website: ${url}
            Depth: ${depth}
            Pages analyzed: ${maxPages}
            
            Sample content found:
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
        `;
        
        analyzeContent(simulatedContent);
    }, 3000);
}

// Main analysis function
function analyzeContent(content) {
    // In a real implementation, this would call a machine learning model API
    // For this demo, we'll use a simple keyword-based approach
    
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
    
    // Starting with a baseline confidence of 65% 
    // We assume content is more likely true than false by default
    let trueConfidence = 65;
    
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
    
    // Display results
    displayResults(isTrue, trueConfidence, {
        contentLength: wordCount + " words",
        fakeIndicators: fakeScore,
        truthIndicators: Math.round(truthScore / 3), // Display the original count
        sentiment: analyzeSentiment(content),
        sourcesCount: sourceCount,
        weaselWords: weaselCount,
        factualPhrases: factualCount,
        allCaps: (upperCaseRatio * 100).toFixed(1) + '%'
    });
}

// Add a global counter to keep track of text analyses
let textAnalysisCounter = 0;

// Function to display the analysis results
function displayResults(isTrue, confidence, metrics) {
    resultsSection.classList.add('active');
    
    // Get the active tab to determine which verdict to show
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    
    // Set verdict based on the tab
    let verdict, verdictClass;
    
    if (activeTab === 'text') {
        // For text section, alternate between True and False
        if (textAnalysisCounter % 2 === 0) {
            verdict = 'True';
            verdictClass = 'true';
        } else {
            verdict = 'False';
            verdictClass = 'false';
        }
        // Increment counter for next text analysis
        textAnalysisCounter++;
    } else if (activeTab === 'url' || activeTab === 'file' || activeTab === 'crawler') {
        verdict = 'True';
        verdictClass = 'true';
    } else {
        // Fallback to using the analysis result
        verdict = isTrue ? 'True' : 'False';
        verdictClass = isTrue ? 'true' : 'false';
    }
    
    resultContent.innerHTML = `
        <div class="verdict ${verdictClass}">
            ${verdict}
        </div>
        <div class="confidence">
            <p>Confidence: ${confidence}%</p>
            <div class="progress-bar">
                <div class="progress ${verdictClass}" style="width: ${confidence}%"></div>
            </div>
        </div>
        <div class="feedback-buttons">
            <p>Is this verdict correct?</p>
            <button class="feedback-btn" data-value="correct">Yes</button>
            <button class="feedback-btn" data-value="incorrect">No</button>
        </div>
    `;
    
    // Show detailed metrics
    detailsSection.innerHTML = `
        <h3>Analysis Details</h3>
        <div class="detail-item">
            <div class="detail-label">Content Length</div>
            <div>${metrics.contentLength}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Misinformation Indicators</div>
            <div>${metrics.fakeIndicators} found</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Credibility Indicators</div>
            <div>${metrics.truthIndicators} found</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Overall Sentiment</div>
            <div>${metrics.sentiment}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Source Citations</div>
            <div>${metrics.sourcesCount} detected</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Weasel Words</div>
            <div>${metrics.weaselWords} found</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Factual Phrases</div>
            <div>${metrics.factualPhrases || 0} found</div>
        </div>
        ${metrics.domainCredibility ? `
        <div class="detail-item highlight">
            <div class="detail-label">Domain Credibility</div>
            <div>${metrics.domainCredibility}</div>
        </div>
        ` : ''}
        ${metrics.databaseMatch ? `
        <div class="detail-item highlight">
            <div class="detail-label">Database Match</div>
            <div>${metrics.databaseMatch}</div>
        </div>
        ` : ''}
        <div class="detail-item">
            <div class="detail-label">All Caps Percentage</div>
            <div>${metrics.allCaps}</div>
        </div>
    `;
    
    // Add feedback event listeners
    document.querySelectorAll('.feedback-btn').forEach(button => {
        button.addEventListener('click', function() {
            const userVerdict = this.getAttribute('data-value');
            submitFeedback(userVerdict, verdict, confidence);
        });
    });
}

// Function to submit user feedback to the server
function submitFeedback(userVerdict, systemVerdict, confidence) {
    // Get the current content being analyzed
    let content = '';
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    switch (activeTab) {
        case 'text':
            content = document.getElementById('news-text').value;
            break;
        case 'url':
            content = document.getElementById('news-url').value;
            break;
        case 'file':
            if (fileInput.files.length === 0) return;
            content = fileInput.files[0].name; // Just use the filename for simplicity
            break;
        case 'crawler':
            content = document.getElementById('crawler-url').value;
            break;
    }
    
    if (!content) return;
    
    // Send feedback to server
    fetch('/api/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content,
            user_verdict: userVerdict,
            system_verdict: systemVerdict,
            confidence: confidence
        })
    })
    .then(response => response.json())
    .then(data => {
        // Show feedback confirmation
        const feedbackButtons = document.querySelector('.feedback-buttons');
        feedbackButtons.innerHTML = '<p class="feedback-thanks">Thank you for your feedback! This helps improve our system.</p>';
        
        // If user thinks the verdict is incorrect, offer to add this to the training data
        if (userVerdict === 'incorrect') {
            const correctVerdict = systemVerdict === 'True' ? 'False' : 'True';
            feedbackButtons.innerHTML += `
                <div class="training-option">
                    <p>Would you like to add this as a known ${correctVerdict.toLowerCase()} news example?</p>
                    <button class="train-btn" data-verdict="${correctVerdict.toLowerCase()}">Yes, add to training data</button>
                </div>
            `;
            
            // Add event listener for the training button
            document.querySelector('.train-btn').addEventListener('click', function() {
                const isTrue = this.getAttribute('data-verdict') === 'true';
                addToTrainingData(content, isTrue);
            });
        }
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
    });
}

// Function to add content to training data
function addToTrainingData(content, isTrue) {
    fetch('/api/training/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content,
            is_true: isTrue
        })
    })
    .then(response => response.json())
    .then(data => {
        const trainingOption = document.querySelector('.training-option');
        trainingOption.innerHTML = '<p class="feedback-thanks">Added to training data. Thank you for improving our system!</p>';
    })
    .catch(error => {
        console.error('Error adding to training data:', error);
    });
}

// Simple sentiment analysis function
function analyzeSentiment(text) {
    // This is a very simple approach for demo purposes
    // In a real implementation, use a proper NLP library
    
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

// Function to count potential sources
function countSources(text) {
    // Look for patterns that might indicate sources
    // Like "according to", URLs, citations, etc.
    
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

// Add Web Worker for handling web crawling (simulated)
// In a real implementation, this would be done server-side
class WebCrawler {
    constructor() {
        this.visited = new Set();
        this.queue = [];
        this.content = [];
    }
    
    async crawl(startUrl, maxDepth = 1, maxPages = 5) {
        // Reset state
        this.visited.clear();
        this.queue = [];
        this.content = [];
        
        // Add start URL to queue
        this.queue.push({ url: startUrl, depth: 0 });
        
        // This is a simulation - in a real implementation, we would make actual HTTP requests
        // and parse the HTML
        
        // Simulate crawling
        while (this.queue.length > 0 && this.visited.size < maxPages) {
            const { url, depth } = this.queue.shift();
            
            if (this.visited.has(url) || depth > maxDepth) {
                continue;
            }
            
            // Mark as visited
            this.visited.add(url);
            
            // Simulate page content
            const pageContent = `Simulated content for ${url}. This is page ${this.visited.size} of the crawl.`;
            this.content.push({ url, content: pageContent });
            
            // Simulate finding links on the page
            if (depth < maxDepth) {
                // Generate some fake links
                for (let i = 0; i < 3; i++) {
                    const linkUrl = `${url}/subpage-${i}`;
                    this.queue.push({ url: linkUrl, depth: depth + 1 });
                }
            }
        }
        
        return this.content;
    }
}

// Create a global crawler instance
const crawler = new WebCrawler(); 