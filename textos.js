/* textos.js — painel Canal Suporte TOTVS
   Subtitulos e rodape eram fixos no HTML e nao acompanhavam a carga
   nem os filtros. Aqui eles passam a refletir o que esta na tela. */
(function () {
  'use strict';

  function tabelaDetalhe() {
    var ts = document.querySelectorAll('table');
    return ts.length ? ts[ts.length - 1] : null;
  }

  function contagens() {
    var t = tabelaDetalhe();
    if (!t || !t.tBodies[0]) return null;
    var linhas = t.tBodies[0].rows;
    var abertas = 0;
    for (var i = 0; i < linhas.length; i++) {
      var c = linhas[i].cells[5];
      var s = (c ? c.textContent : '').trim().toLowerCase();
      if (s && s.indexOf('conclu') === -1) abertas++;
    }
    return { total: linhas.length, abertas: abertas };
  }

  function periodoTexto() {
    var de = document.querySelector('#f-from');
    var ate = document.querySelector('#f-to');
    if (!de || !ate || !de.value || !ate.value) return '';
    function br(v, ano) {
      var p = v.split('-');
      return p[2] + '/' + p[1] + (ano ? '/' + p[0] : '');
    }
    return br(de.value, false) + ' – ' + br(ate.value, true);
  }

  function corrigir() {
    var c = contagens();
    var per = periodoTexto();

    var it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = it.nextNode())) {
      var v = n.nodeValue;
      if (!v || !v.trim()) continue;
      var novo = v;
      if (per) {
        novo = novo.replace(/(Solicitações abertas por dia\s*·\s*)[^\n]*/, '$1' + per);
      }
      if (c) {
        novo = novo.replace(/\d+(\s+em aberto por tempo desde a abertura)/, c.abertas + '$1');
        novo = novo.replace(/As\s+\d+\s+solicitações da base[^\n]*/,
                            'As ' + c.total + ' solicitações da base');
      }
      if (novo !== v) n.nodeValue = novo;
    }

    var rodape = document.querySelector('footer');
    if (rodape && !rodape.dataset.limpo) {
      var m = document.body.innerText.match(/lidos em ([^.]+)\./);
      rodape.textContent = 'Fonte: Solicitar ajuda — Respostas (Google Sheets)'
        + (m ? ' · Leitura de ' + m[1].trim() : '');
      rodape.dataset.limpo = '1';
    }

    var aba = document.querySelector('#tab-dash');
    if (aba && aba.textContent.trim() !== 'Dashboard') aba.textContent = 'Dashboard';

    var st = document.querySelector('#f-status');
    if (st) {
      for (var i = 0; i < st.options.length; i++) {
        if (st.options[i].value === 'Pendente' && st.options[i].textContent !== 'Em aberto') {
          st.options[i].textContent = 'Em aberto';
        }
      }
    }
  }

  var pendente = false;
  function reaplicar() {
    if (pendente) return;
    pendente = true;
    setTimeout(function () { pendente = false; corrigir(); }, 80);
  }

  function iniciar() {
    corrigir();
    var alvo = document.querySelector('main') || document.body;
    new MutationObserver(reaplicar).observe(alvo, { childList: true, subtree: true });
    document.addEventListener('change', reaplicar);
    document.addEventListener('input', reaplicar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
