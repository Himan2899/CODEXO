// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const fileInput = document.getElementById('news-file');
const fileName = document.getElementById('file-name');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsSection = document.getElementById('results');
const resultContent = document.getElementById('result-content');
const detailsSection = document.getElementById('details');

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
    
    // Calculate the verdict
    // In a real implementation, this would use a more sophisticated algorithm
    
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
    
    // Display results
    displayResults(isTrue, trueConfidence, {
        contentLength: content.length,
        fakeIndicators: fakeScore,
        truthIndicators: Math.round(truthScore / 2), // Display the original count
        sentiment: analyzeSentiment(content),
        sourcesCount: sourceCount,
        weaselWords: weaselCount,
        allCaps: (upperCaseRatio * 100).toFixed(1) + '%'
    });
}

// Function to display the analysis results
function displayResults(isTrue, confidence, metrics) {
    resultsSection.classList.add('active');
    
    const verdict = isTrue ? 'True' : 'False';
    const verdictClass = isTrue ? 'true' : 'false';
    
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
    `;
    
    // Show detailed metrics
    detailsSection.innerHTML = `
        <h3>Analysis Details</h3>
        <div class="detail-item">
            <div class="detail-label">Content Length</div>
            <div>${metrics.contentLength} characters</div>
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
            <div class="detail-label">All Caps Percentage</div>
            <div>${metrics.allCaps}</div>
        </div>
    `;
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