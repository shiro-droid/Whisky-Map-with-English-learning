/* Whisky Map · 共享引擎
   每一场只需要提供 SVG + 热点内容，调用 WM.boot(config) 即可。 */
(function(){
"use strict";
const WM={};

/* ================= TTS ================= */
let VOICES=[],primed=false;
function loadVoices(){try{VOICES=speechSynthesis.getVoices()||[]}catch(e){VOICES=[]}}
loadVoices();
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=function(){loadVoices();updateVoiceWarn()};
function englishVoices(){
 return VOICES.filter(v=>(v.lang||"").toLowerCase().indexOf("en")===0);
}
function pickVoice(){
 if(!VOICES.length)loadVoices();
 const en=englishVoices();
 if(!en.length)return null;
 const p=["Daniel","Serena","Kate","Arthur","Martha","Google UK English Male","Google UK English Female","Microsoft George","Microsoft Hazel","Microsoft Ryan"];
 for(const n of p){const v=en.find(v=>v.name===n);if(v)return v}
 return en.find(v=>v.lang==="en-GB")||en.find(v=>v.lang==="en-US")||en[0];
}
/* 没有英语语音时不要用中文引擎硬念——那不是英语，会把发音带偏 */
function voiceReady(){
 if(!VOICES.length)loadVoices();
 return VOICES.length===0 || englishVoices().length>0;
}
function updateVoiceWarn(){
 const bar=document.getElementById("voiceWarn");
 if(!bar)return;
 if(!VOICES.length){bar.hidden=true;return}
 bar.hidden=englishVoices().length>0;
}
function rateVal(){const r=document.getElementById("rate");return r?(parseFloat(r.value)||0.9):0.9}
function prime(){if(!primed){try{speechSynthesis.speak(new SpeechSynthesisUtterance(""))}catch(e){}primed=true;loadVoices()}}
function speak(t,r){
 if(!window.speechSynthesis)return;
 if(!voiceReady()){updateVoiceWarn();return}
 prime();try{speechSynthesis.cancel()}catch(e){}
 const u=new SpeechSynthesisUtterance(String(t).replace(/\s+/g," ").trim());
 const v=pickVoice();if(v){u.voice=v;u.lang=v.lang}else u.lang="en-GB";
 u.rate=r||rateVal();
 setTimeout(()=>{try{speechSynthesis.speak(u)}catch(e){}},60);
}
function speakSeq(l,r,cb){
 if(!window.speechSynthesis)return;
 if(!voiceReady()){updateVoiceWarn();return}
 prime();try{speechSynthesis.cancel()}catch(e){}
 const v=pickVoice();
 l.forEach((t,i)=>{
  const u=new SpeechSynthesisUtterance(strip(t));
  if(v){u.voice=v;u.lang=v.lang}else u.lang="en-GB";
  u.rate=r||rateVal();
  if(cb){u.onstart=()=>cb(i);u.onend=()=>cb(-1)}
  setTimeout(()=>{try{speechSynthesis.speak(u)}catch(e){}},60+i*12);
 });
}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&window.speechSynthesis){try{speechSynthesis.cancel()}catch(e){}}});

/* ================= 小工具 ================= */
function el(t,c,h){const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function strip(h){const d=document.createElement("div");d.innerHTML=h;return d.textContent||""}
function sb(t){const b=el("button","play","▶︎");b.onclick=()=>speak(strip(t));return b}
function dialogue(b,L,names){
 const N=names||{g:"导览",y:"你"};
 L.forEach(d=>{
  const r=el("div","line"),w=el("div","who "+d.who,N[d.who]||""),u=el("div","bub");
  const e=el("p","en",d.en);e.appendChild(sb(d.en));
  u.appendChild(e);u.appendChild(el("p","zh",d.zh));
  r.appendChild(w);r.appendChild(u);b.appendChild(r);
 });
}
function chips(b,I){
 const w=el("div","chips");
 I.forEach(i=>{const c=el("button","chip","<span>"+i.en+"</span><small>"+i.zh+"</small>");c.onclick=()=>speak(i.en);w.appendChild(c)});
 b.appendChild(w);
}
function vocab(b,L){
 L.forEach(v=>{
  const d=el("div","v");
  d.innerHTML='<div><span class="w">'+v.w+'</span><span class="ipa">'+(v.ipa||"")+'</span></div><button class="spk">🔊</button>'+
   '<div class="meta"><span>'+v.zh+'</span><span class="ja">'+v.ja+'</span></div>';
  d.querySelector(".spk").onclick=()=>speak(v.w,0.82);
  b.appendChild(d);
 });
}
function tok(s){return String(s).toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9'\s]/g," ").split(/\s+/).filter(Boolean)}
function wordDiff(a0,b0){
 const a=tok(a0),b=tok(b0),m=a.length,n=b.length;
 const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));
 for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,out=[],hit=0;
 while(i<m&&j<n){
  if(a[i]===b[j]){out.push({t:a[i],s:"ok"});hit++;i++;j++}
  else if(dp[i+1][j]>=dp[i][j+1]){out.push({t:a[i],s:"miss"});i++}
  else{out.push({t:b[j],s:"extra"});j++}
 }
 while(i<m)out.push({t:a[i++],s:"miss"});
 while(j<n)out.push({t:b[j++],s:"extra"});
 return{out,hit,total:m};
}

