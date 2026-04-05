<script>
import { onMount } from 'svelte';
import { fly, fade } from 'svelte/transition';

let tickers = $state([]);
let loading = $state(true);
let error = $state(null);
let searchQuery = $state('');
let lastUpdated = $state(null);
let hoveredCard = $state(null);
let view = $state('grid');
let pulse = $state(false);
let selectedCategory = $state('all');
let sortBy = $state('volume');
let showMobileFilters = $state(false);
let mouseX = $state(0);
let mouseY = $state(0);
let flashStates = $state({});
let searchInputRef = $state(null);

const FEATURED = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT','ADAUSDT','AVAXUSDT','DOTUSDT','LINKUSDT','MATICUSDT','UNIUSDT','ATOMUSDT','ARBUSDT','OPUSDT','NEARUSDT','APTUSDT','SUIUSDT'];

const CATEGORIES = [
{ key: 'all',    label: 'All',    emoji: '🌐' },
{ key: 'layer1', label: 'L1s',    emoji: '⛓️', coins: ['BTCUSDT','ETHUSDT','SOLUSDT','ADAUSDT','AVAXUSDT','DOTUSDT','ATOMUSDT','NEARUSDT','APTUSDT','SUIUSDT'] },
{ key: 'defi',   label: 'DeFi',   emoji: '🏦', coins: ['UNIUSDT','LINKUSDT','AAVEUSDT','MKRUSDT','CRVUSDT','LDOUSDT','SNXUSDT','COMPUSDT'] },
{ key: 'meme',   label: 'Memes',  emoji: '🐸', coins: ['DOGEUSDT','SHIBUSDT','PEPEUSDT','BONKUSDT','FLOKIUSDT','WIFUSDT'] },
{ key: 'l2',     label: 'L2s',    emoji: '🚀', coins: ['ARBUSDT','OPUSDT','MATICUSDT','IMXUSDT'] },
{ key: 'bnb',    label: 'BNB',    emoji: '🟡', coins: ['BNBUSDT','CAKEUSDT','BUSDUSDT'] },
{ key: 'gainers',label: '🔥 Gainers', emoji: '📈', filter: 'gainers' },
{ key: 'losers', label: '❄️ Losers',  emoji: '📉', filter: 'losers' },
];

const SORT_OPTIONS = [
{ key: 'volume',       label: '📊 Volume: High → Low' },
{ key: 'price-desc',   label: 'Price: High → Low' },
{ key: 'price-asc',    label: 'Price: Low → High' },
{ key: 'change-desc',  label: '24h: Gainers First' },
{ key: 'change-asc',   label: '24h: Losers First' },
{ key: 'name',         label: 'Name A-Z' },
];

const COIN_COLORS = {
BTC:'#F7931A', ETH:'#627EEA', SOL:'#9945FF', BNB:'#F0B90B',
DOGE:'#C3A634', XRP:'#00AAE4', ADA:'#0033AD', AVAX:'#E84142',
DOT:'#E6007A', LINK:'#2A5ADA', MATIC:'#8247E5', UNI:'#FF007A',
ATOM:'#2E3148', ARB:'#28A0F0', OP:'#FF0420', NEAR:'#00C08B',
APT:'#22D1EE', SUI:'#4DA2FF', SHIB:'#FFA409', PEPE:'#4B9E4B',
BONK:'#FF6B35', CAKE:'#D1884F', DEFAULT:'#F0B90B',
};

function baseSymbol(sym) { return sym.replace(/USDT$|BUSD$|BTC$|ETH$|BNB$/, ''); }
function coinColor(sym) { const b = baseSymbol(sym); return COIN_COLORS[b] ?? COIN_COLORS.DEFAULT; }

/** Compact ticker text for avatar chips (no single-letter ambiguity). */
function symbolBadge(base, maxLen = 5) {
	const b = String(base).toUpperCase();
	if (b.length <= maxLen) return b;
	return b.slice(0, Math.max(3, maxLen - 1)) + '…';
}

const TOP_GAINER_MIN_QUOTE_VOL = 300_000;

function pickTopGainer(list) {
	if (!list.length) return null;
	const liquid = list.filter(t => parseFloat(t.quoteVolume) >= TOP_GAINER_MIN_QUOTE_VOL);
	const pool = liquid.length ? liquid : list;
	/** Skip 1-letter "bases" (e.g. DUSDT → "D") so the headline stays recognizable. */
	const named = pool.filter(t => baseSymbol(t.symbol).length > 1);
	const candidates = named.length ? named : pool;
	return [...candidates].sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))[0];
}

