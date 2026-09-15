// ==UserScript==
// @name         AI Study Helper - Own Site
// @namespace    school-ai-helper
// @version      1.0.0
// @description  Mobile-friendly study helper with generic question and choice detection
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    if (document.getElementById("ai-study-helper")) return;

    const panel = document.createElement("div");

    panel.id = "ai-study-helper";

    panel.innerHTML = `
        <div class="ash-header">
            <span>🤖 AI Study Helper</span>
            <button id="ash-close">×</button>
        </div>

        <div class="ash-body">

            <div id="ash-status">
                Ready
            </div>

            <div class="ash-title">
                QUESTION
            </div>

            <div id="ash-question" class="ash-box">
                Tap "Read Question" to scan the page.
            </div>

            <div class="ash-title">
                ANSWER CHOICES
            </div>

            <div id="ash-choices">
                <div class="ash-muted">
                    No choices detected yet.
                </div>
            </div>

            <div class="ash-buttons">

                <button id="ash-read">
                    📖 Read Question
                </button>

                <button id="ash-explain">
                    🧠 Explain
                </button>

            </div>

            <div class="ash-title">
                EXPLANATION
            </div>

            <div id="ash-answer" class="ash-box">
                The explanation will appear here.
            </div>

        </div>
    `;

    const style = document.createElement("style");

    style.textContent = `

        #ai-study-helper {
            position: fixed;
            right: 12px;
            bottom: 12px;

            width: min(340px, calc(100vw - 24px));
            max-height: calc(100vh - 24px);

            z-index: 2147483647;

            background: #151515;
            color: white;

            border: 1px solid #383838;
            border-radius: 16px;

            overflow: hidden;

            box-shadow:
                0 10px 35px rgba(0,0,0,.5);

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Arial,
                sans-serif;
        }

        #ai-study-helper * {
            box-sizing: border-box;
        }

        .ash-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            padding: 14px;

            background: #242424;

            font-size: 16px;
            font-weight: 700;
        }

        #ash-close {
            border: none;
            background: none;

            color: #aaa;

            font-size: 25px;

            padding: 0 5px;

            cursor: pointer;
        }

        .ash-body {
            padding: 13px;

            max-height: calc(100vh - 75px);

            overflow-y: auto;

            -webkit-overflow-scrolling: touch;
        }

        #ash-status {
            color: #999;

            font-size: 12px;

            margin-bottom: 10px;
        }

        .ash-title {
            color: #999;

            font-size: 11px;
            font-weight: 700;

            letter-spacing: .7px;

            margin-top: 12px;
            margin-bottom: 6px;
        }

        .ash-box {
            background: #202020;

            border: 1px solid #353535;

            border-radius: 10px;

            padding: 11px;

            line-height: 1.45;

            white-space: pre-wrap;

            overflow-wrap: anywhere;
        }

        #ash-choices {
            display: grid;
            gap: 6px;
        }

        .ash-choice {
            background: #202020;

            border: 1px solid #383838;

            border-radius: 9px;

            padding: 10px;

            line-height: 1.4;
        }

        .ash-muted {
            color: #777;

            background: #1d1d1d;

            border-radius: 9px;

            padding: 10px;
        }

        .ash-buttons {
            display: grid;

            grid-template-columns: 1fr 1fr;

            gap: 7px;

            margin-top: 12px;
        }

        .ash-buttons button {
            min-height: 44px;

            border: none;

            border-radius: 9px;

            background: #303030;

            color: white;

            font-weight: 700;

            cursor: pointer;

            touch-action: manipulation;
        }

        .ash-buttons button:active {
            transform: scale(.98);
        }

        #ash-answer {
            min-height: 50px;
        }

        @media (max-width: 480px) {

            #ai-study-helper {
                left: 8px;
                right: 8px;

                bottom: 8px;

                width: auto;

                border-radius: 14px;
            }

            .ash-buttons {
                grid-template-columns: 1fr;
            }

        }

    `;

    document.head.appendChild(style);

    document.body.appendChild(panel);


    // ----------------------------
    // Utility
    // ----------------------------

    function clean(text) {

        return (text || "")
            .replace(/\u00a0/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

    }


    // ----------------------------
    // Read visible page
    // ----------------------------

    function getPageText() {

        return clean(document.body.innerText);

    }


    // ----------------------------
    // Detect question
    // ----------------------------

    function findQuestion(text) {

        const labeled = text.match(
            /(?:^|\n)\s*Question\s*\d*\s*[:.)-]?\s*([\s\S]*?)(?=\n\s*[A-E][.)]\s|$)/i
        );

        if (labeled && labeled[1]) {

            return clean(labeled[1])
                .slice(0, 2500);

        }


        const questionMark = text.match(
            /([^.!?\n]{10,700}\?)(?=\s*(?:\n|\r|\s)+(?:A|B|C|D|E)[.)]\s)/i
        );

        if (questionMark && questionMark[1]) {

            return clean(questionMark[1]);

        }


        const qIndex = text.indexOf("?");

        if (qIndex > 0 && qIndex < 2500) {

            return clean(
                text.slice(
                    Math.max(0, qIndex - 1000),
                    qIndex + 1
                )
            );

        }


        return clean(text).slice(0, 1200);

    }


    // ----------------------------
    // Detect A-E choices
    // ----------------------------

    function findChoices(text) {

        const choices = [];

        const seen = new Set();

        const regex =
            /(?:^|\n|\s)([A-E])\s*[.)]\s+([\s\S]*?)(?=(?:\s+(?:A|B|C|D|E)\s*[.)]\s)|$)/gi;

        let match;

        while (
            (match = regex.exec(text)) !== null &&
            choices.length < 5
        ) {

            const letter =
                match[1].toUpperCase();

            const value =
                clean(match[2]);

            if (!value) continue;

            if (value.length > 800) continue;

            const key =
                letter + "|" + value;

            if (seen.has(key)) continue;

            seen.add(key);

            choices.push({
                letter: letter,
                text: value
            });

        }

        return choices;

    }


    // ----------------------------
    // Scan page
    // ----------------------------

    function scanPage() {

        const text = getPageText();

        const question =
            findQuestion(text);

        const choices =
            findChoices(text);


        document.getElementById(
            "ash-question"
        ).textContent =
            question ||
            "No question detected.";


        const choiceBox =
            document.getElementById(
                "ash-choices"
            );

        choiceBox.innerHTML = "";


        if (!choices.length) {

            choiceBox.innerHTML =
                `<div class="ash-muted">
                    No A-E choices detected.
                </div>`;

        } else {

            choices.forEach(choice => {

                const item =
                    document.createElement("div");

                item.className =
                    "ash-choice";

                item.textContent =
                    choice.letter +
                    ". " +
                    choice.text;

                choiceBox.appendChild(item);

            });

        }


        document.getElementById(
            "ash-status"
        ).textContent =
            `Scanned • ${choices.length} choice${
                choices.length === 1 ? "" : "s"
            } detected`;


        return {
            question,
            choices
        };

    }


    // ----------------------------
    // AI BACKEND
    // ----------------------------
    //
    // When you have your own website/backend,
    // connect this function to it.
    //
    // Do NOT put an AI API key directly
    // inside this userscript.
    //

    async function askYourAI(question, choices) {

        /*
        Example:

        const response = await fetch(
            "https://YOUR-BACKEND.example/solve",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: question,
                    choices: choices
                })
            }
        );

        const data = await response.json();

        return data.explanation;
        */


        return (
            "AI backend is not connected yet.\n\n" +

            "The page was successfully scanned.\n" +

            "Question detected: " +
            (question ? "Yes" : "No") +

            "\nChoices detected: " +
            choices.length +

            "\n\nConnect this function to an AI backend " +
            "that you control to generate explanations."
        );

    }


    // ----------------------------
    // Read Question button
    // ----------------------------

    document.getElementById(
        "ash-read"
    ).addEventListener(
        "click",
        scanPage
    );


    // ----------------------------
    // Explain button
    // ----------------------------

    document.getElementById(
        "ash-explain"
    ).addEventListener(
        "click",
        async function () {

            const data =
                scanPage();


            if (!data.question) {

                document.getElementById(
                    "ash-answer"
                ).textContent =
                    "No question detected.";

                return;

            }


            document.getElementById(
                "ash-status"
            ).textContent =
                "Analyzing…";


            document.getElementById(
                "ash-answer"
            ).textContent =
                "🧠 Working…";


            try {

                const result =
                    await askYourAI(
                        data.question,
                        data.choices
                    );


                document.getElementById(
                    "ash-answer"
                ).textContent =
                    result;


                document.getElementById(
                    "ash-status"
                ).textContent =
                    "Ready";

            }

            catch (error) {

                console.error(error);

                document.getElementById(
                    "ash-answer"
                ).textContent =
                    "Could not contact the AI backend.";

                document.getElementById(
                    "ash-status"
                ).textContent =
                    "Error";

            }

        }
    );


    // ----------------------------
    // Close button
    // ----------------------------

    document.getElementById(
        "ash-close"
    ).addEventListener(
        "click",
        function () {

            panel.remove();

        }
    );

})();