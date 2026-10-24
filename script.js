/* YHWH archive - UI layer: hash routing, observer-driven infinite feed, search. */
(function(){
"use strict";
var D=YHWH_DATA,E=Engine,app=document.getElementById("app"),feed=null,srch=document.getElementById("srch"),qi=document.getElementById("q"),sb=document.getElementById("sb");
var BASE="YHWH";

function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function hsh(s){var x=5381;for(var i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))>>>0;return x}
function heb(h){return h?'<span class="he" lang="he" dir="rtl">'+esc(h)+"</span>":""}

/* Deterministic abstract art from the id string (generated artwork, not an archaeological image). */
function art(id){
  var s=hsh(id),n=3+s%6,rings=4+(s>>3)%4,rot=(s>>5)%60,step=7+(s>>9)%9,o="";
  for(var r=0;r<rings;r++){
    var rad=46-r*(40/rings),pts=[];
    for(var k=0;k<n;k++){var a=(k/n)*6.2832+((rot+r*step)*Math.PI/180);pts.push((100+rad*1.9*Math.cos(a)).toFixed(1)+","+(48+rad*Math.sin(a)).toFixed(1))}
    o+='<polygon points="'+pts.join(" ")+'" fill="none" stroke="var(--acc)" stroke-opacity="'+(0.85-r*0.1).toFixed(2)+'" stroke-width="1"/>';
  }
  if(s&1)o+='<line x1="0" y1="'+(10+(s>>4)%70)+'" x2="200" y2="'+(10+(s>>11)%70)+'" stroke="var(--acc)" stroke-opacity=".25"/>';
  return '<svg viewBox="0 0 200 96" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+o+"</svg>";
}

function card(id){
  var p=E.profile(id),a=el("a","card s-"+p.status+" a"+(p.cat%5));
  a.href="#/p/"+id;
  a.innerHTML='<div class="art">'+art(id)+(p.h?'<span class="wm he" lang="he">'+esc(p.h.split(" ")[0])+"</span>":"")+"</div>"+
    '<div class="bd"><span class="cat">'+esc(p.catName)+"</span><h3>"+esc(p.name)+"</h3><p>"+esc(p.desc)+"</p>"+
    '<div class="ft"><span>'+esc(p.statusLabel)+'</span><span class="no">No. '+esc(id)+"</span></div></div>";
  return a;
}

/* ---------- infinite feed ---------- */
function startFeed(root,startPos,catNo){
  var CH=12,pos=startPos,seen=new Set(),chunks=[],busy=false,dead=false,retry=0,timer=null,wd=null;
  var sent=el("div","sent");sent.setAttribute("aria-hidden","true");root.appendChild(sent);
  function fill(c){
    if(c._on||dead)return;
    c.style.minHeight="";var f=document.createDocumentFragment();
    c._ids.forEach(function(id){f.appendChild(card(id))});c.appendChild(f);c._on=true;
  }
  function drop(c){
    if(!c._on||c._i>=chunks.length-3)return;
    c.style.minHeight=c.offsetHeight+"px";c.textContent="";c._on=false;
  }
  var cio=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting)fill(e.target);else if(chunks.length>10)drop(e.target)});
  },{rootMargin:"250% 0px"});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)more()})},{rootMargin:"1800px 0px"});
  function more(){
    if(busy||dead)return;busy=true;sent.classList.add("busy");
    try{
      var r=E.feedNext(pos,CH,catNo),ids=r.ids.filter(function(id){return !seen.has(id)});
      if(ids.length){
        var c=el("div","chunk");c._ids=ids;ids.forEach(function(i){seen.add(i)});
        root.insertBefore(c,sent);c._i=chunks.push(c)-1;fill(c);cio.observe(c);
      }
      pos=r.next;retry=0;
    }catch(err){
      retry++;clearTimeout(timer);timer=setTimeout(more,Math.min(5000,400*retry));
    }
    busy=false;sent.classList.remove("busy");rearm();
  }
  function rearm(){if(dead)return;try{io.unobserve(sent);io.observe(sent)}catch(e){}}
  function check(){if(dead)return;var r=sent.getBoundingClientRect();if(r.top<window.innerHeight+1800)more()}
  var ticking=false;
  function onScroll(){if(ticking)return;ticking=true;requestAnimationFrame(function(){ticking=false;check()})}
  function onVis(){if(!document.hidden){rearm();check()}}
  window.addEventListener("scroll",onScroll,{passive:true});
  document.addEventListener("visibilitychange",onVis);
  window.addEventListener("pageshow",onVis);
  window.addEventListener("resize",onScroll,{passive:true});
  wd=setInterval(check,2000); /* watchdog: recovers if an observer callback is ever lost */
  more();
  return {destroy:function(){dead=true;clearTimeout(timer);clearInterval(wd);io.disconnect();cio.disconnect();
    window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);
    document.removeEventListener("visibilitychange",onVis);window.removeEventListener("pageshow",onVis)},
    count:function(){return seen.size}};
}

