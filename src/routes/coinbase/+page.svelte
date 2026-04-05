<script>
import { onMount } from 'svelte';
import { fly, fade } from 'svelte/transition';

let rates = $state({});
let loading = $state(true);
let error = $state(null);
let selectedCurrency = $state('USD');
let searchQuery = $state('');
let lastUpdated = $state(null);
let hoveredCard = $state(null);
let view = $state('grid');
let flipCard = $state(null);
let pulse = $state(false);
let selectedCategory = $state('all');
let sortBy = $state('featured');
let showMobileFilters = $state(false);
let mouseX = $state(0);
let mouseY = $state(0);
let flashStates = $state({});
let searchInputRef = $state(null);
let favorites = $state(new Set());
let compareMode = $state(false);
let compareList = $state([]);
let tooltip = $state({ show: false, text: '', x: 0, y: 0 });
let showFavoritesOnly = $state(false);
let priceAlertThreshold = $state(5);
let showToast = $state(null);
let cardRefs = $state({});
let focusedIndex = $state(-1);

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY'];
const FEATURED = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'UNI', 'ATOM', 'ARB', 'OP', 'NEAR', 'APT', 'SUI', 'SEI'];
const CATEGORIES = [
{ key: 'all', label: 'All', emoji: '🌐' },
{ key: 'layer1', label: 'L1s', emoji: '⛓️', coins: ['BTC','ETH','SOL','ADA','AVAX','DOT','ATOM','NEAR','APT','SUI','SEI'] },
{ key: 'defi', label: 'DeFi', emoji: '🏦', coins: ['UNI','LINK','AAVE','MKR','CRV','LDO','SNX','COMP'] },
{ key: 'meme', label: 'Memes', emoji: '🐸', coins: ['DOGE','SHIB','PEPE','BONK','FLOKI','WIF'] },
{ key: 'l2', label: 'L2s', emoji: '🚀', coins: ['ARB','OP','MATIC','IMX','METIS'] },
{ key: 'gainers', label: '🔥 Gainers', emoji: '📈', filter: 'gainers' },
{ key: 'losers', label: '❄️ Losers', emoji: '📉', filter: 'losers' }
];
const SORT_OPTIONS = [
{ key: 'featured', label: '⭐ Featured' },
{ key: 'favorites', label: '💛 Favorites First' },
{ key: 'price-desc', label: 'Price: High → Low' },
{ key: 'price-asc', label: 'Price: Low → High' },
{ key: 'change-desc', label: '24h: Gainers First' },
{ key: 'change-asc', label: '24h: Losers First' },
{ key: 'name', label: 'Name A-Z' }
];

const COIN_DATA = {
BTC:  { color: '#F7931A', name: 'Bitcoin', change24h: 2.4 },
ETH:  { color: '#627EEA', name: 'Ethereum', change24h: -1.2 },
SOL:  { color: '#9945FF', name: 'Solana', change24h: 5.8 },
DOGE: { color: '#C3A634', name: 'Dogecoin', change24h: 8.2 },
XRP:  { color: '#00AAE4', name: 'Ripple', change24h: -0.5 },
ADA:  { color: '#0033AD', name: 'Cardano', change24h: 1.8 },
AVAX: { color: '#E84142', name: 'Avalanche', change24h: -3.2 },
DOT:  { color: '#E6007A', name: 'Polkadot', change24h: 0.9 },
LINK: { color: '#2A5ADA', name: 'Chainlink', change24h: 4.5 },
MATIC:{ color: '#8247E5', name: 'Polygon', change24h: -2.1 },
UNI:  { color: '#FF007A', name: 'Uniswap', change24h: 3.7 },
ATOM: { color: '#2E3148', name: 'Cosmos', change24h: -1.5 },
ARB:  { color: '#28A0F0', name: 'Arbitrum', change24h: 6.2 },
OP:   { color: '#FF0420', name: 'Optimism', change24h: 2.9 },
NEAR: { color: '#00C08B', name: 'NEAR', change24h: -4.3 },
APT:  { color: '#22D1EE', name: 'Aptos', change24h: 1.2 },
SUI:  { color: '#4DA2FF', name: 'Sui', change24h: 7.5 },
SEI:  { color: '#B843E1', name: 'Sei', change24h: -0.8 },
SHIB: { color: '#FFA409', name: 'Shiba Inu', change24h: 12.4 },
PEPE: { color: '#4B9E4B', name: 'Pepe', change24h: -8.7 },
BONK: { color: '#FF6B35', name: 'Bonk', change24h: 15.2 },
AAVE: { color: '#B6509E', name: 'Aave', change24h: -2.8 },
MKR:  { color: '#1AAB9B', name: 'Maker', change24h: 0.5 },
CRV:  { color: '#FCEE21', name: 'Curve', change24h: -5.4 },
LDO:  { color: '#00A3FF', name: 'Lido', change24h: 1.9 },
SNX:  { color: '#00D1FF', name: 'Synthetix', change24h: -1.1 },
COMP: { color: '#00D395', name: 'Compound', change24h: 3.2 },
DEFAULT: { color: '#0052FF', name: 'Crypto', change24h: 0 }
};

function coinInfo(sym) { return COIN_DATA[sym] ?? COIN_DATA.DEFAULT; }

