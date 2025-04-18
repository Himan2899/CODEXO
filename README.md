# TruthGuard - Fake News Detector

A Streamlit application that detects fake news using text analysis and linguistic indicators.

## Features

- Text-based fake news detection
- URL analysis simulation
- File upload and analysis
- Web crawler simulation
- Detailed analysis metrics
- User feedback collection

## Requirements

- Python 3.8 or higher
- Streamlit 1.31.0
- Pandas 2.1.4
- NumPy 1.26.3

## Installation

1. Clone this repository:
```
git clone <repository-url>
cd fake-news-detector
```

2. Install the required packages:
```
pip install -r requirements.txt
```

## Running the Application

Run the Streamlit application locally:
```
streamlit run app.py
```

The application will be available at http://localhost:8501

## Deploying to Streamlit Cloud

1. Create a free account on [Streamlit Cloud](https://streamlit.io/cloud)
2. Link your GitHub repository
3. Deploy the application with the following settings:
   - Main file path: `app.py`
   - Python version: 3.9 (or your preferred version)
   - Requirements: `requirements.txt`

## How It Works

The application analyzes text for indicators of fake news, including:

- Linguistic patterns and weasel words
- Source citations and factual phrases
- Content length and structure
- Excessive capitalization and punctuation
- Sentiment analysis

The verdict (True/False) is displayed along with a confidence score and detailed metrics.

## Customizing the Application

- Modify the lists of indicators in `app.py` to improve detection
- Adjust the confidence thresholds and scoring weights
- Customize the UI by editing the CSS in the markdown section

## License

MIT License

## Acknowledgments

- Newspaper styling inspired by classic print journalism
- Fake news detection algorithm based on linguistic research and heuristics
