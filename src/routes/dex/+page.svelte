<script>
import { onMount } from 'svelte';
import { fly, fade, scale } from 'svelte/transition';

// ── STATE ─────────────────────────────────────────────────────────
let pairs = $state([]);
let searched = $state([]);
let boosted = $state([]);
let loading = $state(true);
let searching = $state(false);
let error = $state(null);
let query = $state('');
let chain = $state('all');
let sortKey = $state('volume');
let lastUpdated = $state(null);
let selectedPair = $state(null);
let watchlist = $state(new Set());
let viewMode = $state('grid');
let showWatchlistOnly = $state(false);

const CHAINS = [
	{ key: 'all', label: 'All', icon: '🌐', color: '#888' },
	{ key: 'solana', label: 'Solana', icon: '⚡', color: '#9945FF' },
	{ key: 'ethereum', label: 'Ethereum', icon: '💎', color: '#627EEA' },
	{ key: 'bsc', label: 'BSC', icon: '🟡', color: '#F3BA2F' },
	{ key: 'base', label: 'Base', icon: '🔵', color: '#0052FF' },
	{ key: 'arbitrum', label: 'Arb', icon: '🔷', color: '#12AAFF' }
];

const SORT_OPTIONS = [
	{ key: 'volume', label: 'Volume', icon: '📊' },
	{ key: 'price_change', label: 'Change', icon: '📈' },
	{ key: 'liquidity', label: 'Liquidity', icon: '💧' },
	{ key: 'txns', label: 'Activity', icon: '⚡' },
	{ key: 'boosted', label: 'Trending', icon: '🔥' }
];

const BASE = 'https://api.dexscreener.com';

async function fetchTrending() {
	loading = true; error = null;
	try {
		const [trendRes, boostRes] = await Promise.all([
fetch(`${BASE}/token-profiles/latest/v1`),
fetch(`${BASE}/token-boosts/top/v1`)
]);

		if (trendRes.ok) {
			const data = await trendRes.json();
			const profiles = Array.isArray(data) ? data.slice(0, 30) : [];
			await fetchPairsForProfiles(profiles);
		} else {
			await searchPairs('SOL');
		}

		if (boostRes.ok) {
			const data = await boostRes.json();
			boosted = Array.isArray(data) ? data.slice(0, 10) : [];
		}

		lastUpdated = new Date();
	} catch (e) {
		error = e.message;
	} finally {
		loading = false;
	}
}

async function fetchPairsForProfiles(profiles) {
	const addresses = profiles
		.filter(p => p.tokenAddress && p.chainId)
		.slice(0, 20)
		.map(p => ({ chain: p.chainId, addr: p.tokenAddress }));

	if (!addresses.length) { await searchPairs('SOL'); return; }

	const res = await fetch(`${BASE}/latest/dex/tokens/${addresses.slice(0, 20).map(a => a.addr).join(',')}`);
	if (res.ok) {
		const data = await res.json();
		pairs = (data.pairs ?? []).slice(0, 100);
	} else {
		await searchPairs('SOL');
	}
}

async function searchPairs(q) {
	if (!q.trim()) return;
	searching = true; error = null;
	try {
		const res = await fetch(`${BASE}/latest/dex/search?q=${encodeURIComponent(q)}`);
		if (!res.ok) throw new Error(`DexScreener ${res.status}`);
		const data = await res.json();
		const result = data.pairs ?? [];
		if (q !== 'SOL') {
			searched = result.slice(0, 50);
		} else {
			pairs = result.slice(0, 100);
		}
	} catch (e) {
		error = e.message;
	} finally {
		searching = false;
	}
}

let debounceTimer;
function onSearch() {
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		if (query.length > 1) searchPairs(query);
		else searched = [];
	}, 300);
}

