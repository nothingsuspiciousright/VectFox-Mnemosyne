import {read,write} from './storage.mjs';
export const info={id:'sola-vectfox-config',name:'Sola VectFox Configuration Guard',description:'Per-user independent configuration storage'};
export async function init(router){
  function root(req,res){const p=req.user?.directories?.root;if(typeof p!=='string'||!p){res.status(403).json({error:'User directory unavailable'});return null;}res.set('Cache-Control','no-store');return p;}
  router.get('/config',(req,res)=>{const p=root(req,res);if(!p)return;try{return res.json({saved:read(p)});}catch{return res.status(500).json({error:'Protected configuration unreadable'});}});
  router.post('/config',(req,res)=>{const p=root(req,res);if(!p)return;try{if(!Object.hasOwn(req.body||{},'revision'))return res.status(400).json({error:'Revision required'});const saved=write(p,req.body?.settings,req.body.revision);if(!saved)return res.status(422).json({error:'Incomplete configuration; previous copy retained'});return res.json({savedAt:saved.savedAt,revision:saved.revision});}catch(e){return res.status(e.code==='CONFLICT'?409:500).json({error:e.code==='CONFLICT'?'Configuration changed; reload before saving':'Protected configuration save failed'});}});
  console.log('[Sola VF Guard] Ready');
}
