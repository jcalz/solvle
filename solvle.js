console.clear();
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
shuffleArray(words);
const Color = {GREEN: "\uD83D\uDFE9", YELLOW: "\uD83D\uDFE8", BLACK: "\u2B1B"};
const G = Color.GREEN;
const Y = Color.YELLOW;
const B = Color.BLACK;
const bestResult = [G, G, G, G, G].join('');
function rateGuess(actualWord, guess) {
    var _a;
    const result = [B, B, B, B, B];
    let rest = {};
    for (let i = 0; i < 5; i++) {
        if (actualWord[i] === guess[i]) {
            result[i] = G;
        }
        else {
            rest[actualWord[i]] = ((_a = rest[actualWord[i]]) !== null && _a !== void 0 ? _a : 0) + 1;
        }
    }
    for (let i = 0; i < 5; i++) {
        if (result[i] === G)
            continue;
        if (rest[guess[i]]) {
            result[i] = Y;
            rest[guess[i]]--;
        }
    }
    return result;
}
function equalResults(guess1, guess2) {
    for (let i = 0; i < 5; i++) {
        if (guess1[i] !== guess2[i])
            return false;
    }
    return true;
}
function findWordsMatchingGuess(originalWords, guess, result) {
    return originalWords.filter((w) => equalResults(result, rateGuess(w, guess)));
}

function bestGuess(possibleWords, guessableWords) {
    var _a;
    if (possibleWords.length === 1 &&
        guessableWords.indexOf(possibleWords[0]) >= 0) {
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
        const numWordsForResult = {};
        for (const possibleWord of possibleWords) {
            const result = rateGuess(possibleWord, guess);
            const key = result.join('');
            numWordsForResult[key] = (numWordsForResult[key]||0) + 1;
        }
        let n = 0;
        let w = 0;
        for (const r in numWordsForResult) {
            if (r !== bestResult)
                n += numWordsForResult[r] * numWordsForResult[r];
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
const board = document.getElementById('board');
const cells = Array.from(board.querySelectorAll('tr')).map((r) => Array.from(r.querySelectorAll('td')).filter((x) => !x.classList.contains('guess-button')));
const cheatMore = document.getElementById('cheat-more');
const cellStates = ['absent', 'present', 'correct'];
const states = {
    absent: B,
    present: Y,
    correct: G,
};
document.querySelector('#board tbody').addEventListener('click', function (event) {
    var td = event.target;
    while (td !== this && !td.matches('td')) {
        td = td.parentNode;
    }
    if (td === this) {
        console.log('No table cell found');
        return;
    }
    if (!td.classList.contains('guess-button')) {
        if (td.innerText) {
            const idx = cellStates.findIndex((c) => td.classList.contains(c));
            if (idx >= 0)
                td.classList.remove(cellStates[idx]);
            td.classList.add(cellStates[(idx + 1) % cellStates.length]);
        }
    }
    else {
        doGuess();
    }
});

function yld() {
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

async function doGuess() {
	// if the player put any absent (black) letter earlier in the word
	// than the same letter as present (yellow) then this is a mistake
	// and they should be swapped. (e.g., in CANAL, you can have 
	// the first A be 🟨 and the second a be ⬛ but not vice versa)
	cells.forEach(r => {
		const seenAbsent = {};
		for (let i = 0; i < r.length; i++) {
			const c = r[i];
			const letter = c.innerText.toUpperCase();
			if ((letter in seenAbsent) && c.classList.contains("present")) {
			    const j = seenAbsent[letter].shift();
				const cSwap = r[j];					
				cSwap.classList.remove("absent");
				cSwap.classList.add("present");
				c.classList.remove("present");
				c.classList.add("absent");				
			} 
			if (c.classList.contains("absent")) {
				seenAbsent[letter] = seenAbsent[letter]||[];
				seenAbsent[letter].push(i);
			}			
		}
	});
    
	const wordsAndResults = cells.map((r) => ({
        word: r
            .map((x) => x.innerText)
            .join('')
            .toUpperCase(),
        result: r.map((x) => states[cellStates.find((c) => x.classList.contains(c))]),
    }));
    let afterGuess = cheatMore.checked ? possibleWords : words;
    let i;
    for (i = 0; i < wordsAndResults.length; i++) {
        const w = wordsAndResults[i].word;
        const r = wordsAndResults[i].result;
        if (w.length !== 5)
            break;
        if (!r.every((x) => x !== undefined))
            return;
        afterGuess = findWordsMatchingGuess(afterGuess, w, r);
    }
    if (i >= wordsAndResults.length)
        return;
    console.log(afterGuess);
	document.body.classList.add("wait");
	await yld();
    const g = bestGuess(afterGuess, words);
	await yld();
	document.body.classList.remove("wait");	
	
    cells[i].forEach((c, j) => c.innerText = g[j]||'?');
}
const toggleHelp = (ev) => {    
    const el = document.getElementById('how-to-play');
    el.style.display = el.style.display !== 'block' ? 'block' : 'none';
};
document
    .querySelectorAll('.help')
    .forEach((x) => x.addEventListener('click', toggleHelp));
if (!localStorage.getItem('seenHelp')) {
  toggleHelp();
  localStorage.setItem('seenHelp', 'true');
}
