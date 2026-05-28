const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

// GET /api/dictionary/define?word=...&lang=...
router.get('/define', protect, async (req, res) => {
  const { word, lang } = req.query;
  
  if (!word) {
    return res.status(400).json({ message: 'Word is required' });
  }

  try {
    let definition = '';
    
    if (lang === 'ja') {
      // Get direct translation and Jisho data in parallel
      try {
        const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=vi&dt=t&q=${encodeURIComponent(word)}`;
        const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`;
        
        const [transRes, jishoRes] = await Promise.all([
          axios.get(translateUrl).catch(() => null),
          axios.get(jishoUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 3000 
          }).catch(() => null)
        ]);

        // Get meaning from direct translation
        if (transRes && transRes.data && transRes.data[0] && transRes.data[0][0]) {
          definition = transRes.data[0][0][0];
        }

        // Get reading from Jisho if available
        let reading = '';
        if (jishoRes && jishoRes.data && jishoRes.data.data && jishoRes.data.data.length > 0) {
          const first = jishoRes.data.data[0];
          reading = first.japanese[0].reading || first.japanese[0].word;
          
          // If translation failed, fallback to Jisho definition
          if (!definition && first.senses && first.senses.length > 0) {
            definition = first.senses[0].english_definitions.slice(0, 2).join(', ');
          }
        }
        
        // Return both
        return res.json({ definition, reading });
      } catch (err) {
        definition = '';
      }
    } else {
      // For English, get a direct translation (faster & more concise)
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`;
        const response = await axios.get(url);
        if (response.data && response.data[0] && response.data[0][0]) {
          definition = response.data[0][0][0];
        }
      } catch (err) {
        definition = '';
      }
    }

    res.json({ definition });
  } catch (error) {
    console.error('Dictionary API error:', error.message);
    res.json({ definition: '' });
  }
});

// GET /api/dictionary/translate?text=...&sourceLang=...
router.get('/translate', protect, async (req, res) => {
  const { text, sourceLang } = req.query;
  
  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const sl = sourceLang === 'ja' ? 'ja' : 'en';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const response = await axios.get(url, { timeout: 5000 });
    
    let translatedText = text;
    if (response.data && response.data[0] && response.data[0][0]) {
      translatedText = response.data[0][0][0];
    }
    
    res.json({ translatedText });
  } catch (error) {
    console.error('Translation API error:', error.message);
    res.json({ translatedText: text });
  }
});

module.exports = router;