/* ================= 笔记存取 ================= */
const NKEY="whiskymap.notes.v1";
let SCENE="s";
function allNotes(){try{return JSON.parse(localStorage.getItem(NKEY)||"{}")}catch(e){return{}}}
function saveNote(k,v){const o=allNotes();o[SCENE+"."+k]=v;try{localStorage.setItem(NKEY,JSON.stringify(o))}catch(e){}}
function loadNote(k){return allNotes()[SCENE+"."+k]||""}
function autosave(node,key,tag){
 let t=null;
 node.addEventListener("input",()=>{clearTimeout(t);t=setTimeout(()=>{saveNote(key,node.value);if(tag)tag.textContent="已保存"},450)});
}

/* ================= 常错八条（跨场共用） =================
   中文母语者写威士忌笔记时最常漏的四类零件：
   冠词 / 量词 / 名词↔形容词 / 动词形式 */
const ERRBOOK=[
 ["There are too many whiskies I want to try.","There are so many whiskies I want to try.",
  "<b>量词</b>：<b>too many</b> ＝「多到成问题了」（负面）。想说「多得很」要用 <b>so many</b>。"],
 ["Why I like Islay is about the smoke.","What I like about Islay is the smoke.",
  "<b>结构混搭</b>：<i>why I like X is…</i> 和 <i>it's about…</i> 揉在了一起。挑一个。<br><b>What I like about X is Y</b> 是超好用的强调框架，记住它。"],
 ["Two bottles from same cask can taste different.","Two bottles from the same cask can taste different.",
  "<b>冠词</b>：<b>the same</b> 永远带 the，没有例外（same 本身就预设了特指）。"],
 ["The air, temperature, wet and time change everything.","The air, the temperature, the humidity and the time all make a difference.",
  "<b>词性</b>：<b>wet</b> 是形容词，名词是 <b>humidity</b>（湿度）。<br><b>make a difference</b> 是固定搭配，比 change everything 地道得多。"],
 ["I'm keeping finding out the difference of them.","I keep finding new differences between them.",
  "<b>动词形式 + 介词 + 单复数</b>，三处：① <b>keep + V-ing</b> 已表持续，不能再套进行时；② 差别在两者<b>之间</b> → <b>between</b>；③ 找到的是很多个 → 复数 <b>differences</b>。"],
 ["I like almost of the Islay malts.","I like almost all of the Islay malts.",
  "<b>量词</b>：<b>almost</b> 是副词，不能单独当量词，必须修饰一个量词：almost <b>all</b> / almost <b>every</b> / almost <b>none</b>。"],
 ["I bought a expensive bottle from Macallan bottling by SMWS.","I bought an expensive bottle — a Macallan bottled by SMWS.",
  "<b>冠词 + 被动分词</b>：① <b>a → an</b>（expensive 以元音开头）；② 酒是<b>被</b>装瓶的 → 过去分词 <b>bottled by</b>，不是 bottling。"],
 ["It is like a old wine but still keep a fruit favor.","It is like an old wine, but it still keeps a fruity flavour.",
  "<b>四个零件一次到齐</b>：① <b>an old</b>；② 主语是 It → <b>keeps</b>；③ <b>fruit</b>（名词）→ <b>fruity</b>（形容词）；④ favor → <b>flavour</b>（苏格兰用英式拼写）。<br><br>顺带：想说「像一款老葡萄酒」，行话里的那个词是 <b>vinous</b>。"]
];
function renderErrbook(b){
 b.appendChild(el("h3",null,"常错八条（每场都翻一遍）"));
 b.appendChild(el("p","small","中文母语者写威士忌笔记时最常漏的<b>四类零件</b>：冠词、量词、名词↔形容词、动词形式。<b>这八条把四类全覆盖了。</b>写完对照一下。"));
 let i=0;
 const card=el("div","rw");card.style.cssText="border-left:3px solid var(--rust);padding-left:12px;margin:12px 0";
 const pg=el("div","pager"),pv=el("button","btn sm","‹ 上一条"),nm=el("span","n",""),nx=el("button","btn sm gold","下一条 ›");
 pg.appendChild(pv);pg.appendChild(nm);pg.appendChild(nx);
 function draw(){
  card.innerHTML="";card.appendChild(el("div","bad",ERRBOOK[i][0]));
  const g=el("div","good",ERRBOOK[i][1]);g.appendChild(sb(ERRBOOK[i][1]));card.appendChild(g);
  card.appendChild(el("div","why",ERRBOOK[i][2]));
  nm.textContent=(i+1)+" / "+ERRBOOK.length;pv.disabled=i===0;nx.disabled=i===ERRBOOK.length-1;
 }
 pv.onclick=()=>{if(i>0){i--;draw()}};nx.onclick=()=>{if(i<ERRBOOK.length-1){i++;draw()}};
 b.appendChild(card);b.appendChild(pg);draw();
}

