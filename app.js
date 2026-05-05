let tg = window.Telegram?.WebApp || null;
let telegramInitialized = false;

function initTelegramWebApp() {1
  const webApp = window.Telegram?.WebApp;

  if (!webApp) {
    return;
  }

  tg = webApp;

  if (telegramInitialized) {
    return;
  }

  tg.ready();
  tg.expand();
  telegramInitialized = true;
}

window.initTelegramWebApp = initTelegramWebApp;

const DEFAULT_QUIZ_LENGTH = 10;
const TRAINING_SECTION_STORAGE_KEY = "accentUpTrainingSection";
const TRAINING_SECTIONS = ["accents", "paronyms"];
const MAIN_TRAINING_MODES = ["all", "allWords"];
const PRACTICE_SECTIONS = ["accents", "paronyms"];
const PRACTICE_SOURCES = ["mistakes", "favorites"];
const PRACTICE_FORMATS = ["cloze", "meaning"];
const PRACTICE_SECTION_LABELS = {
  accents: "Ударения",
  paronyms: "Паронимы",
};
const PRACTICE_SOURCE_LABELS = {
  mistakes: "Ошибки",
  favorites: "Избранное",
};
const PRACTICE_FORMAT_LABELS = {
  cloze: "Вставить слово",
  meaning: "Понять значение",
};
const QUIZ_LENGTH_STORAGE_KEY = "egeAccentQuizLength";
const MISTAKES_STORAGE_KEY = "egeAccentMistakes";
const FAVORITES_STORAGE_KEY = "egeAccentFavorites";
const PARONYM_MISTAKES_STORAGE_KEY = "accentUpParonymMistakes";
const PARONYM_FAVORITES_STORAGE_KEY = "accentUpParonymFavorites";

const accentData = window.ACCENT_DATA || {};
const paronymData = window.PARONYM_DATA || {};
const baseAccentWords = accentData.baseWords || [];
const additionalWordForms = accentData.additionalForms || [];
const extraWordForms = accentData.extraForms || [];
const additionalAccentWords = additionalWordForms.map((correct) => ({
  correct,
  wrong: makeWrongAccent(correct),
}));
const extraAccentWords = extraWordForms.map((correct) => ({
  correct,
  wrong: makeWrongAccent(correct),
}));
const duplicateWordForms = new Set(accentData.duplicateForms || []);

const accentWords = dedupeWords(
  [...baseAccentWords, ...additionalAccentWords].filter(
    (word) => !duplicateWordForms.has(normalizeText(word.correct))
  )
);
const egeWordKeys = new Set(accentWords.map((word) => normalizeText(word.correct)));
const extraWords = dedupeWords(
  extraAccentWords.filter((word) => {
    const key = normalizeText(word.correct);
    return !duplicateWordForms.has(key) && !egeWordKeys.has(key);
  })
);
const knownWords = dedupeWords([...accentWords, ...extraWords]);
const wordInfo = accentData.info || {};
const paronymPairs = normalizeParonymPairs(paronymData.pairs || []);
const egeParonymPairs = paronymPairs.filter((pair) => pair.source === "ege" || pair.tags.includes("ege"));

const tabs = document.querySelectorAll("[data-tab]");
const screens = document.querySelectorAll("[data-screen]");
const tabBar = document.querySelector(".tab-bar");
const trainingSectionButtons = document.querySelectorAll("[data-training-section]");
const modeSelect = document.getElementById("modeSelect");
const modeOptions = document.querySelectorAll("[data-mode]");
const quizLengthOptions = document.querySelectorAll("[data-quiz-length]");
const quizLengthControl = document.querySelector(".quiz-length");
const quizLengthTitle = document.querySelector(".quiz-length-copy span");
const quizLengthHint = document.querySelector(".quiz-length-copy small");
const modeTrigger = document.getElementById("modeTrigger");
const modeIcon = document.getElementById("modeIcon");
const modeLabel = document.getElementById("modeLabel");
const modeMeta = document.getElementById("modeMeta");
const modeMenu = document.getElementById("modeMenu");
const startTestButton = document.getElementById("startTestButton");
const restartTestButton = document.getElementById("restartTestButton");
const repeatMistakesButton = document.getElementById("repeatMistakesButton");
const resultBackButton = document.getElementById("resultBackButton");
const infoButton = document.getElementById("infoButton");
const infoBackButton = document.getElementById("infoBackButton");
const dictionarySearch = document.getElementById("dictionarySearch");
const dictionaryFilterButtons = document.querySelectorAll("[data-dictionary-filter]");
const dictionaryIntro = document.getElementById("dictionaryIntro");
const dictionarySummary = document.getElementById("dictionarySummary");
const dictionaryResults = document.getElementById("dictionaryResults");
const popularWordButtons = document.querySelectorAll("[data-search-word]");
const wordInfoSheet = document.getElementById("wordInfoSheet");
const wordInfoClose = document.getElementById("wordInfoClose");
const wordInfoTitle = document.getElementById("wordInfoTitle");
const wordInfoText = document.getElementById("wordInfoText");
const favoritesResults = document.getElementById("favoritesResults");
const favoritesSummary = document.getElementById("favoritesSummary");
const startFavoritesButton = document.getElementById("startFavoritesButton");
const practiceDirectionSelect = document.getElementById("practiceDirectionSelect");
const practiceDirectionTrigger = document.getElementById("practiceDirectionTrigger");
const practiceDirectionMenu = document.getElementById("practiceDirectionMenu");
const practiceSectionButtons = document.querySelectorAll("[data-practice-section]");
const practiceSourceButtons = document.querySelectorAll("[data-practice-source]");
const practiceFormatButtons = document.querySelectorAll("[data-practice-format]");
const practiceFormatWrap = document.getElementById("practiceFormatWrap");
const practicePlan = document.getElementById("practicePlan");
const practiceListTitle = document.getElementById("practiceListTitle");
const practiceCurrentIcon = document.getElementById("practiceCurrentIcon");
const practiceCurrentSection = document.getElementById("practiceCurrentSection");
const practiceCurrentMeta = document.getElementById("practiceCurrentMeta");
const practiceCurrentCount = document.getElementById("practiceCurrentCount");
const practiceAccentMeta = document.getElementById("practiceAccentMeta");
const practiceParonymMeta = document.getElementById("practiceParonymMeta");
const practiceAccentCount = document.getElementById("practiceAccentCount");
const practiceParonymCount = document.getElementById("practiceParonymCount");
const practiceMistakesCount = document.getElementById("practiceMistakesCount");
const practiceFavoritesCount = document.getElementById("practiceFavoritesCount");
const quizCounter = document.getElementById("quizCounter");
const quizProgress = document.getElementById("quizProgress");
const quizProgressBar = document.getElementById("quizProgressBar");
const quizBackButton = document.getElementById("quizBackButton");
const quizFavoriteButton = document.getElementById("quizFavoriteButton");
const quizQuestion = document.getElementById("quizQuestion");
const answerGrid = document.getElementById("answerGrid");
const quizFeedback = document.getElementById("quizFeedback");
const resultCard = document.querySelector(".result-card");
const resultVerdict = document.getElementById("resultVerdict");
const resultScore = document.getElementById("resultScore");
const resultDetails = document.getElementById("resultDetails");
const egeWordsCount = document.getElementById("egeWordsCount");
const allWordsCount = document.getElementById("allWordsCount");
const mistakesCount = document.getElementById("mistakesCount");
const favoritesCount = document.getElementById("favoritesCount");
const modeHint = document.getElementById("modeHint");

