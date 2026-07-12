function hardFilterCars(cars,user){
 return cars.filter(car=>{
   if(user.method==='buy' && user.budget>0 && car.price>user.budget) return false;
   if(user.method==='lease' && user.leaseBudget>0 && car.lease>user.leaseBudget) return false;

   if(user.fuel && car.fuel!==user.fuel) return false;

   if(car.seats < user.people) return false;

   if(user.baggage==='høj' && car.boot < 500) return false;
   if(user.baggage==='mellem' && car.boot < 400) return false;

   if(user.towNeed==='campingvogn' && car.tow < 1200) return false;
   if(user.towNeed==='trailer' && car.tow < 750) return false;

   return true;
 });
}

function calculateMatch(car,user){
 let score=0;
 let reasons=[];

 score+=50; reasons.push('✅ Matcher de vigtigste krav');

 if(car.range>=500){score+=10; reasons.push('✅ God rækkevidde');}
 if(car.boot>=500){score+=10; reasons.push('✅ God bagageplads');}
 if(car.tow>=1200 && user.towNeed!=='ingen'){score+=10; reasons.push('✅ Opfylder trækbehov');}
 if(car.price<=(user.budget||9999999)){score+=10; reasons.push('✅ Indenfor budget');}

 return {score:Math.min(score,100),reasons};
}
