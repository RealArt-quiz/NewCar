let cars=[];
fetch('cars.json').then(r=>r.json()).then(data=>cars=data);

function getUser(){return {method:document.querySelector("input[name='method']:checked")?.value||'buy',budget:Number(document.getElementById('budget')?.value||0),leaseBudget:Number(document.getElementById('leaseBudget')?.value||0),fuel:document.getElementById('fuel')?.value||null,tow:document.getElementById('towNeed')?.value||'ingen',people:Number(document.getElementById('people')?.value||1),baggage:document.getElementById('baggage')?.value||'mellem',yearlyKm:Number(document.getElementById('yearlyKm')?.value||0)};}

function hardFilter(car,user){if(user.method==='buy'&&user.budget>0&&car.price>user.budget)return false;if(user.method==='lease'&&user.leaseBudget>0&&(car.lease||999999)>user.leaseBudget)return false;if(user.fuel&&car.fuel!==user.fuel)return false;if((car.seats||0)<user.people)return false;if(user.tow==='campingvogn'&&(car.tow||0)<1200)return false;if(user.tow==='trailer'&&(car.tow||0)<750)return false;return true;}

function scoreCar(car,user){let score=50;let reasons=['✅ Matcher dine krav'];if(car.range>=500){score+=10;reasons.push('✅ God rækkevidde');}if(car.boot>=500){score+=10;reasons.push('✅ God bagageplads');}if(car.tow>=1200&&user.tow!=='ingen'){score+=10;reasons.push('✅ Opfylder trækbehov');}return {score:Math.min(score,100),reasons};}

function renderResults(list){const el=document.getElementById('resultsContainer');el.innerHTML=list.map(car=>`<div class="result-card"><h3>${car.brand} ${car.model}</h3><div class="score">${car.score}% match</div><p>${car.reasons.join('<br>')}</p><p><strong>Drivlinje:</strong> ${car.fuel||'-'}</p><p><strong>Biltype:</strong> ${car.body||'-'}</p><p><strong>Pris:</strong> ${Number(car.price).toLocaleString('da-DK')} kr</p><p><strong>Leasing:</strong> ${car.lease||'-'} kr/md</p><p><strong>Rækkevidde:</strong> ${car.range||'-'} km</p><p><strong>Sæder:</strong> ${car.seats||'-'}</p><p><strong>Bagagerum:</strong> ${car.boot||'-'} liter</p><p><strong>Trækkapacitet:</strong> ${car.tow||'-'} kg</p>
  
  <p>
    <a target="_blank" 
href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ">Producent</a> |
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ' FDM test')}">FDM Test</a> |
        <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(car.brand + ' ' + car.model + ' Bil Magasinet test')}">Bil Magasinet</a>
      </p></div>`).join('');}

function findCars(){const user=getUser();const ranked=cars.filter(c=>hardFilter(c,user)).map(c=>{const s=scoreCar(c,user);return {...c,score:s.score,reasons:s.reasons};}).sort((a,b)=>b.score-a.score).slice(0,10);renderResults(ranked);}

document.getElementById('findCarBtn')?.addEventListener('click',findCars);
