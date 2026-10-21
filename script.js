/* LA VOZ JOVEN — versión 3
   Las noticias se pueden añadir aquí (PUBLICACIONES_CODIGO) o desde el formulario web.
   Las noticias del formulario se guardan en localStorage de este navegador.
*/
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const body = document.body;
const STORAGE_KEY = "lvj_publicaciones_v2";

// ==================== CARGA DE NOTICIAS DESDE EL CÓDIGO ====================
// Copia un objeto y cambia título, sección, fecha, autor y contenido para agregar otra noticia.
// Formato de fecha obligatorio: AAAA-MM-DD. Estas noticias aparecen en todos los navegadores
// que reciban esta versión del código, pero para actualizarlas hay que volver a publicar el sitio.
const PUBLICACIONES_CODIGO = [
  // Ejemplo para activar una noticia, elimina los // de las líneas siguientes y edita los datos:
  // { id: "codigo-001", title: "Título de ejemplo", category: "Educación", date: "2026-10-20", author: "La Voz Joven", text: "Escribe aquí el contenido completo de la noticia." }
];

const CATEGORIAS = ["Presentación","Opinión personal","Educación","Salud","Cultura","Investigación","Desarrollo local","Deporte","Matando el tiempo","Tu opinión cuenta","Clasificados"];
const categoryAnchors = {
  "Presentación":"#presentacion", "Opinión personal":"#opinion-personal", "Educación":"#educacion", "Salud":"#salud",
  "Cultura":"#cultura", "Investigación":"#investigacion", "Desarrollo local":"#desarrollo-local", "Deporte":"#deporte",
  "Matando el tiempo":"#matando-el-tiempo", "Tu opinión cuenta":"#tu-opinion-cuenta", "Clasificados":"#clasificados"
};
let categoriaActiva = null;

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function formatDate(iso) {
  if (!iso) return "Fecha no indicada";
  const [y,m,d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-BO",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(y,m-1,d));
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function loadPosts() {
  try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}
function savePosts(posts) { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }
function allPosts() {
  return [...PUBLICACIONES_CODIGO.map(p => ({...p, source:"codigo", createdAt: p.createdAt || 0})), ...loadPosts().map(p => ({...p, source:"navegador"}))];
}
function matchesFilters(post, {query="", date="", category=null}={}) {
  const q = query.trim().toLocaleLowerCase("es");
  const title = (post.title || "").toLocaleLowerCase("es");
  const matchesTitle = !q || title.includes(q);
  const matchesDate = !date || post.date === date;
  const matchesCategory = !category || post.category === category;
  return matchesTitle && matchesDate && matchesCategory;
}
function postCard(post) {
  const card = document.createElement("article");
  card.className = "publication-card";
  card.dataset.id = post.id;
  const deleteButton = post.source === "navegador" ? `<button class="delete-news" type="button" data-delete="${escapeHTML(post.id)}">Eliminar</button>` : `<span class="code-news-label">Desde el código</span>`;
  card.innerHTML = `
    <span class="publication-card__category">${escapeHTML(post.category)}</span>
    <h3>${escapeHTML(post.title)}</h3>
    <p class="publication-date-small">${escapeHTML(formatDate(post.date))}</p>
    <p>${escapeHTML(post.text).replace(/\n/g,"<br>")}</p>
    <div class="publication-card__footer"><small>${post.author ? "Por "+escapeHTML(post.author) : "La Voz Joven"}</small>${deleteButton}</div>`;
  return card;
}
function renderArchive(filter="") {
  const archive = $("#dateArchive");
  const empty = $("#emptyState");
  if (!archive || !empty) return;
  const date = $("#searchDate")?.value || "";
  let posts = allPosts().filter(p => matchesFilters(p,{query:filter,date})).sort((a,b) => (b.date||"").localeCompare(a.date||"") || (b.createdAt||0)-(a.createdAt||0));
  archive.innerHTML = "";
  if (!posts.length) {
    archive.style.display = "none"; empty.style.display = "block";
    $("#searchStatus").textContent = filter || date ? "No encontramos noticias con esos criterios." : "Todavía no hay publicaciones guardadas.";
    return;
  }
  archive.style.display = "grid"; empty.style.display = "none";
  const groups = {};
  posts.forEach(p => (groups[p.date || "Sin fecha"] ||= []).push(p));
  Object.keys(groups).sort((a,b)=>b.localeCompare(a)).forEach(day => {
    const group = document.createElement("div"); group.className = "date-group";
    group.innerHTML = `<div class="date-title"><time>${escapeHTML(day === "Sin fecha" ? day : formatDate(day))}</time><span>${groups[day].length} noticia${groups[day].length===1?"":"s"}</span></div><div class="publication-grid"></div>`;
    const grid = group.querySelector(".publication-grid"); groups[day].forEach(p=>grid.appendChild(postCard(p))); archive.appendChild(group);
  });
  $("#searchStatus").textContent = `${posts.length} noticia(s) encontradas.`;
}
function renderCategory() {
  const view = $("#categoryView");
  if (!view || !categoriaActiva) return;
  $("#categoryTitle").textContent = categoriaActiva;
  $("#categoryDescription").textContent = `Noticias de ${categoriaActiva}, ordenadas de la más reciente a la más antigua.`;
  const query = $("#categorySearchTitle").value;
  const date = $("#categorySearchDate").value;
  const posts = allPosts().filter(p=>matchesFilters(p,{query,date,category:categoriaActiva})).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||0)-(a.createdAt||0));
  const target = $("#categoryArchive"); target.innerHTML = "";
  $("#categoryResultsCount").textContent = `${posts.length} noticia(s)`;
  $("#categoryEmpty").hidden = posts.length > 0;
  if (!posts.length) return;
  const groups = {};
  posts.forEach(p=>(groups[p.date||"Sin fecha"] ||= []).push(p));
  Object.keys(groups).sort((a,b)=>b.localeCompare(a)).forEach(day=>{
    const group=document.createElement("div");group.className="date-group";
    group.innerHTML=`<div class="date-title"><time>${escapeHTML(day === "Sin fecha" ? day : formatDate(day))}</time><span>${groups[day].length} noticia(s)</span></div><div class="publication-grid"></div>`;
    groups[day].forEach(p=>group.querySelector(".publication-grid").appendChild(postCard(p)));target.appendChild(group);
  });
}
function openCategory(category) {
  categoriaActiva = category;
  $("#categoryView").hidden = false;
  body.classList.add("category-view");
  $("#categorySearchTitle").value = ""; $("#categorySearchDate").value = "";
  renderCategory(); window.scrollTo({top:0,behavior:"smooth"});
  $$(".nav-inner a[data-category]").forEach(a=>a.classList.toggle("active",a.dataset.category===category));
}
function showHome() {
  categoriaActiva = null; body.classList.remove("category-view");
  if ($("#categoryView")) $("#categoryView").hidden = true;
  $$(".nav-inner a").forEach(a=>a.classList.remove("active"));
  window.scrollTo({top:0,behavior:"smooth"});
}
function setDate() {
  $("#currentDate").textContent = new Intl.DateTimeFormat("es-BO",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(new Date());
  if ($("#year")) $("#year").textContent = new Date().getFullYear();
  if ($("#newsDate")) $("#newsDate").value = todayISO();
}
setDate(); renderArchive();

$(".brand")?.addEventListener("click", e=>{e.preventDefault();showHome();});
$("#menuToggle").addEventListener("click",()=>{const open=$("#mainNav").classList.toggle("open");$("#menuToggle").setAttribute("aria-expanded",String(open));});
$$('.nav-inner a').forEach(a=>a.addEventListener("click",e=>{
  const category = a.dataset.category;
  if (category) { e.preventDefault(); openCategory(category); }
  else if (a.classList.contains("publish-link")) { e.preventDefault(); showHome(); setTimeout(()=>goPublish(),50); }
  else if (a.getAttribute("href")==="#inicio") { e.preventDefault(); showHome(); }
  $("#mainNav").classList.remove("open"); $("#menuToggle").setAttribute("aria-expanded","false");
}));
$("#themeToggle").addEventListener("click",()=>{body.classList.toggle("dark");const dark=body.classList.contains("dark");$("#themeToggle").textContent=dark?"☀":"☾";localStorage.setItem("lvj-theme",dark?"dark":"light");});
if(localStorage.getItem("lvj-theme")==="dark"){body.classList.add("dark");$("#themeToggle").textContent="☀";}
$("#searchToggle").addEventListener("click",()=>{$("#searchPanel").classList.toggle("open");if($("#searchPanel").classList.contains("open"))setTimeout(()=>$("#searchInput").focus(),100);});
$("#searchInput").addEventListener("input",e=>renderArchive(e.target.value));
$("#searchDate")?.addEventListener("change",()=>renderArchive($("#searchInput").value));
$("#clearSearch").addEventListener("click",()=>{$("#searchInput").value="";if($("#searchDate"))$("#searchDate").value="";renderArchive();$("#searchInput").focus();});
$("#categorySearchTitle")?.addEventListener("input",renderCategory);
$("#categorySearchDate")?.addEventListener("change",renderCategory);
$("#clearCategoryFilters")?.addEventListener("click",()=>{$("#categorySearchTitle").value="";$("#categorySearchDate").value="";renderCategory();});
$("#backToHome")?.addEventListener("click",showHome);
function goPublish(){showHome();document.querySelector("#publicar").scrollIntoView({behavior:"smooth"});setTimeout(()=>$("#newsTitle").focus(),500);}
$("#goPublish").addEventListener("click",goPublish);$("#emptyPublish").addEventListener("click",goPublish);
$("#goPublishClassified").addEventListener("click",()=>{$("#newsCategory").value="Clasificados";goPublish();});
$("#publishForm").addEventListener("submit",e=>{
  e.preventDefault();
  const post={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title:$("#newsTitle").value.trim(),category:$("#newsCategory").value,date:$("#newsDate").value,author:$("#newsAuthor").value.trim(),text:$("#newsText").value.trim(),createdAt:Date.now()};
  if(!post.title||!post.date||!post.text)return;
  const posts=loadPosts();posts.push(post);savePosts(posts);renderArchive($("#searchInput").value);renderCategory();
  $("#publishMessage").textContent=`✓ Publicación guardada en este navegador: ${formatDate(post.date)}.`;
  $("#publishForm").reset();$("#newsDate").value=todayISO();setTimeout(()=>$("#publicaciones").scrollIntoView({behavior:"smooth"}),350);
});
$("#publishForm").addEventListener("reset",()=>setTimeout(()=>$("#newsDate").value=todayISO(),0));
function handleDelete(e){const btn=e.target.closest("[data-delete]");if(!btn)return;if(!confirm("¿Eliminar esta publicación guardada desde la página?"))return;savePosts(loadPosts().filter(p=>p.id!==btn.dataset.delete));renderArchive($("#searchInput").value);renderCategory();}
$("#dateArchive").addEventListener("click",handleDelete);$("#categoryArchive")?.addEventListener("click",handleDelete);
const modal=$("#articleModal");
function openModal(kicker,title,text){$("#modalKicker").textContent=kicker;$("#modalTitle").textContent=title;$("#modalText").textContent=text;modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
function closeModal(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";}
$$('[data-close-modal]').forEach(x=>x.addEventListener("click",closeModal));document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
$("#openOpinion").addEventListener("click",()=>openModal("TU OPINIÓN CUENTA","Queremos escucharte","En la versión completa del medio, este espacio puede conectarse a un formulario o base de datos para recibir opiniones y cartas de nuestros lectores."));
window.addEventListener("scroll",()=>{$("#backTop").classList.toggle("visible",scrollY>500);});
$("#backTop").addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
