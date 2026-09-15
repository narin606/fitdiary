import type { SVGProps } from "react";

type Props=SVGProps<SVGSVGElement>;
const Icon=({children,...props}:Props)=> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
export const CameraIcon=(p:Props)=><Icon {...p}><path d="M4 8.5h3l1.4-2h7.2l1.4 2h3v10H4z"/><circle cx="12" cy="13.5" r="3.2"/></Icon>;
export const SearchIcon=(p:Props)=><Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></Icon>;
export const PlusIcon=(p:Props)=><Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
export const SparkIcon=(p:Props)=><Icon {...p}><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9zM18.5 15l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z"/></Icon>;
export const TrashIcon=(p:Props)=><Icon {...p}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></Icon>;
export const EditIcon=(p:Props)=><Icon {...p}><path d="m4 20 4.2-1 10.4-10.4a2.1 2.1 0 0 0-3-3L5.2 16zM14.5 6.5l3 3"/></Icon>;
export const ChevronIcon=(p:Props)=><Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>;
export const ScaleIcon=(p:Props)=><Icon {...p}><path d="M5 20h14l1-11a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3z"/><path d="M9 10a3 3 0 0 1 6 0l-3 2z"/></Icon>;
export const TargetIcon=(p:Props)=><Icon {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M17.5 6.5 21 3"/></Icon>;
export const DropIcon=(p:Props)=><Icon {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></Icon>;
export const UserIcon=(p:Props)=><Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></Icon>;
export const FlameIcon=(p:Props)=><Icon {...p}><path d="M13 3s1 4-2 6c-2-2-4-1-5 1-2 4 1 10 6 11 5-1 8-5 6-9-1-2-2-3-5-5 0 0 1 4-1 6"/></Icon>;
export const FoodIcon=(p:Props)=><Icon {...p}><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c3 2 3 7 0 9"/></Icon>;
export const CheckIcon=(p:Props)=><Icon {...p}><path d="m5 12 4 4L19 6"/></Icon>;
