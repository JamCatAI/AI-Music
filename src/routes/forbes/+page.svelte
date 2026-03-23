<script>
import { onMount } from 'svelte';
import { fly, fade, scale } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

let price = $state(0.000080);
let change24h = $state(0.83);
let jamAmount = $state(1);
let mouseX = $state(0);
let mouseY = $state(0);
let pulse = $state(false);
let chartPeriod = $state('24H');
let showAlertModal = $state(false);
let alertPrice = $state('');
let copiedField = $state(null);

const PERIODS = ['24H', '7D', '30D', '1Y', 'Max'];

const TOKEN_INFO = {
  name: 'Jam Cat',
  symbol: 'JAM',
  network: 'Solana',
  contract: '51zudBR4Nm-ATG35goida4dLQH5YPn9k8hvkLcizNpump',
  decimals: 9,
  totalSupply: 1_000_000_000,
  circulatingSupply: 850_000_000,
  volume24h: 15000,
  holders: 2847,
  launched: '2024-03-15',
  website: 'https://jamcat-ai.vercel.app/',
  blockExplorer: 'https://solscan.io/token/51zudBR4Nm-ATG35goida4dLQH5YPn9k8hvkLcizNpump',
  social: [
    { name: 'X / Twitter', url: 'https://x.com/JamCatCTO', icon: '🐦' },
    { name: 'Telegram', url: 'https://t.me/JamCatOnSolana', icon: '💬' },
    { name: 'Instagram', url: 'https://instagram.com/JamCatCTO', icon: '📸' },
    { name: 'TikTok', url: 'https://tiktok.com/@Jam.Cat.CTO', icon: '🎵' }
  ]
};

function handleMouseMove(e) {
  const rect = e.currentTarget?.getBoundingClientRect();
  if (!rect) return;
  mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
  mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
}

function fmtPrice(n) {
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

function fmtNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(0);
}

function fmtCurrency(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
  return '$' + n.toFixed(2);
}

function generateSparkline(period) {
  const points = [];
  let val = price * 0.95;
  const count = period === '24H' ? 24 : period === '7D' ? 28 : period === '30D' ? 30 : 52;
  const volatility = period === '24H' ? 0.015 : period === '7D' ? 0.025 : 0.04;
  
  for (let i = 0; i < count; i++) {
    val = val * (1 + (Math.random() - 0.48) * volatility);
    points.push(val);
  }
  points[points.length - 1] = price;
  return points;
}

let sparkline = $state(generateSparkline('24H'));

function getChartPath(points) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 50;
  return points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

let chartPath = $derived(getChartPath(sparkline));
let chartArea = $derived(chartPath + ' L100,50 L0,50 Z');

let usdValue = $derived(jamAmount * price);
let marketCap = $derived(price * TOKEN_INFO.circulatingSupply);

function changePeriod(period) {
  chartPeriod = period;
  sparkline = generateSparkline(period);
  pulse = true;
  setTimeout(() => pulse = false, 400);
}

function copyToClipboard(text, field) {
  navigator.clipboard.writeText(text);
  copiedField = field;
  setTimeout(() => copiedField = null, 1500);
}

function setAlert() {
  showAlertModal = false;
  alertPrice = '';
}

onMount(() => {
  const iv = setInterval(() => {
    price = price * (1 + (Math.random() - 0.5) * 0.005);
    change24h = change24h + (Math.random() - 0.5) * 0.3;
    sparkline = generateSparkline(chartPeriod);
    pulse = true;
    setTimeout(() => pulse = false, 300);
  }, 30000);
  return () => clearInterval(iv);
});
</script>

<svelte:head><title>Forbes | JamCat</title></svelte:head>

