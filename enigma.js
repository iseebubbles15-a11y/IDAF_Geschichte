const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// keep a number inside 0-25; in JS % can return negative numbers
function mod(number) {
    return ((number % LETTERS.length) + LETTERS.length) % LETTERS.length;
}

// turn a wiring string like "EKMF..." into a list of letter indexes
function toIndexes(wiring) {
    return [...wiring].map(letter => LETTERS.indexOf(letter));
}

function makeRotor(wiring, notch) {
    const forward = toIndexes(wiring);

    // the way back from the reflector needs the inverse wiring
    const backward = [];
    forward.forEach((output, input) => {
        backward[output] = input;
    });

    return { forward, backward, notch: LETTERS.indexOf(notch) };
}

// historical wirings of the Enigma I, the notch is the letter
// at which the next rotor gets carried along (Q -> R for rotor I)
const ROTORS = {
    I: makeRotor("EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q"),
    II: makeRotor("AJDKSIRUXBLHWTMCQGZNPYFVOE", "E"),
    III: makeRotor("BDFHJLCPRTXVZNYEIWGAKMUSQO", "V"),
    IV: makeRotor("ESOVPZJAYQUIRHXLNFTGKDCMWB", "J"),
    V: makeRotor("VZBRGITYUPSDNHLXAWMJQOFECK", "Z"),
};

const REFLECTORS = {
    "UKW-B": toIndexes("YRUHQSLDPXNGOKMIEBFZCWVJAT"),
    "UKW-C": toIndexes("FVPJIAOYEDRZXWGCTKUQSBNMHL"),
};

// all lists are ordered like on the machine: left, middle, right
function defaultSettings() {
    return {
        rotors: ["I", "II", "III"],
        rings: [0, 0, 0],
        start: [0, 0, 0],
        reflector: "UKW-B",
        plugs: [],
    };
}

// the plugboard swaps the two letters of every cable,
// letters without a cable stay the same
function makePlugboard(plugs) {
    const plugboard = [...LETTERS].map((_, index) => index);
    for (const [first, second] of plugs) {
        plugboard[first] = second;
        plugboard[second] = first;
    }
    return plugboard;
}

// the rotors turn before every letter: the right one always,
// the middle one when the right one is at its notch, and the left
// one when the middle one is at its notch. In that case the middle
// rotor turns as well, which is the famous "double step"
function stepRotors(positions, rotorNames) {
    const middleAtNotch = positions[1] === ROTORS[rotorNames[1]].notch;
    const rightAtNotch = positions[2] === ROTORS[rotorNames[2]].notch;

    const stepped = [middleAtNotch, middleAtNotch || rightAtNotch, true];
    const newPositions = positions.map((position, index) => stepped[index] ? mod(position + 1) : position);

    return { positions: newPositions, stepped };
}

// the offset (position minus ring setting) turns the wiring
// relative to the fixed contacts of the machine
function passRotor(contact, rotor, offset, backwards) {
    const wiring = backwards ? rotor.backward : rotor.forward;
    return mod(wiring[mod(contact + offset)] - offset);
}

// send one letter through the machine and remember every contact on
// the way: key, plugboard, right, middle, left, reflector, left,
// middle, right, plugboard (= lamp)
function encryptLetter(letterIndex, settings, positions, plugboard) {
    const path = [letterIndex];
    let contact = plugboard[letterIndex];
    path.push(contact);

    // forwards: right -> middle -> left
    for (const index of [2, 1, 0]) {
        const rotor = ROTORS[settings.rotors[index]];
        contact = passRotor(contact, rotor, positions[index] - settings.rings[index], false);
        path.push(contact);
    }

    contact = REFLECTORS[settings.reflector][contact];
    path.push(contact);

    // backwards: left -> middle -> right
    for (const index of [0, 1, 2]) {
        const rotor = ROTORS[settings.rotors[index]];
        contact = passRotor(contact, rotor, positions[index] - settings.rings[index], true);
        path.push(contact);
    }

    contact = plugboard[contact];
    path.push(contact);

    return { output: contact, path };
}

// the whole text is encrypted again from the start positions every
// time, so editing in the middle of the text just works
function encryptText(text, settings) {
    const plugboard = makePlugboard(settings.plugs);
    let positions = [...settings.start];
    let output = "";
    let last = null;

    for (const character of text) {
        const letterIndex = LETTERS.indexOf(character.toUpperCase());

        // only A-Z go through the machine, everything else (spaces,
        // numbers, umlauts) is copied and does not turn the rotors
        if (letterIndex === -1) {
            output += character;
            continue;
        }

        const step = stepRotors(positions, settings.rotors);
        positions = step.positions;

        const result = encryptLetter(letterIndex, settings, positions, plugboard);
        output += LETTERS[result.output];
        last = { path: result.path, positions, stepped: step.stepped };
    }

    return { output, positions, last };
}


