export type Goals = { calories:number; proteinG:number; carbsG:number; fatG:number; waterMl:number };
type FoodItem = { servings:number; calories:number; proteinG:number; carbsG:number; fatG:number };
type SummaryInput = {
  date:string; goals:Goals;
  diaryEntries:Array<{items:FoodItem[]}>;
  waterEntries:Array<{amountMl:number}>;
  exerciseEntries:Array<{caloriesBurned:number;durationMinutes:number|null}>;
  weightEntries:Array<{id:string;date:Date;weightKg:number;[key:string]:unknown}>;
};

export function parseDay(value:unknown):string {
  if(typeof value!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date");
  const parsed=new Date(`${value}T00:00:00.000Z`);
  if(Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0,10)!==value) throw new Error("Invalid date");
  return value;
}
export function dayBounds(value:unknown){const date=parseDay(value);const start=new Date(`${date}T00:00:00.000Z`);return {start,end:new Date(start.valueOf()+86_400_000)};}
const rounded=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export function aggregateDay(input:SummaryInput){
  const food=input.diaryEntries.flatMap(entry=>entry.items).reduce((a,item)=>({
    calories:a.calories+item.calories*item.servings, proteinG:a.proteinG+item.proteinG*item.servings,
    carbsG:a.carbsG+item.carbsG*item.servings, fatG:a.fatG+item.fatG*item.servings,
  }),{calories:0,proteinG:0,carbsG:0,fatG:0});
  const exerciseCalories=input.exerciseEntries.reduce((n,e)=>n+e.caloriesBurned,0);
  const totals={calories:rounded(food.calories),proteinG:rounded(food.proteinG),carbsG:rounded(food.carbsG),fatG:rounded(food.fatG),waterMl:input.waterEntries.reduce((n,e)=>n+e.amountMl,0),exerciseCalories,exerciseMinutes:input.exerciseEntries.reduce((n,e)=>n+(e.durationMinutes??0),0)};
  const latestWeight=[...input.weightEntries].sort((a,b)=>b.date.valueOf()-a.date.valueOf())[0]??null;
  return {date:input.date,goals:input.goals,totals,remainingCalories:rounded(input.goals.calories-totals.calories+exerciseCalories),latestWeight};
}
