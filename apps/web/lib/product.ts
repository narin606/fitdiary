export type Section="Today"|"Diary"|"Foods"|"Progress"|"Settings";
const routes:Record<Section,string>={Today:"/",Diary:"/diary",Foods:"/foods",Progress:"/progress",Settings:"/settings"};
export const sectionPath=(section:Section)=>routes[section];
export const photoPath=(id:string)=>`/diary/${encodeURIComponent(id)}/photo`;
export function profilePayload(values:Record<string,string>){return {displayName:values.displayName.trim(),goalType:values.goalType,calorieGoal:Number(values.calorieGoal),proteinGoal:Number(values.proteinGoal),carbGoal:Number(values.carbGoal),fatGoal:Number(values.fatGoal),waterGoalMl:Number(values.waterGoalMl),units:values.units}}
export function diaryItemsForEdit<T>(items:T[],replacement:T):T[]{return [replacement,...items.slice(1)]}
