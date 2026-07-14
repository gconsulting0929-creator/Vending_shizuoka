const STAGES = [
  {
    key: "safe",
    min: -Infinity,
    max: 21,
    label: "安全",
    message: "適宜に水分補給",
    icon: "images/safe.png"
  },
  {
    key: "caution",
    min: 21,
    max: 25,
    label: "注意",
    message: "体調に注意",
    icon: "images/caution.png"
  },
  {
    key: "warning",
    min: 25,
    max: 28,
    label: "警戒",
    message: "休憩を強化",
    icon: "images/warning.png"
  },
  {
    key: "severe",
    min: 28,
    max: 31,
    label: "厳重警戒",
    message: "積極的に休憩",
    icon: "images/severe.png"
  },
  {
    key: "danger",
    min: 31,
    max: Infinity,
    label: "危険",
    message: "熱中症の危険性が非常に高い",
    icon: "images/danger.png"
  }
];

const monitor = document.getElementById("monitor");
const statusIcon = document.getElementById("status-icon");
const statusElements = document.querySelectorAll(".js-status");
const messageElements = document.querySelectorAll(".js-message");
const wbgtElements = document.querySelectorAll(".js-wbgt");
const scaleItems = document.querySelectorAll(".risk-item");

function getStage(wbgt) {
  return STAGES.find(stage => wbgt >= stage.min && wbgt < stage.max) ?? STAGES[0];
}

function applyStage(wbgt) {
  const numeric = Number(wbgt);
  const value = Number.isFinite(numeric) ? numeric : 21.0;
  const stage = getStage(value);

  monitor.className = `monitor stage-${stage.key}`;
  statusElements.forEach(el => el.textContent = stage.label);
  messageElements.forEach(el => el.textContent = stage.message);
  wbgtElements.forEach(el => el.textContent = value.toFixed(1));

  statusIcon.src = stage.icon;
  statusIcon.alt = stage.label;

  scaleItems.forEach(item => {
    item.classList.toggle("active", item.dataset.stage === stage.key);
  });
}

function updateClock() {
  const now = new Date();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  document.getElementById("current-date").textContent =
    `${yyyy}.${mm}.${dd}（${weekdays[now.getDay()]}）`;
  document.getElementById("current-time").textContent = `${hh}:${min}`;
}

/* Step 1 sample values.
   Test WBGT stages with:
   index.html?wbgt=20
   index.html?wbgt=23
   index.html?wbgt=26
   index.html?wbgt=29
   index.html?wbgt=32
*/
const params = new URLSearchParams(location.search);
const sampleWbgt = Number(params.get("wbgt") ?? 21.0);
const sampleTemperature = Number(params.get("temp") ?? 24.0);
const sampleHumidity = Number(params.get("humidity") ?? 40);

document.getElementById("temperature").textContent = sampleTemperature.toFixed(1);
document.getElementById("humidity").textContent = Math.round(sampleHumidity);
applyStage(sampleWbgt);
updateClock();
setInterval(updateClock, 1000);

/* Scale the exact 640×192 canvas to fill the browser viewport
   without black margins. */
function fitToViewport() {
  const scaleX = window.innerWidth / 640;
  const scaleY = window.innerHeight / 192;

  monitor.style.transformOrigin = "top left";
  monitor.style.transform = `scale(${scaleX}, ${scaleY})`;
}
fitToViewport();
window.addEventListener("resize", fitToViewport);
