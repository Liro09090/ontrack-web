'use strict';
/* ================= utilitare ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const dkey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>dkey(new Date());
const addDays=(k,n)=>{const d=new Date(k+'T12:00');d.setDate(d.getDate()+n);return dkey(d)};
const LUNI=['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec'];
const ZILE=['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
const dTxt=k=>{const d=new Date(k+'T12:00');return d.getDate()+' '+LUNI[d.getMonth()]};
const dLong=k=>k===today()?'Azi':k===addDays(today(),-1)?'Ieri':ZILE[new Date(k+'T12:00').getDay()]+', '+dTxt(k);
const fmt=(n,dec=1)=>{const m=Math.pow(10,dec);return String(Math.round(n*m)/m).replace('.',',')};
const r0=n=>Math.round(n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const num=v=>{const x=parseFloat(String(v).replace(',','.'));return isFinite(x)?x:0};
const EXI={};EX.forEach(e=>EXI[e.id]=e);
const GCOL={};EXG.forEach(([k,,c])=>GCOL[k]=c);
const MEALS=[['mic','Mic dejun'],['pranz','Prânz'],['cina','Cină'],['gust','Gustări']];

/* ================= date ================= */
const KEY='framefit-v1';
let D=load();
function blank(){return{v:1,profile:null,days:{},weights:[],workouts:[],custom:[],recent:[],active:null,planIdx:0,rest:90}}
function load(){try{const r=localStorage.getItem(KEY);if(r){const o=JSON.parse(r);return Object.assign(blank(),o)}}catch(e){}return blank()}
let saveT=null;function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){toast('Nu s-a putut salva')}},250)}
function day(k){return D.days[k]||(D.days[k]={meals:{mic:[],pranz:[],cina:[],gust:[]},water:0})}

/* ================= ținte ================= */
const ACT=[[1.2,'Sedentar','birou, fără sport'],[1.375,'Puțin activ','sport 1–3 zile/săpt.'],[1.55,'Activ','sport 3–5 zile/săpt.'],[1.725,'Foarte activ','sport 6–7 zile/săpt.'],[1.9,'Extrem de activ','muncă fizică + sport']];
const GOALS=[['slabire','Slăbire'],['mentinere','Menținere'],['masa','Masă musculară']];
function curWeight(){const w=[...D.weights].sort((a,b)=>a.d.localeCompare(b.d));return w.length?w[w.length-1].kg:(D.profile?D.profile.w:70)}
function targets(){
  const P=D.profile;if(!P)return null;const w=curWeight();
  const bmr=10*w+6.25*P.h-5*P.age+(P.sex==='m'?5:-161);
  const tdee=bmr*P.act;let kcal=tdee,note='';
  const floor=Math.max(P.sex==='m'?1500:1200,bmr);
  if(P.goal==='slabire'){const pace=Math.min(P.pace||0.5,w*0.01);kcal=tdee-pace*7700/7;if(kcal<floor){kcal=floor;note='Ținta e la limita minimă sigură. Ca să slăbești mai repede, mișcă-te mai mult, nu mânca mai puțin.'}}
  if(P.goal==='masa')kcal=tdee+(P.exp==='incepator'?300:200);
  kcal=Math.round(kcal/10)*10;
  const pk=P.goal==='slabire'?2.0:P.goal==='masa'?1.8:1.6;
  const p=Math.round(w*pk),f=Math.round(kcal*0.27/9),c=Math.max(0,Math.round((kcal-p*4-f*9)/4));
  const fib=Math.max(P.sex==='m'?30:25,Math.round(kcal/1000*14));
  const water=Math.round(w*35/250)*250;
  return{bmr:Math.round(bmr),tdee:Math.round(tdee),kcal,p,c,f,fib,water,note};
}
function sumDay(k){const o={k:0,p:0,c:0,f:0,fb:0};const d=D.days[k];if(!d)return o;
  for(const m of MEALS)for(const it of d.meals[m[0]]||[]){o.k+=it.k;o.p+=it.p;o.c+=it.c;o.f+=it.f;o.fb+=it.fb}return o}

/* ================= planuri ================= */
function makePlan(){
  const P=D.profile||{days:3,exp:'incepator',goal:'mentinere'};const beg=P.exp==='incepator';
  const sq=beg?'Goblet_Squat':'Barbell_Squat',bp=beg?'Dumbbell_Bench_Press':'Barbell_Bench_Press_-_Medium_Grip',row=beg?'One-Arm_Dumbbell_Row':'Bent_Over_Barbell_Row';
  const R=P.goal==='slabire'?'10–12':'8–10';
  const e=(id,s,r)=>({id,s,r});
  const cardio=P.goal==='slabire'?[e('Walking_Treadmill',1,'20 min')]:[];
  if((P.days||3)<=3)return[
    {n:'Ziua A — tot corpul',ex:[e(sq,3,R),e(bp,3,R),e(row,3,'10–12'),e('Seated_Dumbbell_Press',3,'10–12'),e('Plank',3,'30–45 s'),...cardio]},
    {n:'Ziua B — tot corpul',ex:[e('Romanian_Deadlift',3,'10–12'),e('Incline_Dumbbell_Press',3,'10–12'),e('Wide-Grip_Lat_Pulldown',3,'10–12'),e('Dumbbell_Lunges',3,'10/picior'),e('Side_Lateral_Raise',3,'12–15'),e('Crunches',3,'15'),...cardio]}];
  if(P.days===4)return[
    {n:'Ziua 1 — partea de sus',ex:[e(bp,4,R),e(row,4,R),e('Seated_Dumbbell_Press',3,'10–12'),e('Wide-Grip_Lat_Pulldown',3,'10–12'),e('Dumbbell_Bicep_Curl',3,'12'),e('Triceps_Pushdown',3,'12')]},
    {n:'Ziua 2 — partea de jos',ex:[e(sq,4,R),e('Romanian_Deadlift',3,'10'),e('Leg_Press',3,'12'),e('Lying_Leg_Curls',3,'12'),e('Standing_Calf_Raises',4,'15'),e('Plank',3,'45 s'),...cardio]},
    {n:'Ziua 3 — partea de sus',ex:[e('Incline_Dumbbell_Press',4,'10'),e('Seated_Cable_Rows',4,'10'),e('Arnold_Dumbbell_Press',3,'10'),e(beg?'Wide-Grip_Lat_Pulldown':'Pullups',3,beg?'10':'max'),e('Hammer_Curls',3,'12'),e('Cable_Rope_Overhead_Triceps_Extension',3,'12')]},
    {n:'Ziua 4 — partea de jos',ex:[e(beg?'Leg_Press':'Barbell_Deadlift',3,beg?'12':'5'),e('Split_Squat_with_Dumbbells',3,'10/picior'),e('Barbell_Hip_Thrust',3,'10'),e('Leg_Extensions',3,'12'),e('Seated_Calf_Raise',3,'15'),e('Hanging_Leg_Raise',3,'10'),...cardio]}];
  return[
    {n:'Push — piept, umeri, triceps',ex:[e(bp,4,R),e('Incline_Dumbbell_Press',3,'10'),e('Seated_Dumbbell_Press',3,'10'),e('Side_Lateral_Raise',3,'15'),e('Triceps_Pushdown',3,'12'),e('Cable_Rope_Overhead_Triceps_Extension',3,'12')]},
    {n:'Pull — spate, biceps',ex:[e(beg?'Wide-Grip_Lat_Pulldown':'Pullups',4,beg?'10':'max'),e(row,4,R),e('Seated_Cable_Rows',3,'12'),e('Face_Pull',3,'15'),e('Barbell_Curl',3,'10'),e('Hammer_Curls',3,'12')]},
    {n:'Legs — picioare, abdomen',ex:[e(sq,4,R),e('Romanian_Deadlift',3,'10'),e('Leg_Press',3,'12'),e('Lying_Leg_Curls',3,'12'),e('Standing_Calf_Raises',4,'15'),e('Hanging_Leg_Raise',3,'12'),...cardio]}];
}

/* ================= navigare ================= */
const S={tab:'azi',date:today(),sheet:null,progEx:null,libG:'piept',confirm:null,foodCat:'recente'};
function go(t){S.tab=t;S.confirm=null;render();scrollTo(0,0)}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>go(b.dataset.tab));

