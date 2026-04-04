<script>
import { onMount } from 'svelte';
import { fade, fly, scale } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

let markets = $state([]);
let loading = $state(true);
let error = $state(null);
let lastUpdated = $state(null);
let pulse = $state(false);
let searchQuery = $state('');
let sortBy = $state('volume');
let view = $state('grid');
let selectedCategory = $state('all');
let showMobileFilters = $state(false);
let mouseX = $state(0);
let mouseY = $state(0);
let flashStates = $state({});
let searchInputRef = $state(null);
let atOICap = $state(new Set());

// New state for market detail modal
let selectedMarket = $state(null);
let showMarketModal = $state(false);
let depthData = $state({ bids: [], asks: [] });

const CATEGORIES = [
  { key: 'all',      label: 'All',      emoji: '🌐' },
  { key: 'top',      label: 'Top 20',   emoji: '⭐', filter: 'top' },
  { key: 'gainers',  label: '🔥 Gainers', emoji: '📈', filter: 'gainers' },
  { key: 'losers',   label: '❄️ Losers',  emoji: '📉', filter: 'losers' },
  { key: 'funding+', label: 'High Fund', emoji: '💸', filter: 'funding+' },
  { key: 'oicap',    label: 'OI Cap',   emoji: '🔒', filter: 'oicap' },
];

const SORT_OPTIONS = [
  { key: 'volume',      label: '📊 Volume: High → Low' },
  { key: 'oi',          label: '📐 Open Interest' },
  { key: 'price-desc',  label: 'Price: High → Low' },
  { key: 'price-asc',   label: 'Price: Low → High' },
  { key: 'change-desc', label: '24h: Gainers First' },
  { key: 'change-asc',  label: '24h: Losers First' },
  { key: 'funding',     label: '💸 Funding Rate' },
  { key: 'name',        label: 'Name A-Z' },
];

const COIN_COLORS = {
  BTC:'#F7931A', ETH:'#627EEA', SOL:'#9945FF', DOGE:'#C3A634',
  XRP:'#00AAE4', ADA:'#0033AD', AVAX:'#E84142', DOT:'#E6007A',
  LINK:'#2A5ADA', MATIC:'#8247E5', UNI:'#FF007A', ATOM:'#2E3148',
  ARB:'#28A0F0', OP:'#FF0420', NEAR:'#00C08B', APT:'#22D1EE',
  SUI:'#4DA2FF', BNB:'#F0B90B', PEPE:'#4B9E4B', WIF:'#9CA3AF',
  BONK:'#FF6B35', TIA:'#7C3AED', INJ:'#00B5D8', SEI:'#B843E1',
  DEFAULT:'#00E5BE',
};

function coinColor(name) { return COIN_COLORS[name] ?? COIN_COLORS.DEFAULT; }

function fmt(n, decimals) {
  const v = parseFloat(n);
  if (isNaN(v) || v === 0) return '—';
  if (decimals != null) return v.toFixed(decimals);
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1)   return v.toFixed(4);
  if (v >= 0.0001) return v.toFixed(6);
  return v.toExponential(2);
}

function fmtVol(n) {
  const v = parseFloat(n);
  if (isNaN(v) || v === 0) return '—';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
}

function fmtFunding(r) {
  const v = parseFloat(r);
  if (isNaN(v)) return '—';
  const pct = (v * 100).toFixed(4);
  return (v >= 0 ? '+' : '') + pct + '%';
}

function fmtOI(oi, price) {
  const v = parseFloat(oi) * parseFloat(price);
  if (isNaN(v) || v === 0) return '—';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  return '$' + (v / 1e3).toFixed(1) + 'K';
}

function fakeSparkline(seed, isPositive = true) {
  let s = seed.charCodeAt(0) + (seed.charCodeAt(1) || 0);
  const pts = [];
  const baseTrend = isPositive ? 1 : -1;
  for (let i = 0; i < 30; i++) {
    s = (s * 16807 + 7) % 2147483647;
    const noise = (s % 40) - 20;
    const trend = baseTrend * (i / 30) * 15;
    pts.push(40 + noise + trend);
  }
  return pts;
}

function sparkSvg(pts, isPositive) {
  const w = 100, h = 32;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const d = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return { line: d, area: d + ` L${w},${h} L0,${h} Z` };
}

// Generate funding history data (7 days hourly)
function generateFundingHistory(marketName) {
  let s = marketName.charCodeAt(0);
  const history = [];
  for (let i = 0; i < 168; i++) {
    s = (s * 16807 + 7) % 2147483647;
    history.push((s % 1000 - 500) / 50000);
  }
  return history;
}

