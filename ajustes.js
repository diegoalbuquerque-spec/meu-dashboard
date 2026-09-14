/* ajustes.js — painel Canal Suporte TOTVS
   1) transforma o botão "Tabela" num interruptor de correr
   2) permite ordenar qualquer tabela clicando no cabeçalho da coluna */
(function () {
  'use strict';

  /* ---------- 1. interruptor gráfico <-> tabela ---------- */

  function mostrandoTabela(btn) {
    var card = btn.closest('.card');
    var t = card ? card.querySelector('table') : null;
    return !!(t && t.offsetParent !== null);
  }

  function pintar(btn) {
    var tabela = mostrandoTabela(btn);
    var texto = tabela ? 'Ver gráfico' : 'Ver tabela';
    btn.dataset.modo = tabela ? 'tabela' : 'grafico';
    btn.setAttribute('aria-pressed', tabela ? 'true' : 'false');
    btn.setAttribute('aria-label', texto);

    var etiqueta = btn.querySelector('.sw-lab');
    if (btn.querySelector('.sw-track') && etiqueta) {
      if (etiqueta.textContent !== texto) etiqueta.textContent = texto;
      return;
    }
    btn.textContent = '';
    var trilho = document.createElement('span');
    trilho.className = 'sw-track';
    var bola = document.createElement('span');
    bola.className = 'sw-knob';
    trilho.appendChild(bola);
    etiqueta = document.createElement('span');
    etiqueta.className = 'sw-lab';
    etiqueta.textContent = texto;
    btn.appendChild(trilho);
    btn.appendChild(etiqueta);
  }

  function ligarBotoes() {
    var botoes = document.querySelectorAll('button.tbtn');
    for (var i = 0; i < botoes.length; i++) {
      (function (btn) {
        if (btn.dataset.swPronto) { pintar(btn); return; }
        btn.dataset.swPronto = '1';
        pintar(btn);
        btn.addEventListener('click', function () {
          setTimeout(function () { pintar(btn); }, 0);
        });
        new MutationObserver(function () { pintar(btn); })
          .observe(btn, { childList: true, characterData: true, subtree: true });
      })(botoes[i]);
    }
  }

  /* ---------- 2. ordenação das tabelas ---------- */

  function valor(td) {
    var s = (td ? td.textContent : '').trim();
    if (!s || s === '—' || s === '-' || s === '–') return null;
    var d = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (d) return Number(d[3] + d[2] + d[1]);
    if (/\d/.test(s)) {
      var n = s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
      if (n !== '' && !isNaN(Number(n))) return Number(n);
    }
    return s.toLocaleLowerCase('pt-BR');
  }

  function ordenar(tabela, indice, crescente) {
    var corpo = tabela.tBodies[0];
    if (!corpo) return;
    var linhas = Array.prototype.slice.call(corpo.rows);
    linhas.sort(function (a, b) {
      var x = valor(a.cells[indice]);
      var y = valor(b.cells[indice]);
      if (x === null && y === null) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      if (typeof x === 'number' && typeof y === 'number') return crescente ? x - y : y - x;
      var r = String(x).localeCompare(String(y), 'pt-BR');
      return crescente ? r : -r;
    });
    for (var i = 0; i < linhas.length; i++) corpo.appendChild(linhas[i]);
  }

  document.addEventListener('click', function (e) {
    var th = e.target && e.target.closest ? e.target.closest('th') : null;
    if (!th) return;
    var tabela = th.closest('table');
    if (!tabela || !tabela.tBodies[0] || !tabela.tBodies[0].rows.length) return;

    var linha = th.parentElement;
    var indice = Array.prototype.indexOf.call(linha.children, th);
    var crescente = tabela.dataset.ordCol !== String(indice) || tabela.dataset.ordDir === 'desc';

    for (var i = 0; i < linha.children.length; i++) {
      linha.children[i].removeAttribute('data-ord');
    }
    th.setAttribute('data-ord', crescente ? 'asc' : 'desc');
    tabela.dataset.ordCol = String(indice);
    tabela.dataset.ordDir = crescente ? 'asc' : 'desc';
    ordenar(tabela, indice, crescente);
  });

  /* ---------- inicialização ---------- */

  var pendente = false;
  function reaplicar() {
    if (pendente) return;
    pendente = true;
    setTimeout(function () { pendente = false; ligarBotoes(); }, 60);
  }

  function iniciar() {
    ligarBotoes();
    var alvo = document.querySelector('main') || document.body;
    new MutationObserver(reaplicar).observe(alvo, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
