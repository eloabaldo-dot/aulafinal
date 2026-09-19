# SPEC de Interface-Base: SmartTrip

**Documento:** `docs/specs/ui-spec.md`  
**Status:** Aprovado  
**Versão:** 1.0.0  
**Rastreabilidade:** [smarttrip-mestre.md](./smarttrip-mestre.md) e [setup-operacional.md](./setup-operacional.md)  
**Objetivo:** Especificar a arquitetura visual, comportamentos de tela, contratos de UI, responsividade, estados (vazio, loading, erro), acessibilidade e critérios de aceite das 9 telas do MVP do SmartTrip, sem acoplamento direto prévio a implementações do Firebase ou APIs externas.

---

## 1. Visão Geral e Mapa de Rotas do MVP

| Rota | Nome da Tela | Visibilidade | Propósito Central |
|---|---|---|---|
| `/` | Landing Page | Pública | Apresentar a proposta de valor do SmartTrip e converter visitantes em cadastros. |
| `/login` | Autenticação | Pública | Permitir entrada na plataforma via e-mail/senha ou Google OAuth. |
| `/register` | Cadastro | Pública | Registrar novos usuários coletando credenciais básicas de acesso. |
| `/dashboard` | Painel Principal | Privada | Centralizar ações rápidas (criar nova viagem, ver próxima viagem, status de folgas). |
| `/profile` | Perfil & Preferências | Privada | Configurar preferências de viagem (estilo, ritmo, orçamento, restrições alimentares). |
| `/availability` | Períodos de Folga | Privada | Gerenciar janelas de recesso, feriados e férias para alimentar o planejador. |
| `/explore` | Busca & Descoberta | Privada | Buscar destinos, visualizar previsão de clima preliminar e pontos de interesse (POIs). |
| `/trips` | Minhas Viagens | Privada | Listar viagens ativas, concluídas e rascunhos com ações de filtragem e exclusão. |
| `/trips/[id]` | Detalhe & Roteiro | Privada | Exibir o roteiro dia a dia com blocos de atividades, mapa e controle editorial humano. |

---

## 2. Sistema de Design, Layout e Componentes Reutilizáveis

### 2.1. Padrões de Layout
- **Desktop (>= 1024px):**
  - **Telas Públicas (`/`, `/login`, `/register`):** Header minimalista fixo com logotipo e CTA de login/cadastro; formulários centralizados em cartões com elevação sutil.
  - **Telas Privadas:** Layout com barra de navegação superior (Header global com avatar, alternador de tema claro/escuro e botão de logout) e navegação principal em abas ou sidebar expansível.
- **Mobile (< 1024px):**
  - **Header Superior Compacto:** Logotipo do SmartTrip, título contextual da tela e foto de perfil.
  - **Bottom Navigation Bar Fixa:** Barra inferior com 4 a 5 ícones de acesso rápido: Início (`/dashboard`), Explorar (`/explore`), Viagens (`/trips`), Folgas (`/availability`) e Perfil (`/profile`).

### 2.2. Biblioteca de Componentes Reutilizáveis
1. **`AppHeader`:** Cabeçalho com logo, status de autenticação, toggle de tema escuro e perfil.
2. **`BottomNav`:** Navegação inferior fixa mobile com indicador de rota ativa.
3. **`Button`:** Variantes (`primary`, `secondary`, `outline`, `ghost`, `danger`) com estados `disabled` e `loading` (spinner embutido).
4. **`Input` / `Select` / `Textarea`:** Campos de formulário com rótulo (*label*), mensagem de ajuda, indicador de obrigatoriedade e exibição de erro semântico.
5. **`TripCard`:** Card de visualização de viagem contendo foto do destino, datas, badge de status e botão de ação/exclusão.
6. **`DayTimeline`:** Componente de linha do tempo dia a dia para exibição cronológica de atividades.
7. **`ActivityItem`:** Bloco de atividade com horário, ícone de categoria, título, custo estimado e botão de edição/remoção.
8. **`Modal` / `Dialog`:** Diálogo acessível com backdrop, foco preso (*focus trap*) e botão de fechamento para confirmações críticas (ex: exclusão de viagem).
9. **`LoadingSkeleton`:** Esqueletos animados de placeholder com pulso visual para carregamento assíncrono.
10. **`EmptyState`:** Ilustração/ícone, título, mensagem explicativa e botão de ação primária para coleções vazias.
11. **`Toast`:** Notificações temporárias (*feedback banners*) para sucesso, aviso e erro de operações.

### 2.3. Diretrizes de Acessibilidade Básica (WCAG 2.1 AA)
- Todos os campos de formulário devem possuir tags `<label>` associadas via `htmlFor`/`id`.
- Modais e botões interativos devem responder adequadamente a teclas `Escape`, `Enter` e `Space`.
- Contraste de cores entre texto e fundo deve atender à proporção mínima de 4.5:1 no tema claro e no tema escuro.
- Imagens devem conter atributos `alt` informativos ou `aria-hidden="true"` caso sejam estritamente decorativas.

