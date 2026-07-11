let cars=[];
let favorites=JSON.parse(localStorage.getItem('favorites')||'[]');
let compareList=[];

fetch('cars.json')
 .then(r=>r.json())
 .then(data=>{
   cars=data;
   renderCars(data);
   renderFavorites();
 });

function calculateScore(car){
 let score=50;
 if(car.range>=500) score+=15;
 if(car.tow>=1500) score+=10;
 if(car.boot>=500) score+=10;
 if(car.seats>=5) score+=5;
 return Math.min(score,100);
}

function buildReasons(car){
 const reasons=[];
 if(car.range>=500) reasons.push('✅ Høj rækkevidde');
 if(car.boot>=500) reasons.push('✅ God bagageplads');
 if(car.tow>=1500) reasons.push('✅ Velegnet til trailer/campingvogn');
 if(car.seats>=5) reasons.push('✅ God familiebil');
 return reasons.join('<br>');
}

function renderCars(list){
 const container=document.getElementById('resultsContainer');
 container.innerHTML=list.map(car=>{
 const score=calculateScore(car);
 const scoreClass=score>=90?'score-green':score>=70?'score-yellow':'score-red';
 return `
 <div class="car-card">
 <h2>${car.brand} ${car.model}</h2>
 <div class="match-score ${scoreClass}">${score}/100</div>
 <div class="reasons">${buildReasons(car)}</div>
 <div class="spec-grid">
 <div class="spec">Pris: ${car.price?.toLocaleString('da-DK')} kr.</div>
 <div class="spec">Leasing: ${car.lease||'-'} kr./md.</div>
 <div class="spec">Rækkevidde: ${car.range||'-'} km</div>
 <div class="spec">Bagagerum: ${car.boot||'-'} L</div>
 <div class="spec">Træk: ${car.tow||'-'} kg</div>
 <div class="spec">Sæder: ${car.seats||'-'}</div>
 </div>
 <div class="actions">
 <button onclick="addFavorite('${car.brand} ${car.model}')">❤️ Favorit</button>
 <button onclick="addCompare('${car.brand} ${car.model}')">⚖️ Sammenlign</button>
 </div>
 <div class="car-links">
 <a target="_blank" href="${car.homepage||'#'}">🌐 Producent</a>
 <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand+' '+car.model+' FDM test')}">🧪 FDM</a>
 <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand+' '+car.model+' Bil Magasinet test')}">📰 Bil Magasinet</a>
 </div>
 </div>`}).join('');
}

function addFavorite(name){
 if(!favorites.includes(name)){
   favorites.push(name);
   localStorage.setItem('favorites',JSON.stringify(favorites));
 }
 renderFavorites();
}

function renderFavorites(){
 const el=document.getElementById('favoritesList');
 if(el) el.innerHTML=favorites.length?favorites.join('<br>'):'Ingen favoritter endnu';
}

function addCompare(name){
 if(compareList.length<4 && !compareList.includes(name)) compareList.push(name);
 const el=document.getElementById('compareList');
 if(el) el.innerHTML=compareList.join('<br>');
}

document.addEventListener('click',e=>{
 if(e.target.id==='darkModeBtn') document.body.classList.toggle('dark-mode');
});
