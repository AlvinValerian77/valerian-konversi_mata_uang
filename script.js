const API = "https://open.er-api.com/v6/latest/";
const currencyMap = {
    "USD": "United States Dollar", "IDR": "Indonesian Rupiah", "EUR": "Euro", "GBP": "British Pound", "JPY": "Japanese Yen",
    "AUD": "Australian Dollar", "CAD": "Canadian Dollar", "CHF": "Swiss Franc", "CNY": "Chinese Yuan", "SGD": "Singapore Dollar",
    "MYR": "Malaysian Ringgit", "THB": "Thai Baht", "KRW": "South Korean Won", "SAR": "Saudi Riyal", "INR": "Indian Rupee",
    "AED": "UAE Dirham", "HKD": "Hong Kong Dollar", "NZD": "New Zealand Dollar", "BRL": "Brazilian Real"
};

let fromC = "USD", toC = "IDR", rates = {}, log = [];
const langs = {
    id: { amt: "Nominal Dana", fee: "Biaya Admin (%)", res: "Total Bersih Diterima", market: "Status Pasar Global", quick: "Kurs Terkini (IDR Base)", hist: "Riwayat Aktivitas Kamu", open: "PASAR TERBUKA", closed: "PASAR TUTUP", sync: "Terupdate", spell: "Ejaan Terbilang", copied: "Tersalin!" },
    en: { amt: "Input Amount", fee: "Admin Fee (%)", res: "Net Received Amount", market: "Global Market Status", quick: "Live Market Rates", hist: "Your Recent History", open: "MARKET OPEN", closed: "MARKET CLOSED", sync: "Synced", spell: "Spelling Out", copied: "Copied!" }
};

function switchPage(pId, el) {
    document.querySelectorAll('.page-node').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pId}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => { n.classList.add('opacity-30'); n.classList.remove('active'); });
    el.classList.add('active'); el.classList.remove('opacity-30');
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Fungsi Ejaan Angka Terbilang (Lengkap hingga Triliun)
function spellOut(n, lang) {
    if (n === 0) return lang === 'id' ? "Nol" : "Zero";
    const units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    
    function terbilang(n) {
        if (n < 12) return units[n];
        else if (n < 20) return terbilang(n - 10) + " Belas";
        else if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
        else if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
        else if (n < 200) return "Seratus " + terbilang(n - 100);
        else if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
        else if (n < 2000) return "Seribu " + terbilang(n - 1000);
        else if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
        else if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000);
        else if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " Miliar " + terbilang(n % 1000000000);
        else if (n < 1000000000000000) return terbilang(Math.floor(n / 1000000000000)) + " Triliun " + terbilang(n % 1000000000000);
        return "Angka Terlalu Besar";
    }
    return terbilang(Math.floor(n));
}

function updateTime() {
    const isId = document.getElementById('lang').value === 'id';
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleString(isId?'id-ID':'en-US', {weekday:'long', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false});
    const isOpen = (now.getDay() !== 0 && now.getDay() !== 6);
    document.getElementById('market-status').innerText = isOpen ? langs[isId?'id':'en'].open : langs[isId?'id':'en'].closed;
    document.getElementById('market-dot').className = `w-3 h-3 rounded-full ${isOpen?'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50':'bg-rose-500 shadow-md shadow-rose-500/50'}`;
}
setInterval(updateTime, 1000);

async function init() {
    try {
        const res = await fetch(API + "USD");
        const data = await res.json();
        rates = data.rates;
        renderDrops();
        renderMarket();
        calculate();
        updateUI();
    } catch (e) { document.getElementById('status').innerText = "Offline Mode"; }
}

function renderDrops() {
    const codes = Object.keys(rates).sort();
    ["from", "to"].forEach(type => {
        const container = document.getElementById(`list-${type}`);
        container.innerHTML = codes.map(c => {
            const name = currencyMap[c] || `Currency (${c})`;
            return `<div onclick="select('${type}','${c}','${name}')" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/50">
                <div class="w-8 h-8 bg-slate-100 dark:bg-slate-700 flex items-center justify-center rounded-lg font-bold text-[9px] uppercase">${c.slice(0,2)}</div>
                <div><p class="text-[11px] font-bold">${name}</p><p class="text-[9px] text-brand font-bold uppercase">${c}</p></div>
            </div>`;
        }).join("");
    });
}

