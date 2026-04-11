<script>
	import { onMount } from 'svelte';

	// ── COLOR SYSTEM (Crypto Blue/Purple spectrum) ──
	const cryptoColors = [
		{ ring: 'ring-blue-400', text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]', bar: 'bg-blue-400' },
		{ ring: 'ring-purple-400', text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.3)]', bar: 'bg-purple-400' },
		{ ring: 'ring-indigo-400', text: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/30', glow: 'shadow-[0_0_20px_rgba(129,140,248,0.3)]', bar: 'bg-indigo-400' },
		{ ring: 'ring-cyan-400', text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]', bar: 'bg-cyan-400' },
		{ ring: 'ring-violet-400', text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/30', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]', bar: 'bg-violet-400' },
	];

	// ── STATE ──
	let globalStats = $state(null);
	let trendingPairs = $state([]);
	let searchQuery = $state('');
	let searchResults = $state([]);
	let watchlist = $state([]);
	let searchLoading = $state(false);

	let sparklineData = $state(Array.from({ length: 12 }, () => Math.random() * 100));

	// ── API FUNCTIONS ──
	async function fetchGlobalStats() {
		try {
			const res = await fetch('https://api.coinlore.net/api/global/');
			const data = await res.json();
			globalStats = data.data[0];
		} catch (e) {
			console.error('Failed to fetch global stats:', e);
		}
	}

	async function fetchTrendingPairs() {
		try {
			// Using DEX Screener search for trending pairs
			const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=WETH');
			const data = await res.json();
			if (data.pairs) {
				trendingPairs = data.pairs.slice(0, 12).map((pair, i) => ({
					...pair,
					color: cryptoColors[i % cryptoColors.length]
				}));
			}
		} catch (e) {
			console.error('Failed to fetch trending pairs:', e);
		}
	}

	async function searchPairs(query) {
		if (!query || query.length < 2) {
			searchResults = [];
			return;
		}

		searchLoading = true;
		try {
			const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
			const data = await res.json();
			if (data.pairs) {
				searchResults = data.pairs.slice(0, 20).map((pair, i) => ({
					...pair,
					color: cryptoColors[i % cryptoColors.length]
				}));
			}
		} catch (e) {
			console.error('Failed to search pairs:', e);
		} finally {
			searchLoading = false;
		}
	}

	// ── WATCHLIST FUNCTIONS ──
	function addToWatchlist(pair) {
		if (!watchlist.find(w => w.pairAddress === pair.pairAddress)) {
			watchlist = [...watchlist, pair];
			localStorage.setItem('cryptoWatchlist', JSON.stringify(watchlist));
		}
	}

	function removeFromWatchlist(pairAddress) {
		watchlist = watchlist.filter(w => w.pairAddress !== pairAddress);
		localStorage.setItem('cryptoWatchlist', JSON.stringify(watchlist));
	}

	function loadWatchlist() {
		const saved = localStorage.getItem('cryptoWatchlist');
		if (saved) {
			watchlist = JSON.parse(saved);
		}
	}

	// ── FORMATTERS ──
	function formatCompactUSD(value) {
		if (!value) return '$0';
		const num = parseFloat(value);
		if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
		if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
		if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
		if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K';
		return '$' + num.toFixed(2);
	}

	function formatPercent(value) {
		if (!value) return '0%';
		const num = parseFloat(value);
		const sign = num >= 0 ? '+' : '';
		return sign + num.toFixed(2) + '%';
	}

	// ── DERIVED STATE ──
	let filteredTrending = $derived(
		searchQuery 
			? trendingPairs.filter(p => 
				p.baseToken.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.quoteToken.symbol.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: trendingPairs
	);

	// ── DEBOUNCE SEARCH ──
	let searchTimeout;
	$effect(() => {
		if (searchQuery) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => searchPairs(searchQuery), 300);
		}
	});

	onMount(() => {
		loadWatchlist();
		fetchGlobalStats();
		fetchTrendingPairs();

		// Update sparklines periodically
		const interval = setInterval(() => {
			sparklineData = sparklineData.map(() => Math.random() * 100);
		}, 3000);

		// Refresh data periodically
		const refreshInterval = setInterval(() => {
			fetchGlobalStats();
			fetchTrendingPairs();
		}, 60000);

		return () => {
			clearInterval(interval);
			clearInterval(refreshInterval);
		};
	});
