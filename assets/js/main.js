/*
  main.js - Lógica principal de la página
*/

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  loadAndRenderItems();
});

// Delegación de evento para botones de compra
const itemsContainer = document.querySelector('.items-cards');
if (itemsContainer) {
  itemsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-btn');
    if (!btn) return;

    const card = btn.closest('.card');
    if (!card) return;

    const idStr = card.dataset.id;
    const idNum = Number(idStr);
    const id = Number.isFinite(idNum) ? idNum : idStr;

    const product = findProductById(id);
    if (!product) {
      console.warn('Producto no encontrado para id:', id);
      return;
    }

    const cartEntry = addToCart(id);
    console.log('Carrito actualizado:', getCart());
  });
} else {
  console.warn('No se encontró el contenedor .items-cards; el listener de click no fue registrado');
}

// Configuración / constantes
const CSV_PATH = 'assets/src/Items.csv';
const ITEMS_CONTAINER_SELECTOR = '.items-cards';

let products = [];
let cartItems = [];

/** Añade producto al carrito (id: number|string). Si existe incrementa qty, si no lo añade con qty=1 */
function addToCart(id) {
  const idNum = Number(id);
  const normalizedId = Number.isFinite(idNum) ? idNum : id;
  const existing = cartItems.find(ci => ci.id === normalizedId);
  if (existing) {
    existing.qty += 1;
    renderCart();
    return existing;
  }
  const item = { id: normalizedId, qty: 1 };
  cartItems.push(item);
  renderCart();
  return item;
}

/** Devuelve copia del carrito */
function getCart() {
  return cartItems.map(ci => ({ ...ci }));
}

/** Elimina un producto del carrito por id (elimina la entrada por completo) */
function removeFromCart(id) {
  const idNum = Number(id);
  const normalizedId = Number.isFinite(idNum) ? idNum : id;
  const idx = cartItems.findIndex(ci => ci.id === normalizedId);
  if (idx === -1) return false;
  cartItems.splice(idx, 1);
  renderCart();
  return true;
}

/** Renderiza el contenido del carrito dentro del offcanvas */
function renderCart() {
  const offbody = document.querySelector('#cartList .offcanvas-body');
  if (!offbody) return;
  offbody.innerHTML = '';

  if (cartItems.length === 0) {
    offbody.innerHTML = `<p class="text-center">Tu carrito está vacío.</p>`;
    return;
  }

  const list = document.createElement('div');
  list.className = 'cart-list';
  let total = 0;

  cartItems.forEach(ci => {
    const product = findProductById(ci.id);
    const title = product ? product.titulo : 'Producto desconocido';
    const price = product && typeof product.precio === 'number' ? product.precio : 0;
    const subtotal = price * ci.qty;
    total += subtotal;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'd-flex align-items-center justify-content-between py-2 border-bottom gap-2';

    // Left: thumbnail + text (title + precio debajo)
    const leftWrap = document.createElement('div');
    leftWrap.className = 'd-flex align-items-center gap-2';

    const thumb = document.createElement('img');
    thumb.className = 'rounded';
    thumb.src = product && product.fotourl ? product.fotourl : '';
    thumb.alt = title;
    thumb.width = 48;
    thumb.height = 48;
    thumb.style.objectFit = 'cover';

    const textWrap = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = title;
    const small = document.createElement('div');
    small.className = 'small text-muted';
    // Mostrar solo el precio debajo del nombre
    small.textContent = `$${price ? price.toFixed(2) : '—'}`;
    textWrap.appendChild(strong);
    textWrap.appendChild(small);

    leftWrap.append(thumb, textWrap);

    // Right: cantidad (input), subtotal y remove button
    const rightWrap = document.createElement('div');
    rightWrap.className = 'd-flex align-items-center gap-2';

    const qtyInput = document.createElement('input');
    qtyInput.className = 'form-control form-control-sm cart-qty-input';
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.value = String(ci.qty);
    qtyInput.style.width = '72px';
    qtyInput.dataset.id = ci.id;

    const subtotalDiv = document.createElement('div');
    subtotalDiv.className = 'fw-bold';
    subtotalDiv.textContent = `$${subtotal.toFixed(2)}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-outline-danger cart-remove-btn';
    removeBtn.type = 'button';
    removeBtn.dataset.id = ci.id;
    removeBtn.title = 'Eliminar';
    removeBtn.innerHTML = '<i class="bi bi-trash"></i>';

    rightWrap.append(qtyInput, subtotalDiv, removeBtn);

    itemDiv.append(leftWrap, rightWrap);
    list.appendChild(itemDiv);
  });

  const totalDiv = document.createElement('div');
  totalDiv.className = 'pt-2 d-flex justify-content-between fw-bold';
  totalDiv.innerHTML = `<div>Total</div><div>$${total.toFixed(2)}</div>`;

  offbody.appendChild(list);

  // Footer fijo: total + botón
  const footer = document.createElement('div');
  footer.className = 'cart-footer';
  footer.appendChild(totalDiv);

  // Botón para finalizar compra
  const checkoutWrap = document.createElement('div');
  checkoutWrap.className = 'pt-3';
  const checkoutBtn = document.createElement('button');
  checkoutBtn.className = 'btn btn-success w-100 cart-checkout-btn';
  checkoutBtn.type = 'button';
  checkoutBtn.id = 'cart-checkout-btn';
  checkoutBtn.textContent = 'Finalizar compra';
  checkoutWrap.appendChild(checkoutBtn);

  footer.appendChild(checkoutWrap);
  offbody.appendChild(footer);
} 

// Delegación de eventos para botones de eliminar dentro del offcanvas
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.cart-remove-btn');
  if (!btn) return;
  const idStr = btn.dataset.id;
  const idNum = Number(idStr);
  const id = Number.isFinite(idNum) ? idNum : idStr;
  const removed = removeFromCart(id);
  if (removed) {
    console.log('Producto eliminado del carrito:', id);
  }
});

// Delegación para cambios en campo de cantidad (input)
document.addEventListener('change', (e) => {
  const input = e.target.closest('.cart-qty-input');
  if (!input) return;
  const idStr = input.dataset.id;
  const idNum = Number(idStr);
  const id = Number.isFinite(idNum) ? idNum : idStr;
  let qty = parseInt(input.value, 10);
  if (!Number.isFinite(qty) || qty < 1) qty = 1;
  const entry = cartItems.find(ci => ci.id === id);
  if (!entry) return;
  entry.qty = qty;
  renderCart();
});

// Click handler para el botón de finalizar compra
document.addEventListener('click', (e) => {
  const checkoutBtn = e.target.closest('#cart-checkout-btn, .cart-checkout-btn');
  if (!checkoutBtn) return;
  console.log('Finalizar compra:', getCart());
});

/** Exponer API del carrito */
window.CartStore = {
  add: addToCart,
  get: getCart,
  remove: removeFromCart,
  _internal: () => cartItems,
  render: renderCart
};

/** Devuelve una copia de la lista de productos cargados */
function getProducts() {
  return products.slice();
}

/** Busca un producto por ID (normaliza id a número si aplica) */
function findProductById(id) {
  const idNum = Number(id);
  const normalized = Number.isFinite(idNum) ? idNum : id;
  return products.find(p => p.id === normalized) || null;
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

    renderItems(container, items);    // Actualizar UI del carrito (por si ya tiene elementos o para mostrar vacío)
    renderCart();  } catch (err) {
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