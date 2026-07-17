let cars = [];

fetch('cars.json')
  .then(r => r.json())
  .then(data => {
    cars = data;
  });

const commute = document.getElementById('commute');
const yearlyKm = document.getElementById('yearlyKm');

if (commute) {
  commute.addEventListener('input', () => {
    document.getElementById('commuteValue').textContent = commute.value + ' km';
  });
}

if (yearlyKm) {
  yearlyKm.addEventListener('input', () => {
    document.getElementById('yearlyKmValue').textContent = Number(yearlyKm.value).toLocaleString('da-DK') + ' km';
  });
}

function getUserProfile() {
  return {
    method: document.querySelector('input[name="method"]:checked')?.value || 'buy',
    budget: Number(document.getElementById('budget')?.value || 0),
    leaseBudget: Number(document.getElementById('leaseBudget')?.value || 0),
    fuel: document.getElementById('fuel')?.value,
    towNeed: document.getElementById('towNeed')?.value,
    people: Number(document.getElementById('people')?.value || 1),
    baggage: document.getElementById('baggage')?.value,
    yearlyKm: Number(document.getElementById('yearlyKm')?.value || 0),
    commute: Number(document.getElementById('commute')?.value || 0)
  };
}

function calculateMatch(car, user) {
  let score = 0;
  const reasons = [];

  if (user.method === 'buy' && user.budget > 0) {
    if (car.price <= user.budget) {
      score += 40;
      reasons.push('✅ Passer til dit budget');
    }
  }

  if (user.method === 'lease' && user.leaseBudget > 0) {
    if ((car.lease || 999999) <= user.leaseBudget) {
      score += 40;
      reasons.push('✅ Passer til dit leasingbudget');
    }
  }

  if (car.fuel === user.fuel) {
    score += 10;
    reasons.push('✅ Matcher ønsket drivlinje');
  }

  if ((car.seats || 0) >= user.people) {
    score += 15;
    reasons.push('✅ Plads til familien');
  }

  if (user.baggage === 'høj' && (car.boot || 0) >= 500) {
    score += 15;
    reasons.push('✅ God bagageplads');
  }

  if (user.towNeed === 'campingvogn' && (car.tow || 0) >= 1200) {
    score += 20;
    reasons.push('✅ Kan trække campingvogn');
  }

  if (user.towNeed === 'trailer' && (car.tow || 0) >= 750) {
    score += 10;
    reasons.push('✅ Kan trække trailer');
  }

  return { score, reasons };
}

function findCars() {
  const user = getUserProfile();

  const results = cars
    .map(car => {
      const match = calculateMatch(car, user);
      return {
        ...car,
        matchScore: match.score,
        reasons: match.reasons
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  renderResults(results);
}

function renderResults(results) {
  const container = document.getElementById('resultsContainer');

  container.innerHTML = results.map(car => `
    <div class="result-card">
      <h3>${car.brand} ${car.model}</h3>
      <div class="score">${car.matchScore}% match</div>

      <p>${car.reasons.join('<br>')}</p>

      <p><strong>Pris:</strong> ${Number(car.price).toLocaleString('da-DK')} kr.</p>
      <p><strong>Rækkevidde:</strong> ${car.range || '-'} km</p>
      <p><strong>Træk:</strong> ${car.tow || '-'} kg</p>

      <p>
        <a target="_blank" href="${car.homepage}">Producent</a> |
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ' FDM test')}">FDM Test</a> |
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ' Bil Magasinet test')}">Bil Magasinet</a>
      </p>
    </div>
  `).join('');
}

document.getElementById('findCarBtn')?.addEventListener('click', findCars);
