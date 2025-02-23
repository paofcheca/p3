document.addEventListener('DOMContentLoaded', iniciarJuego);

const NUM_PAREJAS = 8;
let primerCarta = null;
let segundaCarta = null;
let bloqueoTablero = false;
let turnos = 0;
let parejasEncontradas = 0;

const board = document.getElementById('game-board');
const turnsSpan = document.getElementById('turns');
const reiniciarBtn = document.getElementById('restart');
const themeSelector = document.getElementById('theme-selector');
const soundToggle = document.getElementById('sound-toggle');

reiniciarBtn.addEventListener('click', iniciarJuego);
themeSelector.addEventListener('change', iniciarJuego);


function iniciarJuego() {
  primerCarta = null;
  segundaCarta = null;
  bloqueoTablero = false;
  turnos = 0;
  parejasEncontradas = 0;
  turnsSpan.textContent = "Turnos: " + turnos;
  board.innerHTML = '';

  const selectedTheme = themeSelector.value;

  if (selectedTheme === 'frenchdeck') {
    cargarBarajaFrancesa();
  } else if (selectedTheme === 'pokemon') {
    cargarPokemon();
  } else if (selectedTheme === 'rickandmorty') {
    cargarRickAndMorty();
  } else if (selectedTheme === 'art') {
    cargarArte();
  }
}

function cargarBarajaFrancesa() {
  fetch(`https://deckofcardsapi.com/api/deck/new/draw/?count=${NUM_PAREJAS}`)
    .then(response => response.json())
    .then(data => {
      let cards = data.cards.map(card => ({
        id: card.code,
        name: `${card.value} of ${card.suit}`,
        image: card.image
      }));

      generarCartas(cards);
    })
    .catch(error => console.error("Error al cargar baraja francesa:", error));
}

