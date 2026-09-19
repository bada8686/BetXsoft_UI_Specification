const state = {
  route: location.hash.slice(1) || 'home', drawer: false, amount: '', customer: '',
  customerFilter: '', ticketFilter: '', toggles: {}, createdUsers: [], dashboardPeriod: 'today',
  customRangeOpen: false, customFrom: '2026-08-01', customTo: '2026-08-13', customDashboard: null
};

const dashboardPeriods = {
  today: {deposit:12450, payout:8920, profit:3530},
  days3: {deposit:39760, payout:26340, profit:13420},
  week: {deposit:92430, payout:61870, profit:30560},
  month: {deposit:368161, payout:244748, profit:123413}
};

// Open tickets are a live/current total and must never depend on the dashboard period filter.
const currentOpenTickets = 42;

const routes = [
  ['home','Startseite','⌂'],['deposit-1','Einzahlung – Daten','↓'],['deposit-2','Einzahlung – Übersicht','↓'],['deposit-3','Einzahlung – Bestätigung','✓'],
  ['payout-1','Auszahlung – Daten','↑'],['payout-2','Auszahlung – Übersicht','↑'],['payout-3','Auszahlung – Bestätigung','✓'],['customers','Kunden','♙'],
  ['history','Kontoverlauf','↔'],['create-user','Kunden erstellen','＋'],['coupons','Wettscheine','▧'],['coupon-filters','Zusätzliche Filter','⚙'],
  ['coupon-detail','Wettschein-Details','▤'],['turnover','Umsatz','↗'],['deposit-transactions','Einzahlungstransaktionen','↓'],['payout-transactions','Auszahlungstransaktionen','↑']
];

const customers = [
  ['4258','Toni1234','40,00','Aktiv'],['800','akdag67','25,63','Aktiv'],['901','Sahin','40,00','Aktiv'],['4638','David','20,00','Aktiv'],
  ['1073','Halil2','13,97','Aktiv'],['2258','Ali elmali','10,00','Aktiv'],['1567','jassin','9,00','Aktiv'],['5067','mica','5,50','Gesperrt']
];

function allCustomerRows(){
  return customers.concat(state.createdUsers);
}
function allCustomerNames(){
  return [...new Set(allCustomerRows().map(r=>r[1]))];
}
function customerUsage(){
  try{ return JSON.parse(localStorage.getItem('betxsoftDepositCustomerUsage')||'{}') || {}; }
  catch(_){ return {}; }
}
function topCustomerNames(limit=15){
  const usage=customerUsage();
  return allCustomerNames()
    .map((name,index)=>({name,index,count:Number(usage[name]||0)}))
    .sort((a,b)=>b.count-a.count || a.index-b.index)
    .slice(0,limit)
    .map(x=>x.name);
}
function recordCustomerSelection(name){
  if(!name) return;
  const usage=customerUsage();
  usage[name]=Number(usage[name]||0)+1;
  try{ localStorage.setItem('betxsoftDepositCustomerUsage',JSON.stringify(usage)); }catch(_){}
}
function customerPicker(prefix,extraClass=''){
  const top=topCustomerNames(15);
  const all=allCustomerNames();
  const option=(name,section)=>`<button type="button" class="customer-option" data-customer-option data-section="${section}" data-value="${esc(name)}"><span class="customer-option-icon">${svgIcon('person')}</span><span>${esc(name)}</span></button>`;
  return `<div class="customer-picker ${extraClass}" data-customer-picker>
    <input type="hidden" id="${prefix}Customer" value="${state.customer?esc(state.customer):''}">
    <div class="customer-picker-trigger" data-customer-trigger>
      <span class="customer-select-icon">${svgIcon('person')}</span>
      <input class="customer-picker-input customer-select-value" id="${prefix}CustomerSearch" type="search" inputmode="search" autocomplete="off" placeholder="Kunden suchen" value="${state.customer?esc(state.customer):''}" data-customer-search aria-label="Kunden suchen" aria-expanded="false">
      <span class="customer-select-chevron">${svgIcon('chevron')}</span>
    </div>
    <div class="customer-picker-menu" data-customer-menu hidden>
      <div class="customer-picker-section" data-customer-section="top">
        <div class="customer-picker-heading">Am häufigsten ausgewählt</div>
        <div class="customer-picker-options" data-customer-options="top">${top.map(name=>option(name,'top')).join('')}</div>
      </div>
      <div class="customer-picker-divider"></div>
      <div class="customer-picker-section" data-customer-section="all">
        <div class="customer-picker-heading">Alle Kunden</div>
        <div class="customer-picker-options" data-customer-options="all">${all.map(name=>option(name,'all')).join('')}</div>
      </div>
      <div class="customer-picker-empty" data-customer-empty hidden>Keine Kunden gefunden.</div>
    </div>
  </div>`;
}
function depositCustomerSelect(){ return customerPicker('deposit'); }
function payoutCustomerSelect(){ return customerPicker('payout','payout-customer-picker'); }

