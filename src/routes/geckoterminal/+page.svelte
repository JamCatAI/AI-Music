<script>
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	const BASE = 'https://api.geckoterminal.com/api/v2';

	let pairs = $state([]);
	let loading = $state(true);
	let error = $state(null);
	let lastUpdated = $state(null);
	let query = $state('');
	let searching = $state(false);
	let chain = $state('solana');
	let viewMode = $state('grid');
	let watchlist = $state(new Set());
	let showWatchlistOnly = $state(false);
	let sortKey = $state('volume');
	let refreshInterval;

	const CHAINS = [
		{ key: 'solana', label: 'SOL', icon: '◎' },
		{ key: 'eth', label: 'ETH', icon: '💎' },
		{ key: 'bsc', label: 'BSC', icon: '🦄' },
		{ key: 'polygon', label: 'POLY', icon: '🟣' },
		{ key: 'arbitrum', label: 'ARB', icon: '🔵' },
		{ key: 'avalanche', label: 'AVAX', icon: '🔺' },
		{ key: 'fantom', label: 'FTM', icon: '👻' },
		{ key: 'optimism', label: 'OP', icon: '🔴' }
	];

	const SORT_OPTIONS = [
		{ key: 'volume', label: 'Volume', icon: '📈' },
		{ key: 'price', label: 'Price', icon: '💰' },
		{ key: 'liquidity', label: 'Liquidity', icon: '💧' }
	];

	const TICKER = 'GECKOTERMINAL • LIVE DEX DATA • 1,500+ EXCHANGES • 200+ NETWORKS • ';

	function chainBadge(chainId) {
		const map = {
			eth: { label: 'ETH', color: '#627eea', gradient: 'from-blue-500/30 to-purple-500/30' },
			bsc: { label: 'BSC', color: '#f3ba2f', gradient: 'from-yellow-500/30 to-orange-500/30' },
			sol: { label: 'SOL', color: '#9945ff', gradient: 'from-purple-500/30 to-pink-500/30' },
			polygon: { label: 'POLY', color: '#8247e5', gradient: 'from-purple-500/30 to-violet-500/30' },
			arbitrum: { label: 'ARB', color: '#28a0f0', gradient: 'from-blue-400/30 to-cyan-500/30' },
			avalanche: { label: 'AVAX', color: '#e84142', gradient: 'from-red-500/30 to-orange-500/30' },
			fantom: { label: 'FTM', color: '#1969ff', gradient: 'from-blue-500/30 to-indigo-500/30' },
			optimism: { label: 'OP', color: '#ff0420', gradient: 'from-red-500/30 to-pink-500/30' }
		};
		return map[chainId] || { label: 'UNK', color: '#888', gradient: 'from-gray-500/30 to-gray-600/30' };
	}

	function fmtPrice(p) {
		if (!p) return '—';
		if (p >= 1) return p.toFixed(4);
		if (p >= 0.01) return p.toFixed(6);
		if (p >= 0.0001) return p.toFixed(8);
		return p.toFixed(10);
	}

	function fmt(n) {
		if (!n) return '—';
		const num = parseFloat(n);
		if (isNaN(num)) return '—';
		if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
		if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
		if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
		return num.toFixed(0);
	}

	function pct(p) {
		if (!p && p !== 0) return '—';
		return (p >= 0 ? '+' : '') + p.toFixed(2) + '%';
	}

	function pctColor(p) {
		if (!p && p !== 0) return 'text-white/40';
		return p >= 0 ? 'text-emerald-400' : 'text-red-400';
	}

	async function fetchTopPools() {
		loading = true;
		error = null;
		try {
			const url = `${BASE}/networks/${chain}/pools?page=1&include=base_token,quote_token`;
			console.log('Fetching from:', url);
			const res = await fetch(url);
			if (!res.ok) throw new Error(`GeckoTerminal ${res.status}`);
			const data = await res.json();
			console.log('API response:', data);
			const tokensMap = {};
			(data.included ?? []).forEach(t => {
				if (t.type === 'token') {
					tokensMap[t.id] = t.attributes;
				}
			});
			pairs = (data.data ?? []).map(p => {
				const baseToken = p.relationships?.base_token?.data?.id;
				const quoteToken = p.relationships?.quote_token?.data?.id;
				const baseTokenData = tokensMap[baseToken];
				const quoteTokenData = tokensMap[quoteToken];
				return {
					...p,
					priceUsd: parseFloat(p.attributes?.base_token_price_usd || 0),
					volume: p.attributes?.volume_usd || {},
					liquidity: parseFloat(p.attributes?.reserve_in_usd || 0),
					txns: p.attributes?.transactions || {},
					priceChange: p.attributes?.price_change_percentage || {},
					baseToken: baseTokenData,
					quoteToken: quoteTokenData
				};
			});
			console.log('Mapped pairs:', pairs);
			lastUpdated = new Date();
		} catch (e) {
			error = e.message;
			console.error('GeckoTerminal error:', e);
		} finally {
			loading = false;
		}
	}

	async function searchPools(q) {
		if (!q.trim()) return;
		searching = true;
		error = null;
		try {
			const res = await fetch(`${BASE}/networks/${chain}/pools?search=${encodeURIComponent(q)}&include=base_token,quote_token`);
			if (!res.ok) throw new Error(`GeckoTerminal ${res.status}`);
			const data = await res.json();
			const tokensMap = {};
			(data.included ?? []).forEach(t => {
				if (t.type === 'token') {
					tokensMap[t.id] = t.attributes;
				}
			});
			pairs = (data.data ?? []).map(p => {
				const baseToken = p.relationships?.base_token?.data?.id;
				const quoteToken = p.relationships?.quote_token?.data?.id;
				const baseTokenData = tokensMap[baseToken];
				const quoteTokenData = tokensMap[quoteToken];
				return {
					...p,
					priceUsd: parseFloat(p.attributes?.base_token_price_usd || 0),
					volume: p.attributes?.volume_usd || {},
					liquidity: parseFloat(p.attributes?.reserve_in_usd || 0),
					txns: p.attributes?.transactions || {},
					priceChange: p.attributes?.price_change_percentage || {},
					baseToken: baseTokenData,
					quoteToken: quoteTokenData
				};
			});
		} catch (e) {
			error = e.message;
			console.error('GeckoTerminal search error:', e);
		} finally {
			searching = false;
		}
	}

	let debounceTimer;
	function onSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			if (query) {
				searchPools(query);
			} else {
				fetchTopPools();
			}
		}, 500);
	}

	function toggleWatchlist(id, e) {
		e?.preventDefault();
		e?.stopPropagation();
		if (watchlist.has(id)) {
			watchlist.delete(id);
		} else {
			watchlist.add(id);
		}
		watchlist = new Set(watchlist);
	}

	const filteredPairs = $derived(pairs
		.filter(p => {
			if (showWatchlistOnly && !watchlist.has(p.id)) return false;
			return true;
		})
		.sort((a, b) => {
			const aVal = a[sortKey] || 0;
			const bVal = b[sortKey] || 0;
			return bVal - aVal;
		}));

	const displayPairs = $derived(query ? filteredPairs : filteredPairs.slice(0, 100));

	onMount(() => {
		fetchTopPools();
		refreshInterval = setInterval(fetchTopPools, 60000);
	});

	onDestroy(() => {
		clearInterval(refreshInterval);
	});