// ---------- user interface ----------

const ROTOR_PARTS = ["l", "m", "r"];
const ROTOR_TITLES = ["Links", "Mitte", "Rechts"];
const LAMP_ROWS = ["QWERTZUIO", "ASDFGHJK", "PYXCVBNML"];
const LETTER_INDEXES = [...LETTERS].map((_, index) => index);

const resetButton = document.getElementById("enigma-reset");
const rotorCards = document.querySelectorAll(".enigma-rotor");
const reflectorSelect = document.getElementById("enigma-reflector");
const plugboardElement = document.getElementById("enigma-plugboard");
const plugCount = document.getElementById("enigma-plug-count");
const input = document.getElementById("enigma-input");
const output = document.getElementById("enigma-output");
const swapButton = document.getElementById("enigma-swap");
const lampboard = document.getElementById("enigma-lamps");
const diagram = document.getElementById("enigma-diagram");

let settings = defaultSettings();
let selectedPlug = null;

function fillSelect(select, values, label = value => value) {
    for (const value of values) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label(value);
        select.appendChild(option);
    }
}

// every rotor exists only once, so swap it with the slot that had it
function chooseRotor(index, name) {
    const other = settings.rotors.indexOf(name);
    if (other !== -1) {
        settings.rotors[other] = settings.rotors[index];
    }
    settings.rotors[index] = name;
    update();
}

function clickPlug(letter) {
    const pairIndex = settings.plugs.findIndex(pair => pair.includes(letter));

    if (pairIndex !== -1) {
        // letter already has a cable -> unplug it
        settings.plugs.splice(pairIndex, 1);
        selectedPlug = null;
    } else if (selectedPlug === null) {
        selectedPlug = letter;
    } else if (selectedPlug === letter) {
        selectedPlug = null;
    } else {
        settings.plugs.push([selectedPlug, letter]);
        selectedPlug = null;
    }
    update();
}

// a different light colour for each of the (at most 13) cables
function pairColor(pairIndex) {
    return `hsl(${Math.round(pairIndex * 360 / 13)}, 70%, 80%)`;
}

function renderRotorCards(result) {
    rotorCards.forEach(card => {
        const index = Number(card.dataset.index);
        const notch = ROTORS[settings.rotors[index]].notch;

        card.querySelector(".rotor-select").value = settings.rotors[index];
        card.querySelector(".ring-select").value = settings.rings[index];
        card.querySelector(".position-select").value = settings.start[index];

        // the notch of the left rotor has nothing left to carry along
        card.querySelector(".notch-text").textContent =
            index === 0 ? "keiner (letzte Walze)" : `${LETTERS[notch]} → ${LETTERS[mod(notch + 1)]}`;

        const current = card.querySelector(".current-letter");
        current.textContent = LETTERS[result.positions[index]];

        // restart the animation for every rotor that turned on the last letter
        current.classList.remove("stepped");
        if (result.last !== null && result.last.stepped[index]) {
            void current.offsetWidth;
            current.classList.add("stepped");
        }
    });
    reflectorSelect.value = settings.reflector;
}

function renderPlugboard() {
    plugboardElement.querySelectorAll(".enigma-plug").forEach((button, letter) => {
        const pairIndex = settings.plugs.findIndex(pair => pair.includes(letter));
        button.style.backgroundColor = pairIndex === -1 ? "" : pairColor(pairIndex);
        button.classList.toggle("selected", letter === selectedPlug);
    });

    const pairs = settings.plugs.map(([first, second]) => LETTERS[first] + LETTERS[second]).join(" ");
    plugCount.textContent = `${settings.plugs.length} Kabel gesteckt (historisch meist 10)` + (pairs ? `: ${pairs}` : "");
}

function renderLamps(result) {
    const litLetter = result.last === null ? null : LETTERS[result.last.path[9]];
    lampboard.querySelectorAll(".enigma-lamp").forEach(lamp => {
        lamp.classList.toggle("lit", lamp.textContent === litLetter);
    });
}


// ---------- signal path diagram ----------

// columns from left to right like on the real machine:
// reflector, left, middle, right, plugboard, keyboard
const ROW_HEIGHT = 17;
const TOP = 50;
const COLUMN_WIDTH = 76;
const COLUMN_GAP = 34;
const INNER = 20; // distance from the box edge to the end of the wires

