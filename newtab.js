const storage = chrome?.storage?.local;

const DEFAULT_LINKS = [
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Bilibili', url: 'https://www.bilibili.com' },
  { title: '知乎', url: 'https://www.zhihu.com' },
  { title: 'V2EX', url: 'https://www.v2ex.com' }
];

const FALLBACK_HOT_LIST = [
  { title: '示例热榜 #1（网络受限时展示）', url: 'https://tophub.today' },
  { title: '示例热榜 #2（可替换为你的目标站）', url: 'https://tophub.today' },
  { title: '示例热榜 #3', url: 'https://tophub.today' }
];

const qs = (id) => document.getElementById(id);

function tickClock() {
  const now = new Date();
  qs('clock').textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
}
setInterval(tickClock, 1000);
tickClock();

async function getStored(keys) {
  if (!storage) return {};
  return storage.get(keys);
}

async function setStored(payload) {
  if (!storage) return;
  await storage.set(payload);
}

async function loadHotList() {
  const list = qs('hotList');
  list.innerHTML = '<li>加载中...</li>';

  try {
    const res = await fetch('https://r.jina.ai/http://tophub.today/', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const items = [...text.matchAll(/^\d+\.\s+\[(.+?)\]\((https?:\/\/[^)]+)\)/gm)]
      .slice(0, 12)
      .map((m) => ({ title: m[1].trim(), url: m[2].trim() }));
    renderHotList(items.length ? items : FALLBACK_HOT_LIST);
  } catch {
    renderHotList(FALLBACK_HOT_LIST);
  }
}

function renderHotList(items) {
  const list = qs('hotList');
  list.innerHTML = '';
  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="rank">${idx + 1}.</span><a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a>`;
    list.appendChild(li);
  });
}

async function loadCountdown() {
  const { countdown } = await getStored(['countdown']);
  renderCountdown(countdown);
}

function renderCountdown(countdown) {
  const out = qs('countdownResult');
  if (!countdown?.date || !countdown?.title) {
    out.textContent = '暂无倒数日';
    return;
  }
  const target = new Date(`${countdown.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / 86400000);
  if (diff > 0) out.textContent = `${countdown.title}：还剩 ${diff} 天`;
  else if (diff === 0) out.textContent = `${countdown.title}：就是今天 🎉`;
  else out.textContent = `${countdown.title}：已过去 ${Math.abs(diff)} 天`;
}

async function loadTodos() {
  const { todos = [] } = await getStored(['todos']);
  renderTodos(todos);
}

function renderTodos(todos) {
  const list = qs('todoList');
  const tpl = qs('todoItemTemplate');
  list.innerHTML = '';
  todos.forEach((todo, index) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const checkbox = node.querySelector('input[type="checkbox"]');
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

async function loadLinks() {
  const { links = DEFAULT_LINKS } = await getStored(['links']);
  renderLinks(links);
}

function renderLinks(links) {
  const grid = qs('linkGrid');
  const tpl = qs('linkCardTemplate');
  grid.innerHTML = '';
  links.forEach((link) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.href = link.url;
    node.textContent = link.title;
    grid.appendChild(node);
  });
}

qs('refreshHot').addEventListener('click', loadHotList);
qs('countdownForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = qs('countdownTitle').value.trim();
  const date = qs('countdownDate').value;
  if (!title || !date) return;
  const countdown = { title, date };
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
  await Promise.all([loadHotList(), loadCountdown(), loadTodos(), loadLinks()]);
})();