/** Label for the stats card: never a lone ambiguous letter. */
function topGainerLabel(sym) {
	const b = baseSymbol(sym);
	if (b.length <= 1) return sym;
	return b;
}

function fmt(n) {
const v = parseFloat(n);
if (isNaN(v)) return '—';
if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
if (v >= 1e3) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
if (v >= 1) return v.toFixed(4);
if (v >= 0.0001) return v.toFixed(6);
return v.toExponential(2);
}

function fmtVol(n) {
const v = parseFloat(n);
if (isNaN(v)) return '—';
if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
return '$' + v.toFixed(0);
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

async function fetchTickers() {
loading = true; error = null;
try {
const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
if (!res.ok) throw new Error(`Binance ${res.status}`);
const data = await res.json();
const usdtPairs = data.filter(t => t.symbol.endsWith('USDT'));

const prev = Object.fromEntries(tickers.map(t => [t.symbol, t.lastPrice]));
usdtPairs.forEach(t => {
if (prev[t.symbol] && prev[t.symbol] !== t.lastPrice) {
const oldVal = parseFloat(prev[t.symbol]);
const newVal = parseFloat(t.lastPrice);
flashStates[t.symbol] = newVal > oldVal ? 'up' : 'down';
setTimeout(() => { flashStates[t.symbol] = null; }, 1000);
}
});

tickers = usdtPairs;
lastUpdated = new Date();
pulse = true;
setTimeout(() => pulse = false, 600);
} catch (e) {
error = e.message;
} finally {
loading = false;
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
}

function handleMouseMove(e) {
const rect = e.currentTarget?.getBoundingClientRect();
if (!rect) return;
mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
}

let tickerMap = $derived(Object.fromEntries(tickers.map(t => [t.symbol, t])));

let topGainerTicker = $derived(pickTopGainer(tickers));

let statCards = $derived.by(() => {
	const totalVol = tickers.reduce((acc, t) => acc + parseFloat(t.quoteVolume), 0);
	const g = topGainerTicker;
	let gSub = null;
	let gSubClass = '';
	let gValue = '--';
	if (g) {
		gValue = topGainerLabel(g.symbol);
		const ch = parseFloat(g.priceChangePercent);
		gSub = `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}% · 24h`;
		gSubClass = ch >= 0 ? 'text-green-400' : 'text-red-400';
	}
	return [
		{ label: 'Total Pairs', value: tickers.length.toString(), hi: true, trend: '+12', key: 'pairs', icon: '🟡' },
		{ label: '24h Volume', value: fmtVol(totalVol), trend: '↗', key: 'vol', icon: '📊' },
		{ label: 'Top Gainer', value: gValue, sub: gSub, subClass: gSubClass, trend: '🔥', key: 'gainer', icon: '🚀' },
		{ label: 'Updated', value: getTimeAgo(lastUpdated) || 'now', trend: '●', key: 'time', icon: '⏱' },
	];
});

let featured = $derived.by(() =>
FEATURED.filter(sym => tickerMap[sym]).map(sym => ({
sym,
t: tickerMap[sym],
color: coinColor(sym),
spark: fakeSparkline(sym),
}))
);

let filtered = $derived.by(() => {
let result = [...tickers];

if (searchQuery) {
result = result.filter(t => t.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
} else if (selectedCategory !== 'all') {
const cat = CATEGORIES.find(c => c.key === selectedCategory);
if (cat?.filter === 'gainers') result = result.filter(t => parseFloat(t.priceChangePercent) > 0);
else if (cat?.filter === 'losers') result = result.filter(t => parseFloat(t.priceChangePercent) < 0);
else if (cat?.coins) result = result.filter(t => cat.coins.includes(t.symbol));
}

switch (sortBy) {
case 'volume':      result.sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)); break;
case 'price-desc':  result.sort((a, b) => parseFloat(b.lastPrice)   - parseFloat(a.lastPrice));   break;
case 'price-asc':   result.sort((a, b) => parseFloat(a.lastPrice)   - parseFloat(b.lastPrice));   break;
case 'change-desc': result.sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)); break;
case 'change-asc':  result.sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent)); break;
case 'name':        result.sort((a, b) => a.symbol.localeCompare(b.symbol)); break;
}
return result;
});

