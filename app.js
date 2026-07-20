let cars = [];
let carsLoaded = false;

// Robust fetch der virker på ALLE hosting-platforme
async function loadCars() {
  const url = 'cars.json?v=' + Date.now(); // cache-buster

  try {
    const response = await fetch(url);
    const text = await response.text();

    console.log("Raw cars.json response:", text.slice(0, 200));

    try {
      cars = JSON.parse(text);
      carsLoaded = true;
      console.log("Biler indlæst:", cars.length);

      document.getElementById('findCarBtn').disabled = false;
    } catch (jsonErr) {
      console.error("JSON-fejl:", jsonErr);
      document.getElementById('resultsContainer').innerHTML =
        "<p>Fejl: Serveren returnerede ikke gyldig JSON.</p>";
    }

  } catch (err) {
    console.error("Fetch-fejl:", err);
    document.getElementById('resultsContainer').innerHTML =
      "<p>Fejl: Kunne ikke hente cars.json.</p>";
  }
}

loadCars();

function getUser() {
  return {
    method: document.querySelector("input[name='method']:checked")?.value || 'buy',

    // Prisinterval
    minPrice: Number(document.getElementById('minPrice')?.value || 0),
    maxPrice: Number(document.getElementById('maxPrice')?.value || 9999999),

    leaseBudget: Number(document.getElementById('leaseBudget')?.value || 0),

    fuel: document.getElementById('fuel')?.value || '',
    tow: document.getElementById('towNeed')?.value || 'ingen',
    people: Number(document.getElementById('people')?.value || 1),
    baggage: document.getElementById('baggage')?.value || 'mellem',

    yearlyKm: Number(document.getElementById('yearlyKm')?.value || 0),
    commute: Number(document.getElementById('commute')?.value || 1),

    minRange: Number(document.getElementById('minRange')?.value || 0),

    kmPerCharge: Math.round(
      (Number(document.getElementById('yearlyKm')?.value || 0) / 365) *
      Number(document.getElementById('commute')?.value || 1)
    )
  };
}

function hardFilter(car, user) {

  // Prisinterval for køb
  if (user.method === 'buy') {
    if (car.price < user.minPrice) return false;
    if (car.price > user.maxPrice) return false;
  }

  // Leasing
  if (user.method === 'lease' && user.leaseBudget > 0) {
    const leasePrice = car.lease ?? 999999;
    if (leasePrice > user.leaseBudget) return false;
  }

  // Drivlinje
  if (user.fuel && car.fuel !== user.fuel) return false;

  // Sæder
  if ((car.seats || 0) < user.people) return false;

  // Træk
  if (user.tow === 'campingvogn' && (car.tow || 0) < 1200) return false;
  if (user.tow === 'trailer' && (car.tow || 0) < 750) return false;

  // Minimum rækkevidde
  if (user.minRange > 0 && car.range < user.minRange) return false;

  return true;
}

function scoreCar(car, user) {
  let score = 50;
  let reasons = ['✅ Matcher dine grundlæggende krav'];

  if (car.range >= 500) {
    score += 8;
    reasons.push('✅ God rækkevidde');
  }
  if (user.yearlyKm > 30000 && car.range >= 550) {
    score += 4;
    reasons.push('✅ Velegnet til meget kørsel');
  }

  if (user.baggage === 'høj' && car.boot >= 550) {
    score += 8;
    reasons.push('✅ Stor bagageplads');
  } else if (user.baggage === 'mellem' && car.boot >= 450) {
    score += 5;
    reasons.push('✅ Passende bagageplads');
  }

  if (user.tow !== 'ingen') {
    if (user.tow === 'trailer' && car.tow >= 750) {
      score += 6;
      reasons.push('✅ Opfylder trailer-trækbehov');
    }
    if (user.tow === 'campingvogn' && car.tow >= 1200) {
      score += 8;
      reasons.push('✅ Opfylder campingvogn-trækbehov');
    }
  }

  if (car.seats >= user.people) {
    score += 4;
    reasons.push('✅ Plads til familien');
  }

  return {
    score: Math.min(score, 100),
    reasons
  };
}

function renderResults(list) {
  const el = document.getElementById('resultsContainer');

  if (!list.length) {
    el.innerHTML = `<p>Ingen biler matcher dine kriterier. Prøv at justere pris, rækkevidde eller trækbehov.</p>`;
    return;
  }

  el.innerHTML = list.map(car => `
    <div class="result-card">
      <h3>${car.brand} ${car.model}</h3>
      <div class="score">${car.score}% match</div>

      <p>${car.reasons.join('<br>')}</p>

      <p><strong>Drivlinje:</strong> ${car.fuel}</p>
      <p><strong>Biltype:</strong> ${car.body}</p>
      <p><strong>Pris:</strong> ${Number(car.price).toLocaleString('da-DK')} kr</p>
      <p><strong>Leasing:</strong> ${car.lease || '-'} kr/md</p>
      <p><strong>Rækkevidde:</strong> ${car.range} km</p>
      <p><strong>Sæder:</strong> ${car.seats}</p>
      <p><strong>Bagagerum:</strong> ${car.boot} liter</p>
      <p><strong>Trækkapacitet:</strong> ${car.tow} kg</p>

      <p>
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model)}">Producent</a> |
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ' FDM test')}">FDM Test</a> |
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ' Bil Magasinet test')}">Bil Magasinet</a>
      </p>
    </div>
  `).join('');
}

function findCars() {
  if (!carsLoaded) {
    document.getElementById('resultsContainer').innerHTML =
      "<p>Vent et øjeblik – bilerne er ved at blive indlæst. Prøv igen om lidt.</p>";
    return;
  }

  const user = getUser();

  // 1) Filtrer først på hårde krav
  let filtered = cars.filter(c => hardFilter(c, user));

  // 2) Sortér de filtrerede biler efter pris (billigste først)
  filtered.sort((a, b) => a.price - b.price);

  // 3) Beregn score EFTER pris-sortering
  const ranked = filtered
    .map(c => {
      const s = scoreCar(c, user);
      return { ...c, score: s.score, reasons: s.reasons };
    })
    .slice(0, 10); // behold kun de 10 billigste der matcher

  renderResults(ranked);
}

document.getElementById('findCarBtn')?.addEventListener('click', findCars);