let quizQuestions = [];
let quizIndex = 0;
let answerLocked = false;
let selectedTrainingSection = loadTrainingSection();
let selectedMode = "all";
let selectedDictionaryFilter = "all";
let selectedQuizLength = loadQuizLength();
let selectedPracticeSection = "accents";
let selectedPracticeSource = "mistakes";
let selectedPracticeFormat = "cloze";
let mistakes = loadMistakes();
let favorites = loadFavorites();
let paronymMistakes = loadStorageMap(PARONYM_MISTAKES_STORAGE_KEY);
let paronymFavorites = loadStorageMap(PARONYM_FAVORITES_STORAGE_KEY);
let quizCorrectCount = 0;
let quizMistakeCount = 0;
let currentTestMistakes = [];
let quizAdvanceTimer = null;
let activeQuizSection = "accents";

const modeIconMarkup = {
  all: `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M6.5 4.5h8.2L18 7.8v11.7H6.5v-15Z" />
      <path d="M14.5 4.5v3.5H18" />
      <path d="M9 12h6" />
      <path d="m9 16 1.4 1.4L14 13.8" />
    </svg>
  `,
  mistakes: `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M12 4.2 21 19H3L12 4.2Z" />
      <path d="M12 9v5" />
      <path d="M12 17.2h.01" />
    </svg>
  `,
  favorites: `
    <svg viewBox="0 0 24 24" focusable="false" class="bookmark-icon">
      <path d="M6 4.8C6 3.8 6.8 3 7.8 3h8.4c1 0 1.8.8 1.8 1.8V21l-6-3.4L6 21V4.8Z" />
      <path d="m12 7.1 1.15 2.33 2.57.37-1.86 1.82.44 2.56L12 12.96l-2.3 1.22.44-2.56L8.28 9.8l2.57-.37L12 7.1Z" />
    </svg>
  `,
  allWords: `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M6 5.5h10.5A1.5 1.5 0 0 1 18 7v11.5H7.5A2.5 2.5 0 0 1 5 16V6.5a1 1 0 0 1 1-1Z" />
      <path d="M8 5.5V18" />
      <path d="M10.5 9h4.5" />
      <path d="M10.5 12h3.5" />
      <path d="M18 8h1a1 1 0 0 1 1 1v11H8" />
    </svg>
  `,
  paronyms: `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M5.5 6.5h6.2a3.8 3.8 0 0 1 0 7.6H5.5V6.5Z" />
      <path d="M8 10.3h4" />
      <path d="M18.5 7.2v9.6" />
      <path d="M15.5 10.2 18.5 7.2l3 3" />
      <path d="M15.5 13.8l3 3 3-3" />
    </svg>
  `,
};

initTelegramWebApp();

function plainWord(value) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .trim();
}

function normalizeText(value) {
  return plainWord(value);
}

