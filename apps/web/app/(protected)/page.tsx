"use client";

import { useMemo, useState } from "react";
import {
  Apple, BarChart3, BookOpen, Camera, ChevronLeft, ChevronRight, Droplets,
  Dumbbell, Flame, LayoutDashboard, Plus, Search, Settings, Sparkles, Utensils,
  Weight, X
} from "lucide-react";

type Meal = { name: string; kcal: number; note: string; tone: string };

const meals: Record<string, Meal[]> = {
  Breakfast: [{ name: "Soft-boiled eggs & toast", kcal: 342, note: "2 eggs · wholemeal toast · kopi o kosong", tone: "amber" }],
  Lunch: [{ name: "Hainanese chicken rice", kcal: 690, note: "Roasted chicken · rice · cucumber · chilli", tone: "coral" }],
  Dinner: [],
  Snacks: [{ name: "Greek yoghurt", kcal: 128, note: "150 g · blueberries", tone: "purple" }],
};

const nav = [
  ["Today", LayoutDashboard], ["Diary", BookOpen], ["Foods", Apple],
  ["Progress", BarChart3], ["Settings", Settings]
] as const;

export default function Home() {
  const [active, setActive] = useState("Today");
  const [modal, setModal] = useState<null | "add" | "photo" | "weight" | "water">(null);
  const [water, setWater] = useState(1250);
  const eaten = useMemo(() => Object.values(meals).flat().reduce((n, m) => n + m.kcal, 0), []);
  const goal = 2200;
  const exercise = 180;
  const remaining = goal - eaten + exercise;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Flame size={22}/></span><span>FitDiary</span></div>
        <nav>{nav.map(([label, Icon]) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon size={19}/><span>{label}</span></button>)}</nav>
        <div className="sidebar-card"><Sparkles size={20}/><strong>AI, only when asked</strong><p>Your meal photos stay private until you press Analyze.</p></div>
        <div className="profile"><div className="avatar">B</div><div><strong>Brandon</strong><span>1,040 kcal remaining</span></div></div>
      </aside>

      <section className="content">
        <header>
          <div><p className="eyebrow">WEDNESDAY · 9 SEPTEMBER</p><h1>{active === "Today" ? "Good evening, Brandon" : active}</h1></div>
          <div className="header-actions"><button className="icon-btn" aria-label="Search"><Search size={20}/></button><button className="primary" onClick={() => setModal("add")}><Plus size={18}/> Log food</button></div>
        </header>

        {active === "Today" ? <>
          <div className="date-strip"><button aria-label="Previous day"><ChevronLeft/></button><strong>Today</strong><span>September 9</span><button aria-label="Next day"><ChevronRight/></button></div>
          <section className="hero-grid">
            <div className="calorie-card">
              <div className="ring" style={{"--progress": `${Math.min(100, eaten / goal * 100)}%`} as React.CSSProperties}><div><strong>{remaining.toLocaleString()}</strong><span>kcal left</span></div></div>
              <div className="calorie-copy"><p className="eyebrow">TODAY'S ENERGY</p><h2>Steady progress.</h2><p>You’re 53% through today’s food budget. Dinner can still be generous.</p><div className="equation"><span><b>{goal}</b>Goal</span><i>−</i><span><b>{eaten}</b>Food</span><i>+</i><span><b>{exercise}</b>Exercise</span></div></div>
            </div>
            <div className="macro-card"><div className="card-title"><span>Macros</span><small>Daily target</small></div>{[["Protein",78,150,"#f36b4f"],["Carbs",151,248,"#e5a53e"],["Fat",48,73,"#7857d6"]].map(([n,v,t,c])=><div className="macro" key={String(n)}><div><strong>{n}</strong><span>{v} / {t}g</span></div><div className="bar"><i style={{width:`${Number(v)/Number(t)*100}%`,background:String(c)}}/></div></div>)}</div>
          </section>

          <section className="quick-actions">
            <button onClick={() => setModal("photo")}><span className="quick-icon coral"><Camera/></span><span><strong>Meal photo</strong><small>Save now, analyze when you want</small></span></button>
            <button onClick={() => setModal("add")}><span className="quick-icon yellow"><Search/></span><span><strong>Search food</strong><small>Recent, custom and verified foods</small></span></button>
            <button onClick={() => setModal("weight")}><span className="quick-icon purple"><Weight/></span><span><strong>Log weight</strong><small>Current: 130.0 kg</small></span></button>
          </section>

          <section className="main-grid">
            <div className="diary-card">
              <div className="section-heading"><div><p className="eyebrow">TODAY'S DIARY</p><h2>Meals</h2></div><button className="text-btn">View full diary</button></div>
              {Object.entries(meals).map(([meal, entries]) => <div className="meal" key={meal}><div className="meal-head"><strong>{meal}</strong><span>{entries.reduce((n,e)=>n+e.kcal,0)} kcal</span></div>{entries.map(entry=><div className="food-row" key={entry.name}><div className={`food-thumb ${entry.tone}`}><Utensils size={18}/></div><div><strong>{entry.name}</strong><span>{entry.note}</span></div><b>{entry.kcal}</b></div>)}<button className="add-row" onClick={() => setModal("add")}><Plus size={16}/> Add to {meal.toLowerCase()}</button></div>)}
            </div>
            <aside className="side-stack">
              <div className="water-card"><div className="card-title"><span>Water</span><Droplets size={18}/></div><div className="water-value"><strong>{(water/1000).toFixed(2)} L</strong><span>of 2.5 L</span></div><div className="bar water"><i style={{width:`${water/2500*100}%`}}/></div><div className="water-actions"><button onClick={()=>setWater(Math.min(2500,water+250))}>+ 250 ml</button><button onClick={()=>setModal("water")}>Custom</button></div></div>
              <div className="activity-card"><div className="card-title"><span>Movement</span><Dumbbell size={18}/></div><strong>180 kcal</strong><p>35 min brisk walk</p><button onClick={() => setModal("add")}>Log exercise</button></div>
              <div className="trend-card"><div className="card-title"><span>7-day weight</span><small>−0.6 kg</small></div><div className="sparkline"><svg viewBox="0 0 240 80" role="img" aria-label="Weight trend down over seven days"><path d="M4 18 C35 16, 42 30, 74 29 S115 42, 142 43 S183 50, 236 65" fill="none" stroke="#7857d6" strokeWidth="4" strokeLinecap="round"/><path d="M4 18 C35 16, 42 30, 74 29 S115 42, 142 43 S183 50, 236 65 L236 80 L4 80 Z" fill="url(#fade)"/><defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7857d6" stopOpacity=".25"/><stop offset="1" stopColor="#7857d6" stopOpacity="0"/></linearGradient></defs></svg></div><div><b>130.0 kg</b><span>Latest entry</span></div></div>
            </aside>
          </section>
        </> : <Placeholder title={active} open={() => setModal(active === "Progress" ? "weight" : "add")}/>} 
      </section>
      {modal && <Modal kind={modal} close={() => setModal(null)}/>} 
    </main>
  );
}

