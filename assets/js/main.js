/*
  main.js - Lógica principal de la página
*/

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  initSearch();
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
    //console.log('Carrito actualizado:', getCart());
  });
} else {
  console.warn('No se encontró el contenedor .items-cards; el listener de click no fue registrado');
}

// Configuración / constantes
const SITE_URL = 'https://www.blanshvelas.store/';
const CSV_PATH = 'assets/src/Items.csv';
// Catálogo editable en Google Sheets (Archivo → Compartir → Publicar en la web → CSV).
// Si Sheets no responde, se usa CSV_PATH (copia local en el repo) como respaldo.
const REMOTE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2ulZhDDH2ANOLvIuMG4ZEI4WctbutoSx-nxDp5OKCo6QqlpnPTKhFzxfbnG_ce0XtqWjuZeTl9LIe/pub?gid=1159407197&single=true&output=csv';
const ITEMS_CONTAINER_SELECTOR = '.items-cards';
// El número de WhatsApp se define una sola vez en assets/js/config.js
const WHATSAPP_NUMBER = (window.BLANSH_CONFIG && window.BLANSH_CONFIG.WHATSAPP_NUMBER) || '';
const CART_STORAGE_KEY = 'blansh_cart';

let products = [];
let activeTheme = ''; // '' = todas; se setea desde los botones de filtro por tema
let cartItems = loadCartFromStorage();

/** Lee el carrito guardado en localStorage (persiste entre visitas y recargas) */
function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(ci =>
      ci && (typeof ci.id === 'number' || typeof ci.id === 'string') &&
      Number.isFinite(ci.qty) && ci.qty >= 1
    );
  } catch {
    return [];
  }
}

/** Guarda el carrito en localStorage */
function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch {
    // localStorage no disponible (modo privado, etc.): el carrito sigue funcionando en memoria
  }
}

/** Añade producto al carrito (id: number|string). Si existe incrementa qty, si no lo añade con qty=1 */
function addToCart(id) {
  const idNum = Number(id);
  const normalizedId = Number.isFinite(idNum) ? idNum : id;
  const existing = cartItems.find(ci => ci.id === normalizedId);
  if (existing) {
    existing.qty += 1;
    saveCart();
    renderCart();
    refreshAllCardCounts();
    return existing;
  }
  const item = { id: normalizedId, qty: 1 };
  cartItems.push(item);
  saveCart();
  renderCart();
  refreshAllCardCounts();
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
  saveCart();
  renderCart();
  refreshAllCardCounts();
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
    small.textContent = `MXN$${price ? price.toFixed(2) : '—'}`;
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
    subtotalDiv.className = 'fw-bold cart-subtotal';
    subtotalDiv.dataset.id = ci.id;
    subtotalDiv.textContent = `MXN$${subtotal.toFixed(2)}`;

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
  totalDiv.innerHTML = `<div>Total</div><div class="cart-total">MXN$${total.toFixed(2)}</div>`;

  offbody.appendChild(list);

  // Footer fijo: total + botón
  const footer = document.createElement('div');
  footer.className = 'cart-footer';
  footer.appendChild(totalDiv);

  // Botones: finalizar compra + vaciar carrito
  const checkoutWrap = document.createElement('div');
  checkoutWrap.className = 'cart-actions pt-3 d-flex flex-column gap-2';
  const checkoutBtn = document.createElement('button');
  checkoutBtn.className = 'btn btn-success w-100 cart-checkout-btn';
  checkoutBtn.type = 'button';
  checkoutBtn.id = 'cart-checkout-btn';
  checkoutBtn.textContent = 'Finalizar compra';
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn btn-sm btn-outline-danger w-100 cart-clear-btn';
  clearBtn.type = 'button';
  clearBtn.innerHTML = '<i class="bi bi-trash"></i> Vaciar carrito';
  checkoutWrap.append(checkoutBtn, clearBtn);

  footer.appendChild(checkoutWrap);
  offbody.appendChild(footer);
}

/** Vacía el carrito por completo */
function clearCart() {
  cartItems = [];
  saveCart();
  renderCart();
  refreshAllCardCounts();
}