function cargarPokemon() {
  fetch(`https://pokeapi.co/api/v2/pokemon?limit=${NUM_PAREJAS}`)
    .then(response => response.json())
    .then(data => {
      let cards = data.results.map((pokemon, index) => ({
        id: index,
        name: pokemon.name,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`
      }));

      generarCartas(cards);
    })
    .catch(error => console.error("Error al cargar Pokémon:", error));
}

function cargarRickAndMorty() {
  fetch(`https://rickandmortyapi.com/api/character?page=1`)
    .then(response => response.json())
    .then(data => {
      let cards = data.results.slice(0, NUM_PAREJAS).map(character => ({
        id: character.id,
        name: character.name,
        image: character.image
      }));

      generarCartas(cards);
    })
    .catch(error => console.error("Error al cargar Rick & Morty:", error));
}

function cargarArte() {
  fetch(`https://api.artic.edu/api/v1/artworks?limit=${NUM_PAREJAS}`)
    .then(response => response.json())
    .then(data => {
      let cards = data.data.map(artwork => ({
        id: artwork.id,
        name: artwork.title,
        image: `https://www.artic.edu/iiif/2/${artwork.image_id}/full/200,/0/default.jpg`
      }));

      generarCartas(cards);
    })
    .catch(error => console.error("Error al cargar obras de arte:", error));
}

function generarCartas(cards) {
  let cardPairs = [];
  cards.forEach(card => {
    cardPairs.push(card);
    cardPairs.push({ ...card });
  });

  shuffle(cardPairs);

  cardPairs.forEach(card => {
    const cardElement = crearCarta(card);
    board.appendChild(cardElement);
  });
}

function crearCarta(cardData) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.id = cardData.id;

  const cardInner = document.createElement('div');
  cardInner.classList.add('card-inner');

  const cardFront = document.createElement('div');
  cardFront.classList.add('card-face', 'card-front');
  const imgFront = document.createElement('img');
  imgFront.src = cardData.image;
  imgFront.alt = cardData.name;
  cardFront.appendChild(imgFront);

  const cardBack = document.createElement('div');
  cardBack.classList.add('card-face', 'card-back');
  cardBack.textContent = "?";

  cardInner.appendChild(cardFront);
  cardInner.appendChild(cardBack);
  card.appendChild(cardInner);

  card.addEventListener('click', voltearCarta);
  return card;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function voltearCarta() {
  if (bloqueoTablero) return;
  if (this.classList.contains('flipped')) return;

  this.classList.add('flipped');
  
  if (!primerCarta) {
    primerCarta = this;
    return;
  }

  segundaCarta = this;
  bloqueoTablero = true;
  turnos++;
  turnsSpan.textContent = "Turnos: " + turnos;

  // Mostrar trivia cada 3 turnos
  if (turnos % 3 === 0) {
    mostrarTrivia();
    console.log("Mostrando trivia en el turno:", turnos);
  }

  if (primerCarta.dataset.id === segundaCarta.dataset.id) {
    primerCarta.removeEventListener('click', voltearCarta);
    segundaCarta.removeEventListener('click', voltearCarta);
    parejasEncontradas++;
    resetearSeleccion();

    if (parejasEncontradas === NUM_PAREJAS) {
      setTimeout(() => {
        alert(`🎉 ¡Ganaste en ${turnos} turnos! 🎉`);
      }, 500);
    }
  } else {
    setTimeout(() => {
      primerCarta.classList.remove('flipped');
      segundaCarta.classList.remove('flipped');
      resetearSeleccion();
    }, 1000);
  }
}


async function mostrarTrivia() {
  const pregunta = await obtenerPreguntaTrivia();
  if (!pregunta) {
    console.error("❌ No se obtuvo ninguna pregunta de la API");
    return;
  }

  // Decodificar la pregunta antes de mostrarla
  const preguntaDecodificada = decodificarHTML(pregunta.question);
  console.log("✅ Pregunta decodificada:", preguntaDecodificada);

  // Mostrar la pregunta en el elemento correspondiente
  const preguntaElemento = document.getElementById('trivia-pregunta');
  preguntaElemento.innerHTML = preguntaDecodificada;

  // Mezclar y decodificar las respuestas
  const opciones = [...pregunta.incorrect_answers, pregunta.correct_answer];
  opciones.sort(() => Math.random() - 0.5);

  const contenedorOpciones = document.getElementById('trivia-opciones');
  contenedorOpciones.innerHTML = '';

  opciones.forEach(opcion => {
    const boton = document.createElement('button');
    boton.textContent = decodificarHTML(opcion); // Decodificar cada opción
    boton.onclick = () => verificarRespuesta(opcion, pregunta.correct_answer);
    contenedorOpciones.appendChild(boton);
  });

  // Mostrar el modal
  document.getElementById('trivia-modal').style.display = 'block';
  document.getElementById('trivia-overlay').style.display = 'block';
}


function verificarRespuesta(seleccionada, correcta) {
  const botones = document.querySelectorAll('#trivia-opciones button');

  botones.forEach(boton => {
    if (boton.textContent === correcta) {
      boton.classList.add('correct');
    } else if (boton.textContent === seleccionada) {
      boton.classList.add('incorrect');
    }
    boton.disabled = true; // Deshabilitar botones después de seleccionar
  });

  // Mostrar mensaje
  if (seleccionada === correcta) {
    setTimeout(() => alert("🎉 ¡Respuesta Correcta!"), 300);
  } else {
    setTimeout(() => alert("❌ Respuesta Incorrecta"), 300);
  }

  // Cerrar trivia después de 2 segundos
  setTimeout(cerrarTrivia, 2000);
}


function cerrarTrivia() {
  document.getElementById('trivia-modal').style.display = 'none';
  document.getElementById('trivia-overlay').style.display = 'none';
}

function resetearSeleccion() {
  primerCarta = null;
  segundaCarta = null;
  bloqueoTablero = false;
}

// Función para obtener una pregunta de la API
async function obtenerPreguntaTrivia() {
  try {
    const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
    const data = await response.json();
    return data.results[0];
  } catch (error) {
    console.error("Error al obtener la trivia:", error);
    return null;
  }
}
// Función para decodificar caracteres HTML
function decodificarHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

//Funciones para obtener el CLIMA
// Función para obtener el clima usando Open-Meteo
async function obtenerClima(lat = 40.4168, lon = -3.7038) { // 📍 Madrid por defecto
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    mostrarClima(data.current_weather);
  } catch (error) {
    console.error("🌧️ Error al obtener el clima:", error);
  }
}

// Mostrar el clima en el widget
function mostrarClima(data) {
  const climaDiv = document.getElementById("widget-clima");

  // Elegir icono según código de clima
  const icono = data.weathercode < 3 ? "☀️" :
                data.weathercode < 6 ? "🌥️" :
                data.weathercode < 8 ? "🌧️" : "🌩️";

  climaDiv.innerHTML = `
    <h4>🌦️ Clima Actual</h4>
    <div style="font-size: 2.5rem;">${icono}</div>
    <p><strong>${data.temperature}°C</strong></p>
    <p>💨 Viento: ${data.windspeed} km/h</p>
  `;
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  //  Usa geolocalización si el usuario la permite
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        obtenerClima(latitude, longitude);
      },
      () => obtenerClima() 
    );
  } else {
    obtenerClima();
  }
});

async function obtenerCitaBanner() {
  try {
    const apiUrl = 'https://zenquotes.io/api/random';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

    const response = await fetch(proxyUrl);
    const data = await response.json();

    // AllOrigins devuelve la respuesta en 'contents'
    const parsedData = JSON.parse(data.contents);

    document.getElementById('texto-cita').textContent = `"${parsedData[0].q}"`;
    document.getElementById('autor-cita').textContent = `- ${parsedData[0].a}`;
  } catch (error) {
    console.error("⚠️ Error al obtener la cita con AllOrigins:", error);
    document.getElementById('texto-cita').textContent = "⚠️ No se pudo obtener la cita.";
    document.getElementById('autor-cita').textContent = "";
  }
}



// ✅ Event Listener para el botón
document.getElementById('nueva-cita-btn').addEventListener('click', obtenerCitaBanner);

// ⚡ Cargar una cita inicial al cargar la página
window.onload = obtenerCitaBanner;