---

## 3. Especificação Detalhada das Telas

---

### 3.1. Tela 1: Landing Page (`/`)
- **Objetivo:** Explicar a proposta do assistente inteligente de viagens com IA e direcionar para cadastro ou demonstração.
- **Visibilidade:** Pública.
- **Elementos Obrigatórios:**
  - Header com logotipo "SmartTrip" e botões "Entrar" e "Começar Grátis".
  - Hero section com título de alto impacto ("Seu roteiro sob medida em segundos com IA"), subtítulo e CTA primário.
  - Seção de benefícios em grade com 3 pilares: (1) Análise Climática em Tempo Real, (2) Curadoria por IA e (3) Controle Humano Total.
  - Prévia visual interativa (mockup de roteiro).
  - Rodapé com créditos acadêmicos e links institucionais.
- **Layout:**
  - *Desktop:* Hero section em 2 colunas (texto persuasivo à esquerda e card interativo de prévia à direita).
  - *Mobile:* Coluna única vertical com botão CTA em destaque fixo ou largura total.
- **Critérios de Aceite:**
  - **CA-UI-001:** Clicar no botão "Começar Grátis" ou "Entrar" deve navegar respectivamente para `/register` e `/login`.
  - **CA-UI-002:** A página deve ser renderizada sem quebras de layout em resoluções de 360px a 1920px.

---

### 3.2. Tela 2: Autenticação (`/login`)
- **Objetivo:** Autenticar o usuário na plataforma.
- **Visibilidade:** Pública.
- **Elementos Obrigatórios:**
  - Campo de E-mail (com validação de formato).
  - Campo de Senha (com botão de alternar visibilidade mostrar/ocultar senha).
  - Botão primário "Entrar".
  - Botão secundário "Entrar com o Google" (com ícone oficial).
  - Link de texto "Esqueci minha senha".
  - Link "Ainda não tem conta? Cadastre-se" direcionando para `/register`.
- **Estados:**
  - *Loading:* Botões desabilitados com spinner durante envio do formulário.
  - *Erro:* Mensagem de erro em destaque ("Credenciais inválidas" ou "E-mail não encontrado").
- **Critérios de Aceite:**
  - **CA-UI-003:** O botão "Entrar" deve permanecer desabilitado se e-mail e senha estiverem em branco.
  - **CA-UI-004:** Clicar em "Cadastre-se" deve redirecionar para `/register`.

---

### 3.3. Tela 3: Cadastro (`/register`)
- **Objetivo:** Criação de nova conta de usuário.
- **Visibilidade:** Pública.
- **Elementos Obrigatórios:**
  - Campo de Nome Completo.
  - Campo de E-mail.
  - Campo de Senha com indicador visual de força (mínimo de 6 caracteres).
  - Campo de Confirmação de Senha.
  - Botão primário "Criar Conta".
  - Botão secundário "Cadastrar com o Google".
  - Link "Já possui uma conta? Faça login" direcionando para `/login`.
- **Estados:**
  - *Erro:* Validação inline caso as senhas digitadas não coincidam.
- **Critérios de Aceite:**
  - **CA-UI-005:** Exibir aviso de erro em tempo real caso a confirmação de senha seja divergente da senha principal.
  - **CA-UI-006:** O formulário preenchido com sucesso deve disparar estado de carregamento e redirecionar para `/dashboard`.

---

### 3.4. Tela 4: Painel Principal (`/dashboard`)
- **Objetivo:** Hub central do viajante, fornecendo atalhos para planejamento e visão geral do status atual.
- **Visibilidade:** Privada.
- **Elementos Obrigatórios:**
  - Saudação personalizada com nome do usuário e foto/avatar.
  - Card de CTA prioritário: "Planejar Nova Viagem" (leva a `/explore`).
  - Card de "Próxima Viagem Agendada": resumo de destino, contagem regressiva de dias e clima estimado.
  - Bloco de "Minhas Folgas Ativas": atalho para `/availability` exibindo próximo período cadastrado.
  - Lista rápida de "Últimos Roteiros Gerados" com botão "Ver Todos" (para `/trips`).
- **Estados:**
  - *Vazio:* Caso o usuário não tenha viagens criadas, o card da próxima viagem exibe empty state acolhedor: "Nenhuma viagem planejada ainda. Que tal explorar um novo destino?".
  - *Loading:* Skeletons simulando os cards de resumo e lista recente.
- **Critérios de Aceite:**
  - **CA-UI-007:** Clicar em "Planejar Nova Viagem" deve navegar para `/explore`.
  - **CA-UI-008:** Clicar no card da próxima viagem deve navegar diretamente para `/trips/[id]`.

