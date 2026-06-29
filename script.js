const storageKey = "yingziyan-wheel-options-v1";
const defaultOptions = [
  { label: "舞台练习 30 分钟", color: "#2b1821", probability: 22 },
  { label: "随机一首公演曲", color: "#8f5cff", probability: 18 },
  { label: "海边散步", color: "#d5a94f", probability: 14 },
  { label: "奖励奶茶", color: "#f2dfbd", probability: 14 },
  { label: "拍一张自拍", color: "#6f4a86", probability: 12 },
  { label: "整理歌单", color: "#fff4dc", probability: 10 },
  { label: "休息十分钟", color: "#5b2e4a", probability: 10 }
];

const canvas = document.querySelector("#wheelCanvas");
const ctx = canvas.getContext("2d");
const coverPhoto = document.querySelector(".cover-photo");
const changeCoverButton = document.querySelector("#changeCoverButton");
const viewBackgroundButton = document.querySelector("#viewBackgroundButton");
const optionList = document.querySelector("#optionList");
const spinButton = document.querySelector("#spinButton");
const centerSpinButton = document.querySelector("#centerSpinButton");
const shuffleButton = document.querySelector("#shuffleButton");
const addButton = document.querySelector("#addButton");
const saveButton = document.querySelector("#saveButton");
const saveTopButton = document.querySelector("#saveTopButton");
const resetButton = document.querySelector("#resetButton");
const resultText = document.querySelector("#resultText");
const saveState = document.querySelector("#saveState");
const probabilityTotal = document.querySelector("#probabilityTotal");
const activeLabelInput = document.querySelector("#activeLabelInput");
const activeColorInput = document.querySelector("#activeColorInput");
const activeProbabilityInput = document.querySelector("#activeProbabilityInput");
const resultDialog = document.querySelector("#resultDialog");
const editorDialog = document.querySelector("#editorDialog");
const backgroundDialog = document.querySelector("#backgroundDialog");
const backgroundDialogImage = document.querySelector("#backgroundDialogImage");
const dialogResult = document.querySelector("#dialogResult");
const closeDialog = document.querySelector("#closeDialog");
const closeEditorButton = document.querySelector("#closeEditorButton");
const closeBackgroundButton = document.querySelector("#closeBackgroundButton");
const openEditorButton = document.querySelector("#openEditorButton");
const spinAgainButton = document.querySelector("#spinAgainButton");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let options = loadOptions();
let rotation = 0;
let isSpinning = false;
let activeIndex = 0;
let coverPhotoIndex = 2;
const coverPhotos = [
  { src: "assets/yingziyan-lounge.jpg", alt: "应籽言复古封面照片", position: "center 38%", mirrored: false, tone: "tone-lounge" },
  { src: "assets/yingziyan-sky.png", alt: "应籽言海边照片", position: "right 42%", mirrored: false, tone: "tone-sky" },
  { src: "assets/yingziyan-flower.png", alt: "应籽言花朵造型照片", position: "center 46%", mirrored: false, tone: "tone-flower" }
];

function applyCoverPhoto(index) {
  coverPhotoIndex = index;
  const current = coverPhotos[coverPhotoIndex];
  coverPhoto.src = current.src;
  coverPhoto.alt = current.alt;
  coverPhoto.style.objectPosition = current.position;
  coverPhoto.classList.toggle("mirrored", current.mirrored);
  coverPhoto.classList.remove("tone-lounge", "tone-sky", "tone-bunny", "tone-flower");
  coverPhoto.classList.add(current.tone);
}

function loadOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (Array.isArray(saved) && saved.length >= 2) return normalizeOptions(saved);
  } catch {
    localStorage.removeItem(storageKey);
  }
  return structuredClone(defaultOptions);
}

function normalizeOptions(items) {
  return items
    .map((item, index) => ({
      label: String(item.label || `选项 ${index + 1}`).slice(0, 40),
      color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : defaultOptions[index % defaultOptions.length].color,
      probability: Math.max(0, Math.min(100, Number(item.probability) || 0))
    }))
    .slice(0, 12);
}

function totalProbability() {
  return options.reduce((sum, item) => sum + item.probability, 0);
}