/** Muestra la confirmación inline para vaciar el carrito dentro del cart-footer */
function showClearConfirm() {
  const footer = document.querySelector('#cartList .cart-footer');
  if (!footer || footer.querySelector('.cart-confirm')) return;

  footer.querySelector('.cart-actions')?.classList.add('d-none');

  const confirmBox = document.createElement('div');
  confirmBox.className = 'cart-confirm';

  const msg = document.createElement('div');
  msg.className = 'cart-confirm-msg';
  msg.textContent = '¿Vaciar el carrito?';

  const btnWrap = document.createElement('div');
  btnWrap.className = 'cart-confirm-buttons d-flex gap-2';

  const yesBtn = document.createElement('button');
  yesBtn.className = 'btn btn-sm btn-danger w-100 cart-confirm-yes';
  yesBtn.type = 'button';
  yesBtn.innerHTML = '<i class="bi bi-trash"></i> Sí, vaciar';

  const noBtn = document.createElement('button');
  noBtn.className = 'btn btn-sm btn-outline-secondary w-100 cart-confirm-no';
  noBtn.type = 'button';
  noBtn.textContent = 'Cancelar';

  btnWrap.append(yesBtn, noBtn);
  confirmBox.append(msg, btnWrap);
  footer.appendChild(confirmBox);
}

/** Cierra la confirmación inline y restaura los botones del carrito */
function hideClearConfirm() {
  const footer = document.querySelector('#cartList .cart-footer');
  if (!footer) return;
  footer.querySelector('.cart-confirm')?.remove();
  footer.querySelector('.cart-actions')?.classList.remove('d-none');
}

// Delegación para el botón de vaciar carrito y su confirmación inline
document.addEventListener('click', (e) => {
  if (e.target.closest('.cart-clear-btn')) {
    showClearConfirm();
    return;
  }
  if (e.target.closest('.cart-confirm-yes')) {
    clearCart();
    showToast('Se vació el carrito.');
    return;
  }
  if (e.target.closest('.cart-confirm-no')) {
    hideClearConfirm();
  }
});

// Al cerrar el offcanvas del carrito sin confirmar, restaurar la vista por defecto
// (si no se hace esto, la confirmación de "vaciar carrito" quedaría abierta al reabrir el carrito)
document.addEventListener('hidden.bs.offcanvas', (e) => {
  if (e.target && e.target.id === 'cartList') {
    hideClearConfirm();
  }
});

/** Muestra un aviso breve (toast de Bootstrap) en la esquina inferior */
function showToast(message) {
  let wrap = document.querySelector('.toast-container');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(wrap);
  }
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center border-0 site-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = '<div class="d-flex"><div class="toast-body"></div>' +
    '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>';
  toast.querySelector('.toast-body').textContent = message;
  wrap.appendChild(toast);
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
  new bootstrap.Toast(toast, { delay: 2500 }).show();
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
  input.value = String(qty);
  saveCart();
  // Actualizar solo subtotal y total (sin re-renderizar todo el carrito,
  // para que el input no pierda el foco mientras el usuario escribe)
  const product = findProductById(id);
  const price = product && typeof product.precio === 'number' ? product.precio : 0;
  const subtotalEl = document.querySelector(`#cartList .cart-subtotal[data-id="${id}"]`);
  if (subtotalEl) subtotalEl.textContent = `MXN$${(price * qty).toFixed(2)}`;
  const totalEl = document.querySelector('#cartList .cart-total');
  if (totalEl) {
    const total = cartItems.reduce((sum, ci) => {
      const p = findProductById(ci.id);
      const pr = p && typeof p.precio === 'number' ? p.precio : 0;
      return sum + pr * ci.qty;
    }, 0);
    totalEl.textContent = `MXN$${total.toFixed(2)}`;
  }
  refreshAllCardCounts();
});