async function fetchRates() {
loading = true; error = null;
try {
const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
if (!res.ok) throw new Error(`Coinbase ${res.status}`);
const data = await res.json();
const newRates = data.data?.rates ?? {};

if (Object.keys(rates).length > 0) {
Object.entries(newRates).forEach(([sym, newRate]) => {
const oldRate = rates[sym];
if (oldRate && oldRate !== newRate) {
const oldVal = parseFloat(invertRate(oldRate));
const newVal = parseFloat(invertRate(newRate));
flashStates[sym] = newVal > oldVal ? 'up' : 'down';
setTimeout(() => { flashStates[sym] = null; }, 1000);
}
});
}
rates = newRates;
lastUpdated = new Date();
pulse = true;
setTimeout(() => pulse = false, 600);
} catch (e) {
error = e.message;
} finally {
loading = false;
}
}

function invertRate(rate) {
const v = parseFloat(rate);
if (!v || isNaN(v) || v === 0) return '0';
return (1 / v).toString();
}

function convertRate(usdRate) {
const inverted = invertRate(usdRate);
if (selectedCurrency === 'USD') return inverted;
const fx = rates[selectedCurrency];
if (!fx) return inverted;
return (parseFloat(inverted) * parseFloat(fx)).toString();
}

function fmt(n) {
const v = parseFloat(n);
if (isNaN(v)) return '—';
if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
if (v >= 1e3) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
if (v >= 1) return v.toFixed(2);
if (v >= 0.0001) return v.toFixed(6);
return v.toExponential(2);
}

function fmtBig(n) {
const v = parseFloat(n);
if (isNaN(v)) return '—';
if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
if (v >= 1e3) return v.toLocaleString();
if (v >= 1) return v.toFixed(2);
return v.toFixed(6);
}

function fakeSparkline(seed) {
let s = seed.charCodeAt(0) + (seed.charCodeAt(1) || 0);
const pts = [];
for (let i = 0; i < 20; i++) {
s = (s * 16807 + 7) % 2147483647;
pts.push(30 + (s % 40));
}
return pts;
}

function sparkSvg(pts, color) {
const w = 80, h = 32;
const min = Math.min(...pts), max = Math.max(...pts);
const range = max - min || 1;
const d = pts.map((p, i) => {
const x = (i / (pts.length - 1)) * w;
const y = h - ((p - min) / range) * h;
return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
}).join(' ');
const area = d + ` L${w},${h} L0,${h} Z`;
return { line: d, area };
}

let filtered = $derived.by(() => {
let result = Object.entries(rates)
.filter(([sym]) => sym !== 'USD')
.filter(([sym]) => {
if (searchQuery) return sym.toLowerCase().includes(searchQuery.toLowerCase());
if (showFavoritesOnly && !favorites.has(sym)) return false;
if (selectedCategory === 'all') return true;
const cat = CATEGORIES.find(c => c.key === selectedCategory);
if (cat?.filter === 'gainers') return coinInfo(sym).change24h > 0;
if (cat?.filter === 'losers') return coinInfo(sym).change24h < 0;
return cat?.coins?.includes(sym);
});

switch (sortBy) {
case 'price-desc':
result.sort((a, b) => parseFloat(invertRate(b[1])) - parseFloat(invertRate(a[1])));
break;
case 'price-asc':
result.sort((a, b) => parseFloat(invertRate(a[1])) - parseFloat(invertRate(b[1])));
break;
case 'change-desc':
result.sort((a, b) => coinInfo(b[0]).change24h - coinInfo(a[0]).change24h);
break;
case 'change-asc':
result.sort((a, b) => coinInfo(a[0]).change24h - coinInfo(b[0]).change24h);
break;
case 'name':
result.sort((a, b) => a[0].localeCompare(b[0]));
break;
case 'favorites':
result.sort((a, b) => {
const aFav = favorites.has(a[0]) ? 1 : 0;
const bFav = favorites.has(b[0]) ? 1 : 0;
return bFav - aFav;
});
break;
default:
result.sort((a, b) => {
const ai = FEATURED.indexOf(a[0]), bi = FEATURED.indexOf(b[0]);
if (ai !== -1 && bi !== -1) return ai - bi;
if (ai !== -1) return -1;
if (bi !== -1) return 1;
return parseFloat(invertRate(b[1])) - parseFloat(invertRate(a[1]));
});
}
return result;
});

let featuredRates = $derived.by(() =>
FEATURED.filter(sym => rates[sym]).map(sym => ({
sym,
usd: rates[sym],
converted: convertRate(rates[sym]),
info: coinInfo(sym),
spark: fakeSparkline(sym)
}))
);

const CURR_SYMBOLS = { USD:'$', EUR:'€', GBP:'£', JPY:'¥', AUD:'A$', CAD:'C$', CHF:'CHF ', CNY:'¥' };
function currSym() { return CURR_SYMBOLS[selectedCurrency] ?? '$'; }

function copyToClipboard(text, sym) {
navigator.clipboard.writeText(text);
flashStates[sym + '_copied'] = true;
setTimeout(() => { flashStates[sym + '_copied'] = null; }, 1500);
}