function render(){
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===S.tab));
  if(!D.profile){$('#tabs').hidden=true;$('#top').innerHTML=`<h1>OnTrack</h1>`;$('#view').innerHTML=onboarding();return}
  $('#tabs').hidden=false;
  const V={azi:vAzi,mancare:vFood,sala:vGym,progres:vProg,profil:vProfile}[S.tab];
  $('#view').innerHTML=V();
  if(S.tab==='progres')drawCharts();
}
function topbar(title,withDate){
  const d=S.date;
  return `<h1>${esc(title)}</h1>`+(withDate?`<button class="ib" data-day="-1" aria-label="Ziua anterioară"><svg class="ic" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button><button class="datebtn" data-day="0">${esc(dLong(d))}</button><button class="ib" data-day="1" aria-label="Ziua următoare" ${d>=today()?'disabled style="opacity:.3"':''}><svg class="ic" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>`:'');
}

/* ================= onboarding / profil ================= */
function profileForm(P){
  P=P||{sex:'m',age:'',h:'',w:'',act:1.375,goal:'slabire',target:'',pace:0.5,exp:'incepator',days:3};
  return `<div class="g2">
    <label class="f">Sex<div class="seg" data-pf="sex">${[['m','Bărbat'],['f','Femeie']].map(o=>`<button type="button" data-v="${o[0]}" class="${P.sex===o[0]?'on':''}">${o[1]}</button>`).join('')}</div></label>
    <label class="f">Vârstă<input id="pf-age" type="number" inputmode="numeric" placeholder="ani" value="${P.age}"></label>
    <label class="f">Înălțime (cm)<input id="pf-h" type="number" inputmode="numeric" placeholder="cm" value="${P.h}"></label>
    <label class="f">Greutate (kg)<input id="pf-w" type="number" inputmode="decimal" placeholder="kg" value="${P.w}"></label></div>
  <label class="f">Cât de activ ești<select id="pf-act">${ACT.map(a=>`<option value="${a[0]}" ${+P.act===a[0]?'selected':''}>${a[1]} — ${a[2]}</option>`).join('')}</select></label>
  <label class="f">Ce vrei<div class="seg" data-pf="goal">${GOALS.map(o=>`<button type="button" data-v="${o[0]}" class="${P.goal===o[0]?'on':''}">${o[1]}</button>`).join('')}</div></label>
  <div class="g2"><label class="f">Greutatea dorită (kg)<input id="pf-target" type="number" inputmode="decimal" placeholder="opțional" value="${P.target||''}"></label>
    <label class="f">Ritm la slăbire<select id="pf-pace">${[[0.25,'0,25 kg/săpt. (ușor)'],[0.5,'0,5 kg/săpt. (recomandat)'],[0.75,'0,75 kg/săpt. (rapid)']].map(o=>`<option value="${o[0]}" ${+P.pace===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></label></div>
  <div class="g2"><label class="f">Experiență la sală<select id="pf-exp"><option value="incepator" ${P.exp==='incepator'?'selected':''}>Începător</option><option value="mediu" ${P.exp==='mediu'?'selected':''}>Mediu (peste 6 luni)</option></select></label>
    <label class="f">Zile de sală pe săptămână<select id="pf-days">${[2,3,4,5,6].map(n=>`<option ${+P.days===n?'selected':''}>${n}</option>`).join('')}</select></label></div>`;
}
function readProfile(){
  const g=id=>$('#'+id);const seg=k=>{const b=document.querySelector(`[data-pf="${k}"] .on`);return b?b.dataset.v:null};
  const P={sex:seg('sex')||'m',age:r0(num(g('pf-age').value)),h:r0(num(g('pf-h').value)),w:num(g('pf-w').value),act:num(g('pf-act').value),goal:seg('goal')||'mentinere',
    target:num(g('pf-target').value)||null,pace:num(g('pf-pace').value),exp:g('pf-exp').value,days:r0(num(g('pf-days').value))};
  if(P.age<14||P.age>90)return toast('Scrie o vârstă între 14 și 90 de ani'),null;
  if(P.h<120||P.h>230)return toast('Scrie înălțimea în centimetri'),null;
  if(P.w<35||P.w>300)return toast('Scrie greutatea în kilograme'),null;
  return P;
}
function onboarding(){
  return `<div class="card hero"><h2>Hai să începem</h2><p class="mut" style="margin:0">Din datele de mai jos calculez câte calorii, proteine și fibre îți trebuie pe zi și îți fac un plan de sală.</p></div>
  <div class="card" style="display:flex;flex-direction:column;gap:12px">${profileForm(null)}
  <button class="btn acc full" data-act="saveProfile">Calculează țintele</button></div>`;
}
function targetsCard(){
  const T=targets(),P=D.profile;const w=curWeight();
  let eta='';
  if(P.target&&P.goal!=='mentinere'){const diff=P.target-w;const rate=P.goal==='slabire'?-(Math.min(P.pace,w*0.01)):0.25;
    if(Math.sign(diff)===Math.sign(rate)&&Math.abs(diff)>0.2){const wk=Math.ceil(Math.abs(diff/rate));const dt=new Date();dt.setDate(dt.getDate()+wk*7);
      eta=`<p class="small" style="margin:10px 0 0">De la ${fmt(w)} kg la ${fmt(P.target)} kg: cam <b>${wk} săptămâni</b>, pe la ${dt.getDate()} ${LUNI[dt.getMonth()]} ${dt.getFullYear()}, dacă ții ținta.</p>`}}
  return `<div class="card"><h3>Țintele tale pe zi</h3>
    <div class="res">
      <div class="stat"><div class="v">${T.kcal}</div><div class="k">calorii (kcal)</div></div>
      <div class="stat"><div class="v" style="color:var(--p)">${T.p} <small>g</small></div><div class="k">proteine</div></div>
      <div class="stat"><div class="v" style="color:var(--c)">${T.c} <small>g</small></div><div class="k">carbohidrați</div></div>
      <div class="stat"><div class="v" style="color:var(--f)">${T.f} <small>g</small></div><div class="k">grăsimi</div></div>
      <div class="stat"><div class="v" style="color:var(--fib)">${T.fib} <small>g</small></div><div class="k">fibre</div></div>
      <div class="stat"><div class="v" style="color:var(--water)">${fmt(T.water/1000)} <small>L</small></div><div class="k">apă</div></div></div>
    <p class="small mut" style="margin:10px 0 0">Corpul tău arde cam ${T.tdee} kcal pe zi (${T.bmr} în repaus). ${P.goal==='slabire'?'Ținta are un deficit ca să slăbești în ritmul ales.':P.goal==='masa'?'Ținta are un mic surplus ca să construiești mușchi fără multă grăsime.':'Ținta te ține la aceeași greutate.'}</p>
    ${T.note?`<p class="small" style="margin:8px 0 0;color:var(--warn)">${T.note}</p>`:''}${eta}</div>`;
}
function vProfile(){
  $('#top').innerHTML=topbar('Profil');
  return targetsCard()+`<div class="card" style="display:flex;flex-direction:column;gap:12px"><h3>Datele tale</h3>${profileForm(D.profile)}
    <button class="btn acc full" data-act="saveProfile">Salvează și recalculează</button></div>
    <div class="card"><h3>Copie de siguranță</h3><p class="small mut" style="margin:0 0 10px">Toate datele (mâncare, antrenamente, greutate) într-un fișier .json. Îl poți păstra sau muta pe alt telefon.</p>
    <div class="g2"><button class="btn" data-act="export">Exportă .json</button><button class="btn" data-act="import">Importă .json</button></div></div>
    <p class="tiny mut" style="text-align:center;margin:4px 0 0">Valorile sunt estimări pentru oameni sănătoși. Dacă ai o problemă de sănătate, vorbește cu un medic sau nutriționist. Imaginile exercițiilor: Free Exercise DB (domeniu public).</p>`;
}

/* ================= AZI ================= */
function ring(val,max,col){const R=64,C=2*Math.PI*R,f=clamp(val/(max||1),0,1);
  return `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--card2)" stroke-width="12"/>${f>0?`<circle cx="75" cy="75" r="${R}" fill="none" stroke="${val>max*1.05?'var(--warn)':col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C*f} ${C}"/>`:''}</svg>`}
function macroBar(lab,v,t,col,unit='g'){return `<div class="mac"><div class="t"><span>${lab}</span></div><div class="v">${r0(v)}<small> / ${t} ${unit}</small></div><div class="bar"><i style="width:${clamp(v/t*100,0,100)}%;background:${col}"></i></div></div>`}
function vAzi(){
  $('#top').innerHTML=topbar('OnTrack',true);
  const T=targets(),k=S.date,s=sumDay(k),d=day(k);const left=T.kcal-s.k;
  const glasses=Math.round(T.water/250);
  const wToday=D.weights.find(w=>w.d===k);
  const plan=makePlan(),next=plan[D.planIdx%plan.length];
  const doneToday=D.workouts.find(w=>w.date===k&&w.finished);
  return `<div class="card"><div class="ringbox"><div class="ring">${ring(s.k,T.kcal,'var(--acc)')}<div class="in"><div class="big num">${Math.abs(r0(left))}</div><div class="lab">${left>=0?'kcal rămase':'kcal peste țintă'}</div></div></div>
      <div class="kcal-lines"><div class="kl">Țintă<b>${T.kcal}</b></div><div class="kl">Mâncat<b>${r0(s.k)}</b></div><button class="btn sm acc" data-go="mancare">+ Adaugă mâncare</button></div></div>
    <div class="macros">${macroBar('Proteine',s.p,T.p,'var(--p)')}${macroBar('Carbo',s.c,T.c,'var(--c)')}${macroBar('Grăsimi',s.f,T.f,'var(--f)')}${macroBar('Fibre',s.fb,T.fib,'var(--fib)')}</div></div>
  <div class="card"><h3>Apă<span class="r">${fmt(d.water*0.25)} / ${fmt(T.water/1000)} L</span></h3>
    <div class="water">${Array.from({length:glasses},(_,i)=>`<button class="glass ${i<d.water?'on':''}" data-glass="${i}" aria-label="Pahar ${i+1}"></button>`).join('')}</div>
    <p class="tiny mut" style="margin:8px 0 0">Un pahar = 250 ml. Atinge paharele pe care le-ai băut.</p></div>
  <div class="card"><h3>Antrenament${doneToday?'<span class="r" style="color:var(--ok)">făcut azi ✓</span>':''}</h3>
    ${D.active?`<p class="small mut" style="margin:0 0 10px">Ai un antrenament început.</p><button class="btn acc full" data-go="sala">Continuă antrenamentul</button>`
      :`<div class="row" style="margin-bottom:10px"><div class="sp"><div style="font-weight:600">${esc(next.n)}</div><div class="small mut">${next.ex.length} exerciții · ${next.ex.map(e=>EXI[e.id].n).slice(0,3).map(esc).join(', ')}…</div></div></div>
       <button class="btn acc full" data-act="startPlan">Începe antrenamentul</button>`}</div>
  ${k===today()&&!wToday?`<div class="card"><h3>Greutatea de azi</h3><div class="row"><input id="wq" type="number" inputmode="decimal" placeholder="kg, dimineața, după toaletă"><button class="btn acc" data-act="addWeightQ">Salvează</button></div></div>`:''}
  <div class="card"><h3>Sfaturi pentru azi</h3>${tips(k).map(t=>`<div class="tip"><span class="d" style="background:${t[0]}"></span><div>${t[1]}</div></div>`).join('')}</div>`;
}
const BOOST={p:[['Brânză de vaci degresată',250],['Piept de pui, gătit',150],['Iaurt grecesc 2%',150],['Ton din conservă în apă',120],['Ou întreg',110],['Proteină whey (pudră)',30]],
  fb:[['Fasole boabe, fiartă',180],['Linte, fiartă',180],['Fulgi de ovăz',50],['Broccoli',150],['Pară',180],['Semințe de chia',12],['Pâine integrală',70]]};
function tips(k){
  const T=targets(),s=sumDay(k),P=D.profile,out=[];const hour=k===today()?new Date().getHours():22;const eve=hour>=17;
  const food=n=>FOODS.find(f=>f[0]===n);
  if(s.k===0)out.push(['var(--mut)',hour<11?'Începe ziua cu un mic dejun cu proteine: ouă, iaurt grecesc sau brânză de vaci te țin sătul până la prânz.':'Nu ai notat nimic încă azi. Notează mesele imediat după ce mănânci, e mai ușor decât seara.']);
  const pl=T.p-s.p;
  if(s.k>0&&pl>T.p*0.25){const sug=BOOST.p.slice(0,3).map(([n,g])=>{const f=food(n);return `${g} g ${n.toLowerCase().replace(', gătit','')} (${r0(f[2]*g/100)} g)`}).join(', ');
    out.push(['var(--p)',`Mai ai nevoie de <b>${r0(pl)} g proteine</b>${eve?' până diseară':' azi'}. Variante: ${sug}.`])}
  if(s.k>0&&eve&&s.fb<T.fib*0.6){const sug=BOOST.fb.slice(0,3).map(([n,g])=>{const f=food(n);return `${n.toLowerCase().replace(', fiartă','')} (${fmt(f[5]*g/100)} g la ${g} g)`}).join(', ');
    out.push(['var(--fib)',`Ai doar ${r0(s.fb)} din ${T.fib} g fibre. Fibrele te țin sătul și ajută digestia: ${sug}.`])}
  if(s.k>T.kcal*1.08)out.push(['var(--warn)',`Ai trecut de țintă cu ${r0(s.k-T.kcal)} kcal. Nu e o problemă dacă e o zi, contează media pe săptămână. Mâine revii la plan.`]);
  else if(P.goal==='slabire'&&eve&&hour>=20&&s.k>0&&s.k<T.kcal*0.6)out.push(['var(--warn)',`Ai mâncat doar ${r0(s.k)} kcal. Prea puțin te face să pierzi mușchi și să ai poftă mâine. Mănâncă o masă normală, cu proteine.`]);
  const d=day(k),gl=Math.round(T.water/250);if(eve&&d.water<gl*0.6)out.push(['var(--water)',`Ai băut ${fmt(d.water*0.25)} L din ${fmt(T.water/1000)} L. Ține o sticlă de apă la îndemână.`]);
  // săptămâna
  const wk=D.workouts.filter(w=>w.finished&&w.date>addDays(k,-7)&&w.date<=k).length;
  if(wk<(P.days||3))out.push(['var(--acc)',`Săptămâna asta: ${wk} din ${P.days} antrenamente. ${wk===0?'Primul e cel mai greu, după aceea devine obicei.':'Ești pe drumul bun.'}`]);
  // trend greutate
  const tr=weightTrend();
  if(tr){if(P.goal==='slabire'&&tr.perWeek>-0.1&&tr.days>=14)out.push(['var(--warn)',`În ultimele 2 săptămâni greutatea nu a scăzut. Încearcă 150–200 kcal mai puțin pe zi sau 3.000 de pași în plus.`]);
    else if(P.goal==='slabire'&&tr.perWeek<-curWeight()*0.01)out.push(['var(--warn)',`Slăbești peste 1% pe săptămână (${fmt(-tr.perWeek)} kg). E prea repede, pierzi și mușchi: mai adaugă 150–200 kcal pe zi.`]);
    else if(P.goal==='masa'&&tr.perWeek<0.05&&tr.days>=14)out.push(['var(--warn)',`Greutatea nu crește. Ca să pui mușchi, adaugă 150–200 kcal pe zi (de exemplu o mână de nuci sau o banană cu unt de arahide).`]);
    else if(Math.abs(tr.perWeek)>0.05)out.push(['var(--ok)',`Media greutății: ${tr.perWeek>0?'+':''}${fmt(tr.perWeek,2)} kg pe săptămână. ${(P.goal==='slabire'&&tr.perWeek<0)||(P.goal==='masa'&&tr.perWeek>0)?'Exact în direcția bună.':''}`])}
  const gen={slabire:['Proteinele multe și sala te ajută să pierzi grăsime, nu mușchi.','Mergi 8.000–10.000 de pași pe zi: arde mai mult decât pare.','Doarme 7–9 ore: somnul puțin crește pofta de dulce.','Cântărește-te dimineața, după toaletă, și uită-te la media pe săptămână, nu la o zi.'],
    masa:['Crește greutatea sau repetările puțin câte puțin la fiecare antrenament: asta construiește mușchi.','Împarte proteinele în 3–5 mese pe zi.','Doarme 7–9 ore: mușchii cresc când te odihnești.','Nu sări peste picioare: sunt cei mai mari mușchi din corp.'],
    mentinere:['Ține antrenamentele constante: 3 pe săptămână sunt suficiente ca să rămâi în formă.','Umple jumătate din farfurie cu legume.','Doarme 7–9 ore.','Bea apă înainte de fiecare masă.']}[P.goal];
  out.push(['var(--dim)',gen[new Date(k+'T12:00').getDate()%gen.length]]);
  return out.slice(0,5);
}
function weightTrend(){
  const w=[...D.weights].sort((a,b)=>a.d.localeCompare(b.d));if(w.length<4)return null;
  const last=w[w.length-1].d,first=w.find(x=>x.d>=addDays(last,-28))||w[0];const days=(new Date(last)-new Date(first.d))/864e5;if(days<7)return null;
  const avg=(from,to)=>{const s=w.filter(x=>x.d>from&&x.d<=to);return s.length?s.reduce((a,x)=>a+x.kg,0)/s.length:null};
  const a=avg(addDays(first.d,-1),addDays(first.d,6)),b=avg(addDays(last,-7),last);if(a==null||b==null)return null;
  return{perWeek:(b-a)/((days-6)/7||1),days};
}

/* ================= MÂNCARE ================= */
function vFood(){
  $('#top').innerHTML=topbar('Mâncare',true);
  const T=targets(),k=S.date,d=day(k),s=sumDay(k);
  return `<div class="card"><div class="row"><div class="sp"><div class="small mut">Mâncat / țintă</div><div class="num" style="font-size:30px;font-weight:700">${r0(s.k)} <span class="mut" style="font-size:18px">/ ${T.kcal} kcal</span></div></div></div>
    <div class="macros">${macroBar('Proteine',s.p,T.p,'var(--p)')}${macroBar('Carbo',s.c,T.c,'var(--c)')}${macroBar('Grăsimi',s.f,T.f,'var(--f)')}${macroBar('Fibre',s.fb,T.fib,'var(--fib)')}</div></div>`+
  MEALS.map(([m,n])=>{const it=d.meals[m]||[];const kc=it.reduce((a,x)=>a+x.k,0);
    return `<div class="card meal"><div class="meal-h"><b>${n}</b><span class="k">${r0(kc)} kcal</span></div>
      ${it.map((x,i)=>`<button class="fi" data-edititem="${m}:${i}"><div class="nm"><div>${esc(x.n)}</div><div class="tiny mut">${r0(x.g)} g · P ${fmt(x.p)} · C ${fmt(x.c)} · G ${fmt(x.f)} · fibre ${fmt(x.fb)}</div></div><span class="k">${r0(x.k)}</span></button>`).join('')}
      <button class="addrow" data-addfood="${m}">+ Adaugă la ${n.toLowerCase()}</button></div>`}).join('')+
  `<button class="btn full" data-act="copyYesterday">Copiază mesele de ieri</button>`;
}
function foodList(){
  const all=FOODS.map(f=>({n:f[0],k:f[1],p:f[2],c:f[3],f:f[4],fb:f[5],pl:f[6],pg:f[7],cat:f[8]})).concat(D.custom.map(c=>({...c,cat:'mele'})));
  return all;
}
let FS={meal:'mic',q:'',online:null,loading:false};
function openFoodPicker(meal){FS={meal,q:'',online:null,loading:false};S.foodCat=D.recent.length?'recente':'carne';openSheet(foodPickerHTML);setTimeout(()=>{const q=$('#fq');q&&q.focus()},80)}
function foodPickerHTML(){
  const all=foodList();const q=FS.q.trim().toLowerCase();
  let list;
  if(q){const words=q.split(/\s+/),nq=norm(q);list=all.filter(f=>words.every(w=>norm(f.n).includes(norm(w)))).sort((a,b)=>{const ia=norm(a.n).indexOf(nq),ib=norm(b.n).indexOf(nq);return (ia<0?99:ia)-(ib<0?99:ib)||a.n.length-b.n.length}).slice(0,80)}
  else if(S.foodCat==='recente')list=D.recent.map(n=>all.find(f=>f.n===n)).filter(Boolean);
  else list=all.filter(f=>f.cat===S.foodCat);
  const cats=[['recente','Recente'],['mele','Ale mele'],...FOODCAT];
  return `<div class="pn-h"><h2>${MEALS.find(m=>m[0]===FS.meal)[1]}</h2><button class="x" data-close>✕</button></div>
  <div class="pn-b"><input id="fq" placeholder="Caută: ou, pui, orez, iaurt…" value="${esc(FS.q)}" autocomplete="off">
    ${q?'':`<div class="chips">${cats.map(c=>`<button class="chip ${S.foodCat===c[0]?'on':''}" data-fcat="${c[0]}">${c[1]}</button>`).join('')}</div>`}
    <div class="fl">${list.length?list.map(f=>`<button class="fo" data-pickfood="${esc(f.n)}"><div class="nm"><div>${esc(f.n)}</div><div class="tiny mut">la 100 g: P ${fmt(f.p)} · C ${fmt(f.c)} · G ${fmt(f.f)} · fibre ${fmt(f.fb)}</div></div><span class="k">${r0(f.k)} kcal</span></button>`).join('')
      :`<div class="empty small">${S.foodCat==='recente'&&!q?'Alimentele adăugate de tine apar aici.':S.foodCat==='mele'&&!q?'Nu ai alimente proprii încă.':'Nu am găsit în lista din aplicație.'}</div>`}</div>
    ${q?`<button class="btn full" data-act="offSearch">${FS.loading?'Se caută…':'Caută „'+esc(FS.q)+'” online (produse din magazin)'}</button>`:''}
    ${FS.online?FS.online.length?`<div class="sec-t">Online · Open Food Facts</div><div class="fl">${FS.online.map((f,i)=>`<button class="fo" data-pickonline="${i}"><div class="nm"><div>${esc(f.n)}</div><div class="tiny mut">la 100 g: P ${fmt(f.p)} · C ${fmt(f.c)} · G ${fmt(f.f)} · fibre ${fmt(f.fb)}</div></div><span class="k">${r0(f.k)} kcal</span></button>`).join('')}</div>`:'<div class="empty small">Nimic găsit online. Poți scrie codul de bare de pe ambalaj (cifrele) sau adaugi alimentul de mână.</div>':''}
    <button class="btn ghost full" data-act="newCustom">+ Aliment nou (de pe etichetă)</button></div>`;
}
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
async function offSearch(){
  const q=FS.q.trim();if(!q)return;FS.loading=true;FS.online=null;refreshSheet();
  try{
    let prods=[];
    if(/^\d{8,14}$/.test(q)){const r=await fetch(`https://world.openfoodfacts.org/api/v2/product/${q}.json?fields=product_name,brands,nutriments`);const j=await r.json();if(j&&j.product)prods=[j.product]}
    else{const r=await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=25&fields=product_name,brands,nutriments`);const j=await r.json();prods=j.products||[]}
    FS.online=prods.map(p=>{const n=p.nutriments||{};const k=n['energy-kcal_100g']??(n['energy_100g']?n['energy_100g']/4.184:null);
      return k==null||!p.product_name?null:{n:(p.product_name+(p.brands?' — '+p.brands.split(',')[0]:'')).slice(0,80),k:+k,p:+(n.proteins_100g||0),c:+(n.carbohydrates_100g||0),f:+(n.fat_100g||0),fb:+(n.fiber_100g||0),pl:'porție',pg:100}}).filter(Boolean).slice(0,20);
  }catch(e){FS.online=[];toast('Fără internet sau serverul nu răspunde')}
  FS.loading=false;refreshSheet();
}
let GQ=null; // alimentul ales
function openGrams(f,editRef){
  GQ={f,g:editRef?editRef.item.g:(f.pg||100),edit:editRef,meal:editRef?editRef.meal:FS.meal};openSheet(gramsHTML);
}
function gramsHTML(){
  const f=GQ.f,g=GQ.g,m=g/100;
  const portions=[[f.pl+' ('+f.pg+' g)',f.pg],[(f.pl==='porție'?'2 porții':'2 × '+f.pl)+' ('+f.pg*2+' g)',f.pg*2],['100 g',100],['50 g',50]].filter((x,i,a)=>x[1]>0&&a.findIndex(y=>y[1]===x[1])===i);
  return `<div class="pn-h"><h2 style="font-size:20px">${esc(f.n)}</h2><button class="x" data-close>✕</button></div>
  <div class="pn-b"><div class="row" style="align-items:flex-end"><div class="sp"><div class="small mut">Calorii</div><div class="bigk num" id="gk">${r0(f.k*m)}</div></div>
      <label class="f" style="width:130px">Grame<input id="gq" type="text" inputmode="decimal" autocomplete="off" value="${r0(g)}"></label></div>
    <div class="chips">${portions.map(p=>`<button class="chip ${r0(g)===r0(p[1])?'on':''}" data-grams="${p[1]}">${esc(p[0])}</button>`).join('')}</div>
    <div class="mgrid"><div><b style="color:var(--p)" id="gp">${fmt(f.p*m)}</b><span>proteine g</span></div><div><b style="color:var(--c)" id="gc">${fmt(f.c*m)}</b><span>carbo g</span></div><div><b style="color:var(--f)" id="gf">${fmt(f.f*m)}</b><span>grăsimi g</span></div><div><b style="color:var(--fib)" id="gfb">${fmt(f.fb*m)}</b><span>fibre g</span></div></div>
    <div class="seg" id="mealSeg">${MEALS.map(x=>`<button data-meal="${x[0]}" class="${GQ.meal===x[0]?'on':''}">${x[1]}</button>`).join('')}</div>
    <p class="tiny mut" style="margin:0">Valori aproximative. Pentru produse din magazin, eticheta e cea mai exactă.</p></div>
  <div class="pn-f">${GQ.edit?`<button class="btn" data-act="delItem">Șterge</button>`:''}<button class="btn acc" style="flex:1" data-act="saveItem">${GQ.edit?'Salvează':'Adaugă'}</button></div>`;
}
function saveItem(){
  const f=GQ.f,g=num($('#gq').value);if(g<=0)return toast('Scrie câte grame');const m=g/100;
  const it={n:f.n,g,k:f.k*m,p:f.p*m,c:f.c*m,f:f.f*m,fb:f.fb*m,base:{k:f.k,p:f.p,c:f.c,f:f.f,fb:f.fb,pl:f.pl,pg:f.pg}};
  const d=day(S.date);
  if(GQ.edit){d.meals[GQ.edit.meal].splice(GQ.edit.idx,1)}
  d.meals[GQ.meal].push(it);
  if(!FOODS.some(x=>x[0]===f.n)&&!D.custom.some(x=>x.n===f.n))D.custom.push({n:f.n,k:f.k,p:f.p,c:f.c,f:f.f,fb:f.fb,pl:f.pl||'porție',pg:f.pg||100});
  D.recent=[f.n,...D.recent.filter(n=>n!==f.n)].slice(0,30);
  save();closeSheet();render();toast(GQ.edit?'Salvat':'Adăugat: '+r0(it.k)+' kcal');
}
function customHTML(){
  return `<div class="pn-h"><h2>Aliment nou</h2><button class="x" data-close>✕</button></div>
  <div class="pn-b"><p class="small mut" style="margin:0">Copiezi valorile de pe etichetă, coloana „la 100 g”.</p>
    <label class="f">Nume<input id="cn" placeholder="ex. Iaurt proteic vanilie"></label>
    <div class="g2"><label class="f">Calorii (kcal)<input id="ck" type="number" inputmode="decimal"></label><label class="f">Proteine (g)<input id="cp" type="number" inputmode="decimal"></label>
    <label class="f">Carbohidrați (g)<input id="cc" type="number" inputmode="decimal"></label><label class="f">Grăsimi (g)<input id="cf" type="number" inputmode="decimal"></label>
    <label class="f">Fibre (g)<input id="cfb" type="number" inputmode="decimal"></label><label class="f">O porție are (g)<input id="cpg" type="number" inputmode="decimal" placeholder="100"></label></div></div>
  <div class="pn-f"><button class="btn acc full" data-act="saveCustom">Salvează și alege gramajul</button></div>`;
}

/* ================= SALĂ ================= */
function lastFor(id,except){
  const ws=[...D.workouts].sort((a,b)=>b.date.localeCompare(a.date));
  for(const w of ws){if(w.id===except)continue;const e=w.ex.find(x=>x.id===id);if(e&&e.s.some(s=>s.ok))return{w,e}}return null}
const PLATES=[[25,'#e2453f'],[20,'#5b8de0'],[15,'#e8b93a'],[10,'#62b25c'],[5,'#d9d9d9'],[2.5,'#888'],[1.25,'#888']];
function platesFor(kg){let side=(kg-20)/2;if(side<=0)return null;const out=[];for(const[p,c]of PLATES)while(side>=p-1e-9){out.push([p,c]);side-=p}return side>0.01?null:out}
const anim=(id,sm)=>`<div class="anim ${sm?'sm':''}"><img src="ex/${id}_0.jpg" alt="" loading="lazy"><img class="b" src="ex/${id}_1.jpg" alt="" loading="lazy"></div>`;
function vGym(){
  const W=D.active&&D.workouts.find(w=>w.id===D.active);
  if(W)return vWorkout(W);
  $('#top').innerHTML=topbar('Sală');
  const plan=makePlan(),i=D.planIdx%plan.length;
  const hist=[...D.workouts].filter(w=>w.finished).sort((a,b)=>b.date.localeCompare(a.date));
  return `<div class="card"><h3>Planul tău<span class="r">${D.profile.days} zile/săpt.</span></h3>
    ${plan.map((p,j)=>`<div class="plan-day"><div class="sp"><div style="font-weight:600">${esc(p.n)} ${j===i?'<span class="target"> · urmează</span>':''}</div><div class="small mut">${p.ex.map(e=>`${esc(EXI[e.id].n)} ${e.s}×${esc(e.r)}`).join(' · ')}</div></div>
      <button class="btn sm ${j===i?'acc':''}" data-startday="${j}">Start</button></div>`).join('')}
    ${D.profile.goal==='slabire'?'<p class="tiny mut" style="margin:10px 0 0">La slăbire, planul are 20 de minute de mers pe bandă înclinată la final. Pașii zilnici contează la fel de mult.</p>':''}</div>
  <button class="btn full" data-act="startFree">Antrenament liber</button>
  <div class="card"><h3>Exerciții</h3><div class="chips" style="margin-bottom:6px">${EXG.map(g=>`<button class="chip ${S.libG===g[0]?'on':''}" data-libg="${g[0]}"><span class="dot" style="background:${g[2]};margin-right:6px"></span>${g[1]}</button>`).join('')}</div>
    ${EX.filter(e=>e.g===S.libG).map(e=>`<button class="exl" data-exinfo="${e.id}">${anim(e.id,1)}<div class="nm"><div>${esc(e.n)}</div><div class="small mut">${esc(e.m)}</div></div></button>`).join('')}</div>
  <div class="card"><h3>Istoric<span class="r">${hist.length} antrenamente</span></h3>
    ${hist.length?hist.slice(0,15).map(w=>`<div class="plan-day"><div class="sp"><div style="font-weight:600">${esc(dLong(w.date))}${w.plan?' · '+esc(w.plan):''}</div><div class="small mut">${w.ex.map(e=>esc(EXI[e.id]?EXI[e.id].n:e.id)).join(', ')}</div></div>
      ${S.confirm===w.id?`<button class="btn sm" data-noconf>Nu</button><button class="btn sm acc" data-delwork="${w.id}">Șterge</button>`:`<button class="btn sm ghost" data-conf="${w.id}">✕</button>`}</div>`).join(''):'<div class="empty small">Antrenamentele terminate apar aici.</div>'}</div>`;
}
function vWorkout(W){
  $('#top').innerHTML=`<h1>${esc(W.plan||'Antrenament')}</h1>`;
  const n=W.ex.reduce((a,e)=>a+e.s.filter(s=>s.ok).length,0);
  return `<div class="row small mut"><span>${esc(dLong(W.date))}</span><span class="sp"></span><span class="num" style="font-size:17px">${n} ${n===1?'set':'seturi'}</span></div>`+
  W.ex.map((e,i)=>{const E=EXI[e.id],L=lastFor(e.id,W.id),t=E.t;
    const lastTxt=L?`Data trecută (${dTxt(L.w.date)}): <b>${L.e.s.filter(s=>s.ok).map(s=>t==='kg'&&+s.kg?fmt(s.kg)+'×'+s.r:t==='time'?s.r+' s':t==='cardio'?s.r+' min':(+s.kg?'+'+fmt(s.kg)+'kg×':'')+s.r).join(', ')}</b>`:'Prima dată pe acest exercițiu';
    const L1=t==='cardio'?'Minute':t==='time'?'Secunde':'Repetări',L0=t==='cardio'?'km':t==='bw'?'+ kg':'kg';
    return `<div class="card ex"><div class="ex-h"><button data-exinfo="${e.id}" aria-label="Cum se face">${anim(e.id,1)}</button><div class="sp"><b>${esc(E.n)}</b>${e.target?`<div class="target">Țintă: ${e.s.length}×${esc(e.target)}</div>`:''}<div class="tiny mut">Atinge imaginea pentru execuție</div></div>
      ${S.confirm==='ex'+i?`<button class="btn sm acc" data-delex="${i}">Șterge</button>`:`<button class="x" data-conf="ex${i}" aria-label="Scoate exercițiul">✕</button>`}</div>
      <div class="last">${lastTxt}</div>
      <div class="lbl"><span>Set</span><span>${L0}</span><span></span><span>${L1}</span><span></span></div>
      ${e.s.map((s,j)=>{const pl=E.bar&&+s.kg?platesFor(+s.kg):null;const ph=L&&L.e.s[j];
        return `<div class="set ${s.ok?'done':''}"><span class="n">${j+1}</span>
        <input inputmode="decimal" data-f="kg" data-e="${i}" data-s="${j}" value="${s.kg===''||s.kg==null?'':fmt(s.kg,2)}" placeholder="${ph?fmt(ph.kg||0,2):(t==='bw'?'0':'—')}" aria-label="${L0} set ${j+1}">
        <span class="xx">×</span>
        <input inputmode="numeric" data-f="r" data-e="${i}" data-s="${j}" value="${s.r===''||s.r==null?'':s.r}" placeholder="${ph?ph.r:'—'}" aria-label="${L1} set ${j+1}">
        <button class="chk ${s.ok?'on':''}" data-ok="${i}:${j}" aria-label="Set făcut"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
        ${pl?`<div class="plates">pe fiecare parte: ${pl.map(([p,c])=>`<i style="background:${c}"></i>${fmt(p,2)}`).join(' ')}</div>`:''}</div>`}).join('')}
      <div class="ex-f"><button class="btn sm" data-addset="${i}">+ Set</button>${e.s.length>1?`<button class="btn sm ghost" data-rmset="${i}">− Ultimul set</button>`:''}</div></div>`}).join('')+
  `<button class="btn full" data-act="addEx">+ Adaugă exercițiu</button>
  <div class="card"><div class="small mut" style="margin-bottom:8px">Pauză între seturi (pornește singură când bifezi)</div><div class="chips">${[60,90,120,180].map(s=>`<button class="chip ${D.rest===s?'on':''}" data-rest="${s}">${s<120?s+' s':s/60+' min'}</button>`).join('')}</div></div>
  <textarea id="wnote" rows="2" placeholder="Notițe: cum te-ai simțit, ce schimbi data viitoare">${esc(W.note||'')}</textarea>
  <button class="btn acc full" data-act="finish">Termină antrenamentul</button>
  ${S.confirm==='cancelW'?`<div class="row"><span class="small sp">Renunți la antrenament? Seturile nu se salvează.</span><button class="btn sm" data-noconf>Nu</button><button class="btn sm acc" data-act="cancelW">Renunță</button></div>`:`<button class="btn ghost full" data-conf="cancelW">Renunță la antrenament</button>`}`;
}
function exInfoHTML(id){const E=EXI[id];const g=EXG.find(x=>x[0]===E.g);
  return `<div class="pn-h"><h2 style="font-size:21px">${esc(E.n)}</h2><button class="x" data-close>✕</button></div>
  <div class="pn-b">${anim(id)}<div class="row wrap small"><span class="dot" style="background:${g[2]}"></span><b>${esc(E.m)}</b><span class="mut">· ${esc(E.eq)}</span></div>
    <div class="sec-t">Cum se face</div><ol class="steps">${E.s.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
    <div class="sec-t">Atenție la</div><ul class="warnl">${E.x.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    ${(()=>{const pts=exHist(id);return pts.length?`<div class="sec-t">Recordul tău</div><div class="small">${E.t==='kg'?`Cea mai mare greutate: <b>${fmt(Math.max(...pts.map(p=>p.top)),2)} kg</b> · 1RM estimat: <b>${fmt(Math.max(...pts.map(p=>p.best)))} kg</b>`:`Cel mai bun set: <b>${Math.max(...pts.map(p=>p.reps))}</b> ${E.t==='time'?'s':E.t==='cardio'?'min':'repetări'}`}</div>`:''})()}
  </div>${D.active?`<div class="pn-f"><button class="btn acc full" data-addexid="${id}">Adaugă în antrenament</button></div>`:''}`;
}
function exPickHTML(){
  return `<div class="pn-h"><h2>Alege exercițiul</h2><button class="x" data-close>✕</button></div>
  <div class="pn-b"><div class="chips">${EXG.map(g=>`<button class="chip ${S.libG===g[0]?'on':''}" data-libg2="${g[0]}">${g[1]}</button>`).join('')}</div>
  ${EX.filter(e=>e.g===S.libG).map(e=>`<button class="exl" data-addexid="${e.id}">${anim(e.id,1)}<div class="nm"><div>${esc(e.n)}</div><div class="small mut">${esc(e.m)}</div></div></button>`).join('')}</div>`;
}
function startWorkout(planDay,label){
  const W={id:uid(),date:today(),plan:label||'',note:'',finished:false,ex:[]};
  if(planDay)for(const pe of planDay.ex){const L=lastFor(pe.id);const reps=parseInt(pe.r)||'';
    W.ex.push({id:pe.id,target:pe.r,s:Array.from({length:pe.s},(_,j)=>{const ls=L&&L.e.s.filter(s=>s.ok)[j];return{kg:ls?ls.kg:'',r:EXI[pe.id].t==='cardio'?(parseInt(pe.r)||20):(ls?ls.r:reps),ok:false}})})}
  D.workouts.push(W);D.active=W.id;save();S.tab='sala';render();scrollTo(0,0);
}
function curW(){return D.workouts.find(w=>w.id===D.active)}

/* ================= PROGRES ================= */
function exHist(id){const pts=[];for(const w of [...D.workouts].filter(w=>w.finished).sort((a,b)=>a.date.localeCompare(b.date))){const e=w.ex.find(x=>x.id===id);if(!e)continue;const ok=e.s.filter(s=>s.ok);if(!ok.length)continue;
  pts.push({date:w.date,best:Math.max(...ok.map(s=>+s.kg>0&&+s.r>0?(+s.kg)*(1+Math.min(+s.r,12)/30):0)),top:Math.max(...ok.map(s=>+s.kg||0)),reps:Math.max(...ok.map(s=>+s.r||0))})}return pts}
function vProg(){
  $('#top').innerHTML=topbar('Progres');
  const P=D.profile,w=[...D.weights].sort((a,b)=>a.d.localeCompare(b.d));const cw=curWeight();
  const start=w.length?w[0].kg:P.w;
  const exIds=[...new Set(D.workouts.filter(x=>x.finished).flatMap(x=>x.ex.filter(e=>e.s.some(s=>s.ok)).map(e=>e.id)))];
  if(!S.progEx||!exIds.includes(S.progEx))S.progEx=exIds[0]||null;
  const wk=D.workouts.filter(x=>x.finished&&x.date>addDays(today(),-28)).length;
  return `<div class="g3"><div class="stat"><div class="v">${fmt(cw)}<small> kg</small></div><div class="k">acum</div></div>
    <div class="stat"><div class="v" style="color:${(P.goal==='slabire'&&cw<start)||(P.goal==='masa'&&cw>start)?'var(--ok)':'inherit'}">${cw-start>0?'+':''}${fmt(cw-start)}<small> kg</small></div><div class="k">de la început</div></div>
    <div class="stat"><div class="v">${wk}</div><div class="k">antrenamente în 4 săpt.</div></div></div>
  <div class="card"><h3>Greutate${P.target?`<span class="r">țintă ${fmt(P.target)} kg</span>`:''}</h3>
    <div class="row" style="margin-bottom:8px"><input id="wadd" type="number" inputmode="decimal" placeholder="Greutatea de azi (kg)"><button class="btn acc" data-act="addWeight">Salvează</button></div>
    <div id="chW"></div><p class="tiny mut" style="margin:6px 0 0">Punctele sunt cântăririle, linia e media pe 7 zile. Greutatea variază zilnic cu 1–2 kg din apă și mâncare; contează linia.</p></div>
  <div class="card"><h3>Calorii, ultimele 14 zile</h3><div id="chK"></div></div>
  <div class="card"><h3>Forță pe exercițiu</h3>${exIds.length?`<select id="progEx">${exIds.map(id=>`<option value="${id}" ${id===S.progEx?'selected':''}>${esc(EXI[id]?EXI[id].n:id)}</option>`).join('')}</select><div id="chE" style="margin-top:10px"></div>
    <p class="tiny mut" style="margin:6px 0 0">La exercițiile cu greutate: 1RM estimat (cât ai putea ridica o singură dată), din cel mai bun set. Formula Epley.</p>`:'<div class="empty small">După primele antrenamente vezi aici cum crește forța.</div>'}</div>`;
}
function lineChart(pts,opt){
  const W=600,H=220,L=38,R=12,T=12,B=26;if(pts.length<2)return `<div class="empty small">${opt.empty||'Mai trebuie cel puțin încă o valoare ca să apară graficul.'}</div>`;
  const xs=pts.map(p=>new Date(p.d+'T12:00').getTime());const x0=Math.min(...xs),x1=Math.max(...xs);
  const ys=pts.map(p=>p.v).concat(opt.extra||[]).concat(opt.line?opt.line.map(p=>p.v):[]);let lo=Math.min(...ys),hi=Math.max(...ys);const pd=Math.max(0.5,(hi-lo)*0.15);lo-=pd;hi+=pd;
  const X=t=>L+(W-L-R)*(t-x0)/((x1-x0)||1),Y=v=>T+(H-T-B)*(1-(v-lo)/((hi-lo)||1));
  const step=(()=>{const r=(hi-lo)/4;const p=Math.pow(10,Math.floor(Math.log10(r)));for(const m of[1,2,2.5,5,10])if(m*p>=r)return m*p;return 10*p})();
  let g='';for(let v=Math.ceil(lo/step)*step;v<=hi;v+=step)g+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end">${fmt(v)}</text>`;
  if(opt.target!=null&&opt.target>lo&&opt.target<hi)g+=`<line x1="${L}" x2="${W-R}" y1="${Y(opt.target)}" y2="${Y(opt.target)}" stroke="var(--ok)" stroke-dasharray="5 5"/><text x="${W-R}" y="${Y(opt.target)-5}" text-anchor="end" style="fill:var(--ok)">țintă</text>`;
  const ln=(arr,col,w)=>`<path d="${arr.map((p,i)=>(i?'L':'M')+X(new Date(p.d+'T12:00').getTime()).toFixed(1)+' '+Y(p.v).toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if(opt.line&&opt.line.length>1)g+=ln(opt.line,opt.col,3);else if(!opt.dotsOnly)g+=ln(pts,opt.col,2.5);
  g+=pts.map((p,i)=>`<circle cx="${X(xs[i])}" cy="${Y(p.v)}" r="${i===pts.length-1?4.5:opt.line?2.5:3}" fill="${i===pts.length-1?opt.col:'var(--card)'}" stroke="${opt.col}" stroke-width="${opt.line?1.5:2}" opacity="${opt.line&&i<pts.length-1?.6:1}"/>`).join('');
  const li=[0,Math.floor((pts.length-1)/2),pts.length-1].filter((v,i,a)=>a.indexOf(v)===i);
  g+=li.map(i=>`<text x="${X(xs[i])}" y="${H-7}" text-anchor="${i===0?'start':i===pts.length-1?'end':'middle'}">${dTxt(pts[i].d)}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}
function drawCharts(){
  const P=D.profile;const w=[...D.weights].sort((a,b)=>a.d.localeCompare(b.d)).map(x=>({d:x.d,v:x.kg}));
  const avg=w.map(p=>{const s=w.filter(q=>q.d<=p.d&&q.d>addDays(p.d,-7));return{d:p.d,v:s.reduce((a,q)=>a+q.v,0)/s.length}});
  const cw=$('#chW');if(cw)cw.innerHTML=lineChart(w,{col:'var(--acc)',line:avg,target:P.target,dotsOnly:true,empty:'Notează-ți greutatea câteva zile ca să vezi graficul.'});
  const ck=$('#chK');if(ck){const T=targets();const days=Array.from({length:14},(_,i)=>addDays(today(),i-13));const vals=days.map(d=>sumDay(d).k);const mx=Math.max(T.kcal*1.3,...vals);
    const W=600,H=170,L=8,B=24,bw=(W-L*2)/14;
    ck.innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${H}"><line x1="0" x2="${W}" y1="${(H-B)*(1-T.kcal/mx)}" y2="${(H-B)*(1-T.kcal/mx)}" stroke="var(--ok)" stroke-dasharray="5 5"/>
      ${vals.map((v,i)=>{const h=(H-B)*(v/mx);return `<rect x="${L+i*bw+bw*0.18}" y="${H-B-h}" width="${bw*0.64}" height="${Math.max(h,v?2:0)}" rx="4" fill="${v>T.kcal*1.05?'var(--warn)':'var(--acc)'}" opacity="${v?1:0}"/>`}).join('')}
      ${[0,7,13].map(i=>`<text x="${L+i*bw+bw/2}" y="${H-6}" text-anchor="middle">${dTxt(days[i])}</text>`).join('')}
      <text x="${W-4}" y="${(H-B)*(1-T.kcal/mx)-6}" text-anchor="end" style="fill:var(--ok)">țintă ${T.kcal}</text></svg>`}
  const ce=$('#chE');if(ce&&S.progEx){const E=EXI[S.progEx];const pts=exHist(S.progEx);const kg=E.t==='kg'||pts.some(p=>p.best>0);
    ce.innerHTML=lineChart(pts.map(p=>({d:p.date,v:kg?Math.round(p.best*10)/10:p.reps})),{col:'var(--p)'})}
}

/* ================= foaie (sheet) ================= */
let sheetFn=null;
function openSheet(fn){sheetFn=fn;const s=$('#sheet');s.innerHTML=`<div class="pn" role="dialog">${fn()}</div>`;s.hidden=false;document.body.style.overflow='hidden'}
function refreshSheet(){if(!sheetFn)return;const a=document.activeElement,id=a&&a.id,pos=a&&a.selectionStart;const b=$('#sheet .pn-b'),st=b?b.scrollTop:0;
  $('#sheet .pn').innerHTML=sheetFn();const nb=$('#sheet .pn-b');if(nb)nb.scrollTop=st;if(id){const n=document.getElementById(id);if(n){n.focus();if(pos!=null)try{n.setSelectionRange(pos,pos)}catch(e){}}}}
function closeSheet(){sheetFn=null;$('#sheet').hidden=true;$('#sheet').innerHTML='';document.body.style.overflow=''}
$('#sheet').addEventListener('click',e=>{if(e.target.id==='sheet')closeSheet()});

/* ================= cronometru ================= */
let TM=null;
function startRest(sec){stopRest();const end=Date.now()+sec*1000,el=$('#timer');el.hidden=false;el.classList.remove('end');
  const tick=()=>{const left=Math.max(0,Math.ceil((end-Date.now())/1000));
    el.innerHTML=`<span class="t">${Math.floor(left/60)}:${pad(left%60)}</span><span class="tb"><i style="width:${100*(1-left/sec)}%"></i></span><button data-tplus>+30 s</button><button data-tstop>Gata</button>`;
    if(left<=0){clearInterval(TM);TM=null;el.classList.add('end');el.querySelector('.t').textContent='Gata!';beep();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}setTimeout(()=>{if(!TM)el.hidden=true},6000)}};
  tick();TM=setInterval(tick,250);el._end=end}
function stopRest(){if(TM)clearInterval(TM);TM=null;$('#timer').hidden=true}
$('#timer').addEventListener('click',e=>{if(e.target.closest('[data-tstop]'))stopRest();if(e.target.closest('[data-tplus]')){const left=Math.max(0,Math.ceil(($('#timer')._end-Date.now())/1000));startRest(left+30)}});
let AC=null;function beep(){try{AC=AC||new AudioContext();for(const t of[0,.35]){const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=880;o.connect(g);g.connect(AC.destination);const s=AC.currentTime+t;g.gain.setValueAtTime(.0001,s);g.gain.exponentialRampToValueAtTime(.35,s+.02);g.gain.exponentialRampToValueAtTime(.0001,s+.3);o.start(s);o.stop(s+.32)}}catch(e){}}

let toastT=null;function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2200)}

/* ================= evenimente ================= */
document.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;const ds=t.dataset;
  if(t.closest('[data-pf]')&&ds.v){t.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t));return}
  if(ds.close!=null)return closeSheet();
  if(ds.day!=null){const n=+ds.day;S.date=n===0?today():addDays(S.date,n);if(S.date>today())S.date=today();render();return}
  if(ds.go){go(ds.go);return}
  if(ds.glass!=null){const d=day(S.date),i=+ds.glass;d.water=d.water===i+1?i:i+1;save();render();return}
  if(ds.addfood)return openFoodPicker(ds.addfood);
  if(ds.fcat){S.foodCat=ds.fcat;refreshSheet();return}
  if(ds.pickfood){const f=foodList().find(x=>x.n===ds.pickfood);if(f)openGrams(f);return}
  if(ds.pickonline!=null){openGrams(FS.online[+ds.pickonline]);return}
  if(ds.grams){const q=$('#gq');q.value=ds.grams;q.dispatchEvent(new Event('input',{bubbles:true}));return}
  if(ds.meal){GQ.meal=ds.meal;refreshSheet();return}
  if(ds.edititem){const[m,i]=ds.edititem.split(':');const item=day(S.date).meals[m][+i];const f={n:item.n,...(item.base||{k:item.k/item.g*100,p:item.p/item.g*100,c:item.c/item.g*100,f:item.f/item.g*100,fb:item.fb/item.g*100,pl:'porție',pg:item.g})};FS.meal=m;openGrams(f,{meal:m,idx:+i,item});return}
  if(ds.startday!=null){const plan=makePlan();const j=+ds.startday;D.planIdx=j;startWorkout(plan[j],plan[j].n);return}
  if(ds.libg){S.libG=ds.libg;render();return}
  if(ds.libg2){S.libG=ds.libg2;refreshSheet();return}
  if(ds.exinfo){openSheet(()=>exInfoHTML(ds.exinfo));return}
  if(ds.addexid){const W=curW();if(W){const L=lastFor(ds.addexid,W.id);W.ex.push({id:ds.addexid,s:L?L.e.s.filter(s=>s.ok).map(s=>({kg:s.kg,r:s.r,ok:false})):[{kg:'',r:'',ok:false}]});save();closeSheet();render();setTimeout(()=>{const c=document.querySelectorAll('.ex');c[c.length-1]?.scrollIntoView({behavior:'smooth',block:'center'})},50)}return}
  if(ds.addset){const W=curW(),ex=W.ex[+ds.addset],l=ex.s[ex.s.length-1];ex.s.push({kg:l?l.kg:'',r:l?l.r:'',ok:false});save();render();return}
  if(ds.rmset){curW().ex[+ds.rmset].s.pop();save();render();return}
  if(ds.ok){const[i,j]=ds.ok.split(':').map(Number);const W=curW(),s=W.ex[i].s[j];
    if(!s.ok){const L=lastFor(W.ex[i].id,W.id),ph=L&&L.e.s[j];if(s.kg===''&&ph)s.kg=ph.kg;if(s.r===''&&ph)s.r=ph.r;if(s.r===''||s.r==null)return toast('Scrie întâi repetările')}
    s.ok=!s.ok;save();render();if(s.ok&&EXI[W.ex[i].id].t!=='cardio')startRest(D.rest||90);return}
  if(ds.rest){D.rest=+ds.rest;save();render();startRest(D.rest);return}
  if(ds.conf){S.confirm=ds.conf;render();return}
  if(ds.noconf!=null){S.confirm=null;render();return}
  if(ds.delex!=null){curW().ex.splice(+ds.delex,1);S.confirm=null;save();render();return}
  if(ds.delwork){D.workouts=D.workouts.filter(w=>w.id!==ds.delwork);S.confirm=null;save();render();return}
  const A=ds.act;if(!A)return;
  ({
    saveProfile(){const P=readProfile();if(!P)return;const first=!D.profile;D.profile=P;if(first||!D.weights.length){D.weights=D.weights.filter(w=>w.d!==today());D.weights.push({d:today(),kg:P.w})}save();if(first){S.tab='profil'}render();scrollTo(0,0);toast(first?'Gata! Uite țintele tale':'Salvat și recalculat')},
    addWeightQ(){const v=num($('#wq').value);if(v<30||v>300)return toast('Scrie greutatea în kg');D.weights=D.weights.filter(w=>w.d!==S.date);D.weights.push({d:S.date,kg:v});save();render();toast('Greutate salvată')},
    addWeight(){const v=num($('#wadd').value);if(v<30||v>300)return toast('Scrie greutatea în kg');D.weights=D.weights.filter(w=>w.d!==today());D.weights.push({d:today(),kg:v});save();render();toast('Greutate salvată')},
    startPlan(){const plan=makePlan();const j=D.planIdx%plan.length;startWorkout(plan[j],plan[j].n)},
    startFree(){startWorkout(null,'Antrenament liber')},
    addEx(){S.libG=S.libG||'piept';openSheet(exPickHTML)},
    finish(){const W=curW();const n=W.ex.reduce((a,e)=>a+e.s.filter(s=>s.ok).length,0);if(!n){D.workouts=D.workouts.filter(w=>w!==W);D.active=null;save();render();return toast('Niciun set bifat, antrenamentul nu s-a salvat')}
      W.ex=W.ex.filter(e=>e.s.some(s=>s.ok));W.ex.forEach(e=>e.s=e.s.filter(s=>s.ok));W.finished=true;D.active=null;
      const plan=makePlan();if(W.plan&&plan.some(p=>p.n===W.plan))D.planIdx=(plan.findIndex(p=>p.n===W.plan)+1)%plan.length;stopRest();save();S.tab='azi';render();scrollTo(0,0);toast('Bravo! Antrenament salvat: '+(n===1?'1 set':n+' seturi'))},
    cancelW(){D.workouts=D.workouts.filter(w=>w.id!==D.active);D.active=null;S.confirm=null;stopRest();save();render()},
    offSearch(){offSearch()},
    newCustom(){openSheet(customHTML)},
    saveCustom(){const n=$('#cn').value.trim();const k=num($('#ck').value);if(!n)return toast('Scrie numele');if(k<=0)return toast('Scrie caloriile la 100 g');
      const f={n,k,p:num($('#cp').value),c:num($('#cc').value),f:num($('#cf').value),fb:num($('#cfb').value),pl:'porție',pg:num($('#cpg').value)||100};
      D.custom=D.custom.filter(x=>x.n!==n);D.custom.push(f);save();openGrams(f)},
    saveItem(){saveItem()},
    delItem(){day(S.date).meals[GQ.edit.meal].splice(GQ.edit.idx,1);save();closeSheet();render();toast('Șters')},
    copyYesterday(){const y=D.days[addDays(S.date,-1)];if(!y)return toast('Ieri nu ai notat nimic');const d=day(S.date);for(const[m]of MEALS)d.meals[m].push(...(y.meals[m]||[]).map(x=>({...x})));save();render();toast('Mesele de ieri au fost copiate')},
    export(){exportJSON()},
    import(){$('#importFile').click()}
  })[A]?.();
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='fq'){FS.q=t.value;FS.online=null;clearTimeout(t._t);t._t=setTimeout(refreshSheet,120);return}
  if(t.id==='gq'){const v=t.value.replace(/[^0-9.,]/g,'');if(v!==t.value)t.value=v;GQ.g=num(v);const f=GQ.f,m=GQ.g/100;
    $('#gk').textContent=r0(f.k*m);$('#gp').textContent=fmt(f.p*m);$('#gc').textContent=fmt(f.c*m);$('#gf').textContent=fmt(f.f*m);$('#gfb').textContent=fmt(f.fb*m);
    document.querySelectorAll('[data-grams]').forEach(b=>b.classList.toggle('on',r0(+b.dataset.grams)===r0(GQ.g)));return}
  if(t.dataset.f){const W=curW();const s=W.ex[+t.dataset.e].s[+t.dataset.s];const raw=t.value.replace(',','.').trim();
    s[t.dataset.f]=raw===''?'':(t.dataset.f==='r'?Math.max(0,parseInt(raw)||0):Math.max(0,parseFloat(raw)||0));save();return}
  if(t.id==='wnote'){curW().note=t.value.slice(0,2000);save();return}
});
document.addEventListener('focusin',e=>{const t=e.target;if(t.id==='gq'||t.dataset.f||t.id==='wq'||t.id==='wadd'){setTimeout(()=>{try{t.select()}catch(x){}},0)}});
document.addEventListener('change',e=>{if(e.target.id==='progEx'){S.progEx=e.target.value;render()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='fq'){e.preventDefault();offSearch()}});

/* ================= copie de siguranță ================= */
const CAP=window.Capacitor;
const plug=n=>{try{if(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform())return CAP.registerPlugin?CAP.registerPlugin(n):CAP.Plugins[n]}catch(e){}return null};
async function exportJSON(){
  const json=JSON.stringify(D,null,1),name='ontrack-backup-'+today()+'.json';
  const FSy=plug('Filesystem'),Sh=plug('Share');
  if(FSy){try{const r=await FSy.writeFile({path:name,data:json,directory:'CACHE',encoding:'utf8'});
      if(Sh){await Sh.share({title:'Copie OnTrack',url:r.uri,dialogTitle:'Salvează copia'})}else toast('Salvat');return}catch(e){if(String(e&&e.message||e).includes('cancel'))return;}
    try{await FSy.writeFile({path:name,data:json,directory:'DOCUMENTS',encoding:'utf8'});toast('Salvat în Documente: '+name);return}catch(e){toast('Nu s-a putut exporta')}return}
  try{const file=new File([json],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Copie OnTrack'});return}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();
}
$('#importFile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const o=JSON.parse(await f.text());if(!o||!o.days||!Array.isArray(o.workouts))throw 0;D=Object.assign(blank(),o);save();S.tab='azi';render();toast('Datele au fost importate')}catch(err){toast('Fișierul nu e o copie OnTrack')}});

/* ================= butonul Înapoi (Android) ================= */
const AppP=plug('App');
if(AppP){AppP.addListener('backButton',()=>{if(sheetFn)return closeSheet();if(!$('#timer').hidden&&TM)return stopRest();if(S.tab!=='azi')return go('azi');AppP.exitApp()})}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&S.date<today()&&S.tab==='azi'){S.date=today();render()}});

render();