// Click handler para el botón de finalizar compra
document.addEventListener('click', (e) => {
  const checkoutBtn = e.target.closest('#cart-checkout-btn, .cart-checkout-btn');
  if (!checkoutBtn) return;

  if (cartItems.length === 0) {
    showToast('Tu carrito está vacío. Agrega productos antes de finalizar la compra.');
    return;
  }

  // Construir mensaje con lista de productos, precio y cantidad
  let lines = [];
  lines.push('Hola, estoy interesado en los siguientes productos:');
  let total = 0;
  cartItems.forEach((ci, idx) => {
    const product = findProductById(ci.id);
    const title = product ? product.titulo : `Producto ${ci.id}`;
    const price = product && typeof product.precio === 'number' ? product.precio : 0;
    const subtotal = price * ci.qty;
    total += subtotal;
    lines.push(`${idx + 1}. ${title} - MXN$${price.toFixed(2)} x${ci.qty} = MXN$${subtotal.toFixed(2)}`);
  });
  lines.push(`Total: MXN$${total.toFixed(2)}`);
  lines.push('');
  lines.push('Podriamos ponernos en contacto para concretar la compra? ¡Gracias!');

  const message = encodeURIComponent(lines.join('\n'));

  const phone = WHATSAPP_NUMBER ? WHATSAPP_NUMBER.replace(/\D/g, '') : '';
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${message}`
    : `https://api.whatsapp.com/send?text=${message}`;

  window.open(waUrl, '_blank');
});

/** Exponer API del carrito */
window.CartStore = {
  add: addToCart,
  get: getCart,
  remove: removeFromCart,
  clear: clearCart,
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
  _internal: () => products
};