</script>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-gradient-to-r from-purple-500/5 to-pink-500/5 py-2 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
		{#each [TICKER, TICKER, TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/60">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-[#0a050f]">
	<!-- Scanline Overlay -->
	<div class="pointer-events-none fixed inset-0 z-10 opacity-[0.03]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168,85,247,0.05) 2px, rgba(168,85,247,0.05) 4px);"></div>

	<!-- Dynamic Ambient Background -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute -top-40 left-1/4 h-[700px] w-[700px] rounded-full opacity-[0.08] blur-[200px] animate-pulse" style="background:radial-gradient(circle,rgba(168,85,247,0.3),transparent 70%);animation-duration:8s;"></div>
		<div class="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-[180px] animate-pulse" style="background:radial-gradient(circle,rgba(236,72,153,0.25),transparent 70%);animation-duration:10s;"></div>
		<div class="absolute bottom-0 left-1/2 h-[600px] w-[600px] rounded-full opacity-[0.05] blur-[160px] animate-pulse" style="background:radial-gradient(circle,rgba(139,92,246,0.2),transparent 70%);animation-duration:12s;"></div>
	</div>

	<div class="relative mx-auto max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6">

		<!-- ── COMPACT HERO ───────────────────────────────────────────── -->
		<div class="mb-4 flex items-center justify-between" in:fly={{ y: -10, duration: 300 }}>
			<div class="flex items-center gap-3">
				<div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-rose-500/10 text-xl shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/30">
					<div class="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/20 to-transparent blur-sm"></div>
					<span class="relative">🦎</span>
				</div>
				<div>
					<h1 class="text-2xl font-black tracking-tighter text-white">
						GeckoTerminal <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent animate-gradient">Pro</span>
					</h1>
					<div class="flex items-center gap-2">
						<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"></div>
						<span class="text-[9px] font-bold uppercase tracking-wider text-purple-400/60">Live</span>
						{#if lastUpdated}
							<span class="text-[9px] text-white/20">· {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<div class="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
					<button onclick={() => viewMode = 'grid'}
						class="rounded-md px-2 py-1 text-xs transition {viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'text-white/40 hover:text-white/70'}">
						⊞
					</button>
					<button onclick={() => viewMode = 'compact'}
						class="rounded-md px-2 py-1 text-xs transition {viewMode === 'compact' ? 'bg-purple-500/20 text-purple-400' : 'text-white/40 hover:text-white/70'}">
						☰
					</button>
				</div>
				<button onclick={fetchTopPools} disabled={loading}
					class="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30">
					<span class={loading ? 'animate-spin' : ''}>⟳</span>
					<span class="hidden sm:inline">{loading ? '' : 'Refresh'}</span>
				</button>
			</div>
		</div>

		<!-- ── COMPACT STATS ──────────────────────────────────────────── -->
		<div class="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
			{#each [
				{ label: 'Pools', value: displayPairs.length, icon: '💎', color: 'purple' },
				{ label: 'Vol 24h', value: fmt(displayPairs.reduce((a, p) => a + (p.volume?.h24 ?? 0), 0)), icon: '📈', color: 'blue' },
				{ label: 'Watch', value: watchlist.size, icon: '⭐', color: 'yellow' }
			] as stat}
				<div class="group relative flex shrink-0 items-center gap-2 rounded-lg border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-3 py-1.5 backdrop-blur-md transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
					<span class="text-sm">{stat.icon}</span>
					<div>
						<p class="text-[9px] font-bold uppercase tracking-wider text-white/30">{stat.label}</p>
						<p class="text-sm font-black text-white">{stat.value}</p>
					</div>
					<div class="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
				</div>
			{/each}
		</div>

		<!-- ── COMPACT CONTROLS ───────────────────────────────────────── -->
		<div class="mb-3 flex flex-wrap items-center gap-2" in:fly={{ y: 10, duration: 300, delay: 50 }}>
			<!-- Search -->
			<div class="relative">
				<input bind:value={query} oninput={onSearch}
					placeholder="Search..."
					class="w-40 rounded-lg border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.01] py-1.5 pl-3 pr-8 text-xs text-white placeholder-white/20 outline-none transition-all focus:border-purple-500/50 focus:shadow-lg focus:shadow-purple-500/10" />
				{#if searching}
					<div class="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400"></div>
				{:else}
					<span class="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 text-xs">⌘</span>
				{/if}
			</div>

			<!-- Chain Filter -->
			<div class="flex gap-0.5 rounded-lg border border-white/8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-0.5 backdrop-blur-sm">
				{#each CHAINS as c}
					<button onclick={() => { chain = c.key; fetchTopPools(); }}
						class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold transition-all {chain === c.key ? 'bg-purple-500/20 text-purple-400 shadow-md shadow-purple-500/10' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}">
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
				class="rounded-lg border border-white/8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] px-2 py-1 text-xs font-bold text-white/60 outline-none transition hover:border-white/20 hover:bg-white/5 focus:border-purple-500/50 focus:shadow-md focus:shadow-purple-500/10">
				{#each SORT_OPTIONS as s}
					<option value={s.key}>{s.icon} {s.label}</option>
				{/each}
			</select>
		</div>

		<!-- ── ERROR ─────────────────────────────────────────────────── -->
		{#if error}
			<div class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-6 text-center" in:fade>
				<div class="mb-3 text-4xl">⚠️</div>
				<p class="text-sm font-bold text-red-400">{error}</p>
				<button onclick={fetchTopPools} class="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20">
					Retry
				</button>
			</div>
		{/if}

		<!-- ── LOADING ───────────────────────────────────────────────── -->
		{#if loading && pairs.length === 0}
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{#each Array(20) as _}
					<div class="h-32 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]"></div>
				{/each}
			</div>
		{/if}

		<!-- ── COMPACT GRID VIEW ─────────────────────────────────────── -->
		{#if displayPairs.length && viewMode === 'grid'}
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" in:fade>
				{#each displayPairs.slice(0, 20) as pair, i (pair.id)}
					{@const ch = chainBadge(chain)}
					{@const isWatched = watchlist.has(pair.id)}
					<a href={`https://www.geckoterminal.com/${chain}/pools/${pair.id}`} target="_blank" rel="noopener"
						class="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2 backdrop-blur-md transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-0.5"
						in:fly={{ y: 10, duration: 200, delay: Math.min(i * 20, 200) }}>

						<!-- Card Glow Effect -->
						<div class="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-0 blur-[40px] transition-opacity duration-500 group-hover:opacity-60"
							style="background:{ch.color}"></div>

						<div class="relative">
							<!-- Header -->
							<div class="mb-1 flex items-start justify-between">
								<div class="flex items-center gap-1.5">
									{#if pair.baseToken?.image_url}
										<img src={pair.baseToken.image_url} alt="" class="h-7 w-7 rounded-full ring-1 ring-white/5" loading="lazy" />
									{:else}
										<div class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br {ch.gradient} text-xs font-black text-white/90">
											{pair.baseToken?.symbol?.[0] ?? '?'}
										</div>
									{/if}
									<div>
										<div class="flex items-center gap-1">
											<span class="text-xs font-black text-white">{pair.baseToken?.symbol ?? '?'}</span>
											{#if pair.quoteToken?.symbol}
												<span class="text-[8px] text-white/40">/ {pair.quoteToken?.symbol}</span>
											{/if}
										</div>
										<span class="rounded px-1 py-0 text-[7px] font-black" style="background:{ch.color}22;color:{ch.color}">{ch.label}</span>
									</div>
								</div>
								<button onclick={(e) => toggleWatchlist(pair.id, e)}
									class="text-sm transition-transform hover:scale-110 {isWatched ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400'}">
									{isWatched ? '★' : '☆'}
								</button>
							</div>

							<!-- Price & Change -->
							<div class="mb-1">
								<span class="text-sm font-black text-white">{fmtPrice(pair.priceUsd)}</span>
								{#if pair.priceChange?.h24}
									<span class="ml-1 text-xs font-bold {pctColor(parseFloat(pair.priceChange.h24))}">{pct(parseFloat(pair.priceChange.h24))}</span>
								{/if}
							</div>

							<!-- Compact Stats -->
							<div class="flex flex-wrap gap-1 text-[8px]">
								<span class="rounded bg-white/[0.05] px-1 py-0.5 text-white/60">V:{fmt(pair.volume?.h24)}</span>
								<span class="rounded bg-white/[0.05] px-1 py-0.5 text-white/60">L:{fmt(pair.liquidity)}</span>
								<span class="rounded bg-white/[0.05] px-1 py-0.5 text-white/60">T:{(pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0) || '—'}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- ── ULTRA COMPACT LIST VIEW ──────────────────────────────── -->
		{#if displayPairs.length && viewMode === 'compact'}
			<div class="overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md" in:fade>
				<div class="grid grid-cols-[2rem_1fr_5rem_4rem_5rem_5rem_2rem] items-center gap-1 border-b border-white/[0.08] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white/30">
					<span></span>
					<span>Pool</span>
					<span class="text-right">Price</span>
					<span class="text-right hidden sm:block">24h</span>
					<span class="text-right hidden sm:block">Volume</span>
					<span class="text-right hidden sm:block">Liquidity</span>
					<span></span>
				</div>
				{#each displayPairs.slice(0, 15) as pair, i (pair.id)}
					{@const ch = chainBadge(chain)}
					{@const isWatched = watchlist.has(pair.id)}
					<a href={`https://www.geckoterminal.com/${chain}/pools/${pair.id}`} target="_blank" rel="noopener"
						class="group grid grid-cols-[2rem_1fr_5rem_4rem_5rem_5rem_2rem] items-center gap-1 border-b border-white/[0.04] px-2 py-1 text-xs transition-all hover:bg-purple-500/5 hover:border-purple-500/20 last:border-0"
						in:fly={{ x: -10, duration: 200, delay: Math.min(i * 10, 200) }}>
						<div class="flex justify-center">
							{#if pair.baseToken?.image_url}
								<img src={pair.baseToken.image_url} alt="" class="h-5 w-5 rounded-full ring-1 ring-white/5" loading="lazy" />
							{:else}
								<div class="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br {ch.gradient} text-[8px] font-black text-white/90">
									{pair.baseToken?.symbol?.[0] ?? '?'}
								</div>
							{/if}
						</div>
						<div class="min-w-0">
							<div class="flex items-center gap-1">
								<span class="truncate font-bold text-white text-xs">{pair.baseToken?.symbol ?? '?'}</span>
								{#if pair.quoteToken?.symbol}
									<span class="text-[8px] text-white/40">/ {pair.quoteToken?.symbol}</span>
								{/if}
								<span class="rounded px-1 py-0 text-[7px] font-black" style="background:{ch.color}22;color:{ch.color}">{ch.label}</span>
							</div>
						</div>
						<p class="text-right font-bold text-white text-xs">{fmtPrice(pair.priceUsd)}</p>
						<p class="text-right hidden font-bold {pctColor(parseFloat(pair.priceChange?.h24))} sm:block text-xs">{pct(parseFloat(pair.priceChange?.h24))}</p>
						<p class="text-right hidden text-white/40 sm:block text-xs">{fmt(pair.volume?.h24)}</p>
						<p class="text-right hidden text-white/40 sm:block text-xs">{fmt(pair.liquidity)}</p>
						<div class="flex justify-center">
							<button onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(pair.id, e); }}
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
				<span>{displayPairs.length} pools · GeckoTerminal API · 60s updates</span>
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
