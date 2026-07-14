const STAGES=[
  {key:"safe",min:-Infinity,max:21,label:"安全",message:"適宜に水分補給",icon:"images/safe.png"},
  {key:"caution",min:21,max:25,label:"注意",message:"体調に注意",icon:"images/caution.png"},
  {key:"warning",min:25,max:28,label:"警戒",message:"休憩を強化",icon:"images/warning.png"},
  {key:"severe",min:28,max:31,label:"厳重警戒",message:"積極的に休憩",icon:"images/severe.png"},
  {key:"danger",min:31,max:Infinity,label:"危険",message:"熱中症の危険性が非常に高い",icon:"images/danger.png"}
];

const monitor=document.getElementById("monitor");
const stageBg=document.getElementById("stage-bg");
const statusIcon=document.getElementById("status-icon");
const levels=document.querySelectorAll(".level");

function stageFor(v){return STAGES.find(s=>v>=s.min&&v<s.max)||STAGES[0]}

function applyStage(v){
  const value=Number.isFinite(Number(v))?Number(v):21;
  const s=stageFor(value);
  monitor.className=`monitor stage-${s.key}`;
  stageBg.className=`stage-bg stage-${s.key}`;
  document.querySelectorAll(".js-status").forEach(el=>el.textContent=s.label);
  document.querySelectorAll(".js-message").forEach(el=>el.textContent=s.message);
  document.querySelectorAll(".js-wbgt").forEach(el=>el.textContent=value.toFixed(1));
  statusIcon.src=s.icon;statusIcon.alt=s.label;
  levels.forEach(el=>el.classList.toggle("active",el.dataset.stage===s.key));
}

function updateClock(){
  const now=new Date();
  const wd=["日","月","火","水","木","金","土"];
  const y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,"0"),
        d=String(now.getDate()).padStart(2,"0"),h=String(now.getHours()).padStart(2,"0"),
        n=String(now.getMinutes()).padStart(2,"0");
  document.getElementById("current-date").textContent=`${y}.${m}.${d}（${wd[now.getDay()]}）`;
  document.getElementById("current-time").textContent=`${h}:${n}`;
}

function fit(){
  const scale=Math.min(window.innerWidth/640,window.innerHeight/192);
  monitor.style.transform=`scale(${scale})`;
}
window.addEventListener("resize",fit);

const p=new URLSearchParams(location.search);
const wbgt=Number(p.get("wbgt")??21);
const temp=Number(p.get("temp")??24);
const humidity=Number(p.get("humidity")??40);
document.getElementById("temperature").textContent=temp.toFixed(1);
document.getElementById("humidity").textContent=Math.round(humidity);
applyStage(wbgt);
updateClock();
setInterval(updateClock,1000);
fit();
