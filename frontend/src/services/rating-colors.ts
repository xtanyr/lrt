import { useEffect, useState } from 'react';
import { api } from './api';
export function useRatingColors() {
 const [thresholds,setThresholds]=useState({green:80,red:60});
 useEffect(()=>{let active=true;api.get('/admin/rating-color-config').then(r=>{const c=r.data.data||r.data;if(active&&c)setThresholds({green:Number(c.greenThreshold),red:Number(c.redThreshold)});}).catch(()=>{});return()=>{active=false;};},[]);
 return (score:number|null|undefined) => score==null?'var(--ink-2)':score>=thresholds.green?'var(--success)':score<=thresholds.red?'var(--danger)':'var(--warning)';
}
