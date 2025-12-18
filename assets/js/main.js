/*
  main.js - Lógica principal de la página
*/

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  loadAndRenderItems();
});

document.querySelector('.items-cards').addEventListener('click', (e) => {
  if (e.target.matches('.card-btn')) {
    const card = e.target.closest('.card');
    const id = card?.dataset.id;
    console.log('Comprar', id);
  }
});

// Configuración / constantes
const CSV_PATH = 'assets/src/Items.csv'; // Atención al case
const ITEMS_CONTAINER_SELECTOR = '.items-cards';

// Almacenamiento en memoria de los productos para uso posterior
let products = [];

/** Devuelve una copia de la lista de productos cargados */
function getProducts() {
  return products.slice();
}

/** Busca un producto por ID */
function findProductById(id) {
  return products.find(p => p.id === id) || null;
}

/** Exponer API pública para uso desde otras partes de la app */
window.ProductStore = {
  get: getProducts,
  findById: findProductById,
  _internal: () => products // solo para depuración si se necesita
};

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

    products = items;

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

/** Parse simple de CSV; devuelve array de objetos: { id, titulo, descripcion, precio, fotourl} */
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
      let [id, titulo, descripcion, precio, fotourl] = cols;
      const precioNum = parseFloat(String(precio).replace(',', '.'));
      if (!Number.isFinite(precioNum)) {
        console.warn(`Precio inválido en línea ${index + 1}: "${precio}"`);
      }
      const idNum = Number(id);
      id = Number.isFinite(idNum) ? idNum : id;
      return { id, titulo, descripcion, precio: Number.isFinite(precioNum) ? precioNum : precio, fotourl };
    })
    .filter(Boolean);
}

/** Renderiza las tarjetas usando DocumentFragment */
function renderItems(container, items) {
  container.innerHTML = '';
  const frag = document.createDocumentFragment();

  items.forEach(item => {
    const card = createCardElement(item);
    frag.appendChild(card);
  });

  container.appendChild(frag);
}

/** Crea el elemento de la tarjeta */
function createCardElement({ id, titulo, descripcion, precio, fotourl }) {
  const div = document.createElement('div');
  div.dataset.id = id;
  div.id = `product-${id}`;
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
  price.textContent = `$${typeof precio === 'number' ? precio.toFixed(2) : precio}`;

  const a = document.createElement('a');
  a.className = 'card-btn btn btn-primary';
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