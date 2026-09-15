"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { profileApi } from "../../../lib/productApi";
import { profilePayload } from "../../../lib/product";
import { DropIcon, FoodIcon, SparkIcon, TargetIcon, UserIcon } from "../../../components/UiIcons";

const goalName:Record<string,string>={LOSE:"Lose weight",MAINTAIN:"Maintain weight",GAIN:"Gain weight"};
const activityName:Record<string,string>={sedentary:"Mostly seated",light:"Lightly active",active:"Active",very_active:"Very active"};

export default function Settings(){
 const[p,setP]=useState<any>(),[message,setMessage]=useState(""),[error,setError]=useState(""),[saving,setSaving]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{setError("");profileApi.get().then(x=>setP(x.profile)).catch(e=>setError(e instanceof Error?e.message:"Could not load settings"))},[retry]);
 if(!p)return <main className="product-page"><section className="page-heading"><div><p className="eyebrow">Preferences</p><h1>Settings</h1></div></section>{error?<p className="alert-card" role="alert">{error} <button onClick={()=>setRetry(x=>x+1)}>Retry</button></p>:<div className="settings-loading" role="status">Loading your preferences…</div>}</main>;
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError("");setMessage("");try{const raw=Object.fromEntries(new FormData(e.currentTarget)) as Record<string,string>;setP((await profileApi.save(profilePayload(raw))).profile);setMessage("Your settings have been saved")}catch(e){setError(e instanceof Error?e.message:"Could not save settings")}finally{setSaving(false)}}
 const initials=(p.displayName||p.username||"F").slice(0,2).toUpperCase();
 return <main className="product-page settings-page">
  <section className="page-heading"><div><p className="eyebrow">Preferences</p><h1>Settings</h1><p>Keep your plan personal, accurate and easy to follow.</p></div></section>
  {error&&<p className="alert-card" role="alert">{error}</p>}{message&&<p className="success-card" role="status">{message}</p>}
  <section className="profile-hero"><div className="profile-avatar">{initials}</div><div><h2>{p.displayName||p.username}</h2><p>@{p.username} · {p.email}</p><div className="profile-tags"><span><TargetIcon/>{goalName[p.goalType]||"Personal goal"}</span><span><UserIcon/>{activityName[p.activityLevel]||"Activity not set"}</span></div></div><Link className="secondary-action" href="/onboarding">Update body details</Link></section>
  <form className="settings-layout" onSubmit={save}>
   <div className="settings-main">
    <section className="settings-card"><header><span className="settings-icon purple"><UserIcon/></span><div><h2>Profile</h2><p>How your name and preferences appear.</p></div></header><div className="settings-fields"><label>Display name<input name="displayName" defaultValue={p.displayName??""} placeholder="Your name"/></label><label>Goal<select name="goalType" defaultValue={p.goalType}><option value="LOSE">Lose weight</option><option value="MAINTAIN">Maintain weight</option><option value="GAIN">Gain weight</option></select></label><label>Measurement units<div className="segmented-control"><input id="metric" type="radio" name="units" value="metric" defaultChecked={p.units==="metric"}/><label htmlFor="metric">Metric</label><input id="imperial" type="radio" name="units" value="imperial" defaultChecked={p.units==="imperial"}/><label htmlFor="imperial">Imperial</label></div></label></div></section>
    <section className="settings-card"><header><span className="settings-icon coral"><FoodIcon/></span><div><h2>Daily nutrition targets</h2><p>Fine-tune the plan calculated during setup.</p></div></header><div className="goal-input-grid"><label><span>Calories</span><div className="goal-input"><input name="calorieGoal" type="number" min="500" defaultValue={p.calorieGoal} required/><small>kcal</small></div></label><label><span>Protein</span><div className="goal-input"><input name="proteinGoal" type="number" min="0" defaultValue={p.proteinGoal} required/><small>g</small></div></label><label><span>Carbohydrates</span><div className="goal-input"><input name="carbGoal" type="number" min="0" defaultValue={p.carbGoal} required/><small>g</small></div></label><label><span>Fat</span><div className="goal-input"><input name="fatGoal" type="number" min="0" defaultValue={p.fatGoal} required/><small>g</small></div></label></div></section>
    <section className="settings-card"><header><span className="settings-icon blue"><DropIcon/></span><div><h2>Hydration</h2><p>Your daily water target.</p></div></header><label className="water-goal"><DropIcon/><div><span>Daily water goal</span><div className="goal-input"><input name="waterGoalMl" type="number" min="0" defaultValue={p.waterGoalMl} required/><small>ml</small></div></div></label></section>
   </div>
   <aside className="settings-aside"><section className="plan-summary"><span className="spark-badge"><SparkIcon/></span><p>Your daily plan</p><strong>{p.calorieGoal}<small> kcal</small></strong><div><span><b>{p.proteinGoal}g</b> Protein</span><span><b>{p.carbGoal}g</b> Carbs</span><span><b>{p.fatGoal}g</b> Fat</span></div><p className="plan-summary-note">Targets are guides, not medical advice. You can update them whenever your routine changes.</p></section><button className="primary-action full sticky-save" disabled={saving}>{saving?"Saving…":"Save changes"}</button><p className="settings-help">Need to change sex, birthdate, height, activity or goal weight? <Link href="/onboarding">Revisit guided setup</Link>.</p></aside>
  </form>
 </main>
}
