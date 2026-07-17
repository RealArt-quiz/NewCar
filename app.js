
// Bilrådgiver Danmark - app_bilraadgiver_v3.js
// Stabil version med hard filtering først og derefter blød scoring

let cars = [];

// Load car database
fetch('cars.json')
  .then(r => r.json())
  .then(data => {
    cars = data;
    console.log('Biler indlaest:', cars.length);
  })
  .catch(err => console.error('Fejl ved indlaesning af cars.json', err));

// Slider helpers
const commute = document.getElementById('commute');
const yearlyKm = document.getElementById('yearlyKm');

if (commute) {
  commute.addEventListener('input', () => {
    document.getElementById('commuteValue').innerText = commute.value + ' km';
  });
}

if (yearlyKm) {
  yearlyKm.addEventListener('input', () => {
    document.getElementById('yearlyKmValue').innerText = Number(yearlyKm.value).toLocaleString('da-DK') + ' km';
  });
}

// Collect user input
function getUser() {
  const method = document.querySelector("input[name='method']:checked")?.value || 'buy';

  return {
    method: method,
    budget: Number(document.getElementById('budget')?.value || 0),
    leaseBudget: Number(document.getElementById('leaseBudget')?.value || 0),
    fuel: document.getElementById('fuel')?.value || null,
    tow: document.getElementById('towNeed')?.value || 'ingen',
    people: Number(document.getElementById('people')?.value || 1),
    baggage: document.getElementById('baggage')?.value || 'mellem',
    yearlyKm: Number(document.getElementById('yearlyKm')?.value || 0),
    commute: Number(document.getElementById('commute')?.value || 0)
  };
}

// HARD FILTERING
function hardFilter(car, user) {
  if (user.method === 'buy' && user.budget > 0 && car.price > user.budget) return false;

  if (user.method === 'lease' && user.leaseBudget > 0) {
    if ((car.lease || Infinity) > user.leaseBudget) return false;
  }

  if (user.fuel && car.fuel !== user.fuel) return false;

  if ((car.seats || 0) < user.people) return false;

  if (user.tow === 'campingvogn' && (car.tow || 0) < 1200) return false;
  if (user.tow === 'trailer' && (car.tow || 0) < 750) return false;

  return true;
}

// SOFT SCORING
function scoreCar(car, user) {
  let score = 0;
  let reasons = [];

  // Base score
  score += 50;
  reasons.push('Matcher dine grundlaeggende krav');

  // Driving needs
  if (user.yearlyKm > 25000 && car.range >= 500) {
    score += 15;
    reasons.push('Velegnet til langt aarligt koerselsbehov');
  }

  // Family
  if (car.seats >= user.people) {
    score += 15;
    reasons.push('Plads til familien');
  }

  // Baggage
  if (user.baggage === 'hoej' && car.boot >= 500) {
    score += 10;
    reasons.push('God bagageplads');
  }

  // Towing
  if (user.tow !== 'ingen' && car.tow >= 1200) {
    score += 10;
    reasons.push('Opfylder dit traekbehov');
  }

  // Fuel preference
  if (car.fuel === user.fuel) {
    score += 10;
    reasons.push('Matcher oensket drivlinje');
  }

  return { score: Math.min(score, 100), reasons };
}

// Main function
function findCars() {
  const user = getUser();

  if (!cars.length) {
    alert('Bil-databasen er ikke klar endnu');
    return;
  }

  const filtered = cars.filter(car => hardFilter(car, user));

  if (!filtered.length) {
    document.getElementById('resultsContainer').innerHTML =
      '<p>Ingen biler matcher dine krav. Proev at loosne dem lidt.</p>';
    return;
  }

  const ranked = filtered
    .map(car => {
      const res = scoreCar(car, user);
      return { ...car, score: res.score, reasons: res.reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  renderResults(ranked);
}

// Render results
function renderResults(list) {
  const el = document.getElementById('resultsContainer');

  el.innerHTML = list.map(car => `
    <div class="result-card">
      <h3>${car.brand} ${car.model}</h3>
      <div class="score">${car.score}% match</div>
      <p>${car.reasons.join('<br>')}</p>
      <p><strong>Pris:</strong> ${Number(car.price).toLocaleString('da-DK')} kr</p>
      <p><strong>Raekkevidde:</strong> ${car.range || '-'} km</p>
      <p><strong>Traek:</strong> ${car.tow || '-'} kg</p>
      <p>
        <a target="_blank" 
href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ">Producent</a> |
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ' FDM test')}">FDM Test</a> |
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ' Bil Magasinet test')}">Bil Magasinet</a>
      </p>
    </div>
  `).join('');
}

// Button hookup
const btn = document.getElementById('findCarBtn');
if (btn) btn.addEventListener('click', findCars);

// Expose for debugging
window.findCars = findCars;
