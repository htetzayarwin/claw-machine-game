
const claw = document.getElementById("claw");
const toys = document.querySelectorAll(".toy");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const dropBtn = document.getElementById("dropBtn");

const message = document.getElementById("message");
const scoreDisplay = document.getElementById("score");
const prizeBox = document.getElementById("prizeBox");

let clawPosition = 50;
let score = 0;
let isPlaying = false;

function moveLeft() {
    if (isPlaying) return;

    clawPosition = Math.max(8, clawPosition - 10);
    claw.style.left = clawPosition + "%";
}

function moveRight() {
    if (isPlaying) return;

    clawPosition = Math.min(92, clawPosition + 10);
    claw.style.left = clawPosition + "%";
}

function dropClaw() {
    if (isPlaying) return;

    isPlaying = true;
    message.textContent = "Claw is moving down...";

    claw.animate(
        [
            { top: "0px" },
            { top: "190px" },
            { top: "0px" }
        ],
        {
            duration: 1800,
            easing: "ease-in-out"
        }
    ).onfinish = () => {
        catchToy();
    };
}

function catchToy() {
    const availableToys = [...document.querySelectorAll(".toy")];

    if (availableToys.length === 0) {
        message.textContent = "No toys left! Game Over!";
        isPlaying = false;
        return;
    }

    // Find the toy closest to the claw position
    const glass = document.querySelector(".glass");
    const glassRect = glass.getBoundingClientRect();

    const clawX = glassRect.left +
        (clawPosition / 100) * glassRect.width;

    let closestToy = null;
    let smallestDistance = Infinity;

    availableToys.forEach(toy => {
        const rect = toy.getBoundingClientRect();

        const toyX = rect.left + rect.width / 2;
        const distance = Math.abs(clawX - toyX);

        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestToy = toy;
        }
    });

    if (smallestDistance < 45 && closestToy) {
        const prize = closestToy.textContent;

        closestToy.remove();

        score++;
        scoreDisplay.textContent = score;

        const prizeItem = document.createElement("span");
        prizeItem.textContent = prize;
        prizeItem.style.fontSize = "22px";

        prizeBox.appendChild(prizeItem);

        message.textContent = "You caught a prize! 🎉";
    } else {
        message.textContent = "Missed! Try again!";
    }

    isPlaying = false;
}

leftBtn.addEventListener("click", moveLeft);
rightBtn.addEventListener("click", moveRight);
dropBtn.addEventListener("click", dropClaw);

// Keyboard controls
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        moveLeft();
    }

    if (event.key === "ArrowRight") {
        moveRight();
    }

    if (event.key === "ArrowDown" || event.key === " ") {
        dropClaw();
    }
});
