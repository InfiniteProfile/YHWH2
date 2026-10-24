/* YHWH archive - deterministic profile engine. No DOM. Identifiers are decimal strings / BigInt, never Number. */
(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory(require("./data.js"));
  else root.Engine=factory(root.YHWH_DATA);
})(typeof self!=="undefined"?self:this,function(D){
"use strict";
var S=D.subjects.length,L=D.lenses.length,PN=3,B=S*L*PN;
var bS=BigInt(S),bL=BigInt(L),bB=BigInt(B),bK=BigInt(S);
var keyIdx={};D.subjects.forEach(function(s,i){keyIdx[s.k]=i});
function gcd(a,b){return b?gcd(b,a%b):a}
function cop(n){var a=Math.max(1,Math.round(n*0.618));while(gcd(a,n)!==1)a++;return a}
var AK=cop(S),AB=cop(B);

function norm(q){return String(q).normalize("NFD").replace(/[\u0300-\u036f\u0591-\u05c7]/g,"").toLowerCase().replace(/[^a-z0-9\u05d0-\u05ea]+/g," ").trim()}
/* Positive decimal string of any length -> BigInt, else null. Leading zeros are normalised; no digit is otherwise altered. */
function parseId(s){s=String(s).trim().replace(/^#/,"");if(!/^\d+$/.test(s))return null;var b=BigInt(s);return b<1n?null:b}

/* id layout: 1..S curated; above that m=id-S-1 = subj + S*(lens + L*(p + 3*q)) (bijective for all q>=0) */
function dec(b){
  if(b<=bK)return {kind:"c",i:Number(b)-1};
  var m=b-bK-1n,subj=Number(m%bS);m=m/bS;var lens=Number(m%bL);m=m/bL;
  return {kind:"g",subj:subj,lens:lens,p:Number(m%3n),q:m/3n};
}
function enc(subj,lens,p,q){return (bK+1n+BigInt(subj)+bS*(BigInt(lens)+bL*(BigInt(p)+3n*q))).toString()}

var cache=new Map();
function profile(idStr){
  var b=parseId(idStr);if(b===null)return null;
  var id=b.toString();
  if(cache.has(id))return cache.get(id);
  var d=dec(b),p;
  if(d.kind==="c"){
    var s=D.subjects[d.i],cat=D.cats[s.c-1];
    var rel=s.rel.map(function(r){return String(keyIdx[r]+1)});
    [0,3,5].forEach(function(l){rel.push(enc(d.i,l,0,0n))});
    p={id:id,kind:"curated",name:s.n,cat:s.c,catName:cat.n,sub:s.s,status:s.t,statusLabel:D.status[s.t],
       h:s.h,alt:s.a,desc:s.d,period:null,
       sections:[["Religious context and explanation",s.x],["Historical development",s.v]],
       sources:s.src,related:rel,tags:[cat.n,s.s].concat(s.a),subj:d.i};
  }else{
    var s2=D.subjects[d.subj],lens=D.lenses[d.lens],pr=D.periods[lens.p[d.p]],cat2=D.cats[s2.c-1];
    var pshort=pr.n.split(" (")[0];
    var name=lens.t.replace("{s}",s2.n)+" ("+pshort+")"+(d.q>0n?" - Folio "+(d.q+1n).toString():"");
    var rel2=[String(d.subj+1),enc(d.subj,d.lens,(d.p+1)%3,d.q),enc(d.subj,(d.lens+1)%L,d.p,d.q),enc(d.subj,(d.lens+5)%L,d.p,d.q)];
    s2.rel.slice(0,4).forEach(function(r){rel2.push(enc(keyIdx[r],d.lens,d.p,d.q))});
    var base=s2.x.split("\n\n")[0];
    p={id:id,kind:"generated",name:name,cat:s2.c,catName:cat2.n,sub:s2.s,status:"exp",statusLabel:D.status.exp,
       baseStatus:s2.t,baseStatusLabel:D.status[s2.t],h:s2.h,alt:s2.a,
       desc:lens.c.replace("{s}",s2.n),period:pr.n,
       sections:[["Research angle",lens.b.replace(/\{s\}/g,s2.n)],
                 ["Focus period",pr.n+": "+pr.r],
                 ["What the curated record on "+s2.n+" establishes",s2.d+" "+base],
                 ["Open research question",lens.q],
                 ["Status of this profile","This profile is an exploratory research angle generated deterministically from the curated subject \""+s2.n+"\" (status of that subject: "+D.status[s2.t]+"). The angle and question are prompts for study, not a documented prohibition or ruling. Only the curated record above and its sources carry factual claims."+(d.q>0n?" Folio "+(d.q+1n).toString()+" repeats this angle as a further series entry; it adds no new facts.":"")]],
       sources:s2.src,related:rel2,tags:[cat2.name||cat2.n,s2.s,pshort,lens.t.split(" {s}")[0]].concat(s2.a),subj:d.subj,base:String(d.subj+1)};
  }
  p.related=p.related.filter(function(x,i,a){return x!==id&&a.indexOf(x)===i}).slice(0,10);
  if(cache.size>600)cache.clear();
  cache.set(id,p);return p;
}
function catOfId(idStr){var d=dec(BigInt(idStr));return D.subjects[d.kind==="c"?d.i:d.subj].c}

/* Feed: position t (Number) -> id. Curated block first (permuted so categories interleave), then endless generated blocks, each block permuted. */
function posToId(t){
  if(t<S)return String(1+(t*AK)%S);
  var j=t-S,blk=BigInt(Math.floor(j/B)),r=j%B;
  return (bK+1n+blk*bB+BigInt((r*AB)%B)).toString();
}
function feedNext(pos,count,catNo){
  var ids=[],t=pos;
  while(ids.length<count){var id=posToId(t++);if(!catNo||catOfId(id)===catNo)ids.push(id)}
  return {ids:ids,next:t};
}

/* Search over the whole universe, independent of what is loaded. */
var H=null;
function hay(){
  if(H)return H;
  H={c:D.subjects.map(function(s){return {n:norm(s.n),a:norm([s.n,s.s,D.cats[s.c-1].n,s.h,s.a.join(" "),s.d,s.x].join(" "))}}),
     g:D.subjects.map(function(s){return norm([s.n,s.s,D.cats[s.c-1].n,s.h,s.a.join(" ")].join(" "))}),
     l:D.lenses.map(function(l){return norm(l.t.replace("{s}",""))}),
     p:D.periods.map(function(p){return norm(p.n)})};
  return H;
}
function search(q,cap){
  cap=cap||60;
  var num=parseId(String(q));
  if(num!==null)return {type:"id",id:num.toString(),ids:[num.toString()]};
  var n=norm(q);if(!n)return {type:"empty",ids:[]};
  var tk=n.split(" "),h=hay(),cur=[],gen=[];
  D.subjects.forEach(function(s,i){
    if(tk.every(function(t){return h.c[i].a.indexOf(t)>=0})){
      var sc=0;tk.forEach(function(t){sc+=(h.c[i].n.indexOf(t)>=0?3:0)+1});cur.push([sc,i+1]);
    }
  });
  cur.sort(function(a,b){return b[0]-a[0]||a[1]-b[1]});
  var out=cur.map(function(x){return String(x[1])});
  for(var s=0;s<S&&out.length<cap;s++){
    for(var l=0;l<L&&out.length<cap;l++){
      for(var p=0;p<PN&&out.length<cap;p++){
        var str=h.g[s]+" "+h.l[l]+" "+h.p[D.lenses[l].p[p]];
        if(tk.every(function(t){return str.indexOf(t)>=0}))gen.push(enc(s,l,p,0n));
      }
    }
  }
  out=out.concat(gen).slice(0,cap);
  return {type:"text",ids:out};
}
return {S:S,L:L,parseId:parseId,dec:dec,enc:enc,profile:profile,posToId:posToId,feedNext:feedNext,search:search,norm:norm,catOfId:catOfId};
});
