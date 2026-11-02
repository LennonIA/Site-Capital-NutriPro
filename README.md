# Capital Nutri — Site institucional interativo

Site completo, responsivo e funcional: diagnóstico, simulador de desperdício, minijogo, triagem comercial multi-etapas com backend, WhatsApp contextual, Insights (artigos), FAQ, política de privacidade e painel comercial protegido.

## Arquitetura

```
vercel.json            Configuração da Vercel (rotas, segurança, funções)
api/leads.js           Função Vercel: recebe o formulário e grava no Supabase
api/admin.js           Função Vercel: painel comercial com login
api/content.js         Função Vercel: artigos, sitemap.xml e robots.txt (SEO)
lib/core.js            Validação, classificação de leads, SEO (compartilhado)
lib/supabase.js        Acesso à tabela de leads no Supabase
supabase.sql           Script que cria a tabela de leads com segurança (RLS)
admin/index.html       Página do painel (fora de public/: só sai após login)
local-server.js              Servidor LOCAL de testes (grava em data/leads.json)
public/
  index.html           Página principal (todas as seções)
  css/styles.css       Identidade visual, animações, responsivo
  js/config.js         ⚙️  DADOS DA EMPRESA E REGRAS DO DIAGNÓSTICO (editar aqui)
  js/app.js            Interações: diagnóstico, simulador, jogo, triagem, FAB, FAQ…
  js/insights.js       Listagem de artigos
  js/admin.js          Painel comercial
  insights/articles.json   Artigos (conteúdo de demonstração, revisar)
  insights/artigo.html     Template do artigo (renderizado no servidor → SEO)
  privacidade.html     Política de privacidade (modelo, revisar)
  assets/img/          Logo, favicon e fotos reais
data/leads.json        Leads recebidos (criado automaticamente; NÃO versionar/publicar)
dev-server.ps1         Visualização estática no Windows sem Node (sem formulário)
```

**Por que não Next.js?** Nesta máquina não havia Node.js/npm disponível para instalar e validar um projeto Next.js. Optei por uma base sem dependências e sem etapa de build, que carrega rápido (bom para Core Web Vitals), roda em qualquer hospedagem com Node 18+ e pode ser migrada para Next.js depois sem perder nada: componentes, textos e lógica estão isolados.

## Publicar: GitHub + Supabase + Vercel

**1. Supabase (banco dos leads)**
1. Em supabase.com, crie um projeto (região *South America (São Paulo)*). Guarde a senha do banco num local seguro.
2. Abra **SQL Editor → New query**, cole todo o conteúdo de `supabase.sql` e clique em **Run**.
3. Em **Project Settings → API**, anote o **Project URL** e a chave **service_role** (secreta).

**2. GitHub (código)**
Envie para o repositório somente: `api/`, `lib/`, `admin/`, `public/`, `vercel.json`, `package.json`, `local-server.js`, `supabase.sql`, `README.md`, `.gitignore`.
Não envie: `data/`, PDFs, logos soltos na raiz, nem outras pastas de outros projetos.
Pelo site do GitHub: *Add file → Upload files*, arraste os itens acima e clique em *Commit changes*.

**3. Vercel (hospedagem)**
1. *Add New → Project* → importe o repositório. Framework: **Other**. Não altere build nem output (o `vercel.json` já define).
2. Em **Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service_role (secreta, **nunca** no código) |
| `ADMIN_USER` / `ADMIN_PASS` | login do painel `/admin` (senha forte) |
| `SITE_URL` | endereço final, ex. `https://capitalnutri.com.br` (opcional no início) |
| `IP_HASH_SALT` | qualquer texto aleatório longo (anti-spam) |
| `NOTIFY_WEBHOOK_URL` | opcional: avisa a equipe a cada lead (Make, Zapier, n8n…) |

3. Clique em **Deploy**. Teste: envie o formulário, confira o lead em *Supabase → Table Editor → leads* e no painel `/admin`.
4. Domínio próprio: *Project → Settings → Domains*.

A cada novo envio de arquivos ao GitHub, a Vercel publica a atualização automaticamente.

## Rodar localmente

```bash
node local-server.js
```

Acesse `http://localhost:3000`. Variáveis de ambiente:

| Variável | Para quê | Obrigatória |
|---|---|---|
| `PORT` | Porta do servidor (padrão 3000) | não |
| `SITE_URL` | URL pública, ex. `https://capitalnutri.com.br` (sitemap, canonical, HSTS) | em produção |
| `ADMIN_USER` / `ADMIN_PASS` | Login do painel `/admin`. Sem elas o painel fica desativado | para usar o painel |
| `NOTIFY_WEBHOOK_URL` | Recebe cada novo lead (Make, Zapier, n8n, Google Apps Script → Planilha/CRM/e-mail) | opcional |