/* ---------- views ---------- */
function setTitle(t){document.title=t?BASE+" - "+t:BASE+" - Archive of Sacred Names and Ancient Prohibitions"}
function chips(active){
  var w=el("div","chips");w.setAttribute("role","navigation");w.setAttribute("aria-label","Categories");
  var h='<a class="chip'+(!active?" on":"")+'" href="#/">All</a>';
  D.cats.forEach(function(c){h+='<a class="chip'+(active===c.i?" on":"")+'" href="#/c/'+c.i+'">'+esc(c.n)+"</a>"});
  w.innerHTML=h;return w;
}
function home(){
  setTitle("");var y=E.profile("1");
  var hero=el("section","hero");
  hero.innerHTML='<span class="big he" lang="he" dir="rtl">'+esc(y.h)+'</span><h1>YHWH</h1><p>'+esc(y.desc)+
    '</p><p>The first profile of an archive of Jewish religious prohibitions, sacred names, restrictions and historical controversies. Law, custom, dispute and scholarly question are labelled separately on every profile.</p><a class="btn" href="#/p/1">Open the YHWH profile</a>';
  app.replaceChildren(hero,chips(0),el("div","kicker","The archive continues without end"));
  var root=el("div","feed");app.appendChild(root);feed=startFeed(root,1,0);
}
function catPage(n){
  var c=D.cats[(+n||0)-1];if(!c)return home();
  setTitle(c.n);
  app.replaceChildren(chips(c.i),el("div","kicker","Category "+c.i),el("h1","", ""));
  var h=app.lastChild;h.className="pg";h.style.maxWidth="none";h.innerHTML="<h1 style='margin:0'>"+esc(c.n)+"</h1><p>Subcategories: "+
    c.subs.map(function(s){return '<a href="#/q/'+encodeURIComponent(s)+'">'+esc(s)+"</a>"}).join(" · ")+"</p>";
  var root=el("div","feed");app.appendChild(root);feed=startFeed(root,0,c.i);
}
function sec(h,t){return "<h2>"+esc(h)+"</h2>"+String(t).split("\n\n").map(function(x){return "<p>"+esc(x)+"</p>"}).join("")}
function profilePage(id){
  var p=E.profile(id);if(!p){app.replaceChildren(el("div","pg","<h1>Not a valid identifier</h1><p>Identifiers are positive whole numbers of any length. <a href='#/'>Return to the archive</a>.</p>"));return}
  setTitle(p.name);
  var pg=el("article","pg a"+(p.cat%5));
  var h='<div class="crumb"><a href="#/">Archive</a> / <a href="#/c/'+p.cat+'">'+esc(p.catName)+"</a></div>"+
    (p.h?'<div class="hebrew he" lang="he" dir="rtl">'+esc(p.h)+"</div>":"")+"<h1>"+esc(p.name)+'</h1><p><span class="badge">'+esc(p.statusLabel)+"</span></p>"+
    '<div class="art" style="height:90px;border-radius:6px;overflow:hidden;background:#120a18">'+art(id)+"</div>"+
    '<p style="font-size:1.1rem">'+esc(p.desc)+"</p>"+
    '<div class="meta"><div><b>Profile ID</b>'+esc(p.id)+"</div><div><b>Category</b>"+esc(p.catName)+"</div><div><b>Subcategory</b>"+esc(p.sub)+"</div>"+
    (p.period?"<div><b>Historical period</b>"+esc(p.period)+"</div>":"")+
    (p.h?"<div><b>Original terminology</b>"+heb(p.h)+"</div>":"")+
    (p.alt.length?"<div><b>Alternative spellings</b>"+esc(p.alt.join("; "))+"</div>":"")+
    (p.baseStatusLabel?"<div><b>Curated subject status</b>"+esc(p.baseStatusLabel)+"</div>":"")+"</div>";
  if(p.kind==="generated")h+='<div class="note">Exploratory research angle. This profile is generated from the curated subject <a href="#/p/'+p.base+'">'+esc(E.profile(p.base).name)+"</a>. It is not a documented religious prohibition.</div>";
  p.sections.forEach(function(s){h+=sec(s[0],s[1])});
  h+="<h2>Primary and scholarly sources</h2><ul class='src'>"+p.sources.map(function(s){return "<li>"+esc(s)+"</li>"}).join("")+"</ul>"+
     "<h2>Related profiles</h2><div class='rel'></div><h2>Tags</h2><div class='tags'>"+
     p.tags.filter(Boolean).map(function(t){return '<a href="#/q/'+encodeURIComponent(t)+'">'+esc(t)+"</a>"}).join("")+"</div>";
  var big=BigInt(p.id),prev=big>1n?(big-1n).toString():null;
  h+='<div class="pn">'+(prev?'<a href="#/p/'+prev+'">&larr; No. '+esc(prev)+"</a>":"<span></span>")+'<a href="#/p/'+(big+1n).toString()+'">No. '+esc((big+1n).toString())+" &rarr;</a></div>";
  pg.innerHTML=h;
  var rel=pg.querySelector(".rel");rel.className="chunk";p.related.forEach(function(r){rel.appendChild(card(r))});
  app.replaceChildren(pg);
}
function searchPage(q){
  var r=E.search(q);setTitle("Search");
  var w=el("div","");
  if(r.type==="empty"){return home()}
  var head=el("div","kicker",r.type==="id"?"Identifier "+esc(r.id):esc(r.ids.length+(r.ids.length>=60?"+":""))+" results for \""+esc(q)+'"');
  w.appendChild(head);
  if(!r.ids.length){w.appendChild(el("p","","No profile matches. Try a Hebrew term, a transliteration variant, a category, or an exact identifier."))}
  if(r.type==="id"){var p=E.profile(r.id);w.appendChild(el("p","","This identifier resolves to a deterministic profile ("+esc(p.statusLabel)+"). "+(p.kind==="generated"?"It is an exploratory research angle, not a documented prohibition.":"It is a curated profile.")))}
  var g=el("div","chunk");r.ids.forEach(function(i){g.appendChild(card(i))});w.appendChild(g);
  app.replaceChildren(w);
}
function catsPage(){
  setTitle("Categories");var w=el("div","pg");
  var h="<h1>Taxonomy</h1>";
  D.cats.forEach(function(c){h+='<div class="catblk"><h3><a href="#/c/'+c.i+'">'+c.i+". "+esc(c.n)+"</a></h3>"+c.subs.map(function(s){return '<a class="chip" href="#/q/'+encodeURIComponent(s)+'">'+esc(s)+"</a>"}).join(" ")+"</div>"});
  w.innerHTML=h;app.replaceChildren(w);
}
function aboutPage(){
  setTitle("Method");var w=el("div","pg");
  var leg="";Object.keys(D.status).forEach(function(k){leg+="<div><span class='badge'>"+esc(D.status[k])+"</span></div>"});
  w.innerHTML="<h1>Method and status labels</h1><p>"+D.subjects.length+" curated subjects carry the factual content: a description, explanation, historical development and a list of sources. Every other profile is generated in the browser from a curated subject, a research angle (for example Rabbinic Debate, Community Differences or Academic Perspectives), a historical period and a series number. The same identifier always produces the same profile. Identifiers are kept as decimal strings and processed with BigInt, so every digit of an identifier of any length is preserved.</p><p>Generated profiles are exploratory research angles. They restate the curated record and pose a question; they do not add rulings, quotations or citations. Unlimited generation is not unlimited verified information.</p><h2>Status labels</h2><div class='legend'>"+leg+"</div><p>Source citations point to standard locations in the Hebrew Bible, Mishnah, Talmud, codes and scholarship; check them against editions before relying on them. Practices differ among communities, and no profile should be read as a universal ruling.</p>";
  app.replaceChildren(w);
}

