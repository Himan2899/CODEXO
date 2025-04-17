# TruthGuard - Fake News Detector

TruthGuard is a web-based tool designed to help users detect potential fake news and misinformation. Using a combination of natural language processing techniques and pattern recognition, it analyzes text content and provides an assessment of its credibility.

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

This is a client-side application built with:
- HTML5
- CSS3
- JavaScript (ES6+)

The fake news detection algorithm is based on:
- Keyword pattern recognition
- Source citation analysis
- Text sentiment analysis

## Limitations

This demo version uses a simplified algorithm based on keyword matching and basic patterns. It is intended for educational purposes and should not be relied upon for definitive fact-checking. In a production environment, this would be connected to a more sophisticated machine learning model.

## Future Improvements

- Integration with professional fact-checking APIs
- Machine learning model for improved accuracy
- More comprehensive source verification
- Historical context analysis
- Support for additional file formats (PDF, DOCX)
- Backend implementation for web crawling functionality

## Getting Started

1. Clone this repository
2. Open `index.html` in your web browser
3. No server or build process required for basic functionality

## License

MIT License - Feel free to use and modify for your own projects. 