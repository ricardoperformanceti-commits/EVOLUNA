# Sorriso com IA — demonstração de apresentação

Aplicação completa de demonstração em HTML, CSS e JavaScript. Sem login do aplicativo, sem chamadas ao Supabase e sem dados reais. Os dados ficam em localStorage no navegador. O acesso da hospedagem Sites permanece privado.

## Módulos
- Painel com indicadores calculados a partir dos dados locais e gráfico histórico explicitamente ilustrativo.
- Pacientes: cadastro, edição, busca, filtros e visualização em cartões ou lista.
- Agenda: navegação por dia, cadastro, detecção de conflito de horário por profissional, confirmação, cancelamento e conclusão.
- Prontuários: perfil, evolução, odontograma de 32 dentes interativo e plano de tratamento com valores.
- Sorriso IA: ilustração comparativa, ajustes visuais, upload de referência local, geração simulada e galeria. Sem processamento de IA e sem previsão clínica.
- Teleconsultas: sala fictícia com cronômetro, controles simulados, anotações e gravação da evolução. Sem câmera, microfone ou conexão com participantes.
- Documentos: quatro modelos, edição, salvamento, impressão/PDF via navegador e download em texto. Sem validade clínica ou jurídica.
- Financeiro: lançamentos de receitas e despesas, recebimento simulado, filtros e exportação CSV. Sem cobrança real.
- Relatórios: indicadores locais, status dos agendamentos e exportações CSV.
- Configurações: dados fictícios da clínica, preferências locais, tour em seis etapas, tela cheia e restauração dos exemplos.

## Executar
`npm run build` copia a aplicação para dist. `npm run dev` abre servidor local na porta 3001.

Todos os exemplos usam nomes e contatos fictícios. Não use dados reais de pacientes. Os gráficos históricos são ilustrativos e rotulados. Os demais indicadores derivam da base local.

A identidade do Sites permanece em .openai/hosting.json. A pasta worker contém a implementação anterior com autenticação, que não é incluída na publicação estática atual. O projeto Next.js anterior continua separado em /workspace/sorriso-com-ia.

## Dr. Help

O botão superior e o atalho Ctrl/⌘ K abrem o Dr. Help. A pesquisa de pacientes permanece no módulo Pacientes.

Catálogo demonstrativo local com cinco princípios ativos: paracetamol, dipirona, ibuprofeno, amoxicilina e clindamicina. Pesquisa normalizada por marca, princípio ativo, nome técnico e sinônimos. Links externos reais para fontes de fabricantes e Bulário Anvisa. Não há busca remota, atualização automática de bula ou geração de prescrições.

Calculadora manual com distinção explícita entre mg/kg/dose e mg/kg/dia, administrações por dia, peso, limites por dose e por dia informados pelo profissional, e conversão opcional de concentração mg/volume para mL. Os campos de dose não são preenchidos pelo catálogo. Resultados excedentes são bloqueados, sem ajuste automático. Referência, apresentação e confirmação de conferência são obrigatórias. Nenhum resultado é salvo ou encaminhado ao paciente.

Validação: pesquisa pelos três tipos de nome; resultado vazio; cálculo por dose e por dia; conversão de volume; invalidação ao alterar entradas; bloqueio de limite; concentração incompleta; atalho e layout móvel.
