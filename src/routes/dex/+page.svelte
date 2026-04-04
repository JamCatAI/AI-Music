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

	const res = await fetch(`${BASE}/latest/dex/tokens/${addresses.slice(0, 8).map(a => a.addr).join(',')}`);
	if (res.ok) {
		const data = await res.json();
		pairs = (data.pairs ?? []).slice(0, 60);
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
			searched = result.slice(0, 30);
		} else {
			pairs = result.slice(0, 60);
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

<div class="relative min-h-screen overflow-hidden bg-[#050808]">
	<!-- Ambient Background -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full opacity-[0.04] blur-[150px]"
			 style="background:radial-gradient(circle,#00d4aa,transparent 70%)"></div>
		<div class="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full opacity-[0.03] blur-[120px]"
			 style="background:radial-gradient(circle,#00d4aa,transparent 70%)"></div>
	</div>

	<div class="relative mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10">

		<!-- ── HERO SECTION ─────────────────────────────────────────── -->
		<div class="mb-10" in:fly={{ y: -20, duration: 500 }}>
			<div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
				<div class="flex items-start gap-4">
					<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-3xl shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/20">
						📊
					</div>
					<div>
						<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl">
							DexScreener
							<span class="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Pro</span>
						</h1>
						<p class="mt-2 max-w-lg text-sm text-white/40">Real-time DEX pairs across all chains. Live trading data, volume analysis, and market insights.</p>
						<div class="mt-3 flex items-center gap-4">
							<div class="flex items-center gap-2">
								<div class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></div>
								<span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">Live</span>
							</div>
							{#if lastUpdated}
								<span class="text-[10px] text-white/20">Updated {lastUpdated.toLocaleTimeString()}</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<button onclick={() => viewMode = 'grid'}
						class="rounded-xl border px-3 py-2 text-sm transition {viewMode === 'grid' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
						⊞
					</button>
					<button onclick={() => viewMode = 'compact'}
						class="rounded-xl border px-3 py-2 text-sm transition {viewMode === 'compact' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
						☰
					</button>
					<button onclick={fetchTrending} disabled={loading}
						class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30">
						<span class={loading ? 'animate-spin' : ''}>⟳</span>
						<span class="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
					</button>
				</div>
			</div>

			<!-- Stats Bar -->
			<div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
				{#each [
					{ label: 'Active Pairs', value: displayPairs.length, icon: '💎' },
					{ label: 'Total Volume 24h', value: fmt(displayPairs.reduce((a, p) => a + (p.volume?.h24 ?? 0), 0)), icon: '📈' },
					{ label: 'Watchlisted', value: watchlist.size, icon: '⭐' },
					{ label: 'Boosted', value: boosted.length, icon: '🚀' }
				] as stat}
					<div class="rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm">
						<div class="flex items-center gap-2">
							<span class="text-lg">{stat.icon}</span>
							<span class="text-[10px] font-bold uppercase tracking-wider text-white/30">{stat.label}</span>
						</div>
						<p class="mt-1 text-xl font-black text-white">{stat.value}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── BOOSTED / TRENDING STRIP ───────────────────────────────── -->
		{#if boosted.length && !query}
			<div class="mb-8" in:fly={{ y: 20, duration: 400 }}>
				<div class="mb-4 flex items-center gap-3">
					<span class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-xs">🔥</span>
					<span class="text-xs font-black uppercase tracking-widest text-white/40">Trending Boosts</span>
				</div>
				<div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
					{#each boosted as b (b.tokenAddress)}
						{@const ch = chainBadge(b.chainId)}
						<a href={b.url ?? '#'} target="_blank" rel="noopener"
							class="group flex shrink-0 items-center gap-3 rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.03] to-transparent p-3 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
							{#if b.icon}
								<img src={b.icon} alt="" class="h-10 w-10 rounded-full ring-2 ring-white/5" loading="lazy" />
							{:else}
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
									<span class="text-sm">🚀</span>
								</div>
							{/if}
							<div>
								<p class="max-w-[150px] truncate text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
									{b.description?.slice(0, 24) ?? 'Token'}
								</p>
								<span class="rounded-md px-1.5 py-0.5 text-[9px] font-black" style="background:{ch.color}22;color:{ch.color}">{ch.label}</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ── CONTROLS BAR ───────────────────────────────────────────── -->
		<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" in:fly={{ y: 20, duration: 400, delay: 100 }}>
			<div class="flex flex-wrap items-center gap-3">
				<!-- Search -->
				<div class="relative">
					<input bind:value={query} oninput={onSearch}
						placeholder="Search tokens, pairs..."
						class="w-72 rounded-xl border border-white/8 bg-white/[0.03] py-2.5 pl-4 pr-10 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-emerald-500/40 focus:bg-white/[0.05] focus:shadow-lg focus:shadow-emerald-500/10" />
					{#if searching}
						<div class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400"></div>
					{:else}
						<span class="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">⌘</span>
					{/if}
				</div>

				<!-- Chain Filter -->
				<div class="flex gap-1 rounded-xl border border-white/8 bg-white/[0.02] p-1">
					{#each CHAINS as c}
						<button onclick={() => chain = c.key}
							class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all {chain === c.key ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-white/40 hover:text-white/70'}">
							<span>{c.icon}</span>
							<span class="hidden sm:inline">{c.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="flex items-center gap-3">
				<!-- Watchlist Toggle -->
				<button onclick={() => showWatchlistOnly = !showWatchlistOnly}
					class="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all {showWatchlistOnly ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' : 'border-white/8 text-white/40 hover:text-white/70'}">
					<span>⭐</span>
					<span class="hidden sm:inline">Watchlist</span>
					{#if watchlist.size > 0}
						<span class="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{watchlist.size}</span>
					{/if}
				</button>

				<!-- Sort -->
				<select bind:value={sortKey}
					class="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs font-bold text-white/60 outline-none transition hover:border-white/20 focus:border-emerald-500/40">
					{#each SORT_OPTIONS as s}
						<option value={s.key}>{s.icon} {s.label}</option>
					{/each}
				</select>
			</div>
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

		<!-- ── GRID VIEW ─────────────────────────────────────────────── -->
		{#if displayPairs.length && viewMode === 'grid'}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" in:fade>
				{#each displayPairs.slice(0, 40) as pair, i (pair.pairAddress ?? i)}
					{@const ch = chainBadge(pair.chainId)}
					{@const change24 = pair.priceChange?.h24}
					{@const txns = (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0)}
					{@const isWatched = watchlist.has(pair.pairAddress)}
					{@const spark = fakeSparkline(pair.pairAddress || 'seed')}
					{@const isBoosted = boosted.some(b => b.tokenAddress === pair.baseToken?.address)}
					<div class="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5"
						in:fly={{ y: 20, duration: 300, delay: Math.min(i * 30, 600) }}>

						<!-- Glow Effect -->
						<div class="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-50"
							 style="background:{ch.color}"></div>

						<div class="relative">
							<!-- Header -->
							<div class="mb-4 flex items-start justify-between">
								<div class="flex items-center gap-3">
									{#if pair.info?.imageUrl}
										<img src={pair.info.imageUrl} alt="" class="h-12 w-12 rounded-full ring-2 ring-white/5" loading="lazy" />
									{:else}
										<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br {ch.gradient} text-lg font-black text-white/90">
											{pair.baseToken?.symbol?.[0] ?? '?'}
										</div>
									{/if}
									<div>
										<div class="flex items-center gap-2">
											<span class="text-sm font-black text-white">{pair.baseToken?.symbol ?? '?'}</span>
											<span class="text-xs text-white/30">/{pair.quoteToken?.symbol ?? '?'}</span>
											{#if isBoosted}
												<span class="text-xs">🔥</span>
											{/if}
										</div>
										<span class="rounded-md px-1.5 py-0.5 text-[9px] font-black" style="background:{ch.color}22;color:{ch.color}">{ch.label}</span>
									</div>
								</div>
								<button onclick={(e) => toggleWatchlist(pair.pairAddress, e)}
									class="text-lg transition-transform hover:scale-110 {isWatched ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400'}">
									{isWatched ? '★' : '☆'}
								</button>
							</div>

							<!-- Price & Change -->
							<div class="mb-4">
								<div class="flex items-baseline gap-3">
									<span class="text-2xl font-black text-white">{fmtPrice(pair.priceUsd)}</span>
									<span class="text-sm font-bold {pctColor(change24)}">{pct(change24)}</span>
								</div>
								<!-- Mini Sparkline -->
								<svg viewBox="0 0 60 24" class="mt-2 h-6 w-full opacity-40" preserveAspectRatio="none">
									<path d={sparkSvg(spark, change24 >= 0)} fill="none" stroke={change24 >= 0 ? '#10b981' : '#f43f5e'} stroke-width="1.5" stroke-linecap="round" />
								</svg>
							</div>

							<!-- Stats Grid -->
							<div class="grid grid-cols-3 gap-2 text-center">
								<div class="rounded-lg bg-white/[0.03] p-2">
									<p class="text-[9px] font-bold uppercase tracking-wider text-white/30">Volume</p>
									<p class="mt-0.5 text-xs font-bold text-white/80">{fmt(pair.volume?.h24)}</p>
								</div>
								<div class="rounded-lg bg-white/[0.03] p-2">
									<p class="text-[9px] font-bold uppercase tracking-wider text-white/30">Liquidity</p>
									<p class="mt-0.5 text-xs font-bold text-white/80">{fmt(pair.liquidity?.usd)}</p>
								</div>
								<div class="rounded-lg bg-white/[0.03] p-2">
									<p class="text-[9px] font-bold uppercase tracking-wider text-white/30">24h Txns</p>
									<p class="mt-0.5 text-xs font-bold text-white/80">{txns ? txns.toLocaleString() : '—'}</p>
								</div>
							</div>

							<!-- Action -->
							<a href={pair.url ?? '#'} target="_blank" rel="noopener"
								class="mt-4 flex items-center justify-center gap-2 rounded-lg bg-white/[0.05] py-2.5 text-xs font-bold text-white/50 transition-all hover:bg-emerald-500/20 hover:text-emerald-400">
								<span>View on DexScreener</span>
								<span>→</span>
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- ── COMPACT LIST VIEW ─────────────────────────────────────── -->
		{#if displayPairs.length && viewMode === 'compact'}
			<div class="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e0e]" in:fade>
				<div class="grid grid-cols-[3rem_1fr_6rem_5rem_5rem_4rem] items-center gap-2 border-b border-white/[0.05] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white/20">
					<span></span>
					<span>Pair</span>
					<span class="text-right">Price</span>
					<span class="text-right">24h</span>
					<span class="text-right hidden sm:block">Volume</span>
					<span></span>
				</div>
				{#each displayPairs.slice(0, 50) as pair, i (pair.pairAddress ?? i)}
					{@const ch = chainBadge(pair.chainId)}
					{@const change24 = pair.priceChange?.h24}
					{@const isWatched = watchlist.has(pair.pairAddress)}
					<a href={pair.url ?? '#'} target="_blank" rel="noopener"
						class="grid grid-cols-[3rem_1fr_6rem_5rem_5rem_4rem] items-center gap-2 border-b border-white/[0.03] px-4 py-3 text-xs transition hover:bg-white/[0.03] last:border-0"
						in:fly={{ x: -10, duration: 200, delay: Math.min(i * 10, 400) }}>
						<div class="flex justify-center">
							{#if pair.info?.imageUrl}
								<img src={pair.info.imageUrl} alt="" class="h-8 w-8 rounded-full" loading="lazy" />
							{:else}
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-black">{pair.baseToken?.symbol?.[0] ?? '?'}</div>
							{/if}
						</div>
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<span class="truncate font-bold text-white">{pair.baseToken?.symbol}</span>
								<span class="rounded px-1 py-0.5 text-[8px] font-black" style="background:{ch.color}22;color:{ch.color}">{ch.label}</span>
							</div>
							<p class="truncate text-[10px] text-white/30">{pair.baseToken?.name}</p>
						</div>
						<p class="text-right font-bold text-white">{fmtPrice(pair.priceUsd)}</p>
						<p class="text-right font-bold {pctColor(change24)}">{pct(change24)}</p>
						<p class="text-right hidden text-white/40 sm:block">{fmt(pair.volume?.h24)}</p>
						<div class="flex justify-center">
							<button onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(pair.pairAddress, e); }}
								class="text-lg transition {isWatched ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400'}">
								{isWatched ? '★' : '☆'}
							</button>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- ── FOOTER INFO ────────────────────────────────────────────── -->
		{#if displayPairs.length}
			<div class="mt-6 flex items-center justify-between text-[10px] text-white/20">
				<span>Showing {Math.min(displayPairs.length, viewMode === 'grid' ? 40 : 50)} of {displayPairs.length} pairs</span>
				<span>Data from DexScreener API · Updates every 30s</span>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to { transform: translateX(-33.33%); }
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
