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

onMount(() => {
fetchTickers();
const iv = setInterval(fetchTickers, 60_000);
return () => clearInterval(iv);
});
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:head><title>Binance | JamCat</title></svelte:head>

<div class="overflow-hidden border-b border-white/5 bg-[#F0B90B]/10 py-2 backdrop-blur-xl">
<div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
{#each [TICKER_TEXT, TICKER_TEXT, TICKER_TEXT] as t}
<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#F0B90B">{t}</span>
{/each}
</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-[#060810]">
<div class="pointer-events-none fixed inset-0" onmousemove={handleMouseMove}>
<div class="absolute left-[-20%] top-[-10%] h-[700px] w-[700px] rounded-full opacity-[0.07] blur-[140px] transition-transform duration-[3s]"
 style="background:radial-gradient(circle,#F0B90B,transparent 70%);transform:translate({mouseX * 2}px,{mouseY * 2}px)"></div>
<div class="absolute right-[-15%] bottom-[-20%] h-[600px] w-[600px] rounded-full opacity-[0.04] blur-[120px] transition-transform duration-[3s]"
 style="background:radial-gradient(circle,#7c5c00,transparent 70%);transform:translate({-mouseX}px,{-mouseY}px)"></div>
{#each Array(6) as _, i}
<div class="absolute h-1 w-1 rounded-full bg-white/10"
 style="left:{15 + i * 14}%;top:{20 + (i * 17) % 60}%;animation:float {4 + i}s ease-in-out infinite;animation-delay:{i * 0.7}s"></div>
{/each}
<div class="absolute inset-0 opacity-[0.02]"
 style="background-image:linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px);background-size:80px 80px"></div>
</div>

<div class="relative mx-auto max-w-7xl px-5 py-10 sm:px-8">

<!-- Header -->
<div class="mb-10 text-center">
<div class="mb-5 inline-flex items-center gap-4">
<div class="relative">
<div class="flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl shadow-[#F0B90B]/30"
 style="background:linear-gradient(135deg,#F0B90B,#d4a017)">
<!-- Binance logo diamond -->
<svg class="h-8 w-8" viewBox="0 0 24 24" fill="white">
<path d="M12 1.5L7.5 6l1.77 1.77L12 5.04l2.73 2.73L16.5 6 12 1.5zm4.5 4.5l-1.77 1.77L12 10.54 9.27 7.77 7.5 9.54 12 14.04l4.5-4.5-1.5-3.54zM1.5 12l1.77 1.77L6 11.04v1.92l4.5 4.5 1.5-1.5L7.5 11.5v-2.04L1.5 12zm19.23-1.77L19.04 9.46 18 11.04v-2.04l-4.5 4.5 1.5 1.5 4.5-4.5V11.5l-1.5 1.5 1.77 1.77L22.5 12l-1.77-1.77zM12 13.96l-2.73 2.73L7.5 18l4.5 4.5 4.5-4.5-1.77-1.77L12 18.96l-2.73-2.73-1.5 1.5L12 21.54l4.23-4.23-1.5-1.5L12 13.96z"/>
</svg>
</div>
<div class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 {pulse ? 'scale-150' : ''} transition-transform">
<div class="absolute inset-0 animate-ping rounded-full bg-emerald-400/40"></div>
</div>
</div>
<div class="text-left">
<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl" style="text-shadow:0 0 80px rgba(240,185,11,0.3)">Binance</h1>
<p class="text-[11px] uppercase tracking-[0.3em]" style="color:#F0B90B99">Spot Markets · Live</p>
</div>
</div>

<div class="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-6 py-3 backdrop-blur-sm">
<div class="flex items-center gap-2">
<div class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
<span class="text-[10px] font-bold text-white/30">LIVE</span>
</div>
<div class="h-3 w-px bg-white/10"></div>
<span class="text-[10px] font-bold text-white/40">
<span class="font-black text-white/70">{tickers.length}</span> USDT pairs
</span>
<div class="h-3 w-px bg-white/10"></div>
<span class="text-[10px] text-white/20 flex items-center gap-1">
{#if lastUpdated}
{#if Math.floor((Date.now() - lastUpdated.getTime()) / 1000) < 60}
<span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
{/if}
{getTimeAgo(lastUpdated)}
{:else}
loading…
{/if}
</span>
</div>
</div>

<!-- Controls -->
<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
<div class="flex flex-wrap items-center gap-2">
<div class="relative">
<svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
</svg>
<input bind:this={searchInputRef} bind:value={searchQuery}
placeholder="Search pairs... (/)"
class="w-44 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 pl-10 pr-9 text-sm text-white placeholder-white/25 outline-none backdrop-blur-sm transition-all focus:w-56 focus:border-[#F0B90B]/30 focus:bg-white/[0.04]" />
{#if searchQuery}
<button onclick={() => searchQuery = ''} class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
</svg>
</button>
{/if}
</div>

<div class="flex flex-wrap gap-1.5">
{#each CATEGORIES.slice(0, 5) as cat}
<button onclick={() => { selectedCategory = cat.key; searchQuery = ''; }}
class="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-all
{selectedCategory === cat.key && !searchQuery
? 'border-[#F0B90B]/40 bg-[#F0B90B]/15 text-[#F0B90B] shadow-md'
: 'border-white/[0.04] bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60'}">
<span class="text-xs">{cat.emoji}</span>
<span>{cat.label}</span>
</button>
{/each}
</div>
</div>

<div class="flex items-center gap-2">
<select bind:value={sortBy} class="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-bold text-white/60 outline-none backdrop-blur-sm transition-all hover:border-white/10 cursor-pointer">
{#each SORT_OPTIONS as opt}
<option value={opt.key}>{opt.label}</option>
{/each}
</select>

<div class="flex gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-sm">
<button onclick={() => view = 'grid'}
class="rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition
{view === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}">⊞</button>
<button onclick={() => view = 'list'}
class="rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition
{view === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}">☰</button>
</div>

<button onclick={() => showMobileFilters = !showMobileFilters} class="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-bold text-white/60 sm:hidden">
<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
</svg>
</button>

<button onclick={fetchTickers} disabled={loading}
class="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-black text-white/40 backdrop-blur-sm transition hover:border-[#F0B90B]/20 hover:text-white/70 disabled:opacity-20 {pulse ? 'text-[#F0B90B]' : ''}">
{loading ? '⟳' : '↻'}
</button>
</div>
</div>

<!-- Error -->
{#if error}
<div class="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-8 text-center backdrop-blur-sm">
<p class="mb-2 text-4xl">⚡</p>
<p class="text-sm font-black text-red-400">Connection Interrupted</p>
<p class="mt-1 text-xs text-white/30">{error}</p>
<button onclick={fetchTickers}
class="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-6 py-2.5 text-xs font-black text-red-300 transition hover:bg-red-400/20">
Try Again
</button>
</div>
{/if}

<!-- Featured Cards -->
{#if featured.length && !searchQuery}
<div class="mb-8">
<div class="mb-3 flex items-center justify-between">
<p class="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">Featured Pairs</p>
<span class="text-[9px] text-white/20">24h change · click to copy</span>
</div>
<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
{#each featured as coin, i (coin.sym)}
{@const t = coin.t}
{@const change = parseFloat(t.priceChangePercent)}
{@const isPositive = change >= 0}
{@const spark = sparkSvg(coin.spark, coin.color)}
<div
class="group relative overflow-hidden rounded-xl border border-white/[0.05] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 text-left backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 cursor-pointer"
style="animation:slideUp 0.5s cubic-bezier(.22,1,.36,1) {i * 40}ms both"
onmouseenter={() => hoveredCard = coin.sym}
onmouseleave={() => hoveredCard = null}
onclick={() => copyToClipboard(t.lastPrice, coin.sym)}
role="button" tabindex="0"
onkeydown={(e) => e.key === 'Enter' && copyToClipboard(t.lastPrice, coin.sym)}>

<div class="absolute -top-20 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
 style="background:{coin.color}"></div>

<div class="relative">
<div class="mb-3 flex items-start justify-between">
<div class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
 style="background:linear-gradient(135deg,{coin.color},{coin.color}aa);box-shadow:0 4px 16px {coin.color}40">
{baseSymbol(coin.sym).slice(0,1)}
</div>
<div class="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold {isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}">
<span>{isPositive ? '↑' : '↓'}</span>
<span>{Math.abs(change).toFixed(2)}%</span>
</div>
</div>

<p class="text-[10px] font-bold uppercase tracking-wider text-white/30">{baseSymbol(coin.sym)}</p>
<button
onclick={(e) => { e.stopPropagation(); copyToClipboard(t.lastPrice, coin.sym); }}
class="relative text-xl font-black tracking-tight transition-all cursor-pointer hover:scale-105 active:scale-95"
class:text-emerald-400={flashStates[coin.sym] === 'up'}
class:text-red-400={flashStates[coin.sym] === 'down'}
class:text-white={!flashStates[coin.sym]}
>
${fmt(t.lastPrice)}
{#if flashStates[coin.sym + '_copied']}
<span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
{/if}
</button>

<svg viewBox="0 0 80 32" class="mt-2 h-7 w-full opacity-50 transition-opacity group-hover:opacity-80" preserveAspectRatio="none">
<defs>
<linearGradient id="g-{coin.sym}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color={isPositive ? '#10b981' : '#ef4444'} stop-opacity="0.4"/>
<stop offset="100%" stop-color={isPositive ? '#10b981' : '#ef4444'} stop-opacity="0"/>
</linearGradient>
</defs>
<path d={spark.area} fill="url(#g-{coin.sym})"/>
<path d={spark.line} fill="none" stroke={isPositive ? '#10b981' : '#ef4444'} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

<p class="mt-1 text-[9px] text-white/20">Vol {fmtVol(t.quoteVolume)}</p>
</div>
</div>
{/each}
</div>
</div>
{/if}

<!-- Skeleton -->
{#if loading && !tickers.length}
<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
{#each Array(12) as _, i}
<div class="h-36 animate-pulse rounded-2xl bg-white/[0.02]" style="animation-delay:{i * 50}ms"></div>
{/each}
</div>
{/if}

<!-- All Pairs -->
{#if filtered.length}
<div class="mb-6">
<div class="mb-4 flex items-center justify-between">
<div class="flex items-center gap-3">
<p class="text-[10px] font-black uppercase tracking-[0.3em] text-white/15">
{searchQuery ? 'Results' : CATEGORIES.find(c => c.key === selectedCategory)?.label ?? 'All'} Pairs
</p>
<span class="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-white/20">{filtered.length}</span>
</div>
<p class="text-[9px] text-white/10">click to copy price</p>
</div>

{#if view === 'grid'}
<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
{#each filtered.slice(0, 60) as t, i (t.symbol)}
{@const color = coinColor(t.symbol)}
{@const change = parseFloat(t.priceChangePercent)}
{@const isPositive = change >= 0}
<div class="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.10] hover:bg-white/[0.04] hover:-translate-y-0.5"
 style="animation:fadeIn 0.3s ease {Math.min(i * 10, 400)}ms both">
<div class="flex items-center gap-2.5">
<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black transition-transform group-hover:scale-110"
 style="background:{color}20;color:{color}">
{baseSymbol(t.symbol).slice(0,2)}
</div>
<div class="min-w-0 flex-1">
<div class="flex items-center justify-between">
<p class="truncate text-[11px] font-bold text-white/70">{baseSymbol(t.symbol)}</p>
<span class="text-[9px] font-bold {isPositive ? 'text-emerald-400' : 'text-red-400'}">{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
</div>
<button
onclick={() => copyToClipboard(t.lastPrice, t.symbol)}
class="relative truncate text-sm font-black transition-all cursor-pointer hover:scale-105 active:scale-95"
class:text-emerald-400={flashStates[t.symbol] === 'up'}
class:text-red-400={flashStates[t.symbol] === 'down'}
class:text-white={!flashStates[t.symbol]}
>
${fmt(t.lastPrice)}
{#if flashStates[t.symbol + '_copied']}
<span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-emerald-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
{/if}
</button>
<p class="text-[8px] text-white/15">{fmtVol(t.quoteVolume)}</p>
</div>
</div>
<div class="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-300 group-hover:w-full"
 style="background:linear-gradient(to right,{isPositive ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'},transparent)"></div>
</div>
{/each}
</div>
{:else}
<div class="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01] backdrop-blur-sm">
<div class="grid grid-cols-[3rem_1fr_9rem_9rem_8rem] items-center gap-2 border-b border-white/[0.04] px-5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-white/12">
<span>#</span>
<span>Pair</span>
<span class="text-right">Price</span>
<span class="text-right">24h Change</span>
<span class="text-right">Volume</span>
</div>
{#each filtered.slice(0, 80) as t, i (t.symbol)}
{@const color = coinColor(t.symbol)}
{@const change = parseFloat(t.priceChangePercent)}
{@const isPositive = change >= 0}
<div class="group grid grid-cols-[3rem_1fr_9rem_9rem_8rem] items-center gap-2 border-b border-white/[0.015] px-5 py-3 transition-colors last:border-0 hover:bg-white/[0.015]"
 style="animation:slideRight 0.2s ease {Math.min(i * 8, 400)}ms both">
<span class="text-[10px] font-black text-white/10">{i + 1}</span>
<div class="flex items-center gap-3">
<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black"
 style="background:{color}12;color:{color}">
{baseSymbol(t.symbol).slice(0,3)}
</div>
<div class="min-w-0">
<p class="text-xs font-bold text-white/60">{baseSymbol(t.symbol)}</p>
<p class="text-[9px] text-white/15">/USDT</p>
</div>
</div>
<button
onclick={() => copyToClipboard(t.lastPrice, t.symbol)}
class="relative text-right text-sm font-black cursor-pointer hover:scale-105 active:scale-95 transition-transform"
class:text-emerald-400={flashStates[t.symbol] === 'up'}
class:text-red-400={flashStates[t.symbol] === 'down'}
class:text-white={!flashStates[t.symbol]}
>
${fmt(t.lastPrice)}
{#if flashStates[t.symbol + '_copied']}
<span class="absolute -top-5 right-0 text-[8px] font-bold text-emerald-400 whitespace-nowrap" in:fade={{ duration: 150 }}>Copied!</span>
{/if}
</button>
<p class="text-right text-sm font-black {isPositive ? 'text-emerald-400' : 'text-red-400'}">{isPositive ? '+' : ''}{change.toFixed(2)}%</p>
<p class="text-right text-[10px] text-white/30">{fmtVol(t.quoteVolume)}</p>
</div>
{/each}
</div>
{/if}

{#if filtered.length > 80}
<p class="mt-4 text-center text-[10px] text-white/10">Showing 80 of {filtered.length} pairs</p>
{/if}
</div>
{:else if !loading && !error}
<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-20 text-center backdrop-blur-sm">
<p class="mb-3 text-5xl opacity-30">∅</p>
<p class="text-sm font-black text-white/30">No pairs found</p>
<p class="mt-1 text-xs text-white/12">Try a different search or category</p>
</div>
{/if}

<!-- Footer -->
<div class="mt-14 border-t border-white/[0.03] pt-6">
<div class="flex flex-wrap items-center justify-between gap-4">
<div class="flex items-center gap-3">
<div class="relative">
<div class="h-2 w-2 rounded-full" style="background:#F0B90B99"></div>
<div class="absolute inset-0 animate-ping rounded-full" style="background:#F0B90B33"></div>
</div>
<p class="text-[9px] text-white/12">
Binance API · {tickers.length} USDT pairs · 60s refresh
</p>
</div>
<div class="flex gap-5">
{#each ['Binance API', 'Status', 'Docs'] as link}
<span class="cursor-pointer text-[9px] text-white/10 transition hover:text-white/25">{link}</span>
{/each}
</div>
</div>
</div>

</div>
</div>

<!-- Mobile Filters -->
{#if showMobileFilters}
<button onclick={() => showMobileFilters = false}
class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
in:fade={{ duration: 200 }} aria-label="Close filters"></button>

<div class="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#0a0f1c] p-6"
 in:fly={{ y: 100, duration: 300 }}>
<div class="mb-4 flex items-center justify-between">
<h3 class="text-lg font-bold text-white">Filters</h3>
<button onclick={() => showMobileFilters = false} class="rounded-full bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white">
<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
</svg>
</button>
</div>

<div class="mb-4">
<p class="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">Categories</p>
<div class="flex flex-wrap gap-2">
{#each CATEGORIES as cat}
<button onclick={() => { selectedCategory = cat.key; searchQuery = ''; }}
class="flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition-all
   {selectedCategory === cat.key && !searchQuery
     ? 'border-[#F0B90B]/50 bg-[#F0B90B]/20 text-[#F0B90B]'
     : 'border-white/10 bg-white/5 text-white/60'}">
<span>{cat.emoji}</span>
<span>{cat.label}</span>
</button>
{/each}
</div>
</div>

<div class="mb-6">
<p class="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">Sort By</p>
<select bind:value={sortBy} class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none">
{#each SORT_OPTIONS as opt}
<option value={opt.key}>{opt.label}</option>
{/each}
</select>
</div>

<button onclick={() => showMobileFilters = false} class="w-full rounded-xl py-3 text-sm font-bold text-white transition" style="background:#F0B90B">
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
