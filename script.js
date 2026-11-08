
(() => {
    "use strict";

    const $ = id => document.getElementById(id);

    const claw = $("claw");
    const toyPile = $("toyPile");
    const carriedPrize = $("carriedPrize");
    const scoreEl = $("score");
    const triesEl = $("tries");
    const prizeCountEl = $("prizeCount");
    const messageEl = $("message");
    const messageIcon = $("messageIcon");
    const prizeBox = $("prizeBox");

    const leftBtn = $("leftBtn");
    const rightBtn = $("rightBtn");
    const dropBtn = $("dropBtn");
    const resetBtn = $("resetBtn");
    const soundBtn = $("soundBtn");

    const plushies = [
        { emoji: "🐱", name: "Kitty", points: 10 },
        { emoji: "🐻", name: "Teddy", points: 15 },
        { emoji: "🐰", name: "Bunny", points: 10 },
        { emoji: "🐼", name: "Panda", points: 20 },
        { emoji: "🐸", name: "Froggy", points: 15 },
        { emoji: "🦊", name: "Foxy", points: 20 },
        { emoji: "🐵", name: "Monkey", points: 15 },
        { emoji: "🐧", name: "Penguin", points: 25 },
        { emoji: "🐹", name: "Hamster", points: 10 },
        { emoji: "🧸", name: "Bear", points: 30 }
    ];

    const state = {
        x: 50,
        score: 0,
        tries: 10,
        prizes: 0,
        busy: false,
        muted: false,
        audio: null
    };

    const clamp = (v, min, max) =>
        Math.max(min, Math.min(max, v));

    // SOUND ENGINE
    function sound(type) {
        if (state.muted) return;

        try {
            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContext) return;

            state.audio = state.audio || new AudioContext();

            if (state.audio.state === "suspended") {
                state.audio.resume();
            }

            const ctx = state.audio;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime;

            const notes = {
                win: [660, 880, 1100],
                drop: [420, 300],
                miss: [220, 160],
                grab: [520],
                tap: [440]
            };

            const frequencies = notes[type] || notes.tap;

            osc.type = type === "win" ? "square" : "triangle";

            osc.frequency.setValueAtTime(
                frequencies[0], now
            );

            frequencies.slice(1).forEach((note, i) => {
                osc.frequency.setValueAtTime(
                    note, now + (i + 1) * 0.09
                );
            });

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(
                0.07, now + 0.015
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001, now + 0.32
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.34);

        } catch (error) {
            console.warn("Audio unavailable", error);
        }
    }

    // MESSAGE
    function say(text, icon = "★") {
        messageEl.textContent = text;
        messageIcon.textContent = icon;
    }

    // UPDATE SCORE AND CONTROLS
    function updateStats() {
        scoreEl.textContent =
            String(state.score).padStart(3, "0");

        triesEl.textContent =
            String(state.tries).padStart(2, "0");

        prizeCountEl.textContent =
            String(state.prizes).padStart(2, "0");

        $("collectionTotal").textContent =
            state.prizes + " / 10";

        const disabled =
            state.busy || state.tries <= 0;

        leftBtn.disabled = disabled;
        rightBtn.disabled = disabled;
        dropBtn.disabled = disabled;
    }

    // MOVE CLAW
    function moveTo(x) {
        if (state.busy || state.tries <= 0) return;

        state.x = clamp(x, 9, 91);

        claw.style.setProperty(
            "--x", state.x + "%"
        );
    }

    function moveBy(amount) {
        moveTo(state.x + amount);
    }

    // CREATE TOYS
    function makeToy(data) {
        const toy = document.createElement("div");

        toy.className = "toy";
        toy.textContent = data.emoji;
        toy.dataset.points = data.points;
        toy.dataset.name = data.name;

        toy.setAttribute(
            "aria-label",
            data.name + " plushie"
        );

        return toy;
    }

    function populate() {
        toyPile.replaceChildren();

        const shuffled = [...plushies].sort(
            () => Math.random() - 0.5
        );

        shuffled.forEach(item => {
            toyPile.appendChild(makeToy(item));
        });
    }

    // FIND TOY UNDER THE CLAW
    function nearestToy() {
        const toys = [
            ...toyPile.querySelectorAll(".toy")
        ];

        if (!toys.length) return null;

        const pileRect = toyPile.getBoundingClientRect();

        const clawX =
            pileRect.left +
            pileRect.width * (state.x / 100);

        let best = null;
        let bestDistance = Infinity;

        toys.forEach(toy => {
            const rect = toy.getBoundingClientRect();

            const center = rect.left + rect.width / 2;

            const distance = Math.abs(
                center - clawX
            );

            if (distance < bestDistance) {
                best = toy;
                bestDistance = distance;
            }
        });

        const maxDistance = Math.max(
            34,
            pileRect.width * 0.105
        );

        return bestDistance <= maxDistance
            ? best
            : null;
    }

    function wait(ms) {
        return new Promise(resolve =>
            setTimeout(resolve, ms)
        );
    }

    // DROP AND GRAB
    async function drop() {
        if (state.busy || state.tries <= 0) return;

        state.busy = true;
        state.tries--;

        updateStats();

        say("Lowering the claw... Good luck!", "↓");
        sound("drop");

        claw.classList.add("open");

        claw.style.setProperty(
            "--drop",
            "min(76%, 285px)"
        );

        await wait(480);

        const target = nearestToy();

        if (target) {
            const emoji = target.textContent;
            const points = Number(target.dataset.points);
            const name = target.dataset.name;

            target.classList.add("grabbed");

            carriedPrize.textContent = emoji;

            claw.classList.add("carrying");
            claw.classList.remove("open");

            say("Got one! Bringing your prize up...", "♥");
            sound("grab");

            await wait(250);

            target.remove();

            claw.style.setProperty("--drop", "42px");

            await wait(570);

            // Move claw toward prize exit
            claw.style.transition =
                "left .45s ease, height .35s ease";

            claw.style.setProperty("--x", "12%");

            await wait(480);

            // Release prize
            carriedPrize.textContent = "";

            claw.classList.remove("carrying");

            claw.style.setProperty(
                "--x", state.x + "%"
            );

            claw.style.transition = "";

            // Update score
            state.score += points;
            state.prizes++;

            const item = document.createElement("span");

            item.className = "prize";
            item.textContent = emoji;
            item.title = name + " - " + points + " points";

            prizeBox.querySelector(
                ".empty-note"
            )?.remove();

            prizeBox.appendChild(item);

            say(
                "Prize collected! +" + points + " points!",
                "✦"
            );

            sound("win");

        } else {
            claw.classList.remove("open");

            claw.style.setProperty("--drop", "42px");

            await wait(480);

            say(
                "Missed! Line up over a plushie and try again.",
                "↻"
            );

            sound("miss");
        }

        claw.style.setProperty("--drop", "42px");

        state.busy = false;

        updateStats();

        if (state.tries === 0) {
            say(
                "Game over! You collected " +
                state.prizes +
                " prize(s). Press NEW GAME to play again.",
                "★"
            );
        } else if (!toyPile.querySelector(".toy")) {
            say(
                "Amazing! You cleared the machine! Start again!",
                "🏆"
            );
        }
    }

    // RESET GAME
    function reset() {
        state.x = 50;
        state.score = 0;
        state.tries = 10;
        state.prizes = 0;
        state.busy = false;

        claw.style.setProperty("--x", "50%");
        claw.style.setProperty("--drop", "42px");

        claw.classList.remove(
            "open",
            "carrying"
        );

        carriedPrize.textContent = "";

        prizeBox.innerHTML =
            '<span class="empty-note">' +
            'Your plushies will appear here!' +
            '</span>';

        populate();
        updateStats();

        say(
            "Move the claw above a plushie, then press DROP!",
            "★"
        );

        sound("tap");
    }

    // HOLD BUTTON FOR CONTINUOUS MOVEMENT
    function bindHold(button, delta) {
        let timer = null;

        const start = event => {
            event.preventDefault();

            if (state.busy || state.tries <= 0) return;

            moveBy(delta);

            timer = setInterval(
                () => moveBy(delta),
                115
            );
        };

        const stop = () => {
            if (timer) clearInterval(timer);
            timer = null;
        };

        button.addEventListener("pointerdown", start);

        [
            "pointerup",
            "pointerleave",
            "pointercancel"
        ].forEach(event => {
            button.addEventListener(event, stop);
        });

        button.addEventListener(
            "contextmenu",
            event => event.preventDefault()
        );
    }

    // BUTTON EVENTS
    bindHold(leftBtn, -7);
    bindHold(rightBtn, 7);

    dropBtn.addEventListener("click", drop);

    resetBtn.addEventListener("click", reset);

    // SOUND TOGGLE
    soundBtn.addEventListener("click", () => {
        state.muted = !state.muted;

        soundBtn.textContent =
            state.muted ? "♫̸" : "♫";

        soundBtn.setAttribute(
            "aria-label",
            state.muted ? "Turn sound on" : "Mute sound"
        );

        if (!state.muted) sound("tap");
    });

    // KEYBOARD CONTROLS
    document.addEventListener("keydown", event => {
        if (
            ["ArrowLeft", "ArrowRight", "ArrowDown", " "]
            .includes(event.key)
        ) {
            event.preventDefault();
        }

        if (
            event.repeat &&
            !["ArrowLeft", "ArrowRight"].includes(event.key)
        ) return;

        if (event.key === "ArrowLeft") {
            moveBy(-6);
        }

        if (event.key === "ArrowRight") {
            moveBy(6);
        }

        if (
            event.key === "ArrowDown" ||
            event.key === " "
        ) {
            drop();
        }
    });

    // START GAME
    populate();
    updateStats();

})();
