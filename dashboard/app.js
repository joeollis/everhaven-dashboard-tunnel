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
const researchStatus=document.querySelector('#research-status');
async function protectedText(path){const response=await fetch(path+'?check='+Date.now(),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Research access unavailable. Create a fresh qURL if the session ended.');return await response.text();}
async function readResearch(){
 researchStatus.textContent='Loading research through the protected connection…';
 try{const data=JSON.parse(await protectedText('research.json'));if(data.dataset_id!=='northline-q2-2026-demo'||data.fictional!==true)throw new Error('Unexpected research response.');const view=document.querySelector('#research-json');view.textContent=JSON.stringify(data,null,2);view.hidden=false;researchStatus.textContent='Fresh research loaded. This dataset is fictional; downloaded data remains visible after expiry.';return data;}
 catch(error){researchStatus.textContent='Research could not be loaded. Access may have expired; create a new qURL and try again.';throw error;}
}
document.querySelector('#read-research').addEventListener('click',()=>{void readResearch().catch(()=>{});});
async function downloadResearch(path,expected,type,filename,button){
 button.disabled=true;researchStatus.textContent='Preparing your protected download…';
 try{const text=await protectedText(path);if(!text.startsWith(expected))throw new Error('Unexpected document response.');const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);researchStatus.textContent='Download prepared from the protected application. All figures are fictional.';}
 catch{researchStatus.textContent='Download unavailable. Access may have expired; create a new qURL and try again.';}
 finally{button.disabled=false;}
}
document.querySelector('#download-csv').addEventListener('click',event=>{void downloadResearch('research.csv','Business,','text/csv;charset=utf-8','northline-fictional-research.csv',event.currentTarget);});
document.querySelector('#download-brief').addEventListener('click',event=>{void downloadResearch('brief.md','# Northline Manufacturing','text/markdown;charset=utf-8','northline-fictional-brief.md',event.currentTarget);});
const context=document.modelContext||navigator.modelContext;
if(context?.registerTool){const lifecycle=new AbortController();const validate=input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Use an empty object.');};for(const tool of [
 {name:'check_protected_access',description:'Make a fresh health request to the protected application and update the visible connection result. Failure alone does not establish expiry.',execute:async input=>{validate(input);return await checkAccess();}},
 {name:'read_research_data',description:'Fetch fictional Northline research as JSON through the admitted route. Requires current access; never treats cached page content as a fresh response.',execute:async input=>{validate(input);return await readResearch();}}
])try{Promise.resolve(context.registerTool({...tool,inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},{signal:lifecycle.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
