import {getRequestHeaders,saveSettingsDebounced as nativeSave} from '../../../../../script.js';
import {extension_settings} from '../../../../extensions.js';
const endpoint='/api/plugins/sola-vectfox-config/config';
import {sanitize,validate} from './sola-config-policy.mjs';
function snapshot(v){return JSON.stringify(sanitize(v||{}));}
function full(v){return validate(sanitize(v||{}));}
let repairNeeded=false, connected=false,ready=false,revision=null,last='',pending=null,running=false,timer,restored=false,status='Not initialized';
function show(text){status=text;const el=document.getElementById('sola-vf-guard-status');if(el)el.textContent=text;}
export async function restoreProtectedConfig(){
  try{const r=await fetch(endpoint,{headers:getRequestHeaders(),cache:'no-store',signal:AbortSignal.timeout(6000)});if(!r.ok)throw new Error('Guard unavailable');const {saved}=await r.json();
    if(saved){if(!full(saved.settings)||!saved.revision)throw new Error('Invalid protected configuration');const current=extension_settings.vectfox||{};last=snapshot(saved.settings);if(Object.entries(saved.settings).some(([k,v])=>JSON.stringify(current[k])!==JSON.stringify(v))){Object.assign(current,JSON.parse(last));extension_settings.vectfox=current;restored=true;}revision=saved.revision;repairNeeded=!!saved.recoveredFromPrevious;show(saved.recoveredFromPrevious?'Recovered previous protected copy':restored?'Recovered from protected file':'Protected configuration loaded');}
    else show('Waiting for first complete configuration');connected=true;
  }catch{connected=false;show('Guard unavailable — native settings retained; reload to reconnect');}
}
function queue(value=extension_settings.vectfox,immediate=false){
  if(!ready||!connected)return;
  if(!full(value)){pending=null;clearTimeout(timer);show('Incomplete settings — previous copy kept');return;}
  const json=snapshot(value);if(json===last&&!running&&!repairNeeded){pending=null;clearTimeout(timer);return;}
  pending=json;show('Saving protected settings…');clearTimeout(timer);if(immediate)void flush();else timer=setTimeout(()=>void flush(),350);
}
async function flush(){
  if(running||!pending||!connected)return;
  const json=pending;pending=null;if(json===last&&!repairNeeded)return;running=true;let failed=false;
  try{const r=await fetch(endpoint,{method:'POST',headers:{...getRequestHeaders(),'Content-Type':'application/json'},body:JSON.stringify({revision,settings:JSON.parse(json)}),signal:AbortSignal.timeout(8000)});
    if(!r.ok){if(r.status===409){connected=false;show('Protected settings changed elsewhere — reload before saving');}else if(r.status===422){show('Incomplete edit — previous copy kept');}else{failed=true;show('Save failed — previous copy kept; use Save protected settings to retry');}return;}
    const result=await r.json();if(!result.revision)throw new Error('Missing revision');revision=result.revision;last=json;repairNeeded=false;show('Protected settings saved');
  }catch{failed=true;show('Save failed — previous copy kept; use Save protected settings to retry');}
  finally{running=false;if(failed&&!pending)pending=json;if(pending&&!failed&&connected)void flush();}
}
export function saveGuardedSettings(){nativeSave();queue();}
export function activateConfigGuard(settings){
  if(ready)return;ready=true;
  const panel=document.querySelector('#VectFox_settings');
  if(panel){const box=document.createElement('div');box.style.padding='6px 0';const label=document.createElement('small');label.id='sola-vf-guard-status';label.textContent=status;label.style.display='block';const button=document.createElement('button');button.type='button';button.className='menu_button';button.textContent='Save protected settings';button.addEventListener('click',()=>queue(extension_settings.vectfox||settings,true));box.append(label,button);panel.prepend(box);}
  // Only seed on first use; never replace an existing protected configuration merely because UI initialized.
  if(connected&&!revision){const raw=extension_settings.vectfox||{}; if(raw.chat_model)queue({...settings,...raw},true);}
  if(connected&&repairNeeded)queue(extension_settings.vectfox||settings,true);
  if(restored)nativeSave();
}
