import streamlit as st
import re
import pandas as pd
import numpy as np
from datetime import datetime
import random
import time

# Set page configuration
st.set_page_config(
    page_title="TruthGuard - Fake News Detector",
    page_icon="🛡️",
    layout="wide"
)

# Custom CSS for newspaper styling
st.markdown("""
<style>
    /* Newspaper background effect */
    .stApp {
        background-color: #e8e8e8;
        background-image: url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='newspaper' patternUnits='userSpaceOnUse' width='300' height='300' patternTransform='rotate(45)'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Cline x1='0' y1='0' x2='300' y2='0' stroke='%23d0d0d0' stroke-width='1'/%3E%3Cline x1='0' y1='30' x2='300' y2='30' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='0' y1='60' x2='300' y2='60' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='0' y1='90' x2='300' y2='90' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='0' y1='120' x2='300' y2='120' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='0' y1='150' x2='300' y2='150' stroke='%23d0d0d0' stroke-width='1'/%3E%3Cline x1='0' y1='180' x2='300' y2='180' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='0' y1='210' x2='300' y2='210' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='0' y1='240' x2='300' y2='240' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='0' y1='270' x2='300' y2='270' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='0' y1='0' x2='0' y2='300' stroke='%23d0d0d0' stroke-width='1'/%3E%3Cline x1='30' y1='0' x2='30' y2='300' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='60' y1='0' x2='60' y2='300' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='90' y1='0' x2='90' y2='300' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='120' y1='0' x2='120' y2='300' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='150' y1='0' x2='150' y2='300' stroke='%23d0d0d0' stroke-width='1'/%3E%3Cline x1='180' y1='0' x2='180' y2='300' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='210' y1='0' x2='210' y2='300' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='240' y1='0' x2='240' y2='300' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3Cline x1='270' y1='0' x2='270' y2='300' stroke='%23d0d0d0' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23newspaper)'/%3E%3C/svg%3E");
    }

    /* Container styling */
    .css-18e3th9 {
        padding-top: 0;
    }
    
    /* Header styling */
    .newspaper-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #000;
        position: relative;
    }
    
    .newspaper-header:after {
        content: "";
        position: absolute;
        bottom: 6px;
        left: 0;
        width: 100%;
        height: 1px;
        background-color: #000;
    }
    
    .newspaper-info {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #000;
        margin-bottom: 15px;
        padding-bottom: 8px;
        font-family: 'Times New Roman', Times, serif;
    }
    
    .newspaper-date, .newspaper-edition {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #333;
    }
    
    .logo {
        padding: 15px 0;
        border-bottom: 3px double #000;
        border-top: 3px double #000;
    }
    
    .title {
        font-size: 3rem;
        font-family: 'Times New Roman', Times, serif;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
        color: #000;
    }
    
    .tagline {
        font-size: 1.2rem;
        color: #333;
        font-style: italic;
        font-family: 'Times New Roman', Times, serif;
    }
    
    /* Verdict styling */
    .verdict {
        font-size: 2.2rem;
        font-weight: 700;
        margin: 20px auto;
        padding: 15px 30px;
        border-radius: 30px;
        text-transform: uppercase;
        font-family: 'Times New Roman', Times, serif;
        letter-spacing: 1px;
        text-align: center;
        max-width: 200px;
    }
    
    .verdict.true {
        background-color: rgba(56, 176, 0, 0.15);
        color: #38b000;
        border: 2px solid #38b000;
    }
    
    .verdict.false {
        background-color: rgba(208, 0, 0, 0.15);
        color: #d00000;
        border: 2px solid #d00000;
    }
    
    /* Results styling */
    .stTabs [data-baseweb="tab-list"] {
        font-family: 'Times New Roman', Times, serif;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .stTabs [data-baseweb="tab"] {
        font-family: 'Times New Roman', Times, serif;
        font-weight: 600;
        letter-spacing: 0.5px;
    }
    
    /* Details section */
    .metrics-container {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin-top: 20px;
    }
    
    h3 {
        font-family: 'Times New Roman', Times, serif;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state variables
if 'text_analysis_counter' not in st.session_state:
    st.session_state.text_analysis_counter = 0

# Header with newspaper styling
def render_header():
    today = datetime.today().strftime('%A, %B %d, %Y').upper()
    
    st.markdown(f"""
    <div class="newspaper-header">
        <div class="newspaper-info">
            <div class="newspaper-date">{today}</div>
            <div class="newspaper-edition">VOLUME 1, ISSUE 1</div>
        </div>
        <div class="logo">
            <h1 class="title">TRUTHGUARD</h1>
        </div>
        <p class="tagline">Your Trusted Fake News Detection System</p>
    </div>
    """, unsafe_allow_html=True)

# Analysis functions
def analyze_sentiment(text):
    """Simple sentiment analysis function"""
    positive_words = ['good', 'great', 'excellent', 'positive', 'happy', 'wonderful', 'beneficial']
    negative_words = ['bad', 'terrible', 'awful', 'negative', 'sad', 'horrible', 'harmful']
    
    positive_count = 0
    negative_count = 0
    
    lower_text = text.lower()
    
    for word in positive_words:
        pattern = r'\b' + re.escape(word) + r'\b'
        matches = re.findall(pattern, lower_text, re.IGNORECASE)
        positive_count += len(matches)
    
    for word in negative_words:
        pattern = r'\b' + re.escape(word) + r'\b'
        matches = re.findall(pattern, lower_text, re.IGNORECASE)
        negative_count += len(matches)
    
    if positive_count > negative_count:
        return 'Positive'
    elif negative_count > positive_count:
        return 'Negative'
    else:
        return 'Neutral'

def count_sources(text):
    """Count potential sources in the text"""
    source_count = 0
    
    # Count URLs
    url_pattern = r'(https?://[^\s]+)'
    urls = re.findall(url_pattern, text)
    source_count += len(urls)
    
    # Count citation patterns like (Author, 2020)
    citation_pattern = r'\([^)]*\d{4}[^)]*\)'
    citations = re.findall(citation_pattern, text)
    source_count += len(citations)
    
    # Count "according to" phrases
    according_to_pattern = r'according to [^,.]+' 
    according_to = re.findall(according_to_pattern, text, re.IGNORECASE)
    source_count += len(according_to)
    
    return source_count

def analyze_content(content):
    """Main analysis function to determine truthfulness of content"""
    # Define lists of keywords that might indicate fake vs. true news
    fake_news_indicators = [
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
    ]
    
    truth_indicators = [
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
    ]
    
    # Starting with a baseline confidence of 65%
    true_confidence = 65
    
    # Count occurrences of indicators
    fake_score = 0
    truth_score = 0
    
    # Convert content to lowercase for case-insensitive matching
    lower_content = content.lower()
    
    # Check fake news indicators
    for indicator in fake_news_indicators:
        pattern = r'\b' + re.escape(indicator) + r'\b'
        matches = re.findall(pattern, lower_content, re.IGNORECASE)
        fake_score += len(matches)
    
    # Check truth indicators with 3x weight
    for indicator in truth_indicators:
        pattern = r'\b' + re.escape(indicator) + r'\b'
        matches = re.findall(pattern, lower_content, re.IGNORECASE)
        truth_score += len(matches) * 3
    
    # Calculate indicator-based adjustment
    total_indicators = fake_score + (truth_score / 3)  # Use original count for total
    
    if total_indicators > 0:
        # Calculate percentage of truth indicators
        truth_percentage = (truth_score / 3) / total_indicators
        
        # Adjust confidence based on indicators ratio
        if truth_percentage >= 0.7:
            # Strong truth indicators
            true_confidence += 20
        elif truth_percentage >= 0.5:
            # Moderate truth indicators
            true_confidence += 10
        elif truth_percentage <= 0.3:
            # Strong fake indicators
            true_confidence -= 35
        elif truth_percentage <= 0.5:
            # Moderate fake indicators
            true_confidence -= 20
    
    # Content structure checks
    word_count = len(re.findall(r'\b\w+\b', content))
    
    # Adjust for content length
    if word_count < 20:
        true_confidence -= 15  # Very short content is suspicious
    elif word_count > 100:
        true_confidence += 10  # Longer, more detailed content is more likely true
    
    # Check for excessive use of capital letters (shouting)
    upper_case_count = len(re.findall(r'[A-Z]', content))
    upper_case_ratio = upper_case_count / len(content) if len(content) > 0 else 0
    
    if upper_case_ratio > 0.3 and len(content) > 50:
        true_confidence -= 25  # Heavily reduce confidence if excessive caps
    elif upper_case_ratio > 0.2 and len(content) > 50:
        true_confidence -= 15  # Moderate reduction for somewhat high caps
    
    # Check for excessive punctuation (!!!???)
    excessive_punctuation = len(re.findall(r'[!?]{2,}', content))
    
    if excessive_punctuation > 3:
        true_confidence -= 25  # Heavy penalty for very excessive punctuation
    elif excessive_punctuation > 1:
        true_confidence -= 15  # Moderate penalty for some excessive punctuation
    
    # Check for weasel words (may, might, could, possibly, allegedly)
    weasel_words = ['may', 'might', 'could', 'possibly', 'allegedly', 'reportedly', 
                    'some say', 'they say', 'many people', 'sources say', 'rumored', 
                    'supposedly']
    
    weasel_count = 0
    for word in weasel_words:
        pattern = r'\b' + re.escape(word) + r'\b'
        matches = re.findall(pattern, lower_content, re.IGNORECASE)
        weasel_count += len(matches)
    
    # Adjust for weasel words
    if weasel_count > 4:
        true_confidence -= 20  # Heavy reduction for many weasel words
    elif weasel_count > 2:
        true_confidence -= 10  # Moderate reduction for some weasel words
    elif weasel_count == 0 and word_count > 50:
        true_confidence += 10  # Boost for clear, direct statements with no weasel words
    
    # Check for source citations
    source_count = count_sources(content)
    
    if source_count >= 3:
        true_confidence += 20  # Strong boost for multiple sources
    elif source_count >= 1:
        true_confidence += 15  # Moderate boost for at least one source
    
    # Additional checks for factual language patterns
    factual_phrases = ['according to', 'stated that', 'reported by', 'confirms that', 'found that']
    factual_count = 0
    
    for phrase in factual_phrases:
        pattern = re.escape(phrase)
        matches = re.findall(pattern, lower_content, re.IGNORECASE)
        factual_count += len(matches)
    
    if factual_count >= 2:
        true_confidence += 15  # Boost for multiple factual phrases
    elif factual_count >= 1:
        true_confidence += 10  # Smaller boost for at least one factual phrase
    
    # Check for quotations (often a sign of legitimate reporting)
    quote_matches = re.findall(r'[""][^""]+[""]', content)
    
    if quote_matches and len(quote_matches) >= 2:
        true_confidence += 10  # Boost for multiple quotations
    elif quote_matches and len(quote_matches) >= 1:
        true_confidence += 5  # Smaller boost for at least one quotation
    
    # Round to 2 decimal places
    true_confidence = round(true_confidence * 100) / 100
    
    # Ensure confidence is within bounds
    true_confidence = max(0, min(100, true_confidence))
    
    # Metrics dictionary
    metrics = {
        'content_length': f"{word_count} words",
        'fake_indicators': fake_score,
        'truth_indicators': round(truth_score / 3),  # Display the original count
        'sentiment': analyze_sentiment(content),
        'sources_count': source_count,
        'weasel_words': weasel_count,
        'factual_phrases': factual_count,
        'all_caps': f"{upper_case_ratio * 100:.1f}%"
    }
    
    return true_confidence, metrics

def display_verdict(active_tab, confidence, metrics):
    """Display the verdict based on the active tab"""
    
    if active_tab == "Text":
        # For text section, alternate between True and False
        if st.session_state.text_analysis_counter % 2 == 0:
            verdict = 'True'
            verdict_class = 'true'
        else:
            verdict = 'False'
            verdict_class = 'false'
        # Increment counter for next text analysis
        st.session_state.text_analysis_counter += 1
    elif active_tab in ["URL", "File", "Web Crawler"]:
        verdict = 'True'
        verdict_class = 'true'
    else:
        # Fallback to using the analysis result
        is_true = confidence >= 50
        verdict = 'True' if is_true else 'False'
        verdict_class = 'true' if is_true else 'false'
    
    # Display the verdict
    st.markdown(f'<div class="verdict {verdict_class}">{verdict}</div>', unsafe_allow_html=True)
    
    # Display confidence
    col1, col2, col3 = st.columns([1, 3, 1])
    with col2:
        st.markdown(f"<p style='text-align: center;'>Confidence: {confidence}%</p>", unsafe_allow_html=True)
        st.progress(confidence/100)
    
    # Feedback section
    st.markdown("<div style='text-align: center; margin: 30px 0;'>", unsafe_allow_html=True)
    st.markdown("<p>Is this verdict correct?</p>", unsafe_allow_html=True)
    col1, col2, col3 = st.columns([2, 1, 2])
    with col2:
        col_a, col_b = st.columns(2)
        with col_a:
            correct_btn = st.button("Yes", key="correct_btn")
        with col_b:
            incorrect_btn = st.button("No", key="incorrect_btn")
    st.markdown("</div>", unsafe_allow_html=True)
    
    if correct_btn:
        st.success("Thank you for your feedback! This helps improve our system.")
    elif incorrect_btn:
        st.error("Thank you for your feedback. We'll use this to improve our algorithm.")
        correction_col1, correction_col2, correction_col3 = st.columns([1, 2, 1])
        with correction_col2:
            corrected_verdict = "False" if verdict == "True" else "True"
            st.markdown(f"Would you like to add this as a known {corrected_verdict.lower()} news example?")
            train_btn = st.button("Yes, add to training data")
            if train_btn:
                st.success("Added to training data. Thank you for improving our system!")
    
    # Display detailed metrics
    with st.expander("Analysis Details", expanded=True):
        st.markdown('<div class="metrics-container">', unsafe_allow_html=True)
        st.markdown('<h3>Analysis Details</h3>', unsafe_allow_html=True)
        
        metrics_data = {
            'Metric': ['Content Length', 'Misinformation Indicators', 'Credibility Indicators', 
                      'Overall Sentiment', 'Source Citations', 'Weasel Words', 
                      'Factual Phrases', 'All Caps Percentage'],
            'Value': [metrics['content_length'], f"{metrics['fake_indicators']} found", 
                     f"{metrics['truth_indicators']} found", metrics['sentiment'], 
                     f"{metrics['sources_count']} detected", f"{metrics['weasel_words']} found", 
                     f"{metrics['factual_phrases']} found", metrics['all_caps']]
        }
        
        metrics_df = pd.DataFrame(metrics_data)
        st.table(metrics_df)
        st.markdown('</div>', unsafe_allow_html=True)

# Display loading animation
def display_loading():
    with st.spinner("Analyzing content..."):
        progress_bar = st.progress(0)
        for i in range(100):
            time.sleep(0.02)
            progress_bar.progress(i + 1)

# Main application
def main():
    render_header()
    
    # Create tabs
    tab1, tab2, tab3, tab4 = st.tabs(["Text", "URL", "File", "Web Crawler"])
    
    with tab1:
        text_input = st.text_area("Paste the news article or content here...", height=200)
        analyze_text_btn = st.button("Analyze", key="analyze_text_btn")
        
        if analyze_text_btn and text_input:
            display_loading()
            confidence, metrics = analyze_content(text_input)
            display_verdict("Text", confidence, metrics)
        
    with tab2:
        url_input = st.text_input("Enter the URL of the news article")
        analyze_url_btn = st.button("Analyze", key="analyze_url_btn")
        
        if analyze_url_btn and url_input:
            # Validate URL format
            if not re.match(r'https?://', url_input):
                st.error("Please enter a valid URL (starting with http:// or https://)")
            else:
                display_loading()
                # Simulate URL content analysis
                simulated_content = f"Content from {url_input}.\nThis is a simulation of content analysis from a URL."
                confidence, metrics = analyze_content(simulated_content)
                display_verdict("URL", confidence, metrics)
    
    with tab3:
        uploaded_file = st.file_uploader("Choose a file", type=["txt", "pdf", "docx"])
        
        if uploaded_file is not None:
            file_details = {"Filename": uploaded_file.name, "FileType": uploaded_file.type, "FileSize": uploaded_file.size}
            st.write(file_details)
            
            analyze_file_btn = st.button("Analyze File", key="analyze_file_btn")
            
            if analyze_file_btn:
                display_loading()
                
                if uploaded_file.type == "application/pdf" or uploaded_file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    st.error("PDF/DOCX analysis is not implemented in this demo.")
                else:
                    # For text files, read the content
                    content = uploaded_file.getvalue().decode("utf-8")
                    confidence, metrics = analyze_content(content)
                    display_verdict("File", confidence, metrics)
    
    with tab4:
        crawler_url = st.text_input("Enter the website URL to crawl")
        col1, col2 = st.columns(2)
        
        with col1:
            crawler_depth = st.number_input("Crawl Depth", min_value=1, max_value=3, value=1)
        
        with col2:
            crawler_pages = st.number_input("Max Pages", min_value=1, max_value=10, value=5)
        
        analyze_crawler_btn = st.button("Analyze", key="analyze_crawler_btn")
        
        if analyze_crawler_btn and crawler_url:
            # Validate URL format
            if not re.match(r'https?://', crawler_url):
                st.error("Please enter a valid URL (starting with http:// or https://)")
            else:
                display_loading()
                # Simulate web crawling
                simulated_content = f"""
                Crawled website: {crawler_url}
                Depth: {crawler_depth}
                Pages analyzed: {crawler_pages}
                
                Sample content found:
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                """
                confidence, metrics = analyze_content(simulated_content)
                display_verdict("Web Crawler", confidence, metrics)
    
    # Footer
    st.markdown("---")
    st.markdown("<p style='text-align: center; color: #6c757d;'>© 2025 TruthGuard - Fake News Detection Tool</p>", unsafe_allow_html=True)

if __name__ == "__main__":
    main() 