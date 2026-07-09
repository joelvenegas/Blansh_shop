# Blansh — Tienda de velas artesanales

Sitio estático de la tienda [blanshvelas.store](https://www.blanshvelas.store), publicado con GitHub Pages.
No requiere instalación ni compilación: es HTML, CSS y JavaScript puro (con Bootstrap 5 desde CDN).

## Estructura del proyecto

```
index.html              Página principal (carrusel, productos, carrito)
pages/contact.html      Página "Acerca de nosotros" / contacto
assets/css/styles.css   Estilos propios
assets/js/config.js     Configuración del sitio (número de WhatsApp)
assets/js/main.js       Lógica: productos, búsqueda, carrito, checkout
assets/src/Items.csv    Catálogo de productos (ver formato abajo)
assets/img/             Imágenes (banners, logo, favicon)
CNAME                   Dominio personalizado de GitHub Pages
```

## Cómo agregar o editar productos

Los productos se cargan desde `assets/src/Items.csv`. Cada línea es un producto con
**5 columnas separadas por punto y coma (`;`)**, sin fila de encabezado:

```
id;titulo;descripcion;precio;fotourl
```

Ejemplo:

```
1;Café;Cera de soya aromática 60gr. <br>Tema: cafetería.;45;https://i.imgur.com/uJbQH73.jpeg
```

Reglas importantes:

- **`id`**: número único por producto (no repetir).
- **`titulo`** y **`descripcion`**: texto libre, pero **no pueden contener `;`**
  (el punto y coma corta las columnas). Se puede usar `<br>` en la descripción
  para hacer un salto de línea.
- **`precio`**: número en pesos mexicanos, con punto o coma decimal (ej. `45` o `45.50`).
- **`fotourl`**: dirección (URL) de la foto del producto.
- Guardar el archivo con codificación **UTF-8** para que los acentos se vean bien.

## Cómo cambiar el número de WhatsApp

Editar la línea `WHATSAPP_NUMBER` en `assets/js/config.js`. El formato es código de
país + número, sin `+` ni espacios (ej. `522711520959`). Ese único cambio actualiza
los botones de WhatsApp de todas las páginas y el envío del pedido del carrito.

## Cómo funciona el carrito

El carrito se guarda en el navegador del cliente (localStorage), así que no se pierde
al recargar la página. Al presionar "Finalizar compra" se abre WhatsApp con el detalle
del pedido dirigido al número configurado.

## Publicación

Todo cambio que llegue a la rama `main` se publica automáticamente en GitHub Pages.