function dedupeWords(words) {
  const seen = new Set();

  return words.filter((word) => {
    const key = normalizeText(word.correct);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeParonymPairs(pairs) {
  return pairs
    .filter((pair) => pair && Array.isArray(pair.entries) && pair.entries.length >= 2)
    .map((pair) => {
      const entries = pair.entries
        .filter((entry) => entry?.word)
        .map((entry) => ({
          word: entry.word.trim(),
          meaning: entry.meaning || "",
          example: entry.example || "",
        }));
      const words = entries.map((entry) => entry.word);
      const id = pair.id || words.map(normalizeText).join("-");
      const tags = Array.isArray(pair.tags) ? pair.tags : [];

      return {
        id,
        source: pair.source || "ege",
        status: pair.status || (entries.some((entry) => entry.meaning || entry.example) ? "ready" : "draft"),
        tags,
        entries,
        words,
        title: words.join(" / "),
      };
    })
    .filter((pair) => pair.entries.length >= 2);
}

function hasParonymMeaning(entry) {
  return Boolean(entry?.meaning?.trim());
}

function hasParonymExample(entry) {
  return Boolean(entry?.example?.trim());
}

function getParonymEntryMeaning(entry) {
  return hasParonymMeaning(entry) ? entry.meaning : "значение добавим позже";
}

function getPlayableParonymEntries(pair, format = "cloze") {
  return pair.entries.filter((entry) => {
    if (format === "meaning") {
      return hasParonymMeaning(entry);
    }

    return hasParonymExample(entry) || hasParonymMeaning(entry);
  });
}

function getPlayableParonymPairs(pairs, format = "cloze") {
  return pairs.filter((pair) => getPlayableParonymEntries(pair, format).length > 0);
}

function makeWrongAccent(correct) {
  const vowels = "аеёиоуыэюя";
  const letters = [...correct];
  const lowerLetters = letters.map((letter) =>
    letter.toLocaleLowerCase("ru-RU").replace(/ё/g, "е")
  );
  const stressedIndex = letters.findIndex((letter) => {
    const lower = letter.toLocaleLowerCase("ru-RU");
    return letter !== lower && vowels.includes(lower);
  });
  const vowelIndexes = lowerLetters
    .map((letter, index) => (vowels.includes(letter) ? index : -1))
    .filter((index) => index !== -1);
  const wrongIndex = vowelIndexes.find((index) => index !== stressedIndex);

  if (wrongIndex === undefined) {
    return correct;
  }

  return lowerLetters
    .map((letter, index) => (index === wrongIndex ? letter.toLocaleUpperCase("ru-RU") : letter))
    .join("");
}

function formatStress(value) {
  const vowels = "аеёиоуыэюя";

  return [...value]
    .map((letter) => {
      const lower = letter.toLocaleLowerCase("ru-RU");
      const isStressedVowel = letter !== lower && vowels.includes(lower);

      if (isStressedVowel && lower === "ё") {
        return "ё";
      }

      if (isStressedVowel) {
        return `${lower}\u0301`;
      }

      return lower;
    })
    .join("");
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function loadStorageMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function loadMistakes() {
  try {
    return JSON.parse(localStorage.getItem(MISTAKES_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveMistakes() {
  localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify(mistakes));
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

function loadTrainingSection() {
  const savedSection = localStorage.getItem(TRAINING_SECTION_STORAGE_KEY);

  return TRAINING_SECTIONS.includes(savedSection) ? savedSection : "accents";
}

function saveTrainingSection() {
  localStorage.setItem(TRAINING_SECTION_STORAGE_KEY, selectedTrainingSection);
}

function saveParonymMistakes() {
  localStorage.setItem(PARONYM_MISTAKES_STORAGE_KEY, JSON.stringify(paronymMistakes));
}

function saveParonymFavorites() {
  localStorage.setItem(PARONYM_FAVORITES_STORAGE_KEY, JSON.stringify(paronymFavorites));
}

function loadQuizLength() {
  const savedLength = Number(localStorage.getItem(QUIZ_LENGTH_STORAGE_KEY));

  return [5, 10, 20].includes(savedLength) ? savedLength : DEFAULT_QUIZ_LENGTH;
}

function saveQuizLength() {
  localStorage.setItem(QUIZ_LENGTH_STORAGE_KEY, String(selectedQuizLength));
}

function setQuizLength(length) {
  selectedQuizLength = [5, 10, 20].includes(length) ? length : DEFAULT_QUIZ_LENGTH;
  saveQuizLength();

  quizLengthOptions.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.quizLength) === selectedQuizLength);
  });

  renderFavorites();
}

function isFavorite(word) {
  if (isParonymItem(word)) {
    const pair = getParonymPairFromItem(word);
    return Boolean(pair && paronymFavorites[pair.id]);
  }

  return Boolean(favorites[normalizeText(word.correct)]);
}

function toggleFavorite(word) {
  if (isParonymItem(word)) {
    const pair = getParonymPairFromItem(word);

    if (!pair) {
      return;
    }

    if (paronymFavorites[pair.id]) {
      delete paronymFavorites[pair.id];
    } else {
      paronymFavorites[pair.id] = {
        id: pair.id,
        title: pair.title,
        words: pair.words,
      };
    }

    saveParonymFavorites();
    renderModeState();
    renderDictionary();
    renderFavorites();
    renderQuizFavoriteButton();
    return;
  }

  const key = normalizeText(word.correct);

  if (favorites[key]) {
    delete favorites[key];
  } else {
    favorites[key] = {
      correct: word.correct,
      wrong: word.wrong,
    };
  }

  saveFavorites();
  renderModeState();
  renderDictionary();
  renderFavorites();
  renderQuizFavoriteButton();
}

function createFavoriteButton(word) {
  const button = document.createElement("button");
  const active = isFavorite(word);
  const itemName = isParonymItem(word) ? "пару" : "слово";
  button.className = "favorite-button";
  button.type = "button";
  button.textContent = "★";
  button.classList.toggle("active", active);
  button.setAttribute("aria-label", active ? `Убрать ${itemName} из избранного` : `Добавить ${itemName} в избранное`);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(word);
  });

  return button;
}

function updateFavoriteButton(button, word) {
  if (!button || !word) {
    button?.classList.remove("active");
    return;
  }

  const active = isFavorite(word);
  const itemName = isParonymItem(word) ? "пару" : "слово";
  button.classList.toggle("active", active);
  button.setAttribute("aria-label", active ? `Убрать ${itemName} из избранного` : `Добавить ${itemName} в избранное`);
}

function isParonymItem(item) {
  return Boolean(item?.type === "paronym" || item?.pair || Array.isArray(item?.entries));
}

function getParonymPairFromItem(item) {
  if (!item) {
    return null;
  }

  if (item.pair) {
    return item.pair;
  }

  if (Array.isArray(item.entries)) {
    return item;
  }

  if (item.id) {
    return paronymPairs.find((pair) => pair.id === item.id) || null;
  }

  return null;
}

function updateMistakeStats(word, isCorrect) {
  if (isParonymItem(word)) {
    updateParonymMistakeStats(word, isCorrect);
    return;
  }

  const key = normalizeText(word.correct);

  if (!isCorrect) {
    mistakes[key] = {
      correct: word.correct,
      wrong: word.wrong,
      count: (mistakes[key]?.count || 0) + 1,
    };
    saveMistakes();
    renderModeState();
    renderFavorites();
    return;
  }

  if (selectedMode === "mistakes" && mistakes[key]) {
    mistakes[key].count -= 1;

    if (mistakes[key].count <= 0) {
      delete mistakes[key];
    }

    saveMistakes();
    renderModeState();
    renderFavorites();
  }
}

function updateParonymMistakeStats(item, isCorrect) {
  const pair = getParonymPairFromItem(item);

  if (!pair) {
    return;
  }

  if (!isCorrect) {
    paronymMistakes[pair.id] = {
      id: pair.id,
      title: pair.title,
      words: pair.words,
      count: (paronymMistakes[pair.id]?.count || 0) + 1,
    };
    saveParonymMistakes();
    renderModeState();
    renderFavorites();
    return;
  }

  if (selectedMode === "mistakes" && paronymMistakes[pair.id]) {
    paronymMistakes[pair.id].count -= 1;

    if (paronymMistakes[pair.id].count <= 0) {
      delete paronymMistakes[pair.id];
    }

    saveParonymMistakes();
    renderModeState();
    renderFavorites();
  }
}

function getMistakeWords() {
  const mistakeKeys = new Set(Object.keys(mistakes));
  return knownWords.filter((word) => mistakeKeys.has(normalizeText(word.correct)));
}

function getFavoriteWords() {
  const favoriteKeys = new Set(Object.keys(favorites));
  return knownWords.filter((word) => favoriteKeys.has(normalizeText(word.correct)));
}

function getParonymMistakePairs() {
  const mistakeKeys = new Set(Object.keys(paronymMistakes));
  return paronymPairs.filter((pair) => mistakeKeys.has(pair.id));
}

function getParonymFavoritePairs() {
  const favoriteKeys = new Set(Object.keys(paronymFavorites));
  return paronymPairs.filter((pair) => favoriteKeys.has(pair.id));
}

function uniqueAccentWords(items) {
  const seen = new Set();
  return items.filter((word) => {
    const key = normalizeText(word.correct);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function uniqueParonymPairs(items) {
  const seen = new Set();
  return items.filter((pair) => {
    if (seen.has(pair.id)) {
      return false;
    }

    seen.add(pair.id);
    return true;
  });
}

function getPracticeAccentWords(source = selectedPracticeSource) {
  const mistakeWords = getMistakeWords();
  const favoriteWords = getFavoriteWords();

  if (source === "mistakes") {
    return mistakeWords;
  }

  if (source === "favorites") {
    return favoriteWords;
  }

  return uniqueAccentWords([...mistakeWords, ...favoriteWords]);
}

function getPracticeParonymPairs(source = selectedPracticeSource) {
  const mistakePairs = getParonymMistakePairs();
  const favoritePairs = getParonymFavoritePairs();

  if (source === "mistakes") {
    return mistakePairs;
  }

  if (source === "favorites") {
    return favoritePairs;
  }

  return uniqueParonymPairs([...mistakePairs, ...favoritePairs]);
}

function getPracticeItems(section = selectedPracticeSection, source = selectedPracticeSource) {
  return section === "paronyms"
    ? getPracticeParonymPairs(source)
    : getPracticeAccentWords(source);
}

function getPracticeCounts(section = selectedPracticeSection) {
  if (section === "paronyms") {
    const mistakePairs = getParonymMistakePairs();
    const favoritePairs = getParonymFavoritePairs();

    return {
      mistakes: mistakePairs.length,
      favorites: favoritePairs.length,
      mixed: uniqueParonymPairs([...mistakePairs, ...favoritePairs]).length,
    };
  }

  const mistakeWords = getMistakeWords();
  const favoriteWords = getFavoriteWords();

  return {
    mistakes: mistakeWords.length,
    favorites: favoriteWords.length,
    mixed: uniqueAccentWords([...mistakeWords, ...favoriteWords]).length,
  };
}

function getSelectedParonymPairs() {
  const format = getParonymQuestionFormat();

  if (selectedMode === "mistakes") {
    return getPlayableParonymPairs(getParonymMistakePairs(), format);
  }

  if (selectedMode === "favorites") {
    return getPlayableParonymPairs(getParonymFavoritePairs(), format);
  }

  if (selectedMode === "allWords") {
    return getPlayableParonymPairs(egeParonymPairs, format);
  }

  return getPlayableParonymPairs(egeParonymPairs, format);
}

function getSelectedModeWords() {
  if (selectedMode === "mistakes") {
    return getMistakeWords();
  }

  if (selectedMode === "favorites") {
    return getFavoriteWords();
  }

  if (selectedMode === "allWords") {
    return knownWords;
  }

  return accentWords;
}

function getDictionaryItems() {
  const accentItems = knownWords.map((word) => ({
    type: "accent",
    word,
  }));
  const paronymItems = paronymPairs.map((pair) => ({
    type: "paronym",
    pair,
  }));

  if (selectedDictionaryFilter === "accents") {
    return accentItems;
  }

  if (selectedDictionaryFilter === "paronyms") {
    return paronymItems;
  }

  return [...accentItems, ...paronymItems];
}

function matchesDictionaryQuery(item, query) {
  if (item.type === "paronym") {
    const pair = item.pair;
    const searchable = [
      pair.title,
      ...pair.entries.flatMap((entry) => [entry.word, entry.meaning, entry.example]),
    ].join(" ");

    return normalizeText(searchable).includes(query);
  }

  return normalizeText(item.word.correct).includes(query);
}

function getWordInfo(word) {
  return wordInfo[normalizeText(word.correct)];
}

function getWordSource(word) {
  return egeWordKeys.has(normalizeText(word.correct)) ? "ЕГЭ" : "Сложное";
}

function openWordInfo(info) {
  if (!wordInfoSheet || !wordInfoTitle || !wordInfoText || !info) {
    return;
  }

  wordInfoTitle.textContent = info.title;
  wordInfoText.textContent = info.text;
  wordInfoSheet.hidden = false;
  requestAnimationFrame(() => {
    wordInfoSheet.classList.add("open");
  });
}

function closeWordInfo() {
  if (!wordInfoSheet) {
    return;
  }

  wordInfoSheet.classList.remove("open");
  window.setTimeout(() => {
    wordInfoSheet.hidden = true;
  }, 180);
}

function getResultVerdict(correctCount, totalCount) {
  const percent = totalCount ? correctCount / totalCount : 0;

  if (percent === 1) {
    return "Идеально";
  }

  if (percent >= 0.8) {
    return "Отлично";
  }

  if (percent >= 0.6) {
    return "Хорошо";
  }

  if (percent >= 0.5) {
    return "Нужно повторить";
  }

  return "Есть что добить";
}

function getResultTone(correctCount, totalCount) {
  const percent = totalCount ? correctCount / totalCount : 0;

  if (percent >= 0.8) {
    return "good";
  }

  if (percent >= 0.5) {
    return "mid";
  }

  return "low";
}

function formatWordCount(count) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${count} слов`;
  }

  if (last === 1) {
    return `${count} слово`;
  }

  if (last >= 2 && last <= 4) {
    return `${count} слова`;
  }

  return `${count} слов`;
}

function formatPairCount(count) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${count} пар`;
  }

  if (last === 1) {
    return `${count} пара`;
  }

  if (last >= 2 && last <= 4) {
    return `${count} пары`;
  }

  return `${count} пар`;
}

function getAccentModeDetails(mode) {
  const mistakeCount = Object.keys(mistakes).length;
  const favoriteCount = getFavoriteWords().length;

  const details = {
    all: {
      icon: "all",
      label: "ЕГЭ слова",
      meta: formatWordCount(accentWords.length),
      count: accentWords.length,
      empty: false,
    },
    mistakes: {
      icon: "mistakes",
      label: "Мои ошибки",
      meta: mistakeCount ? formatWordCount(mistakeCount) : "Ошибок пока нет",
      count: mistakeCount,
      empty: mistakeCount === 0,
    },
    favorites: {
      icon: "favorites",
      label: "Избранное",
      meta: favoriteCount ? formatWordCount(favoriteCount) : "Избранных слов пока нет",
      count: favoriteCount,
      empty: favoriteCount === 0,
    },
    allWords: {
      icon: "allWords",
      label: "Все слова",
      meta: formatWordCount(knownWords.length),
      count: knownWords.length,
      empty: false,
    },
  };

  return details[mode] || details.all;
}

function getParonymModeDetails(mode) {
  const egeCount = egeParonymPairs.length;
  const clozeCount = getPlayableParonymPairs(egeParonymPairs, "cloze").length;
  const meaningCount = getPlayableParonymPairs(egeParonymPairs, "meaning").length;
  const mistakeCount = getParonymMistakePairs().length;
  const favoriteCount = getParonymFavoritePairs().length;

  const details = {
    all: {
      icon: "paronyms",
      label: "Вставить слово",
      meta: egeCount ? `${formatPairCount(clozeCount)} готово • ${formatPairCount(egeCount)} в словнике` : "База паронимов пока пустая",
      count: clozeCount,
      empty: clozeCount === 0,
    },
    mistakes: {
      icon: "mistakes",
      label: "Мои ошибки",
      meta: mistakeCount ? formatPairCount(mistakeCount) : "Ошибок по паронимам пока нет",
      count: mistakeCount,
      empty: mistakeCount === 0,
    },
    favorites: {
      icon: "favorites",
      label: "Избранное",
      meta: favoriteCount ? formatPairCount(favoriteCount) : "Избранных пар пока нет",
      count: favoriteCount,
      empty: favoriteCount === 0,
    },
    allWords: {
      icon: "allWords",
      label: "Понять значение",
      meta: egeCount ? `${formatPairCount(meaningCount)} готово • ${formatPairCount(egeCount)} в словнике` : "База паронимов пока пустая",
      count: meaningCount,
      empty: meaningCount === 0,
    },
  };

  return details[mode] || details.all;
}

function getModeDetails(mode) {
  return selectedTrainingSection === "paronyms"
    ? getParonymModeDetails(mode)
    : getAccentModeDetails(mode);
}

function isVisibleModeForSection(mode) {
  return MAIN_TRAINING_MODES.includes(mode);
}

function syncModeOptionActive() {
  modeOptions.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === selectedMode);
  });
}