function Placeholder({title, open}:{title:string;open:()=>void}) {
  const copy:Record<string,string>={Diary:"Browse every meal by date, copy previous meals, or add a photo without analyzing it.",Foods:"Search recent, custom, verified and community foods. Build saved meals and recipes.",Progress:"Follow weight averages, calories and macro trends without overreacting to one day.",Settings:"Manage your profile, targets, units, privacy and future wearable integrations."};
  return <section className="placeholder"><span className="quick-icon purple">{title === "Progress" ? <BarChart3/> : title === "Foods" ? <Apple/> : title === "Settings" ? <Settings/> : <BookOpen/>}</span><h2>{title}</h2><p>{copy[title]}</p><button className="primary" onClick={open}><Plus size={18}/> {title === "Progress" ? "Log weight" : "Create entry"}</button>{title === "Settings" && <div className="coming"><strong>Wearables</strong><span>Apple Health · Health Connect · Fitbit · Garmin · Samsung Health</span><em>Coming later</em></div>}</section>
}

function Modal({kind,close}:{kind:string;close:()=>void}) {
  const photo=kind==="photo";
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={close} aria-label="Close"><X/></button><span className={`quick-icon ${photo?"coral":"purple"}`}>{photo?<Camera/>:<Plus/>}</span><h2>{photo?"Add a meal photo":kind==="weight"?"Log weight":kind==="water"?"Add water":"Log something"}</h2><p>{photo?"The photo is saved privately. AI analysis only starts if you explicitly choose it.":"This form will save through the FitDiary API once your server environment is connected."}</p>{photo&&<div className="upload-zone"><Camera/><strong>Choose a photo</strong><span>JPG, PNG or HEIC · up to 10 MB</span></div>}<div className="modal-actions"><button className="secondary" onClick={close}>Save without analysis</button>{photo&&<button className="primary"><Sparkles size={17}/> Analyze with AI</button>}</div></div></div>
}