---

### 3.5. Tela 5: Perfil & Preferências (`/profile`)
- **Objetivo:** Manter as informações do usuário e parâmetros padrão de personalização da IA.
- **Visibilidade:** Privada.
- **Elementos Obrigatórios:**
  - Dados pessoais: Nome, e-mail (somente leitura), bio curta.
  - Seletor de Estilo de Viagem (Cultura, Natureza, Gastronomia, Aventura, Relaxamento).
  - Seletor de Nível de Orçamento (Econômico, Moderado, Luxo).
  - Seletor de Ritmo (Tranquilo, Balanceado, Intenso).
  - Seleção de Restrições Alimentares (Vegetariano, Vegano, Sem Glúten, Sem Lactose).
  - Botão "Salvar Alterações".
  - Botão de "Encerrar Sessão" (Logout).
- **Estados:**
  - *Sucesso:* Toast informativo "Preferências salvas com sucesso!".
  - *Loading:* Bloqueio de campos com indicador de salvamento.
- **Critérios de Aceite:**
  - **CA-UI-009:** O usuário deve conseguir alterar chips/tags de preferências e receber confirmação visual ao salvar.
  - **CA-UI-010:** O botão "Encerrar Sessão" deve exigir confirmação ou deslogar imediatamente para `/login`.

---

### 3.6. Tela 6: Períodos de Folga (`/availability`)
- **Objetivo:** Cadastrar e visualizar períodos disponíveis (férias, pontes, fins de semana) para subsidiar a escolha de datas de viagens.
- **Visibilidade:** Privada.
- **Elementos Obrigatórios:**
  - Botão de ação: "Adicionar Período de Folga".
  - Formulário/Modal de cadastro: Data Inicial, Data Final e Título descritivo (ex: "Férias de Julho").
  - Lista de períodos cadastrados ordenada cronologicamente, contendo: quantidade total de dias, intervalo de datas e botão de exclusão.
  - Destaque/alerta quando um período estiver se aproximando.
- **Estados:**
  - *Vazio:* Empty state: "Você ainda não cadastrou seus períodos de folga. Cadastre suas férias para gerarmos roteiros do tamanho exato do seu tempo livre!".
- **Critérios de Aceite:**
  - **CA-UI-011:** O formulário deve bloquear a gravação caso a data final seja anterior à data inicial.
  - **CA-UI-012:** A exclusão de um período deve removê-lo da listagem imediatamente com notificação Toast.

---

### 3.7. Tela 7: Busca & Descoberta (`/explore`)
- **Objetivo:** Pesquisar destinos, visualizar contexto climático prévio e configurar os parâmetros da viagem para acionar a geração do roteiro.
- **Visibilidade:** Privada.
- **Elementos Obrigatórios:**
  - Barra de busca preditiva de cidade/país com autocompletar.
  - Seletor de datas da viagem (Data de Início e Data de Término - limite de até 7 dias no MVP).
  - Card de Contexto do Destino (aparece após selecionar localidade):
    - Nome da cidade e país;
    - Widget meteorológico: temperatura média esperada e ícone de condição (ex: Sol, Chuva);
    - Destaques turísticos preliminares (POIs).
  - Botão primário de ação: "Gerar Roteiro Inteligente".
- **Estados:**
  - *Loading durante a geração:* Tela modal de progresso em etapas visuais:
    1. "Consultando clima local...";
    2. "Identificando atrações e pontos de interesse...";
    3. "O Gemini está criando seu itinerário sob medida...".
  - *Erro:* Mensagem amigável caso ocorra falha de rede ou timeout com botão "Tentar Novamente".
- **Critérios de Aceite:**
  - **CA-UI-013:** O botão "Gerar Roteiro Inteligente" só deve ser clicável com destino e datas válidas preenchidas.
  - **CA-UI-014:** A conclusão bem-sucedida da geração deve transicionar a interface para a tela de revisão e detalhe `/trips/[id]`.

---

### 3.8. Tela 8: Minhas Viagens (`/trips`)
- **Objetivo:** Exibir o inventário de viagens planejadas, realizadas e rascunhos salvos do usuário.
- **Visibilidade:** Privada.
- **Elementos Obrigatórios:**
  - Barra de filtro por abas: "Todas", "Próximas" e "Passadas".
  - Grade responsiva de cards de viagem (`TripCard`), exibindo:
    - Foto ou ilustração do destino;
    - Nome da localidade e país;
    - Período (ex: "12 a 18 Outubro - 7 dias");
    - Tag de status ("Confirmado" ou "Rascunho");
    - Botão de exclusão (ícone de lixeira).
  - Botão flutuante ou no topo: "Nova Viagem".