function renderTrainingSection() {
  const isParonyms = selectedTrainingSection === "paronyms";

  document.body.dataset.trainingSection = selectedTrainingSection;

  trainingSectionButtons.forEach((button) => {
    const active = button.dataset.trainingSection === selectedTrainingSection;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  modeSelect?.classList.remove("section-disabled");
  quizLengthControl?.classList.remove("section-disabled");
}

function setTrainingSection(section) {
  const nextSection = TRAINING_SECTIONS.includes(section) ? section : "accents";
  const sectionChanged = selectedTrainingSection !== nextSection;

  selectedTrainingSection = nextSection;

  if (sectionChanged) {
    selectedMode = "all";
    syncModeOptionActive();
  }

  saveTrainingSection();
  setModeMenuOpen(false);
  renderTrainingSection();
  renderModeState();
}

function renderModeState() {
  const currentMode = getModeDetails(selectedMode);
  const isParonyms = selectedTrainingSection === "paronyms";

  modeOptions.forEach((button) => {
    const mode = button.dataset.mode;
    const isVisible = isVisibleModeForSection(mode);
    button.hidden = !isVisible;

    if (!isVisible) {
      return;
    }

    const details = getModeDetails(mode);
    const optionIcon = button.querySelector(".mode-option-icon");
    const optionTitle = button.querySelector(".mode-option-text strong");
    const optionMeta = button.querySelector(".mode-option-text small");
    const optionBadge = button.querySelector(".mode-badge");

    button.classList.toggle("empty", details.empty);

    if (optionIcon) {
      optionIcon.innerHTML = modeIconMarkup[details.icon] || modeIconMarkup.all;
    }

    if (optionTitle) {
      optionTitle.textContent = details.label;
    }

    if (optionMeta) {
      optionMeta.textContent = details.meta;
    }

    if (optionBadge) {
      optionBadge.textContent = details.count;
    }
  });

  if (modeIcon) {
    modeIcon.innerHTML = modeIconMarkup[currentMode.icon] || modeIconMarkup.all;
  }

  if (modeLabel) {
    modeLabel.textContent = currentMode.label;
  }

  if (modeMeta) {
    modeMeta.textContent = currentMode.meta;
  }

  if (modeHint) {
    modeHint.textContent = isParonyms
      ? currentMode.empty
        ? currentMode.meta
        : ""
      : currentMode.empty
        ? currentMode.meta
        : "";
  }

  if (modeTrigger) {
    modeTrigger.disabled = false;
  }

  quizLengthOptions.forEach((button) => {
    button.disabled = false;
  });

  if (startTestButton) {
    startTestButton.disabled = currentMode.empty;
    startTestButton.textContent = "Начать тест";
  }

  if (quizLengthTitle) {
    quizLengthTitle.textContent = isParonyms ? "Вопросов в тесте" : "Слов в тесте";
  }

  if (quizLengthHint) {
    quizLengthHint.textContent = isParonyms ? "Выбери длину" : "Выбери длину";
  }
}

function setMode(mode) {
  selectedMode = mode;
  syncModeOptionActive();

  renderModeState();
}

function setModeMenuOpen(isOpen) {
  if (!modeMenu || !modeTrigger) {
    return;
  }

  modeMenu.classList.toggle("open", isOpen);
  modeMenu.setAttribute("aria-hidden", String(!isOpen));
  modeTrigger.setAttribute("aria-expanded", String(isOpen));
}

function setPracticeDirectionMenuOpen(isOpen) {
  if (!practiceDirectionMenu || !practiceDirectionTrigger) {
    return;
  }

  practiceDirectionMenu.classList.toggle("open", isOpen);
  practiceDirectionMenu.setAttribute("aria-hidden", String(!isOpen));
  practiceDirectionTrigger.setAttribute("aria-expanded", String(isOpen));
}

function showScreen(screenName) {
  const nextScreen = ["dictionary", "quiz", "result", "favorites", "info"].includes(screenName)
    ? screenName
    : "test";

  document.body.dataset.screen = nextScreen;

  if (nextScreen === "test" && !isVisibleModeForSection(selectedMode)) {
    selectedMode = "all";
    syncModeOptionActive();
  }

  if (nextScreen !== "test") {
    setModeMenuOpen(false);
  }

  if (nextScreen !== "favorites") {
    setPracticeDirectionMenuOpen(false);
  }

  if (nextScreen !== "dictionary") {
    closeWordInfo();
  }

  screens.forEach((screen) => {
    const isActive = screen.dataset.screen === nextScreen;
    screen.hidden = !isActive;
    screen.classList.toggle("active", isActive);
  });

  tabs.forEach((tab) => {
    const activeTab = nextScreen === "dictionary" || nextScreen === "favorites" ? nextScreen : "test";
    tab.classList.toggle("active", tab.dataset.tab === activeTab);
  });

  if (tabBar) {
    tabBar.hidden = nextScreen === "quiz" || nextScreen === "result" || nextScreen === "info";
  }

  if (nextScreen === "dictionary") {
    dictionarySearch.focus();
  }

  if (nextScreen === "favorites") {
    renderFavorites();
  }

  if (nextScreen === "test") {
    renderModeState();
  }
}

function renderAccentDictionaryRow(word, target = dictionaryResults) {
  const row = document.createElement("div");
  row.className = "word-row dictionary-row";
  const copy = document.createElement("span");
  copy.className = "word-copy";
  const wordLine = document.createElement("span");
  wordLine.className = "word-line";
  const text = document.createElement("span");
  const info = getWordInfo(word);
  text.textContent = formatStress(word.correct);

  wordLine.append(text);

  if (info) {
    const helpButton = document.createElement("button");
    helpButton.className = "word-help-button";
    helpButton.type = "button";
    helpButton.textContent = "?";
    helpButton.setAttribute("aria-label", `Описание слова ${formatStress(word.correct)}`);
    helpButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openWordInfo(info);
    });
    wordLine.append(helpButton);
  }

  copy.append(wordLine);
  const source = document.createElement("small");
  source.className = "word-source-badge";
  source.textContent = getWordSource(word);
  copy.append(source);

  row.append(copy, createFavoriteButton(word));
  target.append(row);
}

