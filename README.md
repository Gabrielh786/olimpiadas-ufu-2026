# 🏆 Sistema Oficial de Projeção de Pontuação & Chaveamento — Olimpíada UFU 2026

Aplicação web completa, reativa, responsiva e 100% funcional construída com **React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons**, sem necessidade de qualquer backend externo ou banco de dados.

Desenvolvida para substituir planilhas manuais propensas a erros, permitindo montar os chaveamentos sorteados no Congresso Técnico, avançar os vencedores fase a fase em 1 clique e acompanhar em tempo real a **Classificação Geral Parcial (Mínimo, Máximo e Média)** de todas as 16 Associações Atléticas Acadêmicas (AAAs) da Universidade Federal de Uberlândia.

---

## 🚀 Como Executar o Projeto

No terminal do projeto (`c:\Users\Lenovo\Downloads\OLÍMPIADA`):

```bash
# Iniciar o servidor de desenvolvimento Vite
npm run dev

# Ou rodar o teste de validação do motor matemático (regras oficiais Art. 79, 80 e Algoz)
npm run test:engine

# Ou gerar a build de produção otimizada
npm run build
```

Abra no navegador o link indicado pelo terminal (geralmente `http://localhost:5173`).

---

## 📌 Funcionalidades e Regras Implementadas

### 1. Sistema de Pontuação Oficial (Art. 79 do Regulamento UFU 2026)
- **1º Lugar (Campeão):** 13 pontos
- **2º Lugar (Vice-Campeão):** 10 pontos
- **3º Lugar (Vencedor da Disputa de 3º):** 8 pontos
- **4º Lugar (Perdedor da Disputa de 3º):** 7 pontos
- **5º Lugar (Eliminado nas Quartas pelo 1º colocado):** 5 pontos
- **6º Lugar (Eliminado nas Quartas pelo 2º colocado):** 4 pontos
- **7º Lugar (Eliminado nas Quartas pelo 3º colocado):** 3 pontos
- **8º Lugar (Eliminado nas Quartas pelo 4º colocado):** 2 pontos
- **9º ao 16º / Eliminado nas Oitavas / Não Inscrito (N/I):** 0 pontos

### 2. Motor Matemático Reativo & Regra do Algoz
- **Zero digitação manual:** O usuário nunca digita pontos; o sistema recalcula Mínimo, Máximo e Média instantaneamente a cada clique ou seleção.
- **Regra do Algoz nas Quartas de Final:**
  - Enquanto o algoz não jogou a semifinal: Mín 2, Máx 5.
  - Se o algoz venceu a semifinal (foi para a Final): Mín 4, Máx 5.
  - Se o algoz perdeu a semifinal (foi para a Disputa de 3º): Mín 2, Máx 3.
  - Se o algoz foi campeão: 5º lugar garantido (Mín 5, Máx 5).
  - Se o algoz foi vice: 6º lugar garantido (Mín 4, Máx 4).
  - Se o algoz foi 3º colocado: 7º lugar garantido (Mín 3, Máx 3).
  - Se o algoz foi 4º colocado: 8º lugar garantido (Mín 2, Máx 2).
- **Avanço em cascata e reversão:** Ao alterar um vencedor em fases anteriores, confrontos dependentes são limpos automaticamente, recalculando o ranking sem inconsistências.
- **Opção de BYE:** Equipes que enfrentam `⚡ BYE` nas Oitavas avançam direto para as Quartas e já garantem Mínimo 2 pontos.

### 3. As 16 Atléticas e Inscrições Estritas (25 Modalidades)
- Todas as 16 AAAs nativamente cadastradas com cores temáticas e avatares:
  - *Agrárias, Aplicada, Artes, Biológicas, Computação & Exatas, Direito, Educa, Engenharia, Fisioterapia, Humanas, Infernal, Medicina, Moca, Monetária, Odonto, Psicologia*.
- Mapeamento estrito por esporte: dropdowns exibem **apenas as atléticas inscritas** em cada modalidade. Atléticas não inscritas iniciam travadas em 0 Mín / 0 Máx e selo `N/I`.
- Inicialização matemática exata garantida:
  - `AAA Engenharia`: Mín 0, Máx 325, Média 162,5 (25 modalidades)
  - `AAA Agrárias`: Mín 0, Máx 312, Média 156 (24 modalidades)
  - `AAA Moca`: Mín 0, Máx 182, Média 91 (14 modalidades)

### 4. Interface com 2 Abas Principais

#### 🏆 ABA 1: Competições & Chaveamentos
- Filtros rápidos por tipo de modalidade:
  - **Mata-Mata 16 (Grupo A - 11 modalidades):** Layout bilateral (Oitavas -> Quartas -> Semifinais -> Final e Disputa de 3º ao centro).
  - **Mata-Mata 32 - Duplo Atleta (Grupo B - 4 modalidades):** 16-avos -> Oitavas -> Quartas -> Semi -> Final, com Chave A (Atleta 1) e Chave B (Atleta 2). Seletor de modo: *Melhor Representante* (padrão) ou *Ranking Geral Derivado*.
  - **Tabela de Ordem (Grupo C - 10 modalidades):** 1º ao 8º lugar direto com controle de duplicidade e finalização.
- Botões utilitários em cada chave:
  - `🎲 Sortear Chave Aleatória (Teste)`
  - `⚡ Preencher BYEs Automáticos`
  - `🗑️ Limpar Chave` / `Zerar Resultados`
- Painel lateral/inferior de pontuação em tempo real de cada modalidade com status de cada atlética.

#### 📊 ABA 2: Classificação Geral Parcial
- **Visão 2.1: Card Oficial do Ranking:**
  - Cabeçalho: "Classificação geral **parcial**" e subtítulo dinâmico "X de 25 modalidades pontuáveis definidas".
  - Colunas: `#` | `ATLÉTICA` | `MÍN.` | `MÁX.` | `MÉDIA`.
  - Pódio (1º ao 3º) com fundo em tom âmbar e indicador vibrante.
  - Zona de Classificação para a **Série A 2027 (Top 8)** destacada com indicador lateral e linha de corte.
  - Ordenação dinâmica por **MÉDIA** (padrão), **MÁX.** ou **MÍN.** com critérios oficiais de desempate (maior número de 1º, 2º e 3º lugares).
  - Barra visual de projeção (Range Bar) expansível mostrando a faixa de variação de pontos.
  - **Modo Apresentação / Print:** visualização limpa para tirar print para Instagram/WhatsApp ou impressão.
- **Visão 2.2: Matriz Geral de Auditoria:**
  - Planilha completa 16 Atléticas × 25 Modalidades, células coloridas por status (cravado, em aberto, 0/0 ou N/I).
  - Coluna de **Ajustes / Bônus Abertura (+25/+50) / W.O. (-13)** com modal de edição.
  - Clique em qualquer modalidade da matriz abre a chave correspondente instantaneamente.

### 5. Persistência, Backup e Exportação
- **Persistência Total:** Qualquer alteração é salva no `localStorage` na hora.
- **Exportar Backup (JSON):** Baixa o estado completo em arquivo `.json`.
- **Importar Backup (JSON):** Restaura qualquer backup salvo com sanitização automática.
- **Exportar CSV/Excel:** Gera planilha `.csv` formatada para Excel em português (separador `;` e BOM UTF-8).
- **Personalização de Atléticas:** Modal para alterar cores, siglas e fazer upload do escudo de cada atlética.