- **Estados:**
  - *Vazio:* Ilustração de mala vazia: "Nenhuma viagem encontrada neste filtro. Comece a planejar sua próxima aventura!".
  - *Modal de Exclusão:* Diálogo de confirmação com texto "Deseja realmente excluir a viagem para [Destino]? Esta ação não poderá ser desfeita.".
- **Critérios de Aceite:**
  - **CA-UI-015:** A alternância de abas ("Próximas" / "Passadas") deve filtrar a lista de cards instantaneamente sem recarregar a tela.
  - **CA-UI-016:** Confirmar a exclusão no modal deve remover o card correspondente da tela e exibir Toast de confirmação.

---

### 3.9. Tela 9: Detalhe do Roteiro & Revisão Humana (`/trips/[id]`)
- **Objetivo:** Exibir o roteiro gerado pela IA estruturado por dias e períodos, permitindo ao usuário revisar, editar, reorganizar e persistir o plano final.
- **Visibilidade:** Privada.
- **Elementos Obrigatórios:**
  - Cabeçalho da Viagem: Nome do destino, datas, total de dias e resumo meteorológico do período.
  - Navegador de Dias: Seletor em abas ou carrossel (Dia 1, Dia 2, ..., Dia 7).
  - Linha do Tempo do Dia Selecionado dividida em blocos:
    - 🌅 **Manhã:** Atividades sugeridas com horário, título, descrição, custo e dicas.
    - ☀️ **Tarde:** Atividades sugeridas e paradas de almoço.
    - 🌙 **Noite:** Jantar e programas culturais/noturnos.
  - **Controles de Edição Humana (Editorial):**
    - Botão "Editar" em cada atividade (permite mudar título, horário ou descrição);
    - Botão "Excluir" em cada atividade;
    - Botão "+ Adicionar Atividade Manual" ao final de cada período.
  - Barra de Ações:
    - Botão secundário "Descartar / Voltar";
    - Botão primário "Salvar Roteiro no Perfil" (com ícone de check).
- **Estados:**
  - *Modo Edição:* Campos de texto editáveis inline ou modal simples para ajuste da atividade.
  - *Salvamento:* Feedback visual de sucesso pós-clique em salvar.
- **Critérios de Aceite:**
  - **CA-UI-017:** O usuário deve conseguir alterar o texto de uma atividade gerada pela IA e a modificação deve permanecer visível na tela.
  - **CA-UI-018:** Clicar em excluir uma atividade específica deve removê-la imediatamente do dia sem afetar as demais.
  - **CA-UI-019:** Clicar em "Salvar Roteiro no Perfil" deve emitir Toast de confirmação e manter os dados em estado consolidado.

---

## 4. Dados Mock Permitidos para a Fase de Interface-Base

Para viabilizar o desenvolvimento e validação visual de todas as 9 telas antes da conexão com o Firebase e as APIs do Gemini, clima e geocoding, são formalmente permitidos os seguintes conjuntos de dados em `src/data/`:

1. **`mockUser`:** Objeto de usuário simulado com nome "Clara Ferreira", e-mail "clara@smarttrip.com", foto mock e preferências preenchidas.
2. **`mockVacations`:** Array de 3 períodos de folga com datas válidas no ano corrente.
3. **`mockDestinations`:** Lista com 5 destinos (Lisboa, Tóquio, Roma, Paris, Rio de Janeiro) com coordenadas mockadas e dados de clima estáticos.
4. **`mockTrips`:** Array com 3 viagens completas (uma futura, uma rascunho e uma passada) contendo itinerários diários estruturados em `DayPlan[]` e `Activity[]`.

> ⚠️ **Regra Contratual:** O código dos componentes de interface deve consumir esses dados através de interfaces TypeScript padronizadas (`UserProfile`, `VacationPeriod`, `Trip`, `DayPlan`, `Activity`), garantindo que a substituição futura por chamadas de serviço assíncronas ocorra sem refatoração de UI.

---

## 5. Critérios Globais de Aceite da Interface-Base

- **CA-UI-GLOBAL-001 (Navegação):** Todas as 9 rotas devem ser navegáveis via cliques e links na interface sem erros 404 ou quebras de script.
- **CA-UI-GLOBAL-002 (Responsividade):** Nenhuma tela deve apresentar barra de rolagem horizontal indesejada em resoluções mobile (360px a 430px) ou desktop (1024px a 1440px).
- **CA-UI-GLOBAL-003 (Feedback Visual):** Operações assíncronas simuladas devem exibir estados claros de skeleton ou spinner, nunca deixando a tela travada ou estática.
- **CA-UI-GLOBAL-004 (Controle Editorial):** A tela `/trips/[id]` deve comprovar em teste visual a capacidade de exclusão e edição de atividades sugeridas.
- **CA-UI-GLOBAL-005 (Temas):** A alternância entre tema claro e escuro deve ser consistente em todas as 9 telas.
