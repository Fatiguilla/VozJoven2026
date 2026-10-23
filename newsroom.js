
const LVJ_KEY = 'lvj_publicaciones_v2';

// =============================================
// CONEXIÓN CON SUPABASE
// =============================================
const SUPABASE_URL = 'https://wsfdjmhpfqwunyguloqo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-1dCf4mJ0AgDVKXXUt7Z9g_wOA-jgmt';

let lvjSupabase = null;

if (window.supabase && window.supabase.createClient) {
  lvjSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
} else {
  console.error('No se cargó la biblioteca de Supabase.');
}

// =============================================
// CATEGORÍAS Y DIRECCIONES
// =============================================
const LVJ_CATS = [
  'Presentación',
  'Opinión personal',
  'Educación',
  'Salud',
  'Cultura',
  'Investigación',
  'Desarrollo local',
  'Deporte',
  'Matando el tiempo',
  'Tu opinión cuenta',
  'Clasificados'
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

const LVJ_CATEGORY_ALIASES = {
  'presentacion': 'Presentación',
  'opinión personal': 'Opinión personal',
  'opinion personal': 'Opinión personal',
  'opinion': 'Opinión personal',
  'educacion': 'Educación',
  'salud': 'Salud',
  'cultura': 'Cultura',
  'investigacion': 'Investigación',
  'desarrollo local': 'Desarrollo local',
  'desarrollo-local': 'Desarrollo local',
  'deporte': 'Deporte',
  'matando el tiempo': 'Matando el tiempo',
  'matando-el-tiempo': 'Matando el tiempo',
  'tu opinion cuenta': 'Tu opinión cuenta',
  'tu-opinion-cuenta': 'Tu opinión cuenta',
  'clasificados': 'Clasificados'
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================
const lvjEsc = value =>
  String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

const lvjDate = value => {
  if (!value) return 'Fecha no indicada';

  const parts = String(value).slice(0, 10).split('-').map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return 'Fecha no indicada';
  }

  return new Intl.DateTimeFormat('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(parts[0], parts[1] - 1, parts[2]));
};

const lvjLocalPosts = () => {
  try {
    const value = JSON.parse(localStorage.getItem(LVJ_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error('Error leyendo las noticias locales:', error);
    return [];
  }
};

const lvjNormalizeCategory = category => {
  const original = String(category || '').trim();
  const key = original.toLocaleLowerCase('es');

  return LVJ_CATEGORY_ALIASES[key] ||
    LVJ_CATEGORY_ALIASES[key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')] ||
    original;
};

const lvjSlug = category => {
  const normalized = lvjNormalizeCategory(category);
  return LVJ_SLUGS[normalized] ||
    String(category || 'presentacion')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
};

// Convierte una fila de Supabase al formato utilizado por la página.
const lvjFromDatabase = row => ({
  id: row.id,
  title: row.title || 'Sin título',
  category: lvjNormalizeCategory(row.category),
  date: row.date ? String(row.date).slice(0, 10) : '',
  author: row.author || '',
  summary: row.summary || '',
  text: row.content || '',
  cover: row.cover_url || '',
  coverAlt: row.cover_alt || '',
  coverCaption: row.cover_caption || '',
  gallery: Array.isArray(row.gallery)
    ? row.gallery.map(image => ({
        src: image.url || image.src || '',
        alt: image.alt || '',
        caption: image.caption || ''
      }))
    : [],
  createdAt: row.created_at
    ? new Date(row.created_at).getTime()
    : 0
});

// =============================================
// CARGAR NOTICIAS
// =============================================
async function lvjPosts() {
  if (!lvjSupabase) {
    console.error('Supabase no está inicializado.');
    return lvjLocalPosts();
  }

  try {
    const { data, error } = await lvjSupabase
      .from('posts')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error de Supabase al cargar noticias:', error);
      return lvjLocalPosts();
    }

    console.log('Noticias recibidas de Supabase:', data.length);

    const databasePosts = data.map(lvjFromDatabase);
    const localPosts = lvjLocalPosts();

    // La base de datos es la fuente principal.
    // Si está vacía, se utiliza el respaldo local.
    if (databasePosts.length > 0) {
      return databasePosts;
    }

    return localPosts;
  } catch (error) {
    console.error('No se pudo conectar con Supabase:', error);
    return lvjLocalPosts();
  }
}

// Conservada para compatibilidad con el código antiguo.
const lvjSave = posts => {
  localStorage.setItem(LVJ_KEY, JSON.stringify(posts));
};

// =============================================
// TARJETA DE NOTICIA
// =============================================
function lvjCard(post) {
  const articleUrl = `articulo.html?id=${encodeURIComponent(post.id)}`;
  const imageUrl = post.cover || '';

  return `
    <article class="publication-card">
      ${imageUrl ? `
        <a href="${articleUrl}">
          <img
            class="news-thumb"
            src="${lvjEsc(imageUrl)}"
            alt="${lvjEsc(post.coverAlt || post.title)}"
            loading="lazy"
          >
        </a>
      ` : ''}

      <span class="publication-card__category">
        ${lvjEsc(lvjNormalizeCategory(post.category))}
      </span>

      <h3>
        <a class="news-title-link" href="${articleUrl}">
          ${lvjEsc(post.title)}
        </a>
      </h3>

      <p class="publication-date-small">
        ${lvjEsc(lvjDate(post.date))}
      </p>

      ${post.summary ? `<p>${lvjEsc(post.summary)}</p>` : ''}

      <div class="publication-card__footer">
        <small>
          ${post.author ? `Por ${lvjEsc(post.author)}` : 'La Voz Joven'}
        </small>
        <a href="${articleUrl}">Leer noticia →</a>
      </div>
    </article>
  `;
}

// =============================================
// MOSTRAR TODAS LAS NOTICIAS EN LA PORTADA
// =============================================
async function lvjHomeRender() {
  const container = document.querySelector('#dateArchive');
  if (!container) return;

  container.innerHTML =
    '<p class="empty-news">Cargando noticias...</p>';

  const emptyState = document.querySelector('#emptyState');

  try {
    const posts = (await lvjPosts()).sort((a, b) =>
      String(b.date || '').localeCompare(String(a.date || '')) ||
      (b.createdAt || 0) - (a.createdAt || 0)
    );

    if (posts.length > 0) {
      container.innerHTML = `
        <div class="publication-grid">
          ${posts.map(lvjCard).join('')}
        </div>
      `;

      if (emptyState) emptyState.hidden = true;
    } else {
      container.innerHTML =
        '<p class="empty-news">Todavía no hay publicaciones disponibles.</p>';

      if (emptyState) emptyState.hidden = false;
    }

    console.log('Portada renderizada. Total de noticias:', posts.length);
  } catch (error) {
    console.error('Error mostrando noticias en la portada:', error);

    container.innerHTML =
      '<p class="empty-news">No se pudieron cargar las noticias. Intenta recargar la página.</p>';

    if (emptyState) emptyState.hidden = true;
  }
}

// =============================================
// MOSTRAR NOTICIAS DE UNA SECCIÓN
// =============================================
async function lvjSectionRender(category) {
  const container =
    document.querySelector('#sectionNews') ||
    document.querySelector('#categoryArchive');

  if (!container) {
    console.warn('No se encontró el contenedor de noticias de la sección.');
    return;
  }

  container.innerHTML =
    '<p class="empty-news">Cargando noticias...</p>';

  const titleInput =
    document.querySelector('#filterTitle') ||
    document.querySelector('#categorySearchTitle');

  const dateInput =
    document.querySelector('#filterDate') ||
    document.querySelector('#categorySearchDate');

  const countElement =
    document.querySelector('#resultCount') ||
    document.querySelector('#categoryResultsCount');

  const emptyElement =
    document.querySelector('#categoryEmpty');

  const query = (titleInput?.value || '').toLocaleLowerCase('es').trim();
  const date = dateInput?.value || '';
  const selectedCategory = lvjNormalizeCategory(category);

  try {
    const posts = (await lvjPosts())
      .filter(post =>
        lvjNormalizeCategory(post.category) === selectedCategory &&
        (!query || (post.title || '').toLocaleLowerCase('es').includes(query)) &&
        (!date || post.date === date)
      )
      .sort((a, b) =>
        String(b.date || '').localeCompare(String(a.date || '')) ||
        (b.createdAt || 0) - (a.createdAt || 0)
      );

    container.innerHTML = posts.length
      ? posts.map(lvjCard).join('')
      : '<p class="empty-news">Todavía no hay noticias en esta sección.</p>';

    if (countElement) {
      countElement.textContent = `${posts.length} noticia(s)`;
    }

    if (emptyElement) {
      emptyElement.hidden = posts.length > 0;
    }
  } catch (error) {
    console.error('Error mostrando noticias de la sección:', error);
    container.innerHTML =
      '<p class="empty-news">No se pudieron cargar las noticias de esta sección.</p>';
  }
}

// =============================================
// MOSTRAR UN ARTÍCULO INDIVIDUAL
// =============================================
async function lvjArticleRender() {
  const container = document.querySelector('#articleContent');
  if (!container) return;

  container.innerHTML =
    '<p class="empty-news">Cargando artículo...</p>';

  const id = new URLSearchParams(window.location.search).get('id');

  try {
    const posts = await lvjPosts();
    const post = posts.find(item => String(item.id) === String(id));

    if (!post) {
      container.innerHTML = `
        <h1>Noticia no encontrada</h1>
        <p>La publicación no existe o no se ha podido cargar desde la base de datos.</p>
      `;
      return;
    }

    const gallery = Array.isArray(post.gallery) ? post.gallery : [];

    container.innerHTML = `
      <a class="section-kicker" href="${lvjSlug(post.category)}.html">
        ${lvjEsc(lvjNormalizeCategory(post.category))}
      </a>

      <h1>${lvjEsc(post.title)}</h1>

      <p class="article-meta">
        ${lvjEsc(lvjDate(post.date))}
        · ${post.author ? `Por ${lvjEsc(post.author)}` : 'La Voz Joven'}
      </p>

      ${post.cover ? `
        <figure>
          <img
            class="article-cover"
            src="${lvjEsc(post.cover)}"
            alt="${lvjEsc(post.coverAlt || post.title)}"
          >
          ${post.coverCaption
            ? `<figcaption>${lvjEsc(post.coverCaption)}</figcaption>`
            : ''}
        </figure>
      ` : ''}

      ${post.summary
        ? `<p class="article-summary">${lvjEsc(post.summary)}</p>`
        : ''}

      <div class="article-body">
        ${(post.text || '').split(/\n\s*\n/).map(paragraph =>
          `<p>${lvjEsc(paragraph).replace(/\n/g, '<br>')}</p>`
        ).join('')}
      </div>

      ${gallery.length ? `
        <h2>Galería de imágenes</h2>
        <div class="news-gallery">
          ${gallery.map((image, index) => `
            <figure>
              ${image.src ? `
                <img
                  src="${lvjEsc(image.src)}"
                  alt="${lvjEsc(image.alt || `Fotografía ${index + 1}`)}"
                  loading="lazy"
                >
              ` : ''}
              <figcaption>${lvjEsc(image.caption || '')}</figcaption>
            </figure>
          `).join('')}
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error('Error cargando el artículo:', error);
    container.innerHTML =
      '<p class="empty-news">No se pudo cargar esta noticia.</p>';
  }
}

// =============================================
// FUNCIONES DISPONIBLES PARA LOS ARCHIVOS HTML
// =============================================
window.lvjPosts = lvjPosts;
window.lvjSave = lvjSave;
window.lvjCard = lvjCard;
window.lvjSectionRender = lvjSectionRender;
window.lvjHomeRender = lvjHomeRender;
window.lvjArticleRender = lvjArticleRender;
window.LVJ_CATS = LVJ_CATS;
window.LVJ_SLUGS = LVJ_SLUGS;
