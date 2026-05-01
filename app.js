let tg = window.Telegram?.WebApp || null;
let telegramInitialized = false;

function initTelegramWebApp() {
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
const QUIZ_LENGTH_STORAGE_KEY = "egeAccentQuizLength";
const MISTAKES_STORAGE_KEY = "egeAccentMistakes";
const FAVORITES_STORAGE_KEY = "egeAccentFavorites";

const accentData = window.ACCENT_DATA || {};
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

const tabs = document.querySelectorAll("[data-tab]");
const screens = document.querySelectorAll("[data-screen]");
const tabBar = document.querySelector(".tab-bar");
const modeSelect = document.getElementById("modeSelect");
const modeOptions = document.querySelectorAll("[data-mode]");
const quizLengthOptions = document.querySelectorAll("[data-quiz-length]");
const quizLengthControl = document.querySelector(".quiz-length");
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
const quizCounter = document.getElementById("quizCounter");
const quizProgress = document.getElementById("quizProgress");
const quizProgressBar = document.getElementById("quizProgressBar");
const quizBackButton = document.getElementById("quizBackButton");
const quizFavoriteButton = document.getElementById("quizFavoriteButton");
const answerGrid = document.getElementById("answerGrid");
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
let selectedMode = "all";
let selectedDictionaryFilter = "all";
let selectedQuizLength = loadQuizLength();
let mistakes = loadMistakes();
let favorites = loadFavorites();
let quizCorrectCount = 0;
let quizMistakeCount = 0;
let currentTestMistakes = [];
let quizAdvanceTimer = null;

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
}

function isFavorite(word) {
  return Boolean(favorites[normalizeText(word.correct)]);
}

function toggleFavorite(word) {
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
  button.className = "favorite-button";
  button.type = "button";
  button.textContent = "★";
  button.classList.toggle("active", active);
  button.setAttribute("aria-label", active ? "Убрать из избранного" : "Добавить в избранное");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(word);
  });

  return button;
}

function updateFavoriteButton(button, word) {
  if (!button || !word) {
    return;
  }

  const active = isFavorite(word);
  button.classList.toggle("active", active);
  button.setAttribute("aria-label", active ? "Убрать из избранного" : "Добавить в избранное");
}

