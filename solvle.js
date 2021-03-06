console.clear();
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
shuffleArray(words);
const Color = { GREEN: "\uD83D\uDFE9", YELLOW: "\uD83D\uDFE8", BLACK: "\u2B1B" };
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
            numWordsForResult[key] = (numWordsForResult[key] || 0) + 1;
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
const cells = Array.from(board.querySelectorAll('tr.tile-row')).map((r) => Array.from(r.querySelectorAll('td')).filter((x) => !x.classList.contains('guess-button')));
const cheatMore = document.getElementById('cheat-more');
const cellStates = ['absent', 'present', 'correct'];
const states = {
    absent: B,
    present: Y,
    correct: G,
};
const stateClass = {
    [B]: "absent",
    [Y]: "present",
    [G]: "correct"
}

const stumped = document.getElementById("stumped");
const won = document.getElementById("won");
const actualWordInput = document.getElementById("actualWord");
const actualWordLabel = document.getElementById("actualWordLabel");
const explainFalure = document.getElementById("explainFailure");

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
            stumped.style.display = "none";
            let found = false;
            for (const r of cells) {
                if (found) r.forEach(c => {
                    c.innerText = "";
                    c.classList.remove("present", "absent", "correct");
                });
                for (const c of r) {
                    if (td === c) { found = true; }
                }

            }
        }
    } else {
        doGuess();
    }
});

function yld() {
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

// a cache of guesses for guess #2 with "cheat more" disabled
const guessCache = {
    [[B, B, B, B, B].join("")]: "LIMNS",

    [[B, B, B, B, Y].join("")]: "SILED",
    [[B, B, B, Y, B].join("")]: "SHUNT",
    [[B, B, Y, B, B].join("")]: "NALAS",
    [[B, Y, B, B, B].join("")]: "LINOS",
    [[Y, B, B, B, B].join("")]: "GUIDS",

    [[B, B, B, B, G].join("")]: "SLING",
    [[B, B, B, G, B].join("")]: "SINHS",
    [[B, B, G, B, B].join("")]: "SHULN",
    [[B, G, B, B, B].join("")]: "CLONS",
    [[G, B, B, B, B].join("")]: "MINKS",

    [[B, B, B, Y, Y].join("")]: "TELES",
    [[B, B, Y, B, Y].join("")]: "LANDS",
    [[B, B, Y, Y, B].join("")]: "TAILS",
    [[B, Y, B, B, Y].join("")]: "LENOS",
    [[B, Y, B, Y, B].join("")]: "SUINT",
    [[B, Y, Y, B, B].join("")]: "SALON",
    [[Y, B, B, B, Y].join("")]: "IDEES",
    [[Y, B, B, Y, B].join("")]: "TRIPS",
    [[Y, B, Y, B, B].join("")]: "SAKAI",
    [[Y, Y, B, B, B].join("")]: "CRIOS",

}

async function doGuess() {
    // if the player put any absent (black) letter earlier in the word
    // than the same letter as present (yellow) then this is a mistake
    // and they should be swapped. (e.g., in CANAL, you can have 
    // the first A be ???? and the second a be ??? but not vice versa)
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
                seenAbsent[letter] = seenAbsent[letter] || [];
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
        if (r.join("") === bestResult) {
            won.style.display = "block";
            document.getElementById("win-text").innerHTML = [
                "I'm a Genius! &#x1F913;",
                "I'm Magnificent! &#x2728;",
                "I'm Impressive! &#x1F603;",
                "I'm Splendid! &#x1F600;",
                "I'm Great. &#x1F642;",
                "Phew! &#x1F60C;"
            ][i]
            return;
        }
        afterGuess = findWordsMatchingGuess(afterGuess, w, r);
    }
    console.log(afterGuess);
    document.body.classList.add("wait");
    document.getElementById("thinking").style.display = "flex";
    await yld();

    let g = undefined;
    // check cached guesses for guess #2
    if ((!cheatMore.checked) && (i === 1)) {
        g = guessCache[wordsAndResults[0].result.join("")];
    }
    if (!g) {
        g = bestGuess(afterGuess, words);
    }
    await yld();
    document.body.classList.remove("wait");
    document.getElementById("thinking").style.display = "none";
    if (!g || (i >= wordsAndResults.length)) {
        if (cheatMore.checked) {
            cheatMore.checked = false;
            doGuess();
            return;
        }
        explainFailure.innerHTML = "";
        stumped.style.display = "block";
        actualWordInput.value = "";
        actualWordInput.focus();
    } else {
        cells[i].forEach((c, j) => c.innerText = g[j]);
    }
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

document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains('guess-button')) return;
    if (e.target !== actualWordInput && e.target !== actualWordLabel) stumped.style.display = "none";
    won.style.display = "none";
})

actualWordInput.addEventListener("input", () => {
    const actualWord = actualWordInput.value.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 5);
    actualWordInput.value = actualWord;
    if (actualWord.length !== 5) {
        explainFailure.innerHTML = "";
        return;
    }

    if (!words.includes(actualWord)) {
        explainFailure.innerHTML = "I am not aware that " + actualWord + " is a word. &#x1F914;<br><br>" +
            "That's really odd, I am aware of lots of crazy words like ZOPPO.  Where'd you get that from?";
    } else {
        const wordsAndResults = cells.map((r) => ({
            word: r
                .map((x) => x.innerText)
                .join('')
                .toUpperCase(),
            result: r.map((x) => states[cellStates.find((c) => x.classList.contains(c))]),
        }));
        const problems = [];
        const ordinal = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

        for (let i = 0; i < wordsAndResults.length; i++) {
            const w = wordsAndResults[i].word;
            const r = wordsAndResults[i].result;
            if ((w.length !== 5) || (!r.every(x => x !== undefined))) break;
            const realR = rateGuess(actualWord, w);
            if (realR.join("") !== r.join("")) {
                const inlineWord = (r) => '<span class="inline-word">' + w.split("").map(
                    (l, i) => '<span class="' + stateClass[r[i]] + '">' + l + '</span>').join("") + "</span>";
                problems.push("you colored my " + ordinal[i] + " guess like " +
                    inlineWord(r) + ", but if your word is " + actualWord + " then I think " +
                    "you should have colored it like " + inlineWord(realR) + ".");
            }
        }
        if (problems.length) {
            explainFailure.innerHTML = "But wait, that can't be right.  &#x1F615;<br><br>So " +
                problems.join("<br><br>and ") + "<br><br>Which one of us made a mistake?";
        } else if (cells[cells.length - 1].every(c => cellStates.find((s) => c.classList.contains(s)))) {
            explainFalure.innerHTML = "Darn! I ran out of guesses.  You're too good for me! &#x1F605;"
        }
        else {
            explainFailure.innerHTML = "Oh, something went wrong and I don't know what. I need a human programmer or something. &#x1F622;";
        }
    }


});