const TICKER_TEXT = '🟡 BINANCE · SPOT MARKETS · BTC · ETH · SOL · BNB · LIVE CRYPTO PRICES · 24H VOLUME · REAL-TIME DATA · WEB3 · DEFI · ';

// ── YELLOW COLOR SYSTEM (x402 style) ──
const yellowColors = [
{ ring: 'ring-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/30',   glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',   bar: 'bg-amber-400'   },
{ ring: 'ring-yellow-400',  text: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30',  glow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]',  bar: 'bg-yellow-400'  },
{ ring: 'ring-orange-400',  text: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/30',  glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]',  bar: 'bg-orange-400'  },
{ ring: 'ring-amber-500',  text: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',   bar: 'bg-amber-500'   },
{ ring: 'ring-yellow-500', text: 'text-yellow-500',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',   bar: 'bg-yellow-500'  },
];

let sparklineData = $state(Array.from({ length: 12 }, () => Math.random() * 100));

onMount(() => {
	fetchTickers();
	const iv = setInterval(() => {
		fetchTickers();
		sparklineData = sparklineData.map(() => Math.random() * 100);
	}, 60_000);
	return () => clearInterval(iv);
});
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:head><title>Binance | JamCat</title></svelte:head>

<!-- Page wrapper with dark futuristic background -->
<div class="relative min-h-screen overflow-hidden bg-[#040d14] font-mono text-white">
	<!-- Ambient background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-yellow-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-orange-500/5 blur-[100px]"></div>
	</div>

	<!-- Scanline overlay -->
	<div class="pointer-events-none absolute inset-0 opacity-[0.015]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(251,191,36,0.5) 2px, rgba(251,191,36,0.5) 3px)"></div>

	<!-- Ticker marquee -->
	<div class="overflow-hidden border-b border-white/5 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent py-2.5 backdrop-blur-xl">
		<div class="flex whitespace-nowrap" style="animation:marquee 30s linear infinite">
			{#each [TICKER_TEXT, TICKER_TEXT] as t}
				<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">{t}</span>
			{/each}
		</div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
		<!-- ── Header ── -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<div class="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400 to-yellow-500 text-2xl font-black text-black shadow-lg shadow-amber-500/30">
						<svg class="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 1.5L7.5 6l1.77 1.77L12 5.04l2.73 2.73L16.5 6 12 1.5zm4.5 4.5l-1.77 1.77L12 10.54 9.27 7.77 7.5 9.54 12 14.04l4.5-4.5-1.5-3.54zM1.5 12l1.77 1.77L6 11.04v1.92l4.5 4.5 1.5-1.5L7.5 11.5v-2.04L1.5 12zm19.23-1.77L19.04 9.46 18 11.04v-2.04l-4.5 4.5 1.5 1.5 4.5-4.5V11.5l-1.5 1.5 1.77 1.77L22.5 12l-1.77-1.77zM12 13.96l-2.73 2.73L7.5 18l4.5 4.5 4.5-4.5-1.77-1.77L12 18.96l-2.73-2.73-1.5 1.5L12 21.54l4.23-4.23-1.5-1.5L12 13.96z"/>
						</svg>
					</div>
					<div>
						<div class="flex items-center gap-2 flex-wrap">
							<h1 class="text-4xl font-black tracking-tight">
								<span class="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">Binance</span>
							</h1>
							<span class="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
								SPOT MARKETS
							</span>
							<span class="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1 text-xs text-amber-400">
								<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span>LIVE
							</span>
						</div>
						<p class="mt-1.5 text-xs text-amber-400/40">
							{tickers.length} USDT pairs · Updated {getTimeAgo(lastUpdated)}
						</p>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#each CATEGORIES.slice(0, 5) as cat}
					<button onclick={() => { selectedCategory = cat.key; searchQuery = ''; }}
						class="group relative overflow-hidden rounded-xl border px-3 py-2 text-xs font-bold transition-all
						{selectedCategory === cat.key && !searchQuery
							? 'border-amber-400/50 bg-amber-400/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
							: 'border-white/10 bg-white/5 text-slate-400 hover:border-amber-400/30 hover:bg-white/10 hover:text-white'}">
						<span class="relative z-10 flex items-center gap-1.5">
							<span>{cat.emoji}</span>{cat.label}
						</span>
						{#if selectedCategory === cat.key && !searchQuery}
							<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
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
				<button onclick={fetchTickers} class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20">↻ Retry</button>
			</div>
		{:else}
			<!-- ── Stats Bar ── -->
			<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each statCards as s (s.key)}
					<div class="group relative min-w-0 overflow-hidden rounded-2xl border {s.hi ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/5 bg-white/[0.02]'} p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10 backdrop-blur-sm">
						<div class="absolute right-0 top-0 h-20 w-20 rounded-full bg-amber-400/5 blur-2xl group-hover:bg-amber-400/10 transition-all pointer-events-none"></div>
						<div class="flex justify-between items-start mb-2">
							<p class="text-[10px] uppercase tracking-widest text-slate-500">{s.icon} {s.label}</p>
							<span class="rounded-full bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold text-amber-400">{s.trend}</span>
						</div>
						<div class="min-h-[3.25rem] min-w-0">
							<p
								class="text-2xl font-extrabold leading-tight [overflow-wrap:anywhere] {s.hi ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'text-white'}"
								title={s.value}>{s.value}</p>
							{#if s.sub}
								<p class="mt-0.5 text-xs font-bold [overflow-wrap:anywhere] {s.subClass}" title={s.sub}>{s.sub}</p>
							{/if}
						</div>
						<div class="mt-3 h-7 flex items-end gap-0.5">
							{#each sparklineData as height, idx (idx)}
								<div class="flex-1 bg-gradient-to-t from-amber-400/10 to-amber-400/30 rounded-t transition-all" style="height: {height}%"></div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- ── Featured Cards ── -->
			{#if featured.length && !searchQuery}
				<div class="mb-8">
					<div class="mb-4 flex items-center gap-2">
						<span class="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"></span>
						<p class="text-[11px] font-black uppercase tracking-[0.3em] text-amber-400/60">Featured Pairs</p>
					</div>
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{#each featured as coin, i (coin.sym)}
							{@const t = coin.t}
							{@const change = parseFloat(t.priceChangePercent)}
							{@const isPositive = change >= 0}
							{@const spark = sparkSvg(coin.spark, coin.color)}
							{@const coinColor = yellowColors[i % yellowColors.length]}
							<div
								class="group relative overflow-hidden rounded-2xl border {coinColor.border} bg-white/[0.015] p-4 text-left backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.035] hover:{coinColor.glow} cursor-pointer"
								style="animation:slideUp 0.6s cubic-bezier(.22,1,.36,1) {i * 50}ms both"
								onclick={() => copyToClipboard(t.lastPrice, coin.sym)}
								role="button" tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && copyToClipboard(t.lastPrice, coin.sym)}>
								
								<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full {coinColor.bg} blur-2xl opacity-0 transition-opacity group-hover:opacity-100"></div>
								
								<div class="relative z-10">
									<div class="mb-3 flex items-start justify-between">
										<div
											class="flex h-10 min-h-10 min-w-[2.75rem] max-w-[4.25rem] shrink-0 items-center justify-center rounded-xl border {coinColor.border} {coinColor.bg} px-1.5 transition-all duration-300 group-hover:scale-110"
											title="{baseSymbol(coin.sym)}/USDT">
											<span class="truncate text-center text-[9px] font-black leading-tight tracking-tight {coinColor.text}">{symbolBadge(baseSymbol(coin.sym), 6)}</span>
										</div>
										<div class="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold backdrop-blur-sm transition-colors {isPositive?'bg-green-400/15 text-green-400 border border-green-400/20':'bg-red-400/15 text-red-400 border border-red-400/20'}">
											<span class="text-[8px]">{isPositive?'▲':'▼'}</span>
											<span>{Math.abs(change).toFixed(2)}%</span>
										</div>
									</div>

									<p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">{baseSymbol(coin.sym)}</p>
									<button
										onclick={(e) => { e.stopPropagation(); copyToClipboard(t.lastPrice, coin.sym); }}
										class="relative text-xl font-black tracking-tight transition-all duration-300 cursor-pointer text-white group-hover:{coinColor.text} group-hover:scale-105 origin-left"
										class:text-green-400={flashStates[coin.sym]==='up'}
										class:text-red-400={flashStates[coin.sym]==='down'}
									>
										${fmt(t.lastPrice)}
										{#if flashStates[coin.sym + '_copied']}
											<span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-green-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
										{/if}
									</button>

									<svg viewBox="0 0 80 32" class="mt-2 h-6 w-full opacity-50 transition-opacity duration-300 group-hover:opacity-100" preserveAspectRatio="none">
										<defs>
											<linearGradient id="g-{coin.sym}" x1="0" y1="0" x2="0" y2="1">
												<stop offset="0%" stop-color={isPositive?'#4ade80':'#f87171'} stop-opacity="0.6"/>
												<stop offset="100%" stop-color={isPositive?'#4ade80':'#f87171'} stop-opacity="0"/>
											</linearGradient>
										</defs>
										<path d={spark.area} fill="url(#g-{coin.sym})"/>
										<path d={spark.line} fill="none" stroke={isPositive?'#4ade80':'#f87171'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>

									<p class="mt-2 text-[10px] text-slate-500 font-medium">Vol {fmtVol(t.quoteVolume)}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- ── Controls ── -->
			<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap items-center gap-2">
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
						</svg>
						<input bind:this={searchInputRef} bind:value={searchQuery}
							placeholder="Search pairs... (/)"
							class="w-44 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-9 text-sm text-white placeholder-slate-600 outline-none backdrop-blur-sm transition-all focus:w-56 focus:border-amber-400/30 focus:bg-white/[0.04] font-mono" />
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
					<select bind:value={sortBy} class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-bold text-slate-400 outline-none backdrop-blur-sm transition-all hover:border-amber-400/20 cursor-pointer font-mono">
						{#each SORT_OPTIONS as opt}
							<option value={opt.key}>{opt.label}</option>
						{/each}
					</select>

					<div class="flex gap-0.5 rounded-xl border border-white/10 bg-white/[0.02] p-1 backdrop-blur-sm">
						<button onclick={() => view = 'grid'}
							class="rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition
							{view === 'grid' ? 'bg-amber-400/20 text-amber-400' : 'text-slate-500 hover:text-white'}">⊞</button>
						<button onclick={() => view = 'list'}
							class="rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition
							{view === 'list' ? 'bg-amber-400/20 text-amber-400' : 'text-slate-500 hover:text-white'}">☰</button>
					</div>

					<button onclick={() => showMobileFilters = !showMobileFilters} class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-bold text-slate-400 sm:hidden">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
						</svg>
					</button>

					<button onclick={fetchTickers} disabled={loading}
						class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] font-black text-slate-500 backdrop-blur-sm transition hover:border-amber-400/20 hover:text-amber-400 disabled:opacity-20 {pulse ? 'text-amber-400' : ''}">
						{loading ? '⟳' : '↻'}
					</button>
				</div>
			</div>

			<!-- ── Skeleton ── -->
			{#if loading && !tickers.length}
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
								{searchQuery ? 'Results' : CATEGORIES.find(c => c.key === selectedCategory)?.label ?? 'All'} Pairs
							</p>
							<span class="rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">{filtered.length}</span>
						</div>
						<p class="text-[9px] text-slate-600">click to copy price</p>
					</div>

					{#if view === 'grid'}
						<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
							{#each filtered.slice(0, 60) as t, i (t.symbol)}
								{@const coinColor = yellowColors[i % yellowColors.length]}
								{@const change = parseFloat(t.priceChangePercent)}
								{@const isPositive = change >= 0}
								<div class="group relative overflow-hidden rounded-xl border {coinColor.border} bg-white/[0.015] p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.035] hover:{coinColor.glow}"
									style="animation:fadeIn 0.3s ease {Math.min(i * 10, 400)}ms both">
									<div class="flex items-center gap-2.5">
										<div
											class="flex h-8 min-w-[2.25rem] max-w-[3.25rem] shrink-0 items-center justify-center rounded-lg border {coinColor.border} {coinColor.bg} px-1 transition-transform group-hover:scale-110"
											title="{baseSymbol(t.symbol)}/USDT">
											<span class="truncate text-center text-[8px] font-black leading-none {coinColor.text}">{symbolBadge(baseSymbol(t.symbol), 5)}</span>
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center justify-between">
												<p class="truncate text-[11px] font-bold text-white">{baseSymbol(t.symbol)}</p>
												<span class="text-[9px] font-bold {isPositive ? 'text-green-400' : 'text-red-400'}">{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
											</div>
											<button
												onclick={() => copyToClipboard(t.lastPrice, t.symbol)}
												class="relative truncate text-sm font-black transition-all cursor-pointer hover:scale-105 text-white group-hover:{coinColor.text}"
												class:text-green-400={flashStates[t.symbol] === 'up'}
												class:text-red-400={flashStates[t.symbol] === 'down'}
											>
												${fmt(t.lastPrice)}
												{#if flashStates[t.symbol + '_copied']}
													<span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
												{/if}
											</button>
											<p class="text-[8px] text-slate-500">{fmtVol(t.quoteVolume)}</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01] backdrop-blur-sm">
							<div class="grid grid-cols-[3rem_1fr_9rem_9rem_8rem] items-center gap-2 border-b border-white/[0.04] px-5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 font-mono">
								<span>#</span>
								<span>Pair</span>
								<span class="text-right">Price</span>
								<span class="text-right">24h Change</span>
								<span class="text-right">Volume</span>
							</div>
							{#each filtered.slice(0, 80) as t, i (t.symbol)}
								{@const coinColor = yellowColors[i % yellowColors.length]}
								{@const change = parseFloat(t.priceChangePercent)}
								{@const isPositive = change >= 0}
								<div class="group grid grid-cols-[3rem_1fr_9rem_9rem_8rem] items-center gap-2 border-b border-white/[0.015] px-5 py-3 transition-colors last:border-0 hover:bg-white/[0.02]"
									style="animation:slideRight 0.2s ease {Math.min(i * 8, 400)}ms both">
									<span class="text-[10px] font-black text-slate-600">{i + 1}</span>
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 min-w-[2.25rem] max-w-[3.5rem] shrink-0 items-center justify-center rounded-lg border {coinColor.border} {coinColor.bg} px-1"
											title="{baseSymbol(t.symbol)}/USDT">
											<span class="truncate text-center text-[8px] font-black leading-none {coinColor.text}">{symbolBadge(baseSymbol(t.symbol), 5)}</span>
										</div>
										<div class="min-w-0">
											<p class="text-xs font-bold text-white">{baseSymbol(t.symbol)}</p>
											<p class="text-[9px] text-slate-600">/USDT</p>
										</div>
									</div>
									<button
										onclick={() => copyToClipboard(t.lastPrice, t.symbol)}
										class="relative text-right text-sm font-black cursor-pointer hover:scale-105 transition-transform text-white"
										class:text-green-400={flashStates[t.symbol] === 'up'}
										class:text-red-400={flashStates[t.symbol] === 'down'}
									>
										${fmt(t.lastPrice)}
										{#if flashStates[t.symbol + '_copied']}
											<span class="absolute -top-5 right-0 text-[8px] font-bold text-green-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
										{/if}
									</button>
									<p class="text-right text-sm font-black {isPositive ? 'text-green-400' : 'text-red-400'}">{isPositive ? '+' : ''}{change.toFixed(2)}%</p>
									<p class="text-right text-[10px] text-slate-500">{fmtVol(t.quoteVolume)}</p>
								</div>
							{/each}
						</div>
					{/if}

					{#if filtered.length > 80}
						<p class="mt-4 text-center text-[10px] text-slate-600">Showing 80 of {filtered.length} pairs</p>
					{/if}
				</div>
			{:else if !loading && !error}
				<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-20 text-center backdrop-blur-sm">
					<p class="mb-3 text-5xl opacity-30">∅</p>
					<p class="text-sm font-black text-slate-500">No pairs found</p>
					<p class="mt-1 text-xs text-slate-700">Try a different search or category</p>
				</div>
			{/if}

			<!-- ── Footer ── -->
			<div class="mt-14 border-t border-white/[0.03] pt-6">
				<div class="flex flex-wrap items-center justify-between gap-4">
					<div class="flex items-center gap-3">
						<div class="relative">
							<div class="h-2 w-2 rounded-full bg-amber-400"></div>
							<div class="absolute inset-0 animate-ping rounded-full bg-amber-400/50"></div>
						</div>
						<p class="text-[9px] text-slate-500 font-mono">
							Binance API · {tickers.length} USDT pairs · 60s refresh
						</p>
					</div>
					<div class="flex gap-5">
						{#each ['Binance API', 'Status', 'Docs'] as link}
							<span class="cursor-pointer text-[9px] text-slate-600 transition hover:text-amber-400">{link}</span>
						{/each}
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

	<div class="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-amber-400/20 bg-[#040d14] p-6"
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
						     ? 'border-amber-400/50 bg-amber-400/20 text-amber-400'
						     : 'border-white/10 bg-white/5 text-slate-400'}">
						<span>{cat.emoji}</span>
						<span>{cat.label}</span>
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

		<button onclick={() => showMobileFilters = false} class="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-bold text-amber-400 transition hover:bg-amber-400/20">
			Show {filtered.length} Pairs
		</button>
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
</style>
