const storage = chrome?.storage?.local;
const qs = (id) => document.getElementById(id);

const SOURCE_DEFS = [
  { id: 'v2ex', name: 'V2EX', siteUrl: 'https://www.v2ex.com', fetchUrl: 'https://r.jina.ai/http://www.v2ex.com/' },
  { id: 'huxiu', name: '虎嗅', siteUrl: 'https://www.huxiu.com', fetchUrl: 'https://r.jina.ai/http://www.huxiu.com/' },
  { id: 'kr36', name: '36Kr', siteUrl: 'https://36kr.com', fetchUrl: 'https://r.jina.ai/http://36kr.com/' },
  { id: 'ithome', name: 'IT之家', siteUrl: 'https://www.ithome.com', fetchUrl: 'https://r.jina.ai/http://www.ithome.com/' },
  { id: 'thepaper', name: '澎湃', siteUrl: 'https://www.thepaper.cn', fetchUrl: 'https://r.jina.ai/http://www.thepaper.cn/' },
  { id: 'cls', name: '财联社', siteUrl: 'https://www.cls.cn', fetchUrl: 'https://r.jina.ai/http://www.cls.cn/' }
];

const FALLBACK_ITEMS = {
  v2ex: [{ title: 'V2EX 首页', url: 'https://www.v2ex.com' }],
  huxiu: [{ title: '虎嗅首页', url: 'https://www.huxiu.com' }],
  kr36: [{ title: '36Kr 首页', url: 'https://36kr.com' }],
  ithome: [{ title: 'IT之家首页', url: 'https://www.ithome.com' }],
  thepaper: [{ title: '澎湃首页', url: 'https://www.thepaper.cn' }],
  cls: [{ title: '财联社首页', url: 'https://www.cls.cn' }]
};

const DEFAULT_LINKS = [
  { title: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { title: 'V2EX', url: 'https://www.v2ex.com', icon: '💬' },
  { title: '虎嗅', url: 'https://www.huxiu.com', icon: '📰' },
  { title: '36Kr', url: 'https://36kr.com', icon: '📈' },
  { title: 'IT之家', url: 'https://www.ithome.com', icon: '💻' },
  { title: '澎湃', url: 'https://www.thepaper.cn', icon: '🌊' }
];

let sourceSettings = SOURCE_DEFS.map((s, idx) => ({ id: s.id, enabled: true, order: idx }));
let sourceCache = {};

function settingsSorted() {
  return [...sourceSettings].sort((a, b) => a.order - b.order);
}

function normalizeSettings(saved) {
  if (!Array.isArray(saved) || !saved.length) return sourceSettings;
  const byId = Object.fromEntries(saved.map((x) => [x.id, x]));
  sourceSettings = SOURCE_DEFS.map((s, idx) => ({
    id: s.id,
    enabled: byId[s.id]?.enabled ?? true,
    order: Number.isFinite(byId[s.id]?.order) ? byId[s.id].order : idx
  }));
  sourceSettings = settingsSorted().map((s, idx) => ({ ...s, order: idx }));
  return sourceSettings;
}

function updateClock() {
  const now = new Date();
  qs('clock').textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
  qs('today').textContent = now.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

async function getStored(keys) {
  if (!storage) return {};
  return storage.get(keys);
}
async function setStored(payload) {
  if (!storage) return;
  return storage.set(payload);
}

function parseJinaLinks(markdown, siteUrl) {
  const matches = [...markdown.matchAll(/\[(.*?)\]\((https?:\/\/[^)]+)\)/g)];
  const dedup = new Map();
  for (const [, rawTitle, rawUrl] of matches) {
    const title = rawTitle.trim();
    const url = rawUrl.trim();
    if (!title || title.length < 6) continue;
    if (!url.startsWith(siteUrl)) continue;
    if (title.includes('登录') || title.includes('注册') || title.includes('下载')) continue;
    if (!dedup.has(url)) dedup.set(url, { title, url });
    if (dedup.size >= 10) break;
  }
  return [...dedup.values()];
}

function getEnabledSources() {
  const enabled = new Set(sourceSettings.filter((s) => s.enabled).map((s) => s.id));
  return settingsSorted().map((s) => SOURCE_DEFS.find((d) => d.id === s.id)).filter((d) => enabled.has(d.id));
}

function renderSourceConfig() {
  const list = qs('sourceConfigList');
  list.innerHTML = '';
  settingsSorted().forEach((setting) => {
    const source = SOURCE_DEFS.find((s) => s.id === setting.id);
    const li = document.createElement('li');
    li.className = 'source-config-item';
    li.draggable = true;
    li.dataset.sourceId = source.id;
    li.innerHTML = `
      <span class="drag-handle">☰</span>
      <label><input type="checkbox" ${setting.enabled ? 'checked' : ''}/> ${source.name}</label>
      <span class="muted">${source.siteUrl.replace('https://', '')}</span>
    `;

    li.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', source.id);
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', async (e) => {
      e.preventDefault();
      const dragId = e.dataTransfer?.getData('text/plain');
      const targetId = source.id;
      if (!dragId || dragId === targetId) return;
      const ids = settingsSorted().map((x) => x.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      sourceSettings = ids.map((id, idx) => {
        const old = sourceSettings.find((x) => x.id === id);
        return { id, enabled: old?.enabled ?? true, order: idx };
      });
      await setStored({ sourceSettings });
      renderSourceConfig();
      renderHotCards();
    });

    li.querySelector('input').addEventListener('change', async (e) => {
      const checked = e.target.checked;
      sourceSettings = sourceSettings.map((x) => (x.id === source.id ? { ...x, enabled: checked } : x));
      await setStored({ sourceSettings });
      renderHotCards();
    });

    list.appendChild(li);
  });
}

