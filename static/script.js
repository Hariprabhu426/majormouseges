let lastSent = 0;
let lastClickTime = 0;
let lastRightClick = 0;

const clickDelay = 500;
const rightClickDelay = 700;

let running = false;

// SCROLL VARIABLES
let prevFingerY = null;
const scrollThreshold = 0.01;
const scrollSensitivity = 800;

// ======================
// INTRO → APP TRANSITION
// ======================
window.onload = function () {
    const intro = document.getElementById("intro");
    const app = document.getElementById("app");

    setTimeout(() => {
        if (intro) intro.style.display = "none";
        if (app) {
            app.style.display = "block";
            app.style.opacity = "1";
        }
    }, 3000);
};

// ======================
// UI ELEMENTS
// ======================
window.addEventListener("DOMContentLoaded", () => {

    const statusText = document.getElementById("status");
    const video = document.getElementById("video");

    document.getElementById("startBtn").addEventListener("click", () => {
        running = true;
        statusText.innerText = "🟢 Running";
        statusText.classList.add("running");
    });

    document.getElementById("stopBtn").addEventListener("click", () => {
        running = false;
        statusText.innerText = "🔴 Stopped";
        statusText.classList.remove("running");
    });

    // ======================
    // CAMERA STREAM
    // ======================
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Camera error:", err);
        });

    // ======================
    // HANDS SETUP
    // ======================
    const hands = new Hands({
        locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.75
    });

    // ======================
    // HAND LOGIC
    // ======================
    hands.onResults(results => {

        if (!running) return;

        const now = Date.now();
        if (now - lastSent < 150) return;

        if (!results.multiHandLandmarks?.length) return;

        const lm = results.multiHandLandmarks[0];

        let index = lm[8];
        let thumb = lm[4];
        let middle = lm[12];

        // ======================
        // MOVE CURSOR
        // ======================
        let currX = 1 - index.x;
        let currY = index.y;

        fetch('/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: currX, y: currY })
        });

        // ======================
        // LEFT CLICK (PINCH)
        // ======================
        let pinch = Math.hypot(thumb.x - index.x, thumb.y - index.y);

        if (pinch < 0.05 && now - lastClickTime > clickDelay) {
            lastClickTime = now;
            fetch('/click', { method: 'POST' });
        }

        // ======================
        // RIGHT CLICK
        // ======================
        let twoFinger = Math.hypot(index.x - middle.x, index.y - middle.y);

        if (twoFinger < 0.04 && now - lastRightClick > rightClickDelay) {
            lastRightClick = now;
            fetch('/right_click', { method: 'POST' });
        }

        // ======================
        // SCROLL (FIXED)
        // ======================
        let isOpenHand =
            lm[8].y < lm[6].y &&
            lm[12].y < lm[10].y &&
            lm[16].y < lm[14].y &&
            lm[20].y < lm[18].y;

        if (isOpenHand) {
            let currentY = lm[8].y;

            if (prevFingerY !== null) {
                let deltaY = currentY - prevFingerY;

                if (Math.abs(deltaY) > scrollThreshold) {
                    fetch('/scroll', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            scroll: -deltaY * scrollSensitivity
                        })
                    });
                }
            }

            prevFingerY = currentY;
        } else {
            prevFingerY = null;
        }
    });

    // ======================
    // CAMERA LOOP (CORRECT PLACE)
    // ======================
    const camera = new Camera(video, {
        onFrame: async () => {
            await hands.send({ image: video });
        },
        width: 640,
        height: 480
    });

    camera.start();
});