function parseAccountBalance(value){
  const normalized=String(value??'0').replace(/\./g,'').replace(',','.');
  const number=Number(normalized);
  return Number.isFinite(number)?number:0;
}
function formatAccountBalance(value){
  return new Intl.NumberFormat('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value)||0);
}
function storedCustomerBalances(){
  try{ return JSON.parse(localStorage.getItem('betxsoftCustomerBalances')||'{}') || {}; }
  catch(_){ return {}; }
}
function customerBaseBalance(name){
  const row=customers.concat(state.createdUsers).find(r=>r[1]===name);
  return row?parseAccountBalance(row[2]):0;
}
function customerBalanceValue(name){
  const stored=storedCustomerBalances();
  if(Object.prototype.hasOwnProperty.call(stored,name)){
    const value=Number(stored[name]);
    return Number.isFinite(value)?value:customerBaseBalance(name);
  }
  return customerBaseBalance(name);
}
function setCustomerBalance(name,value){
  if(!name) return;
  const safe=Math.max(0,Math.round((Number(value)||0)*100)/100);
  const stored=storedCustomerBalances();
  stored[name]=safe;
  try{ localStorage.setItem('betxsoftCustomerBalances',JSON.stringify(stored)); }catch(_){}
  const row=customers.concat(state.createdUsers).find(r=>r[1]===name);
  if(row) row[2]=formatAccountBalance(safe);
}

const historyRows = [
  ['50054060','06.08.25 11:51:51','Einzahlung','+10,00','0,97','10,97','Einzahlung via Sofortüberweisung'],
  ['41064834','06.08.25 11:51:51','Wetteinsatz','-0,20','10,97','10,77','Wetteinsatz Slot Casino'],
  ['41064745','06.08.25 11:51:23','Gewinn','+21,42','10,77','32,19','Gewinn Slot Casino'],
  ['26205569','30.08.24 16:49:13','Auszahlung','-550,00','760,01','210,01','Auszahlung via Banküberweisung'],
  ['70242963','19.04.26 20:30:13','Cashed Out','+4,82','25,71','30,53','Cashed Out Wette'],
  ['67603472','10.03.26 09:45:35','Wette storniert','-3,00','35,32','32,32','Wette storniert'],
  ['66133658','18.02.25 18:12:38','Bonuserstattung','+18,00','19,36','37,36','Bonuserstattung'],
  ['64935923','02.02.26 10:09:50','Wetteinsatz','-61,00','50,78','-10,22','Wetteinsatz Sport'],
  ['55487595','19.10.25 21:42:06','Gewinn','+50,00','290,25','340,25','Gewinn Sport'],
  ['53063881','28.09.25 16:54:12','Auszahlung','-30,00','70,35','40,35','Auszahlung via Skrill']
];

const coupons = [
  ['ali','1377640','5,00','LOSS','93,04','5172'],['ali','1377639','10,00','WON','34,50','5171'],['ali','1377638','3,50','OPEN','68,10','5170'],
  ['Deniz Çelik','1377637','20,00','LOSS','142,00','5169'],['Ucell061','1377636','5,00','WON','18,45','5168'],['Tona','1377635','15,00','OPEN','109,70','5167'],
  ['Amir1','1377634','8,00','LOSS','55,20','5166'],['Marlboro','1377633','12,00','WON','76,80','5165']
];

const deposits = [
  ['233602','13.8.2026, 00:02:02','4638','David','104.28.62.88','Card','20'],['233597','12.8.2026, 21:26:01','4145','Amir1','193.5.238.77','Crypto','50'],
  ['233529','12.8.2026, 13:18:12','816','ali','194.230.160.141','Shop','20'],['233499','11.8.2026, 21:40:13','910','Ucell061','193.5.238.77','Card','30'],
  ['233482','11.8.2026, 20:35:43','5143','Tona','193.5.238.77','Crypto','20'],['233470','11.8.2026, 19:55:21','5143','Tona','193.5.238.77','Shop','20'],
  ['233469','11.8.2026, 19:52:49','5143','Tona','193.5.238.77','Card','30'],['233461','11.8.2026, 19:07:54','5143','Tona','193.5.238.77','Crypto','50'],
  ['233449','11.8.2026, 18:07:05','5143','Tona','194.230.160.21','Shop','60'],['233436','11.8.2026, 16:41:20','5143','Tona','194.230.160.21','Card','40'],
  ['233428','11.8.2026, 16:00:14','4303','Deniz Çelik','194.230.160.21','Crypto','20'],['233423','11.8.2026, 15:19:23','910','Ucell061','193.5.238.77','Shop','20'],
  ['233412','11.8.2026, 13:07:19','816','ali','194.230.160.21','Card','20'],['233359','10.8.2026, 20:03:16','5143','Tona','194.230.160.238','Crypto','20'],
  ['233350','10.8.2026, 19:20:07','5143','Tona','194.230.160.238','Shop','50'],['233342','10.8.2026, 18:44:20','5143','Tona','194.230.160.238','Card','50'],
  ['233341','10.8.2026, 18:44:00','4145','Amir1','194.230.160.238','Crypto','50'],['233325','10.8.2026, 17:14:15','5143','Tona','194.230.160.238','Shop','50'],
  ['233243','9.8.2026, 19:45:40','816','ali','193.5.238.77','Card','15'],['233220','9.8.2026, 18:17:36','910','Ucell061','193.5.238.77','Crypto','20']
];

const payouts = [
  ['20914','8.8.2026, 14:08:16','816','ali','194.230.164.135','Card','110'],['20909','7.8.2026, 18:21:54','5080','Halip123','194.230.160.47','Crypto','50'],
  ['20907','6.8.2026, 20:45:08','970','Ucell061','193.5.238.77','Shop','239'],['20864','31.7.2026, 18:57:41','910','Ucell061','193.5.238.77','Card','130'],
  ['20861','31.7.2026, 17:00:29','910','Ucell061','194.230.160.238','Crypto','140'],['20860','31.7.2026, 16:45:26','970','Ucell061','194.230.160.99','Shop','300'],
  ['20833','27.7.2026, 14:35:34','2967','SalihB','194.230.164.167','Card','80'],['20830','26.7.2026, 21:27:26','4155','Eagron','193.5.238.77','Crypto','30'],
  ['20801','24.7.2026, 20:47:55','4145','Amir1','193.5.234.118','Shop','150'],['20737','17.7.2026, 13:49:10','4962','Bur1','193.5.234.118','Card','50'],
  ['20716','14.7.2026, 21:16:10','4145','Amir1','193.5.234.118','Crypto','400'],['20715','14.7.2026, 20:42:25','4145','Amir1','193.5.234.118','Shop','50'],
  ['20714','14.7.2026, 20:09:37','4831','Malboro','193.5.234.118','Card','200'],['20712','14.7.2026, 15:53:32','4962','Bur1','193.5.234.118','Crypto','30'],
  ['20710','13.7.2026, 12:29:50','4831','Malboro','193.5.234.118','Shop','50'],['20708','13.7.2026, 10:48:00','1332','Daniel23','193.5.234.118','Card','100'],
  ['20604','9.7.2026, 18:02:55','910','Ucell061','193.5.238.77','Crypto','30'],['20602','9.7.2026, 16:31:41','910','Ucell061','193.5.238.77','Shop','150'],
  ['20555','8.7.2026, 20:33:54','4831','Malboro','193.5.234.118','Card','60'],['20547','7.7.2026, 10:06:00','5067','mica','193.5.234.118','Shop','50']
];

function moneyClass(v){ return String(v).trim().startsWith('-') ? 'negative' : String(v).trim().startsWith('+') ? 'positive' : ''; }
function esc(s){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function go(route){
  if(route==='deposit-1' && state.route!=='deposit-2'){
    state.customer='';
    state.amount='';
  }
  if(route==='payout-1' && state.route!=='payout-2'){
    state.customer='';
    state.amount='';
  }
  location.hash = route;
  state.drawer=false;
}
function toast(message){ const t=document.querySelector('#toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),2200); }
function field(label, input, required=''){ return `<div class="field"><label>${label}${required?' *':''}</label>${input}</div>`; }
function input(placeholder, attrs=''){ return `<input class="control" placeholder="${placeholder}" ${attrs}>`; }
function select(options, attrs=''){ return `<select class="control" ${attrs}>${options.map(x=>`<option>${x}</option>`).join('')}</select>`; }
function svgIcon(name){
  const paths={
    down:'<path d="M12 4v14M6.5 12.5 12 18l5.5-5.5"/>',up:'<path d="M12 20V6M6.5 11.5 12 6l5.5 5.5"/>',
    user:'<circle cx="10" cy="8" r="3"/><path d="M4.5 19c.7-3.1 2.6-4.8 5.5-4.8s4.8 1.7 5.5 4.8M18 7v6M15 10h6"/>',
    wallet:'<path d="M4 7.5h13.5A2.5 2.5 0 0 1 20 10v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h11v3.5"/><path d="M15 11h5v5h-5a2.5 2.5 0 0 1 0-5Z"/><circle cx="15.5" cy="13.5" r=".6" fill="currentColor" stroke="none"/>',
    chart:'<path d="M3 20h18M5 16l4-5 4 3 7-9M16 5h4v4"/>',
    ticket:'<path d="M5 4h14a1 1 0 0 1 1 1v4a3 3 0 0 0 0 6v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a3 3 0 0 0 0-6V5a1 1 0 0 1 1-1Z"/><path d="M12 7v2m0 2v2m0 2v2"/>',
    dollar:'<path d="M12 3v18M16 7.5c-.8-1-2-1.5-4-1.5-2.2 0-3.5 1.1-3.5 2.7 0 4.1 7.5 1.7 7.5 6 0 1.8-1.6 3.3-4.2 3.3-1.8 0-3.4-.7-4.3-1.9"/>',
    person:'<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.8-3.7 3-5.6 6.5-5.6s5.7 1.9 6.5 5.6"/>',
    lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/>',
    coins:'<ellipse cx="12" cy="6.2" rx="6.3" ry="2.7"/><path d="M5.7 6.2v4.1c0 1.5 2.8 2.7 6.3 2.7s6.3-1.2 6.3-2.7V6.2M5.7 10.3v4.1c0 1.5 2.8 2.7 6.3 2.7s6.3-1.2 6.3-2.7v-4.1M5.7 14.4v3.4c0 1.5 2.8 2.7 6.3 2.7s6.3-1.2 6.3-2.7v-3.4"/>',
    searchUser:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.7-3.1 2.6-4.8 5.5-4.8 1.3 0 2.4.3 3.3 1M17 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm2.2 5.2L22 22"/>',
    shop:'<path d="M4 9v11h16V9M3 9l2-5h14l2 5"/><path d="M3 9a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2M9 20v-5h6v5"/>',
    transfer:'<path d="M4 7h15M16 4l3 3-3 3M20 17H5M8 14l-3 3 3 3"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',close:'<path d="M5 5l14 14M19 5 5 19"/>',
    depositWallet:'<path d="M4 9h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h9"/><path d="M16 13h5v5h-5a2.5 2.5 0 0 1 0-5ZM14 2v7M10.5 5.5 14 9l3.5-3.5"/>',
    payoutWallet:'<path d="M4 9h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h8"/><path d="M15 13h5v5h-5a2.5 2.5 0 0 1 0-5Z"/><path d="M12 10 19 3M14 3h5v5"/>'
  };
  return `<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]||''}</svg>`;
}
function pageHead(icon,title,sub,action=''){ return `<div class="page-head"><div class="page-icon">${icon}</div><div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div>${action?`<div class="head-action">${action}</div>`:''}</div>`; }
function steps(active,type='Einzahlung'){ const names=['Daten','Übersicht','Bestätigung']; return `<div class="stepper">${names.map((n,i)=>`<div class="step ${i+1===active?'active':''} ${i+1<active?'done':''}"><span class="step-num">${i+1<active?'✓':i+1}</span>${n}</div>`).join('')}</div>`; }
function footer(){ return `<footer class="footer"><span>© 2024 BetXsoft. Alle Rechte vorbehalten.</span><i class="mobile-home-indicator"></i></footer>`; }
function header(){ return `<header class="topbar"><div class="topbar-main"><div class="brand-zone"><button class="brand" data-go="home" aria-label="Startseite">Bet<span class="brand-x">X</span>soft<small>Casino · Sports · Betting</small></button><div class="mobile-total"><small>Gesamtbalance</small><strong>368.161,00</strong></div></div><button class="home-button" data-go="home" aria-label="Startseite">⌂</button><div class="top-spacer"></div><div class="balance"><span class="balance-copy"><small>Guthaben</small><strong>14.857,00</strong></span></div><button class="menu-button" data-drawer aria-label="Menü öffnen">${svgIcon('menu')}</button></div></header>`; }
function drawer(){
  const primary=(routeIndex,label,icon,tone)=>`<button class="drawer-primary ${tone} ${routes[routeIndex][0]===state.route?'active':''}" data-go="${routes[routeIndex][0]}"><span class="drawer-primary-icon">${svgIcon(icon)}</span><strong>${label}</strong><span class="drawer-primary-chevron">${svgIcon('chevron')}</span></button>`;
  const item=(routeIndex,icon)=>`<button class="drawer-sub-link ${routes[routeIndex][0]===state.route?'active':''}" data-go="${routes[routeIndex][0]}"><span class="drawer-sub-icon">${svgIcon(icon)}</span><span class="drawer-sub-label">${routes[routeIndex][1]}</span><span class="drawer-sub-chevron">${svgIcon('chevron')}</span></button>`;
  return `<div class="drawer-backdrop ${state.drawer?'open':''}" data-drawer-close></div><aside class="drawer ${state.drawer?'open':''}">
    <nav class="drawer-nav">
      ${primary(1,'Einzahlung','down','deposit')}
      ${primary(4,'Auszahlung','up','payout')}
      ${primary(13,'Umsatz','chart','turnover')}
      <div class="drawer-section-title"><span class="drawer-section-icon">${svgIcon('menu')}</span><strong>Weitere Bereiche</strong></div>
      ${item(7,'person')}
      ${item(8,'transfer')}
      ${item(9,'user')}
      ${item(10,'ticket')}
      <div class="drawer-menu-divider" aria-hidden="true"></div>
      ${item(14,'down')}
      ${item(15,'up')}
      <div class="drawer-footer">
        <div class="drawer-footer-rule" aria-hidden="true"></div>
        <a class="drawer-qr-link" href="https://t.me/BETXSOFT" target="_blank" rel="noopener noreferrer" aria-label="BetXsoft auf Telegram öffnen">
          <img class="drawer-qr" src="./assets/betxsoft-telegram-qr.svg" alt="QR-Code zu BetXsoft auf Telegram">
        </a>
        <div class="drawer-footer-copy"><span>2022</span><i aria-hidden="true"></i><span>BETXSOFT</span></div>
      </div>
    </nav>
  </aside>`;
}

function formatDashboardValue(value){ return new Intl.NumberFormat('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value); }
function currentDashboard(){ return state.dashboardPeriod==='custom' && state.customDashboard ? state.customDashboard : dashboardPeriods[state.dashboardPeriod] || dashboardPeriods.today; }

function homeView(){ const d=currentDashboard(); return `${pageHead('⌂','Übersicht','Alle wichtigen Kennzahlen und Schnellaktionen auf einen Blick.')}<div class="quick-grid">
  <button class="quick-card green" data-go="deposit-1"><span class="quick-icon">${svgIcon('down')}</span><span class="quick-copy"><strong>Einzahlung</strong><small>Geld einzahlen</small></span></button>
  <button class="quick-card red" data-go="payout-1"><span class="quick-icon">${svgIcon('up')}</span><span class="quick-copy"><strong>Auszahlung</strong><small>Geld auszahlen</small></span></button>
  <button class="quick-card blue" data-go="create-user"><span class="quick-icon">${svgIcon('user')}</span><span class="quick-copy"><strong>Neuer Kunde</strong><small>Neuen Kunden anlegen</small></span></button></div>
  <div class="dash-grid"><section class="card card-pad"><h2 class="section-title overview-title">Übersicht</h2><div class="date-tabs"><button class="tab ${state.dashboardPeriod==='today'?'active':''}" data-period="today">Heute</button><button class="tab ${state.dashboardPeriod==='days3'?'active':''}" data-period="days3">3 Tage</button><button class="tab ${state.dashboardPeriod==='week'?'active':''}" data-period="week">1 Woche</button><button class="tab ${state.dashboardPeriod==='month'?'active':''}" data-period="month">Diesen Monat</button></div><button class="custom-date ${state.dashboardPeriod==='custom'?'active':''}" data-custom-range><span>${svgIcon('calendar')}</span><span class="custom-date-label">${state.dashboardPeriod==='custom' ? `${new Date(state.customFrom+'T00:00:00').toLocaleDateString('de-DE')} – ${new Date(state.customTo+'T00:00:00').toLocaleDateString('de-DE')}` : 'Individueller Zeitraum'}</span><span>${svgIcon('chevron')}</span></button>${state.customRangeOpen?`<div class="date-range-panel"><label>Von<input type="date" value="${state.customFrom}" data-range-from></label><label>Bis<input type="date" value="${state.customTo}" data-range-to></label><button data-range-apply>Anwenden</button></div>`:''}<div class="kpis"><div class="kpi green"><div class="kpi-icon">${svgIcon('wallet')}</div><label>Einzahlung</label><strong data-kpi="deposit">${formatDashboardValue(d.deposit)}</strong></div><div class="kpi red"><div class="kpi-icon">${svgIcon('wallet')}</div><label>Auszahlung</label><strong data-kpi="payout">${formatDashboardValue(d.payout)}</strong></div><div class="kpi orange"><div class="kpi-icon">${svgIcon('chart')}</div><label>Gewinn</label><strong data-kpi="profit">${formatDashboardValue(d.profit)}</strong></div><div class="kpi violet"><div class="kpi-icon">${svgIcon('ticket')}</div><label>Offene Wetten</label><strong data-kpi="open">${currentOpenTickets}</strong></div></div></section>
  <section class="card card-pad"><h2 class="section-title">Menü</h2><div class="menu-list">${[
  ['turnover','dollar','Buchhaltung','Shop Umsatz & Agent Umsatz'],['coupons','ticket','Wettscheine','Wettscheine suchen & verwalten'],['create-user','user','Kunden anlegen','Shop oder Agent erstellen'],['customers','searchUser','Spieler suchen','Profil bearbeiten'],['customers','shop','Shop oder Agent suchen','Shop / Agent bearbeiten'],['history','transfer','Transaktionen','Einzahlungen, Auszahlungen & mehr']
  ].map((x,i)=>`<button class="menu-entry ${i===0?'primary-icon':''}" data-go="${x[0]}"><span>${svgIcon(x[1])}</span><span><strong>${x[2]}</strong><small>${x[3]}</small></span><span class="chev">${svgIcon('chevron')}</span></button>`).join('')}</div></section></div>`; }

function depositClose(){ return `<button class="page-close" data-close-page aria-label="Einzahlung schließen" title="Schließen">${svgIcon('close')}</button>`; }
function deposit1(){ return `<section class="deposit-minimal-page">
  <div class="deposit-minimal-head">
    <button class="deposit-back" data-go="home" aria-label="Zurück zur Startseite">‹</button>
    <h1>Einzahlung</h1>
    <button class="deposit-minimal-close" data-close-page aria-label="Einzahlung schließen" title="Schließen">${svgIcon('close')}</button>
  </div>
  ${steps(1)}
  <section class="deposit-minimal-form">
    <div class="deposit-form-grid">
      ${field('Kunde auswählen',depositCustomerSelect())}
      ${field('Einzahlungsbetrag',`<div class="deposit-amount-shell">${input('Betrag eingeben','id="depositAmount" inputmode="decimal" autocomplete="off"')}<span class="deposit-amount-icon">${svgIcon('coins')}</span></div>`)}
    </div>
    <label class="deposit-helper">Schnellauswahl</label>
    <div class="amounts">${[10,20,40,50,70,100,150,200].map(x=>`<button class="amount-chip" data-amount="${x}">${x}</button>`).join('')}</div>
    <div class="actions"><button class="btn block deposit-continue" data-flow="deposit-next">Einzahlung fortsetzen <span aria-hidden="true">→</span></button></div>
  </section>
</section>`; }
function deposit2(){
  const amount=Number(state.amount||'0');
  const currentBalance=customerBalanceValue(state.customer);
  const newBalance=currentBalance+amount;
  return `${pageHead(svgIcon('depositWallet'),'Einzahlung','',depositClose())} ${steps(2)}<section class="card card-pad flow-card"><h2>Einzahlung bestätigen</h2><p class="muted">Bitte überprüfen Sie Ihre Angaben vor der Bestätigung.</p><div class="summary-list"><div class="summary-row"><span>Benutzer-ID</span><strong>${esc(state.customer)}</strong></div><div class="summary-row deposit-amount-highlight"><span>Betrag</span><strong class="positive">${formatAccountBalance(amount)}</strong></div><div class="summary-row"><span>Aktuelles Guthaben</span><strong>${formatAccountBalance(currentBalance)}</strong></div><div class="summary-row"><span>Neues Guthaben</span><strong>${formatAccountBalance(newBalance)}</strong></div></div><div class="actions"><button class="btn secondary" data-go="deposit-1">Zurück</button><button class="btn success" data-confirm-deposit>Einzahlung bestätigen</button></div></section>`;
}
function deposit3(){
  const newBalance=customerBalanceValue(state.customer);
  return `${pageHead(svgIcon('depositWallet'),'Einzahlung','',depositClose())} ${steps(3)}<section class="card flow-card success-panel"><div class="success-mark">✓</div><h2>Einzahlung erfolgreich!</h2><p class="muted">Ihre Einzahlung wurde erfolgreich durchgeführt.</p><div class="summary-list"><div class="summary-row"><span>Neues Guthaben</span><strong class="positive">${formatAccountBalance(newBalance)}</strong></div><div class="summary-row"><span>Benutzer-ID</span><strong>${esc(state.customer)}</strong></div></div><div class="actions"><button class="btn block" data-go="home">Zurück zur Übersicht</button></div></section>`;
}

function payoutClose(){ return `<button class="page-close" data-close-page aria-label="Auszahlung schließen" title="Schließen">${svgIcon('close')}</button>`; }

function payout1(){
  const currentBalance=state.customer?customerBalanceValue(state.customer):0;
  return `<section class="payout-minimal-page">
  <div class="payout-minimal-head">
    <button class="payout-back payout-icon-button" data-go="home" aria-label="Zurück zur Startseite" title="Auszahlung">${svgIcon('payoutWallet')}</button>
    <h1>Auszahlung</h1>
    <button class="payout-minimal-close" data-close-page aria-label="Auszahlung schließen" title="Schließen">${svgIcon('close')}</button>
  </div>
  ${steps(1,'Auszahlung')}
  <section class="payout-minimal-form">
    <div class="payout-form-grid">
      ${field('Kunde auswählen',payoutCustomerSelect())}
      <div class="field payout-balance-field" id="payoutBalanceField" ${state.customer?'':'hidden'}>
        <label>Aktuelles Guthaben</label>
        <div class="payout-balance-display" id="payoutCurrentBalance">${state.customer?formatAccountBalance(currentBalance):''}</div>
      </div>
      ${field('Auszahlungsbetrag',`<div class="payout-amount-shell">${input('Betrag eingeben','id="payoutAmount" inputmode="decimal" autocomplete="off"')}<span class="payout-amount-icon">${svgIcon('coins')}</span></div>`)}
    </div>
    <label class="payout-helper">Schnellauswahl</label>
    <div class="amounts">${[10,20,40,50,70,100,150,200].map(x=>`<button class="amount-chip" data-amount="${x}">${x}</button>`).join('')}</div>
    <div class="actions"><button class="btn block payout-continue" data-flow="payout-next">Auszahlung fortsetzen <span aria-hidden="true">→</span></button></div>
  </section>
</section>`; }

function payout2(){
  const amount=Number(state.amount||'0');
  const currentBalance=customerBalanceValue(state.customer);
  const newBalance=Math.max(0,currentBalance-amount);
  return `${pageHead(svgIcon('payoutWallet'),'Auszahlung','',payoutClose())} ${steps(2,'Auszahlung')}<section class="card card-pad flow-card"><h2>Auszahlung bestätigen</h2><p class="muted">Bitte überprüfen Sie Ihre Angaben vor der Bestätigung.</p><div class="summary-list"><div class="summary-row"><span>Benutzer-ID</span><strong>${esc(state.customer)}</strong></div><div class="summary-row payout-amount-highlight"><span>Betrag</span><strong class="negative">${formatAccountBalance(amount)}</strong></div><div class="summary-row"><span>Aktuelles Guthaben</span><strong>${formatAccountBalance(currentBalance)}</strong></div><div class="summary-row"><span>Neues Guthaben</span><strong>${formatAccountBalance(newBalance)}</strong></div></div><div class="actions"><button class="btn secondary" data-go="payout-1">Zurück</button><button class="btn danger" data-confirm-payout>Auszahlung bestätigen</button></div></section>`; }

function payout3(){
  const amount=Number(state.amount||'0');
  const newBalance=customerBalanceValue(state.customer);
  return `${pageHead(svgIcon('payoutWallet'),'Auszahlung','',payoutClose())} ${steps(3,'Auszahlung')}<section class="card flow-card success-panel"><div class="success-mark payout-success-mark">✓</div><h2>Auszahlung erfolgreich!</h2><p class="muted">Die Auszahlung wurde erfolgreich durchgeführt.</p><div class="summary-list"><div class="summary-row payout-amount-highlight"><span>Ausgezahlter Betrag</span><strong class="negative">${formatAccountBalance(amount)}</strong></div><div class="summary-row"><span>Neues Guthaben</span><strong>${formatAccountBalance(newBalance)}</strong></div><div class="summary-row"><span>Benutzer-ID</span><strong>${esc(state.customer)}</strong></div></div><div class="actions"><button class="btn block" data-go="home">Zurück zur Übersicht</button></div></section>`;
}

function customersView(){ const q=state.customerFilter.toLowerCase(); const rows=customers.concat(state.createdUsers).filter(r=>!q||r.join(' ').toLowerCase().includes(q)); return `${pageHead('♙','Kunden','Verwalten Sie Ihre Kunden.','<button class="btn" data-go="create-user">＋ Neuen Kunden erstellen</button>')}<section class="card card-pad"><div class="filters"><div class="field"><label>ID</label>${input('z. B. 4590','data-filter="customer"')}</div><div class="field"><label>Benutzername</label>${input('z. B. David','data-filter="customer"')}</div><div class="field"><label>Status</label>${select(['Alle','Aktiv','Gesperrt'])}</div><div class="filter-actions"><button class="btn" data-apply-customer>Filtern</button><button class="btn secondary" data-reset-customer>Zurücksetzen</button></div></div></section><section class="card table-card" style="margin-top:16px"><div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Benutzername</th><th>Guthaben</th><th>Status</th><th>Aktionen</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${r[0]}</td><td><strong>${r[1]}</strong></td><td>${formatAccountBalance(customerBalanceValue(r[1]))}</td><td><span class="status ${r[3]==='Aktiv'?'active':'neutral'}">${r[3]}</span></td><td><button class="btn small outline" data-demo="Kundendaten geöffnet">Bearbeiten</button> <button class="btn small secondary" data-go="history">Kontoverlauf</button></td></tr>`).join(''):`<tr><td colspan="5" class="empty">Keine Kunden gefunden.</td></tr>`}</tbody></table></div>${tableBottom(rows.length,'Kunden',12)}</section>`; }

function historyView(){ return `${pageHead('↔','Transaktionen','Übersicht aller Transaktionen in Echtzeit.','<button class="btn outline" data-export>⇩ Exportieren</button>')}<section class="card card-pad"><div class="filters three"><div class="field"><label>Status</label>${select(['Alle','Erfolgreich','Ausstehend','Storniert'])}</div><div class="field"><label>Transaktionstyp</label>${select(['Alle','Einzahlung','Auszahlung','Wetteinsatz','Gewinn'])}</div><div class="filter-actions"><button class="btn" data-demo="Filter angewendet">Filtern</button><button class="btn secondary" data-demo="Filter zurückgesetzt">Zurücksetzen</button></div></div></section><section class="card table-card" style="margin-top:16px"><div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Datum & Zeit</th><th>Typ</th><th>Betrag</th><th>Alt-Guthaben</th><th>Neu-Guthaben</th><th>Beschreibung</th></tr></thead><tbody>${historyRows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i===3?moneyClass(c):''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${tableBottom(10,'Transaktionen',5,42)}</section>`; }

function createUserView(){ return `<section class="create-user-page">
  <div class="create-user-head">
    <div class="create-user-heading">
      <span class="create-user-heading-icon">${svgIcon('user')}</span>
      <div><h1>Kunden erstellen</h1><p>Neuen Kunden anlegen</p></div>
    </div>
    <button class="create-user-close" data-close-page aria-label="Kunden erstellen schließen" title="Schließen">${svgIcon('close')}</button>
  </div>
  <section class="create-user-form-card">
    <div class="create-user-form-title"><h2>Kundendaten</h2><p>Geben Sie die Daten des neuen Kunden ein.</p></div>
    <form id="createUserForm">
      <div class="create-user-fields">
        <div class="field">
          <label>Nutzername (Nick) *</label>
          <div class="create-user-input-shell"><span class="create-user-field-icon">${svgIcon('person')}</span>${input('Benutzernamen eingeben','name="username" required minlength="3" autocomplete="username"')}</div>
        </div>
        <div class="field">
          <label>Passwort *</label>
          <div class="create-user-input-shell"><span class="create-user-field-icon">${svgIcon('lock')}</span>${input('Mindestens 6 Zeichen','name="password" required minlength="6" type="password" autocomplete="new-password"')}</div>
          <p class="create-user-helper">Mindestens 6 Zeichen.</p>
        </div>
        <div class="field">
          <label>Startguthaben</label>
          <div class="create-user-input-shell create-user-balance-shell"><span class="create-user-field-icon">${svgIcon('coins')}</span>${input('0,00','name="balance" inputmode="decimal" autocomplete="off"')}</div>
        </div>
      </div>
      <div class="create-user-actions">
        <button type="button" class="btn secondary create-user-cancel" data-go="customers">Abbrechen</button>
        <button class="btn create-user-submit" type="submit">Kunden erstellen <span aria-hidden="true">→</span></button>
      </div>
    </form>
  </section>
</section>`; }

function toggleCards(){ return ['Nur offene Wettscheine','Nur Gewinner','Nur Verlierer','Stornierte Wettscheine','Verkaufte Wettscheine'].map((n,i)=>`<label class="toggle-card"><button class="switch ${state.toggles[i]?'on':''}" data-toggle="${i}" aria-label="${n}"></button><span>${n}</span></label>`).join(''); }
function couponsView(){ const q=state.ticketFilter.toLowerCase(); const rows=coupons.filter(r=>!q||r.join(' ').toLowerCase().includes(q)); return `${pageHead('▧','Wettscheine','Verwalten und durchsuchen Sie alle Wettscheine.','<button class="btn outline" data-go="coupon-filters">⚙ Zusätzliche Filter</button>')}<section class="card card-pad"><div class="toggle-grid">${toggleCards()}</div><div class="filters three"><div class="field"><label>Wettschein Nummer</label>${input('z. B. 1377640','data-filter="ticket"')}</div><div class="field"><label>Benutzername</label>${input('z. B. ali','data-filter="ticket"')}</div><div class="filter-actions"><button class="btn" data-apply-ticket>Filtern</button><button class="btn secondary" data-reset-ticket>Zurücksetzen</button></div></div></section><section class="card table-card" style="margin-top:16px"><div class="table-wrap"><table class="data-table"><thead><tr><th>Kunde</th><th>Wettschein Nummer</th><th>Einsatz</th><th>Status</th><th>Maximaler Gewinn</th><th>Aktion</th><th>ID</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td><span class="status ${r[3].toLowerCase()}">${r[3]}</span></td><td>${r[4]}</td><td><button class="btn small" data-go="coupon-detail">Details</button></td><td>${r[5]}</td></tr>`).join(''):`<tr><td colspan="7" class="empty">Keine Wettscheine gefunden.</td></tr>`}</tbody></table></div>${tableBottom(rows.length,'Wettscheine',8)}</section>`; }

function couponFiltersView(){ return `<button class="back-link" data-go="coupons">← Zurück zu Wettscheinen</button>${pageHead('⚙','Wettscheine – Zusätzliche Filter','Verfeinern Sie Ihre Suche mit zusätzlichen Kriterien.')}<section class="card card-pad"><h2 class="section-title">Zeitraum</h2><div class="form-grid">${field('Von',input('Von','type="date" value="2025-08-12"'))}${field('Bis',input('Bis','type="date" value="2026-08-12"'))}</div></section><section class="card card-pad" style="margin-top:16px"><h2 class="section-title">Basis Filter</h2><div class="form-grid">${field('Wettschein Nummer',input('z. B. 4590'))}${field('Kunden-ID',input('z. B. 4590'))}${field('Benutzername',input('z. B. jack'))}${field('Status',select(['Alle','Offen','Gewonnen','Verloren','Storniert']))}${field('Wett-Art',select(['Alle','Live','Prematch']))}${field('Wettschein-Art',select(['Alle','Einzelwette','Kombination','System']))}</div></section><section class="card card-pad" style="margin-top:16px"><h2 class="section-title">Weitere Optionen</h2><div class="toggle-grid">${toggleCards()}</div><div class="actions"><button class="btn secondary" data-demo="Alle Filter zurückgesetzt">Filter zurücksetzen</button><button class="btn" data-flow="filters-apply">Filter anwenden</button></div></section>`; }

function couponDetailView(){ const bets=[
  ['1','NEC Nijmegen – Olympiacos Piräus','Europe / UEFA Champions League Qualification','Beide Teams treffen','Ja','1.75','2–1','WON'],
  ['2','CSKA 1948 Sofia – Panathinaikos','Europe / UEFA Conference League','Endergebnis 2','2','2.10','1–2','LOST'],
  ['3','FK Crvena Zvezda – Hapoel Beer Sheva','Europe / UEFA Champions League Qualification','Endergebnis 1','1','1.47','2–0','LOST'],
  ['4','SK Slovan Bratislava – Mjällby AIF','Europe / UEFA Champions League Qualification','Endergebnis 1','1','2.18','2–0','WON'],
  ['5','NK Celje – FC Ararat-Armenia','Europe / UEFA Champions League Qualification','Endergebnis 1','1','1.58','2–0','OPEN']];
  return `<button class="back-link" data-go="coupons">← Zurück zu Wettscheinen</button><div class="ticket-head"><div><h1 style="margin:0;font-size:25px">Wettschein #1377640</h1><p class="muted" style="margin:5px 0 0">11.08.2026 20:41:28</p></div><span class="avatar">♙</span><strong>(5143) Tona</strong><button class="icon-button" data-export title="Drucken">▣</button></div><section class="card" style="margin-top:20px"><div class="stats-row"><div class="stat"><small>Ticket Amount</small><strong class="positive">5,00</strong></div><div class="stat"><small>Max Profit</small><strong style="color:var(--blue)">93,04</strong></div><div class="stat"><small>Winning Profit</small><strong style="color:var(--blue)">0,00</strong></div><div class="stat"><small>Status</small><span class="status loss">LOSS</span></div></div></section><section class="card table-card" style="margin-top:14px"><div class="card-pad" style="padding-bottom:10px"><h2 class="section-title" style="margin:0">▤ Wett-Details (5)</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Teams</th><th>Liga / Land</th><th>Markt</th><th>Wette</th><th>Quote</th><th>Score</th><th>Status</th></tr></thead><tbody>${bets.map(r=>`<tr>${r.map((c,i)=>`<td>${i===7?`<span class="status ${c.toLowerCase()}">${c}</span>`:c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section><section class="ticket-meta"><div><small>Status</small><strong class="negative">LOSS</strong></div><div><small>Winning Profit</small><strong>0,00</strong></div><div><small>Erstellt</small><strong>11.08.2026 20:41:28</strong></div><div><small>Wett-Typ</small><strong style="color:var(--blue)">LIVE</strong></div><div><small>IP-Adresse</small><strong>194.230.160.96</strong></div><div><small>Ergebniszeit</small><strong>11.08.2026 21:31:51</strong></div><div><small>Coupon Type</small><strong>KOMBINATION (5)</strong></div><div><small>Dauer</small><strong>COMPLETED</strong></div></section>`; }

function turnoverView(){ const records=[['23.08.26','18:55:56','191.576,00','96.256,00','95.320,00'],['04.08.26','22:43:11','9.758,00','3.480,00','6.278,00'],['25.04.26','21:32:29','41.320,00','22.514,00','18.806,00'],['29.06.23','13:25:11','135.466,00','61.523,00','73.943,00'],['29.06.23','13:24:09','0,00','0,00','0,00']]; return `${pageHead('↗','Umsatz / Turnover','Übersicht Ihrer Umsätze.')}<section class="card card-pad"><h2 class="section-title">Zeitraum wählen</h2><div class="date-tabs"><button class="tab">Heute</button><button class="tab">Gestern</button><button class="tab active">7 Tage</button><button class="tab">Diesen Monat</button><button class="tab">▣ Individuell</button></div></section><section class="card" style="margin-top:16px"><div class="revenue-top">${[['↗','Einzahlung','140.172,00','green'],['↘','Auszahlung','59.640,00','red'],['▣','Gewinn','80.532,00','blue'],['▤','Card Deposit','0,00',''],['₿','Crypto Deposit','0,00','']].map(x=>`<div class="revenue-card"><div class="bubble" style="color:var(--${x[3]||'ink'})">${x[0]}</div><label>${x[1]}</label><strong style="color:var(--${x[3]||'ink'})">${x[2]}</strong><div class="spark" style="border-bottom:2px solid var(--${x[3]||'line'});transform:skewY(-5deg)"></div></div>`).join('')}</div></section><section class="card table-card" style="margin-top:16px"><div class="card-pad" style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px"><h2 class="section-title" style="margin:0">Shop Umsatz</h2><button class="btn small outline" data-demo="Kassenstand wurde neu geladen">⟳ Kasse zurücksetzen</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Shop</th><th>Einzahlung</th><th>Auszahlung</th><th>Gewinn</th><th>Card Deposit</th><th>Crypto Deposit</th></tr></thead><tbody><tr><td>1</td><td><strong style="color:var(--blue)">Loca22</strong></td><td class="positive">140.172,00</td><td class="negative">59.640,00</td><td style="color:var(--blue)">80.532,00</td><td>0,00</td><td>0,00</td></tr></tbody></table></div></section><section class="card" style="margin-top:16px"><div class="card-pad" style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px"><h2 class="section-title" style="margin:0">Letzte Aufzeichnungen</h2><button class="back-link" style="margin:0" data-demo="Alle Aufzeichnungen geladen">Alle anzeigen ›</button></div><div class="record-list">${records.map(r=>`<div class="record"><strong>${r[0]}<small class="muted" style="display:block">${r[1]}</small></strong><span class="positive">${r[2]}</span><span class="negative">${r[3]}</span><span class="gain">${r[4]}</span><span>›</span></div>`).join('')}</div></section>`; }

function transactionView(type){ const isDeposit=type==='deposit'; const data=isDeposit?deposits:payouts; const title=isDeposit?'Einzahlung Transaktionen':'Auszahlungen Transaktionen'; return `${pageHead(isDeposit?'↓':'↑',title,`Übersicht aller ${isDeposit?'Einzahlungs':'Auszahlungs'}transaktionen.`)}<section class="card card-pad"><div class="filters three"><div class="field"><label>Zeitraum</label>${input('Zeitraum','type="text" value="13.07.2026 - 13.08.2026"')}</div><div class="field" style="grid-column:span 2"><label>Suche</label>${input('ID, Kunden-ID, Name oder IP-Adresse','data-transaction-search')}</div></div></section><section class="card table-card" style="margin-top:16px"><div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Datum</th><th>Kunden-ID</th><th>Kundenname</th><th>IP-Adresse</th><th>Art der ${isDeposit?'Einzahlung':'Auszahlung'}</th><th>Betrag</th></tr></thead><tbody id="transactionBody">${transactionRows(data,isDeposit)}</tbody></table></div>${tableBottom(20,'Einträgen',13,250)}</section>`; }
function transactionRows(data,isDeposit){ return data.map(r=>`<tr>${r.map((c,i)=>`<td class="${i===6?(isDeposit?'positive':'negative'):''}">${c}</td>`).join('')}</tr>`).join(''); }
function tableBottom(count,label,pages=5,total=count){ return `<div class="table-bottom"><span>Zeige 1 bis ${count} von ${total} ${label}</span><div class="pagination"><button class="page-btn">‹</button><button class="page-btn active">1</button><button class="page-btn">2</button><button class="page-btn">3</button><button class="page-btn">…</button><button class="page-btn">${pages}</button><button class="page-btn">›</button></div></div>`; }

const views={home:homeView,'deposit-1':deposit1,'deposit-2':deposit2,'deposit-3':deposit3,'payout-1':payout1,'payout-2':payout2,'payout-3':payout3,customers:customersView,history:historyView,'create-user':createUserView,coupons:couponsView,'coupon-filters':couponFiltersView,'coupon-detail':couponDetailView,turnover:turnoverView,'deposit-transactions':()=>transactionView('deposit'),'payout-transactions':()=>transactionView('payout')};

function render(){
  state.route=location.hash.slice(1)||'home'; if(!views[state.route]) state.route='home';
  document.title=`${routes.find(x=>x[0]===state.route)?.[1]||'Shop Admin'} | BetXsoft`;
  document.querySelector('#app').innerHTML=`<div class="app route-${state.route}">${header()}<main class="layout">${views[state.route]()}</main>${footer()}</div>${drawer()}`;
  bind(); window.scrollTo({top:0,behavior:'smooth'});
}

function bind(){
  document.querySelectorAll('[data-customer-picker]').forEach(picker=>{
    const trigger=picker.querySelector('[data-customer-trigger]');
    const menu=picker.querySelector('[data-customer-menu]');
    const search=picker.querySelector('[data-customer-search]');
    const hidden=picker.querySelector('input[type="hidden"]');
    const empty=picker.querySelector('[data-customer-empty]');

    const resetOptions=()=>{
      picker.querySelectorAll('[data-customer-option]').forEach(btn=>btn.hidden=false);
      picker.querySelectorAll('[data-customer-section]').forEach(section=>section.hidden=false);
      if(empty) empty.hidden=true;
    };

    const closeMenu=()=>{
      menu.hidden=true;
      search?.setAttribute('aria-expanded','false');
      picker.classList.remove('open');
      resetOptions();
      if(search) search.value=hidden?.value||'';
    };

    const openMenu=()=>{
      document.querySelectorAll('[data-customer-picker].open').forEach(other=>{
        if(other!==picker){
          const otherMenu=other.querySelector('[data-customer-menu]');
          const otherSearch=other.querySelector('[data-customer-search]');
          const otherHidden=other.querySelector('input[type="hidden"]');
          if(otherMenu) otherMenu.hidden=true;
          if(otherSearch){
            otherSearch.setAttribute('aria-expanded','false');
            otherSearch.value=otherHidden?.value||'';
          }
          other.classList.remove('open');
        }
      });
      menu.hidden=false;
      search?.setAttribute('aria-expanded','true');
      picker.classList.add('open');
    };

    trigger?.addEventListener('click',e=>{
      openMenu();
      if(e.target!==search) search?.focus({preventScroll:true});
    });
    search?.addEventListener('focus',openMenu);

    search?.addEventListener('input',()=>{
      const raw=search.value;
      const q=raw.trim().toLowerCase();

      if(hidden && raw!==hidden.value){
        hidden.value='';
        state.customer='';
        if(hidden.id==='payoutCustomer'){
          const balanceField=document.querySelector('#payoutBalanceField');
          const balanceValue=document.querySelector('#payoutCurrentBalance');
          if(balanceField) balanceField.hidden=true;
          if(balanceValue) balanceValue.textContent='';
        }
      }

      let anyVisible=false;
      picker.querySelectorAll('[data-customer-section]').forEach(section=>{
        let sectionVisible=false;
        section.querySelectorAll('[data-customer-option]').forEach(btn=>{
          const show=!q || btn.dataset.value.toLowerCase().includes(q);
          btn.hidden=!show;
          if(show){ sectionVisible=true; anyVisible=true; }
        });
        section.hidden=!sectionVisible;
      });
      if(empty) empty.hidden=anyVisible;
      openMenu();
    });

    picker.querySelectorAll('[data-customer-option]').forEach(btn=>btn.addEventListener('click',()=>{
      const customer=btn.dataset.value||'';
      if(hidden) hidden.value=customer;
      if(search) search.value=customer;
      state.customer=customer;
      recordCustomerSelection(customer);
      closeMenu();

      if(hidden?.id==='payoutCustomer'){
        const balanceField=document.querySelector('#payoutBalanceField');
        const balanceValue=document.querySelector('#payoutCurrentBalance');
        if(balanceField) balanceField.hidden=!customer;
        if(balanceValue) balanceValue.textContent=customer?formatAccountBalance(customerBalanceValue(customer)):'';
      }
    }));
  });

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-customer-picker]')) return;
    document.querySelectorAll('[data-customer-picker].open').forEach(picker=>{
      const menu=picker.querySelector('[data-customer-menu]');
      const search=picker.querySelector('[data-customer-search]');
      const hidden=picker.querySelector('input[type="hidden"]');
      if(menu) menu.hidden=true;
      if(search){
        search.setAttribute('aria-expanded','false');
        search.value=hidden?.value||'';
      }
      picker.classList.remove('open');
    });
  });

  // Close buttons are intentionally separate from regular navigation:
  // close the current flow, replace its history entry and show the dashboard immediately.
  document.querySelectorAll('[data-close-page]').forEach(el=>el.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    state.drawer=false;
    state.customer='';
    state.amount='';
    state.committedFlow='';
    history.replaceState(null,'',location.pathname+location.search+'#home');
    state.route='home';
    render();
  }));
  document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
  document.querySelector('[data-confirm-deposit]')?.addEventListener('click',()=>{
    if(state.committedFlow==='deposit'){ go('deposit-3'); return; }
    const amount=Number(state.amount||'0');
    const current=customerBalanceValue(state.customer);
    setCustomerBalance(state.customer,current+amount);
    state.committedFlow='deposit';
    go('deposit-3');
  });
  document.querySelector('[data-confirm-payout]')?.addEventListener('click',()=>{
    if(state.committedFlow==='payout'){ go('payout-3'); return; }
    const amount=Number(state.amount||'0');
    const current=customerBalanceValue(state.customer);
    setCustomerBalance(state.customer,Math.max(0,current-amount));
    state.committedFlow='payout';
    go('payout-3');
  });
  document.querySelectorAll('[data-drawer]').forEach(el=>el.addEventListener('click',()=>{state.drawer=true;render()}));
  document.querySelectorAll('[data-drawer-close]').forEach(el=>el.addEventListener('click',()=>{state.drawer=false;render()}));
  document.querySelectorAll('[data-demo]').forEach(el=>el.addEventListener('click',()=>toast(el.dataset.demo)));
  document.querySelectorAll('[data-export]').forEach(el=>el.addEventListener('click',()=>toast('Export wurde vorbereitet.')));
  document.querySelectorAll('[data-amount]').forEach(el=>el.addEventListener('click',()=>{const target=document.querySelector('#depositAmount,#payoutAmount');if(!target)return;target.value=el.dataset.amount;document.querySelectorAll('[data-amount]').forEach(x=>x.classList.remove('selected'));el.classList.add('selected')}));
  document.querySelectorAll('[data-toggle]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();state.toggles[el.dataset.toggle]=!state.toggles[el.dataset.toggle];el.classList.toggle('on')}));
  document.querySelector('[data-flow="deposit-next"]')?.addEventListener('click',()=>{const customer=document.querySelector('#depositCustomer')?.value||'';const a=document.querySelector('#depositAmount').value.trim();if(!customer)return toast('Bitte einen Kunden auswählen.');if(!a||Number(a.replace(',','.'))<=0)return toast('Bitte einen gültigen Betrag eingeben.');state.amount=a.replace(',','.');state.customer=customer;state.committedFlow='';go('deposit-2')});
  document.querySelector('[data-flow="payout-next"]')?.addEventListener('click',()=>{
    const customer=document.querySelector('#payoutCustomer')?.value||'';
    const raw=document.querySelector('#payoutAmount').value.trim();
    const amount=Number(raw.replace(',','.'));
    if(!customer)return toast('Bitte einen Kunden auswählen.');
    if(!raw||!Number.isFinite(amount)||amount<=0)return toast('Bitte einen gültigen Betrag eingeben.');
    const balance=customerBalanceValue(customer);
    if(amount>balance)return toast('Der Betrag übersteigt das aktuelle Guthaben.');
    state.amount=String(amount);
    state.customer=customer;
    state.committedFlow='';
    go('payout-2');
  });
  document.querySelector('[data-flow="filters-apply"]')?.addEventListener('click',()=>{toast('Filter wurden angewendet.');setTimeout(()=>go('coupons'),500)});
  document.querySelector('[data-apply-customer]')?.addEventListener('click',()=>{state.customerFilter=[...document.querySelectorAll('[data-filter="customer"]')].map(x=>x.value).find(Boolean)||'';render()});
  document.querySelector('[data-reset-customer]')?.addEventListener('click',()=>{state.customerFilter='';render()});
  document.querySelector('[data-apply-ticket]')?.addEventListener('click',()=>{state.ticketFilter=[...document.querySelectorAll('[data-filter="ticket"]')].map(x=>x.value).find(Boolean)||'';render()});
  document.querySelector('[data-reset-ticket]')?.addEventListener('click',()=>{state.ticketFilter='';render()});
  document.querySelector('#createUserForm')?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target);const name=fd.get('username').trim();const rawBalance=String(fd.get('balance')||'').trim().replace(',','.');const balance=Number.isFinite(Number(rawBalance))&&rawBalance!==''?Number(rawBalance):0;state.createdUsers.unshift([String(6000+state.createdUsers.length),name,formatAccountBalance(balance),'Aktiv']);toast(`Kunde ${name} wurde erstellt.`);setTimeout(()=>go('home'),500)});
  document.querySelector('[data-transaction-search]')?.addEventListener('input',e=>{const data=state.route==='deposit-transactions'?deposits:payouts;const q=e.target.value.toLowerCase();const filtered=data.filter(r=>r.join(' ').toLowerCase().includes(q));document.querySelector('#transactionBody').innerHTML=transactionRows(filtered,state.route==='deposit-transactions')});
  document.querySelectorAll('[data-period]').forEach(el=>el.addEventListener('click',()=>{state.dashboardPeriod=el.dataset.period;state.customRangeOpen=false;render();toast(`Zeitraum „${el.textContent.trim()}“ ausgewählt.`)}));
  document.querySelector('[data-custom-range]')?.addEventListener('click',()=>{state.customRangeOpen=!state.customRangeOpen;render()});
  document.querySelector('[data-range-apply]')?.addEventListener('click',()=>{const from=document.querySelector('[data-range-from]').value;const to=document.querySelector('[data-range-to]').value;const start=new Date(from+'T00:00:00');const end=new Date(to+'T00:00:00');if(!from||!to||end<start)return toast('Bitte einen gültigen Zeitraum wählen.');const days=Math.min(366,Math.floor((end-start)/86400000)+1);const deposit=Math.round(days*12175.35+(days%7)*420);const payout=Math.round(deposit*(.63+Math.min(days,30)*.001));state.customFrom=from;state.customTo=to;state.customDashboard={deposit,payout,profit:deposit-payout};state.dashboardPeriod='custom';state.customRangeOpen=false;render();toast(`${days} Tage ausgewertet.`)});
  document.querySelectorAll('.tab:not([data-period])').forEach(el=>el.addEventListener('click',()=>{el.parentElement.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));el.classList.add('active');toast(`Zeitraum „${el.textContent.trim()}“ ausgewählt.`)}));
}