/* ================= 段落 / Checkpoint ================= */
function renderPassage(body,p){
 const box=el("div","passage");
 box.appendChild(el("div","cap",p.cap||"English first · 先听，再拆"));
 const txt=el("div","txt");
 p.en.forEach(s=>{
  const sp=el("span","s",s+" ");
  sp.onclick=()=>{speak(s);[...txt.children].forEach(c=>c.classList.remove("lit"));sp.classList.add("lit")};
  txt.appendChild(sp);
 });
 box.appendChild(txt);
 const T=el("div","tools");
 const hi=i=>{[...txt.children].forEach(c=>c.classList.remove("lit"));if(i>=0&&txt.children[i])txt.children[i].classList.add("lit")};
 const a=el("button","btn sm pri","▶︎ 整段");a.onclick=()=>speakSeq(p.en,rateVal(),hi);
 const s=el("button","btn sm","🐢 慢速");s.onclick=()=>speakSeq(p.en,0.62,hi);
 const z=el("button","btn sm","中文");z.onclick=()=>{box.classList.toggle("showzh");z.textContent=box.classList.contains("showzh")?"藏中文":"中文"};
 T.appendChild(a);T.appendChild(s);T.appendChild(z);box.appendChild(T);
 box.appendChild(el("div","zhbox",p.zh));
 box.appendChild(el("div","tip",p.tip||"点任意一句可以单句重听。<b>先整段听两遍再看中文</b>，听不全是正常的。"));
 body.appendChild(box);
}
function renderCheck(body,c){
 const box=el("div","cp");
 box.appendChild(el("div","cap","✓ Checkpoint · 当场回收"));
 box.appendChild(el("p","q",c.q));
 const O=[];
 c.opts.forEach((o,oi)=>{
  const b=el("button","opt",o);
  b.onclick=()=>{
   if(b.disabled)return;
   O.forEach((x,j)=>{x.className="opt "+(j===c.a?"ok":(j===oi?"no":""));x.disabled=true});
   const e=box.querySelector(".exp");e.innerHTML=c.exp;e.style.display="";
  };
  O.push(b);box.appendChild(b);
 });
 const e=el("div","exp");e.style.display="none";box.appendChild(e);
 body.appendChild(box);
}

