// Einfaches Syntax-Highlighting für Python-Code in <pre><code class="language-python">
// Reihenfolge ist wichtig: was zuerst passt, gewinnt (z.B. "#" in einem String ist kein Kommentar)
const PYTHON_TOKENS = new RegExp([
    // Strings, auch mit Präfix (f"...", r'...') und mehrzeilig ("""...""")
    /(?<string>(?:\b[rRbBfFuU]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))/,
    /(?<comment>#.*)/,
    /(?<keyword>\b(?:False|None|True|and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b)/,
    /(?<builtin>\b(?:print|len|range|str|int|float|bool|list|dict|set|tuple|enumerate|input|open|type)\b)/,
    /(?<number>\b\d[\d_]*(?:\.\d+)?\b)/,
    // Funktionsnamen: Wort direkt vor einer Klammer
    /(?<function>\b[A-Za-z_]\w*(?=\())/
].map(part => part.source).join("|"), "g");

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightPython(code) {
    let result = "";
    let lastIndex = 0;
    for (const match of code.matchAll(PYTHON_TOKENS)) {
        const type = Object.keys(match.groups).find(name => match.groups[name] !== undefined);
        result += escapeHtml(code.slice(lastIndex, match.index));
        result += `<span class="tok-${type}">${escapeHtml(match[0])}</span>`;
        lastIndex = match.index + match[0].length;
    }
    return result + escapeHtml(code.slice(lastIndex));
}

for (const block of document.querySelectorAll("code.language-python")) {
    block.innerHTML = highlightPython(block.textContent);
}
