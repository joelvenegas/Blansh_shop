const myCarouselElement = document.querySelector('#carouselExampleCaptions');
if (myCarouselElement) {
  new bootstrap.Carousel(myCarouselElement, {
    interval: 3000,
    touch: true,
    pause: 'hover'
  });
}

fetch('assets/src/Items.csv')
  .then(response => {
    if (!response.ok) throw new Error('Error al cargar CSV');
    return response.text();
  })
  .then(text => {
    const lineas = text.trim().split('\n');
    const contenedor = document.querySelector('.items-cards');

    if (lineas.length === 0) {
      contenedor.innerHTML = '<p class="text-center">No hay productos disponibles.</p>';
      return;
    }

    lineas.forEach((linea, index) => {
      const [titulo, descripcion, precio, fotourl] = linea.split(';');

      if (!titulo || !descripcion || !precio || !fotourl) {
        console.warn(`L�nea ${index + 1} incompleta, saltando...`);
        return;
      }

      const card = `
        <div class="card">
          <img src="${fotourl}" class="card-img-top" alt="${titulo}" loading="lazy">
          <div class="card-body">
            <h5 class="card-title">${titulo}</h5>
            <p class="card-text">${descripcion}</p>
            <p class="card-text fw-bold">$${precio}</p>
            <a href="#" class="btn btn-primary">Comprar</a>
          </div>
        </div>
      `;

      contenedor.innerHTML += card;
    });
  })
  .catch(error => console.error('Error:', error));