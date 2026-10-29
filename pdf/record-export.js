import {createDocumentsPDF} from './document-export.js';
import { jsPDF } from 'jspdf';
function createRecordPDF(patient,anamnesis,settings,documents=[]) {
 const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const width=210,left=18,right=192,bottom=276;let y=45;
 const clean=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[–—]/g,'-').replace(/→/g,'>').replace(/•/g,'-');
 const date=value=>value?new Date(value+'T12:00').toLocaleDateString('pt-BR'):'Não registrado';
 function header(){doc.setFillColor(29,78,61);doc.rect(0,0,width,31,'F');doc.setTextColor(233,241,220);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text('Radix IA · Gestão Odontológica',left,14);doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text('PRONTUÁRIO ODONTOLÓGICO',left,22);doc.setFontSize(8);doc.text(clean(settings.clinic||'Clínica'),right,14,{align:'right'});doc.setTextColor(43,68,52);y=43}
 function page(){doc.addPage();header()}
 function ensure(height){if(y+height>bottom)page()}
 function text(value,{size=10,bold=false,color=[72,89,65],indent=0,gap=4,line=5}={}){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);const lines=doc.splitTextToSize(clean(value||'Não registrado'),right-left-indent);for(const row of lines){ensure(line);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(row,left+indent,y);y+=line}y+=gap}
 function section(title){ensure(20);y+=3;doc.setFillColor(239,245,229);doc.roundedRect(left,y-5,right-left,10,1,1,'F');doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(43,82,53);doc.text(clean(title),left+3,y+1);y+=13}
 function field(label,value){ensure(17);text(label,{size:8,bold:true,color:[129,145,111],gap:1,line:4});text(value,{size:10,gap:5,line:5})}
 header();doc.setProperties({title:'Prontuário odontológico - '+clean(patient.name),subject:'Registro clínico local sem assinatura digital',author:clean(settings.doctor||''),creator:'Radix IA · Gestão Odontológica'});
 text(patient.name,{size:18,bold:true,gap:4,line:8});text(`Identificador: ${patient.id}  |  Nascimento: ${date(patient.birth)}`,{size:9,color:[120,137,104],gap:2});text(`CPF: ${patient.cpf||'Não cadastrado'}`,{size:9,color:[120,137,104],gap:2});text(`Profissional responsável informado: ${settings.doctor||'Não registrado'}`,{size:9,color:[120,137,104],gap:5});
 section('1. Anamnese e exame clínico');
 const labels={complaint:'Queixa principal',illness:'História da queixa / doença atual',conditions:'Condições sistêmicas',medications:'Medicamentos em uso',allergies:'Alergias e reações anteriores',surgeries:'Cirurgias e internações',habits:'Hábitos e antecedentes odontológicos',pregnancy:'Gestação / lactação',extraoral:'Exame extraoral',intraoral:'Exame intraoral',notes:'Observações e cuidados'};
 for(const[key,label]of Object.entries(labels))field(label,anamnesis[key]);if(anamnesis.reviewed)text(`Última atualização: ${date(anamnesis.reviewed)} | ${anamnesis.professional||''}`,{size:8,color:[129,145,111]});
 section('2. Evoluções clínicas');
 if(!patient.history?.length)text('Nenhuma evolução registrada.');
 for(const entry of patient.history||[]){ensure(25);text(`${date(entry.date)}${entry.time?' - '+entry.time:''} | ${entry.title}`,{size:11,bold:true,color:[48,82,53],gap:3,line:6});if(entry.structured){text(`Profissional: ${entry.professional||'Não registrado'} | Dente/região: ${entry.tooth||'Não informado'}`,{size:8,color:[129,145,111],gap:4});for(const[label,value]of [['Queixa / relato',entry.complaint],['Exame e achados',entry.findings],['Avaliação registrada',entry.assessment],['Procedimentos realizados',entry.procedures],['Conduta, orientações e retorno',entry.plan]])field(label,value)}else {text(entry.text);if(entry.professional)text('Profissional: '+entry.professional+(entry.cro?' | CRO/UF: '+entry.cro:''),{size:8,gap:4})}text('Registro local - não assinado digitalmente.',{size:8,color:[140,151,124],gap:7});}
 section('3. Odontograma');
 const stateLabels={'':'Sem marcação',marked:'Acompanhamento',treatment:'Em tratamento',restored:'Restaurado',missing:'Ausente'};
 const stateColors={'':[247,249,242],marked:[219,234,197],treatment:[248,230,202],restored:[214,232,242],missing:[229,225,220]};
 const upper=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],lower=[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];ensure(62);
 for(const[label,numbers]of [['Arcada superior',upper],['Arcada inferior',lower]]){text(label,{size:8,bold:true,gap:1,line:4});const cell=(right-left)/16;for(let i=0;i<numbers.length;i++){const n=numbers[i],x=left+i*cell;doc.setFillColor(...(stateColors[patient.teeth?.[n]||'']||stateColors['']));doc.setDrawColor(203,216,188);doc.roundedRect(x,y,cell-1,11,1.3,1.3,'FD');doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(73,94,58);doc.text(String(n),x+(cell-1)/2,y+7,{align:'center'})}y+=18}
 text('Legenda: verde = acompanhamento; bege = tratamento; azul = restaurado; cinza = ausente.',{size:8,color:[120,137,104],gap:6,line:4});
 const nums=[...upper,...lower].filter(n=>patient.teeth?.[n]||patient.toothDetails?.[n]?.notes);if(!nums.length)text('Nenhum achado registrado.');for(const n of nums){const detail=patient.toothDetails?.[n];field(`Dente ${n} - ${stateLabels[patient.teeth?.[n]||'']||'Condição não informada'}`,`Face/região: ${detail?.surface||'Não especificada'}\nObservação: ${detail?.notes||'Não registrada'}`)}
 section('4. Plano clínico de tratamento');
 if(!patient.treatments?.length)text('Nenhum procedimento planejado.');for(const[treatmentIndex,t]of (patient.treatments||[]).entries()){field(`${treatmentIndex+1}. ${t.name}`,`Status: ${t.status}\nDente/região: ${t.tooth||'Não especificada'}${t.notes?'\nObservações: '+t.notes:''}`)}
 for(const plan of patient.carePlans||[]){field('Plano de Atendimento - '+date(plan.date),plan.text)}
 section('5. Documentos vinculados');const linked=documents.filter(d=>d.patient===patient.id);if(!linked.length)text('Nenhum documento vinculado.');for(const d of linked)text(`${date(d.date)} - ${d.type} | ${d.status}`,{size:9});
 section('Informações da exportação');text('Exportação dos registros locais existentes neste navegador. Sem assinatura digital, certificação ou trilha de auditoria em servidor. Esta cópia não valida autoria nem comprova atendimento. O conteúdo deve ser conferido pelo profissional responsável.',{size:8,color:[125,140,110],line:4,gap:3});text('Gerado em '+new Date().toLocaleString('pt-BR'),{size:8,color:[125,140,110]});
 const pages=doc.getNumberOfPages();for(let pageIndex=1;pageIndex<=pages;pageIndex++){doc.setPage(pageIndex);doc.setDrawColor(220,229,208);doc.line(left,282,right,282);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(145,157,131);doc.text('Registro local - sem assinatura digital',left,288);doc.text(`${pageIndex} / ${pages}`,right,288,{align:'right'})}
 return doc;
}
window.RecordPDF={create:createRecordPDF,documents:createDocumentsPDF};
