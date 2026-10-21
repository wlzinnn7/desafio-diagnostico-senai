import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, set, update, get, onValue, serverTimestamp, runTransaction } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';
import { questions } from './questions.js';

const appEl = document.getElementById('app');
const toastEl = document.getElementById('toast');
const ROUND_MS = 30000;
const BASE_POINTS = 100;
const SPEED_POINTS = 100;
const DOUBLE_ROUNDS = 5;
const SCORE_PRECISION = 1000; // Três casas decimais distinguem respostas por milissegundos.

let auth, db, user = null;
let room = null, code = '', mode = '', unsubscribe = null, interval = null;
let hostBusy = false, serverOffset = 0;

const configured = !Object.values(firebaseConfig).some(x => String(x).includes('COLE_AQUI'));
const $ = id => document.getElementById(id);
const serverNow = () => Date.now() + serverOffset;
const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
const fmt = n => (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const roundScore = n => Math.round((Number(n) + Number.EPSILON) * SCORE_PRECISION) / SCORE_PRECISION;

function notice(message) {
  toastEl.textContent = message;
  toastEl.style.display = 'block';
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => { toastEl.style.display = 'none'; }, 4800);
}
function err(e) {
  console.error(e);
  notice(['PERMISSION_DENIED','permission-denied'].includes(e?.code)
    ? 'Acesso negado. Confira as regras do Firebase.'
    : (e?.message || 'Não foi possível concluir a ação.'));
}
function root(inner) {
  appEl.innerHTML = `<div class="shell"><header class="top">
    <div class="brand"><div class="logo">⚡</div><div>DESAFIO <span style="color:#66dce8">DIAGNÓSTICO</span>
    <div class="muted mini">Laboratório de Hardware · SENAI-MG</div></div></div>
    <div class="tag">● MULTIPLAYER</div></header>${inner}
    <footer class="footer"><span>Projeto educacional independente • Demonstração de diagnóstico de hardware</span>
    <span>Feito para funcionar no navegador</span></footer></div>`;
}
function stopWatch() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  clearInterval(interval);
  interval = null;
}
function home() {
  stopWatch(); mode = ''; code = ''; room = null;
  root(`<main class="hero"><div><div class="tag">🔧 LABORATÓRIO DE DIAGNÓSTICO</div>
    <h1>Você consegue <span>descobrir o defeito?</span></h1>
    <p>Investigue problemas de computadores, responda antes do tempo acabar e dispute o pódio!</p>
    <div class="toolbar"><div class="tag">${questions.length} questões</div><div class="tag">100–200 pts por acerto</div>
    <div class="tag">30 segundos</div><div class="tag bonus-tag">⚡ Rodadas 2×</div></div></div>
    <div><section class="panel stack"><h2>Entrar em uma partida</h2>
    <label class="field">Código da sala<input id="joincode" placeholder="Ex.: AB12CD" maxlength="6" autocomplete="off" style="text-transform:uppercase"></label>
    <label class="field">Seu nome ou apelido<input id="nickname" placeholder="Como você aparecerá no ranking" maxlength="22"></label>
    <button class="btn primary full" id="join">ENTRAR NO DESAFIO →</button><div class="separator"></div>
    <button class="btn ghost full" id="host">SOU O APRESENTADOR</button></section></div></main>`);
  $('join').onclick = joinRoom;
  $('host').onclick = hostLogin;
  const qs = new URLSearchParams(location.search);
  if (qs.get('s')) $('joincode').value = qs.get('s').slice(0, 6).toUpperCase();
}
async function ensureAnonymous() {
  if (!auth.currentUser) await signInAnonymously(auth);
  else if (!auth.currentUser.isAnonymous) { await signOut(auth); await signInAnonymously(auth); }
  user = auth.currentUser;
}
async function joinRoom() {
  try {
    const roomCode = $('joincode').value.trim().toUpperCase();
    const nick = $('nickname').value.trim().replace(/\s+/g, ' ');
    if (!/^[A-Z0-9]{6}$/.test(roomCode)) return notice('Digite um código de sala com 6 caracteres.');
    if (nick.length < 2 || nick.length > 22) return notice('Digite um nome com 2 a 22 caracteres.');
    await ensureAnonymous();
    const snap = await get(ref(db, 'rooms/' + roomCode));
    if (!snap.exists()) return notice('Essa sala não existe.');
    const state = snap.val();
    if (state.phase === 'finished') return notice('Esta partida já terminou.');
    if (state.phase !== 'lobby' && !state.players?.[user.uid]) return notice('Partida em andamento. Aguarde uma nova sala.');
    if (!state.players?.[user.uid]) {
      await set(ref(db, `rooms/${roomCode}/players/${user.uid}`), {
        name: nick, score: 0, joinedAt: serverTimestamp()
      });
    }
    code = roomCode; mode = 'player'; watchRoom();
  } catch (e) { err(e); }
}
function hostLogin() {
  stopWatch();
  root(`<div class="panel" style="max-width:520px;margin:65px auto"><div class="tag">PAINEL DO INSTRUTOR</div>
    <h2 style="margin-top:16px">Acessar como apresentador</h2>
    <p class="muted">Use a conta criada no Firebase Authentication. Os jogadores entram só com um apelido.</p>
    <div class="stack"><label class="field">E-mail<input id="email" type="email" autocomplete="email"></label>
    <label class="field">Senha<input id="password" type="password" autocomplete="current-password"></label>
    <button id="login" class="btn primary full">ENTRAR</button><button id="back" class="btn ghost full">VOLTAR</button></div></div>`);
  $('back').onclick = home;
  $('login').onclick = async () => {
    try {
      await signInWithEmailAndPassword(auth, $('email').value.trim(), $('password').value);
      user = auth.currentUser; hostDashboard();
    } catch (e) { err(e); }
  };
}
function hostDashboard() {
  stopWatch(); mode = 'admin';
  root(`<div class="panel" style="max-width:730px;margin:45px auto">
    <div class="tag">🛡️ ADMINISTRADOR</div><h2 style="margin-top:15px">Controle do desafio</h2>
    <p class="muted">Crie uma sala e projete o código. Em cada partida, ${DOUBLE_ROUNDS} questões são sorteadas para valer o dobro.</p>
    <div class="statrow"><div class="stat"><strong>${questions.length}</strong><small>questões</small></div>
    <div class="stat"><strong>30s</strong><small>por rodada</small></div>
    <div class="stat"><strong>2×</strong><small>rodadas surpresa</small></div></div>
    <div class="toolbar"><button id="new" class="btn primary">+ CRIAR SALA</button>
    <button id="logout" class="btn ghost">SAIR</button></div></div>`);
  $('new').onclick = createRoom;
  $('logout').onclick = async () => { await signOut(auth); home(); };
}
// Sorteia exatamente 5 questões diferentes. O sorteio é feito uma vez por partida,
// e o multiplicador passa a ser público apenas na rodada que começa.
function pickDoubleRounds() {
  const ids = Array.from({ length: questions.length }, (_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, Math.min(DOUBLE_ROUNDS, questions.length)).sort((a,b) => a-b);
}
async function createRoom() {
  try {
    if (!auth.currentUser || auth.currentUser.isAnonymous) return notice('Entre com a conta de apresentador.');
    let roomCode = '';
    for (let i = 0; i < 10; i++) {
      const candidate = Math.random().toString(36).slice(2, 8).toUpperCase();
      if (/^[A-Z0-9]{6}$/.test(candidate) && !(await get(ref(db, 'rooms/' + candidate))).exists()) {
        roomCode = candidate; break;
      }
    }
    if (!roomCode) throw Error('Não foi possível gerar um código de sala. Tente novamente.');
    code = roomCode; mode = 'host';
    await set(ref(db, 'rooms/' + code), {
      hostUid: auth.currentUser.uid,
      createdAt: serverTimestamp(), phase: 'lobby', index: -1, endsAt: 0,
      multiplier: 1, bonusRounds: pickDoubleRounds(), players: {}, answers: {}
    });
    watchRoom();
  } catch (e) { err(e); }
}
function watchRoom() {
  stopWatch();
  unsubscribe = onValue(ref(db, 'rooms/' + code), snap => {
    room = snap.val();
    if (!room) { notice('Sala encerrada.'); home(); return; }
    renderRoom();
  }, err);
}
function players() {
  return Object.entries(room?.players || {}).map(([uid, p]) => ({ uid, ...p }))
    .sort((a,b) => (b.score || 0) - (a.score || 0) || (a.joinedAt || 0) - (b.joinedAt || 0));
}
function rankRow(p, rank) {
  return `<div class="rank ${rank < 3 ? 'top-rank rank-' + (rank+1) : ''}">
    <div class="pos">${rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '#' + (rank+1)}</div>
    <div class="name">${escapeHTML(p.name)}${p.uid === user?.uid ? ' <span class="mini muted">(você)</span>' : ''}</div>
    <div class="score">${fmt(p.score)}<span class="mini muted"> pts</span></div></div>`;
}
function leaderboard() {
  const ps = players();
  if (!ps.length) return '<p class="muted">Aguardando participantes…</p>';
  const top = ps.slice(0,3).map(rankRow).join('');
  const rest = ps.length > 3 ? `<div class="rest-title">DEMAIS PARTICIPANTES</div>${ps.slice(3).map((p,i) => rankRow(p, i+3)).join('')}` : '';
  return `<div class="top-three">${top}</div>${rest}`;
}
function podium() {
  const ps = players().slice(0, 3);
  if (!ps.length) return '';
  const titles = ['CAMPEÃO','2º LUGAR','3º LUGAR'];
  const medals = ['🥇','🥈','🥉'];
  return `<div class="podium">${ps.map((p,i) => `<div class="podium-place podium-${i+1}">
    <div class="podium-medal">${medals[i]}</div><div class="podium-title">${titles[i]}</div>
    <div class="podium-name">${escapeHTML(p.name)}</div>
    <div class="podium-points">${fmt(p.score)} pontos</div></div>`).join('')}</div>`;
}
function headerStats() {
  const remaining = room.phase === 'question' ? Math.max(0, Math.ceil((room.endsAt - serverNow()) / 1000)) : '—';
  return `<div class="statrow"><div class="stat"><strong>${players().length}</strong><small>participantes</small></div>
    <div class="stat"><strong>${Math.max(0, Number(room.index ?? -1)+1)}/${questions.length}</strong><small>questão</small></div>
    <div class="stat"><strong id="timer">${remaining}</strong><small>segundos</small></div></div>`;
}
function pointsForCorrectAnswer(answer, endTime, multiplier) {
  // O Firebase resolve serverTimestamp() para milissegundos inteiros no servidor.
  const at = Number(answer?.at);
  if (!Number.isFinite(at) || at <= 0) return 0;
  const remainingMs = Math.max(0, Math.min(ROUND_MS, endTime - at));
  return roundScore((BASE_POINTS + SPEED_POINTS * remainingMs / ROUND_MS) * multiplier);
}
function everybodyAnswered(state) {
  if (state?.phase !== 'question') return false;
  const ids = Object.keys(state.players || {});
  const answers = state.answers?.[state.index] || {};
  return ids.length > 0 && ids.every(uid => Object.hasOwn(answers, uid));
}
function scoreRound(state) {
  const i = Number(state.index);
  if (!Number.isInteger(i) || !questions[i]) return;
  const answers = state.answers?.[i] || {};
  const mult = Number(state.multiplier) === 2 ? 2 : 1;
  for (const [uid, answer] of Object.entries(answers)) {
    if (state.players?.[uid] && answer.choice === questions[i].c) {
      const earned = pointsForCorrectAnswer(answer, state.endsAt, mult);
      state.players[uid].score = roundScore((Number(state.players[uid].score) || 0) + earned);
    }
  }
  state.scoredEndsAt = state.endsAt;
  state.endsAt = 0;
}
function selectedScore() {
  const a = room?.answers?.[room.index]?.[user?.uid];
  const q = questions[room.index];
  if (!a || !q || room.phase !== 'reveal') return null;
  return a.choice === q.c ? pointsForCorrectAnswer(a, room.scoredEndsAt || 0, Number(room.multiplier) === 2 ? 2 : 1) : 0;
}
function renderRoom() {
  if (!room) return;
  const isHost = mode === 'host', isPlayer = mode === 'player';
  if (isHost && room.hostUid !== user?.uid) { notice('Você não é o organizador desta sala.'); home(); return; }
  const q = questions[room.index];
  const live = room.phase === 'question', reveal = room.phase === 'reveal';
  const finished = room.phase === 'finished', waiting = room.phase === 'lobby';
  const multiplier = Number(room.multiplier) === 2 ? 2 : 1;
  const selected = room.answers?.[room.index]?.[user?.uid]?.choice;
  const mine = selected !== undefined;
  const open = live && room.endsAt > serverNow();
  const answered = Object.keys(room.answers?.[room.index] || {}).length;
  const progress = live ? Math.max(0, Math.min(100,(room.endsAt - serverNow()) / ROUND_MS * 100)) : 0;
  let content = '';

  if (waiting) {
    content = `<div class="panel center"><div class="bigicon">🧠</div><div class="eyebrow">SALA DE ESPERA</div>
      <h2>${isHost ? 'Tudo pronto para começar!' : 'Aguardando o apresentador…'}</h2>
      <p class="muted">${isHost ? 'Projete o código e espere os visitantes entrarem.' : 'Você já está na sala. A partida começa em instantes.'}</p>
      <div class="notice">⚡ Respostas certas valem 100 a 200 pontos. Pontuação considera até os milissegundos! Em 5 rodadas surpresa, tudo vale <strong>2×</strong>.</div>
      ${isHost ? '<div style="margin-top:16px"><button id="start" class="btn primary">▶ INICIAR DESAFIO</button></div>' : ''}</div>`;
  } else if (finished) {
    content = `<div class="panel center"><div class="bigicon">🏆</div><div class="eyebrow">DESAFIO CONCLUÍDO</div>
      <h2>Os três melhores do laboratório!</h2>${podium()}
      <p class="muted">Obrigado por participar do nosso Laboratório de Diagnóstico.</p>
      ${isHost ? '<button id="restart" class="btn primary">↻ REINICIAR COM A MESMA TURMA</button>' : ''}</div>`;
  } else if (q) {
    const result = selectedScore();
    const note = reveal
      ? `<div class="notice"><strong>💡 Diagnóstico:</strong> ${escapeHTML(q.e)}</div>
         ${isPlayer ? `<div class="earned ${result > 0 ? 'earned-good' : ''}">${result == null ? 'Você não respondeu a esta questão.' : result > 0 ? '✅ Você ganhou ' + fmt(result) + ' pontos!' : 'Você não pontuou nesta rodada.'}</div>` : ''}`
      : isPlayer
        ? mine ? '<div class="notice">✅ Resposta enviada! A questão será revelada quando todos responderem ou o tempo terminar.</div>'
               : !open ? '<div class="notice">⏰ Tempo encerrado. Aguarde o apresentador.</div>'
                       : '<p class="muted mini">Escolha uma alternativa: cada milissegundo conta!</p>'
        : `<p class="muted">${answered} de ${players().length} participantes responderam. A resposta será revelada automaticamente quando todos responderem ou o tempo acabar.</p>`;

    content = `<div class="panel">
      <div class="question-header"><span class="tag">QUESTÃO ${room.index + 1} DE ${questions.length}</span>
      <span class="tag ${multiplier === 2 ? 'bonus-tag bonus-glow' : ''}">${multiplier === 2 ? '⚡ RODADA 2×' : live ? '⏱ RESPONDENDO' : '✅ RESPOSTA REVELADA'}</span></div>
      ${multiplier === 2 ? '<div class="bonus-banner">⚡ PONTUAÇÃO EM DOBRO — ACERTO VALE DE 200 A 400 PONTOS!</div>' : ''}
      <div class="question">${escapeHTML(q.q)}</div>
      <div class="progress"><div id="timebar" style="width:${progress}%"></div></div>
      <div class="answers">${q.a.map((v,i) => {
        const status = reveal ? (i === q.c ? 'correct' : i === selected ? 'wrong' : '') : i === selected ? 'selected' : '';
        return `<button class="answer ${status}" data-choice="${i}" ${!isPlayer || !open || mine ? 'disabled' : ''}><small>${'ABCD'[i]}</small>${escapeHTML(v)}</button>`;
      }).join('')}</div>
      ${note}
      ${isHost ? `<div class="toolbar"><button id="advance" class="btn ${live ? 'warning' : 'primary'}">${live ? '✓ REVELAR AGORA' : room.index === questions.length-1 ? '🏆 FINALIZAR PARTIDA' : 'PRÓXIMA QUESTÃO →'}</button></div>` : ''}
    </div>`;
  } else {
    content = '<div class="panel">Carregando questão…</div>';
  }

  const entryURL = location.origin + location.pathname + '?s=' + code;
  root(`<div class="toolbar room-top" style="justify-content:space-between;margin-bottom:18px">
    <div><div class="eyebrow">${isHost ? 'PAINEL DO APRESENTADOR' : 'PARTICIPANTE'}</div>
    <div style="font:700 23px 'Space Grotesk'">Sala <span style="color:#6cdeed">${escapeHTML(code)}</span></div></div>
    <div class="toolbar room-actions">${isHost && !finished ? '<button class="btn danger" id="endgame">■ ENCERRAR PARTIDA</button>' : ''}<button class="btn ghost" id="leave">${isHost ? 'FECHAR PAINEL' : 'SAIR'}</button></div></div>
    ${headerStats()}
    <div class="game-layout"><div class="game-primary">${content}</div>
    <div class="game-sidebar"><section class="panel"><h3>🏆 TOP 3 — Ranking ao vivo</h3>${leaderboard()}</section>
    ${isHost ? `<section class="panel"><h3>Convide os jogadores</h3><div class="center">
      <img class="qr" alt="QR Code para entrar" src="https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(entryURL)}">
      <p class="linkbox">${escapeHTML(entryURL)}</p>
      <button id="copy" class="btn ghost full">COPIAR LINK DA SALA</button></div>
      <p class="muted mini">O QR Code usa um serviço externo. Também dá para entrar digitando o código.</p></section>` : ''}</div></div>`);
  $('leave').onclick = () => { if (confirm(isHost ? 'Sair do painel? A sala continuará aberta.' : 'Sair do jogo?')) home(); };
  if ($('endgame')) $('endgame').onclick = () => {
    const message = live
      ? 'Encerrar a partida agora? As respostas JÁ enviadas nesta questão serão pontuadas e o pódio será exibido para todos.'
      : 'Encerrar a partida agora e exibir o pódio para todos?';
    if (confirm(message)) advance('finishNow');
  };
  if ($('start')) $('start').onclick = () => advance('start');
  if ($('advance')) $('advance').onclick = () => advance(live ? 'reveal' : room.index === questions.length-1 ? 'finish' : 'next');
  if ($('restart')) $('restart').onclick = () => advance('restart');
  if ($('copy')) $('copy').onclick = () => navigator.clipboard.writeText(entryURL).then(() => notice('Link copiado!')).catch(() => notice(entryURL));
  document.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => submit(Number(b.dataset.choice)));

  clearInterval(interval);
  interval = setInterval(() => {
    const left = room?.phase === 'question' ? Math.max(0,Math.ceil((room.endsAt - serverNow()) / 1000)) : '—';
    if ($('timer')) $('timer').textContent = left;
    if ($('timebar')) $('timebar').style.width = `${Math.max(0,Math.min(100,(room.endsAt - serverNow()) / ROUND_MS * 100))}%`;
    if (mode === 'player' && room?.phase === 'question' && room.endsAt <= serverNow()) {
      document.querySelectorAll('[data-choice]').forEach(b => b.disabled = true);
    }
    // O apresentador mantém a sala sincronizada. Transação evita pontuação duplicada.
    if (mode === 'host' && room?.phase === 'question' &&
        (everybodyAnswered(room) || room.endsAt <= serverNow())) {
      advance('reveal');
    }
  }, 150);
}
async function submit(choice) {
  try {
    if (mode !== 'player' || room.phase !== 'question' || serverNow() >= room.endsAt) return;
    if (room.answers?.[room.index]?.[user.uid]) return;
    document.querySelectorAll('[data-choice]').forEach(b => b.disabled = true);
    // Firebase grava a hora recebida pelo servidor para evitar diferenças de relógio entre celulares.
    await set(ref(db, `rooms/${code}/answers/${room.index}/${user.uid}`), {
      choice, at: serverTimestamp()
    });
  } catch (e) { err(e); renderRoom(); }
}
async function advance(action) {
  if (hostBusy || mode !== 'host' || !user) return;
  hostBusy = true;
  try {
    const result = await runTransaction(ref(db, 'rooms/' + code), current => {
      // Uma transação em toda a sala impede computar a mesma rodada duas vezes,
      // inclusive se o operador abriu o painel em duas abas.
      if (!current || current.hostUid !== user.uid) return;
      if (action === 'start' || action === 'next') {
        if (action === 'start' && current.phase !== 'lobby') return;
        if (action === 'next' && current.phase !== 'reveal') return;
        const i = action === 'start' ? 0 : current.index + 1;
        if (i >= questions.length) return;
        current.index = i;
        current.phase = 'question';
        current.endsAt = serverNow() + ROUND_MS;
        current.scoredEndsAt = 0;
        current.multiplier = (current.bonusRounds || []).includes(i) ? 2 : 1;
      } else if (action === 'reveal') {
        if (current.phase !== 'question') return;
        scoreRound(current);
        current.phase = 'reveal';
      } else if (action === 'finishNow') {
        if (current.phase === 'finished') return;
        // Encerrar durante uma rodada não joga fora respostas já enviadas.
        if (current.phase === 'question') scoreRound(current);
        current.phase = 'finished';
        current.endsAt = 0;
      } else if (action === 'restart') {
        if (current.phase !== 'finished') return;
        current.phase = 'lobby';
        current.index = -1;
        current.endsAt = 0;
        current.scoredEndsAt = 0;
        current.multiplier = 1;
        current.bonusRounds = pickDoubleRounds();
        current.answers = null;
        for (const p of Object.values(current.players || {})) p.score = 0;
      } else if (action === 'finish') {
        if (current.phase !== 'reveal' || current.index !== questions.length-1) return;
        current.phase = 'finished';
        current.endsAt = 0;
      } else return;
      return current;
    }, { applyLocally: false });
    if (!result.committed && !['reveal', 'finish'].includes(action))
      notice('Ação não aplicada. Confira o estado da partida.');
  } catch (e) { err(e); }
  finally { hostBusy = false; }
}

if (!configured) {
  root(`<div class="panel" style="max-width:680px;margin:80px auto"><div class="tag">⚙ CONFIGURAÇÃO INICIAL</div>
    <h2 style="margin-top:16px">Seu site está pronto para conectar ao Firebase</h2>
    <p class="muted">Preencha o arquivo <strong>firebase-config.js</strong> com as configurações públicas do seu projeto Firebase e publique no GitHub Pages.</p>
    <p class="notice">Não publique senhas nem chaves privadas.</p></div>`);
} else {
  try {
    const firebase = initializeApp(firebaseConfig);
    auth = getAuth(firebase);
    db = getDatabase(firebase);
    onValue(ref(db, '.info/serverTimeOffset'), snap => { serverOffset = Number(snap.val()) || 0; });
    onAuthStateChanged(auth, u => { user = u; if (!mode) home(); });
    home();
  } catch (e) { err(e); }
}
