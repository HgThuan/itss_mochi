import api from './api';

/**
 * Fetch definition using our backend proxy
 */
const fetchDefinitionFromProxy = async (word, lang) => {
  try {
    const response = await api.get(`/dictionary/define?word=${encodeURIComponent(word)}&lang=${lang}`);
    return response.data.definition || '';
  } catch (error) {
    console.error('Error fetching definition from proxy:', error);
    return '';
  }
};

export const fetchEnglishDefinition = async (word) => {
  return await fetchDefinitionFromProxy(word, 'en');
};

export const fetchJapaneseDefinition = async (word) => {
  return await fetchDefinitionFromProxy(word, 'ja');
};

/**
 * Translate text to Vietnamese using our backend proxy
 */
export const translateToVietnamese = async (text, sourceLang = 'en') => {
  if (!text) return '';
  try {
    const response = await api.get(`/dictionary/translate?text=${encodeURIComponent(text)}&sourceLang=${sourceLang}`);
    return response.data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};