/* ================= 本场笔记 ================= */
function buildNotes(b,cfg){
 b.appendChild(el("p","small","每一场都有这么一格。写的东西存在本机，随时能改，写完用底部「导出我的笔记」复制出来发给我批改。"));
 b.appendChild(el("h3",null,"① 本场任务："+cfg.taskTitle));
 b.appendChild(el("div","box","<p class='zh' style='margin:0'>"+cfg.task+"</p>"));
 const ta=el("textarea");
 ta.placeholder=cfg.placeholder||"";
 if(cfg.minHeight)ta.style.minHeight=cfg.minHeight;
 ta.value=loadNote("writing");
 const st=el("div","saved","");autosave(ta,"writing",st);
 b.appendChild(ta);b.appendChild(st);
 b.appendChild(el("h3",null,"② 写完自己过一遍"));
 const ul=el("ul","checklist");
 cfg.checklist.forEach((c,i)=>{
  const li=el("li"),cb=el("input");cb.type="checkbox";
  cb.checked=loadNote("ck"+i)==="1";
  cb.onchange=()=>saveNote("ck"+i,cb.checked?"1":"0");
  li.appendChild(cb);li.appendChild(el("span",null,c));ul.appendChild(li);
 });
 b.appendChild(ul);
 b.appendChild(el("h3",null,"③ 卡住的话，看一个范例"));
 const rb=el("button","btn sm","看范例"),rx=el("div","box");rx.style.display="none";
 const rp=el("p","en",cfg.ref.replace(/\n/g,"<br>"));rp.style.fontSize="15px";rx.appendChild(rp);
 rx.appendChild(el("p","small",cfg.refNote));
 const pb=el("button","btn sm sea","▶︎ 听范例");pb.onclick=()=>speak(cfg.ref.replace(/\n/g," "),0.86);
 rx.appendChild(pb);
 rb.onclick=()=>{rx.style.display=rx.style.display==="none"?"":"none";rb.textContent=rx.style.display==="none"?"看范例":"收起范例"};
 b.appendChild(rb);b.appendChild(rx);
 b.appendChild(el("hr","sep"));
 renderErrbook(b);
}