function renderHotCards() {
  const wrap = qs('hotCards');
  const enabledSources = getEnabledSources();
  if (!enabledSources.length) {
    wrap.innerHTML = '<div class="empty">请至少开启一个数据源。</div>';
    return;
  }
  wrap.innerHTML = '';
  enabledSources.forEach((source) => {
    const card = document.createElement('article');
    card.className = 'hot-card';
    const items = sourceCache[source.id] || FALLBACK_ITEMS[source.id];
    const rows = items.slice(0, 8).map((item, idx) => `<li><span class="rank">${idx + 1}</span><a href="${item.url}" target="_blank" rel="noreferrer noopener">${item.title}</a></li>`).join('');
    card.innerHTML = `
      <div class="hot-card-head">
        <h3>${source.name}</h3>
        <a href="${source.siteUrl}" target="_blank" rel="noreferrer noopener">官网</a>
      </div>
      <ol>${rows}</ol>
    `;
    wrap.appendChild(card);
  });
}

async function loadOneSource(source) {
  try {
    const res = await fetch(source.fetchUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    const parsed = parseJinaLinks(text, source.siteUrl);
    sourceCache[source.id] = parsed.length ? parsed : FALLBACK_ITEMS[source.id];
  } catch {
    sourceCache[source.id] = FALLBACK_ITEMS[source.id];
  }
}

async function loadAllHot() {
  qs('hotCards').innerHTML = '<div class="empty">正在抓取门户热点...</div>';
  const enabled = getEnabledSources();
  await Promise.all(enabled.map(loadOneSource));
  renderHotCards();
}

function renderCountdown(c) {
  const out = qs('countdownResult');
  if (!c?.title || !c?.date) return (out.textContent = '暂无倒数日');
  const target = new Date(`${c.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / 86400000);
  out.textContent = diff > 0 ? `${c.title} · ${diff} 天` : diff === 0 ? `${c.title} · 今天` : `${c.title} · +${Math.abs(diff)} 天`;
}

function renderTodos(todos) {
  const list = qs('todoList');
  const tpl = qs('todoItemTemplate');
  list.innerHTML = '';
  todos.forEach((todo, index) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const checkbox = node.querySelector('input');
    const text = node.querySelector('span');
    const del = node.querySelector('button');
    checkbox.checked = !!todo.done;
    text.textContent = todo.text;
    checkbox.addEventListener('change', async () => {
      const { todos: latest = [] } = await getStored(['todos']);
      if (!latest[index]) return;
      latest[index].done = checkbox.checked;
      await setStored({ todos: latest });
      renderTodos(latest);
    });
    del.addEventListener('click', async () => {
      const { todos: latest = [] } = await getStored(['todos']);
      latest.splice(index, 1);
      await setStored({ todos: latest });
      renderTodos(latest);
    });
    list.appendChild(node);
  });
}

function renderLinks(links) {
  const grid = qs('linkGrid');
  const tpl = qs('linkCardTemplate');
  grid.innerHTML = '';
  links.forEach((item) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.href = item.url;
    node.querySelector('.link-badge').textContent = item.icon || '🔗';
    node.querySelector('.link-title').textContent = item.title;
    grid.appendChild(node);
  });
}

qs('refreshHot').addEventListener('click', loadAllHot);
qs('toggleConfig').addEventListener('click', () => qs('sourceConfig').classList.toggle('hidden'));
qs('countdownForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const countdown = { title: qs('countdownTitle').value.trim(), date: qs('countdownDate').value };
  if (!countdown.title || !countdown.date) return;
  await setStored({ countdown });
  renderCountdown(countdown);
});
qs('todoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = qs('todoInput');
  const text = input.value.trim();
  if (!text) return;
  const { todos = [] } = await getStored(['todos']);
  todos.unshift({ text, done: false });
  await setStored({ todos });
  input.value = '';
  renderTodos(todos);
});
qs('resetLinks').addEventListener('click', async () => {
  await setStored({ links: DEFAULT_LINKS });
  renderLinks(DEFAULT_LINKS);
});

(async function init() {
  const { countdown, todos = [], links = DEFAULT_LINKS, sourceSettings: saved } = await getStored(['countdown', 'todos', 'links', 'sourceSettings']);
  normalizeSettings(saved);
  renderSourceConfig();
  renderCountdown(countdown);
  renderTodos(todos);
  renderLinks(links);
  await loadAllHot();
})();
