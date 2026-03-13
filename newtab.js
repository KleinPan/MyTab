const storage = chrome?.storage?.local;
const qs = (id) => document.getElementById(id);

const PORTAL_SOURCES = [
  {
    id: 'zhihu',
    name: '知乎热榜',
    async fetcher() {
      const res = await fetch('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=12');
      if (!res.ok) throw new Error('知乎接口失败');
      const data = await res.json();
      return (data.data || []).slice(0, 12).map((item) => ({
        title: item.target?.title || '知乎热点',
        url: `https://www.zhihu.com/question/${item.target?.id}`
      }));
    }
  },
  {
    id: 'bilibili',
    name: 'B站热门',
    async fetcher() {
      const res = await fetch('https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all');
      if (!res.ok) throw new Error('B站接口失败');
      const data = await res.json();
      return (data.data?.list || []).slice(0, 12).map((item) => ({
        title: item.title,
        url: `https://www.bilibili.com/video/${item.bvid}`
      }));
    }
  },
  {
    id: 'weibo',
    name: '微博热搜',
    async fetcher() {
      const res = await fetch('https://weibo.com/ajax/side/hotSearch');
      if (!res.ok) throw new Error('微博接口失败');
      const data = await res.json();
      return (data.data?.realtime || []).slice(0, 12).map((item) => ({
        title: item.word,
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`
      }));
    }
  }
];

const FALLBACK_BY_SOURCE = {
  zhihu: [{ title: '知乎示例热点', url: 'https://www.zhihu.com/hot' }],
  bilibili: [{ title: 'B站示例热点', url: 'https://www.bilibili.com' }],
  weibo: [{ title: '微博示例热搜', url: 'https://s.weibo.com/top/summary' }]
};

const DEFAULT_LINKS = [
  { title: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { title: '掘金', url: 'https://juejin.cn', icon: '⚡' },
  { title: '少数派', url: 'https://sspai.com', icon: '📰' },
  { title: 'V2EX', url: 'https://www.v2ex.com', icon: '💬' },
  { title: '即刻', url: 'https://web.okjike.com', icon: '🌟' },
  { title: 'Product Hunt', url: 'https://www.producthunt.com', icon: '🚀' }
];

let sourceCache = {};
let activeSource = PORTAL_SOURCES[0].id;

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

function renderTabs() {
  const tabs = qs('sourceTabs');
  tabs.innerHTML = '';
  PORTAL_SOURCES.forEach((s) => {
    const tab = document.createElement('button');
    tab.className = `source-tab ${s.id === activeSource ? 'active' : ''}`;
    tab.textContent = s.name;
    tab.addEventListener('click', () => {
      activeSource = s.id;
      renderTabs();
      renderHotList(sourceCache[activeSource] || FALLBACK_BY_SOURCE[activeSource], s.name);
    });
    tabs.appendChild(tab);
  });
}

function renderHotList(items, sourceName) {
  const list = qs('hotList');
  list.innerHTML = '';
  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'hot-item';
    li.innerHTML = `<span class="rank">${idx + 1}</span><a href="${item.url}" target="_blank" rel="noreferrer noopener">${item.title}</a><span class="source-tag">${sourceName}</span>`;
    list.appendChild(li);
  });
}

async function loadHotForSource(source) {
  try {
    const items = await source.fetcher();
    sourceCache[source.id] = items.length ? items : FALLBACK_BY_SOURCE[source.id];
  } catch {
    sourceCache[source.id] = FALLBACK_BY_SOURCE[source.id];
  }
}

async function loadAllHot() {
  qs('hotList').innerHTML = '<li class="hot-item"><span class="rank">…</span><span>正在抓取多个门户热榜</span><span class="source-tag">加载中</span></li>';
  await Promise.all(PORTAL_SOURCES.map(loadHotForSource));
  const active = PORTAL_SOURCES.find((s) => s.id === activeSource);
  renderHotList(sourceCache[activeSource], active.name);
}

function renderCountdown(c) {
  const out = qs('countdownResult');
  if (!c?.title || !c?.date) {
    out.textContent = '暂无倒数日';
    return;
  }
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

qs('refreshHot').addEventListener('click', async () => {
  await loadAllHot();
  renderTabs();
});
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
  const { countdown, todos = [], links = DEFAULT_LINKS } = await getStored(['countdown', 'todos', 'links']);
  renderTabs();
  renderCountdown(countdown);
  renderTodos(todos);
  renderLinks(links);
  await loadAllHot();
})();
