/**
 * CONFIGURAÇÃO DO SITE — edite este arquivo com os dados oficiais da Capital Nutri.
 * Campos vazios ('') ficam ocultos no site ou exibem um aviso de "a configurar".
 * Nunca preencha com dados inventados.
 */
window.CN_CONFIG = {
  empresa: {
    nome: 'Capital Nutri',
    assinatura: 'Soluções em alimentação',
    // WhatsApp comercial: só dígitos, com DDI 55 + DDD. Ex.: '5561999999999'
    whatsapp: '5561998634119',
    email: 'contato@nutripro.com.br',
    instagram: 'https://www.instagram.com/capitalnutri.consultoria/', // URL completa do perfil
    endereco: '',
    cnpj: '31.040.851/0001-91',
    // Nome registrado na Receita. Aparece só em letra pequena (rodapé e política de privacidade);
    // a marca exibida no site é sempre "Capital Nutri".
    razaoSocial: 'Nutripro Gestao em Alimentos LTDA',
  },

  // Exibe faixas "conteúdo de demonstração / a configurar" para a equipe revisar.
  // Altere para false somente quando todo o conteúdo oficial estiver inserido.
  mostrarAvisosDeDemonstracao: true,

  api: { leads: '/api/leads', artigos: '/api/articles' },

  // Mensagens de WhatsApp por origem do clique. {servico} é substituído quando houver.
  mensagensWhatsApp: {
    padrao: 'Olá! Conheci a Capital Nutri pelo site e gostaria de conversar sobre soluções para minha empresa.',
    servico: 'Olá! Conheci a Capital Nutri pelo site e tenho interesse em: {servico}. Podemos conversar?',
    secao: 'Olá! Estava vendo a seção "{secao}" do site da Capital Nutri e gostaria de conversar sobre minha empresa.',
  },

  /* Credibilidade — preencha somente com informações comprováveis e autorizadas.
     Cada item aparece no site apenas se existir aqui. */
  credibilidade: {
    indicadores: [
      // { valor: 50, sufixo: '+', rotulo: 'empresas atendidas' },
    ],
    depoimentos: [
      // { texto: '...', nome: 'Nome', cargo: 'Cargo', empresa: 'Empresa', autorizado: true },
    ],
    fotos: [
      // { src: '/assets/img/visita-tecnica-1.jpg', alt: 'Visita técnica em padaria' },
    ],
    // Cartões da equipe na seção "A empresa". Sem nome/cargo, mostra "Equipe Capital Nutri".
    equipe: [
      { foto: '/assets/img/equipe-1.jpg', alt: 'Retrato profissional de integrante da equipe', nome: '', cargo: '' },
    ],
  },

  /* Diagnóstico: pontuação transparente e configurável.
     Cada opção soma "pontos" (0 a 3) na área indicada. Score geral = soma / máximo × 100. */
  diagnostico: {
    faixas: [
      { min: 75, rotulo: 'Base sólida', cor: 'green', texto: 'Sua operação já tem boas práticas de gestão. O próximo passo é aprofundar indicadores e manter a melhoria contínua.' },
      { min: 45, rotulo: 'Pontos de atenção', cor: 'amber', texto: 'Há fundamentos importantes, mas algumas áreas podem estar gerando perdas, retrabalho ou riscos que passam despercebidos.' },
      { min: 0, rotulo: 'Prioridade alta', cor: 'red', texto: 'Várias áreas da operação dependem de improviso. Organizar processos e controles tende a trazer ganhos importantes de segurança e eficiência.' },
    ],
    areas: {
      perdas: { nome: 'Controle de perdas', servico: 'gestao', dica: 'Comece registrando diariamente o que é descartado (produto, quantidade e motivo). Em poucas semanas surgem padrões claros.' },
      resultado: { nome: 'Visão de resultado', servico: 'gestao', dica: 'Calcule o custo de cada produto a partir da ficha técnica e compare com o preço de venda para conhecer a margem real.' },
      producao: { nome: 'Planejamento da produção', servico: 'gestao', dica: 'Use o histórico de vendas por dia da semana para definir as quantidades a produzir, em vez de repetir sempre o mesmo volume.' },
      padronizacao: { nome: 'Padronização', servico: 'treinamentos', dica: 'Escolha os 3 processos mais críticos e descreva-os passo a passo. Treine a equipe e verifique a aplicação.' },
      fichas: { nome: 'Fichas técnicas', servico: 'fichas', dica: 'Priorize as fichas dos produtos mais vendidos: ingredientes, quantidades, rendimento e modo de preparo.' },
      sanitario: { nome: 'Documentação sanitária', servico: 'regularizacao', dica: 'Faça um levantamento dos documentos e registros que sua operação já possui e verifique se refletem a prática real.' },
    },
    perguntas: [
      {
        id: 'segmento', titulo: 'Qual é o segmento da sua empresa?', tipo: 'perfil',
        opcoes: ['Padaria e confeitaria', 'Restaurante / food service', 'Lanchonete / hamburgueria', 'Pastelaria', 'Supermercado', 'Indústria alimentícia', 'Outro'].map((t) => ({ texto: t })),
      },
      {
        id: 'perdas', titulo: 'Sua empresa possui controle de perdas?', area: 'perdas',
        opcoes: [
          { texto: 'Sim, registramos e analisamos com frequência', pontos: 3 },
          { texto: 'Anotamos às vezes, sem análise', pontos: 1.5 },
          { texto: 'Não temos controle', pontos: 0 },
        ],
      },
      {
        id: 'resultado', titulo: 'Você sabe quais produtos oferecem maior contribuição para o resultado?', area: 'resultado',
        opcoes: [
          { texto: 'Sim, com base em números', pontos: 3 },
          { texto: 'Tenho uma ideia, mas sem cálculo', pontos: 1.5 },
          { texto: 'Não sei', pontos: 0 },
        ],
      },
      {
        id: 'producao', titulo: 'A produção é planejada com base nas vendas?', area: 'producao',
        opcoes: [
          { texto: 'Sim, usamos o histórico de vendas', pontos: 3 },
          { texto: 'Às vezes, pela experiência', pontos: 1.5 },
          { texto: 'Produzimos sempre a mesma quantidade', pontos: 0 },
        ],
      },
      {
        id: 'padronizacao', titulo: 'Sua equipe segue procedimentos padronizados?', area: 'padronizacao',
        opcoes: [
          { texto: 'Sim, escritos e com treinamento', pontos: 3 },
          { texto: 'Parcialmente', pontos: 1.5 },
          { texto: 'Cada um faz do seu jeito', pontos: 0 },
        ],
      },
      {
        id: 'fichas', titulo: 'Suas fichas técnicas estão atualizadas?', area: 'fichas',
        opcoes: [
          { texto: 'Sim, para todos os produtos', pontos: 3 },
          { texto: 'Temos algumas ou estão desatualizadas', pontos: 1.5 },
          { texto: 'Não temos fichas técnicas', pontos: 0 },
        ],
      },
      {
        id: 'sanitario', titulo: 'A documentação sanitária está organizada?', area: 'sanitario',
        opcoes: [
          { texto: 'Sim, organizada e atualizada', pontos: 3 },
          { texto: 'Parcialmente', pontos: 1.5 },
          { texto: 'Não sei ou está desorganizada', pontos: 0 },
        ],
      },
      {
        id: 'desafio', titulo: 'Qual desafio mais preocupa você hoje?', tipo: 'foco',
        opcoes: [
          { texto: 'Desperdício e perdas', foco: 'perdas' },
          { texto: 'Lucro abaixo do esperado', foco: 'resultado' },
          { texto: 'Fiscalização sanitária', foco: 'sanitario' },
          { texto: 'Equipe sem padrão', foco: 'padronizacao' },
          { texto: 'Abrir ou expandir o negócio', foco: 'abertura' },
        ],
      },
    ],
  },
};