/** Inicializa el carousel si existe */
function initCarousel() {
  const elem = document.querySelector('#carouselExampleCaptions');
  if (!elem) return;

  new bootstrap.Carousel(elem, {
    interval: 5000,
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
    const text = await fetchCatalog();
    const items = parseCSV(text);

    products = items;

    if (items.length === 0) {
      showEmpty(container);
      return;
    }

    renderFilters();
    renderItems(container, items);
    renderCart();
    injectProductJsonLd(items);
  } catch (err) {
    console.error('Error cargando o renderizando items:', err);
    showError(container, 'Error al cargar los productos.');
  }
}

/** Intenta cargar el catálogo desde Google Sheets; si falla, usa el CSV local del repo */
async function fetchCatalog() {
  try {
    return await fetchCSV(REMOTE_CSV_URL);
  } catch (err) {
    console.warn('No se pudo cargar el catálogo desde Google Sheets, se usa el CSV local:', err);
    return await fetchCSV(CSV_PATH);
  }
}

/** Fetch del CSV y devolución del texto */
async function fetchCSV(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Error al cargar CSV: ${res.status} ${res.statusText}`);
  return await res.text();
}

/**
 * Parse de CSV; devuelve array de objetos: { id, titulo, descripcion, tema, precio, fotourl}
 * Formato nuevo (6 columnas): id;titulo;descripcion;tema;precio;fotourl
 * Formato legado (5 columnas): id;titulo;descripcion;precio;fotourl — el "Tema: x."
 * dentro de la descripción se extrae al campo `tema` y se quita del texto.
 * Ambos formatos se aceptan (se detecta por cantidad de columnas de cada fila),
 * así el Sheets remoto y el CSV local pueden migrarse en momentos distintos.
 * Soporta separador ',' (Google Sheets) o ';' (CSV local) — se detecta por archivo —
 * y campos entrecomillados con comillas dobles, incluyendo saltos de línea internos.
 * Si la primera fila no tiene id ni precio numéricos se asume encabezado y se ignora.
 */
function parseCSV(text) {
  return tokenizeCSV(text)
    .map((cols, index) => {
      cols = cols.map(c => c.trim());
      if (cols.length < 4) {
        if (cols.join('').length > 0) console.warn(`Línea ${index + 1} con columnas insuficientes, se ignora`);
        return null;
      }
      let id, titulo, descripcion, tema, precio, fotourl;
      if (cols.length >= 6) {
        [id, titulo, descripcion, tema, precio, fotourl] = cols;
      } else {
        [id, titulo, descripcion, precio, fotourl] = cols;
        tema = '';
      }
      if (index === 0 && !Number.isFinite(Number(id)) && !Number.isFinite(parseFloat(String(precio).replace(',', '.')))) {
        return null; // fila de encabezado
      }
      const precioNum = parseFloat(String(precio).replace(',', '.'));
      if (!Number.isFinite(precioNum)) {
        console.warn(`Precio inválido en línea ${index + 1}: "${precio}"`);
      }
      const idNum = Number(id);
      id = Number.isFinite(idNum) ? idNum : id;

      tema = String(tema || '').trim().toLowerCase();
      let descText = String(descripcion || '');
      // Compatibilidad con el formato legado: extraer "Tema: x." de la descripción
      // si no vino en su propia columna, y limpiarlo del texto en cualquier caso.
      const themeMatch = descText.match(/tema:\s*([^.<\n]+)/i);
      if (themeMatch) {
        if (!tema) tema = themeMatch[1].trim().toLowerCase();
        descText = descText
          .replace(/(\s|<br\s*\/?>|\\n)*tema:\s*[^.<\n]+\.?/i, '')
          .trim();
      }

      return { id, titulo, descripcion: descText, tema, precio: Number.isFinite(precioNum) ? precioNum : precio, fotourl };
    })
    .filter(Boolean);
}

/**
 * Separa el texto CSV en filas y columnas respetando campos entre comillas dobles
 * (Google Sheets entrecomilla los campos que contienen el separador, comillas o saltos de línea).
 * El separador (',' o ';') se detecta según cuál aparece más en la primera línea.
 */
function tokenizeCSV(text) {
  const firstLineEnd = text.indexOf('\n');
  const firstLine = firstLineEnd === -1 ? text : text.slice(0, firstLineEnd);
  const delim = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // comilla escapada ""
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === '') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some(c => c.trim() !== '')) rows.push(row);

  return rows;
}

/** Inserta datos estructurados (schema.org) para que buscadores muestren los productos con precio */
function injectProductJsonLd(items) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.titulo,
        image: /^https?:\/\//i.test(p.fotourl) ? p.fotourl : SITE_URL + p.fotourl,
        description: String(p.descripcion || '').replace(/<br\s*\/?>/gi, ' ').replace(/\\n/g, ' ').trim(),
        offers: {
          '@type': 'Offer',
          price: typeof p.precio === 'number' ? p.precio.toFixed(2) : String(p.precio),
          priceCurrency: 'MXN',
          availability: 'https://schema.org/InStock'
        }
      }
    }))
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
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

  // Actualizar badges de cantidad en las cards según el estado del carrito
  refreshAllCardCounts();
}

/** Actualiza el badge de cantidad total junto al link "Carrito" del navbar */
function updateCartBadge() {
  const badge = document.querySelector('.cart-count-badge');
  if (!badge) return;
  const totalQty = cartItems.reduce((sum, ci) => sum + ci.qty, 0);
  badge.hidden = totalQty === 0;
  badge.textContent = String(totalQty);
}

/** Actualiza los badges 'x en carrito' de todas las cards */
function refreshAllCardCounts() {
  updateCartBadge();
  document.querySelectorAll('.card-cart-count').forEach(span => {
    const idStr = span.dataset.id;
    const idNum = Number(idStr);
    const id = Number.isFinite(idNum) ? idNum : idStr;
    const entry = cartItems.find(ci => ci.id === id);
    if (entry && entry.qty > 0) {
      span.textContent = `${entry.qty} en carrito`;
      span.style.display = '';
    } else {
      span.textContent = '';
      span.style.display = 'none';
    }
  });
}

/** Crea el elemento de la tarjeta */
function createCardElement({ id, titulo, descripcion, tema, precio, fotourl }) {
  const div = document.createElement('div');
  div.dataset.id = id;
  div.id = `product-${id}`;
  div.className = 'card';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'card-img-wrap';

  const img = document.createElement('img');
  img.className = 'card-img-top';
  img.src = fotourl;
  img.alt = titulo;
  img.loading = 'lazy';
  imgWrap.appendChild(img);

  // Etiqueta con el tema sobre la foto (el tema ya viene extraído del CSV)
  if (tema) {
    const themeBadge = document.createElement('span');
    themeBadge.className = 'card-theme-badge';
    themeBadge.textContent = tema;
    imgWrap.appendChild(themeBadge);
  }
  const descText = String(descripcion || '');

  const body = document.createElement('div');
  body.className = 'card-body';

  const h5 = document.createElement('h5');
  h5.className = 'card-title';
  h5.textContent = titulo;

  const p = document.createElement('p');
  p.className = 'card-text';
  const safeDesc = escapeHtml(descText)
    .replace(/\\n/g, '<br>')
    .replace(/\r?\n/g, '<br>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  p.innerHTML = safeDesc;

  const price = document.createElement('p');
  price.className = 'card-text fw-bold card-price';
  price.textContent = `MXN$${typeof precio === 'number' ? precio.toFixed(2) : precio}`;

  const a = document.createElement('button');
  a.type = 'button';
  a.className = 'card-btn btn btn-primary flex-grow-1';
  a.innerHTML = '<i class="bi bi-cart-plus"></i> Comprar';

  // contador en carrito (a la derecha del botón)
  const countSpan = document.createElement('span');
  countSpan.className = 'text-muted small card-cart-count';
  countSpan.dataset.id = id;

  // mostrar conteo actual si existe en carrito
  const existing = cartItems.find(ci => ci.id === id);
  if (existing && existing.qty > 0) {
    countSpan.textContent = `${existing.qty} en carrito`;
  } else {
    countSpan.style.display = 'none';
  }

  const controls = document.createElement('div');
  controls.className = 'd-flex align-items-center gap-2';
  controls.append(a, countSpan);

  body.append(h5, p, price, controls);
  div.append(imgWrap, body);
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

/** Debounce utility */
function debounce(fn, wait = 200) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Ejecuta búsqueda (texto + tema activo) y renderiza resultados */
function performSearch(query) {
  const q = String(query || '').trim().toLowerCase();
  const container = document.querySelector(ITEMS_CONTAINER_SELECTOR);
  if (!container) return;

  let filtered = products;
  if (activeTheme) {
    filtered = filtered.filter(p => p.tema === activeTheme);
  }
  if (q) {
    filtered = filtered.filter(p => {
      return (
        String(p.titulo).toLowerCase().includes(q) ||
        String(p.descripcion).toLowerCase().includes(q) ||
        String(p.tema).toLowerCase().includes(q)
      );
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-center">No se encontraron productos${q ? ` para "${escapeHtml(q)}"` : ''}.</p>`;
    refreshAllCardCounts();
    return;
  }

  renderItems(container, filtered);
}

