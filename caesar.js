const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const modeTitle = document.getElementById("cipher-mode-title");
const modeButton = document.getElementById("cipher-mode-btn");
const inputLabel = document.getElementById("cipher-input-label");
const input = document.getElementById("cipher-input");
const bruteforceRow = document.getElementById("cipher-bruteforce-row");
const bruteforceCheckbox = document.getElementById("cipher-bruteforce");
const shiftRow = document.getElementById("cipher-shift-row");
const shiftSlider = document.getElementById("cipher-shift");
const shiftValue = document.getElementById("cipher-shift-value");
const outputLabel = document.getElementById("cipher-output-label");
const output = document.getElementById("cipher-output");
const bruteforceList = document.getElementById("cipher-bruteforce-list");

let decrypting = false;

function shiftCharacter(character, shift) {
    const letterIndex = LETTERS.indexOf(character.toUpperCase());

    // not a letter (space, number, umlaut, ...) -> keep it as it is
    if (letterIndex === -1) {
        return character;
    }

    // wrap around with modulo; in JS % can return negative numbers
    // (e.g. -3 % 26 = -3), so we add the length once more
    const shiftedIndex = ((letterIndex + shift) % LETTERS.length + LETTERS.length) % LETTERS.length;
    const shiftedLetter = LETTERS[shiftedIndex];

    // keep upper- and lowercase
    if (character === character.toUpperCase()) {
        return shiftedLetter;
    }
    return shiftedLetter.toLowerCase();
}

function shiftText(text, shift) {
    let result = "";
    for (const character of text) {
        result += shiftCharacter(character, shift);
    }
    return result;
}

function update() {
    const shift = Number(shiftSlider.value);
    const bruteforce = decrypting && bruteforceCheckbox.checked;

    shiftValue.textContent = shift;
    shiftRow.hidden = bruteforce;
    output.hidden = bruteforce;
    bruteforceList.hidden = !bruteforce;

    if (bruteforce) {
        // try every sensible key (0 and 26 land on the same letter)
        bruteforceList.innerHTML = "";
        for (let key = 1; key < LETTERS.length; key++) {
            const item = document.createElement("li");
            item.textContent = `Schlüssel ${key}: ${shiftText(input.value, -key)}`;
            bruteforceList.appendChild(item);
        }
    } else if (decrypting) {
        output.textContent = shiftText(input.value, -shift);
    } else {
        output.textContent = shiftText(input.value, shift);
    }
}

modeButton.addEventListener("click", () => {
    decrypting = !decrypting;

    modeTitle.textContent = decrypting ? "Entschlüsseln" : "Verschlüsseln";
    modeButton.textContent = decrypting ? "Zum Verschlüsseln" : "Zum Entschlüsseln";
    inputLabel.textContent = decrypting ? "Geheimtext" : "Klartext";
    outputLabel.textContent = decrypting ? "Klartext" : "Geheimtext";
    bruteforceRow.hidden = !decrypting;

    update();
});

input.addEventListener("input", update);
shiftSlider.addEventListener("input", update);
bruteforceCheckbox.addEventListener("change", update);

update();