let displayPairs = $derived(
(query.length > 1 ? searched : pairs)
		.filter(p => chain === 'all' || p.chainId === chain)
		.filter(p => !showWatchlistOnly || watchlist.has(p.pairAddress))
		.sort((a, b) => {
			if (sortKey === 'volume') return (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0);
			if (sortKey === 'price_change') return (b.priceChange?.h24 ?? 0) - (a.priceChange?.h24 ?? 0);
			if (sortKey === 'liquidity') return (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0);
			if (sortKey === 'txns') return ((b.txns?.h24?.buys ?? 0) + (b.txns?.h24?.sells ?? 0)) - ((a.txns?.h24?.buys ?? 0) + (a.txns?.h24?.sells ?? 0));
			if (sortKey === 'boosted') return (boosted.findIndex(x => x.tokenAddress === b.baseToken?.address) - boosted.findIndex(x => x.tokenAddress === a.baseToken?.address));
			return 0;
		})
);

function fmt(n) {
	if (n == null || isNaN(n)) return '—';
	if (n >= 1e9) return `${(n/1e9).toFixed(2)}B`;
	if (n >= 1e6) return `${(n/1e6).toFixed(2)}M`;
	if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`;
	return `${n.toFixed(2)}`;
}

function fmtPrice(p) {
	if (p == null) return '—';
	const n = parseFloat(p);
	if (isNaN(n)) return '—';
	if (n >= 1) return `${n.toFixed(4)}`;
	if (n >= 0.0001) return `${n.toFixed(6)}`;
	return `${n.toExponential(2)}`;
}

function pct(n) {
	if (n == null || isNaN(n)) return '—';
	const sign = n >= 0 ? '+' : '';
	return `${sign}${n.toFixed(2)}%`;
}

function pctColor(n) {
	if (n == null) return 'text-white/30';
	return n >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

function chainBadge(chainId) {
	const map = {
		solana: { label: 'SOL', color: '#9945FF', gradient: 'from-violet-500 to-purple-600' },
		ethereum: { label: 'ETH', color: '#627EEA', gradient: 'from-blue-500 to-indigo-600' },
		bsc: { label: 'BSC', color: '#F3BA2F', gradient: 'from-yellow-400 to-orange-500' },
		base: { label: 'BASE', color: '#0052FF', gradient: 'from-blue-600 to-blue-700' },
		polygon: { label: 'POL', color: '#8247E5', gradient: 'from-purple-500 to-indigo-600' },
		arbitrum: { label: 'ARB', color: '#12AAFF', gradient: 'from-sky-400 to-blue-500' },
		avalanche: { label: 'AVAX', color: '#E84142', gradient: 'from-red-500 to-red-600' }
	};
	return map[chainId] ?? { label: chainId?.toUpperCase().slice(0, 4) ?? '?', color: '#888', gradient: 'from-gray-500 to-gray-600' };
}

function toggleWatchlist(pairAddress, e) {
	e?.stopPropagation();
	const newWatchlist = new Set(watchlist);
	if (newWatchlist.has(pairAddress)) {
		newWatchlist.delete(pairAddress);
	} else {
		newWatchlist.add(pairAddress);
	}
	watchlist = newWatchlist;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('dex_watchlist', JSON.stringify([...watchlist]));
	}
}

function fakeSparkline(seed) {
	let s = seed ? seed.charCodeAt(0) + (seed.charCodeAt(1) || 0) : 12345;
	const pts = [];
	for (let i = 0; i < 24; i++) {
		s = (s * 16807 + 7) % 2147483647;
		pts.push(30 + (s % 40));
	}
	return pts;
}

function sparkSvg(pts, isPositive) {
	const w = 60, h = 24;
	const min = Math.min(...pts), max = Math.max(...pts);
	const range = max - min || 1;
	const d = pts.map((p, i) => {
		const x = (i / (pts.length - 1)) * w;
		const y = h - ((p - min) / range) * h;
		return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
	}).join(' ');
	return d;
}

const TICKER = '📊 DEXSCREENER · LIVE DEX PAIRS · SOLANA · ETHEREUM · BSC · BASE · VOLUME · LIQUIDITY · PRICE CHANGE · REAL-TIME TRADING DATA · ';

onMount(() => {
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('dex_watchlist');
		if (saved) watchlist = new Set(JSON.parse(saved));
	}
	fetchTrending();
	const iv = setInterval(fetchTrending, 30_000);
	return () => clearInterval(iv);
});
</script>

<svelte:head><title>DEX | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 py-2 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
		{#each [TICKER, TICKER, TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-[#0a0f0a]">
	<!-- Scanline Overlay -->
	<div class="pointer-events-none fixed inset-0 z-10 opacity-[0.03]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.05) 2px, rgba(0,255,136,0.05) 4px);"></div>

	<!-- Dynamic Ambient Background -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute -top-40 left-1/4 h-[700px] w-[700px] rounded-full opacity-[0.08] blur-[200px] animate-pulse" style="background:radial-gradient(circle,rgba(0,255,136,0.3),transparent 70%);animation-duration:8s;"></div>
		<div class="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-[180px] animate-pulse" style="background:radial-gradient(circle,rgba(0,212,170,0.25),transparent 70%);animation-duration:10s;"></div>
		<div class="absolute bottom-0 left-1/2 h-[600px] w-[600px] rounded-full opacity-[0.05] blur-[160px] animate-pulse" style="background:radial-gradient(circle,rgba(20,184,166,0.2),transparent 70%);animation-duration:12s;"></div>
	</div>

	<div class="relative mx-auto max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6">

		<!-- ── COMPACT HERO ───────────────────────────────────────────── -->
		<div class="mb-4 flex items-center justify-between" in:fly={{ y: -10, duration: 300 }}>
			<div class="flex items-center gap-3">
				<div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/10 text-xl shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/30">
					<div class="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-transparent blur-sm"></div>
					<span class="relative">📊</span>
				</div>
				<div>
					<h1 class="text-2xl font-black tracking-tighter text-white">
						DexScreener <span class="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">Pro</span>
					</h1>
					<div class="flex items-center gap-2">
						<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></div>
						<span class="text-[9px] font-bold uppercase tracking-wider text-emerald-400/60">Live</span>
						{#if lastUpdated}
							<span class="text-[9px] text-white/20">· {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<div class="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
					<button onclick={() => viewMode = 'grid'}
						class="rounded-md px-2 py-1 text-xs transition {viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}">
						⊞
					</button>
					<button onclick={() => viewMode = 'compact'}
						class="rounded-md px-2 py-1 text-xs transition {viewMode === 'compact' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}">
						☰
					</button>
				</div>
				<button onclick={fetchTrending} disabled={loading}
					class="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30">
					<span class={loading ? 'animate-spin' : ''}>⟳</span>
					<span class="hidden sm:inline">{loading ? '' : 'Refresh'}</span>
				</button>
			</div>
		</div>

		<!-- ── COMPACT STATS ──────────────────────────────────────────── -->
		<div class="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
			{#each [
				{ label: 'Pairs', value: displayPairs.length, icon: '💎', color: 'emerald' },
				{ label: 'Vol 24h', value: fmt(displayPairs.reduce((a, p) => a + (p.volume?.h24 ?? 0), 0)), icon: '📈', color: 'blue' },
				{ label: 'Watch', value: watchlist.size, icon: '⭐', color: 'yellow' },
				{ label: 'Boost', value: boosted.length, icon: '🚀', color: 'purple' }
			] as stat}
				<div class="group relative flex shrink-0 items-center gap-2 rounded-lg border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-3 py-1.5 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
					<span class="text-sm">{stat.icon}</span>
					<div>
						<p class="text-[9px] font-bold uppercase tracking-wider text-white/30">{stat.label}</p>
						<p class="text-sm font-black text-white">{stat.value}</p>
					</div>
					<div class="absolute inset-0 rounded-lg bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
				</div>
			{/each}
		</div>

		<!-- ── COMPACT TRENDING ─────────────────────────────────────── -->
		{#if boosted.length && !query}
			<div class="mb-3" in:fly={{ y: 10, duration: 300 }}>
				<div class="mb-2 flex items-center gap-2">
					<span class="text-xs">🔥</span>
					<span class="text-[10px] font-black uppercase tracking-widest text-white/40">Trending</span>
				</div>
				<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
					{#each boosted.slice(0, 8) as b (b.tokenAddress)}
						{@const ch = chainBadge(b.chainId)}
						<a href={b.url ?? '#'} target="_blank" rel="noopener"
							class="group relative flex shrink-0 items-center gap-2 rounded-lg border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-2 py-1.5 backdrop-blur-sm transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:shadow-lg hover:shadow-orange-500/10">
							{#if b.icon}
								<img src={b.icon} alt="" class="h-6 w-6 rounded-full ring-1 ring-white/5 ring-orange-500/20 group-hover:ring-orange-500/40 transition-all" loading="lazy" />
							{:else}
								<div class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/20 text-xs ring-1 ring-orange-500/30 group-hover:ring-orange-500/50 transition-all">🚀</div>
							{/if}
							<div>
								<p class="max-w-[100px] truncate text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{b.description?.slice(0, 12) ?? 'Token'}</p>
								<span class="rounded px-1 py-0 text-[8px] font-black ring-1 ring-inset group-hover:ring-orange-500/40 transition-all" style="background:{ch.color}22;color:{ch.color};border-color:{ch.color}40">{ch.label}</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ── COMPACT CONTROLS ───────────────────────────────────────── -->
		<div class="mb-3 flex flex-wrap items-center gap-2" in:fly={{ y: 10, duration: 300, delay: 50 }}>
			<!-- Search -->
			<div class="relative">
				<input bind:value={query} oninput={onSearch}
					placeholder="Search..."
					class="w-40 rounded-lg border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.01] py-1.5 pl-3 pr-8 text-xs text-white placeholder-white/20 outline-none transition-all focus:border-emerald-500/50 focus:shadow-lg focus:shadow-emerald-500/10" />
				{#if searching}
					<div class="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400"></div>
				{:else}
					<span class="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 text-xs">⌘</span>
				{/if}
			</div>

			<!-- Chain Filter -->
			<div class="flex gap-0.5 rounded-lg border border-white/8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-0.5 backdrop-blur-sm">
				{#each CHAINS as c}
					<button onclick={() => chain = c.key}
						class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold transition-all {chain === c.key ? 'bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/10' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}">
						<span>{c.icon}</span>
						<span class="hidden sm:inline text-[10px]">{c.label}</span>
					</button>
				{/each}
			</div>

			<!-- Watchlist Toggle -->
			<button onclick={() => showWatchlistOnly = !showWatchlistOnly}
				class="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition-all {showWatchlistOnly ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400 shadow-md shadow-yellow-500/10' : 'border-white/8 text-white/40 hover:text-white/70 hover:border-yellow-500/30 hover:bg-yellow-500/5'}">
				<span>⭐</span>
				{#if watchlist.size > 0}
					<span class="rounded-full bg-white/10 px-1 py-0 text-[8px]">{watchlist.size}</span>
				{/if}
			</button>

			<!-- Sort -->
			<select bind:value={sortKey}
				class="rounded-lg border border-white/8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] px-2 py-1 text-xs font-bold text-white/60 outline-none transition hover:border-white/20 hover:bg-white/5 focus:border-emerald-500/50 focus:shadow-md focus:shadow-emerald-500/10">
				{#each SORT_OPTIONS as s}
					<option value={s.key}>{s.icon} {s.label}</option>
				{/each}
			</select>
		</div>

		<!-- ── ERROR ─────────────────────────────────────────────────── -->
		{#if error}
			<div class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-6 text-center" in:fade>
				<div class="mb-3 text-4xl">⚠️</div>
				<p class="text-lg font-black text-red-400">Connection Error</p>
				<p class="mt-1 text-sm text-white/40">{error}</p>
				<button onclick={fetchTrending} class="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-2 text-xs font-black text-red-400 transition hover:bg-red-400/20">
					Try Again
				</button>
			</div>
		{/if}

		<!-- ── LOADING SKELETON ───────────────────────────────────────── -->
		{#if loading && !pairs.length}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each Array(12) as _, i}
					<div class="h-40 animate-pulse rounded-xl bg-white/[0.03]" style="animation-delay:{i * 50}ms"></div>
				{/each}
			</div>
		{/if}

		<!-- ── EMPTY STATE ───────────────────────────────────────────── -->
		{#if !loading && !error && displayPairs.length === 0}
			<div class="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02] py-20" in:fade>
				<div class="mb-4 text-6xl opacity-30">🔍</div>
				<p class="text-xl font-black text-white/40">No pairs found</p>
				<p class="mt-2 text-sm text-white/20">
					{#if showWatchlistOnly && watchlist.size === 0}
						Add pairs to your watchlist to see them here
					{:else if query}
						Try a different search term
					{:else}
						Try a different chain filter
					{/if}
				</p>
				{#if showWatchlistOnly}
					<button onclick={() => showWatchlistOnly = false}
						class="mt-4 rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold text-white/50 transition hover:text-white/80">
						View All Pairs
					</button>
				{/if}
			</div>
		{/if}

		<!-- ── COMPACT GRID VIEW ─────────────────────────────────────── -->
		{#if displayPairs.length && viewMode === 'grid'}
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" in:fade>
				{#each displayPairs.slice(0, 20) as pair, i (pair.pairAddress ?? i)}
					{@const ch = chainBadge(pair.chainId)}
					{@const change24 = pair.priceChange?.h24}
					{@const txns = (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0)}
					{@const isWatched = watchlist.has(pair.pairAddress)}
					{@const isBoosted = boosted.some(b => b.tokenAddress === pair.baseToken?.address)}
					<a href={pair.url ?? '#'} target="_blank" rel="noopener"
						class="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-0.5"
						in:fly={{ y: 10, duration: 200, delay: Math.min(i * 20, 200) }}>

						<!-- Card Glow Effect -->
						<div class="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-0 blur-[40px] transition-opacity duration-500 group-hover:opacity-60"
							style="background:{ch.color}"></div>

						<div class="relative">
							<!-- Header -->
							<div class="mb-1 flex items-start justify-between">
								<div class="flex items-center gap-1.5">
									{#if pair.info?.imageUrl}
										<img src={pair.info.imageUrl} alt="" class="h-7 w-7 rounded-full ring-1 ring-white/5" loading="lazy" />
									{:else}
										<div class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br {ch.gradient} text-xs font-black text-white/90">
											{pair.baseToken?.symbol?.[0] ?? '?'}
										</div>
									{/if}
									<div>
										<div class="flex items-center gap-1">
											<span class="text-xs font-black text-white">{pair.baseToken?.symbol ?? '?'}</span>
											{#if isBoosted}
												<span class="text-[8px]">🔥</span>
											{/if}
										</div>
										<span class="rounded px-1 py-0 text-[7px] font-black" style="background:{ch.color}22;color:{ch.color}">{ch.label}</span>
									</div>
								</div>
								<button onclick={(e) => toggleWatchlist(pair.pairAddress, e)}
									class="text-sm transition-transform hover:scale-110 {isWatched ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400'}">
									{isWatched ? '★' : '☆'}
								</button>
							</div>

							<!-- Price & Change -->
							<div class="mb-1">
								<span class="text-sm font-black text-white">{fmtPrice(pair.priceUsd)}</span>
								<span class="ml-1 text-xs font-bold {pctColor(change24)}">{pct(change24)}</span>
							</div>

							<!-- Compact Stats -->
							<div class="flex flex-wrap gap-1 text-[8px]">
								<span class="rounded bg-white/[0.05] px-1 py-0.5 text-white/60">{pair.dexId?.slice(0, 8) ?? 'DEX'}</span>
								<span class="rounded bg-white/[0.05] px-1 py-0.5 text-white/60">V:{fmt(pair.volume?.h24)}</span>
								<span class="rounded bg-white/[0.05] px-1 py-0.5 text-white/60">L:{fmt(pair.liquidity?.usd)}</span>
								<span class="rounded bg-white/[0.05] px-1 py-0.5 text-white/60">T:{txns || '—'}</span>
								{#if pair.marketCap}
									<span class="rounded bg-emerald-500/10 px-1 py-0.5 text-emerald-400">MC:{fmt(pair.marketCap)}</span>
								{/if}
							</div>

							<!-- Multi-timeframe Changes -->
							<div class="mt-1 flex gap-1 text-[8px]">
								<span class="text-white/40">1h:</span>
								<span class="{pctColor(pair.priceChange?.h1)}">{pct(pair.priceChange?.h1)}</span>
								<span class="text-white/40 ml-1">6h:</span>
								<span class="{pctColor(pair.priceChange?.h6)}">{pct(pair.priceChange?.h6)}</span>
								<span class="text-white/40 ml-1">24h:</span>
								<span class="{pctColor(change24)}">{pct(change24)}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- ── ULTRA COMPACT LIST VIEW ──────────────────────────────── -->
		{#if displayPairs.length && viewMode === 'compact'}
			<div class="overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md" in:fade>
				<div class="grid grid-cols-[2rem_1fr_4rem_4rem_4rem_4rem_3rem_2rem] items-center gap-1 border-b border-white/[0.08] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white/30">
					<span></span>
					<span>Pair</span>
					<span class="text-right">Price</span>
					<span class="text-right">1h</span>
					<span class="text-right hidden sm:block">24h</span>
					<span class="text-right hidden sm:block">Vol</span>
					<span class="text-right">DEX</span>
					<span></span>
				</div>
				{#each displayPairs.slice(0, 15) as pair, i (pair.pairAddress ?? i)}
					{@const ch = chainBadge(pair.chainId)}
					{@const change24 = pair.priceChange?.h24}
					{@const isWatched = watchlist.has(pair.pairAddress)}
					<a href={pair.url ?? '#'} target="_blank" rel="noopener"
						class="group grid grid-cols-[2rem_1fr_4rem_4rem_4rem_4rem_3rem_2rem] items-center gap-1 border-b border-white/[0.04] px-2 py-1 text-xs transition-all hover:bg-emerald-500/5 hover:border-emerald-500/20 last:border-0"
						in:fly={{ x: -10, duration: 200, delay: Math.min(i * 10, 200) }}>
						<div class="flex justify-center">
							{#if pair.info?.imageUrl}
								<img src={pair.info.imageUrl} alt="" class="h-5 w-5 rounded-full" loading="lazy" />
							{:else}
								<div class="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[8px] font-black">{pair.baseToken?.symbol?.[0] ?? '?'}</div>
							{/if}
						</div>
						<div class="min-w-0">
							<div class="flex items-center gap-1">
								<span class="truncate font-bold text-white text-xs">{pair.baseToken?.symbol}</span>
								<span class="rounded px-1 py-0 text-[7px] font-black" style="background:{ch.color}22;color:{ch.color}">{ch.label}</span>
							</div>
						</div>
						<p class="text-right font-bold text-white text-xs">{fmtPrice(pair.priceUsd)}</p>
						<p class="text-right font-bold {pctColor(pair.priceChange?.h1)} text-xs">{pct(pair.priceChange?.h1)}</p>
						<p class="text-right hidden font-bold {pctColor(change24)} sm:block text-xs">{pct(change24)}</p>
						<p class="text-right hidden text-white/40 sm:block text-xs">{fmt(pair.volume?.h24)}</p>
						<p class="text-right text-[8px] text-white/50">{pair.dexId?.slice(0, 4) ?? '-'}</p>
						<div class="flex justify-center">
							<button onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(pair.pairAddress, e); }}
								class="text-sm transition {isWatched ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400'}">
								{isWatched ? '★' : '☆'}
							</button>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- ── FOOTER INFO ────────────────────────────────────────────── -->
		{#if displayPairs.length}
			<div class="mt-2 flex items-center justify-between text-[9px] text-white/20">
				<span>{displayPairs.length} pairs · DexScreener API · 30s updates</span>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to { transform: translateX(-33.33%); }
	}
	@keyframes animate-gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	.animate-gradient {
		background-size: 200% 200%;
		animation: animate-gradient 3s ease infinite;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