function columnX(column) {
    return 10 + column * (COLUMN_WIDTH + COLUMN_GAP);
}

function rowY(row) {
    return TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function svgText(x, y, text, attributes = "") {
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ${attributes}>${text}</text>`;
}

function svgLine(points, className) {
    return `<polyline class="${className}" points="${points.map(point => point.join(",")).join(" ")}"/>`;
}

// the reflector connects two contacts on the same side, drawn as an arc
function reflectorArc(from, to, className) {
    const x = columnX(0) + COLUMN_WIDTH - INNER;
    const bend = Math.min(8 + Math.abs(to - from) * 2, COLUMN_WIDTH - INNER - 4);
    return `<path class="${className}" d="M ${x} ${rowY(from)} C ${x - bend} ${rowY(from)}, ${x - bend} ${rowY(to)}, ${x} ${rowY(to)}"/>`;
}

function drawDiagram(result) {
    const last = result.last;
    const positions = last === null ? settings.start : last.positions;
    const plugboard = makePlugboard(settings.plugs);
    const boxHeight = LETTERS.length * ROW_HEIGHT + 8;
    let svg = "";

    // boxes and headers
    const parts = ["ukw", ...ROTOR_PARTS, "plug"];
    const titles = [settings.reflector, ...ROTOR_TITLES.map((title, index) => `${title} (${settings.rotors[index]})`), "Stecker"];
    parts.forEach((part, column) => {
        const x = columnX(column);
        svg += `<rect class="box" x="${x}" y="${TOP - 4}" width="${COLUMN_WIDTH}" height="${boxHeight}" rx="8" style="stroke: var(--enigma-${part})"/>`;
        svg += svgText(x + COLUMN_WIDTH / 2, 16, titles[column], `class="header" style="fill: var(--enigma-${part})"`);
    });
    svg += svgText(columnX(5) + 20, 16, "Tastatur", `class="header"`);
    svg += svgText(columnX(5) + 20, 32, "/ Lampe", `class="header"`);

    // reflector: contacts and fixed wiring
    const reflector = REFLECTORS[settings.reflector];
    LETTER_INDEXES.forEach(row => {
        svg += svgText(columnX(0) + COLUMN_WIDTH - 10, rowY(row), LETTERS[row]);
        if (row < reflector[row]) {
            svg += reflectorArc(row, reflector[row], "wire");
        }
    });

    // rotors: letters on the ring turn with the rotor, the top row
    // is the letter that can be seen in the window
    ROTOR_PARTS.forEach((part, index) => {
        const x = columnX(index + 1);
        const rotor = ROTORS[settings.rotors[index]];
        const offset = positions[index] - settings.rings[index];

        svg += `<rect class="window" x="${x + 2}" y="${TOP}" width="${COLUMN_WIDTH - 4}" height="${ROW_HEIGHT}" rx="4"/>`;
        if (last !== null && last.stepped[index]) {
            svg += svgText(x + COLUMN_WIDTH / 2, 32, "↻ gedreht", `class="stepped" style="fill: var(--enigma-${part})"`);
        }

        LETTER_INDEXES.forEach(row => {
            const ringLetter = LETTERS[mod(row + positions[index])];
            svg += svgText(x + 10, rowY(row), ringLetter);
            svg += svgText(x + COLUMN_WIDTH - 10, rowY(row), ringLetter);

            // forwards a signal enters on the right and leaves on the left
            const exit = passRotor(row, rotor, offset, false);
            svg += svgLine([[x + COLUMN_WIDTH - INNER, rowY(row)], [x + INNER, rowY(exit)]], "wire");
        });
    });

    // plugboard: cables get the colour of their button. All colours are
    // drawn first so the wires of every row stay on top of them
    const plugX = columnX(4);
    LETTER_INDEXES.forEach(row => {
        const pairIndex = settings.plugs.findIndex(pair => pair.includes(row));
        if (pairIndex !== -1) {
            svg += `<rect x="${plugX + 2}" y="${rowY(row) - ROW_HEIGHT / 2 + 1}" width="${COLUMN_WIDTH - 4}" height="${ROW_HEIGHT - 2}" rx="4" style="fill: ${pairColor(pairIndex)}"/>`;
        }
    });
    LETTER_INDEXES.forEach(row => {
        svg += svgText(plugX + 10, rowY(row), LETTERS[row]);
        svg += svgText(plugX + COLUMN_WIDTH - 10, rowY(row), LETTERS[row]);
        svg += svgLine([[plugX + COLUMN_WIDTH - INNER, rowY(row)], [plugX + INNER, rowY(plugboard[row])]], "wire");
    });

    // keyboard and lamps: pressed key and lit lamp are highlighted
    const keyX = columnX(5) + 20;
    LETTER_INDEXES.forEach(row => {
        let highlight = "";
        if (last !== null && row === last.path[0]) {
            highlight = "key-forward";
        } else if (last !== null && row === last.path[9]) {
            highlight = "key-back";
        }
        if (highlight) {
            svg += `<circle cx="${keyX}" cy="${rowY(row)}" r="8" class="${highlight}"/>`;
        }
        svg += svgText(keyX, rowY(row), LETTERS[row], highlight ? `class="key-letter"` : "");
    });

    // signal path of the last letter
    if (last !== null) {
        const path = last.path;

        // forwards: keyboard -> plugboard -> right -> middle -> left
        const forward = [[keyX - 10, rowY(path[0])]];
        for (let step = 0; step < 4; step++) {
            const x = columnX(4 - step);
            forward.push(
                [x + COLUMN_WIDTH, rowY(path[step])],
                [x + COLUMN_WIDTH - INNER, rowY(path[step])],
                [x + INNER, rowY(path[step + 1])],
                [x, rowY(path[step + 1])]
            );
        }
        forward.push([columnX(0) + COLUMN_WIDTH, rowY(path[4])], [columnX(0) + COLUMN_WIDTH - INNER, rowY(path[4])]);
        svg += svgLine(forward, "signal forward");

        // reflector, then backwards: left -> middle -> right -> plugboard -> lamp
        svg += reflectorArc(path[4], path[5], "signal back");
        const back = [[columnX(0) + COLUMN_WIDTH - INNER, rowY(path[5])], [columnX(0) + COLUMN_WIDTH, rowY(path[5])]];
        for (let step = 0; step < 4; step++) {
            const x = columnX(step + 1);
            back.push(
                [x, rowY(path[step + 5])],
                [x + INNER, rowY(path[step + 5])],
                [x + COLUMN_WIDTH - INNER, rowY(path[step + 6])],
                [x + COLUMN_WIDTH, rowY(path[step + 6])]
            );
        }
        back.push([keyX - 10, rowY(path[9])]);
        svg += svgLine(back, "signal back");
    }

    diagram.innerHTML = svg;
}

function update() {
    const result = encryptText(input.value, settings);
    output.textContent = result.output;

    renderRotorCards(result);
    renderPlugboard();
    renderLamps(result);
    drawDiagram(result);
}


// ---------- build the controls once ----------

rotorCards.forEach(card => {
    const index = Number(card.dataset.index);
    const rotorSelect = card.querySelector(".rotor-select");
    const ringSelect = card.querySelector(".ring-select");
    const positionSelect = card.querySelector(".position-select");

    fillSelect(rotorSelect, Object.keys(ROTORS));
    fillSelect(ringSelect, LETTER_INDEXES, value => `${LETTERS[value]} (${String(value + 1).padStart(2, "0")})`);
    fillSelect(positionSelect, LETTER_INDEXES, value => LETTERS[value]);

    rotorSelect.addEventListener("change", () => chooseRotor(index, rotorSelect.value));
    ringSelect.addEventListener("change", () => {
        settings.rings[index] = Number(ringSelect.value);
        update();
    });
    positionSelect.addEventListener("change", () => {
        settings.start[index] = Number(positionSelect.value);
        update();
    });
    card.querySelector(".position-down").addEventListener("click", () => {
        settings.start[index] = mod(settings.start[index] - 1);
        update();
    });
    card.querySelector(".position-up").addEventListener("click", () => {
        settings.start[index] = mod(settings.start[index] + 1);
        update();
    });
});

fillSelect(reflectorSelect, Object.keys(REFLECTORS));
reflectorSelect.addEventListener("change", () => {
    settings.reflector = reflectorSelect.value;
    update();
});

LETTER_INDEXES.forEach(letter => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "enigma-plug";
    button.textContent = LETTERS[letter];
    button.addEventListener("click", () => clickPlug(letter));
    plugboardElement.appendChild(button);
});

for (const row of LAMP_ROWS) {
    const rowElement = document.createElement("div");
    rowElement.className = "enigma-lamp-row";
    for (const letter of row) {
        const lamp = document.createElement("span");
        lamp.className = "enigma-lamp";
        lamp.textContent = letter;
        rowElement.appendChild(lamp);
    }
    lampboard.appendChild(rowElement);
}

resetButton.addEventListener("click", () => {
    settings = defaultSettings();
    selectedPlug = null;
    update();
});

swapButton.addEventListener("click", () => {
    input.value = output.textContent;
    update();
});

input.addEventListener("input", update);

update();
