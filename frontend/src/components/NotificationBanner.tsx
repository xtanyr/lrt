import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
export default function NotificationBanner() {
 const [items,setItems]=useState<{id:number;message:string;isRead:boolean;ipvStatusId?:number}[]>([]);
 useEffect(()=>{
  let alive=true;
  const refresh=()=>api.get('/notifications').then(r=>{if(alive)setItems(r.data.data||r.data||[]);}).catch(()=>{});
  void refresh();const interval=window.setInterval(refresh,60000);
  return()=>{alive=false;window.clearInterval(interval);};
 },[]);
 const active=items.filter(i=>!i.isRead&&i.ipvStatusId);
 if(!active.length)return null;
 return <div className="card" role="status">{active.map(i=><p key={i.id}>🔔 {i.message}</p>)}<Link to="/triggers">Перейти к ИПВ</Link></div>;
}