function handleKeydown(e) {
if (e.key === '/' && document.activeElement !== searchInputRef) {
e.preventDefault();
searchInputRef?.focus();
}
if (e.key === 'Escape' && searchQuery) {
searchQuery = '';
searchInputRef?.blur();
}
if (e.key === 'f' && document.activeElement !== searchInputRef && focusedIndex >= 0) {
e.preventDefault();
const item = filtered[focusedIndex];
if (item) toggleFavorite(item[0]);
}
if (e.key === 'c' && document.activeElement !== searchInputRef) {
e.preventDefault();
compareMode = !compareMode;
if (!compareMode) compareList = [];
}
if (e.key === 'w' && document.activeElement !== searchInputRef) {
e.preventDefault();
showFavoritesOnly = !showFavoritesOnly;
}
if (e.key === 'ArrowDown' && document.activeElement !== searchInputRef && filtered.length > 0) {
e.preventDefault();
focusedIndex = Math.min(focusedIndex + 1, filtered.length - 1);
}
if (e.key === 'ArrowUp' && document.activeElement !== searchInputRef && filtered.length > 0) {
e.preventDefault();
focusedIndex = Math.max(focusedIndex - 1, 0);
}
}

function getTimeAgo(date) {
if (!date) return '';
const secs = Math.floor((Date.now() - date.getTime()) / 1000);
if (secs < 10) return 'just now';
if (secs < 60) return `${secs}s ago`;
if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
return `${Math.floor(secs / 3600)}h ago`;
}

function toggleFavorite(sym, e) {
e?.stopPropagation();
const newFavorites = new Set(favorites);
if (newFavorites.has(sym)) {
newFavorites.delete(sym);
showToast = { type: 'info', message: `${sym} removed from watchlist` };
} else {
newFavorites.add(sym);
showToast = { type: 'success', message: `${sym} added to watchlist` };
}
favorites = newFavorites;
if (typeof localStorage !== 'undefined') {
localStorage.setItem('coinbase_favorites', JSON.stringify([...favorites]));
}
setTimeout(() => showToast = null, 2000);
}

function toggleCompare(sym, e) {
e?.stopPropagation();
if (compareList.includes(sym)) {
compareList = compareList.filter(s => s !== sym);
} else if (compareList.length < 4) {
compareList = [...compareList, sym];
} else {
showToast = { type: 'warning', message: 'Maximum 4 coins for comparison' };
setTimeout(() => showToast = null, 2000);
}
}

function showTooltip(text, e) {
tooltip = { show: true, text, x: e.clientX, y: e.clientY - 30 };
}

function hideTooltip() {
tooltip = { ...tooltip, show: false };
}

function showToastMessage(message, type = 'info') {
showToast = { type, message };
setTimeout(() => showToast = null, 2500);
}

const TICKER = '🔵 COINBASE · EXCHANGE RATES · BTC · ETH · SOL · LIVE CRYPTO PRICES · REAL-TIME RATES · DIGITAL ASSETS · BLOCKCHAIN · WEB3 · DEFI · ';

