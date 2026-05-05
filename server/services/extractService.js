// Extract service: Vocabulary extraction from raw text
// Uses regex-based approach for Japanese and compromise for English

const extractJapanese = (text) => {
  const words = [];
  const seen = new Set();

  // Extract kanji compound words (2-4 chars)
  const kanjiPattern = /[\u4e00-\u9faf]{2,4}/g;
  let match;
  while ((match = kanjiPattern.exec(text)) !== null) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      words.push({
        front: match[0],
        back: '',
        reading: '',
        type: 'kanji'
      });
    }
  }

  // Extract katakana words
  const katakanaPattern = /[\u30a0-\u30ff]{2,}/g;
  while ((match = katakanaPattern.exec(text)) !== null) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      words.push({
        front: match[0],
        back: '',
        reading: match[0],
        type: 'katakana'
      });
    }
  }

  // Extract hiragana words (3+ chars to avoid particles)
  const hiraganaPattern = /[\u3040-\u309f]{3,}/g;
  while ((match = hiraganaPattern.exec(text)) !== null) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      words.push({
        front: match[0],
        back: '',
        reading: match[0],
        type: 'hiragana'
      });
    }
  }

  // Extract mixed kanji+hiragana words
  const mixedPattern = /[\u4e00-\u9faf][\u3040-\u309f]+[\u4e00-\u9faf]?[\u3040-\u309f]*/g;
  while ((match = mixedPattern.exec(text)) !== null) {
    if (!seen.has(match[0]) && match[0].length >= 2) {
      seen.add(match[0]);
      words.push({
        front: match[0],
        back: '',
        reading: '',
        type: 'mixed'
      });
    }
  }

  return words;
};

const extractEnglish = (text) => {
  const words = [];
  const seen = new Set();

  // Common English stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us',
    'them', 'my', 'your', 'his', 'our', 'their', 'mine', 'yours',
    'not', 'no', 'nor', 'as', 'if', 'then', 'so', 'just', 'than',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'only', 'own', 'same', 'too', 'very', 'also', 'about', 'up', 'out'
  ]);

  // Extract words (4+ chars, not stop words)
  const wordPattern = /\b[a-zA-Z]{4,}\b/g;
  let match;
  while ((match = wordPattern.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    if (!seen.has(word) && !stopWords.has(word)) {
      seen.add(word);
      words.push({
        front: word,
        back: '',
        reading: '',
        type: 'word'
      });
    }
  }

  // Extract common phrases (2-3 word combinations)
  const sentences = text.split(/[.!?;]/);
  sentences.forEach(sentence => {
    const phraseWords = sentence.trim().split(/\s+/).filter(w => w.length > 0);
    for (let i = 0; i < phraseWords.length - 1; i++) {
      const bigram = phraseWords.slice(i, i + 2).join(' ').toLowerCase();
      if (bigram.length > 5 && !seen.has(bigram)) {
        // Only add meaningful phrases
        const bigramWords = bigram.split(' ');
        if (!bigramWords.every(w => stopWords.has(w.replace(/[^a-z]/g, '')))) {
          seen.add(bigram);
        }
      }
    }
  });

  return words;
};

const extractVocabulary = (text, language) => {
  if (language === 'ja') {
    return extractJapanese(text);
  } else {
    return extractEnglish(text);
  }
};

module.exports = { extractVocabulary };
