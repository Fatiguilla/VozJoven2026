
const LVJ_KEY = 'lvj_publicaciones_v2';

const SUPABASE_URL = 'https://wsfdjmhpfqwunyguloqo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-1dCf4mJ0AgDVKXXUt7Z9g_wOA-jgmt';

const lvjSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const LVJ_CATS = [
  'Presentación', 'Opinión personal', 'Educación', 'Salud',
  'Cultura', 'Investigación', 'Desarrollo local', 'Deporte',
  'Matando el tiempo', 'Tu opinión cuenta', 'Clasificados'
];

const LVJ_SLUGS = {
  'Presentación': 'presentacion',
  'Opinión personal': 'opinion-personal',
  'Educación': 'educacion',
  'Salud': 'salud',
  'Cultura': 'cultura',
  'Investigación': 'investigacion',
  'Desarrollo local': 'desarrollo-local',
  'Deporte': 'deporte',
  'Matando el tiempo': 'matando-el-tiempo',
  'Tu opinión cuenta': 'tu-opinion-cuenta',
  'Clasificados': 'clasificados'
};

const lvjEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const lvjDate = s => {
  if (!s) return 'Fecha no indicada';
  const [y, m, d] = s.split('-').map(Number);
  return new Intl.DateTimeFormat('es-BO', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(y, m - 1, d));
};

const lvjLocalPosts = () => {
  try {
    return JSON.parse(localStorage.getItem(LVJ_KEY) || '[]');
  } catch {
    return [];
  }
};

// Convierte las columnas de Supabase al formato que ya usa la web.
const lvjFromDatabase = row => ({
  id: row.id,
  title: row.title,
  category: row.category,
  date: row.date,
  author: row.author || '',
  summary: row.summary || '',
  text: row.content || '',
  cover: row.cover_url || '',
  coverAlt: row.cover_alt || '',
  coverCaption: row.cover_caption || '',
  gallery: Array.isArray(row.gallery) ? row.gallery : [],
  createdAt: row.created_at
    ? new Date(row.created_at).getTime()
    : 0
});

// Lee las noticias compartidas.
// Si la tabla está vacía, usa temporalmente el respaldo local.
async function lvjPosts() {
  const { data, error } = await lvjSupabase
    .from('posts')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('No se pudieron cargar las noticias de Supabase:', error);
    return lvjLocalPosts();
  }

  if (data.length === 0) {
    return lvjLocalPosts();
  }

  return data.map(lvjFromDatabase);
}

// Se conserva temporalmente para el código antiguo.
// No usarla para guardar publicaciones nuevas en Supabase.
const lvjSave = p => {
  localStorage.setItem(LVJ_KEY, JSON.stringify(p));
};

const lvjSlug = s => LVJ_SLUGS[s] || 'presentacion';

function lvjCard(p) {
  return `<article class="publication-card">
    ${p.cover ? `<a href="articulo.html?id=${encodeURIComponent(p.id)}">
      <img class="news-thumb" src="${lvjEsc(p.cover)}"
        alt="${lvjEsc(p.coverAlt || p.title)}">
    </a>` : ''}
    <span class="publication-card__category">${lvjEsc(p.category)}</span>
    <h3><a class="news-title-link"
      href="articulo.html?id=${encodeURIComponent(p.id)}">${lvjEsc(p.title)}</a></h3>
    <p class="publication-date-small">${lvjEsc(lvjDate(p.date))}</p>
    ${p.summary ? `<p>${lvjEsc(p.summary)}</p>` : ''}
    <div class="publication-card__footer">
      <small>${p.author ? 'Por ' + lvjEsc(p.author) : 'La Voz Joven'}</small>
      <a href="articulo.html?id=${encodeURIComponent(p.id)}">Leer noticia →</a>
    </div>
  </article>`;
}