Sem Node (apenas visualizar no Windows): `powershell -ExecutionPolicy Bypass -File dev-server.ps1` e acesse `http://localhost:8080`. Nesse modo o formulário mostra erro honesto ("seus dados não foram enviados"), porque não há backend.

## ⚠️ O que falta configurar (antes de publicar)

Em `public/js/config.js`:

1. `empresa.whatsapp` — número comercial real (`55` + DDD + número). Enquanto vazio, os botões de WhatsApp avisam que o canal não está configurado.
2. `empresa.email`, `empresa.instagram`, `empresa.endereco`, `empresa.razaoSocial`, `empresa.cnpj`.
3. `credibilidade` — indicadores, depoimentos (com `autorizado: true`) e fotos. Só aparecem no site se forem preenchidos. Não inclua clientes, parcerias (ex.: Sebrae) ou números sem comprovação e autorização.
4. `mostrarAvisosDeDemonstracao: false` — quando tudo estiver preenchido, para remover as faixas amarelas de pré-lançamento.

Também:

- **Fotos reais:** salve em `public/assets/img/` com os nomes `hero-producao.jpg`, `visita-tecnica.jpg`, `treinamento.jpg`, `projeto.jpg`. Elas substituem os espaços reservados automaticamente. Use WebP/JPG otimizados (≤ 200 KB) e imagens com autorização de uso.
- **Artigos:** revise `public/insights/articles.json` com a equipe técnica; marque `"revisado": true` para remover o aviso de rascunho. Para publicar novos artigos, adicione um objeto ao arquivo (slug, título, resumo, categoria, leitura, data, conteúdo).
- **Política de privacidade:** preencha os campos entre colchetes e revise com apoio jurídico.
- **HTTPS:** publique atrás de um proxy/hospedagem com certificado (Render, Railway, Fly.io, VPS com Nginx + Let's Encrypt etc.).
- **Persistência:** `data/leads.json` precisa de disco persistente na hospedagem. Para volume maior, troque `readJSONFile/writeJSONFile` em `local-server.js` por um banco (PostgreSQL, Supabase etc.).

## Funcionalidades e onde estão

| Item | Implementação |
|---|---|
| Navegação em abas | Início, Soluções, Ferramentas (Diagnóstico/Simulador/Jogo), A empresa, Insights e Contato. Cada aba tem endereço próprio (`#solucoes`, `#simulador`…), funciona com o botão Voltar do navegador e pode ser compartilhada |
| Efeitos temáticos | Dinheiro voando no simulador, moedas "escapando" nos problemas, escudos e checks no diagnóstico, moedas e pães no jogo. Desativados automaticamente para quem prefere menos movimento |
| Diagnóstico | Pontuação configurável em `config.js → diagnostico`: cada resposta vale 0, 1,5 ou 3 pontos; índice = soma ÷ máximo × 100. Resultado aparece antes de qualquer pedido de dados |
| Simulador | Dois modos (% do faturamento ou valor das perdas), fórmula exibida na tela, cenários −10%, −25% e o escolhido no controle deslizante |
| Jogo | 3 desafios, 60 s (pausa durante o feedback), indicadores demonstrativos, compartilhar e reiniciar |
| Triagem | 4 etapas, validação no navegador **e** no servidor, honeypot + tempo mínimo + rate limit anti-spam, protocolo `CN-AAAAMMDD-XXXXXX` exibido só após confirmação do servidor |
| Classificação de leads | Segmento, necessidades e urgência (imediata = alta; próximos meses/avaliação = média; pesquisando = baixa) |
| WhatsApp | Mensagens por origem (serviço, seção, diagnóstico, triagem), sem dados sensíveis (sem e-mail/telefone) |
| Painel `/admin` | Lista, busca e filtros (segmento, necessidade, status, urgência), atualização de status, notas internas, exportação CSV |
| SEO | Metadados, Open Graph, JSON-LD (ProfessionalService, FAQPage, Article), `sitemap.xml`, `robots.txt`, artigos renderizados no servidor com URL amigável `/insights/slug` |
| Segurança | CSP, X-Frame-Options, nosniff, HSTS (em HTTPS), limite de tamanho do corpo, escrita atômica, comparação de senha em tempo constante, CSV protegido contra injeção de fórmulas |
| Acessibilidade | Navegação por teclado, foco visível, `aria-*` em progresso/acordeões/menus, link "pular para o conteúdo", `prefers-reduced-motion` respeitado |

## Testes realizados

Verificado no navegador (desktop e celular) via servidor estático: navegação, menu, diagnóstico completo, simulador, jogo completo, triagem (etapas, validação, voltar) e tratamento de erro do envio. **O `local-server.js` não pôde ser executado nesta máquina (sem Node.js)** — rode `node local-server.js` e faça um envio de teste antes de publicar.
