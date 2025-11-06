import express from 'express';
import { query } from '../db.js';

export const projectsRouter = express.Router();

function defaultData(){
  return {
    meta:{ projektName:'', aktenzeichen:'', gutachter:'', qualifikation:'Geprüfter Sachverständiger (DGuSV); Bauschadenbewertung (DGuSV); VDI; Baufinanzierungsberater (IHK)', stichtag:'', besichtigung:'', erstelltAm:new Date().toISOString().slice(0,10), datenschutzModus:true },
    objekt:{ adresse:'', lageKurz:'', baujahr:'', modernisierungen:'', beschreibung:'' },
    flaechen:{ wfl:'', zimmer:'', geschoss:'', balkonTerrasse:false, stellplatz:false, bgf:'', flaechenQuelle:'Unterlagen / WoFlV plausibilisiert' },
    weg:{ mea:'', ruecklage:'', hausgeld:'', massnahmen:'', massnahmenKosten:'' },
    recht:{ grundbuch:'', rechteLasten:'keine', teilungserklaerung:'vorhanden', baulasten:'keine Hinweise', altlasten:'keine Hinweise', snr:'' },
    markt:{ bodenrichtwert:'', borisQuelle:'', borisStichtag:'', liegenschaftszins:'', gaQuelle:'', vergleichsfalleQuelle:'', istMiete:'', nachhaltigMiete:'', bwkQuote:'25', faktorMin:'18', faktorMax:'25', trend:'0' },
    verfahren:{ primar:'Vergleichswert', sekundaer:'Ertragswert (Plausibilisierung)', sachwert:false, begruendung:'ETW: Vergleichswert; bei Vermietung Ertragswert-Plausibilisierung.' },
    werte:{ vergleichswert:'', ertragswert:'', sachwert:'', spannweite:'± 5%', endwert:'', rundung:1000 },
    anlagen:{ ids:[] }
  };
}

projectsRouter.get('/', async (req,res)=>{
  const { uid } = req.auth;
  const r = await query(`select id, type, title, created_at, updated_at from projects where user_id=$1 order by updated_at desc`, [uid]);
  res.json(r.rows);
});

projectsRouter.post('/', async (req,res)=>{
  const { uid } = req.auth;
  const { type='kurz', title } = req.body || {};
  const t = title || (type==='verkehr' ? 'Verkehrswert' : 'Kurzbewertung');
  const r = await query(`insert into projects (user_id, type, title, data) values ($1,$2,$3,$4) returning *`, [uid, type, t, defaultData()]);
  res.json(r.rows[0]);
});

projectsRouter.get('/:id', async (req,res)=>{
  const { uid } = req.auth; const { id } = req.params;
  const r = await query(`select * from projects where id=$1 and user_id=$2`, [id, uid]);
  const row = r.rows[0];
  if(!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

projectsRouter.put('/:id', async (req,res)=>{
  const { uid } = req.auth; const { id } = req.params;
  const { title, data } = req.body || {};
  const r = await query(`update projects set title=coalesce($1,title), data=coalesce($2,data), updated_at=now() where id=$3 and user_id=$4 returning *`, [title, data, id, uid]);
  const row = r.rows[0];
  if(!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

projectsRouter.delete('/:id', async (req,res)=>{
  const { uid } = req.auth; const { id } = req.params;
  const r = await query(`delete from projects where id=$1 and user_id=$2 returning id`, [id, uid]);
  if(!r.rowCount) return res.status(404).json({ error: 'not found' });
  res.json({ ok:true });
});
