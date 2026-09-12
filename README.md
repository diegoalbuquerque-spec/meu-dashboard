# Painel Canal Suporte TOTVS

Painel de acompanhamento das solicitações abertas no canal **#suporte-totvs** (Slack)
através do formulário "Solicitar ajuda".

**Painel publicado:** https://diegoalbuquerque-spec.github.io/meu-dashboard/

---

## O que tem aqui

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | O painel inteiro (HTML, CSS e JS em um arquivo só). É o que o GitHub Pages publica. |
| `scripts/atualizar_painel.py` | Lê a planilha e reescreve os dados dentro do `index.html`. |
| `.github/workflows/atualizar-painel.yml` | Roda o script uma vez por dia, às 08h (horário de Brasília). |

## De onde vêm os dados

Da planilha **"Solicitar ajuda"** (Google Sheets), aba **`PAINEL`** — uma aba resumida
que expõe apenas seis colunas:

`data_hora` · `protocolo` · `motivo` · `departamento` · `quem` · `status`

A aba `PAINEL` é alimentada por uma fórmula que puxa da aba `Status final`:

```
=ARRAYFORMULA(IFERROR(FILTER(
  {'Status final'!G2:G,'Status final'!H2:H,'Status final'!B2:B,
   'Status final'!A2:A,'Status final'!F2:F,'Status final'!I2:I},
  'Status final'!G2:G<>"")))
```

Ela é publicada na web como CSV (Arquivo → Compartilhar → Publicar na web →
aba `PAINEL` → CSV) e o endereço fica no secret `SHEET_CSV_URL` do repositório
(Settings → Secrets and variables → Actions).

> **Importante:** a aba `Status final` e a aba `Respostas do formulário` **não** são
> publicadas. Elas contêm descrições livres com CNPJ, e-mail de colaborador, anexos do
> Slack e, em alguns casos, credenciais digitadas pelo próprio solicitante. Só a aba
> `PAINEL` sai da planilha — nada de descrição chega ao repositório público.

## Como a atualização funciona

1. Todo dia às 08h o workflow baixa o CSV da aba `PAINEL`.
2. O script normaliza os dados:
   - datas em português (`2 de set., 2026 19h42min01s`) viram `2026-09-02`;
   - o motivo perde as menções (`Acessos - @sairys @Lucas` → `Acessos`);
   - status vazio ou sem a palavra "concluída" conta como **Pendente**;
   - linhas sem data são ignoradas.
3. Se algo mudou, ele faz commit no `index.html` e o GitHub Pages republica sozinho
   em 1–2 minutos.

Se o CSV vier vazio ou fora do formato, o workflow falha **sem** sobrescrever o painel.

## Rodar na hora, sem esperar o horário

Aba **Actions** → **Atualizar painel** → **Run workflow**.

## Alterar o visual do painel

Edite o `index.html` normalmente. Só não mexa nestes três trechos, que são
reescritos automaticamente a cada carga:

- a declaração `ROWS = [ ... ]`
- a declaração `TODAY = "aaaa-mm-dd"`
- a frase `lidos em ... ela começou em ...` do aviso no topo

## Aviso de acesso

O repositório é público e o painel também: qualquer pessoa com o link consegue abrir,
sem login. Ele mostra departamento, motivo, status e o nome de quem abriu cada
solicitação. Se em algum momento isso deixar de ser aceitável, o caminho é tornar o
repositório privado — e aí o GitHub Pages exige plano Enterprise.