/* ================= 过关三关 ================= */
function buildDict(p,DICT){
 p.appendChild(el("p","small","<b>听音写句。</b>可以反复播、可以放慢。写完点「对答案」逐词比对——<span style='color:var(--rust)'>红色是漏掉/写错的</span>，<span style='color:#9A8F86;text-decoration:line-through'>灰色删除线是多写的</span>。"));
 DICT.forEach((s,i)=>{
  const box=el("div","box");box.appendChild(el("div","small","<b>第 "+(i+1)+" 句</b>"));
  const r=el("div","btnrow");
  const pb=el("button","btn sm pri","▶︎ 播放");pb.onclick=()=>speak(s,rateVal());
  const sl=el("button","btn sm","🐢 慢速");sl.onclick=()=>speak(s,0.58);
  r.appendChild(pb);r.appendChild(sl);box.appendChild(r);
  const inp=el("textarea");inp.placeholder="写下你听到的…";inp.style.minHeight="60px";
  inp.value=loadNote("dict"+i);autosave(inp,"dict"+i);box.appendChild(inp);
  const chk=el("button","btn sm moss","对答案"),res=el("div");
  chk.onclick=()=>{
   const d=wordDiff(s,inp.value);res.innerHTML="";
   const dv=el("div","diff");d.out.forEach(w=>dv.appendChild(el("span",w.s,w.t)));res.appendChild(dv);
   const pct=Math.round(d.hit/d.total*100);
   res.appendChild(el("div","scorebar","写对 <b>"+d.hit+" / "+d.total+"</b> 个词（"+pct+"%）"+
    (pct===100?" — 一字不差。":(pct>=80?" — 漏的多半是虚词，那正是被压扁的部分。":" — 再听两遍慢速的。"))));
   const a=el("p","en",s);a.style.marginTop="8px";a.appendChild(sb(s));res.appendChild(a);
  };
  box.appendChild(chk);box.appendChild(res);p.appendChild(box);
 });
}
function buildComp(p,COMP){
 p.appendChild(el("p","small","<b>给情境，你写英语。</b>写完再点参考——<b>先写，别偷看</b>，不然没用。"));
 COMP.forEach((c,i)=>{
  const box=el("div","box");box.appendChild(el("p","zh",c.sit));
  box.appendChild(el("div","small","要求：· "+c.need.join("<br>· ")));
  const inp=el("textarea");inp.placeholder="你的句子…";inp.style.minHeight="60px";
  inp.value=loadNote("comp"+i);autosave(inp,"comp"+i);box.appendChild(inp);
  const btn=el("button","btn sm","看参考"),ref=el("div");ref.style.display="none";
  const re=el("p","en",c.ref);re.style.margin="9px 0 0";re.appendChild(sb(c.ref));ref.appendChild(re);
  ref.appendChild(el("p","small","参考只是<b>一种</b>写法。你写的只要满足上面的要求、语法站得住，就是对的。"));
  btn.onclick=()=>{
   if(!inp.value.trim()&&ref.style.display==="none"){if(!confirm("还没写就看参考？先自己憋一句吧。\n\n还是要看？"))return}
   ref.style.display=ref.style.display==="none"?"":"none";
   btn.textContent=ref.style.display==="none"?"看参考":"收起";
  };
  box.appendChild(btn);box.appendChild(ref);p.appendChild(box);
 });
}
function buildFix(p,FIX){
 p.appendChild(el("p","small","<b>每句正好一个错</b>，全部来自这一场的语言点和你的常错零件。先自己改，再对答案。"));
 FIX.forEach((f,i)=>{
  const box=el("div","box");box.appendChild(el("p","en",f.bad));
  const inp=el("input");inp.className="txt";inp.placeholder="改对的句子…";
  inp.value=loadNote("fix"+i);autosave(inp,"fix"+i);box.appendChild(inp);
  const btn=el("button","btn sm moss","对答案");btn.style.marginTop="8px";
  const res=el("div");
  btn.onclick=()=>{
   const d=wordDiff(f.good,inp.value);res.innerHTML="";
   const dv=el("div","diff");d.out.forEach(w=>dv.appendChild(el("span",w.s,w.t)));res.appendChild(dv);
   const perfect=d.hit===d.total&&d.out.every(w=>w.s==="ok");
   res.appendChild(el("div","scorebar",perfect?"<b style='color:var(--moss)'>✓ 完全正确</b>":"对 <b>"+d.hit+" / "+d.total+"</b> 个词"));
   res.appendChild(el("div","exp","<b>正确：</b>"+f.good+"<br><br>"+f.why));
  };
  box.appendChild(btn);box.appendChild(res);p.appendChild(box);
 });
}
function buildOutro(b,C){
 b.appendChild(el("p","small","前面每格的 checkpoint 是当场回收。<b>这一关不给选项了</b>——都得你自己产出。"));
 const tabs=el("div","tabs"),pane=el("div");
 const T=[{k:"听写",n:"🎧",f:p=>buildDict(p,C.dict)},
          {k:"造句",n:"✍️",f:p=>buildComp(p,C.comp)},
          {k:"改错",n:"🔧",f:p=>buildFix(p,C.fix)}];
 function draw(i){[...tabs.children].forEach((c,j)=>c.className="tab"+(j===i?" on":""));pane.innerHTML="";T[i].f(pane)}
 T.forEach((t,i)=>{const x=el("button","tab","<b>"+t.n+"</b>"+t.k);x.onclick=()=>draw(i);tabs.appendChild(x)});
 b.appendChild(tabs);b.appendChild(pane);draw(0);
}