function renderParonymRow(pair, target = dictionaryResults) {
  const row = document.createElement("div");
  row.className = "word-row dictionary-row paronym-row";
  const copy = document.createElement("span");
  copy.className = "word-copy";
  const wordLine = document.createElement("span");
  wordLine.className = "word-line";
  const title = document.createElement("span");
  const entries = document.createElement("span");
  const source = document.createElement("small");
  const toggleButton = document.createElement("button");

  title.textContent = pair.title;
  entries.className = "paronym-entry-list";
  entries.hidden = true;
  pair.entries.forEach((entry) => {
    const entryLine = document.createElement("span");
    const word = document.createElement("strong");
    word.textContent = entry.word;
    entryLine.classList.toggle("pending", !hasParonymMeaning(entry));
    entryLine.append(word, document.createTextNode(` - ${getParonymEntryMeaning(entry)}`));
    entries.append(entryLine);
  });

  source.className = "word-source-badge paronym-badge";
  source.textContent = pair.source === "ege" ? "ЕГЭ паронимы" : "Паронимы";
  toggleButton.className = "paronym-toggle";
  toggleButton.type = "button";
  toggleButton.setAttribute("aria-label", "Показать значения");
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const expanded = row.classList.toggle("open");
    entries.hidden = !expanded;
    toggleButton.setAttribute("aria-expanded", String(expanded));
    toggleButton.setAttribute("aria-label", expanded ? "Скрыть значения" : "Показать значения");
  });

  wordLine.append(title, toggleButton);
  copy.append(wordLine, entries, source);
  row.append(copy, createFavoriteButton(pair));
  target.append(row);
}