function renderMarket() {
    const list = ["USD", "EUR", "GBP", "JPY", "SGD", "MYR", "AUD", "SAR", "CNY"];
    document.getElementById('quick-list').innerHTML = list.map(c => {
        const val = (rates["IDR"] / rates[c]).toLocaleString('id-ID', {maximumFractionDigits:0});
        return `<div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group transition active:scale-95 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center font-bold text-xs">${c}</div>
                <div><p class="text-xs font-bold">${currencyMap[c] || c}</p><p class="text-[10px] opacity-30 font-bold uppercase">1 ${c} to IDR</p></div>
            </div>
            <p class="text-brand font-[800] text-sm">Rp ${val}</p>
        </div>`;
    }).join("");
}

async function calculate() {
    const amt = parseFloat(document.getElementById('amount').value) || 0;
    const fee = parseFloat(document.getElementById('fee').value) || 0;
    const lang = document.getElementById('lang').value;
    if (amt <= 0) return;
    try {
        const res = await fetch(API + fromC);
        const data = await res.json();
        const rate = data.rates[toC];
        const raw = amt * rate;
        const final = raw - (raw * (fee / 100));
        
        const fmt = new Intl.NumberFormat(lang==='id'?'id-ID':'en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
        document.getElementById('output').innerText = `${toC} ${fmt.format(final)}`;
        document.getElementById('label-currency').innerText = currencyMap[toC] || toC;
        document.getElementById('spellout').innerText = `"${spellOut(final, lang)} ${currencyMap[toC] || toC}"`;
        document.getElementById('status').innerText = `${langs[lang].sync}: ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
        
        addHistory(amt, fromC, fmt.format(final), toC);
    } catch (e) {}
}

function addHistory(amt, f, res, t) {
    log.unshift({ time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false}), text: `${amt} ${f} → ${t} ${res}` });
    if(log.length > 15) log.pop();
    const container = document.getElementById('history-container');
    if(log.length === 0) { container.innerHTML = `<p class="text-center opacity-20 py-10 italic text-sm">Tidak ada riwayat.</p>`; return; }
    container.innerHTML = log.map(l => `<div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm"><span class="text-[11px] font-bold tracking-tight">${l.text}</span><span class="text-[9px] opacity-30 font-bold uppercase">${l.time}</span></div>`).join("");
}

function toggleDrop(type) { 
    const d = document.getElementById(`drop-${type}`);
    const isS = d.classList.contains('show');
    document.querySelectorAll('.drop-list').forEach(el => el.classList.remove('show'));
    if(!isS) { d.classList.add('show'); document.getElementById(`search-${type}`).focus(); }
}

function select(type, code, name) {
    if(type === 'from') { fromC = code; document.getElementById('display-from').innerText = `${code} - ${name}`; }
    else { toC = code; document.getElementById('display-to').innerText = `${code} - ${name}`; }
    document.querySelectorAll('.drop-list').forEach(el => el.classList.remove('show'));
    calculate();
}

function filter(type) {
    const q = document.getElementById(`search-${type}`).value.toLowerCase();
    const items = document.getElementById(`list-${type}`).children;
    for(let i of items) i.style.display = i.innerText.toLowerCase().includes(q) ? "flex" : "none";
}

function swap() {
    const fT = document.getElementById('display-from').innerText, tT = document.getElementById('display-to').innerText;
    [fromC, toC] = [toC, fromC];
    document.getElementById('display-from').innerText = tT; document.getElementById('display-to').innerText = fT;
    calculate();
}

function copyResult() { navigator.clipboard.writeText(document.getElementById('output').innerText); alert(langs[document.getElementById('lang').value].copied); }
function clearHistory() { log = []; document.getElementById('history-container').innerHTML = `<p class="text-center opacity-20 py-10 italic text-sm">Riwayat dikosongkan.</p>`; }

function updateUI() {
    const l = document.getElementById('lang').value; const p = langs[l];
    document.getElementById('l-amt').innerText = p.amt; document.getElementById('l-fee').innerText = p.fee;
    document.getElementById('l-res').innerText = p.res; document.getElementById('l-market').innerText = p.market;
    document.getElementById('l-quick').innerText = p.quick; document.getElementById('l-hist').innerText = p.hist;
    document.getElementById('l-spell').innerText = p.spell;
    calculate();
}

window.onclick = (e) => { if(!e.target.closest('#cont-from') && !e.target.closest('#cont-to')) document.querySelectorAll('.drop-list').forEach(d => d.classList.remove('show')); }
document.getElementById('amount').addEventListener('change', calculate);
document.getElementById('fee').addEventListener('change', calculate);
window.onload = init;