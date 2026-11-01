// Buchstabenhäufigkeit im Englischen (in %), Quelle siehe Quellenverzeichnis [8]
const FREQUENCIES = [
    ["E", 12.02], ["T", 9.10], ["A", 8.12], ["O", 7.68], ["I", 7.31], ["N", 6.95],
    ["S", 6.28], ["R", 6.02], ["H", 5.92], ["D", 4.32], ["L", 3.98], ["U", 2.88],
    ["C", 2.71], ["M", 2.61], ["F", 2.30], ["Y", 2.11], ["W", 2.09], ["G", 2.03],
    ["P", 1.82], ["B", 1.49], ["V", 1.11], ["K", 0.69], ["X", 0.17], ["Q", 0.11],
    ["J", 0.10], ["Z", 0.07]
];

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    return element;
}

// Balken mit abgerundeter Oberkante, unten flach auf der Grundlinie
function barPath(x, y, width, height, radius) {
    const r = Math.min(radius, height, width / 2);
    return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} ` +
        `H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
}

function drawFrequencyChart(svg, tooltip) {
    const width = 760;
    const height = 300;
    const left = 40;
    const right = 10;
    const top = 20;
    const bottom = 30;
    const maxValue = 14;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const slot = plotWidth / FREQUENCIES.length;
    const barWidth = slot - 6;

    const yFor = value => top + plotHeight - (value / maxValue) * plotHeight;

    // Hilfslinien und Achsenbeschriftung
    for (let value = 0; value <= maxValue; value += 2) {
        const y = yFor(value);
        svg.appendChild(svgElement("line", {
            x1: left, x2: width - right, y1: y, y2: y,
            class: value === 0 ? "chart-baseline" : "chart-grid"
        }));
        const label = svgElement("text", { x: left - 8, y: y + 4, class: "chart-axis", "text-anchor": "end" });
        label.textContent = value + "%";
        svg.appendChild(label);
    }

    FREQUENCIES.forEach(([letter, value], index) => {
        const x = left + index * slot + (slot - barWidth) / 2;
        const y = yFor(value);
        const group = svgElement("g", { class: "chart-bar" });

        group.appendChild(svgElement("path", {
            d: barPath(x, y, barWidth, top + plotHeight - y, 4),
            class: "chart-bar-fill"
        }));

        // unsichtbare Fläche über die ganze Spalte, damit auch kleine Balken gut treffbar sind
        group.appendChild(svgElement("rect", {
            x: left + index * slot, y: top, width: slot, height: plotHeight,
            class: "chart-hit"
        }));

        const letterLabel = svgElement("text", {
            x: x + barWidth / 2, y: height - bottom + 18, class: "chart-letter", "text-anchor": "middle"
        });
        letterLabel.textContent = letter;
        group.appendChild(letterLabel);

        group.addEventListener("mouseenter", () => {
            group.classList.add("active");
            tooltip.innerHTML = `<strong>${letter}</strong> ${value.toFixed(2)}%`;
            tooltip.hidden = false;
        });
        group.addEventListener("mousemove", event => {
            const box = svg.parentElement.getBoundingClientRect();
            tooltip.style.left = (event.clientX - box.left) + "px";
            tooltip.style.top = (event.clientY - box.top) + "px";
        });
        group.addEventListener("mouseleave", () => {
            group.classList.remove("active");
            tooltip.hidden = true;
        });

        svg.appendChild(group);
    });

    // nur der höchste Wert wird direkt beschriftet
    const [topLetter, topValue] = FREQUENCIES[0];
    const topLabel = svgElement("text", {
        x: left + slot / 2, y: yFor(topValue) - 6, class: "chart-value", "text-anchor": "middle"
    });
    topLabel.textContent = topValue.toFixed(2) + "%";
    svg.appendChild(topLabel);
}

function fillFrequencyTable(table) {
    const body = table.querySelector("tbody");
    for (const [letter, value] of FREQUENCIES) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${letter}</td><td>${value.toFixed(2)}%</td>`;
        body.appendChild(row);
    }
}

drawFrequencyChart(document.getElementById("frequency-chart"), document.getElementById("frequency-tooltip"));
fillFrequencyTable(document.getElementById("frequency-table"));
