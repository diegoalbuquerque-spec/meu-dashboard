#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Le a aba PAINEL da planilha (CSV publicado, URL no secret SHEET_CSV_URL)
# e reescreve ROWS, TODAY e a frase "lidos em ..." dentro do index.html.
import csv, io, os, re, sys, urllib.request
from datetime import datetime, timedelta, timezone

INDEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "index.html")
BRT = timezone(timedelta(hours=-3))
MESES = "jan fev mar abr mai jun jul ago set out nov dez".split()
COLS = ["data_hora", "protocolo", "motivo", "departamento", "quem", "status"]


def data_de(txt):
    txt = (txt or "").strip()
    m = re.match(r"^(\d{1,2})\D*de\s+([a-z]{3})[^,]*,?\s+(\d{4})", txt, re.I)
    if m and m.group(2).lower() in MESES:
        return "%s-%02d-%02d" % (m.group(3), MESES.index(m.group(2).lower()) + 1, int(m.group(1)))
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})", txt)
    if m:
        return "%s-%02d-%02d" % (m.group(3), int(m.group(2)), int(m.group(1)))
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", txt)
    return m.group(0) if m else None


def js(v):
    return '"%s"' % re.sub(r"\s+", " ", (v or "").strip()).replace("\\", "\\\\").replace('"', '\\"')


def ler(url):
    req = urllib.request.Request(url, headers={"User-Agent": "painel-totvs"})
    txt = urllib.request.urlopen(req, timeout=60).read().decode("utf-8-sig", "replace")
    linhas = [l for l in csv.reader(io.StringIO(txt)) if any((c or "").strip() for c in l)]
    if not linhas:
        sys.exit("CSV vazio.")
    cab = [(c or "").strip().lower() for c in linhas[0]]
    faltam = [c for c in COLS if c not in cab]
    if faltam:
        sys.exit("Faltam colunas no CSV: %s (recebi %s)" % (faltam, cab))
    idx = {c: cab.index(c) for c in COLS}
    out = []
    for l in linhas[1:]:
        g = lambda c: l[idx[c]].strip() if idx[c] < len(l) else ""
        d = data_de(g("data_hora"))
        if not d:
            continue
        prot = re.sub(r"\D", "", g("protocolo"))
        out.append({
            "prot": prot or None, "data": d,
            "motivo": re.split(r"\s+-\s+@", g("motivo"))[0].strip(" -") or "Sem motivo",
            "depto": g("departamento") or "Nao informado",
            "quem": g("quem") or "Nao informado",
            "status": "Concluída" if "conclu" in g("status").lower() else "Pendente",
        })
    out.sort(key=lambda r: (r["data"], r["prot"] or ""))
    return out


def main():
    url = os.environ.get("SHEET_CSV_URL", "").strip()
    if not url:
        sys.exit("Falta o secret SHEET_CSV_URL.")
    regs = ler(url)
    if not regs:
        sys.exit("Nenhuma linha valida no CSV; nao vou sobrescrever o painel.")

    html = open(INDEX, encoding="utf-8").read()
    antes = html
    agora = datetime.now(BRT)

    corpo = ",\n".join(
        "    { prot: %s, data: %s, motivo: %s, depto: %s, quem: %s, status: %s }"
        % (js(r["prot"]) if r["prot"] else "null", js(r["data"]), js(r["motivo"]),
           js(r["depto"]), js(r["quem"]), js(r["status"])) for r in regs)
    html, n = re.subn(r"((?:const|let|var)\s+ROWS\s*=\s*)\[[\s\S]*?\n\s*\]",
                      lambda m: m.group(1) + "[\n" + corpo + "\n  ]", html, count=1)
    if n != 1:
        sys.exit("Nao encontrei ROWS no index.html.")

    html, n = re.subn(r'((?:const|let|var)\s+TODAY\s*=\s*")[^"]*(")',
                      lambda m: m.group(1) + agora.strftime("%Y-%m-%d") + m.group(2), html, count=1)
    if n != 1:
        print("aviso: TODAY nao encontrado.", file=sys.stderr)

    frase = "lidos em %s. São as %d solicitações que existem nessa base — ela começou em %s." % (
        agora.strftime("%d/%m/%Y %Hh%M"), len(regs),
        datetime.strptime(regs[0]["data"], "%Y-%m-%d").strftime("%d/%m"))
    html, n = re.subn(r"lidos em .*?ela começou em \d{2}/\d{2}\.", lambda m: frase, html, count=1)
    if n != 1:
        print("aviso: frase do aviso nao encontrada.", file=sys.stderr)

    if html == antes:
        print("Sem mudancas: %d solicitacoes." % len(regs))
        return
    open(INDEX, "w", encoding="utf-8").write(html)
    print("Painel atualizado: %d solicitacoes." % len(regs))


main()
