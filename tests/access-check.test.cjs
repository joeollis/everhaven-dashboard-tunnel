const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const nodes=new Map(),calls=[],timers=[];let mode='healthy';
 const element=()=>({children:[],hidden:true,textContent:'',append(...v){this.children.push(...v)},replaceChildren(...v){this.children=v},addEventListener(){}});
 const context=vm.createContext({document:{querySelector(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)},createElement:element},navigator:{},Date,AbortSignal,AbortController,setInterval(){},setTimeout(fn,ms){timers.push({fn,ms})},fetch:async(url,options)=>{calls.push({url,options});if(mode==='network')throw Error('network');return {ok:true,status:200,text:async()=>mode==='healthy'?'everhaven-private-origin':'a public fallback page'}}});
 vm.runInContext(fs.readFileSync('dashboard/app.js','utf8'),context);
 return {nodes,calls,timers,mode(v){mode=v},check:()=>vm.runInContext('checkAccess()',context)};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('arrival and scheduled checks make fresh requests; failure is not labeled proven expiry',async()=>{const t=setup();await settle();assert.equal(t.calls.length,1);assert.equal(t.nodes.get('#access-checks').children.length,1);assert.match(t.nodes.get('#session-result').textContent,/Access confirmed/);assert.equal(t.calls[0].options.cache,'no-store');assert.equal(t.calls[0].options.redirect,'error');t.mode('network');const scheduled=t.timers.find(x=>x.ms===130000);assert.ok(scheduled);scheduled.fn();await settle();assert.equal(t.calls.length,2);assert.equal(t.nodes.get('#access-checks').children.length,2);assert.match(t.nodes.get('#session-result').textContent,/may have ended/);assert.doesNotMatch(t.nodes.get('#session-result').textContent,/Access expired|Access denied/)});
test('a successful HTTP fallback is not accepted as a protected-origin response',async()=>{const t=setup();await settle();t.mode('fallback');const r=await t.check();assert.equal(r.confirmed,false);assert.equal(r.outcome,'unexpected_response');assert.equal(r.http_status,200);assert.ok(!Number.isNaN(Date.parse(r.checked_at)))});
