/* Engine tests. Run: node test.js  (covers the engine only; DOM/observer behaviour needs a browser) */
const E=require("./engine.js"),D=require("./data.js");
let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log("FAIL:",m)}else console.log("ok  :",m)};
// feed
let pos=0,seen=new Set(),dup=0,first=null,batches=0;
for(let b=0;b<2000;b++){const r=E.feedNext(pos,12);pos=r.next;batches++;r.ids.forEach(i=>{if(first===null)first=i;if(seen.has(i))dup++;seen.add(i)})}
ok(first==="1"&&E.profile(first).name==="YHWH","first feed item is YHWH");
ok(dup===0&&batches===2000&&seen.size===24000,"2000 consecutive batches, 24000 unique ids, no duplicates");
// bijection of order mapping across curated block + 3 generated blocks
const S=E.S,B=S*E.L*3,u=new Set();for(let t=0;t<S+3*B;t++)u.add(E.posToId(t));
ok(u.size===S+3*B,"feed order is injective over curated block + 3 generated blocks");
const exp=new Set();for(let i=1;i<=S+3*B;i++)exp.add(String(i));
ok([...u].every(x=>exp.has(x)),"feed order covers exactly ids 1.."+(S+3*B));
// encode/decode round trip incl. huge q
let rt=true;for(const q of [0n,1n,12345678901234567890123n,10n**400n]){for(let s=0;s<S;s+=7)for(let l=0;l<E.L;l++)for(let p=0;p<3;p++){const id=E.enc(s,l,p,q),d=E.dec(BigInt(id));if(d.subj!==s||d.lens!==l||d.p!==p||d.q!==q)rt=false}}
ok(rt,"encode/decode round-trips (q up to 10^400)");
// ids / long ids
const L1="123456789012345678901234567890";
ok(E.profile(L1).id===L1,"30-digit id preserved exactly");
const big="9".repeat(5000);ok(E.profile(big).id===big&&E.profile(big).name.length>0,"5000-digit id resolves, all digits kept");
ok(E.search(L1).ids[0]===L1&&E.search("000012").ids[0]==="12","search resolves exact ids directly (leading zeros normalised)");
ok(E.profile("0")===null&&E.profile("-4")===null&&E.profile("1.5")===null,"non-positive / non-integer ids rejected");
ok(E.profile(L1)===E.profile(L1)||JSON.stringify(E.profile(L1))===JSON.stringify(E.profile(L1)),"same id -> same profile (deterministic)");
// names unique
const names=new Map();let dn=0;for(let i=1;i<=30000;i++){const n=E.profile(String(i)).name.toLowerCase();if(names.has(n))dn++;names.set(n,i)}
ok(dn===0,"first 30000 profile names are unique ("+dn+" collisions)");
// content
let bad=0;for(let i=1;i<=3000;i++){const p=E.profile(String(i));if(!p.desc||!p.sections.every(s=>s[1]&&s[1].length>20)||!p.sources.length||!p.related.length||p.related.some(r=>!E.parseId(r)||r===p.id))bad++}
ok(bad===0,"profiles have description, sections, sources and valid related ids");
let gen=E.profile(String(E.S+5));ok(gen.kind==="generated"&&gen.status==="exp"&&/not a documented prohibition/.test(gen.sections.slice(-1)[0][1]),"generated profiles are labelled exploratory");
// category feed
const c=E.feedNext(0,40,3);ok(c.ids.every(i=>E.catOfId(i)===3),"category feed returns only category 3");
// search
const t=(q,f)=>ok(E.search(q).ids.length>0&&f(E.search(q).ids),"search: "+q);
t("sciatic",ids=>ids.some(i=>E.profile(i).name.includes("Sciatic")));
t("גיד הנשה",ids=>E.profile(ids[0]).name.includes("Sciatic"));
t("kitniyos",ids=>E.profile(ids[0]).name.includes("Kitniyot"));
t("chometz",ids=>E.profile(ids[0]).name.includes("Chametz"));
t("Tetragrammaton",ids=>ids[0]==="1");
t("yom kippur",ids=>E.profile(ids[0]).name.includes("Yom Kippur"));
t("talmudic period",ids=>E.profile(ids[0]).kind==="generated");
t("Dura-Europos",ids=>E.profile(ids[0]).name.includes("Images"));
// search after "extensive scrolling" is independent of feed state
ok(E.search("shaatnez").ids.length>0,"search works after 2000 feed batches (stateless)");
console.log(fail?("\n"+fail+" FAILED"):"\nALL PASSED");process.exit(fail?1:0);
