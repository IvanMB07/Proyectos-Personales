const DATA_URL = "./data/days.json";
const CONTENT_KEY = "hp-advent-content-v1";
const PROGRESS_KEY = "hp-advent-progress-v1";
const INVENTORY_KEY = "hp-advent-inventory-v1";
let days = [];
let progress = readStore(PROGRESS_KEY, { completed: [] });
let inventory = readStore(INVENTORY_KEY, []);
let selectedEditorDay = 1;
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { showToast("No se ha podido guardar. Comprueba el espacio disponible del navegador."); }
}
async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("No se pudo cargar el contenido");
    const published = await response.json();
    days = readStore(CONTENT_KEY, published);
    renderCalendar();
    renderEditor();
    renderJournal();
    bindNavigation();
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
    if (location.hash === "#editor") showView("editor");
    else if (location.hash === "#home") showView("home");
    else showView("calendar");
  } catch (error) {
    console.error(error);
    showToast("No se ha podido cargar el calendario.");
  }
}
function bindNavigation() {
  document.querySelectorAll(".nav-button, .castle-nav").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  $("#enter-calendar").addEventListener("click", () => showView("calendar"));
  $("#back-calendar").addEventListener("click", () => showView("calendar"));
  $("#open-letter").addEventListener("click", () => $("#letter-dialog").showModal());
  $("#close-letter").addEventListener("click", () => $("#letter-dialog").close());
  $("#accept-letter").addEventListener("click", () => $("#letter-dialog").close());
  $("#day-form").addEventListener("submit", saveEditorDay);
  $("#preview-day").addEventListener("click", () => openDay(selectedEditorDay, true));
  $("#export-data").addEventListener("click", exportContent);
  $("#import-data").addEventListener("change", importContent);
  $("#reset-editor").addEventListener("click", resetEditor);
  $("#sound-toggle").addEventListener("click", () => showToast("El sonido ambiental se añadirá en una próxima versión."));
}
function showView(name) {
  document.body.classList.toggle("calendar-active", name === "calendar");
  const ids = {calendar:"calendar-view",journal:"journal-view",editor:"editor-view"};
  ["home-view","calendar-view","day-view","journal-view","editor-view"].forEach(id => $("#"+id).classList.add("hidden"));
  if (name === "home") $("#home-view").classList.remove("hidden");
  else if (name === "day") $("#day-view").classList.remove("hidden");
  else $("#"+(ids[name] || ids.calendar)).classList.remove("hidden");
  $$(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.view === name || (name === "day" && button.dataset.view === "calendar")));
  if (name === "calendar") renderCalendar();
  if (name === "journal") renderJournal();
  if (name === "editor") renderEditor();
  window.scrollTo({top:0,behavior:"smooth"});
}
function isDateAvailable(day) {
  const today = new Date();
  const currentYear = today.getFullYear();
  return currentYear > 2026 || (currentYear === 2026 && today.getMonth() === 11 && today.getDate() >= day);
}
function canOpen(day, preview = false) {
  return preview || (day.status === "ready" && isDateAvailable(day.number));
}
function renderCalendar() {
  const grid = $("#calendar-grid");
  grid.innerHTML = "";
  days.forEach(day => {
    const done = progress.completed.includes(day.number);
    const unlocked = canOpen(day);
    const button = document.createElement("button");
    button.className = "day-door" + (done ? " completed" : "") + (!unlocked ? " locked" : "");
    button.type = "button";
    button.disabled = !unlocked;
    button.innerHTML = '<span class="door-symbol">'+(done ? "✓" : unlocked ? "✧" : "⌑")+'</span><span class="door-number">'+String(day.number).padStart(2,"0")+'</span><span class="door-label">'+(done ? "COMPLETADO" : unlocked ? "ABRIR DÍA" : "CERRADO")+'</span>';
    if (unlocked) button.addEventListener("click", () => openDay(day.number));
    grid.appendChild(button);
  });
  const count = progress.completed.length;
  $("#progress-count").innerHTML = count+' <small>/ 24</small>';
  $("#progress-bar").style.width = (count/24*100)+"%";
}
function openDay(number, preview = false) {
  const day = days.find(item => item.number === Number(number));
  if (!day) return;
  if (!canOpen(day, preview)) { showToast("Esta puerta todavía no se ha abierto."); return; }
  $("#day-number").textContent = String(day.number).padStart(2,"0");
  $("#day-date").textContent = day.number+" DICIEMBRE";
  $("#day-act").textContent = day.act || "HOGWARTS";
  $("#day-kicker").textContent = day.kicker || "UN NUEVO DESCUBRIMIENTO";
  $("#day-title").textContent = day.title;
  $("#day-story").textContent = day.story || "El Cronista todavía está escribiendo esta parte de la historia.";
  const challenge = $("#day-challenge");
  const labels = {story:"UN MENSAJE DEL CRONISTA",puzzle:"ACERTIJO MÁGICO",coloring:"TALLER DE COLOREADO",memory:"UN RECUERDO",game:"MINIJUEGO"};
  challenge.innerHTML = '<h3>'+ (labels[day.type] || "PRÓXIMO RETO") +'</h3><p>'+(day.challenge || "Esta actividad está en preparación. Pronto descubrirás qué se esconde tras esta puerta.")+'</p>';
  if (day.status !== "ready" && !preview) challenge.innerHTML += '<p>Este día aún está en preparación.</p>';
  const reward = $("#day-reward");
  reward.classList.toggle("hidden", !progress.completed.includes(day.number));
  reward.textContent = progress.completed.includes(day.number) ? "✦ Este recuerdo ya forma parte de tu cuaderno." : "";
  if (preview) showToast("Vista previa: este día no se ha desbloqueado para la aventura.");
  showView("day");
  $("#day-challenge").dataset.day = day.number;
  if (!progress.completed.includes(day.number) && day.number === 1 && day.status === "ready" && !preview) {
    const action = document.createElement("button");
    action.className = "primary-button challenge-action";
    action.textContent = "Completar introducción";
    action.addEventListener("click", () => completeDay(day.number, "Primera llama"));
    challenge.appendChild(action);
  }
}
function completeDay(number, rewardName) {
  if (!progress.completed.includes(number)) progress.completed.push(number);
  writeStore(PROGRESS_KEY, progress);
  if (rewardName && !inventory.includes(rewardName)) inventory.push(rewardName);
  writeStore(INVENTORY_KEY, inventory);
  renderCalendar(); renderJournal();
  $("#day-reward").classList.remove("hidden");
  $("#day-reward").textContent = "✦ Has conseguido: "+rewardName;
  showToast("Tu avance ha quedado guardado en este dispositivo.");
}
function renderJournal() {
  const list = $("#inventory-list");
  list.innerHTML = inventory.length ? inventory.map(item => '<span class="inventory-item">✧ '+escapeHtml(item)+'</span>').join("") : '<p class="inventory-empty">Todavía no has encontrado objetos. Cada descubrimiento aparecerá aquí.</p>';
  $("#journal-progress").innerHTML = '<div class="journal-row"><span>Días completados</span><strong>'+progress.completed.length+' / 24</strong></div><div class="journal-row"><span>Objetos encontrados</span><strong>'+inventory.length+'</strong></div><div class="journal-row"><span>Última visita</span><strong>'+new Date().toLocaleDateString("es-ES")+'</strong></div>';
}
function renderEditor() {
  $("#editor-days").innerHTML = days.map(day => '<button type="button" class="editor-day-option '+(day.number === selectedEditorDay ? "selected" : "")+'" data-day="'+day.number+'"><span>'+String(day.number).padStart(2,"0")+' · '+escapeHtml(day.title)+'</span><small>'+(day.status === "ready" ? "Listo" : "Borrador")+'</small></button>').join("");
  $$(".editor-day-option").forEach(button => button.addEventListener("click", () => {
    selectedEditorDay = Number(button.dataset.day); renderEditor();
  }));
  const day = days.find(item => item.number === selectedEditorDay);
  if (!day) return;
  $("#edit-number").value = day.number;
  $("#edit-title").value = day.title || "";
  $("#edit-kicker").value = day.kicker || "";
  $("#edit-act").value = day.act || "";
  $("#edit-story").value = day.story || "";
  $("#edit-type").value = day.type || "story";
  $("#edit-status").value = day.status || "draft";
  $("#editor-save-state").textContent = "Contenido local";
}
function saveEditorDay(event) {
  event.preventDefault();
  const day = days.find(item => item.number === selectedEditorDay);
  day.title = $("#edit-title").value.trim();
  day.kicker = $("#edit-kicker").value.trim();
  day.act = $("#edit-act").value.trim();
  day.story = $("#edit-story").value.trim();
  day.type = $("#edit-type").value;
  day.status = $("#edit-status").value;
  writeStore(CONTENT_KEY, days);
  $("#editor-save-state").textContent = "Guardado en este navegador";
  renderEditor(); renderCalendar();
  showToast("Día guardado. Exporta el JSON para publicarlo.");
}
function exportContent() {
  const blob = new Blob([JSON.stringify(days,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "days.json"; link.click();
  URL.revokeObjectURL(url);
  showToast("Contenido exportado.");
}
function importContent(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed) || parsed.length !== 24 || parsed.some((day,index) => day.number !== index+1)) throw new Error("Formato inválido");
      days = parsed;
      writeStore(CONTENT_KEY, days);
      selectedEditorDay = 1; renderEditor(); renderCalendar();
      showToast("Contenido importado correctamente.");
    } catch { showToast("El archivo no tiene el formato esperado de 24 días."); }
    event.target.value = "";
  };
  reader.readAsText(file);
}
async function resetEditor() {
  if (!confirm("¿Descartar las modificaciones locales y recuperar el contenido publicado?")) return;
  localStorage.removeItem(CONTENT_KEY);
  const response = await fetch(DATA_URL+"?t="+Date.now());
  days = await response.json();
  selectedEditorDay = 1; renderEditor(); renderCalendar();
  showToast("Se ha recuperado el contenido publicado.");
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"),2600);
}
init();