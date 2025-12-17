/*
  main.js - Lógica principal de la página
*/

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  loadAndRenderItems();
});

// Configuración / constantes
const CSV_PATH = 'assets/src/Items.csv'; // Atención al case
const ITEMS_CONTAINER_SELECTOR = '.items-cards';

/** Inicializa el carousel si existe */
function initCarousel() {
  const elem = document.querySelector('#carouselExampleCaptions');
  if (!elem) return;

  new bootstrap.Carousel(elem, {
    interval: 3000,
    touch: true,
    pause: 'hover'
  });
}

/** Carga el CSV, lo parsea y renderiza las tarjetas */
async function loadAndRenderItems() {
  const container = document.querySelector(ITEMS_CONTAINER_SELECTOR);
  if (!container) return;

  showLoading(container);

  try {
    const text = await fetchCSV(CSV_PATH);
    const items = parseCSV(text);

    if (items.length === 0) {
      showEmpty(container);
      return;
    }

    renderItems(container, items);
  } catch (err) {
    console.error('Error cargando o renderizando items:', err);
    showError(container, 'Error al cargar los productos.');
  }
}

/** Fetch del CSV y devolución del texto */
async function fetchCSV(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Error al cargar CSV: ${res.status} ${res.statusText}`);
  return await res.text();
}

/** Parse simple de CSV; devuelve array de objetos: {titulo, descripcion, precio, fotourl} */
function parseCSV(text) {
  return text
    .trim()
    .split('\n')
    .map((line, index) => {
      const cols = line.split(';').map(c => c.trim());
      if (cols.length < 4) {
        console.warn(`Línea ${index + 1} con columnas insuficientes, se ignora`);
        return null;
      }
      const [titulo, descripcion, precio, fotourl] = cols;
      return { titulo, descripcion, precio, fotourl };
    })
    .filter(Boolean);
}

/** Renderiza las tarjetas usando DocumentFragment */
function renderItems(container, items) {
  container.innerHTML = ''; // limpiar contenido previo
  const frag = document.createDocumentFragment();

  items.forEach(item => {
    const card = createCardElement(item);
    frag.appendChild(card);
  });

  container.appendChild(frag);
}

/** Crea el elemento de la tarjeta */
function createCardElement({ titulo, descripcion, precio, fotourl }) {
  const div = document.createElement('div');
  div.className = 'card';

  const img = document.createElement('img');
  img.className = 'card-img-top';
  img.src = fotourl;
  img.alt = titulo;
  img.loading = 'lazy';

  const body = document.createElement('div');
  body.className = 'card-body';

  const h5 = document.createElement('h5');
  h5.className = 'card-title';
  h5.textContent = titulo;

  const p = document.createElement('p');
  p.className = 'card-text';
  p.textContent = descripcion;

  const price = document.createElement('p');
  price.className = 'card-text fw-bold';
  price.textContent = `$${precio}`;

  const a = document.createElement('a');
  a.href = '#';
  a.className = 'btn btn-primary';
  a.textContent = 'Comprar';

  body.append(h5, p, price, a);
  div.append(img, body);
  return div;
}

/** Muestra estado de carga */
function showLoading(container) {
  container.innerHTML = `<p class="text-center">Cargando productos...</p>`;
}

/** Muestra mensaje en caso de no productos */
function showEmpty(container) {
  container.innerHTML = `<p class="text-center">No hay productos disponibles.</p>`;
}

/** Muestra mensaje de error */
function showError(container, message) {
  container.innerHTML = `<p class="text-center text-danger">${message}</p>`;
}