function formatPercent(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function isValidTotal() {
  return Math.abs(totalProbability() - 100) < 0.001;
}

function saveOptions(message = "已保存到本机浏览器") {
  if (!isValidTotal()) return updateTotalState();
  localStorage.setItem(storageKey, JSON.stringify(options));
  saveState.textContent = message;
}

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 16;
  let start = -Math.PI / 2;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);

  options.forEach((item) => {
    const angle = (Math.PI * 2 * item.probability) / 100;
    const end = start + angle;
    const mid = start + angle / 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,244,220,0.82)";
    ctx.lineWidth = 4;
    ctx.stroke();

    if (item.probability > 0) {
      ctx.save();
      ctx.rotate(mid);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isLightColor(item.color) ? "#2b1821" : "#fff4dc";
      ctx.font = "800 20px Microsoft YaHei, Arial, sans-serif";
      ctx.fillText(item.label.length > 7 ? `${item.label.slice(0, 7)}...` : item.label, radius - 24, -9);
      ctx.font = "800 13px Microsoft YaHei, Arial, sans-serif";
      ctx.globalAlpha = 0.78;
      ctx.fillText(`${formatPercent(item.probability)}%`, radius - 24, 16);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    start = end;
  });

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(255,244,220,0.95)";
  ctx.stroke();
  ctx.restore();
}

function isLightColor(hex) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderRows() {
  optionList.innerHTML = "";
  options.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `option-row${index === activeIndex ? " active" : ""}`;
    row.innerHTML = `
      <button class="option-select" type="button" data-select="${index}">
        <span class="option-dot" style="background:${item.color}"></span>
        <span class="option-name">${escapeHtml(item.label)}</span>
        <span class="option-probability">${formatPercent(item.probability)}%</span>
      </button>
      <button class="delete-button" type="button" data-delete="${index}">删除</button>
    `;
    optionList.append(row);
  });
}

function renderActiveEditor() {
  if (activeIndex >= options.length) activeIndex = options.length - 1;
  const item = options[activeIndex];
  activeLabelInput.value = item.label;
  activeColorInput.value = item.color;
  activeProbabilityInput.value = formatPercent(item.probability);
}

function updateTotalState() {
  const valid = isValidTotal();
  probabilityTotal.textContent = `概率合计 ${formatPercent(totalProbability())}%`;
  probabilityTotal.classList.toggle("invalid", !valid);
  spinButton.disabled = !valid || isSpinning;
  centerSpinButton.disabled = !valid || isSpinning;
  if (!valid) saveState.textContent = "概率合计需要等于 100%";
}

function renderEditor() {
  renderRows();
  renderActiveEditor();
  updateTotalState();
}

function updateActiveOption(event) {
  const item = options[activeIndex];
  if (!item) return;
  if (event.target === activeLabelInput) item.label = activeLabelInput.value.trim() || `选项 ${activeIndex + 1}`;
  if (event.target === activeColorInput) item.color = activeColorInput.value;
  if (event.target === activeProbabilityInput) {
    item.probability = Math.max(0, Math.min(100, Number(activeProbabilityInput.value) || 0));
  }
  if (isValidTotal()) saveState.textContent = "有未保存修改";
  renderRows();
  updateTotalState();
  drawWheel();
}

function selectOption(event) {
  const index = Number(event.target.closest("[data-select]")?.dataset.select);
  if (Number.isNaN(index)) return;
  activeIndex = index;
  renderEditor();
}

function deleteOption(event) {
  const index = Number(event.target.dataset.delete);
  if (Number.isNaN(index)) return;
  if (options.length <= 2) {
    saveState.textContent = "至少保留 2 个选项";
    return;
  }
  options.splice(index, 1);
  if (activeIndex >= options.length) activeIndex = options.length - 1;
  render();
  saveState.textContent = "有未保存修改";
}

function addOption() {
  if (options.length >= 12) {
    saveState.textContent = "最多支持 12 个选项";
    return;
  }
  options.push({
    label: `新选项 ${options.length + 1}`,
    color: defaultOptions[options.length % defaultOptions.length].color,
    probability: 0
  });
  activeIndex = options.length - 1;
  render();
  saveState.textContent = "有未保存修改";
}

function pickWeightedOption() {
  let marker = Math.random() * 100;
  for (const item of options) {
    marker -= item.probability;
    if (marker <= 0) return item;
  }
  return options.at(-1);
}