function route(){
  if(feed){feed.destroy();feed=null}
  var r=location.hash.replace(/^#/,"")||"/",m=r.split("/");
  try{
    if(r==="/")home();
    else if(m[1]==="p")profilePage(decodeURIComponent(m[2]||""));
    else if(m[1]==="c")catPage(m[2]);
    else if(m[1]==="q")searchPage(decodeURIComponent(m.slice(2).join("/")));
    else if(m[1]==="cats")catsPage();
    else if(m[1]==="about")aboutPage();
    else home();
  }catch(e){app.replaceChildren(el("div","pg","<h1>Something went wrong</h1><p><a href='#/'>Return to the archive</a></p>"));console.error(e)}
  if(m[1]!=="q"&&document.activeElement!==qi)qi.value="";
  window.scrollTo(0,0);
}

/* ---------- search UI ---------- */
function openS(o){srch.classList.toggle("open",o);sb.setAttribute("aria-expanded",o);if(o)qi.focus();}
sb.addEventListener("click",function(){if(srch.classList.contains("open")&&!qi.value)openS(false);else openS(true)});
var dt=null;
qi.addEventListener("input",function(){
  clearTimeout(dt);dt=setTimeout(function(){
    var v=qi.value.trim();
    history.replaceState(null,"",v?"#/q/"+encodeURIComponent(v):"#/");route();
  },160);
});
qi.addEventListener("keydown",function(e){
  if(e.key==="Enter"){var n=E.parseId(qi.value);if(n!==null){location.hash="#/p/"+n.toString()}}
  if(e.key==="Escape"){qi.value="";openS(false);if(/^#\/q\//.test(location.hash)){history.replaceState(null,"","#/");route()}}
});
window.addEventListener("hashchange",route);
route();
})();