</script>

<div class="relative min-h-screen overflow-hidden bg-[#0d1117] text-white font-sans">

	<!-- Ambient background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]"></div>
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">

		<!-- ── HEADER ── -->
		<header class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
			<div class="flex items-start gap-4">
				<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 text-3xl shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/20">
					📊
				</div>
				<div>
					<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl">
						MyDex
						<span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Board</span>
					</h1>
					<p class="mt-2 max-w-lg text-sm text-white/40">Real-time crypto analytics powered by public APIs.</p>
					<div class="mt-3 flex items-center gap-4">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 animate-pulse rounded-full bg-blue-400"></div>
							<span class="text-[10px] font-bold uppercase tracking-wider text-blue-400/60">Live</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Search Bar -->
			<div class="relative w-full lg:w-96">
				<input 
					type="text" 
					placeholder="Search tokens, pairs, addresses..." 
					bind:value={searchQuery}
					class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
				/>
				{#if searchLoading}
					<div class="absolute right-3 top-1/2 -translate-y-1/2">
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
					</div>
				{/if}
			</div>
		</header>

		<!-- ── SEARCH RESULTS ── -->
		{#if searchResults.length > 0}
			<div class="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm">
				<h2 class="mb-4 text-lg font-bold text-white">Search Results</h2>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each searchResults as result (result.pairAddress)}
						<div class="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:bg-white/5 transition">
							<div class="flex items-center gap-3">
								<div class="h-10 w-10 rounded-full {result.color.bg} flex items-center justify-center text-lg">
									{result.baseToken.symbol.charAt(0)}
								</div>
								<div>
									<p class="text-sm font-bold text-white">{result.baseToken.symbol}/{result.quoteToken.symbol}</p>
									<p class="text-[10px] text-white/40">{result.dexId} • {result.chainId}</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm font-bold text-white">${result.priceUsd || '0'}</p>
								<p class="text-[10px] {parseFloat(result.priceChange?.h24 || 0) >= 0 ? 'text-green-400' : 'text-red-400'}">
									{formatPercent(result.priceChange?.h24)}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ── GLOBAL STATS ── -->
		{#if globalStats}
			<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
				{#each [
					{ label: 'Market Cap', value: formatCompactUSD(globalStats.total_mcap), icon: '💰', key: 'mcap' },
					{ label: '24h Volume', value: formatCompactUSD(globalStats.total_volume), icon: '📈', key: 'volume' },
					{ label: 'BTC Dominance', value: globalStats.btc_d + '%', icon: '₿', key: 'btc' },
					{ label: 'ETH Dominance', value: globalStats.eth_d + '%', icon: 'Ξ', key: 'eth' },
					{ label: 'Active Coins', value: globalStats.coins_count, icon: '🪙', key: 'coins' },
					{ label: 'Active Markets', value: globalStats.active_markets, icon: '📊', key: 'markets' },
				] as stat (stat.key)}
					<div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
						<div class="flex justify-between items-start mb-2">
							<p class="text-[10px] uppercase tracking-widest text-white/30">{stat.icon} {stat.label}</p>
						</div>
						<p class="text-xl font-extrabold text-white">{stat.value}</p>
						<div class="mt-3 h-6 flex items-end gap-0.5">
							{#each sparklineData as height, idx (idx)}
								<div class="flex-1 bg-gradient-to-t from-blue-400/10 to-blue-400/30 rounded-t transition-all" style="height: {height}%"></div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- ── TRENDING PAIRS ── -->
		<div class="mb-8">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-black text-white">Trending Pairs</h2>
				<div class="flex items-center gap-2">
					<span class="text-[10px] font-bold uppercase tracking-wider text-white/30">Powered by</span>
					<span class="text-xs font-bold text-blue-400">DEX Screener</span>
				</div>
			</div>

			{#if trendingPairs.length === 0}
				<div class="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
					<p class="text-white/40">Loading trending pairs...</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredTrending as pair (pair.pairAddress)}
						<div class="group relative overflow-hidden rounded-xl border {pair.color.border} bg-white/[0.015] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:{pair.color.glow}">
							
							<!-- Ambient glow -->
							<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full {pair.color.bg} blur-2xl opacity-0 transition-opacity group-hover:opacity-100"></div>

							<!-- Header -->
							<div class="relative z-10 mb-4 flex items-start justify-between">
								<div class="flex items-center gap-3">
									<div class="h-10 w-10 rounded-full {pair.color.bg} flex items-center justify-center text-lg">
										{pair.baseToken.symbol.charAt(0)}
									</div>
									<div>
										<h3 class="text-sm font-bold text-white group-hover:{pair.color.text} transition-colors">
											{pair.baseToken.symbol}/{pair.quoteToken.symbol}
										</h3>
										<p class="text-[10px] text-white/40">{pair.dexId} • {pair.chainId}</p>
									</div>
								</div>
								<button 
									onclick={() => addToWatchlist(pair)}
									class="text-white/40 hover:text-white/70 transition"
								>
									★
								</button>
							</div>

							<!-- Price -->
							<div class="relative z-10 mb-4">
								<p class="text-2xl font-black text-white">${pair.priceUsd || '0'}</p>
								<p class="text-xs {parseFloat(pair.priceChange?.h24 || 0) >= 0 ? 'text-green-400' : 'text-red-400'}">
									{formatPercent(pair.priceChange?.h24)}
								</p>
							</div>

							<!-- Metrics -->
							<div class="relative z-10 mb-4 grid grid-cols-2 gap-2 text-[10px]">
								<div>
									<p class="text-white/30">Liquidity</p>
									<p class="font-bold text-white">{formatCompactUSD(pair.liquidity?.usd)}</p>
								</div>
								<div>
									<p class="text-white/30">24h Volume</p>
									<p class="font-bold text-white">{formatCompactUSD(pair.volume?.h24)}</p>
								</div>
								<div>
									<p class="text-white/30">FDV</p>
									<p class="font-bold text-white">{formatCompactUSD(pair.fdv)}</p>
								</div>
								<div>
									<p class="text-white/30">Market Cap</p>
									<p class="font-bold text-white">{formatCompactUSD(pair.marketCap)}</p>
								</div>
							</div>

							<!-- Action -->
							<a href={pair.url} target="_blank" rel="noopener"
								class="relative z-10 flex items-center justify-center gap-2 rounded-lg {pair.color.bg} border {pair.color.border} py-2 text-[10px] font-bold {pair.color.text} transition hover:{pair.color.bg}">
								<span>View on DEX Screener</span>
								<span>→</span>
							</a>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- ── WATCHLIST ── -->
		{#if watchlist.length > 0}
			<div class="mb-8">
				<h2 class="mb-4 text-2xl font-black text-white">Watchlist</h2>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each watchlist as item (item.pairAddress)}
						<div class="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm">
							<div class="flex items-center gap-3">
								<div class="h-10 w-10 rounded-full bg-blue-400/10 flex items-center justify-center text-lg">
									{item.baseToken.symbol.charAt(0)}
								</div>
								<div>
									<p class="text-sm font-bold text-white">{item.baseToken.symbol}/{item.quoteToken.symbol}</p>
									<p class="text-[10px] text-white/40">{item.dexId} • {item.chainId}</p>
								</div>
							</div>
							<div class="flex items-center gap-4">
								<div class="text-right">
									<p class="text-sm font-bold text-white">${item.priceUsd || '0'}</p>
									<p class="text-[10px] {parseFloat(item.priceChange?.h24 || 0) >= 0 ? 'text-green-400' : 'text-red-400'}">
										{formatPercent(item.priceChange?.h24)}
									</p>
								</div>
								<button 
									onclick={() => removeFromWatchlist(item.pairAddress)}
									class="text-white/40 hover:text-red-400 transition"
								>
									✕
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

	</div>
</div>