/* ios-keyboard-viewport-lock:start */
const iosKeyboardViewportLock=(()=>{
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  if(!isIOS) return {installed:false};

  const editableSelector=[
    'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"])',
    'textarea',
    '[contenteditable="true"]'
  ].join(',');

  let lock=null;
  let restoreTimer=null;

  function isEditable(el){
    return el instanceof Element && el.matches(editableSelector);
  }

  function freeze(){
    if(lock) return;
    const x=window.scrollX || 0;
    const y=window.scrollY || 0;
    lock={
      x,y,
      bodyPosition:document.body.style.position,
      bodyTop:document.body.style.top,
      bodyLeft:document.body.style.left,
      bodyRight:document.body.style.right,
      bodyWidth:document.body.style.width,
      bodyOverflow:document.body.style.overflow
    };

    document.documentElement.classList.add('ios-keyboard-locked');
    document.body.classList.add('ios-keyboard-locked');
    document.body.style.position='fixed';
    document.body.style.top=`-${y}px`;
    document.body.style.left=`-${x}px`;
    document.body.style.right='0';
    document.body.style.width='100%';
    document.body.style.overflow='hidden';
  }

  function unfreeze(){
    if(!lock) return;
    const saved=lock;
    lock=null;

    document.documentElement.classList.remove('ios-keyboard-locked');
    document.body.classList.remove('ios-keyboard-locked');

    document.body.style.position=saved.bodyPosition;
    document.body.style.top=saved.bodyTop;
    document.body.style.left=saved.bodyLeft;
    document.body.style.right=saved.bodyRight;
    document.body.style.width=saved.bodyWidth;
    document.body.style.overflow=saved.bodyOverflow;

    requestAnimationFrame(()=>{
      window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
      requestAnimationFrame(()=>window.scrollTo(saved.x,saved.y));
    });
  }

  document.addEventListener('focusin',e=>{
    if(!isEditable(e.target)) return;
    clearTimeout(restoreTimer);
    freeze();

    // Safari can try to pan the visual viewport after focus; keep the document anchored.
    requestAnimationFrame(()=>{
      if(lock) window.scrollTo(lock.x,lock.y);
      setTimeout(()=>{ if(lock) window.scrollTo(lock.x,lock.y); },80);
      setTimeout(()=>{ if(lock) window.scrollTo(lock.x,lock.y); },260);
    });
  },true);

  document.addEventListener('focusout',()=>{
    clearTimeout(restoreTimer);
    restoreTimer=setTimeout(()=>{
      if(!isEditable(document.activeElement)) unfreeze();
    },120);
  },true);

  // If Safari reports visual-viewport movement while the keyboard is open,
  // immediately keep the layout viewport at the saved position.
  if(window.visualViewport){
    const keepAnchored=()=>{
      if(!lock) return;
      window.scrollTo(lock.x,lock.y);
    };
    window.visualViewport.addEventListener('resize',keepAnchored,{passive:true});
    window.visualViewport.addEventListener('scroll',keepAnchored,{passive:true});
  }

  return {installed:true,unfreeze};
})();
/* ios-keyboard-viewport-lock:end */

addEventListener('hashchange',render);
render();
