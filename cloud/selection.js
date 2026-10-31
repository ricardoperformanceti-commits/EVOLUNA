// Preserve each editor's selected patient when replacing a database snapshot.
export function retainPatientSelections(patients,selections){const ids=new Set(patients.map(p=>p.id)),fallback=patients[0]?.id||'';return Object.fromEntries(Object.entries(selections).map(([key,id])=>[key,ids.has(id)?id:fallback]))}
