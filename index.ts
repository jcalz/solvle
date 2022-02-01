import './style.css';
import { words as words } from './allWords';
import { words as possibleWords } from './possibleSolutions';
//const possibleWords = words;

console.clear();
//console.log(words.length);
//console.log(_possibleWords.length)

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

shuffleArray(words);

enum Color {
  GREEN = '🟩',
  YELLOW = '🟨',
  BLACK = '⬛',
}
const G = Color.GREEN;
const Y = Color.YELLOW;
const B = Color.BLACK;
const bestResult = [G, G, G, G, G].join('');

type GuessResult = [Color, Color, Color, Color, Color];

function rateGuess(actualWord: string, guess: string) {
  const result: GuessResult = [B, B, B, B, B];
  let idx = [0, 1, 2, 3, 4];
  let rest: Record<string, number> = {};
  for (let i = 0; i < 5; i++) {
    if (actualWord[i] === guess[i]) {
      result[i] = G;
    } else {
      rest[actualWord[i]] = (rest[actualWord[i]] ?? 0) + 1;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === G) continue;
    if (rest[guess[i]]) {
      result[i] = Y;
      rest[guess[i]]--;
    }
  }
  return result;
}

function equalResults(guess1: GuessResult, guess2: GuessResult): boolean {
  for (let i = 0; i < 5; i++) {
    if (guess1[i] !== guess2[i]) return false;
  }
  return true;
}

function findWordsMatchingGuess(
  originalWords: string[],
  guess: string,
  result: GuessResult
): string[] {
  return originalWords.filter((w) => equalResults(result, rateGuess(w, guess)));
}

/*
let afterGuess = possibleWords;
afterGuess = findWordsMatchingGuess(afterGuess, 'ROATE', [B, B, B, Y, B]);
afterGuess = findWordsMatchingGuess(afterGuess, 'SHUNT', [B, Y, B, B, G]);
afterGuess = findWordsMatchingGuess(afterGuess, 'FLAWS', [B, Y, B, B, B]);
//afterGuess = findWordsMatchingGuess(afterGuess, 'BLACK', [B, Y, B, B, Y]);
console.log(afterGuess.join(':'));
console.log(afterGuess.length);
const g = bestGuess(afterGuess, words);
console.log(g);
*/
function bestGuess(possibleWords: string[], guessableWords: string[]) {
  if (
    possibleWords.length === 1 &&
    guessableWords.indexOf(possibleWords[0]) >= 0
  ) {
    return possibleWords[0];
  }
  let minExpectedNumberOfRemainingWords = Infinity;
  let bestGuess = '';
  let start = Date.now();
  let i = 0;

  for (const guess of guessableWords) {
    i++;
    if (Date.now() - start > 5000) {
      start = Date.now();
      console.log('considering guessing word #' + i + ': ' + guess);
    }

    const numWordsForResult: Record<string, number> = {};
    for (const possibleWord of possibleWords) {
      const result = rateGuess(possibleWord, guess);
      const key = result.join('');
      numWordsForResult[key] = (numWordsForResult[key] ?? 0) + 1;
    }
    let n = 0;
    let w = 0;
    for (const r in numWordsForResult) {
      if (r !== bestResult) n += numWordsForResult[r] * numWordsForResult[r];
      w += numWordsForResult[r];
    }
    const curExpectedNumberOfRemainingWords = n / w;

    if (curExpectedNumberOfRemainingWords < minExpectedNumberOfRemainingWords) {
      console.log(guess, curExpectedNumberOfRemainingWords);
      minExpectedNumberOfRemainingWords = curExpectedNumberOfRemainingWords;
      bestGuess = guess;
    }
  }
  return bestGuess;
}

const board = document.getElementById('board') as HTMLTableElement;
const cells = Array.from(board.querySelectorAll('tr')).map((r) =>
  Array.from(r.querySelectorAll('td')).filter(
    (x) => !x.classList.contains('guess-button')
  )
);
const cheatMore = document.getElementById('cheat-more') as HTMLInputElement;

const cellStates = ['absent', 'present', 'correct'];
const states = {
  absent: B,
  present: Y,
  correct: G,
};

(document.querySelector('#board tbody') as HTMLBodyElement).addEventListener(
  'click',
  function (event) {
    var td = event.target as HTMLElement;
    while (td !== this && !td.matches('td')) {
      td = td.parentNode as HTMLElement;
    }
    if (td === this) {
      console.log('No table cell found');
      return;
    }
    if (!td.classList.contains('guess-button')) {
      if (td.innerText) {
        const idx = cellStates.findIndex((c) => td.classList.contains(c));
        if (idx >= 0) td.classList.remove(cellStates[idx]);
        td.classList.add(cellStates[(idx + 1) % cellStates.length]);
      }
    } else {
      doGuess();
    }
  }
);
function doGuess() {
  const wordsAndResults = cells.map((r) => ({
    word: r
      .map((x) => x.innerText)
      .join('')
      .toUpperCase(),
    result: r.map(
      (x) =>
        states[cellStates.find((c) => x.classList.contains(c))] as
          | Color
          | undefined
    ),
  }));
  let afterGuess = cheatMore.checked ? possibleWords : words;
  let i;
  for (i = 0; i < wordsAndResults.length; i++) {
    const w = wordsAndResults[i].word;
    const r = wordsAndResults[i].result;
    if (w.length !== 5) break;
    if (!r.every((x): x is Color => x !== undefined)) return;
    afterGuess = findWordsMatchingGuess(afterGuess, w, r as GuessResult);
  }
  if (i >= wordsAndResults.length) return;
  const g = bestGuess(afterGuess, words);
  cells[i].forEach((c, j) => (c.innerText = g[j] ?? '?'));
}

const toggleHelp = () => {
  const el = document.getElementById('how-to-play')!;
  el.style.display = el.style.display !== 'block' ? 'block' : 'none';
};

document
  .querySelectorAll('.help')
  .forEach((x) => x.addEventListener('click', toggleHelp));

/*if (!localStorage.getItem('seenHelp')) {
  toggleHelp();
  localStorage.setItem('seenHelp', 'true');
}*/