function updateMistakeStats(word, isCorrect) {
  const key = normalizeText(word.correct);

  if (!isCorrect) {
    mistakes[key] = {
      correct: word.correct,
      wrong: word.wrong,
      count: (mistakes[key]?.count || 0) + 1,
    };
    saveMistakes();
    renderModeState();
    return;
  }

  if (selectedMode === "mistakes" && mistakes[key]) {
    mistakes[key].count -= 1;

    if (mistakes[key].count <= 0) {
      delete mistakes[key];
    }

    saveMistakes();
    renderModeState();
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

function getWordInfo(word) {
  return wordInfo[normalizeText(word.correct)];
}

function getDictionaryWords() {
  if (selectedDictionaryFilter === "ege") {
    return accentWords;
  }

  if (selectedDictionaryFilter === "extra") {
    return extraWords;
  }

  return knownWords;
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

function getModeDetails(mode) {
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

function renderModeState() {
  const count = Object.keys(mistakes).length;
  const favoriteCount = getFavoriteWords().length;
  const currentMode = getModeDetails(selectedMode);

  if (egeWordsCount) {
    egeWordsCount.textContent = accentWords.length;
  }

  if (allWordsCount) {
    allWordsCount.textContent = knownWords.length;
  }

  if (mistakesCount) {
    mistakesCount.textContent = count;
  }

  if (favoritesCount) {
    favoritesCount.textContent = favoriteCount;
  }

  modeOptions.forEach((button) => {
    button.classList.toggle("empty", getModeDetails(button.dataset.mode).empty);
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
    modeHint.textContent = currentMode.empty ? currentMode.meta : "";
  }

  startTestButton.disabled = currentMode.empty;
}

function setMode(mode) {
  selectedMode = mode;

  modeOptions.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

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

function showScreen(screenName) {
  const nextScreen = ["dictionary", "quiz", "result", "favorites", "info"].includes(screenName)
    ? screenName
    : "test";

  document.body.dataset.screen = nextScreen;

  if (nextScreen !== "test") {
    setModeMenuOpen(false);
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

  const words = getDictionaryWords().filter((word) => normalizeText(word.correct).includes(query));

  if (dictionarySummary) {
    dictionarySummary.textContent = words.length
      ? `Найдено: ${formatWordCount(words.length)}`
      : "Ничего не найдено";
  }

  if (!words.length) {
    dictionaryResults.innerHTML = `
      <div class="empty-state dictionary-empty-result">
        <strong>Такого слова пока нет</strong>
        <span>Попробуй изменить запрос или найти слово по другой части.</span>
      </div>
    `;
    return;
  }

  words.forEach((word) => {
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
    dictionaryResults.append(row);
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

  const words = getFavoriteWords();
  favoritesResults.innerHTML = "";

  if (favoritesSummary) {
    favoritesSummary.textContent = formatWordCount(words.length) + " сохранено";
  }

  if (startFavoritesButton) {
    startFavoritesButton.hidden = !words.length;
  }

  if (!words.length) {
    favoritesResults.innerHTML = `
      <div class="empty-state favorites-empty">
        <span class="empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" class="bookmark-icon">
            <path d="M6 4.8C6 3.8 6.8 3 7.8 3h8.4c1 0 1.8.8 1.8 1.8V21l-6-3.4L6 21V4.8Z" />
            <path d="m12 7.1 1.15 2.33 2.57.37-1.86 1.82.44 2.56L12 12.96l-2.3 1.22.44-2.56L8.28 9.8l2.57-.37L12 7.1Z" />
          </svg>
        </span>
        <strong>Пока нет избранных слов</strong>
        <span>Добавляй сложные слова звездочкой в тесте или словаре, чтобы тренировать их отдельно.</span>
      </div>
    `;
    return;
  }

  words.forEach((word) => {
    const row = document.createElement("div");
    row.className = "word-row favorite-row";
    const copy = document.createElement("span");
    copy.className = "word-copy";
    const text = document.createElement("span");
    text.textContent = formatStress(word.correct);
    copy.append(text);
    row.append(copy, createFavoriteButton(word));
    favoritesResults.append(row);
  });
}

function startQuiz() {
  const sourceWords = getSelectedModeWords();

  if (!sourceWords.length) {
    renderModeState();
    return;
  }

  startQuestions(sourceWords);
}

function startQuestions(sourceWords) {
  window.clearTimeout(quizAdvanceTimer);
  quizQuestions = shuffle(sourceWords).slice(0, selectedQuizLength).map((word) => ({
    ...word,
    answers: shuffle([
      { text: word.correct, isCorrect: true },
      { text: word.wrong, isCorrect: false },
    ]),
  }));
  quizIndex = 0;
  answerLocked = false;
  quizCorrectCount = 0;
  quizMistakeCount = 0;
  currentTestMistakes = [];
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

function renderQuizQuestion() {
  const question = quizQuestions[quizIndex];
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
  renderQuizFavoriteButton();

  question.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = formatStress(answer.text);
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
  quizCorrectCount += isCorrect ? 1 : 0;
  quizMistakeCount += isCorrect ? 0 : 1;
  if (!isCorrect) {
    currentTestMistakes.push(question);
  }
  updateMistakeStats(question, isCorrect);
  tg?.HapticFeedback?.notificationOccurred(isCorrect ? "success" : "error");

  quizAdvanceTimer = window.setTimeout(() => {
    quizIndex += 1;
    quizAdvanceTimer = null;

    if (quizIndex >= quizQuestions.length) {
      finishQuiz();
      return;
    }

    renderQuizQuestion();
  }, 650);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showScreen(tab.dataset.tab);
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

  if (!clickedModeSelect && !clickedQuizLength) {
    setModeMenuOpen(false);
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
startFavoritesButton?.addEventListener("click", () => {
  setMode("favorites");
  startQuiz();
});
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
renderModeState();
showScreen("test");