<div class="overflow-hidden border-b border-white/5 bg-red-600/10 py-2 backdrop-blur-xl">
  <div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
    {#each ['🔴 FORBES · DIGITAL ASSETS · JAM CAT TOKEN · $JAM · SOLANA MEME COIN · CRYPTO MARKETS · ', '🔴 FORBES · DIGITAL ASSETS · JAM CAT TOKEN · $JAM · SOLANA MEME COIN · CRYPTO MARKETS · ', '🔴 FORBES · DIGITAL ASSETS · JAM CAT TOKEN · $JAM · SOLANA MEME COIN · CRYPTO MARKETS · '] as t}
      <span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#dc2626">{t}</span>
    {/each}
  </div>
</div>

<div class="relative min-h-screen overflow-hidden bg-[#0a0a0a]" onmousemove={handleMouseMove}>
  <!-- Enhanced background -->
  <div class="pointer-events-none fixed inset-0">
    <div class="absolute left-[-20%] top-[-10%] h-[700px] w-[700px] rounded-full opacity-[0.08] blur-[140px] transition-transform duration-[3s]"
      style="background:radial-gradient(circle,#dc2626,transparent 70%);transform:translate({mouseX * 2}px,{mouseY * 2}px)"></div>
    <div class="absolute right-[-15%] bottom-[-20%] h-[600px] w-[600px] rounded-full opacity-[0.06] blur-[120px] transition-transform duration-[3s]"
      style="background:radial-gradient(circle,#991b1b,transparent 70%);transform:translate({-mouseX}px,{-mouseY}px)"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-[0.04] blur-[100px]"
      style="background:radial-gradient(circle,#dc2626,transparent 70%)"></div>
    {#each Array(8) as _, i}
      <div class="absolute h-1 w-1 rounded-full bg-white/10"
        style="left:{10+i*11}%;top:{15+(i*23)%70}%;animation:float {4+i*0.5}s ease-in-out infinite;animation-delay:{i*0.8}s"></div>
    {/each}
    <div class="absolute inset-0 opacity-[0.02]"
      style="background-image:linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px);background-size:80px 80px"></div>
  </div>

  <div class="relative mx-auto max-w-6xl px-5 py-10 sm:px-8">
    
    <!-- Enhanced Header -->
    <div class="mb-8 text-center">
      <div class="mb-5 inline-flex items-center gap-4">
        <div class="relative">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-2xl"
            style="box-shadow:0 8px 32px rgba(220,38,38,0.4),0 0 60px rgba(220,38,38,0.2)">
            <span class="text-4xl">😺</span>
          </div>
          <div class="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-emerald-400 {pulse ? 'scale-150' : ''} transition-transform">
            <div class="absolute inset-0 animate-ping rounded-full bg-emerald-400/40"></div>
          </div>
        </div>
        <div class="text-left">
          <h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl" 
            style="text-shadow:0 0 80px rgba(220,38,38,0.3)">Forbes</h1>
          <p class="text-[11px] uppercase tracking-[0.3em] text-red-500/60">Digital Assets</p>
        </div>
      </div>
    </div>

    <!-- Token Stats Bar -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
        <p class="text-[10px] font-bold uppercase tracking-wider text-white/30">Market Cap</p>
        <p class="text-lg font-black text-white mt-1">{fmtCurrency(marketCap)}</p>
      </div>
      <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
        <p class="text-[10px] font-bold uppercase tracking-wider text-white/30">24h Volume</p>
        <p class="text-lg font-black text-white mt-1">{fmtCurrency(TOKEN_INFO.volume24h)}</p>
      </div>
      <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
        <p class="text-[10px] font-bold uppercase tracking-wider text-white/30">Holders</p>
        <p class="text-lg font-black text-white mt-1">{fmtNumber(TOKEN_INFO.holders)}</p>
      </div>
      <div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
        <p class="text-[10px] font-bold uppercase tracking-wider text-white/30">Circulating</p>
        <p class="text-lg font-black text-white mt-1">{fmtNumber(TOKEN_INFO.circulatingSupply)}</p>
      </div>
    </div>

    <!-- Main Card -->
    <div class="mb-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-md"
      style="box-shadow:0 4px 24px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.05)">
      <div class="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <h2 class="text-3xl font-light text-white md:text-4xl">jam cat</h2>
            <span class="rounded-lg bg-white/[0.06] border border-white/[0.06] px-2.5 py-1 text-sm font-bold text-white/60">JAM</span>
            <span class="rounded-lg bg-red-500/15 border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-400/80">SOL</span>
          </div>
          <p class="mb-4 text-sm text-white/40">Price, Charts & Market Data</p>
          
          <div class="mb-5 flex items-baseline gap-3">
            <span class="text-4xl font-light text-white md:text-5xl transition-colors" class:text-emerald-400={change24h>=0} class:text-red-400={change24h<0}>${fmtPrice(price)}</span>
            <span class="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold {change24h >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}">
              <span>{change24h >= 0 ? '↑' : '↓'}</span>
              <span>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%</span>
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button 
              onclick={() => showAlertModal = true}
              class="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/60 transition-all hover:border-red-500/30 hover:bg-red-500/5 hover:text-white/80">
              <svg class="h-4 w-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              Price Alert
            </button>
            <button class="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/60 transition-all hover:border-red-500/30 hover:bg-red-500/5 hover:text-white/80">
              <svg class="h-4 w-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Watchlist
            </button>
            <div class="flex items-center gap-2">
              {#each TOKEN_INFO.social.slice(0, 2) as social}
                <a href={social.url} target="_blank" class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] text-white/40 transition-all hover:bg-white/[0.08] hover:text-white/70">
                  <span class="text-lg">{social.icon}</span>
                </a>
              {/each}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center">
          <div class="relative h-44 w-44 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 md:h-52 md:w-52 group">
            <img src="/profile-pics/jamcat1.png" alt="Jam Cat" class="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm"
      style="box-shadow:0 4px 24px rgba(0,0,0,0.15)">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-sm font-bold text-white/70">Price Chart</h3>
        <div class="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
          {#each PERIODS as period}
            <button 
              onclick={() => changePeriod(period)}
              class="rounded-md px-3 py-1.5 text-[11px] font-bold transition-all
                {chartPeriod === period 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'}"
            >
              {period}
            </button>
          {/each}
        </div>
      </div>

      <div class="h-56 w-full">
        <svg viewBox="0 0 100 50" class="h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#dc2626" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#dc2626" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d={chartArea} fill="url(#chartGrad)"/>
          <path d={chartPath} fill="none" stroke="#dc2626" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"
            style="filter: drop-shadow(0 0 4px rgba(220,38,38,0.5));"/>
          <!-- Price points -->
          {#each sparkline.filter((_,i) => i % 4 === 0) as point, i}
            {@const x = (i * 4 / (sparkline.length - 1)) * 100}
            {@const min = Math.min(...sparkline)}
            {@const max = Math.max(...sparkline)}
            {@const y = 50 - ((point - min) / (max - min || 1)) * 50}
            <circle cx={x} cy={y} r="0.8" fill="#dc2626" opacity="0.6"/>
          {/each}
        </svg>
      </div>
      
      <div class="mt-4 flex items-center justify-between text-[11px] text-white/30">
        <span>Low: ${fmtPrice(Math.min(...sparkline))}</span>
        <span>Price Range</span>
        <span>High: ${fmtPrice(Math.max(...sparkline))}</span>
      </div>
    </div>

    <!-- Calculator & Token Info -->
    <div class="grid gap-6 md:grid-cols-[1.5fr_1fr]">
      <!-- Calculator -->
      <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <h3 class="mb-4 text-sm font-bold text-white/70 flex items-center gap-2">
          <span class="text-lg">🧮</span>
          JAM to USD Converter
        </h3>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="flex-1 rounded-xl border border-white/[0.08] bg-black/20 p-4 transition-all focus-within:border-red-500/30">
            <div class="mb-1 flex items-center gap-2">
              <span class="text-lg">😺</span>
              <span class="text-xs font-bold text-white/40">JAM</span>
            </div>
            <input 
              type="number" 
              bind:value={jamAmount} 
              class="w-full bg-transparent text-2xl font-light text-white outline-none"
              min="0"
              step="0.1"
            />
          </div>
          
          <div class="flex items-center justify-center text-white/30">
            <svg class="h-6 w-6 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          </div>

          <div class="flex-1 rounded-xl border border-white/[0.08] bg-black/20 p-4">
            <div class="mb-1 flex items-center gap-2">
              <span class="text-lg">🇺🇸</span>
              <span class="text-xs font-bold text-white/40">USD</span>
            </div>
            <div class="text-2xl font-light text-white/80">${usdValue.toFixed(8)}</div>
          </div>
        </div>
      </div>

      <!-- Token Info -->
      <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <h3 class="mb-4 text-sm font-bold text-white/70 flex items-center gap-2">
          <span class="text-lg">📋</span>
          Token Info
        </h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span class="text-xs text-white/40">Network</span>
            <span class="text-xs font-bold text-white/70">{TOKEN_INFO.network}</span>
          </div>
          <div class="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span class="text-xs text-white/40">Contract</span>
            <button 
              onclick={() => copyToClipboard(TOKEN_INFO.contract, 'contract')}
              class="flex items-center gap-1.5 text-xs text-red-400/70 transition hover:text-red-400"
            >
              <span>{TOKEN_INFO.contract.slice(0, 12)}...</span>
              {#if copiedField === 'contract'}
                <span class="text-emerald-400" in:fade={{duration:150}}>✓</span>
              {:else}
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              {/if}
            </button>
          </div>
          <div class="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span class="text-xs text-white/40">Decimals</span>
            <span class="text-xs font-bold text-white/70">{TOKEN_INFO.decimals}</span>
          </div>
          <div class="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span class="text-xs text-white/40">Total Supply</span>
            <span class="text-xs font-bold text-white/70">{fmtNumber(TOKEN_INFO.totalSupply)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-white/40">Launch Date</span>
            <span class="text-xs font-bold text-white/70">{TOKEN_INFO.launched}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resources Grid -->
    <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each TOKEN_INFO.social as social}
        <a href={social.url} target="_blank" 
          class="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-red-500/20 hover:bg-white/[0.04]">
          <span class="text-2xl transition-transform group-hover:scale-110">{social.icon}</span>
          <div>
            <p class="text-xs font-bold text-white/60">{social.name}</p>
            <p class="text-[10px] text-white/30">Official</p>
          </div>
        </a>
      {/each}
    </div>

    <!-- Enhanced Footer -->
    <div class="mt-10 border-t border-white/[0.06] pt-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="h-2 w-2 rounded-full animate-pulse" style="background:#dc262699"></div>
            <div class="absolute inset-0 animate-ping rounded-full" style="background:#dc262633"></div>
          </div>
          <p class="text-[10px] text-white/20">
            Forbes Digital Assets · Data updates every 30s · SOL network
          </p>
        </div>
        <div class="flex items-center gap-4">
          <a href={TOKEN_INFO.blockExplorer} target="_blank" class="text-[10px] text-white/15 transition hover:text-red-400">View on Solscan</a>
          <a href={TOKEN_INFO.website} target="_blank" class="text-[10px] text-white/15 transition hover:text-red-400">Official Website</a>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- Price Alert Modal -->
{#if showAlertModal}
  <button 
    class="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
    onclick={() => showAlertModal = false}
    in:fade={{duration:200}}
    aria-label="Close modal"></button>
  
  <div 
    class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a0a]/95 backdrop-blur-2xl p-6"
    in:scale={{start:0.9, duration:300, easing:cubicOut}}>
    
    <div class="mb-5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white">Price Alert</h3>
          <p class="text-xs text-white/40">Get notified when JAM hits your target</p>
        </div>
      </div>
      <button onclick={() => showAlertModal = false} class="rounded-full p-2 text-white/30 hover:bg-white/[0.05] hover:text-white/60">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <div class="mb-5">
      <label class="mb-2 block text-xs font-bold text-white/40 uppercase tracking-wider">Target Price (USD)</label>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
        <input 
          type="number" 
          bind:value={alertPrice}
          placeholder="0.000100"
          class="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-8 pr-4 text-white outline-none transition-all focus:border-red-500/40 focus:bg-white/[0.05]"
          step="0.000001"
        />
      </div>
    </div>
    
    <div class="mb-6 flex gap-2">
      {#each [0.000100, 0.000150, 0.000200, 0.000500] as target}
        <button 
          onclick={() => alertPrice = target.toFixed(6)}
          class="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-xs font-semibold text-white/50 transition-all hover:border-red-500/30 hover:bg-red-500/5 hover:text-white/70"
        >
          ${target.toFixed(6)}
        </button>
      {/each}
    </div>
    
    <div class="flex gap-3">
      <button 
        onclick={() => showAlertModal = false}
        class="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-xs font-bold text-white/60 transition hover:bg-white/[0.05]">
        Cancel
      </button>
      <button 
        onclick={setAlert}
        class="flex-1 rounded-xl bg-red-600 py-3 text-xs font-black text-white transition hover:bg-red-500"
        style="box-shadow:0 4px 20px rgba(220,38,38,0.3)">
        Set Alert
      </button>
    </div>
  </div>
{/if}

<style>
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-33.33%); }
}
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
  50% { transform: translateY(-20px) scale(1.5); opacity: 0.4; }
}
</style>
