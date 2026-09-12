# Painel Canal Suporte TOTVS

Painel de acompanhamento das solicitações abertas no canal **#suporte-totvs** (Slack)
através do formulário "Solicitar ajuda".

**Painel publicado:** https://diegoalbuquerque-spec.github.io/meu-dashboard/

---

## O que tem aqui

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | O painel inteiro (HTML, CSS e JS em um arquivo só). É o que o GitHub Pages publica. |
| `ajustes.css` | Logo da Shippify e estilos dos filtros. É aqui que se mexe no visual. |
| `scripts/atualizar_painel.py` | Lê a planilha e reescreve os dados dentro do `index.html`. |
| `.github/workflows/atualizar-painel.yml` | Roda o script três vezes por dia — 09h, 12h e 16h (horário de Brasília). |

## De onde vêm os dados

Da planilha **"Solicitar ajuda"** (Google Sheets), aba **`PAINEL`** — uma aba resumida
que expõe apenas seis colunas:

`data_hora` · `protocolo` · `motivo` · `departamento` · `quem` · `status`

A aba `PAINEL` é alimentada por uma fórmula que puxa da aba `Respostas do formulário`:

```
=SEERRO(FILTER({'Respostas do formulário'!G2:G\'Respostas do formulário'!H2:H\
  'Respostas do formulário'!B2:B\'Respostas do formulário'!A2:A\
  'Respostas do formulário'!F2:F\'Respostas do formulário'!I2:I};
  'Respostas do formulário'!G2:G<>"");"")
```

Ela é publicada na web como CSV (Arquivo → Compartilhar → Publicar na web →
aba `PAINEL` → CSV) e o endereço fica no secret `SHEET_CSV_URL` do repositório
(Settings → Secrets and variables → Actions).

> **Importante:** as outras abas da planilha **não** são publicadas. Elas contêm
> descrições livres com CNPJ, e-mail de colaborador, anexos do Slack e, em alguns
> casos, credenciais digitadas pelo próprio solicitante. Só a aba `PAINEL` sai da
> planilha — nada de descrição chega ao repositório público.

## Como a atualização funciona

1. Às 09h, 12h e 16h o workflow baixa o CSV da aba `PAINEL`.
2. O script normaliza os dados:
   - datas em português (`2 de set., 2026 19h42min01s`) viram `2026-09-02`;
   - o motivo perde as menções (`Acessos - @sairys @Lucas` → `Acessos`);
   - status vazio ou sem a palavra "concluída" conta como **Pendente**;
   - solicitações anteriores a `DATA_INICIAL` (padrão 01/09/2026) ficam de fora.
3. Se algo mudou, ele faz commit no `index.html` e o GitHub Pages republica sozinho
   em 1–2 minutos.

Se o CSV vier vazio ou fora do formato, o workflow falha **sem** sobrescrever o painel.

## Rodar na hora, sem esperar o horário

Aba **Actions** → **Atualizar painel** → **Run workflow**.

## Alterar o visual do painel

Logo e filtros ficam no `ajustes.css`. O resto está no `index.html`, mas não mexa
nestes trechos, que são reescritos automaticamente a cada carga:

- a declaração `ROWS = [ ... ]`
- a declaração `TODAY = "aaaa-mm-dd"`
- os campos de data `f-from` e `f-to` e a linha `DEFAULTS`
- a frase `lidos em ... ela começou em ...` do aviso no topo
- a tag `<link...ajustes.css>`

## Aviso de acesso

O repositório é público e o painel também: qualquer pessoa com o link consegue abrir,
sem login. Ele mostra departamento, motivo, status e o nome de quem abriu cada
solicitação. Se em algum momento isso deixar de ser aceitável, o caminho é tornar o
repositório privado — e aí o GitHub Pages exige plano Enterprise.