async function lvjSectionRender(category) {
  const el = document.querySelector('#sectionNews');
  if (!el) return;

  el.innerHTML = '<p class="empty-news">Cargando noticias...</p>';

  const q = (document.querySelector('#filterTitle')?.value || '')
    .toLocaleLowerCase('es');
  const date = document.querySelector('#filterDate')?.value || '';

  const allPosts = await lvjPosts();
  const posts = allPosts
    .filter(p =>
      p.category === category &&
      (!q || (p.title || '').toLocaleLowerCase('es').includes(q)) &&
      (!date || p.date === date)
    )
    .sort((a, b) =>
      (b.date || '').localeCompare(a.date || '') ||
      (b.createdAt || 0) - (a.createdAt || 0)
    );

  el.innerHTML = posts.length
    ? posts.map(lvjCard).join('')
    : '<p class="empty-news">Todavía no hay noticias en esta sección. Vuelve pronto para conocer las novedades.</p>';

  const count = document.querySelector('#resultCount');
  if (count) count.textContent = `${posts.length} noticia(s)`;
}

async function lvjHomeRender() {
  const el = document.querySelector('#dateArchive');
  if (!el) return;

  el.innerHTML = '<p class="empty-news">Cargando noticias...</p>';

  const posts = (await lvjPosts()).sort((a, b) =>
    (b.date || '').localeCompare(a.date || '') ||
    (b.createdAt || 0) - (a.createdAt || 0)
  );

  el.innerHTML = posts.length
    ? `<div class="publication-grid">${posts.map(lvjCard).join('')}</div>`
    : '<p class="empty-news">Todavía no hay publicaciones guardadas.</p>';
}

async function lvjArticleRender() {
  const el = document.querySelector('#articleContent');
  if (!el) return;

  el.innerHTML = '<p class="empty-news">Cargando artículo...</p>';

  const id = new URLSearchParams(location.search).get('id');
  const posts = await lvjPosts();
  const p = posts.find(x => String(x.id) === String(id));

  if (!p) {
    el.innerHTML = '<h1>Noticia no encontrada</h1><p>Es posible que la publicación no exista o todavía no se haya importado.</p>';
    return;
  }

  el.innerHTML = `
    <a class="section-kicker" href="${lvjSlug(p.category)}.html">${lvjEsc(p.category)}</a>
    <h1>${lvjEsc(p.title)}</h1>
    <p class="article-meta">${lvjEsc(lvjDate(p.date))} · ${p.author ? 'Por ' + lvjEsc(p.author) : 'La Voz Joven'}</p>
    ${p.cover ? `<figure>
      <img class="article-cover" src="${lvjEsc(p.cover)}" alt="${lvjEsc(p.coverAlt || p.title)}">
      ${p.coverCaption ? `<figcaption>${lvjEsc(p.coverCaption)}</figcaption>` : ''}
    </figure>` : ''}
    ${p.summary ? `<p class="article-summary">${lvjEsc(p.summary)}</p>` : ''}
    <div class="article-body">${
      lvjEsc(p.text || '').split(/\n\s*\n/)
        .map(t => `<p>${t.replace(/\n/g, '<br>')}</p>`).join('')
    }</div>
    ${(p.gallery || []).length ? `
      <h2>Galería de imágenes</h2>
      <div class="news-gallery">
        ${p.gallery.map((g, i) => `<figure>
          <img src="${lvjEsc(g.url || g.src || '')}" alt="${lvjEsc(g.alt || 'Fotografía ' + (i + 1))}">
          <figcaption>${lvjEsc(g.caption || '')}</figcaption>
        </figure>`).join('')}
      </div>` : ''}
  `;
}

// Mantiene las funciones disponibles para los scripts HTML.
window.lvjPosts = lvjPosts;
window.lvjSave = lvjSave;
window.lvjCard = lvjCard;
window.lvjSectionRender = lvjSectionRender;
window.lvjHomeRender = lvjHomeRender;
window.lvjArticleRender = lvjArticleRender;
