import { useState } from "react";
import { useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MENU, type MenuItem } from "@/lib/menu";
import { ownerMenu, saveMenuItem } from "@/lib/menu.functions";

export const ownerMenuQuery = queryOptions({queryKey:["owner-menu"],queryFn:()=>ownerMenu()});
export function StaffMenu() {
  const {data}=useSuspenseQuery(ownerMenuQuery);const [search,setSearch]=useState("");
  return <><h1 className="font-display text-3xl mb-6">Menu</h1><Input aria-label="Search menu" placeholder="Search menu" className="max-w-sm bg-card h-12 mb-6" value={search} onChange={e=>setSearch(e.target.value)} />
    <div className="grid gap-4 lg:grid-cols-2">{MENU.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())).map(item=>{
      const override=data.find(o=>o.item_id===item.id);
      return <MenuEditor key={item.id+JSON.stringify(override)} item={item} available={override?.available??true} prices={override?.prices} />;
    })}</div></>;
}
function MenuEditor({item,available,prices}:{item:MenuItem;available:boolean;prices:unknown}) {
  const [enabled,setEnabled]=useState(available);const [values,setValues]=useState<Record<string,number>>(()=>Object.fromEntries(item.sizes.map(s=>{
    const value = prices && typeof prices==="object" && !Array.isArray(prices) ? (prices as Record<string,unknown>)[s.label] : undefined;
    return [s.label, typeof value === "number" ? value : s.price];
  })));
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const save=useServerFn(saveMenuItem);const qc=useQueryClient();
  return <form className="border rounded-lg bg-card p-4" onSubmit={async e=>{
    e.preventDefault();setBusy(true);setMessage("");
    try {await save({data:{itemId:item.id,available:enabled,prices:values}});await Promise.all([qc.invalidateQueries({queryKey:["owner-menu"]}),qc.invalidateQueries({queryKey:["public-menu"]})]);setMessage("Saved.");}
    catch{setMessage("Could not save this item.");}finally{setBusy(false);}
  }}>
    <div className="flex gap-3 items-center mb-4"><img src={item.image} alt={item.name} loading="lazy" className="size-16 rounded-md object-cover" /><div className="min-w-0"><strong className="text-lg">{item.name}</strong><p className="text-sm text-muted-foreground">{item.category}</p></div></div>
    <label className="flex gap-2 items-center mb-4"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} />Available</label>
    <div className="flex gap-3 flex-wrap">{item.sizes.map(s=><label key={s.label} className="flex-1 min-w-24">{s.label||"Regular"} · ₹<Input aria-label={`${item.name} ${s.label||"Regular"} price`} type="number" min={0} max={100000} step={1} required className="h-12 mt-1" value={values[s.label]??s.price} onChange={e=>setValues(v=>({...v,[s.label]:Number(e.target.value)}))} /></label>)}</div>
    <Button disabled={busy} className="mt-4 h-11"><Save />Save</Button>{message&&<p role="status" className="mt-2">{message}</p>}
  </form>;
}