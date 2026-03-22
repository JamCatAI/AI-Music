<script>
import { onMount } from 'svelte';
import { fly, fade } from 'svelte/transition';

let price = $state(0.000080);
let change24h = $state(0.83);
let jamAmount = $state(1);
let mouseX = $state(0);
let mouseY = $state(0);
let pulse = $state(false);
let chartPeriod = $state('24H');

const PERIODS = ['24H', '7D', '30D', '1Y', 'Max'];

const RESOURCES = {
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

function generateSparkline() {
  const points = [];
  let val = 0.000075;
  for (let i = 0; i < 40; i++) {
    val = val * (1 + (Math.random() - 0.45) * 0.02);
    points.push(val);
  }
  return points;
}

let sparkline = $state(generateSparkline());

function getChartPath(points) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 40;
  return points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

let chartPath = $derived(getChartPath(sparkline));
let chartArea = $derived(chartPath + ' L100,40 L0,40 Z');

let usdValue = $derived(jamAmount * price);

function recalc() {
  pulse = true;
  setTimeout(() => pulse = false, 600);
  sparkline = generateSparkline();
}

onMount(() => {
  recalc();
  const iv = setInterval(() => {
    price = price * (1 + (Math.random() - 0.5) * 0.01);
    change24h = change24h + (Math.random() - 0.5) * 0.5;
    recalc();
  }, 30000);
  return () => clearInterval(iv);
});
</script>

<svelte:head><title>Forbes | JamCat</title></svelte:head>

<div class="overflow-hidden border-b border-white/5 bg-red-600/10 py-2 backdrop-blur-xl">
  <div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
    {#each ['🔴 FORBES · DIGITAL ASSETS · JAM CAT TOKEN · $JAM · SOLANA MEME COIN · CRYPTO MARKETS · ', '🔴 FORBES · DIGITAL ASSETS · JAM CAT TOKEN · $JAM · SOLANA MEME COIN · CRYPTO MARKETS · ', '🔴 FORBES · DIGITAL ASSETS · JAM CAT TOKEN · $JAM · SOLANA MEME COIN · CRYPTO MARKETS · '] as t}
      <span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#991b1b">{t}</span>
    {/each}
  </div>
</div>

<div class="relative min-h-screen overflow-hidden bg-[#0a0a0a]" onmousemove={handleMouseMove}>
  <div class="pointer-events-none fixed inset-0">
    <div class="absolute left-[-20%] top-[-10%] h-[700px] w-[700px] rounded-full opacity-[0.06] blur-[140px] transition-transform duration-[3s]"
      style="background:radial-gradient(circle,#dc2626,transparent 70%);transform:translate({mouseX * 2}px,{mouseY * 2}px)"></div>
    <div class="absolute right-[-15%] bottom-[-20%] h-[600px] w-[600px] rounded-full opacity-[0.04] blur-[120px] transition-transform duration-[3s]"
      style="background:radial-gradient(circle,#7c3aed,transparent 70%);transform:translate({-mouseX}px,{-mouseY}px)"></div>
    <div class="absolute inset-0 opacity-[0.02]"
      style="background-image:linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px);background-size:80px 80px"></div>
  </div>

  <div class="relative mx-auto max-w-6xl px-5 py-10 sm:px-8">
    
    <!-- Header -->
    <div class="mb-8 text-center">
      <div class="mb-5 inline-flex items-center gap-4">
        <div class="relative">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-2xl shadow-red-600/30">
            <span class="text-3xl">😺</span>
          </div>
          <div class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 {pulse ? 'scale-150' : ''} transition-transform">
            <div class="absolute inset-0 animate-ping rounded-full bg-emerald-400/40"></div>
          </div>
        </div>
        <div class="text-left">
          <h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl" style="text-shadow:0 0 60px rgba(220,38,38,0.3)">Forbes</h1>
          <p class="text-[11px] uppercase tracking-[0.3em] text-red-500/60">Digital Assets</p>
        </div>
      </div>
    </div>

    <!-- Main Card -->
    <div class="mb-8 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-sm">
      <div class="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <h2 class="text-3xl font-light text-white md:text-4xl">jam cat</h2>
            <span class="rounded-lg bg-white/[0.06] px-2 py-1 text-sm font-bold text-white/50">JAM</span>
          </div>
          <p class="mb-4 text-sm text-white/40">Price, Charts & News</p>
          
          <div class="mb-4 flex items-baseline gap-3">
            <span class="text-4xl font-light text-white md:text-5xl">${fmtPrice(price)}</span>
            <span class="flex items-center gap-1 text-sm font-semibold {change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}">
              <span>{change24h >= 0 ? '↑' : '↓'}</span>
              <span>({change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%)</span>
            </span>
          </div>

          <div class="flex items-center gap-4">
            <button class="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-white/50 transition hover:border-white/15 hover:text-white/70">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add To Watchlist
            </button>
            <div class="flex items-center gap-3">
              <a href="https://x.com/JamCatCTO" target="_blank" class="text-white/30 transition hover:text-white/60">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href={RESOURCES.website} target="_blank" class="text-white/30 transition hover:text-white/60">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center">
          <div class="relative h-40 w-40 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 md:h-48 md:w-48">
            <img src="/profile-pics/jamcat1.png" alt="Jam Cat" class="h-full w-full object-cover opacity-90" />
          </div>
        </div>
      </div>
    </div>

    <!-- Calculator & Resources -->
    <div class="grid gap-6 md:grid-cols-[1.5fr_1fr]">
      <!-- Calculator -->
      <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <h3 class="mb-4 text-sm font-semibold text-white/70">jam cat (JAM) Price Conversion Calculator</h3>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="flex-1 rounded-xl border border-white/[0.08] bg-black/20 p-3">
            <div class="mb-1 flex items-center gap-2">
              <span class="text-xs text-white/40">😺 JAM</span>
            </div>
            <input 
              type="number" 
              bind:value={jamAmount} 
              class="w-full bg-transparent text-xl font-light text-white outline-none"
              min="0"
              step="0.1"
            />
          </div>
          
          <div class="flex items-center justify-center text-white/30">
            <svg class="h-6 w-6 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          </div>

          <div class="flex-1 rounded-xl border border-white/[0.08] bg-black/20 p-3">
            <div class="mb-1 flex items-center gap-2">
              <span class="text-lg">🇺🇸</span>
              <span class="text-xs text-white/40">USD</span>
            </div>
            <div class="text-xl font-light text-white/80">{usdValue.toFixed(8)}</div>
          </div>
        </div>
      </div>

      <!-- Resources -->
      <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <h3 class="mb-4 text-sm font-semibold text-white/70">jam cat Resources</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span class="text-sm text-white/50">Community</span>
            <button class="text-white/30 transition hover:text-white/60">▼</button>
          </div>
          <div class="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span class="text-sm text-white/50">Social Media</span>
            <button class="text-white/30 transition hover:text-white/60">▼</button>
          </div>
          <div class="flex items-center gap-2 border-b border-white/[0.04] pb-2">
            <span class="text-sm text-white/50">Website</span>
            <a href={RESOURCES.website} target="_blank" class="truncate text-sm text-red-400/70 transition hover:text-red-400">{RESOURCES.website}</a>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-white/50">Block Explorer</span>
            <a href={RESOURCES.blockExplorer} target="_blank" class="truncate text-xs text-red-400/70 transition hover:text-red-400">{RESOURCES.blockExplorer.slice(0, 35)}...</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
      <h3 class="mb-4 text-sm font-semibold text-white/70">jam cat (JAM) Price Chart Today</h3>
      
      <div class="mb-4 flex gap-1">
        {#each PERIODS as period}
          <button 
            onclick={() => chartPeriod = period}
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition
              {chartPeriod === period ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}"
          >
            {period}
          </button>
        {/each}
      </div>

      <div class="h-48 w-full">
        <svg viewBox="0 0 100 40" class="h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#dc2626" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#dc2626" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d={chartArea} fill="url(#chartGrad)"/>
          <path d={chartPath} fill="none" stroke="#dc2626" stroke-width="0.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8 border-t border-white/[0.04] pt-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <p class="text-[10px] text-white/20">
          Data sourced from Forbes Digital Assets · Prices may vary across exchanges
        </p>
        <div class="flex gap-4">
          {#each RESOURCES.social as social}
            <a href={social.url} target="_blank" class="text-[10px] text-white/20 transition hover:text-white/40">
              {social.icon} {social.name}
            </a>
          {/each}
        </div>
      </div>
    </div>

  </div>
</div>

<style>
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-33.33%); }
}
</style>
