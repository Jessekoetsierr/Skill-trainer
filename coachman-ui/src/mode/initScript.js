/**
 * Inline script voor in <head>, vóór de CSS: zet data-mode direct,
 * zodat er geen flits van de verkeerde modus is bij het laden.
 * Volgorde: handmatige voorkeur → laatst berekende auto-modus (nog geldig) → vaste tijden.
 */
/** @type {string} */
export const modeInitScript = `(function(){var d=document.documentElement;try{var L=localStorage,p=L.getItem("coachman.mode");if(p==="day"||p==="night"){d.dataset.mode=p;return}var c=JSON.parse(L.getItem("coachman.auto")||"null");if(c&&c.until>Date.now()&&(c.mode==="day"||c.mode==="night")){d.dataset.mode=c.mode;return}var f=JSON.parse(L.getItem("coachman.fallback")||"null")||{dayStart:"07:00",nightStart:"19:00"},n=new Date(),m=n.getHours()*60+n.getMinutes(),t=function(x){var a=x.split(":");return Number(a[0])*60+Number(a[1])},a=t(f.dayStart),b=t(f.nightStart);d.dataset.mode=(a<b?(m>=a&&m<b):(m>=a||m<b))?"day":"night"}catch(e){d.dataset.mode="day"}})();`;
