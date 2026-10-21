// Original architectural illustration, informed by the private frontal reference.
// The reference itself is neither bundled nor redistributed.
export function louvreSVG() {
  let windows = '', arches = '', roof = '', details = '';
  for (let i=0;i<19;i++) {
    const x=58+i*27;
    if (x>270 && x<340) continue;
    windows += `<path d="M${x} 147v-10q5-9 10 0v10Z" fill="#6b634b" stroke="#c7a56a" stroke-width="2"/><rect x="${x+2}" y="110" width="6" height="10" fill="#706248"/><path d="M${x-2} 108h14M${x-1} 149h12" stroke="#af8b56"/>`;
    arches += `<path d="M${x-2} 200v-23q7-15 14 0v23" fill="#766e54" stroke="#c5a56b" stroke-width="3"/><path d="M${x+5} 166v34M${x-2} 181h14" stroke="#a18d62" stroke-width="1"/>`;
    roof += `<path d="M${x} 88v-17h10v17" fill="#78808a"/><path d="M${x+1} 72h8" stroke="#bac0c2" stroke-width="2"/>`;
  }
  for(let x=46;x<558;x+=13) details+=`<path d="M${x} 103v5M${x} 156v5" stroke="#b89a67" stroke-width="3"/>`;
  let grid='';
  for(let i=-8;i<=8;i++)grid+=`<path d="M${302+i*17} 110l-100 100M${302+i*17} 110l100 100"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 604 252" role="img" aria-label="Original frontal illustration of the Louvre palace and glass pyramid"><defs><linearGradient id="stone" x2="0" y2="1"><stop stop-color="#e8c995"/><stop offset="1" stop-color="#d8b57d"/></linearGradient><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#e7dfb5" stop-opacity=".86"/><stop offset="1" stop-color="#a6b4a0" stop-opacity=".9"/></linearGradient><clipPath id="pyramid"><path d="M195 209 302 94 409 209Z"/></clipPath></defs>
  <ellipse cx="302" cy="233" rx="273" ry="10" fill="#223630" opacity=".1"/><rect x="27" y="213" width="550" height="16" rx="4" fill="#aca599"/><rect x="31" y="211" width="542" height="12" rx="3" fill="#d6d1c5"/><path d="M39 96H565V205H39Z" fill="url(#stone)"/><path d="M43 96 51 64H553L562 96Z" fill="#56616c"/>${roof}<path d="M40 95H564M39 104H565M39 156H565M39 162H565M39 202H565" stroke="#eed7aa" stroke-width="3"/>${details}${windows}${arches}
  <g id="pavilions"><path d="M35 204V89h50v115M519 204V89h50v115" fill="#dbb57b"/><path d="M34 89 42 54H77L86 89M518 89 527 54H561L570 89" fill="#5c6671"/><path d="M39 57H80M524 57H564" stroke="#aab0b2" stroke-width="3"/><path d="M45 90v112M75 90v112M530 90v112M559 90v112" stroke="#efcf98" stroke-width="5"/>
  <g fill="#756447" stroke="#c39d61" stroke-width="2"><path d="M52 83V72h15v11ZM536 83V72h15v11Z"/><path d="M51 142v-20q8-15 16 0v20ZM536 142v-20q8-15 16 0v20Z"/><path d="M49 202v-22q10-18 20 0v22ZM534 202v-22q10-18 20 0v22Z"/></g><path d="M59 68v18M544 68v18M59 115v28M544 115v28M59 173v30M544 173v30M44 100h31M528 100h31M44 153h31M528 153h31" stroke="#bd975f" stroke-width="2"/></g>
  <path d="M246 205V49H358V205Z" fill="#dbb77e"/><path d="M252 50 302 20 352 50Z" fill="#56616d"/><path d="M245 49 302 12 359 49 353 56 302 24 251 56Z" fill="#69727a"/><path d="M251 54 302 27 353 54Z" fill="#eacb93"/><path d="M269 48 302 32 335 48Z" fill="#bd985f"/><path d="M261 60H343V201H261Z" fill="#e8c894"/><path d="M247 60H357M250 68H354M252 153H352" stroke="#f4daac" stroke-width="3"/>
  <path d="M288 137V87q14-27 28 0v50Z" fill="#9f8355" stroke="#d5ac6c" stroke-width="3"/><path d="M302 72v69M290 94h24M290 112h24" stroke="#ceb17c"/><path d="M271 116V81h6v35M328 116V81h6v35" fill="#8f744c" stroke="#ca9e60" stroke-width="2"/><path d="M269 80h10M326 80h10M268 119h12M326 119h10" stroke="#b68e56" stroke-width="2"/>
  <path d="M247 36V9h9v26M348 36V9h9v27" stroke="#7b8590" stroke-width="7"/><path d="M241 7h15M348 7h15M273 9h58" stroke="#69747e" stroke-width="4"/><path d="M275 11h54v14l-27-13-27 13Z" fill="#424e5c"/>
  <path d="M195 209 302 94 409 209Z" fill="url(#glass)" stroke="#948d69" stroke-width="1.4"/><g clip-path="url(#pyramid)" fill="none" stroke="#8f9675" stroke-width=".8">${grid}</g><path d="M302 94v115M195 209h214" stroke="#8b8d6a" stroke-width="1.4"/><path d="M302 94 329 209H302Z" fill="#f4e9c1" opacity=".22"/>
  <path d="M95 210h414v10H95Z" fill="#7e8c57"/><path d="M98 209h408" stroke="#a1ac74" stroke-width="3"/><path d="M190 210h224" stroke="#dfd5b3" stroke-width="4"/>
  </svg>`;
}
