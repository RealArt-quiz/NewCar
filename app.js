fetch('cars.json').then(r=>r.json()).then(c=>console.log('Biler:',c.length));
