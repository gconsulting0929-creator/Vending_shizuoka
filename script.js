const STAGES=[
  {key:"safe",min:-Infinity,max:21,label:"安全",message:"適宜に水分補給",icon:"images/safe.png"},
  {key:"caution",min:21,max:25,label:"注意",message:"体調に注意",icon:"images/caution.png"},
  {key:"warning",min:25,max:28,label:"警戒",message:"休憩を強化",icon:"images/warning.png"},
  {key:"severe",min:28,max:31,label:"厳重警戒",message:"積極的に休憩",icon:"images/severe.png"},
  {key:"danger",min:31,max:Infinity,label:"危険",message:"熱中症の危険性が非常に高い",icon:"images/danger.png"}
];
const monitor=document.getElementById("monitor");
const icon=document.getElementById("status-icon");
const risks=document.querySelectorAll(".risk");

function stageFor(v){return STAGES.find(s=>v>=s.min&&v<s.max)||STAGES[0]}
function applyStage(v){
  const wbgt=Number.isFinite(Number(v))?Number(v):23;
  const s=stageFor(wbgt);
  monitor.className=`monitor stage-${s.key}`;
  document.body.style.background=getComputedStyle(monitor).getPropertyValue("--stage");
  document.querySelectorAll(".js-status").forEach(el=>el.textContent=s.label);
  document.querySelectorAll(".js-message").forEach(el=>el.textContent=s.message);
  document.querySelectorAll(".js-wbgt").forEach(el=>el.textContent=wbgt.toFixed(1));
  icon.src=s.icon;icon.alt=s.label;
  risks.forEach(el=>el.classList.toggle("active",el.dataset.stage===s.key));
}
function updateClock(){
  const now=new Date(),w=["日","月","火","水","木","金","土"];
  const y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,"0"),
        d=String(now.getDate()).padStart(2,"0"),h=String(now.getHours()).padStart(2,"0"),
        n=String(now.getMinutes()).padStart(2,"0");
  document.getElementById("current-date").textContent=`${y}.${m}.${d}（${w[now.getDay()]}）`;
  document.getElementById("current-time").textContent=`${h}:${n}`;
  document.getElementById("updated-time").textContent=`${h}:${n}`;
}
function fit(){
  monitor.style.transform=`scale(${window.innerWidth/640},${window.innerHeight/192})`;
}
window.addEventListener("resize",fit);

const p=new URLSearchParams(location.search);
document.getElementById("temperature").textContent=Number(p.get("temp")??26).toFixed(1);
document.getElementById("humidity").textContent=Math.round(Number(p.get("humidity")??50));
applyStage(Number(p.get("wbgt")??23));
updateClock();setInterval(updateClock,1000);fit();
