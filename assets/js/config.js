/*
  config.js - Configuración compartida del sitio.
  Este archivo se carga en TODAS las páginas (index y contacto).
  Para cambiar el número de WhatsApp de la tienda, editar solo la línea de abajo.
*/

window.BLANSH_CONFIG = {
  // Número de WhatsApp con código de país, sin '+' ni espacios.
  WHATSAPP_NUMBER: '522711520959',
  // Link de Google Maps a la tienda física (CASA LUQUE, Córdoba, Veracruz).
  STORE_MAPS_URL: 'https://maps.app.goo.gl/GW1KwkXnaEkBTDkm6'
};

document.addEventListener('DOMContentLoaded', () => {
  // Completar todos los enlaces de WhatsApp marcados con data-wa-link
  const phone = window.BLANSH_CONFIG.WHATSAPP_NUMBER.replace(/\D/g, '');
  document.querySelectorAll('a[data-wa-link]').forEach(a => {
    a.href = `https://wa.me/${phone}`;
  });

  // Completar todos los enlaces a Google Maps marcados con data-maps-link
  document.querySelectorAll('a[data-maps-link]').forEach(a => {
    a.href = window.BLANSH_CONFIG.STORE_MAPS_URL;
  });

  // Mantener actualizado el año del footer
  document.querySelectorAll('.footer-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
