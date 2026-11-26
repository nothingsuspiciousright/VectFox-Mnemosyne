import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {sanitize,validate} from './policy.mjs';
export {sanitize,validate} from './policy.mjs';
export const configPath=root=>path.join(root,'sola-vectfox-config.json');
function parse(p){const data=JSON.parse(fs.readFileSync(p,'utf8'));const v=sanitize(data.settings);if(data.version!==1||!validate(v))throw new Error('Invalid protected config');return {version:1,savedAt:data.savedAt,revision:data.revision||crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex'),settings:v};}
export function read(root){
  const p=configPath(root),prev=p+'.previous';
  if(!fs.existsSync(p)&&!fs.existsSync(prev))return null;
  try{return parse(p);}catch{try{return {...parse(prev),recoveredFromPrevious:true};}catch{throw new Error('Both configuration copies unavailable');}}
}
function atomic(p,data){const tmp=p+'.'+crypto.randomUUID()+'.tmp';let fd;try{fd=fs.openSync(tmp,'wx',0o600);fs.writeFileSync(fd,JSON.stringify(data,null,2));fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(tmp,p);}finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
export function write(root,value,expectedRevision){
  const v=sanitize(value),old=read(root);
  if(expectedRevision!==(old?.revision??null)){const e=new Error('Configuration revision changed');e.code='CONFLICT';throw e;}
  if(!validate(v,old?.settings))return null;
  if(old&&!old.recoveredFromPrevious&&JSON.stringify(old.settings)===JSON.stringify(v))return old;
  const p=configPath(root);const data={version:1,savedAt:new Date().toISOString(),revision:crypto.randomUUID(),settings:v};
  if(old&&!old.recoveredFromPrevious){const {recoveredFromPrevious,...record}=old;atomic(p+'.previous',record);}
  atomic(p,data);
  return data;
}