/* ================= boot ================= */
WM.boot=function(C){
 SCENE=C.sceneKey;
 const app=document.getElementById("app");

 /* header */
 const crumbs=C.crumbs.map(c=>{
  if(c.on)return '<span class="crumb on"><b>'+c.n+'</b>'+c.t+'</span>';
  if(c.href)return '<a class="crumb" href="'+c.href+'"><b>'+c.n+'</b>'+c.t+'</a>';
  return '<span class="crumb todo"><b>'+c.n+'</b>'+c.t+'</span>';
 }).join("");
 const hdr=el("header",null,
  '<div class="hd"><div class="hd-txt"><span class="hd-en">Laphroaig</span> '+
  '<span class="hd-gd">Lag Bhròdhaig</span><div class="hd-sub">'+C.sub+'</div></div>'+
  '<div class="ring"><svg viewBox="0 0 44 44" width="44" height="44">'+
  '<circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="4"/>'+
  '<circle id="ringArc" cx="22" cy="22" r="18" fill="none" stroke="#E0B458" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="113"/>'+
  '</svg><span id="ringTxt">0/0</span></div></div><div class="crumbs">'+crumbs+'</div>');
 app.appendChild(hdr);

 /* scene */
 const scene=el("div","scene");scene.id="scene";
 scene.innerHTML=C.svg+'<div class="hint" id="hint"></div>';
 app.appendChild(scene);

 /* belt */
 const belt=el("div","belt",
  '<div id="voiceWarn" class="warn" hidden><b>⚠︎ 这台设备没有安装英语语音，朗读功能用不了。</b>'+
  '<br>浏览器只找得到中文语音，用它念英文会把发音带偏，所以我直接停掉了。<br><br>'+
  '<b>Windows：</b>设置 → 时间和语言 → 语言和区域 → 添加语言 → <b>English (United Kingdom)</b>，'+
  '安装时勾上「语音」和「文本转语音」，装完<b>重启浏览器</b>。之后会出现 Microsoft George / Hazel（en-GB）。<br>'+
  '<b>iPhone：</b>系统自带英语语音（Daniel，标准英音），直接就能用。</div>'+
  '<div class="row"><button class="btn sm" id="resetBtn">↺ 清空进度</button>'+
  '<button class="btn sm" id="exportBtn">📤 导出我的笔记</button><span style="flex:1"></span>'+
  '<span class="rate">语速<input type="range" id="rate" min="0.55" max="1.15" step="0.05" value="0.9" style="width:60px"><span id="rateNum">0.9</span></span></div>'+
  '<div class="locked-note">'+C.note+'</div>');
 app.appendChild(belt);

 /* sheet */
 const scrim=el("div");scrim.id="scrim";document.body.appendChild(scrim);
 const sheet=el("div");sheet.id="sheet";sheet.setAttribute("role","dialog");
 sheet.innerHTML='<div class="sh-grip"><i></i></div>'+
  '<div class="sh-hd"><div class="ic" id="shIc"></div><div class="t"><div class="k" id="shKind"></div><h2 id="shTitle"></h2></div>'+
  '<button class="sh-x" id="shX">✕</button></div><div class="sh-body" id="shBody"></div>'+
  '<div class="sh-ft"><button class="btn" id="shLater">稍后再说</button><button class="btn gold" id="shDone">学完了 ✓</button></div>';
 document.body.appendChild(sheet);

 const rateEl=document.getElementById("rate");
 rateEl.addEventListener("input",()=>{document.getElementById("rateNum").textContent=rateEl.value});

 /* 补上 notes / outro 两格的 build */
 const SPOTS=C.spots;
 SPOTS.forEach(s=>{
  if(s.notes){const cfg=s.notes;s.build=b=>buildNotes(b,cfg)}
  if(s.outro){s.build=b=>buildOutro(b,{dict:C.dict,comp:C.comp,fix:C.fix})}
 });

 /* 进度 */
 const KEY=C.progressKey;
 let DONE=new Set();try{DONE=new Set(JSON.parse(localStorage.getItem(KEY)||"[]"))}catch(e){}
 function save(){try{localStorage.setItem(KEY,JSON.stringify([...DONE]))}catch(e){}}
 function refresh(){
  SPOTS.forEach(s=>{
   const n=document.getElementById("node-"+s.id);if(!n)return;
   const on=DONE.has(s.id);n.classList.toggle("done",on);
   let t=n.querySelector(".tick");
   if(on&&!t){t=el("span","tick","✓");n.appendChild(t)}
   if(!on&&t)t.remove();
  });
  const n=DONE.size,tt=SPOTS.length;
  document.getElementById("ringTxt").textContent=n+"/"+tt;
  document.getElementById("ringArc").style.strokeDashoffset=(113*(1-n/tt)).toFixed(1);
  const h=document.getElementById("hint");
  if(n===0)h.innerHTML="点亮起的圆点开始 · 每格先听一段英语再拆 · 进度自动保存";
  else if(n<tt)h.innerHTML="已完成 <b>"+n+"</b> 个 · 剩 <b>"+(tt-n)+"</b> 个 · 关掉也没关系，回来接着来";
  else h.innerHTML=C.doneMsg||"🥃 <b>这一场走完了。</b>";
 }

 /* 节点 */
 SPOTS.forEach(s=>{
  const n=el("button","node");n.id="node-"+s.id;
  n.style.left=s.x+"%";n.style.top=s.y+"%";
  n.innerHTML='<span style="font-size:'+(s.icon.length>2?"11px":"16px")+'">'+s.icon+'</span><span class="lbl">'+s.label+'</span>';
  n.onclick=()=>openSpot(s);
  scene.appendChild(n);
 });

 const shBody=document.getElementById("shBody");
 let current=null;
 function openSpot(s){
  current=s;
  document.getElementById("shIc").textContent=s.icon;
  document.getElementById("shKind").textContent=s.kind;
  document.getElementById("shTitle").textContent=s.title;
  shBody.innerHTML="";shBody.scrollTop=0;
  if(s.passage)renderPassage(shBody,s.passage);
  if(s.build)s.build(shBody);
  if(s.check)renderCheck(shBody,s.check);
  document.getElementById("shDone").textContent=DONE.has(s.id)?"已完成 ✓":"学完了 ✓";
  sheet.classList.add("on");scrim.classList.add("on");
 }
 function closeSheet(){
  sheet.classList.remove("on");scrim.classList.remove("on");
  try{speechSynthesis.cancel()}catch(e){}
  setTimeout(()=>{if(!sheet.classList.contains("on"))shBody.innerHTML=""},340);
  current=null;
 }
 document.getElementById("shX").onclick=closeSheet;
 document.getElementById("shLater").onclick=closeSheet;
 scrim.onclick=closeSheet;
 document.getElementById("shDone").onclick=()=>{if(current){DONE.add(current.id);save();refresh()}closeSheet()};
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sheet.classList.contains("on"))closeSheet()});
 (function(){
  let y0=null;
  [sheet.querySelector(".sh-grip"),sheet.querySelector(".sh-hd")].forEach(t=>{
   t.addEventListener("touchstart",e=>{y0=e.touches[0].clientY},{passive:true});
   t.addEventListener("touchmove",e=>{if(y0==null)return;const d=e.touches[0].clientY-y0;if(d>0)sheet.style.transform="translateX(-50%) translateY("+d+"px)"},{passive:true});
   t.addEventListener("touchend",e=>{if(y0==null)return;const d=e.changedTouches[0].clientY-y0;sheet.style.transform="";if(d>80)closeSheet();y0=null},{passive:true});
  });
 })();
 document.getElementById("resetBtn").onclick=()=>{
  if(confirm("清空这一场的学习进度？（你写的笔记不会删）")){DONE.clear();save();refresh()}
 };
 document.getElementById("exportBtn").onclick=()=>{
  const o=allNotes(),g=k=>o[SCENE+"."+k]||"";
  const L=["# "+C.exportTitle,""];
  if(g("writing"))L.push("## 本场写作",g("writing"),"");
  const d=C.dict.map((s,i)=>g("dict"+i)?("- 我写："+g("dict"+i)+"\n  原句："+s):null).filter(Boolean);
  if(d.length)L.push("## 听写",...d,"");
  const c=C.comp.map((x,i)=>g("comp"+i)?("- 情境："+strip(x.sit)+"\n  我写："+g("comp"+i)):null).filter(Boolean);
  if(c.length)L.push("## 造句",...c,"");
  const f=C.fix.map((x,i)=>g("fix"+i)?("- 原句："+x.bad+"\n  我改："+g("fix"+i)+"\n  正确："+x.good):null).filter(Boolean);
  if(f.length)L.push("## 改错",...f,"");
  const txt=L.length>2?L.join("\n"):"（这一场你还没写任何东西）";
  if(navigator.clipboard&&navigator.clipboard.writeText)
   navigator.clipboard.writeText(txt).then(()=>alert("笔记已复制到剪贴板，可以直接粘贴发给我批改。"),()=>prompt("手动复制：",txt));
  else prompt("手动复制：",txt);
 };
 refresh();
 loadVoices();updateVoiceWarn();
 // 语音列表是异步加载的，隔一会儿再确认一次
 setTimeout(()=>{loadVoices();updateVoiceWarn()},400);
 setTimeout(()=>{loadVoices();updateVoiceWarn()},1500);
};

/* 暴露给场景文件用 */
WM.el=el;WM.sb=sb;WM.speak=speak;WM.speakSeq=speakSeq;WM.strip=strip;
WM.dialogue=dialogue;WM.chips=chips;WM.vocab=vocab;WM.rateVal=rateVal;
WM.loadNote=loadNote;WM.saveNote=saveNote;WM.autosave=autosave;WM.wordDiff=wordDiff;
window.WM=WM;
})();
