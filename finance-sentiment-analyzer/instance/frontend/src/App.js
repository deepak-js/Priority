import React, { useState, useEffect, Profiler } from 'react';
import axios from 'axios';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { debounce } from 'lodash';
import { FaBars, FaTimes, FaLanguage, FaFileAlt, FaChartBar, FaInfoCircle, FaQuestionCircle } from 'react-icons/fa';

const FeedbackForm = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, comment });
    setRating(0);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <h3>Provide Feedback</h3>
      <div className="rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            className={star <= rating ? 'star active' : 'star'}
          >
            ★
          </span>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Your comments..."
      ></textarea>
      <button type="submit">Submit Feedback</button>
    </form>
  );
};


function onRenderCallback(
  id, // the "id" prop of the Profiler tree that has just committed
  phase, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
  actualDuration, // time spent rendering the committed update
  baseDuration, // estimated time to render the entire subtree without memoization
  startTime, // when React began rendering this update
  commitTime, // when React committed this update
  interactions // the Set of interactions belonging to this update
) {
  console.log(`${id} render time:`, actualDuration);
}




function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inputType, setInputType] = useState('news');
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [relatedNews, setRelatedNews] = useState([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [dashboardLayout, setDashboardLayout] = useState(localStorage.getItem('dashboardLayout') || 'default');
  

  useEffect(() => {
    if (results) {
      setTimeout(() => {
        const dashboardElement = document.querySelector('.dashboard');
        if (dashboardElement) {
          window.scrollTo({
            top: dashboardElement.offsetTop - 20,
            behavior: 'smooth'
          });
        }
      }, 100); // 100ms delay
    }
  }, [results]);

  const [showFeedback, setShowFeedback] = useState(false);

const handleFeedbackSubmit = async (feedback) => {
  try {
    await axios.post('http://127.0.0.1:5000/feedback', feedback);
    alert('Thank you for your feedback!');
    setShowFeedback(false);
  } catch (error) {
    console.error('Error submitting feedback:', error);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = {
        [inputType === 'text' ? 'text' : inputType === 'url' ? 'url' : 'news_query']: input
      };
      const response = await axios.post('http://127.0.0.1:5000/analyze', data);
      setResults(response.data);

      if (inputType !== 'news') {
        const newsResponse = await axios.get(`http://127.0.0.1:5000/related_news?query=${input}`);
        setRelatedNews(newsResponse.data);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.error || 'An error occurred');
    }
    setLoading(false);
  };

  const fetchSuggestions = async (value) => {
    if (value.length > 0) {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/autocomplete?query=${value}`);
        setSuggestions(response.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (inputType === 'news') {
      debouncedFetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setSuggestions([]);
    handleSubmit(new Event('submit'));
  };

  const handleInputTypeChange = (type) => {
    setInputType(type);
    setInput('');
    setResults(null);
    setSuggestions([]);
    setRelatedNews([]);
    if (type === 'news') {
      handleSubmit(new Event('submit'));
    }
  };

  const getPlaceholder = () => {
    switch (inputType) {
      case 'text': return 'Enter your text here...';
      case 'url': return 'Enter a URL to analyze...';
      case 'news': return 'Enter a news query...';
      default: return 'Enter your input here...';
    }
  };

  const getInputDescription = () => {
    switch (inputType) {
      case 'text': return 'Analyze the sentiment of any text you enter.';
      case 'url': return 'Analyze the sentiment of a webpage by entering its URL.';
      case 'news': return 'Search for news articles and analyze their sentiment.';
      default: return 'Choose an input type and start analyzing!';
    }
  };

  const renderSentimentBars = (sentiments, confidences) => {
    const sortedSentiments = sentiments.map((sentiment, index) => ({
      sentiment,
      confidence: confidences[index]
    })).sort((a, b) => b.confidence - a.confidence);

    return (
      <div className="sentiment-bars">
        {sortedSentiments.map(({ sentiment, confidence }, index) => (
          <div key={index} className={`sentiment-bar ${sentiment.toLowerCase()}`}>
            <span>{sentiment}</span>
            <div className="bar-container">
              <div className="bar" style={{ width: `${confidence * 100}%` }}></div>
            </div>
            <span>{(confidence * 100).toFixed(2)}%</span>
          </div>
        ))}
      </div>
    );
  };

  const renderKeywords = (keywords) => (
    <div className="keywords">
      {keywords.map((keyword, index) => (
        <span key={index} className="keyword">{keyword}</span>
      ))}
    </div>
  );

  const renderNewsItem = (item, index) => {
    const sentiment = item.sentiments[0].toLowerCase();
    const confidenceScore = (item.confidences[0] * 100).toFixed(2);
    return (
      <div key={index} className={`news-item ${sentiment}`}>
        <h3>{item.title}</h3>
        <p className="sentiment-label">{sentiment}</p>
        <p className="confidence-score">{confidenceScore}%</p>
        <p className="date">{new Date(item.pub_date).toLocaleString()}</p>
        {renderKeywords(item.keywords)}
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="read-more-btn">
          Read More
        </a>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!results || results.error) return null;

    if (inputType === 'news' && Array.isArray(results)) {
      if (results.length === 0) {
        return <div className="no-results">No news results found.</div>;
      }
      return (
        <div className="news-results">
          <h2>News Analysis Results</h2>
          <div className="news-grid">
            {results.map(renderNewsItem)}
          </div>
        </div>
      );
    }

    if (typeof results === 'object' && !results.error) {
      const { sentiments, confidences, keywords } = results;
      if (!sentiments || !confidences || sentiments.length === 0 || confidences.length === 0) {
        return <div className="error-message">No sentiment data available</div>;
      }
      const primarySentiment = sentiments[0];
      const primaryConfidence = confidences[0];

      return (
        <div className="dashboard">
          <h2>Sentiment Analysis Dashboard</h2>
          <div className={`dashboard-grid ${dashboardLayout}`}>
            <div className="card primary-sentiment">
              <h3><FaChartBar /> Primary Sentiment</h3>
              <div className="sentiment-gauge">
                <div className={`gauge ${primarySentiment.toLowerCase()}`} style={{ '--percentage': `${primaryConfidence * 100}%` }}>
                  <div className="gauge-body">
                    <div className="gauge-fill"></div>
                    <div className="gauge-cover">{(primaryConfidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
              <p className="sentiment-label">{primarySentiment}</p>
            </div>
            <div className="card sentiment-distribution">
              <h3><FaChartBar /> Sentiment Distribution</h3>
              {renderSentimentBars(sentiments, confidences)}
            </div>
            <div className="card keywords">
              <h3><FaFileAlt /> Keywords</h3>
              {renderKeywords(keywords)}
            </div>
            <div className="card analysis-details">
              <h3><FaInfoCircle /> Analysis Details</h3>
              <p><FaLanguage /> <strong>Language:</strong> English</p>
              <p><FaFileAlt /> <strong>Analysis Type:</strong> {inputType === 'text' ? 'Text Input' : 'URL Content'}</p>
              {inputType === 'text' && <p><strong>Word Count:</strong> {input.split(' ').length}</p>}
              <p><strong>Primary Sentiment:</strong> {primarySentiment}</p>
              <p><strong>Confidence:</strong> {(primaryConfidence * 100).toFixed(2)}%</p>
              {inputType === 'url' && results.headline && (
                <>
                  <p className="headline"><strong>Headline:</strong> {results.headline}</p>
                  <a href={input} target="_blank" rel="noopener noreferrer" className="read-more-btn">
                    Read Full Article
                  </a>
                </>
              )}
            </div>
          </div>
          {relatedNews.length > 0 && (
            <div className="related-news">
              <h3>Related News</h3>
              <div className="news-grid">
                {relatedNews.map(renderNewsItem)}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return <div className="error-message">{results.error || 'An unexpected error occurred'}</div>;
    }
    {showFeedback && <FeedbackForm onSubmit={handleFeedbackSubmit} />}
<button onClick={() => setShowFeedback(!showFeedback)}>
  {showFeedback ? 'Hide Feedback' : 'Give Feedback'}
</button>
  };

  // Wrap the component you want to profile
<Profiler id="Dashboard" onRender={onRenderCallback}>
  {renderDashboard()}
</Profiler>

  return (
    <div className="App">
      <header>
        <div className="logo">StillProfit</div>
        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <nav className={isMenuOpen ? 'active' : ''}>
          <a href="#overview">Overview</a>
          <a href="#features">Features</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#faq">FAQ</a>
          <a href="#about">About Us</a>
        </nav>
        <button className="cta-button">Get Started →</button>
      </header>
      <main>
        <div className="hero">
          <div className="hero-content">
            <div className="ai-icon">
              <span className="glow"></span>
              <span className="icon">🤖</span>
            </div>
            <h1>Sentiment Analysis <span className="highlight">Beyond Imagination</span></h1>
            <p>One analysis away from market insights.</p>
            <div className="input-section">
              <div className="input-type-selector">
                <button
                  className={`type-button ${inputType === 'news' ? 'active' : ''}`}
                  onClick={() => handleInputTypeChange('news')}
                >
                  News
                </button>
                <button
                  className={`type-button ${inputType === 'text' ? 'active' : ''}`}
                  onClick={() => handleInputTypeChange('text')}
                >
                  Text
                </button>
                <button
                  className={`type-button ${inputType === 'url' ? 'active' : ''}`}
                  onClick={() => handleInputTypeChange('url')}
                >
                  URL
                </button>
              </div>
              <div className="input-container">
              <input
  type="text"
  value={input}
  onChange={handleInputChange}
  placeholder={getPlaceholder()}
  aria-label={`Enter ${inputType} for analysis`}
/>
                <button 
  className="analyze-button" 
  onClick={handleSubmit} 
  disabled={loading}
  aria-label="Analyze input"
>
  {loading ? 'Analyzing...' : 'Analyze'}
</button>
              </div>
              {suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
              <p className="input-description">
                {getInputDescription()}
              </p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="loading-animation">
              <div className="pulse"></div>
              <div className="pulse"></div>
              <div className="pulse"></div>
            </div>
            <p>Analyzing...</p>
          </div>
        ) : (
          renderDashboard()
        )}
      </main>
      <footer>
        <p>© 2023 StillProfit. All rights reserved.</p>
      </footer>
      {showTutorial && (
        <div className="tutorial" aria-live="polite">
          <div className="tutorial-content">
            <h2>Welcome to StillProfit!</h2>
            <p>Here's a quick guide to get you started:</p>
            <ol>
              <li>Choose your input type: News, Text, or URL.</li>
              <li>Enter your query or content in the input field.</li>
              <li>Click "Analyze" to see the sentiment analysis results.</li>
              <li>Explore the dashboard to understand the sentiment breakdown.</li>
            </ol>
            <button onClick={() => setShowTutorial(false)}>Got it!</button>
          </div>
        </div>
      )}
      <button className="help-button" onClick={() => setShowTutorial(true)} aria-label="Show tutorial">
        <FaQuestionCircle />
      </button>
    </div>
  );
}

export default App;