/** Renderiza los botones de filtro por tema a partir de los temas presentes en el catálogo */
function renderFilters() {
  const wrap = document.querySelector('.item-filters');
  if (!wrap) return;

  const themes = [...new Set(products.map(p => p.tema).filter(Boolean))];
  wrap.innerHTML = '';
  if (themes.length === 0) return;

  const makeBtn = (label, value) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn' + (value === activeTheme ? ' active' : '');
    btn.setAttribute('aria-pressed', String(value === activeTheme));
    btn.dataset.theme = value;
    btn.textContent = label;
    return btn;
  };

  wrap.appendChild(makeBtn('Todas', ''));
  themes.forEach(t => wrap.appendChild(makeBtn(t, t)));
}

// Delegación para los botones de filtro por tema
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.item-filters .filter-btn');
  if (!btn) return;
  activeTheme = btn.dataset.theme || '';
  document.querySelectorAll('.item-filters .filter-btn').forEach(b => {
    b.classList.toggle('active', b === btn);
    b.setAttribute('aria-pressed', String(b === btn));
  });
  const input = document.querySelector('.item-search-input');
  performSearch(input ? input.value : '');
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/** Inicializa la búsqueda */
function initSearch() {
  const container = document.querySelector('.item-search');
  if (!container) return;

  const input = container.querySelector('.item-search-input');
  const clearBtn = container.querySelector('.item-search-clear');

  const doSearch = debounce(() => performSearch(input.value.trim()), 200);
  input.addEventListener('input', doSearch);
  clearBtn.addEventListener('click', () => { input.value = ''; performSearch(''); input.focus(); });

  performSearch('');
}