// ── BLUE NEON COLOR SYSTEM (x402 cyberpunk style) ──
const neonColors = [
	{ ring: 'ring-blue-400',   text: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30',   glow: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]',   bar: 'bg-blue-400'   },
	{ ring: 'ring-cyan-400',   text: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/30',   glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',   bar: 'bg-cyan-400'   },
	{ ring: 'ring-sky-400',    text: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/30',    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)]',    bar: 'bg-sky-400'    },
	{ ring: 'ring-indigo-400', text: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/30', glow: 'shadow-[0_0_20px_rgba(129,140,248,0.3)]', bar: 'bg-indigo-400' },
	{ ring: 'ring-blue-500',   text: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',   bar: 'bg-blue-500'   },
];

let sparklineData = $state(Array.from({ length: 12 }, () => Math.random() * 100));

onMount(() => {
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('coinbase_favorites');
		if (saved) favorites = new Set(JSON.parse(saved));
	}
	fetchRates();
	const iv = setInterval(() => {
		fetchRates();
		sparklineData = sparklineData.map(() => Math.random() * 100);
	}, 600_000);
	return () => { clearInterval(iv); };
});
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:head><title>Coinbase | JamCat</title></svelte:head>

<!-- Page wrapper with dark futuristic background -->
<div class="relative min-h-screen overflow-hidden bg-[#040d14] font-mono text-white">
	<!-- Ambient background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]"></div>
	</div>

	<!-- Scanline overlay -->
	<div class="pointer-events-none absolute inset-0 opacity-[0.015]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.5) 2px, rgba(59,130,246,0.5) 3px)"></div>

	<!-- Ticker marquee -->
	<div class="overflow-hidden border-b border-white/5 bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-transparent py-2 backdrop-blur-xl">
		<div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
			{#each [TICKER, TICKER, TICKER] as t}
				<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">{t}</span>
			{/each}
		</div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
		<!-- ── Header ── -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<div class="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl font-black text-white shadow-lg shadow-blue-500/30">
						<svg class="h-9 w-9" viewBox="0 0 32 32" fill="none">
							<path d="M16 28c6.627 0 12-5.373 12-12S22.627 4 16 4 4 9.373 4 16s5.373 12 12 12z" fill="white"/>
							<path d="M16 24c-4.418 0-8-3.582-8-8s3.582-8 8-8c4.067 0 7.422 3.04 7.923 6.968h-3.965c-.462-1.71-2.007-2.968-3.958-2.968-2.21 0-4 1.79-4 4s1.79 4 4 4c1.951 0 3.496-1.258 3.958-2.968h3.965C23.422 20.96 20.067 24 16 24z" fill="#0052ff"/>
						</svg>
					</div>
					<div>
						<div class="flex items-center gap-2 flex-wrap">
							<h1 class="text-4xl font-black tracking-tight">
								<span class="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">Coinbase</span>
							</h1>
							<span class="rounded-md border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.2)]">
								EXCHANGE RATES
							</span>
							<span class="flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-400/5 px-3 py-1 text-xs text-blue-400">
								<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]"></span>LIVE
							</span>
						</div>
						<p class="mt-1.5 text-xs text-blue-400/40">
							{Object.keys(rates).length} assets · {selectedCurrency} base · Updated {getTimeAgo(lastUpdated)}
						</p>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#each CATEGORIES.slice(0, 5) as cat}
					<button onclick={() => { selectedCategory = cat.key; searchQuery = ''; }}
						class="group relative overflow-hidden rounded-xl border px-3 py-2 text-xs font-bold transition-all
						{selectedCategory === cat.key && !searchQuery
							? 'border-blue-400/50 bg-blue-400/10 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)]'
							: 'border-white/10 bg-white/5 text-slate-400 hover:border-blue-400/30 hover:bg-white/10 hover:text-white'}">
						<span class="relative z-10 flex items-center gap-1.5">
							<span>{cat.emoji}</span>{cat.label}
						</span>
						{#if selectedCategory === cat.key && !searchQuery}
							<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#if error}
			<div class="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 p-12 text-center backdrop-blur-sm">
				<div class="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-red-500/10 blur-3xl"></div>
				<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/20 text-3xl">⚠️</div>
				<h2 class="text-xl font-bold text-red-400">Connection Interrupted</h2>
				<p class="mt-2 text-sm text-slate-400">{error}</p>
				<button onclick={fetchRates} class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20">↻ Retry</button>
			</div>
		{:else}
			<!-- ── Stats Bar ── -->
			<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each [
					{ label: 'Total Assets', value: Object.keys(rates).length.toString(), hi: true, trend: '+24', key: 'assets', icon: '🔵' },
					{ label: 'Base Currency', value: selectedCurrency, trend: '↗', key: 'currency', icon: '💱' },
					{ label: 'Watchlist', value: favorites.size.toString(), trend: '★', key: 'favs', icon: '⭐' },
					{ label: 'Updated', value: getTimeAgo(lastUpdated) || 'now', trend: '●', key: 'time', icon: '⏱' },
				] as s (s.key)}
					<div class="group relative overflow-hidden rounded-2xl border {s.hi ? 'border-blue-400/30 bg-blue-400/5' : 'border-white/5 bg-white/[0.02]'} p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 backdrop-blur-sm">
						<div class="absolute right-0 top-0 h-20 w-20 rounded-full bg-blue-400/5 blur-2xl group-hover:bg-blue-400/10 transition-all pointer-events-none"></div>
						<div class="flex justify-between items-start mb-2">
							<p class="text-[10px] uppercase tracking-widest text-slate-500">{s.icon} {s.label}</p>
							<span class="rounded-full bg-blue-400/10 px-2 py-0.5 text-[9px] font-bold text-blue-400">{s.trend}</span>
						</div>
						<p class="text-2xl font-extrabold {s.hi ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)]' : 'text-white'}">{s.value}</p>
						<div class="mt-3 h-7 flex items-end gap-0.5">
							{#each sparklineData as height, idx (idx)}
								<div class="flex-1 bg-gradient-to-t from-blue-400/10 to-blue-400/30 rounded-t transition-all" style="height: {height}%"></div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- ── Controls ── -->
			<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap items-center gap-2">
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
						</svg>
						<input bind:this={searchInputRef} bind:value={searchQuery}
							placeholder="Search assets... (/)"
							class="w-44 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-9 text-sm text-white placeholder-slate-600 outline-none backdrop-blur-sm transition-all focus:w-56 focus:border-blue-400/30 focus:bg-white/[0.04] font-mono" />
						{#if searchQuery}
							<button onclick={() => searchQuery = ''} class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white/60">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
							</button>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2">
					<select bind:value={sortBy} class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-bold text-slate-400 outline-none backdrop-blur-sm transition-all hover:border-blue-400/20 cursor-pointer font-mono">
						{#each SORT_OPTIONS as opt}
							<option value={opt.key}>{opt.label}</option>
						{/each}
					</select>

					<div class="hidden sm:flex gap-0.5 rounded-xl border border-white/10 bg-white/[0.02] p-1 backdrop-blur-sm">
						{#each CURRENCIES.slice(0, 4) as cur}
							<button onclick={() => selectedCurrency = cur}
								class="rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition
								{selectedCurrency === cur ? 'bg-blue-400/20 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]' : 'text-slate-500 hover:text-white'}">
								{cur}
							</button>
						{/each}
					</div>

					<div class="flex gap-0.5 rounded-xl border border-white/10 bg-white/[0.02] p-1 backdrop-blur-sm">
						<button onclick={() => view = 'grid'}
							class="rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition
							{view === 'grid' ? 'bg-blue-400/20 text-blue-400' : 'text-slate-500 hover:text-white'}">⊞</button>
						<button onclick={() => view = 'list'}
							class="rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition
							{view === 'list' ? 'bg-blue-400/20 text-blue-400' : 'text-slate-500 hover:text-white'}">☰</button>
					</div>

					<button onclick={() => showFavoritesOnly = !showFavoritesOnly}
						class="hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all
						{showFavoritesOnly ? 'border-yellow-400/40 bg-yellow-400/15 text-yellow-400' : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'}">
						<span class="text-sm">{showFavoritesOnly ? '★' : '☆'}</span>
						<span class="hidden lg:inline">Watchlist</span>
						{#if favorites.size > 0}
							<span class="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{favorites.size}</span>
						{/if}
					</button>

					<button onclick={() => { compareMode = !compareMode; if (!compareMode) compareList = []; }}
						class="hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all
						{compareMode ? 'border-blue-400/40 bg-blue-400/15 text-blue-400' : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'}">
						<span>⚖️</span>
						<span class="hidden lg:inline">Compare</span>
						{#if compareList.length > 0}
							<span class="ml-1 rounded-full bg-blue-400/30 px-1.5 py-0.5 text-[9px]">{compareList.length}</span>
						{/if}
					</button>

					<button onclick={() => showMobileFilters = !showMobileFilters} class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-bold text-slate-400 transition-all hover:border-white/20 sm:hidden">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
						</svg>
					</button>

					<button onclick={fetchRates} disabled={loading}
						class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-black text-slate-500 backdrop-blur-sm transition hover:border-blue-400/20 hover:text-blue-400 disabled:opacity-20 {pulse ? 'text-blue-400' : ''}">
						{loading ? '⟳' : '↻'}
					</button>
				</div>
			</div>

			<!-- ── Featured Cards ── -->
			{#if featuredRates.length && !searchQuery}
				<div class="mb-8">
					<div class="mb-4 flex items-center gap-2">
						<span class="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></span>
						<p class="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400/60">Featured Assets</p>
					</div>
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{#each featuredRates as coin, i (coin.sym)}
							{@const spark = sparkSvg(coin.spark, coin.info.color)}
							{@const change = coin.info.change24h}
							{@const isPositive = change >= 0}
							{@const isFavorite = favorites.has(coin.sym)}
							{@const isInCompare = compareList.includes(coin.sym)}
							{@const coinColor = neonColors[i % neonColors.length]}
							<div
								class="group relative overflow-hidden rounded-2xl border {coinColor.border} bg-white/[0.015] p-4 text-left backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.035] hover:{coinColor.glow} cursor-pointer {isFavorite ? 'ring-1 ring-yellow-400/30' : ''}"
								style="animation:slideUp 0.5s cubic-bezier(.22,1,.36,1) {i * 40}ms both"
								onclick={() => { if (compareMode) { toggleCompare(coin.sym); } else { flipCard = flipCard === coin.sym ? null : coin.sym; } }}>
								
								<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full {coinColor.bg} blur-2xl opacity-0 transition-opacity group-hover:opacity-100"></div>
								
								<div class="relative z-10">
									<div class="mb-3 flex items-start justify-between">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl border {coinColor.border} {coinColor.bg} text-sm font-black {coinColor.text} transition-all duration-300 group-hover:scale-110">
											{coin.sym[0]}
										</div>
										<div class="flex flex-col items-end gap-1.5">
											{#if Math.abs(change) >= priceAlertThreshold}
												<div class="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold {isPositive ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'} animate-pulse">
													<span>{isPositive ? '🔥' : '❄️'}</span>
												</div>
											{/if}
											<div class="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold {isPositive ? 'bg-green-400/15 text-green-400 border border-green-400/20' : 'bg-red-400/15 text-red-400 border border-red-400/20'}">
												<span>{isPositive ? '↑' : '↓'}</span>
												<span>{Math.abs(change).toFixed(1)}%</span>
											</div>
										</div>
									</div>

									<div class="absolute right-0 top-10 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
										<button onclick={(e) => toggleFavorite(coin.sym, e)} class="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-sm transition-all hover:bg-white/10 hover:scale-110 {isFavorite ? 'text-yellow-400' : 'text-slate-400'}">
											{isFavorite ? '★' : '☆'}
										</button>
										{#if compareMode}
											<button onclick={(e) => { e.stopPropagation(); toggleCompare(coin.sym); }} class="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all {isInCompare ? 'bg-blue-400 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}">
												{isInCompare ? '✓' : '+'}
											</button>
										{/if}
									</div>

									{#if flipCard === coin.sym}
										<div class="animate-[flipIn_0.3s_ease]">
											<p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">{coin.sym}</p>
											<p class="text-sm font-bold text-white">{coin.info.name}</p>
											<p class="mt-2 text-[9px] text-slate-600">Current Rate</p>
											<button onclick={(e) => { e.stopPropagation(); copyToClipboard(fmtBig(coin.converted), coin.sym); }} class="relative text-lg font-black text-white cursor-pointer hover:scale-105 transition-transform">
												{currSym()}{fmtBig(coin.converted)}
												{#if flashStates[coin.sym + '_copied']}
													<span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-green-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
												{/if}
											</button>
										</div>
									{:else}
										<p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">{coin.sym}</p>
										<button onclick={(e) => { e.stopPropagation(); copyToClipboard(fmt(coin.converted), coin.sym); }} class="relative text-xl font-black tracking-tight transition-all cursor-pointer text-white group-hover:{coinColor.text}">
											{currSym()}{fmt(coin.converted)}
											{#if flashStates[coin.sym + '_copied']}
												<span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-green-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
											{/if}
										</button>

										<svg viewBox="0 0 80 32" class="mt-2 h-6 w-full opacity-50 transition-opacity group-hover:opacity-80" preserveAspectRatio="none">
											<defs>
												<linearGradient id="g-{coin.sym}" x1="0" y1="0" x2="0" y2="1">
													<stop offset="0%" stop-color={isPositive ? '#4ade80' : '#f87171'} stop-opacity="0.4"/>
													<stop offset="100%" stop-color={isPositive ? '#4ade80' : '#f87171'} stop-opacity="0"/>
												</linearGradient>
											</defs>
											<path d={spark.area} fill="url(#g-{coin.sym})"/>
											<path d={spark.line} fill="none" stroke={isPositive ? '#4ade80' : '#f87171'} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			<!-- ── Skeleton ── -->
			{#if loading && !Object.keys(rates).length}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{#each Array(12) as _, i}
						<div class="h-32 animate-pulse rounded-2xl bg-white/[0.02] border border-white/5" style="animation-delay:{i * 50}ms"></div>
					{/each}
				</div>
			{/if}

			<!-- ── All Pairs ── -->
			{#if filtered.length}
				<div class="mb-6">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
								{searchQuery ? 'Results' : CATEGORIES.find(c => c.key === selectedCategory)?.label ?? 'All'} Rates
							</p>
							<span class="rounded-full bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 text-[9px] font-bold text-blue-400">{filtered.length}</span>
						</div>
						<p class="text-[9px] text-slate-600">click to copy</p>
					</div>

					{#if view === 'grid'}
						<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
							{#each filtered.slice(0, 60) as [sym, usdRate], i (sym)}
								{@const coinColor = neonColors[i % neonColors.length]}
								{@const info = coinInfo(sym)}
								{@const change = info.change24h}
								{@const isPositive = change >= 0}
								{@const isFavorite = favorites.has(sym)}
								{@const isInCompare = compareList.includes(sym)}
								<div class="group relative overflow-hidden rounded-xl border {coinColor.border} bg-white/[0.015] p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.035] hover:{coinColor.glow}"
									style="animation:fadeIn 0.3s ease {Math.min(i * 10, 400)}ms both">
									<div class="flex items-center gap-2.5">
										<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border {coinColor.border} {coinColor.bg} text-[9px] font-black {coinColor.text} transition-transform group-hover:scale-110">
											{sym.slice(0, 2)}
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center justify-between">
												<p class="truncate text-[11px] font-bold text-white">{sym}</p>
												<div class="flex items-center gap-1">
													<button onclick={() => toggleFavorite(sym)} class="text-[10px] transition-all hover:scale-110 {isFavorite ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400'}">
														{isFavorite ? '★' : '☆'}
													</button>
													{#if compareMode}
														<button onclick={() => toggleCompare(sym)} class="text-[10px] transition-all {isInCompare ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}">
															{isInCompare ? '✓' : '+'}
														</button>
													{/if}
													<span class="text-[9px] font-bold {isPositive ? 'text-green-400' : 'text-red-400'}">{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
												</div>
											</div>
											<button onclick={() => copyToClipboard(fmt(convertRate(usdRate)), sym)} class="relative truncate text-sm font-black transition-all cursor-pointer hover:scale-105 text-white group-hover:{coinColor.text}">
												{currSym()}{fmt(convertRate(usdRate))}
												{#if flashStates[sym + '_copied']}
													<span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
												{/if}
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01] backdrop-blur-sm">
							<div class="grid grid-cols-[3rem_1fr_10rem_8rem_3rem] items-center gap-2 border-b border-white/[0.04] px-5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 font-mono">
								<span>#</span>
								<span>Asset</span>
								<span class="text-right">Rate ({selectedCurrency})</span>
								<span class="text-right text-slate-700">USD</span>
								<span></span>
							</div>
							{#each filtered.slice(0, 80) as [sym, usdRate], i (sym)}
								{@const coinColor = neonColors[i % neonColors.length]}
								{@const info = coinInfo(sym)}
								{@const isFavorite = favorites.has(sym)}
								{@const isInCompare = compareList.includes(sym)}
								<div class="group grid grid-cols-[3rem_1fr_10rem_8rem_3rem] items-center gap-2 border-b border-white/[0.015] px-5 py-3 transition-colors last:border-0 hover:bg-white/[0.02]"
									style="animation:slideRight 0.2s ease {Math.min(i * 8, 400)}ms both">
									<span class="text-[10px] font-black text-slate-600">{i + 1}</span>
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border {coinColor.border} {coinColor.bg} text-[9px] font-black {coinColor.text}">
											{sym.slice(0, 3)}
										</div>
										<div class="min-w-0">
											<p class="text-xs font-bold text-white">{sym}</p>
											<p class="text-[9px] text-slate-600">{info.name}</p>
										</div>
									</div>
									<button onclick={() => copyToClipboard(fmtBig(convertRate(usdRate)), sym)} class="relative text-right text-sm font-black cursor-pointer hover:scale-105 transition-transform text-white">
										{currSym()}{fmtBig(convertRate(usdRate))}
										{#if flashStates[sym + '_copied']}
											<span class="absolute -top-5 right-0 text-[8px] font-bold text-green-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
										{/if}
									</button>
									<p class="text-right text-[10px] text-slate-600">${fmtBig(invertRate(usdRate))}</p>
									<div class="flex items-center justify-end gap-1">
										<button onclick={() => toggleFavorite(sym)} class="text-[12px] transition-all hover:scale-110 {isFavorite ? 'text-yellow-400' : 'text-slate-700 hover:text-slate-500'}">
											{isFavorite ? '★' : '☆'}
										</button>
										{#if compareMode}
											<button onclick={() => toggleCompare(sym)} class="text-[12px] transition-all {isInCompare ? 'text-blue-400' : 'text-slate-700 hover:text-slate-500'}">
												{isInCompare ? '✓' : '+'}
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if filtered.length > 80}
						<p class="mt-4 text-center text-[10px] text-slate-600">Showing 80 of {filtered.length} assets</p>
					{/if}
				</div>
			{:else if !loading && !error}
				<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-16 text-center backdrop-blur-sm">
					{#if showFavoritesOnly && favorites.size === 0}
						<div class="mb-4 text-6xl opacity-30">☆</div>
						<p class="mb-2 text-lg font-black text-slate-500">No watchlist items</p>
						<p class="mb-6 text-xs text-slate-700">Star your favorite coins to track them here</p>
						<button onclick={() => showFavoritesOnly = false} class="rounded-xl border border-blue-400/30 bg-blue-400/10 px-6 py-2.5 text-xs font-bold text-blue-400 transition hover:bg-blue-400/20">
							View All Assets
						</button>
					{:else if searchQuery}
						<div class="mb-4 text-6xl opacity-30">🔍</div>
						<p class="mb-2 text-lg font-black text-slate-500">No results found</p>
						<p class="mb-6 text-xs text-slate-700">Try a different search term</p>
						<button onclick={() => searchQuery = ''} class="rounded-xl border border-blue-400/30 bg-blue-400/10 px-6 py-2.5 text-xs font-bold text-blue-400 transition hover:bg-blue-400/20">
							Clear Search
						</button>
					{:else}
						<div class="mb-4 text-6xl opacity-30">∅</div>
						<p class="mb-2 text-lg font-black text-slate-500">No assets found</p>
						<p class="text-xs text-slate-700">Try a different category</p>
					{/if}
				</div>
			{/if}

			<!-- ── Footer ── -->
			<div class="mt-14 border-t border-white/[0.03] pt-6">
				<div class="flex flex-wrap items-center justify-between gap-4">
					<div class="flex items-center gap-3">
						<div class="relative">
							<div class="h-2 w-2 rounded-full bg-blue-400"></div>
							<div class="absolute inset-0 animate-ping rounded-full bg-blue-400/50"></div>
						</div>
						<p class="text-[9px] text-slate-500 font-mono">
							Coinbase API · {Object.keys(rates).length} assets · 10min refresh
						</p>
					</div>
					<div class="flex items-center gap-4">
						<div class="hidden sm:flex items-center gap-2 text-[9px] text-slate-600">
							<span class="rounded bg-white/5 px-1.5 py-0.5">/</span>
							<span>search</span>
							<span class="rounded bg-white/5 px-1.5 py-0.5">c</span>
							<span>compare</span>
							<span class="rounded bg-white/5 px-1.5 py-0.5">w</span>
							<span>watchlist</span>
							<span class="rounded bg-white/5 px-1.5 py-0.5">f</span>
							<span>favorite</span>
						</div>
						<div class="flex gap-5">
							{#each ['Coinbase API', 'Status', 'Docs'] as link}
								<span class="cursor-pointer text-[9px] text-slate-600 transition hover:text-blue-400">{link}</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

		{/if}
	</div>
</div>

<!-- ── Mobile Filters ── -->
{#if showMobileFilters}
	<button onclick={() => showMobileFilters = false}
		class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
		in:fade={{ duration: 200 }} aria-label="Close filters"></button>

	<div class="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-blue-400/20 bg-[#040d14] p-6"
		in:fly={{ y: 100, duration: 300 }}>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-bold text-white">Filters</h3>
			<button onclick={() => showMobileFilters = false} class="rounded-full bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
		</div>

		<div class="mb-4">
			<p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Categories</p>
			<div class="flex flex-wrap gap-2">
				{#each CATEGORIES as cat}
					<button onclick={() => { selectedCategory = cat.key; searchQuery = ''; }}
						class="flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition-all
						   {selectedCategory === cat.key && !searchQuery
						     ? 'border-blue-400/50 bg-blue-400/20 text-blue-400'
						     : 'border-white/10 bg-white/5 text-slate-400'}">
						<span>{cat.emoji}</span>
						<span>{cat.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="mb-4">
			<p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Quick Filters</p>
			<div class="flex gap-2">
				<button onclick={() => showFavoritesOnly = !showFavoritesOnly}
					class="flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition-all
					{showFavoritesOnly ? 'border-yellow-400/50 bg-yellow-400/20 text-yellow-400' : 'border-white/10 bg-white/5 text-slate-400'}">
					<span>{showFavoritesOnly ? '★' : '☆'}</span>
					<span>Watchlist</span>
					{#if favorites.size > 0}
						<span class="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{favorites.size}</span>
					{/if}
				</button>
				<button onclick={() => { compareMode = !compareMode; if (!compareMode) compareList = []; }}
					class="flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition-all
					{compareMode ? 'border-blue-400/50 bg-blue-400/20 text-blue-400' : 'border-white/10 bg-white/5 text-slate-400'}">
					<span>⚖️</span>
					<span>Compare</span>
					{#if compareList.length > 0}
						<span class="ml-1 rounded-full bg-blue-400/30 px-1.5 py-0.5 text-[9px]">{compareList.length}</span>
					{/if}
				</button>
			</div>
		</div>

		<div class="mb-4">
			<p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Currency</p>
			<div class="flex flex-wrap gap-2">
				{#each CURRENCIES as cur}
					<button onclick={() => selectedCurrency = cur}
						class="rounded-full border px-3 py-2 text-xs font-bold transition-all
						   {selectedCurrency === cur
						     ? 'border-blue-400 bg-blue-400/20 text-blue-400'
						     : 'border-white/10 bg-white/5 text-slate-400'}">
						{cur}
					</button>
				{/each}
			</div>
		</div>

		<div class="mb-6">
			<p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Sort By</p>
			<select bind:value={sortBy} class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none font-mono">
				{#each SORT_OPTIONS as opt}
					<option value={opt.key}>{opt.label}</option>
				{/each}
			</select>
		</div>

		<button onclick={() => showMobileFilters = false} class="w-full rounded-xl border border-blue-400/30 bg-blue-400/10 py-3 text-sm font-bold text-blue-400 transition hover:bg-blue-400/20">
			Show {filtered.length} Assets
		</button>
	</div>
{/if}

<!-- ── Compare Bar ── -->
{#if compareList.length > 0}
	<div class="fixed bottom-6 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4" in:fly={{ y: 100, duration: 300 }}>
		<div class="rounded-2xl border border-blue-400/20 bg-[#040d14]/95 p-4 shadow-2xl backdrop-blur-xl">
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-white">Compare</span>
					<span class="rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">{compareList.length}/4</span>
				</div>
				<button onclick={() => compareList = []} class="text-[10px] text-slate-500 hover:text-white">Clear all</button>
			</div>
			<div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
				{#each compareList as sym}
					{@const info = coinInfo(sym)}
					{@const rate = rates[sym]}
					{@const change = info.change24h}
					{@const isPositive = change >= 0}
					<div class="rounded-xl border border-white/5 bg-white/[0.03] p-3">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-bold" style="color:{info.color}">{sym}</span>
							<button onclick={() => toggleCompare(sym)} class="text-slate-600 hover:text-white">×</button>
						</div>
						<p class="text-lg font-black text-white">{currSym()}{rate ? fmt(convertRate(rate)) : '—'}</p>
						<p class="text-[10px] {isPositive ? 'text-green-400' : 'text-red-400'}">{isPositive ? '+' : ''}{change.toFixed(1)}%</p>
					</div>
				{/each}
			</div>
			<button onclick={() => compareMode = false} class="w-full rounded-xl border border-blue-400/30 bg-blue-400/10 py-2.5 text-xs font-bold text-blue-400 transition hover:bg-blue-400/20">
				Done
			</button>
		</div>
	</div>
{/if}

<!-- ── Toast ── -->
{#if showToast}
	<div class="fixed bottom-6 right-6 z-50" in:fly={{ y: 20, duration: 200 }} out:fade={{ duration: 150 }}>
		<div class="rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl
		 {showToast.type === 'success' ? 'border-green-400/30 bg-green-400/10' :
		  showToast.type === 'warning' ? 'border-yellow-400/30 bg-yellow-400/10' :
		  'border-blue-400/30 bg-blue-400/10'}">
			<p class="flex items-center gap-2 text-sm font-bold text-white">
				{#if showToast.type === 'success'}
					<span class="text-green-400">✓</span>
				{:else if showToast.type === 'warning'}
					<span class="text-yellow-400">⚠</span>
				{:else}
					<span class="text-blue-400">ℹ</span>
				{/if}
				{showToast.message}
			</p>
		</div>
	</div>
{/if}

<!-- ── Tooltip ── -->
{#if tooltip.show}
	<div class="fixed z-50 pointer-events-none rounded-lg border border-blue-400/20 bg-[#040d14]/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-sm"
	 style="left:{tooltip.x}px;top:{tooltip.y}px;transform:translateX(-50%)">
		{tooltip.text}
	</div>
{/if}

<style>
@keyframes marquee {
from { transform: translateX(0); }
to   { transform: translateX(-33.33%); }
}
@keyframes slideUp {
from { opacity: 0; transform: translateY(20px) scale(0.96); }
to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes fadeIn {
from { opacity: 0; }
to   { opacity: 1; }
}
@keyframes slideRight {
from { opacity: 0; transform: translateX(-8px); }
to   { opacity: 1; transform: translateX(0); }
}
@keyframes float {
0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
50% { transform: translateY(-20px) scale(1.5); opacity: 0.4; }
}
@keyframes flipIn {
from { opacity: 0; transform: rotateY(90deg); }
to   { opacity: 1; transform: rotateY(0); }
}
</style>