function optionCenterAngle(target) {
  let start = -90;
  for (const item of options) {
    const degrees = 360 * item.probability / 100;
    if (item === target) return start + degrees / 2;
    start += degrees;
  }
  return -90;
}

function spin() {
  if (isSpinning) return;
  if (!isValidTotal()) return updateTotalState();

  const selected = pickWeightedOption();
  const centerAngle = optionCenterAngle(selected);
  const startRotation = rotation;
  const targetRotation = rotation + (5 + Math.floor(Math.random() * 3)) * 360 + (270 - centerAngle - (rotation % 360));
  isSpinning = true;
  spinButton.disabled = true;
  centerSpinButton.disabled = true;
  resultText.textContent = "转动中...";
  rotation = targetRotation;

  if (reduceMotion.matches) {
    canvas.style.transform = `rotate(${targetRotation}deg)`;
  } else {
    canvas.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    canvas.style.transform = `rotate(${startRotation - 10}deg)`;
    window.setTimeout(() => {
      canvas.style.transition = "transform 4.6s cubic-bezier(0.13, 0.78, 0.14, 1)";
      canvas.style.transform = `rotate(${targetRotation}deg)`;
    }, 170);
  }

  window.setTimeout(() => {
    isSpinning = false;
    updateTotalState();
    resultText.textContent = selected.label;
    dialogResult.textContent = selected.label;
    if (typeof resultDialog.showModal === "function") resultDialog.showModal();
  }, reduceMotion.matches ? 300 : 5000);
}

function shuffleOptions() {
  options = options
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
  render();
  saveState.textContent = "顺序已随机打乱";
}

function resetOptions() {
  options = structuredClone(defaultOptions);
  activeIndex = 0;
  localStorage.removeItem(storageKey);
  resultText.textContent = "等待转动";
  render();
  saveState.textContent = "已重置默认模板";
}

function switchCoverPhoto() {
  coverPhotoIndex = (coverPhotoIndex + 1) % coverPhotos.length;
  const next = coverPhotos[coverPhotoIndex];
  coverPhoto.classList.add("switching");
  window.setTimeout(() => {
    applyCoverPhoto(coverPhotoIndex);
  }, 180);
  window.setTimeout(() => coverPhoto.classList.remove("switching"), 460);
}

function showCurrentBackground() {
  const current = coverPhotos[coverPhotoIndex];
  backgroundDialogImage.src = current.src;
  backgroundDialogImage.alt = current.alt;
  backgroundDialogImage.classList.toggle("mirrored", current.mirrored);
  if (typeof backgroundDialog.showModal === "function") backgroundDialog.showModal();
}

function render() {
  renderEditor();
  drawWheel();
}

optionList.addEventListener("click", selectOption);
optionList.addEventListener("click", deleteOption);
activeLabelInput.addEventListener("input", updateActiveOption);
activeColorInput.addEventListener("input", updateActiveOption);
activeProbabilityInput.addEventListener("input", updateActiveOption);
spinButton.addEventListener("click", spin);
centerSpinButton.addEventListener("click", spin);
spinAgainButton.addEventListener("click", () => {
  resultDialog.close();
  spin();
});
shuffleButton.addEventListener("click", shuffleOptions);
addButton.addEventListener("click", addOption);
saveButton.addEventListener("click", () => saveOptions());
saveTopButton.addEventListener("click", () => saveOptions());
resetButton.addEventListener("click", resetOptions);
closeDialog.addEventListener("click", () => resultDialog.close());
openEditorButton.addEventListener("click", () => editorDialog.showModal());
closeEditorButton.addEventListener("click", () => editorDialog.close());
viewBackgroundButton.addEventListener("click", showCurrentBackground);
closeBackgroundButton.addEventListener("click", () => backgroundDialog.close());
changeCoverButton.addEventListener("click", switchCoverPhoto);
coverPhotos.forEach((item) => {
  const image = new Image();
  image.src = item.src;
});
const requestedCover = Number(new URLSearchParams(location.search).get("bg")) - 1;
if (!Number.isNaN(requestedCover) && coverPhotos[requestedCover]) applyCoverPhoto(requestedCover);
else applyCoverPhoto(coverPhotoIndex);

render();
