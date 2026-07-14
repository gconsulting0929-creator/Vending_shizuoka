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
let lastUpdatedAt=null;

function stageFor(value){
  return STAGES.find(stage=>value>=stage.min&&value<stage.max)||STAGES[0];
}

function applyStage(value){
  const wbgt=Number(value);
  if(!Number.isFinite(wbgt)) return;

  const stage=stageFor(wbgt);
  monitor.className=`monitor stage-${stage.key}`;

  const stageColor=getComputedStyle(monitor).getPropertyValue("--stage").trim();
  document.body.style.background=stageColor;

  document.querySelectorAll(".js-status").forEach(el=>el.textContent=stage.label);
  document.querySelectorAll(".js-message").forEach(el=>el.textContent=stage.message);
  document.querySelectorAll(".js-wbgt").forEach(el=>el.textContent=wbgt.toFixed(1));

  icon.src=stage.icon;
  icon.alt=stage.label;
  risks.forEach(el=>el.classList.toggle("active",el.dataset.stage===stage.key));
}

function formatHHMM(dateString){
  if(!dateString) return "--:--";
  const date=new Date(dateString);
  if(Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("ja-JP",{
    timeZone:"Asia/Tokyo",
    hour:"2-digit",
    minute:"2-digit",
    hour12:false
  }).format(date);
}

function setWeather(data){
  const temperature=Number(data.temperature);
  const humidity=Number(data.humidity);
  const wbgt=Number(data.wbgt);

  if(Number.isFinite(temperature)){
    document.getElementById("temperature").textContent=temperature.toFixed(1);
  }
  if(Number.isFinite(humidity)){
    document.getElementById("humidity").textContent=Math.round(humidity);
  }
  if(Number.isFinite(wbgt)){
    applyStage(wbgt);
  }

  lastUpdatedAt=data.wbgtObservedAt||data.weatherObservedAt||data.updatedAt||null;
  document.getElementById("updated-time").textContent=formatHHMM(lastUpdatedAt);
}

async function loadLiveData(){
  try{
    const response=await fetch(`data.json?t=${Date.now()}`,{cache:"no-store"});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    setWeather(data);
  }catch(error){
    console.error("실시간 데이터 불러오기 실패:",error);
  }
}

function updateClock(){
  const now=new Date();
  const dateText=new Intl.DateTimeFormat("ja-JP",{
    timeZone:"Asia/Tokyo",
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
    weekday:"short"
  }).formatToParts(now);

  const part=type=>dateText.find(x=>x.type===type)?.value||"";
  document.getElementById("current-date").textContent=
    `${part("year")}.${part("month")}.${part("day")}（${part("weekday")}）`;

  document.getElementById("current-time").textContent=
    new Intl.DateTimeFormat("ja-JP",{
      timeZone:"Asia/Tokyo",
      hour:"2-digit",
      minute:"2-digit",
      hour12:false
    }).format(now);
}

function fit(){
  monitor.style.transform=`scale(${window.innerWidth/640},${window.innerHeight/192})`;
}

window.addEventListener("resize",fit);
updateClock();
setInterval(updateClock,1000);
loadLiveData();
setInterval(loadLiveData,60000);
fit();
