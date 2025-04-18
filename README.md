# TruthGuard - Fake News Detector

TruthGuard is a web-based tool designed to help users detect potential fake news and misinformation. Using a combination of natural language processing techniques, pattern recognition, and database-driven analysis, it analyzes text content and provides an assessment of its credibility.

## Features

- **Multiple Input Methods**:
  - Text input for direct copy-paste of articles
  - URL input for analyzing online articles
  - File upload for analyzing local documents
  - Web Crawler for analyzing entire websites

- **Comprehensive Analysis**:
  - Verdict (True/False) with confidence score
  - Detailed metrics and indicators
  - Source citation detection
  - Sentiment analysis
  - Domain credibility checking
  - Database matching for known content

- **Machine Learning Capabilities**:
  - User feedback collection
  - Training data database
  - Content matching for known fake/true news
  - Reputation-based domain scoring

## How to Use

1. **Choose an Input Method**:
   - Click on the appropriate tab (Text, URL, File, or Web Crawler) based on your content source.

2. **Provide Content**:
   - For Text: Paste the article or content into the text area.
   - For URL: Enter the web address of the news article.
   - For File: Upload a text file containing the content (.txt files supported).
   - For Web Crawler: Enter a website URL to analyze, and set the crawl depth and max pages.

3. **Analyze**:
   - Click the "Analyze" button to process the content.
   - Wait for the analysis to complete (this usually takes a few seconds).

4. **Review Results**:
   - The verdict will be displayed as "True" or "False".
   - A confidence percentage indicates the reliability of the assessment.
   - Detailed metrics provide insight into the factors influencing the verdict.
   - Provide feedback to help improve the system!

## Test Examples

Here are some example texts you can use to test both true and false verdicts:

### Example 1: Likely to be marked as TRUE
```
According to a recent research study published in Nature journal, scientists at MIT have confirmed that regular exercise reduces the risk of heart disease by 30%. The data was collected over a 10-year period, involving 5,000 participants. The research was verified by multiple independent laboratories and was funded by the National Institute of Health.
```

### Example 2: Likely to be marked as FALSE
```
SHOCKING NEWS!!! Scientists don't want you to know this MIRACLE cure for ALL diseases!!! A secret conspiracy of doctors is HIDING this from you because they want you to stay sick!!! Anonymous sources confirm this EXCLUSIVE information that Big Pharma doesn't want you to see!!! Share before they take this down!!!
```

### Example 3: Likely to be marked as FALSE
```
Some people say that there might possibly be aliens living among us. They could be your neighbors or coworkers. They might be planning something big, according to anonymous sources. The government allegedly knows about this but is keeping it secret.
```

## Technical Implementation

This application is built with:
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express
- **Database**: SQLite for storing training data and domain reputation
- **NLP**: Custom text analysis algorithm with pattern recognition

The fake news detection algorithm uses a multi-faceted approach:
1. **Database Matching**: Checks content against known fake and true news
2. **Domain Credibility**: Evaluates source reputation from a maintained database
3. **Content Analysis**: Keyword pattern recognition, weasel word detection, etc.
4. **Structure Analysis**: Examines content characteristics (length, capitalization, etc.)
5. **Machine Learning**: Improves over time through user feedback

## Getting Started

1. **Clone the repository**:
   ```
   git clone https://github.com/yourusername/truthguard.git
   cd truthguard
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Set up the database with sample data**:
   ```
   npm run setup-db
   ```

4. **Start the server**:
   ```
   npm start
   ```

5. **Open in your browser**:
   ```
   http://localhost:3000
   ```

## Creating Your Custom Database

You can customize TruthGuard with your own database of news sources and articles:

### Method 1: Using the Setup Script

1. **Create a custom database setup file** (e.g., `my-custom-db.js`):
   ```javascript
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
     }
     
     // Open database connection
     const db = await open({
       filename: path.join(dbDir, 'news_detector.db'),
       driver: sqlite3.Database
     });
     
     // Add your custom true news examples
     const myTrueNews = [
       {
         title: 'Your True Article Title',
         content: 'Your verified article content here...',
         source: 'Your Source'
       },
       // Add more true articles as needed
     ];
     
     // Add your custom false news examples
     const myFalseNews = [
       {
         title: 'Your False Article Title',
         content: 'Your fake news article content here...',
         source: 'Your Source'
       },
       // Add more false articles as needed
     ];
     
     // Add your trusted sources
     const myTrustedSources = [
       { domain: 'yourtrustedsource.com', credibility_score: 0.9 },
       // Add more trusted domains as needed
     ];
     
     // Add your untrusted sources
     const myUntrustedSources = [
       { domain: 'youruntrustedsource.com', credibility_score: 0.2 },
       // Add more untrusted domains as needed
     ];
     
     // Insert your custom data
     for (const news of myTrueNews) {
       await db.run(
         'INSERT INTO known_true_news (title, content, source) VALUES (?, ?, ?)',
         [news.title, news.content, news.source]
       );
     }
     
     for (const news of myFalseNews) {
       await db.run(
         'INSERT INTO known_false_news (title, content, source) VALUES (?, ?, ?)',
         [news.title, news.content, news.source]
       );
     }
     
     for (const source of [...myTrustedSources, ...myUntrustedSources]) {
       await db.run(
         'INSERT INTO credibility_sources (domain, credibility_score) VALUES (?, ?)',
         [source.domain, source.credibility_score]
       );
     }
     
     console.log('Custom database setup complete');
     await db.close();
   }
   
   setupCustomDatabase().catch(error => {
     console.error('Error setting up custom database:', error);
   });
   ```

2. **Run your custom setup script**:
   ```
   node my-custom-db.js
   ```

### Method 2: Using the Web Interface

1. **Start TruthGuard** with the default database
2. **Analyze Content** using any of the input methods
3. **Provide Feedback** by clicking "No" when asked if the verdict is correct
4. **Add to Training Data** by clicking "Yes, add to training data" when prompted
5. Repeat this process to build up your custom database over time

### Method 3: Bulk Import from CSV

1. **Create CSV files** for your data sources:
   - `true_news.csv`: Articles known to be true
   - `false_news.csv`: Articles known to be false
   - `sources.csv`: Domain reputation data

2. **Use the import script**:
   ```
   node import-data.js --true=true_news.csv --false=false_news.csv --sources=sources.csv
   ```

## Contributing to the Database

The accuracy of TruthGuard increases as more data is added to its knowledge base. When using the application, you can:

1. **Provide Feedback** on analysis results, helping improve the system
2. **Add to Training Data** when you find false positives or false negatives
3. **Submit Domain Reputation** updates through pull requests to this repository

## Limitations

While TruthGuard strives for accuracy, it has limitations:
- The analysis is probabilistic, not definitive
- It performs best with English-language news articles
- Some nuanced misinformation may not be detected
- Satire and opinions can sometimes be misclassified

Always use critical thinking when evaluating news, even with technological assistance.

## License

MIT License - Feel free to use and modify for your own projects.
