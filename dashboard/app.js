'use strict';
const check=document.querySelector('#verify-session');let checking=false;
async function checkAccess(){
 if(checking)throw new Error('A connection check is already in progress.');
 checking=true;check.disabled=true;const result=document.querySelector('#session-result');result.textContent='Checking the protected route…';let confirmed=false;
 try{const response=await fetch('healthz?check='+Date.now(),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});const text=await response.text();confirmed=response.ok&&text.trim()==='everhaven-private-origin';result.textContent=confirmed?'Access confirmed: the protected origin answered this fresh request.':'Access not confirmed: the request did not return the protected origin’s expected response.';}
 catch{result.textContent='No connection: this fresh request failed. Access may have ended, or the connection is unavailable.';}
 finally{checking=false;check.disabled=false;}
 return {confirmed,checked_at:new Date().toISOString(),message:result.textContent};
}
check.addEventListener('click',()=>{void checkAccess().catch(()=>{});});
const loadedAt=Date.now();function elapsed(){const seconds=Math.floor((Date.now()-loadedAt)/1000);document.querySelector('#visit-elapsed').textContent=`Time since page load: ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}${seconds>=120?' — check access again now':''}`;}elapsed();setInterval(elapsed,1000);
const context=document.modelContext||navigator.modelContext;
if(context?.registerTool){const lifecycle=new AbortController();const validate=input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Use an empty object.');};for(const tool of [
 {name:'check_protected_access',description:'Make a fresh health request to the protected application and update the visible connection result. Failure alone does not establish expiry.',execute:async input=>{validate(input);return await checkAccess();}},
 {name:'read_research_data',description:'Fetch fictional Northline research as JSON through the admitted route. Requires current access; never treats cached page content as a fresh response.',execute:async input=>{validate(input);const response=await fetch('research.json?check='+Date.now(),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Research access unavailable.');const data=await response.json();if(data.dataset_id!=='northline-q2-2026-demo')throw new Error('Unexpected research response.');return data;}}
])try{Promise.resolve(context.registerTool({...tool,inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},{signal:lifecycle.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