function renderDictionary() {
  const query = normalizeText(dictionarySearch.value.trim());
  dictionaryResults.innerHTML = "";

  if (dictionaryIntro) {
    dictionaryIntro.hidden = Boolean(query);
  }

  if (dictionarySummary) {
    dictionarySummary.hidden = !query;
  }

  dictionaryResults.hidden = !query;

  if (!query) {
    return;
  }

  const items = getDictionaryItems().filter((item) => matchesDictionaryQuery(item, query));

  if (dictionarySummary) {
    dictionarySummary.textContent = items.length
      ? `Найдено: ${items.length}`
      : "Ничего не найдено";
  }

  if (!items.length) {
    dictionaryResults.innerHTML = `
      <div class="empty-state dictionary-empty-result">
        <strong>Такого слова пока нет</strong>
        <span>Попробуй изменить запрос или найти слово по другой части.</span>
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    if (item.type === "paronym") {
      renderParonymRow(item.pair);
      return;
    }

    renderAccentDictionaryRow(item.word);
  });
}

function renderDictionaryFilter() {
  dictionaryFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.dictionaryFilter === selectedDictionaryFilter);
  });
}

function renderFavorites() {
  if (!favoritesResults) {
    return;
  }

  const accentCounts = getPracticeCounts("accents");
  const paronymCounts = getPracticeCounts("paronyms");
  let activeCounts = getPracticeCounts(selectedPracticeSection);

  if (!activeCounts[selectedPracticeSource] && activeCounts.mixed) {
    selectedPracticeSource = PRACTICE_SOURCES.find((source) => activeCounts[source]) || "mistakes";
    activeCounts = getPracticeCounts(selectedPracticeSection);
  }

  const activeItems = getPracticeItems();
  const totalFavorites = accentCounts.favorites + paronymCounts.favorites;
  const totalMistakes = accentCounts.mistakes + paronymCounts.mistakes;
  const total = totalFavorites + totalMistakes;
  favoritesResults.innerHTML = "";

  if (favoritesSummary) {
    const parts = [];

    if (totalMistakes) {
      parts.push(`${totalMistakes} ошибок`);
    }

    if (totalFavorites) {
      parts.push(`${totalFavorites} в избранном`);
    }

    favoritesSummary.textContent = parts.length ? parts.join(" • ") : "0 для практики";
  }

  if (practiceAccentMeta) {
    practiceAccentMeta.textContent = `${accentCounts.mistakes} ошибок • ${accentCounts.favorites} избранного`;
  }

  if (practiceParonymMeta) {
    practiceParonymMeta.textContent = `${paronymCounts.mistakes} ошибок • ${paronymCounts.favorites} избранного`;
  }

  if (practiceAccentCount) {
    practiceAccentCount.textContent = accentCounts.mixed;
  }

  if (practiceParonymCount) {
    practiceParonymCount.textContent = paronymCounts.mixed;
  }

  if (practiceCurrentIcon) {
    practiceCurrentIcon.innerHTML = selectedPracticeSection === "paronyms"
      ? modeIconMarkup.paronyms
      : modeIconMarkup.all;
  }

  if (practiceCurrentSection) {
    practiceCurrentSection.textContent = PRACTICE_SECTION_LABELS[selectedPracticeSection];
  }

  if (practiceCurrentMeta) {
    practiceCurrentMeta.textContent = `${activeCounts.mistakes} ошибок • ${activeCounts.favorites} избранного`;
  }

  if (practiceCurrentCount) {
    practiceCurrentCount.textContent = activeCounts.mixed;
  }

  practiceSectionButtons.forEach((button) => {
    const active = button.dataset.practiceSection === selectedPracticeSection;
    const count = getPracticeCounts(button.dataset.practiceSection).mixed;
    button.classList.toggle("active", active);
    button.classList.toggle("empty", count === 0);
    button.setAttribute("aria-pressed", String(active));
  });

  practiceSourceButtons.forEach((button) => {
    const source = button.dataset.practiceSource;
    const active = source === selectedPracticeSource;
    const count = activeCounts[source] || 0;
    button.classList.toggle("active", active);
    button.classList.toggle("empty", count === 0);
    button.disabled = count === 0;
    button.setAttribute("aria-pressed", String(active));
  });

  if (practiceMistakesCount) {
    practiceMistakesCount.textContent = activeCounts.mistakes;
  }

  if (practiceFavoritesCount) {
    practiceFavoritesCount.textContent = activeCounts.favorites;
  }

  if (practiceFormatWrap) {
    practiceFormatWrap.hidden = selectedPracticeSection !== "paronyms";
  }

  practiceFormatButtons.forEach((button) => {
    const active = button.dataset.practiceFormat === selectedPracticeFormat;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (startFavoritesButton) {
    startFavoritesButton.hidden = false;
    startFavoritesButton.disabled = !activeItems.length;
    startFavoritesButton.textContent = activeItems.length ? "Начать практику" : "Нечего повторять";
  }

  if (practicePlan) {
    const sectionLabel = PRACTICE_SECTION_LABELS[selectedPracticeSection];
    const sourceLabel = PRACTICE_SOURCE_LABELS[selectedPracticeSource];
    const formatLabel = selectedPracticeSection === "paronyms"
      ? ` • ${PRACTICE_FORMAT_LABELS[selectedPracticeFormat]}`
      : "";
    practicePlan.textContent = activeItems.length
      ? `${sectionLabel} • ${sourceLabel}${formatLabel} • ${Math.min(selectedQuizLength, activeItems.length)} заданий`
      : `${sectionLabel} • ${sourceLabel} • пусто`;
  }

  if (practiceListTitle) {
    practiceListTitle.textContent = `${PRACTICE_SOURCE_LABELS[selectedPracticeSource]} • ${activeItems.length}`;
  }

  if (!activeItems.length) {
    favoritesResults.innerHTML = `
      <div class="empty-state favorites-empty">
        <span class="empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" class="bookmark-icon">
            <path d="M6 4.8C6 3.8 6.8 3 7.8 3h8.4c1 0 1.8.8 1.8 1.8V21l-6-3.4L6 21V4.8Z" />
            <path d="m12 7.1 1.15 2.33 2.57.37-1.86 1.82.44 2.56L12 12.96l-2.3 1.22.44-2.56L8.28 9.8l2.57-.37L12 7.1Z" />
          </svg>
        </span>
        <strong>Пока пусто</strong>
        <span>Ошибки появятся после тестов, избранное можно добавить звездочкой в тесте или словаре.</span>
      </div>
    `;
    return;
  }

  if (selectedPracticeSection === "paronyms") {
    activeItems.forEach((pair) => renderParonymRow(pair, favoritesResults));
    return;
  }

  activeItems.forEach((word) => renderAccentDictionaryRow(word, favoritesResults));
}

function setPracticeSection(section) {
  selectedPracticeSection = PRACTICE_SECTIONS.includes(section) ? section : "accents";
  setPracticeDirectionMenuOpen(false);
  renderFavorites();
}

function setPracticeSource(source) {
  selectedPracticeSource = PRACTICE_SOURCES.includes(source) ? source : "mistakes";
  renderFavorites();
}

function setPracticeFormat(format) {
  selectedPracticeFormat = PRACTICE_FORMATS.includes(format) ? format : "cloze";
  renderFavorites();
}

function startPractice() {
  const sourceItems = getPracticeItems();

  if (!sourceItems.length) {
    renderFavorites();
    return;
  }

  const nextMode = selectedPracticeSource === "favorites" ? "favorites" : "mistakes";
  setTrainingSection(selectedPracticeSection);
  setMode(nextMode);

  if (selectedPracticeSection === "paronyms") {
    startParonymQuestions(sourceItems, selectedPracticeFormat);
    return;
  }

  startQuestions(sourceItems);
}

function startQuiz() {
  if (selectedTrainingSection === "paronyms") {
    const sourcePairs = getSelectedParonymPairs();

    if (!sourcePairs.length) {
      renderModeState();
      return;
    }

    startParonymQuestions(sourcePairs);
    return;
  }

  const sourceWords = getSelectedModeWords();

  if (!sourceWords.length) {
    renderModeState();
    return;
  }

  startQuestions(sourceWords);
}

function resetQuizState(section) {
  window.clearTimeout(quizAdvanceTimer);
  activeQuizSection = section;
  quizIndex = 0;
  answerLocked = false;
  quizCorrectCount = 0;
  quizMistakeCount = 0;
  currentTestMistakes = [];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getParonymQuestionFormat() {
  return selectedMode === "allWords" ? "meaning" : "cloze";
}

function createParonymPrompt(entry, format = "cloze") {
  if (format === "meaning") {
    return {
      label: "Пойми значение",
      prompt: entry.meaning,
    };
  }

  const example = entry.example?.trim();

  if (!example) {
    return {
      label: "Выбери слово",
      prompt: entry.meaning,
    };
  }

  const wordPattern = new RegExp(escapeRegExp(entry.word), "iu");
  const sentence = example.replace(wordPattern, "_____");

  if (sentence === example) {
    return {
      label: "Выбери слово",
      prompt: entry.meaning,
    };
  }

  return {
    label: "Вставь слово",
    prompt: sentence,
  };
}

function createParonymQuestion(pair, format = getParonymQuestionFormat()) {
  const playableEntries = getPlayableParonymEntries(pair, format);

  if (!playableEntries.length) {
    return null;
  }

  const target = shuffle(playableEntries)[0];
  const prompt = createParonymPrompt(target, format);

  return {
    type: "paronym",
    format,
    id: pair.id,
    pair,
    correct: target.word,
    label: prompt.label,
    prompt: prompt.prompt,
    context: `Группа: ${pair.title}`,
    answers: shuffle(
      pair.entries.map((entry) => ({
        text: entry.word,
        isCorrect: entry.word === target.word,
      }))
    ),
  };
}

function startQuestions(sourceWords) {
  resetQuizState("accents");
  quizQuestions = shuffle(sourceWords).slice(0, selectedQuizLength).map((word) => ({
    ...word,
    type: "accent",
    answers: shuffle([
      { text: word.correct, isCorrect: true },
      { text: word.wrong, isCorrect: false },
    ]),
  }));
  showScreen("quiz");
  renderQuizQuestion();
}

function startParonymQuestions(sourcePairs, format = getParonymQuestionFormat()) {
  resetQuizState("paronyms");
  quizQuestions = sourcePairs[0]?.type === "paronym"
    ? shuffle(sourcePairs).slice(0, selectedQuizLength)
    : shuffle(sourcePairs)
      .map((pair) => createParonymQuestion(pair, format))
      .filter(Boolean)
      .slice(0, selectedQuizLength);

  if (!quizQuestions.length) {
    renderModeState();
    renderFavorites();
    return;
  }

  showScreen("quiz");
  renderQuizQuestion();
}

function exitQuiz() {
  window.clearTimeout(quizAdvanceTimer);
  quizAdvanceTimer = null;
  answerLocked = false;
  showScreen("test");
}

function restartSelectedModeQuiz() {
  startQuiz();
}

function repeatCurrentMistakes() {
  if (!currentTestMistakes.length) {
    return;
  }

  if (activeQuizSection === "paronyms") {
    startParonymQuestions(currentTestMistakes);
    return;
  }

  startQuestions(currentTestMistakes);
}

function finishQuiz() {
  if (!resultScore || !resultDetails || !repeatMistakesButton) {
    showScreen("test");
    return;
  }

  const scoreAngle = quizQuestions.length ? (quizCorrectCount / quizQuestions.length) * 360 : 0;
  const tone = getResultTone(quizCorrectCount, quizQuestions.length);

  if (resultVerdict) {
    resultVerdict.textContent = getResultVerdict(quizCorrectCount, quizQuestions.length);
  }

  if (resultCard) {
    resultCard.classList.remove("result-good", "result-mid", "result-low");
    resultCard.classList.add(`result-${tone}`);
    resultCard.style.setProperty("--score-angle", `${scoreAngle}deg`);
  }

  resultScore.textContent = `${quizCorrectCount} из ${quizQuestions.length}`;
  resultDetails.textContent = `Ошибок: ${quizMistakeCount}`;
  repeatMistakesButton.disabled = !currentTestMistakes.length;
  showScreen("result");
}

function renderQuestionPrompt(question) {
  if (!quizQuestion) {
    return;
  }

  quizQuestion.innerHTML = "";

  if (question.type !== "paronym") {
    quizQuestion.hidden = true;
    return;
  }

  const label = document.createElement("span");
  const text = document.createElement("strong");
  const context = document.createElement("small");

  label.textContent = question.label || "Выбери слово";
  text.textContent = question.prompt;
  context.textContent = question.context;
  quizQuestion.append(label, text, context);
  quizQuestion.hidden = false;
}

function clearQuizFeedback() {
  if (!quizFeedback) {
    return;
  }

  quizFeedback.hidden = true;
  quizFeedback.className = "quiz-feedback";
  quizFeedback.innerHTML = "";
}

function renderQuizFeedback(question, isCorrect) {
  if (!quizFeedback || question.type !== "paronym") {
    return;
  }

  const correctEntry = question.pair?.entries?.find((entry) => entry.word === question.correct);
  const badge = document.createElement("span");
  const title = document.createElement("strong");
  const meaning = document.createElement("p");

  badge.textContent = isCorrect ? "Верно" : "Разбор";
  title.textContent = isCorrect ? question.correct : `Правильно: ${question.correct}`;
  meaning.textContent = correctEntry
    ? `${correctEntry.word} - ${getParonymEntryMeaning(correctEntry)}`
    : question.context;

  quizFeedback.className = `quiz-feedback ${isCorrect ? "good" : "bad"}`;
  quizFeedback.innerHTML = "";
  quizFeedback.append(badge, title, meaning);

  if (hasParonymExample(correctEntry)) {
    const example = document.createElement("small");
    example.textContent = correctEntry.example;
    quizFeedback.append(example);
  }

  quizFeedback.hidden = false;
}

function renderQuizQuestion() {
  const question = quizQuestions[quizIndex];

  if (!question) {
    finishQuiz();
    return;
  }

  answerLocked = false;

  quizCounter.textContent = `${quizIndex + 1} из ${quizQuestions.length}`;
  const progressValue = Math.round(((quizIndex + 1) / quizQuestions.length) * 100);

  if (quizProgress) {
    quizProgress.setAttribute("aria-valuenow", String(progressValue));
  }

  if (quizProgressBar) {
    quizProgressBar.style.width = `${progressValue}%`;
  }

  answerGrid.innerHTML = "";
  clearQuizFeedback();
  renderQuestionPrompt(question);
  renderQuizFavoriteButton();

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.dataset.answerIndex = String(index);
    button.textContent = question.type === "paronym" ? answer.text : formatStress(answer.text);
    button.addEventListener("click", () => handleAnswer(button, answer.isCorrect));
    answerGrid.append(button);
  });
}

function renderQuizFavoriteButton() {
  if (!quizQuestions.length || !quizQuestions[quizIndex]) {
    updateFavoriteButton(quizFavoriteButton, null);
    return;
  }

  updateFavoriteButton(quizFavoriteButton, quizQuestions[quizIndex]);
}

function handleAnswer(button, isCorrect) {
  if (answerLocked) {
    return;
  }

  const question = quizQuestions[quizIndex];
  answerLocked = true;
  button.classList.add(isCorrect ? "correct" : "wrong");
  answerGrid.querySelectorAll(".answer-button").forEach((answerButton) => {
    const answer = question.answers[Number(answerButton.dataset.answerIndex)];

    if (answer?.isCorrect) {
      answerButton.classList.add("correct");
    }

    answerButton.disabled = true;
  });
  quizCorrectCount += isCorrect ? 1 : 0;
  quizMistakeCount += isCorrect ? 0 : 1;
  if (!isCorrect) {
    currentTestMistakes.push(question);
  }
  updateMistakeStats(question, isCorrect);
  renderQuizFeedback(question, isCorrect);
  tg?.HapticFeedback?.notificationOccurred(isCorrect ? "success" : "error");

  quizAdvanceTimer = window.setTimeout(() => {
    quizIndex += 1;
    quizAdvanceTimer = null;

    if (quizIndex >= quizQuestions.length) {
      finishQuiz();
      return;
    }

    renderQuizQuestion();
  }, question.type === "paronym" ? 1800 : 650);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showScreen(tab.dataset.tab);
  });
});

trainingSectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTrainingSection(button.dataset.trainingSection);
  });
});

practiceSectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPracticeSection(button.dataset.practiceSection);
  });
});

practiceDirectionTrigger?.addEventListener("click", () => {
  setPracticeDirectionMenuOpen(!practiceDirectionMenu?.classList.contains("open"));
});

practiceSourceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPracticeSource(button.dataset.practiceSource);
  });
});

practiceFormatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPracticeFormat(button.dataset.practiceFormat);
  });
});

modeTrigger?.addEventListener("click", () => {
  setModeMenuOpen(!modeMenu?.classList.contains("open"));
});

modeOptions.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
    setModeMenuOpen(false);
  });
});

quizLengthOptions.forEach((button) => {
  button.addEventListener("click", () => {
    setQuizLength(Number(button.dataset.quizLength));
  });
});

document.addEventListener("click", (event) => {
  const clickedModeSelect = modeSelect?.contains(event.target);
  const clickedQuizLength = quizLengthControl?.contains(event.target);
  const clickedPracticeDirection = practiceDirectionSelect?.contains(event.target);

  if (!clickedModeSelect && !clickedQuizLength) {
    setModeMenuOpen(false);
  }

  if (!clickedPracticeDirection) {
    setPracticeDirectionMenuOpen(false);
  }
});

startTestButton.addEventListener("click", startQuiz);
restartTestButton?.addEventListener("click", restartSelectedModeQuiz);
repeatMistakesButton?.addEventListener("click", () => {
  repeatCurrentMistakes();
});
resultBackButton?.addEventListener("click", () => {
  showScreen("test");
});
quizBackButton?.addEventListener("click", () => {
  exitQuiz();
});
startFavoritesButton?.addEventListener("click", startPractice);
infoButton?.addEventListener("click", () => {
  showScreen("info");
});
infoBackButton?.addEventListener("click", () => {
  showScreen("test");
});
quizFavoriteButton?.addEventListener("click", () => {
  if (quizQuestions[quizIndex]) {
    toggleFavorite(quizQuestions[quizIndex]);
  }
});
dictionarySearch.addEventListener("input", () => {
  renderDictionaryFilter();
  renderDictionary();
});
dictionaryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedDictionaryFilter = button.dataset.dictionaryFilter;
    renderDictionaryFilter();
    renderDictionary();
  });
});
popularWordButtons.forEach((button) => {
  button.addEventListener("click", () => {
    dictionarySearch.value = button.dataset.searchWord;
    renderDictionaryFilter();
    renderDictionary();
    dictionarySearch.focus();
  });
});
wordInfoClose?.addEventListener("click", closeWordInfo);

renderDictionaryFilter();
renderDictionary();
renderFavorites();
setQuizLength(selectedQuizLength);
renderTrainingSection();
renderModeState();
showScreen("test");
