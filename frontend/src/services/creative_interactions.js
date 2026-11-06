const SOUND_KEY = "innolab.interfaceSound";
const TILT_SURFACES = ".record-preview, .lab-note, .auth-dialog, .metric-card, .task-card, .hardware-card, .chemical-card, .audit-card, .mentor-card, .prototype-card";
const initializedSurfaces = new WeakSet();
const initializedSoundToggles = new WeakSet();
const observedRoots = new WeakSet();
let soundEnabled = readSoundPreference();
let audioContext;
let globalEventsBound = false;

export function initCreativeInteractions(root) {
  if (!root) return;
  bindTiltSurfaces(root);
  bindSoundToggles(root);
  observeDynamicElements(root);
  bindFeedbackEvents();
}

function bindTiltSurfaces(root) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  findElements(root, TILT_SURFACES).forEach((surface) => {
    if (initializedSurfaces.has(surface)) return;
    initializedSurfaces.add(surface);
    surface.classList.add("kinetic-surface");
    surface.dataset.tilt = "";
    if (reducedMotion || !finePointer) return;

    surface.addEventListener("pointermove", (event) => {
      const bounds = surface.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
      const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
      surface.style.setProperty("--tilt-x", `${vertical * -3}deg`);
      surface.style.setProperty("--tilt-y", `${horizontal * 3}deg`);
    });
    surface.addEventListener("pointerleave", () => {
      surface.style.setProperty("--tilt-x", "0deg");
      surface.style.setProperty("--tilt-y", "0deg");
    });
  });
}

function bindSoundToggles(root) {
  findElements(root, "[data-sound-toggle]").forEach((button) => {
    if (initializedSoundToggles.has(button)) return;
    initializedSoundToggles.add(button);
    updateSoundButton(button);
    button.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      try { sessionStorage.setItem(SOUND_KEY, String(soundEnabled)); } catch {}
      updateSoundButtons();
      if (soundEnabled) playTick();
    });
  });
}

function observeDynamicElements(root) {
  if (observedRoots.has(root)) return;
  observedRoots.add(root);
  const observer = new MutationObserver((changes) => {
    changes.flatMap((change) => [...change.addedNodes]).forEach((node) => {
      if (!(node instanceof Element)) return;
      bindTiltSurfaces(node);
      bindSoundToggles(node);
    });
  });
  observer.observe(root, { childList: true, subtree: true });
}

function findElements(root, selector) {
  const elements = [...root.querySelectorAll(selector)];
  if (root.matches?.(selector)) elements.unshift(root);
  return elements;
}

function bindFeedbackEvents() {
  if (globalEventsBound) return;
  globalEventsBound = true;
  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("button, .button");
    if (!button) return;
    button.classList.add("is-pressed");
    if (soundEnabled && !button.hasAttribute("data-sound-toggle")) playTick();
  }, true);
  ["pointerup", "pointercancel"].forEach((eventName) => document.addEventListener(eventName, () => {
    document.querySelectorAll(".is-pressed").forEach((button) => button.classList.remove("is-pressed"));
  }, true));
}

function updateSoundButtons() {
  document.querySelectorAll("[data-sound-toggle]").forEach(updateSoundButton);
}

function updateSoundButton(button) {
  button.textContent = soundEnabled ? "SOUND: ON" : "SOUND: OFF";
  button.setAttribute("aria-pressed", String(soundEnabled));
}

function readSoundPreference() {
  try { return sessionStorage.getItem(SOUND_KEY) === "true"; }
  catch { return false; }
}

function playTick() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    audioContext ??= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(740, now);
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.026);
  } catch {}
}