// Generate orderbook depth data
function generateDepthData(market) {
  const price = market.markPx;
  const bids = [];
  const asks = [];
  for (let i = 0; i < 20; i++) {
    const bidPrice = price * (1 - (i * 0.001));
    const askPrice = price * (1 + (i * 0.001));
    const bidSize = Math.max(0.1, (20 - i) * (1 + Math.random()));
    const askSize = Math.max(0.1, (20 - i) * (1 + Math.random()));
    bids.push({ price: bidPrice, size: bidSize });
    asks.push({ price: askPrice, size: askSize });
  }
  return { bids: bids.reverse(), asks };
}

// Funding chart SVG path
function fundingChartPath(history) {
  const w = 280, h = 60;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  return history.map((v, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
}

// Depth chart paths
function depthChartPaths(depthData) {
  const w = 140, h = 80;
  const maxSize = Math.max(
    ...depthData.bids.map(b => b.size),
    ...depthData.asks.map(a => a.size)
  );
  const bidPath = depthData.bids.map((b, i) => {
    const x = (i / (depthData.bids.length - 1)) * (w / 2);
    const y = h - (b.size / maxSize) * h;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const askPath = depthData.asks.map((a, i) => {
    const x = (w / 2) + (i / (depthData.asks.length - 1)) * (w / 2);
    const y = h - (a.size / maxSize) * h;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  return { bids: bidPath, asks: askPath };
}

async function hlPost(body) {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hyperliquid ${res.status}`);
  return res.json();
}

async function fetchMarkets() {
  loading = true; error = null;
  try {
    const [data, capData] = await Promise.all([
      hlPost({ type: 'metaAndAssetCtxs' }),
      hlPost({ type: 'perpsAtOpenInterestCap' }).catch(() => []),
    ]);

    atOICap = new Set(capData);

    const [meta, ctxs] = data;
    const prev = Object.fromEntries(markets.map(m => [m.name, m.markPx]));

    markets = meta.universe.map((asset, i) => {
      const ctx = ctxs[i] ?? {};
      const markPx = parseFloat(ctx.markPx ?? ctx.midPx ?? 0);
      const prevDayPx = parseFloat(ctx.prevDayPx ?? markPx);
      const change24h = prevDayPx ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0;

      if (prev[asset.name] && prev[asset.name] !== markPx) {
        flashStates[asset.name] = markPx > prev[asset.name] ? 'up' : 'down';
        setTimeout(() => { flashStates[asset.name] = null; }, 1000);
      }

      return {
        name: asset.name,
        maxLeverage: asset.maxLeverage,
        markPx,
        prevDayPx,
        change24h,
        funding: ctx.funding ?? '0',
        openInterest: ctx.openInterest ?? '0',
        volume24h: parseFloat(ctx.dayNtlVlm ?? 0),
        spark: fakeSparkline(asset.name, change24h >= 0),
        fundingHistory: generateFundingHistory(asset.name),
      };
    }).filter(m => m.markPx > 0);

    lastUpdated = new Date();
    pulse = true;
    setTimeout(() => pulse = false, 600);
  } catch (e) {
    error = e.message;
  } finally {
    loading = false;
  }
}

function copyToClipboard(text, name) {
  navigator.clipboard.writeText(text);
  flashStates[name + '_copied'] = true;
  setTimeout(() => { flashStates[name + '_copied'] = null; }, 1500);
}

function openMarketDetail(market) {
  selectedMarket = market;
  depthData = generateDepthData(market);
  showMarketModal = true;
}

function closeMarketModal() {
  showMarketModal = false;
  setTimeout(() => selectedMarket = null, 200);
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
  if (e.key === 'Escape' && showMarketModal) {
    closeMarketModal();
  }
}

function handleMouseMove(e) {
  const rect = e.currentTarget?.getBoundingClientRect();
  if (!rect) return;
  mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
  mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
}

function getTimeAgo(date) {
  if (!date) return '';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

let totalVolume = $derived(markets.reduce((s, m) => s + m.volume24h, 0));
let totalOI = $derived(markets.reduce((s, m) => s + parseFloat(m.openInterest) * m.markPx, 0));

let topMarkets = $derived(
  [...markets].sort((a, b) => b.volume24h - a.volume24h).slice(0, 18)
);

let filtered = $derived.by(() => {
  let result = [...markets];

  if (searchQuery) {
    result = result.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  } else {
    switch (selectedCategory) {
      case 'top':      result = result.sort((a,b) => b.volume24h - a.volume24h).slice(0, 20); break;
      case 'gainers':  result = result.filter(m => m.change24h > 0); break;
      case 'losers':   result = result.filter(m => m.change24h < 0); break;
      case 'funding+': result = result.filter(m => Math.abs(parseFloat(m.funding)) > 0.0001); break;
      case 'oicap':    result = result.filter(m => atOICap.has(m.name)); break;
    }
  }

  switch (sortBy) {
    case 'volume':      result.sort((a,b) => b.volume24h - a.volume24h); break;
    case 'oi':          result.sort((a,b) => parseFloat(b.openInterest)*b.markPx - parseFloat(a.openInterest)*a.markPx); break;
    case 'price-desc':  result.sort((a,b) => b.markPx - a.markPx); break;
    case 'price-asc':   result.sort((a,b) => a.markPx - b.markPx); break;
    case 'change-desc': result.sort((a,b) => b.change24h - a.change24h); break;
    case 'change-asc':  result.sort((a,b) => a.change24h - b.change24h); break;
    case 'funding':     result.sort((a,b) => Math.abs(parseFloat(b.funding)) - Math.abs(parseFloat(a.funding))); break;
    case 'name':        result.sort((a,b) => a.name.localeCompare(b.name)); break;
  }
  return result;
});

const TICKER_TEXT = '🟢 HYPERLIQUID · PERPS · BTC · ETH · SOL · LIVE FUNDING RATES · OPEN INTEREST · MARK PRICES · DECENTRALIZED PERPS · ON-CHAIN · ';

onMount(() => {
  fetchMarkets();
  const iv = setInterval(fetchMarkets, 5000);
  return () => clearInterval(iv);
});
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:head><title>Hyperliquid | JamCat</title></svelte:head>

<!-- Ticker -->
<div class="overflow-hidden border-b border-white/5 bg-gradient-to-r from-[#00E5BE]/10 via-[#00E5BE]/5 to-transparent py-2.5 backdrop-blur-xl">
  <div class="flex whitespace-nowrap" style="animation:marquee 30s linear infinite">
    {#each [TICKER_TEXT, TICKER_TEXT] as t}
      <span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#00E5BE">{t}</span>
    {/each}
  </div>
</div>

<div class="relative min-h-screen overflow-hidden bg-[#04080f]">
  <!-- Enhanced background glows -->
  <div class="pointer-events-none fixed inset-0" aria-hidden="true">
    <div class="absolute left-[-20%] top-[-10%] h-[700px] w-[700px] rounded-full opacity-[0.08] blur-[140px] transition-transform duration-[3s]"
      style="background:radial-gradient(circle,#00E5BE,transparent 70%);transform:translate({mouseX * 2}px,{mouseY * 2}px)"></div>
    <div class="absolute right-[-15%] bottom-[-20%] h-[600px] w-[600px] rounded-full opacity-[0.06] blur-[120px] transition-transform duration-[3s]"
      style="background:radial-gradient(circle,#7c3aed,transparent 70%);transform:translate({-mouseX}px,{-mouseY}px)"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-[0.03] blur-[100px]"
      style="background:radial-gradient(circle,#00E5BE,transparent 70%)"></div>
    {#each Array(8) as _, i}
      <div class="absolute h-1 w-1 rounded-full bg-white/15"
        style="left:{10+i*11}%;top:{15+(i*23)%70}%;animation:float {4+i*0.5}s ease-in-out infinite;animation-delay:{i*0.8}s"></div>
    {/each}
    <div class="absolute inset-0 opacity-[0.02]"
      style="background-image:linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px);background-size:80px 80px"></div>
  </div>

  <div class="relative mx-auto max-w-7xl px-5 py-12 sm:px-8">

    <!-- Enhanced Header -->
    <div class="mb-12 text-center">
      <div class="mb-6 inline-flex items-center gap-5">
        <div class="relative group">
          <div class="flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
            style="background:linear-gradient(135deg,#00E5BE,#00b89a);box-shadow:0 8px 40px #00E5BE50,0 0 80px #00E5BE30,0 0 120px #00E5BE15">
            <!-- HL logo -->
            <svg class="h-11 w-11" viewBox="0 0 32 32" fill="none">
              <path d="M6 6h4v8h12V6h4v20h-4v-8H10v8H6V6z" fill="white"/>
            </svg>
          </div>
          <div class="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#04080f] {pulse ? 'scale-125' : ''} transition-transform duration-300">
            <div class="absolute inset-0 animate-ping rounded-full bg-emerald-400/50"></div>
          </div>
          <!-- Glow ring -->
          <div class="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#00E5BE] to-emerald-400 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"></div>
        </div>
        <div class="text-left">
          <h1 class="text-5xl font-black tracking-tighter text-white sm:text-6xl lg:text-7xl"
            style="text-shadow:0 0 60px rgba(0,229,190,0.4),0 0 120px rgba(0,229,190,0.2)">Hyperliquid</h1>
          <p class="text-[12px] uppercase tracking-[0.4em] mt-2" style="color:#00E5BE99">Perpetuals · Live · On-Chain</p>
        </div>
      </div>

      <!-- Enhanced Stats bar -->
      <div class="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-8 py-5 backdrop-blur-xl"
        style="box-shadow:0 8px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.06),0 0 40px rgba(0,229,190,0.05)">
        <div class="flex items-center gap-2.5">
          <div class="relative">
            <div class="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <div class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40"></div>
          </div>
          <span class="text-[11px] font-bold text-white/50">LIVE</span>
        </div>
        <div class="h-5 w-px bg-white/10"></div>
        <span class="text-[11px] font-bold text-white/50">
          <span class="font-black text-white">{markets.length}</span> markets
        </span>
        <div class="h-5 w-px bg-white/10"></div>
        <span class="text-[11px] font-bold text-white/50">
          Vol <span class="font-black text-white">{fmtVol(totalVolume)}</span>
        </span>
        <div class="h-5 w-px bg-white/10"></div>
        <span class="text-[11px] font-bold text-white/50">
          OI <span class="font-black text-white">{fmtVol(totalOI)}</span>
        </span>
        <div class="h-5 w-px bg-white/10"></div>
        <span class="text-[11px] text-white/40 flex items-center gap-2">
          {#if lastUpdated}
            {#if Math.floor((Date.now() - lastUpdated.getTime()) / 1000) < 10}
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {/if}
            {getTimeAgo(lastUpdated)}
          {:else}
            loading…
          {/if}
        </span>
      </div>
    </div>

    <!-- Enhanced Controls -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative group">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 transition-colors group-focus-within:text-[#00E5BE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input bind:this={searchInputRef} bind:value={searchQuery}
            placeholder="Search markets... (/)"
            class="w-48 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-9 text-sm text-white placeholder-white/30 outline-none backdrop-blur-sm transition-all focus:w-60 focus:border-[#00E5BE]/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,229,190,0.1)]" />
          {#if searchQuery}
            <button onclick={() => searchQuery = ''} class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors" aria-label="Clear search">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          {/if}
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each CATEGORIES as cat}
            <button onclick={() => { selectedCategory = cat.key; searchQuery = ''; }}
              class="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold transition-all duration-200
              {selectedCategory === cat.key && !searchQuery
                ? 'border-[#00E5BE]/50 bg-gradient-to-b from-[#00E5BE]/15 to-[#00E5BE]/5 text-[#00E5BE] shadow-[0_0_15px_rgba(0,229,190,0.15)]'
                : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:border-white/15 hover:text-white/70 hover:bg-white/[0.05]'}">
              <span class="text-xs">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <select bind:value={sortBy} class="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[11px] font-bold text-white/70 outline-none backdrop-blur-sm cursor-pointer hover:border-white/15 hover:bg-white/[0.05] transition-all">
          {#each SORT_OPTIONS as opt}
            <option value={opt.key}>{opt.label}</option>
          {/each}
        </select>
        <div class="flex gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          <button onclick={() => view = 'grid'}
            class="rounded-lg px-3 py-2 text-[10px] font-bold transition-all {view==='grid'?'bg-white/15 text-white shadow-sm':'text-white/40 hover:text-white/70'}">⊞</button>
          <button onclick={() => view = 'list'}
            class="rounded-lg px-3 py-2 text-[10px] font-bold transition-all {view==='list'?'bg-white/15 text-white shadow-sm':'text-white/40 hover:text-white/70'}">☰</button>
        </div>
        <button onclick={() => showMobileFilters = !showMobileFilters} class="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[11px] font-bold text-white/60 sm:hidden hover:bg-white/[0.05]" aria-label="Toggle filters">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
        </button>
        <button onclick={fetchMarkets} disabled={loading}
          class="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[11px] font-black text-white/50 backdrop-blur-sm transition-all disabled:opacity-30 hover:border-[#00E5BE]/30 hover:text-[#00E5BE] hover:bg-[#00E5BE]/5 {pulse?'text-[#00E5BE] bg-[#00E5BE]/10':''}">
          {loading ? '⟳' : '↻'}
        </button>
      </div>
    </div>

    <!-- Error -->
    {#if error}
      <div class="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-8 text-center backdrop-blur-sm"
        style="box-shadow:0 4px 24px rgba(239,68,68,0.1)">
        <p class="mb-2 text-4xl">⚡</p>
        <p class="text-sm font-black text-red-400">Connection Failed</p>
        <p class="mt-1 text-xs text-white/30">{error}</p>
        <button onclick={fetchMarkets} class="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-6 py-2.5 text-xs font-black text-red-300 transition-all hover:bg-red-400/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          Try Again
        </button>
      </div>
    {/if}

        <!-- Enhanced Featured top markets -->
    {#if topMarkets.length && !searchQuery && selectedCategory === 'all'}
      <div class="mb-12">
        <div class="mb-5 flex items-center justify-between">
          <p class="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-[#00E5BE] shadow-[0_0_10px_#00E5BE]"></span>
            Top Markets by Volume
          </p>
          <span class="text-[10px] text-white/30">Click cards for detailed view</span>
        </div>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {#each topMarkets.slice(0, 12) as m, i (m.name)}
            {@const color = coinColor(m.name)}
            {@const isPositive = m.change24h >= 0}
            {@const spark = sparkSvg(m.spark, isPositive)}
            {@const fundingVal = parseFloat(m.funding)}
            <div
              class="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 cursor-pointer backdrop-blur-md transition-all duration-500 hover:border-[#00E5BE]/40 hover:shadow-[0_12px_40px_rgba(0,229,190,0.2)] hover:-translate-y-2"
              style="animation:slideUp 0.6s cubic-bezier(.22,1,.36,1) {i*50}ms both"
              role="button" tabindex="0"
              onclick={() => openMarketDetail(m)}
              onkeydown={(e) => e.key==='Enter' && openMarketDetail(m)}>

              <!-- Top gradient glow -->
              <div class="absolute -top-24 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full opacity-0 blur-3xl transition-all duration-700 group-hover:opacity-60 group-hover:scale-150"
                style="background:{color}"></div>

              <!-- Animated border glow -->
              <div class="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style="background:linear-gradient(135deg,{color}20,transparent 50%);"></div>

              <!-- Shimmer effect -->
              <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 transition-transform duration-1000 group-hover:translate-x-full"></div>

              <div class="relative">
                <div class="mb-4 flex items-start justify-between">
                  <div class="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
                    style="background:linear-gradient(135deg,{color},{color}88);box-shadow:0 4px 24px {color}60">
                    {m.name.slice(0,1)}
                  </div>
                  <div class="flex flex-col items-end gap-1.5">
                    <div class="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm transition-colors {isPositive?'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20':'bg-red-500/15 text-red-400 border border-red-500/20'}">
                      <span class="text-[8px]">{isPositive?'▲':'▼'}</span>
                      <span>{Math.abs(m.change24h).toFixed(2)}%</span>
                    </div>
                    <span class="text-[9px] font-semibold {fundingVal >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}">{fmtFunding(m.funding)}/h</span>
                  </div>
                </div>

                <p class="text-[11px] font-bold uppercase tracking-wider text-white/50">{m.name}-PERP</p>
                <p class="relative text-2xl font-black tracking-tight text-white transition-all duration-300 group-hover:text-[#00E5BE] group-hover:scale-105 origin-left"
                  class:text-emerald-400={flashStates[m.name]==='up'}
                  class:text-red-400={flashStates[m.name]==='down'}>
                  ${fmt(m.markPx)}
                </p>

                <!-- Enhanced sparkline with glow -->
                <svg viewBox="0 0 100 32" class="mt-3 h-8 w-full opacity-50 transition-opacity duration-300 group-hover:opacity-100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="hl-g-{m.name}" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color={isPositive?'#10b981':'#ef4444'} stop-opacity="0.6"/>
                      <stop offset="100%" stop-color={isPositive?'#10b981':'#ef4444'} stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d={spark.area} fill="url(#hl-g-{m.name})"/>
                  <path d={spark.line} fill="none" stroke={isPositive?'#10b981':'#ef4444'} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    style="filter: drop-shadow(0 0 3px {isPositive?'#10b981':'#ef4444'});"/>
                </svg>

                <div class="mt-3 flex items-center justify-between">
                  <p class="text-[10px] text-white/40 font-medium">Vol {fmtVol(m.volume24h)}</p>
                  <p class="text-[10px] text-white/40 font-medium">{m.maxLeverage}x</p>
                </div>
              </div>

              <!-- Bottom progress bar -->
              <div class="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#00E5BE] to-emerald-400 transition-all duration-500 group-hover:w-full"></div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Skeleton -->
    {#if loading && !markets.length}
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-8">
        {#each Array(12) as _, i}
          <div class="h-40 animate-pulse rounded-2xl bg-white/[0.03] border border-white/[0.04]" style="animation-delay:{i*50}ms"></div>
        {/each}
      </div>
    {/if}

    <!-- All Markets -->
    {#if filtered.length}
      <div class="mb-6">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-white/15">
              {searchQuery ? 'Results' : CATEGORIES.find(c=>c.key===selectedCategory)?.label ?? 'All'} Markets
            </p>
            <span class="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-white/20">{filtered.length}</span>
          </div>
          <p class="text-[9px] text-white/10">click price to copy</p>
        </div>

        {#if view === 'grid'}
          <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {#each filtered.slice(0, 60) as m, i (m.name)}
              {@const color = coinColor(m.name)}
              {@const isPositive = m.change24h >= 0}
              {@const fundingVal = parseFloat(m.funding)}
              {@const spark = sparkSvg(m.spark.slice(0, 20), isPositive)}
              <div class="group relative overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.03] p-3 backdrop-blur-sm transition-all duration-200 hover:border-[#00E5BE]/20 hover:bg-white/[0.05] hover:-translate-y-0.5 cursor-pointer"
                style="animation:fadeIn 0.3s ease {Math.min(i*10,400)}ms both"
                role="button" tabindex="0"
                aria-label="Open {m.name} market details"
                onclick={() => openMarketDetail(m)}
                onkeydown={(e) => e.key === 'Enter' && openMarketDetail(m)}>
                <div class="flex items-center gap-2.5">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-all group-hover:scale-110"
                    style="background:{color}20;color:{color}">
                    {m.name.slice(0,2)}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <p class="truncate text-[11px] font-bold text-white/80">{m.name}</p>
                      <span class="text-[9px] font-bold {isPositive?'text-emerald-400':'text-red-400'}">{isPositive?'+':''}{m.change24h.toFixed(2)}%</span>
                    </div>
                    <p class="relative truncate text-sm font-black text-white/90">
                      ${fmt(m.markPx)}
                    </p>
                    <div class="mt-1 flex items-center justify-between">
                      <p class="text-[8px] {fundingVal >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}">{fmtFunding(m.funding)}/h</p>
                      <svg viewBox="0 0 60 16" class="h-3 w-12 opacity-40" preserveAspectRatio="none">
                        <path d={spark.line} fill="none" stroke={isPositive?'#10b981':'#ef4444'} stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                {#if atOICap.has(m.name)}
                  <div class="absolute right-2 top-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[7px] font-bold text-amber-400">OI CAP</div>
                {/if}
                <div class="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#00E5BE] to-transparent transition-all duration-300 group-hover:w-full"></div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- Enhanced List view -->
          <div class="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
            style="box-shadow:0 4px 24px rgba(0,0,0,0.2)">
            <div class="grid grid-cols-[3rem_1fr_9rem_8rem_9rem_8rem] items-center gap-2 border-b border-white/[0.06] px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 bg-white/[0.02]">
              <span>#</span>
              <span>Market</span>
              <span class="text-right">Mark Price</span>
              <span class="text-right">24h Change</span>
              <span class="text-right">Volume 24h</span>
              <span class="text-right">Funding/h</span>
            </div>
            {#each filtered.slice(0, 80) as m, i (m.name)}
              {@const color = coinColor(m.name)}
              {@const isPositive = m.change24h >= 0}
              {@const fundingVal = parseFloat(m.funding)}
              <div class="group grid grid-cols-[3rem_1fr_9rem_8rem_9rem_8rem] items-center gap-2 border-b border-white/[0.03] px-5 py-3.5 transition-all cursor-pointer hover:bg-white/[0.04] last:border-0"
                style="animation:slideRight 0.2s ease {Math.min(i*8,400)}ms both"
                role="button" tabindex="0"
                aria-label="Open {m.name} market details"
                onclick={() => openMarketDetail(m)}
                onkeydown={(e) => e.key === 'Enter' && openMarketDetail(m)}>
                <span class="text-[10px] font-black text-white/20">{i+1}</span>
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black"
                    style="background:{color}15;color:{color}">
                    {m.name.slice(0,3)}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <p class="text-xs font-bold text-white/70">{m.name}-PERP</p>
                      {#if atOICap.has(m.name)}
                        <span class="rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[7px] font-bold text-amber-400">OI CAP</span>
                      {/if}
                    </div>
                    <p class="text-[9px] text-white/30">max {m.maxLeverage}x · OI {fmtOI(m.openInterest, m.markPx)}</p>
                  </div>
                </div>
                <p class="text-right text-sm font-black text-white/90 group-hover:text-[#00E5BE] transition-colors">${fmt(m.markPx)}</p>
                <p class="text-right text-sm font-bold {isPositive?'text-emerald-400':'text-red-400'}">{isPositive?'+':''}{m.change24h.toFixed(2)}%</p>
                <p class="text-right text-[11px] font-bold text-white/50">{fmtVol(m.volume24h)}</p>
                <p class="text-right text-[11px] font-bold {fundingVal>=0?'text-emerald-400/80':'text-red-400/80'}">{fmtFunding(m.funding)}</p>
              </div>
            {/each}
          </div>
        {/if}

        {#if filtered.length > 80}
          <p class="mt-4 text-center text-[10px] text-white/20">Showing 80 of {filtered.length} markets</p>
        {/if}
      </div>
    {:else if !loading && !error}
      <div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-20 text-center backdrop-blur-sm">
        <p class="mb-3 text-5xl opacity-30">∅</p>
        <p class="text-sm font-black text-white/40">No markets found</p>
        <p class="mt-1 text-xs text-white/15">Try a different search or filter</p>
      </div>
    {/if}

    <!-- Enhanced Footer -->
    <div class="mt-14 border-t border-white/[0.06] pt-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="h-2 w-2 rounded-full animate-pulse" style="background:#00E5BE99"></div>
            <div class="absolute inset-0 animate-ping rounded-full" style="background:#00E5BE33"></div>
          </div>
          <p class="text-[9px] text-white/20">
            Hyperliquid API · {markets.length} markets · 5s refresh
          </p>
        </div>
        <div class="flex gap-5">
          {#each ['Hyperliquid', 'Docs', 'Status'] as link}
            <span class="cursor-pointer text-[9px] text-white/15 transition-colors hover:text-[#00E5BE]">{link}</span>
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
    in:fade={{duration:200}} aria-label="Close filters"></button>
  <div class="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#0a0f1c] p-6"
    in:fly={{y:100,duration:300}}>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-bold text-white">Filters</h3>
      <button onclick={() => showMobileFilters = false} class="rounded-full bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close filters">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div class="mb-4">
      <p class="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">Filter</p>
      <div class="flex flex-wrap gap-2">
        {#each CATEGORIES as cat}
          <button onclick={() => { selectedCategory = cat.key; searchQuery = ''; }}
            class="flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition-all
            {selectedCategory===cat.key && !searchQuery
              ? 'border-[#00E5BE]/50 bg-[#00E5BE]/15 text-[#00E5BE]'
              : 'border-white/10 bg-white/5 text-white/60'}">
            <span>{cat.emoji}</span><span>{cat.label}</span>
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
    <button onclick={() => showMobileFilters = false} class="w-full rounded-xl py-3 text-sm font-bold transition-all"
      style="background:#00E5BE;color:#04080f">
      Show {filtered.length} Markets
    </button>
  </div>
{/if}

<!-- Enhanced Market Detail Modal -->
{#if showMarketModal && selectedMarket}
  {@const color = coinColor(selectedMarket.name)}
  {@const isPositive = selectedMarket.change24h >= 0}
  {@const fundingVal = parseFloat(selectedMarket.funding)}
  {@const depthPaths = depthChartPaths(depthData)}
  {@const spark = sparkSvg(selectedMarket.spark, isPositive)}
  {@const fundingAvg = selectedMarket.fundingHistory.reduce((a,b)=>a+b,0)/selectedMarket.fundingHistory.length}
  <button 
    class="fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity"
    onclick={closeMarketModal}
    in:fade={{duration:200}}
    aria-label="Close modal"></button>
  
  <div 
    class="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0a0f1c]/95 backdrop-blur-2xl shadow-2xl shadow-black/80"
    in:scale={{start:0.9, duration:300, easing:cubicOut}}
    out:scale={{start:1, duration:200}}>
    
    <!-- Modal Header -->
    <div class="relative border-b border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent p-6">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg"
            style="background:linear-gradient(135deg,{color},{color}aa);box-shadow:0 4px 20px {color}50">
            {selectedMarket.name.slice(0,1)}
          </div>
          <div>
            <h2 class="text-2xl font-black text-white">{selectedMarket.name}-PERP</h2>
            <p class="text-xs text-white/40 flex items-center gap-2">
              <span class="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Market Data
            </p>
          </div>
        </div>
        <button onclick={closeMarketModal} class="rounded-full bg-white/[0.05] p-2.5 text-white/40 transition-all hover:bg-white/[0.1] hover:text-white" aria-label="Close modal">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Quick Stats Row -->
      <div class="mt-6 grid grid-cols-4 gap-3">
        <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <p class="text-[10px] text-white/30 uppercase tracking-wider">Mark Price</p>
          <p class="text-lg font-black text-white mt-1">${fmt(selectedMarket.markPx)}</p>
        </div>
        <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <p class="text-[10px] text-white/30 uppercase tracking-wider">24h Change</p>
          <p class="text-lg font-black {isPositive?'text-emerald-400':'text-red-400'} mt-1">
            {isPositive?'+':''}{selectedMarket.change24h.toFixed(2)}%
          </p>
        </div>
        <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <p class="text-[10px] text-white/30 uppercase tracking-wider">Volume 24h</p>
          <p class="text-lg font-black text-white/80 mt-1">{fmtVol(selectedMarket.volume24h)}</p>
        </div>
        <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
          <p class="text-[10px] text-white/30 uppercase tracking-wider">Funding/h</p>
          <p class="text-lg font-black {fundingVal>=0?'text-emerald-400':'text-red-400'} mt-1">{fmtFunding(selectedMarket.funding)}</p>
        </div>
      </div>
    </div>
    
    <!-- Modal Body -->
    <div class="p-6 space-y-5">
      
      <!-- Price Chart Section -->
      <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-[11px] font-bold uppercase tracking-wider text-white/40">24h Price Trend</p>
          <div class="flex items-center gap-1.5">
            <span class="h-1.5 w-1.5 rounded-full" style="background:{color}"></span>
            <span class="text-[10px] text-white/30">{selectedMarket.name}</span>
          </div>
        </div>
        <div class="h-24 w-full">
          <svg viewBox="0 0 100 32" class="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="modal-chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color={isPositive?'#10b981':'#ef4444'} stop-opacity="0.6"/>
                <stop offset="100%" stop-color={isPositive?'#10b981':'#ef4444'} stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d={spark.area} fill="url(#modal-chart-grad)"/>
            <path d={spark.line} fill="none" stroke={isPositive?'#10b981':'#ef4444'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              style="filter: drop-shadow(0 0 4px {isPositive?'#10b981':'#ef4444'});"/>
          </svg>
        </div>
      </div>
      
      <!-- Two Column Layout -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Funding History -->
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-[11px] font-bold uppercase tracking-wider text-white/40">7-Day Funding</p>
            <span class="text-[9px] text-white/20">168h avg</span>
          </div>
          <div class="h-16 w-full">
            <svg viewBox="0 0 280 60" class="h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="funding-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color={fundingAvg>=0?'#10b981':'#ef4444'} stop-opacity="0.4"/>
                  <stop offset="100%" stop-color={fundingAvg>=0?'#10b981':'#ef4444'} stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d={fundingChartPath(selectedMarket.fundingHistory) + ' L280,30 L0,30 Z'} fill="url(#funding-grad)"/>
              <path d={fundingChartPath(selectedMarket.fundingHistory)} fill="none" stroke={fundingAvg>=0?'#10b981':'#ef4444'} stroke-width="1.5" stroke-linecap="round"/>
              <line x1="0" y1="30" x2="280" y2="30" stroke="rgba(255,255,255,0.1)" stroke-width="0.5" stroke-dasharray="3,3"/>
            </svg>
          </div>
          <div class="mt-2 flex justify-between text-[9px]">
            <span class="text-white/20">7d ago</span>
            <span class={fundingAvg>=0?'text-emerald-400/70':'text-red-400/70'}>
              avg {fundingAvg>=0?'+':''}{(fundingAvg*100).toFixed(4)}%
            </span>
            <span class="text-white/20">now</span>
          </div>
        </div>
        
        <!-- Orderbook Depth -->
        <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-[11px] font-bold uppercase tracking-wider text-white/40">Depth</p>
            <div class="flex items-center gap-2 text-[9px]">
              <span class="text-emerald-400/70">Bids</span>
              <span class="text-white/20">|</span>
              <span class="text-red-400/70">Asks</span>
            </div>
          </div>
          <div class="h-16 w-full relative">
            <svg viewBox="0 0 140 80" class="h-full w-full" preserveAspectRatio="none">
              <!-- Bids (left side) -->
              <path d={depthPaths.bids} fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
              <path d={depthPaths.bids + ' L0,80 L70,80 Z'} fill="url(#bid-grad)" opacity="0.3"/>
              <!-- Asks (right side) -->
              <path d={depthPaths.asks} fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
              <path d={depthPaths.asks + ' L140,80 L70,80 Z'} fill="url(#ask-grad)" opacity="0.3"/>
              <!-- Center line -->
              <line x1="70" y1="0" x2="70" y2="80" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
              <defs>
                <linearGradient id="bid-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="ask-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ef4444" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="mt-2 flex justify-between text-[9px] text-white/20">
            <span>Spread: ~{(selectedMarket.markPx * 0.002).toFixed(selectedMarket.markPx < 1 ? 4 : 2)}</span>
            <span>{selectedMarket.maxLeverage}x max</span>
          </div>
        </div>
      </div>
      
      <!-- Additional Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p class="text-[9px] text-white/30 uppercase tracking-wider">Open Interest</p>
          <p class="text-sm font-bold text-white/80 mt-1">{fmtOI(selectedMarket.openInterest, selectedMarket.markPx)}</p>
        </div>
        <div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p class="text-[9px] text-white/30 uppercase tracking-wider">Max Leverage</p>
          <p class="text-sm font-bold text-white/80 mt-1">{selectedMarket.maxLeverage}x</p>
        </div>
        <div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p class="text-[9px] text-white/30 uppercase tracking-wider">OI Status</p>
          <p class="text-sm font-bold {atOICap.has(selectedMarket.name)?'text-amber-400':'text-emerald-400'} mt-1">
            {atOICap.has(selectedMarket.name)?'At Cap':'Open'}
          </p>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-3 pt-2">
        <button 
          onclick={() => copyToClipboard(String(selectedMarket.markPx), selectedMarket.name)}
          class="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.05] py-3 text-xs font-bold text-white/70 transition-all hover:bg-white/[0.1] hover:text-white">
          Copy Price
        </button>
        <button 
          onclick={closeMarketModal}
          class="flex-1 rounded-xl py-3 text-xs font-black transition-all"
          style="background:#00E5BE;color:#04080f">
          Close
        </button>
      </div>
    </div>
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
