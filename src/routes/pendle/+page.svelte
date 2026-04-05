<script>
	import { onMount } from 'svelte';

	// ── STATE ──
	let markets = $state([]);
	let loading = $state(true);
	let error = $state(null);
	let selectedChain = $state('all');
	let selectedAsset = $state('all');
	let viewMode = $state('grid'); // grid | list
	let expandedMarket = $state(null);
	let searchQuery = $state('');

	// ── DATA ──
	const chains = [
		{ id: 'all', name: 'All Chains', icon: '⛓️' },
		{ id: 'ethereum', name: 'Ethereum', icon: '◆' },
		{ id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
		{ id: 'optimism', name: 'Optimism', icon: '🔴' },
		{ id: 'bnb', name: 'BSC', icon: '🟡' },
		{ id: 'base', name: 'Base', icon: '🔵' },
		{ id: 'mantle', name: 'Mantle', icon: '🟣' },
		{ id: 'sophon', name: 'Sophon', icon: '🌟' }
	];

	const assets = [
		{ id: 'all', name: 'All Assets', icon: '📊' },
		{ id: 'eth', name: 'ETH', icon: '◆' },
		{ id: 'usdc', name: 'USDC', icon: '💵' },
		{ id: 'usdt', name: 'USDT', icon: '💲' },
		{ id: 'wbtc', name: 'WBTC', icon: '₿' },
		{ id: 'susde', name: 'sUSDe', icon: '⚡' },
		{ id: 'eeth', name: 'eETH', icon: '🔷' },
		{ id: 'weeth', name: 'weETH', icon: '🌿' },
		{ id: 'rseth', name: 'rsETH', icon: '🏛️' },
		{ id: 'solvbtc', name: 'SolvBTC', icon: '🟠' }
	];

	const ptColors = {
		'PT-sUSDe': { from: 'from-purple-500', to: 'to-pink-500', accent: 'text-purple-400', bg: 'bg-purple-500/20' },
		'PT-weETH': { from: 'from-blue-500', to: 'to-cyan-500', accent: 'text-blue-400', bg: 'bg-blue-500/20' },
		'PT-eETH': { from: 'from-indigo-500', to: 'to-violet-500', accent: 'text-indigo-400', bg: 'bg-indigo-500/20' },
		'PT-rsETH': { from: 'from-amber-500', to: 'to-orange-500', accent: 'text-amber-400', bg: 'bg-amber-500/20' },
		'PT-USDe': { from: 'from-emerald-500', to: 'to-green-500', accent: 'text-emerald-400', bg: 'bg-emerald-500/20' },
		'PT-wstETH': { from: 'from-cyan-500', to: 'to-teal-500', accent: 'text-cyan-400', bg: 'bg-cyan-500/20' },
		'PT-SolvBTC': { from: 'from-orange-500', to: 'to-amber-500', accent: 'text-orange-400', bg: 'bg-orange-500/20' },
		default: { from: 'from-violet-500', to: 'to-purple-500', accent: 'text-violet-400', bg: 'bg-violet-500/20' }
	};

	// ── HELPERS ──
	const getMarketColor = (name) => {
		for (const [key, color] of Object.entries(ptColors)) {
			if (name?.toLowerCase().includes(key.toLowerCase().replace('PT-', ''))) return color;
		}
		return ptColors.default;
	};

	const fmtApy = (apy) => {
		if (!apy || isNaN(apy)) return '--';
		return `${apy.toFixed(2)}%`;
	};

	const fmtPrice = (price) => {
		if (!price || isNaN(price)) return '--';
		if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
		if (price >= 1) return `$${price.toFixed(2)}`;
		return `$${price.toFixed(4)}`;
	};

	const fmtTvl = (tvl) => {
		if (!tvl || isNaN(tvl)) return '--';
		if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
		if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
		if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(1)}K`;
		return `$${tvl.toFixed(0)}`;
	};

	const fmtDate = (timestamp) => {
		if (!timestamp) return '--';
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const daysToExpiry = (timestamp) => {
		if (!timestamp) return 0;
		const now = Date.now() / 1000;
		const days = Math.floor((timestamp - now) / 86400);
		return Math.max(0, days);
	};

	const calcImpliedApy = (ptPrice, daysToMaturity) => {
		if (!ptPrice || daysToMaturity <= 0 || ptPrice >= 1) return 0;
		const years = daysToMaturity / 365;
		const implied = (1 / ptPrice - 1) / years;
		return Math.max(0, Math.min(implied * 100, 50)); // Cap at 50% to avoid extreme values
	};

	const calcYtYield = (underlyingApy, ptApy) => {
		if (!underlyingApy || !ptApy) return 0;
		return Math.max(0, underlyingApy - ptApy);
	};

	// ── MOCK DATA ──
	// Future expiry dates (relative to current time) for realistic yields
	const now = Math.floor(Date.now() / 1000);
	const DAY = 86400;
	const mockMarkets = [
		{ id: 'susde-26jun25', name: 'PT-sUSDe', underlying: 'sUSDe', chain: 'ethereum', ptPrice: 0.9712, underlyingApy: 17.45, tvl: 845000000, expiry: now + 80 * DAY, ytLiquidity: 23400000 },
		{ id: 'susde-25sep25', name: 'PT-sUSDe', underlying: 'sUSDe', chain: 'ethereum', ptPrice: 0.9350, underlyingApy: 17.45, tvl: 623000000, expiry: now + 170 * DAY, ytLiquidity: 18700000 },
		{ id: 'weeth-26jun25', name: 'PT-weETH', underlying: 'weETH', chain: 'ethereum', ptPrice: 0.9456, underlyingApy: 3.82, tvl: 445000000, expiry: now + 80 * DAY, ytLiquidity: 12300000 },
		{ id: 'eeth-25sep25', name: 'PT-eETH', underlying: 'eETH', chain: 'arbitrum', ptPrice: 0.9200, underlyingApy: 3.65, tvl: 312000000, expiry: now + 170 * DAY, ytLiquidity: 8900000 },
		{ id: 'rseth-26jun25', name: 'PT-rsETH', underlying: 'rsETH', chain: 'ethereum', ptPrice: 0.9567, underlyingApy: 4.12, tvl: 278000000, expiry: now + 80 * DAY, ytLiquidity: 6700000 },
		{ id: 'usde-26jun25', name: 'PT-USDe', underlying: 'USDe', chain: 'ethereum', ptPrice: 0.9834, underlyingApy: 12.34, tvl: 456000000, expiry: now + 80 * DAY, ytLiquidity: 15600000 },
		{ id: 'wsteth-25sep25', name: 'PT-wstETH', underlying: 'wstETH', chain: 'optimism', ptPrice: 0.9400, underlyingApy: 3.45, tvl: 198000000, expiry: now + 170 * DAY, ytLiquidity: 4500000 },
		{ id: 'solvbtc-26jun25', name: 'PT-SolvBTC', underlying: 'SolvBTC', chain: 'mantle', ptPrice: 0.9789, underlyingApy: 8.76, tvl: 234000000, expiry: now + 80 * DAY, ytLiquidity: 7800000 },
		{ id: 'susde-25dec25', name: 'PT-sUSDe', underlying: 'sUSDe', chain: 'arbitrum', ptPrice: 0.9000, underlyingApy: 17.45, tvl: 567000000, expiry: now + 260 * DAY, ytLiquidity: 14500000 },
		{ id: 'weeth-25sep25', name: 'PT-weETH', underlying: 'weETH', chain: 'base', ptPrice: 0.9250, underlyingApy: 3.82, tvl: 234000000, expiry: now + 170 * DAY, ytLiquidity: 5600000 }
	];

	// ── FETCH ──
	async function fetchMarkets() {
		loading = true;
		error = null;
		try {
			await new Promise(r => setTimeout(r, 800));
			markets = mockMarkets.map(m => ({
				...m,
				ptApy: calcImpliedApy(m.ptPrice, daysToExpiry(m.expiry)),
				ytApy: calcYtYield(m.underlyingApy, calcImpliedApy(m.ptPrice, daysToExpiry(m.expiry))),
				daysLeft: daysToExpiry(m.expiry)
			}));
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	// ── COMPUTED ──
	let filteredMarkets = $derived(markets.filter(m => {
		if (selectedChain !== 'all' && m.chain !== selectedChain) return false;
		if (selectedAsset !== 'all' && !m.underlying.toLowerCase().includes(selectedAsset.toLowerCase())) return false;
		if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.underlying.toLowerCase().includes(searchQuery.toLowerCase())) return false;
		return true;
	}));

	let stats = $derived({
		totalMarkets: markets.length,
		totalTvl: markets.reduce((acc, m) => acc + m.tvl, 0),
		avgPtApy: markets.length ? markets.reduce((acc, m) => acc + m.ptApy, 0) / markets.length : 0,
		topApy: markets.length ? Math.max(...markets.map(m => m.ptApy)) : 0
	});

	onMount(() => {
		fetchMarkets();
		const interval = setInterval(fetchMarkets, 30000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>PendleFi | Yield Tokenization</title>
	<meta name="description" content="Trade PT and YT tokens. Earn fixed yields or speculate on yield movements." />
</svelte:head>

<div class="min-h-screen bg-[#0a0b0f] text-white font-sans">
	<!-- Ambient Background -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden">
		<div class="absolute -top-40 right-1/4 h-[600px] w-[600px] rounded-full bg-violet-500/5 blur-[180px]"></div>
		<div class="absolute top-1/3 -left-20 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[120px]"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- ── HEADER ── -->
		<div class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<div class="mb-2 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-xl shadow-lg shadow-violet-500/20">
						⚡
					</div>
					<div class="flex items-center gap-2">
						<span class="text-xs font-black tracking-[0.3em] text-violet-400 uppercase">JamCat DeFi</span>
						<span class="flex h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
					</div>
				</div>
				<h1 class="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
					<span class="bg-gradient-to-r from-white via-violet-200 to-purple-400 bg-clip-text text-transparent">
						PendleFi
					</span>
				</h1>
				<p class="mt-2 max-w-lg text-sm text-slate-400">
					Yield tokenization protocol. Split yield-bearing assets into Principal Tokens (PT) and Yield Tokens (YT). 
					Earn fixed yields or trade yield speculation.
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<button onclick={() => viewMode = 'grid'}
					class="rounded-full border px-4 py-2 text-xs font-bold transition-all {viewMode === 'grid' ? 'border-violet-500/50 bg-violet-500/20 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'}">
					⊞ Grid
				</button>
				<button onclick={() => viewMode = 'list'}
					class="rounded-full border px-4 py-2 text-xs font-bold transition-all {viewMode === 'list' ? 'border-violet-500/50 bg-violet-500/20 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'}">
					☰ List
				</button>
				<button onclick={fetchMarkets} disabled={loading}
					class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400 transition-all hover:border-white/20 hover:bg-white/10 disabled:opacity-50">
					{#if loading}<span class="animate-spin">⟳</span>{:else}↻{/if}
				</button>
			</div>
		</div>

		<!-- ── STATS BAR ── -->
		<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
				<div class="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
					<span>📊</span> Active Markets
				</div>
				<p class="text-2xl font-black text-white">{stats.totalMarkets}</p>
			</div>
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
				<div class="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
					<span>💰</span> Total TVL
				</div>
				<p class="text-2xl font-black text-violet-300">{fmtTvl(stats.totalTvl)}</p>
			</div>
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
				<div class="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
					<span>📈</span> Avg PT APY
				</div>
				<p class="text-2xl font-black text-emerald-400">{stats.avgPtApy.toFixed(2)}%</p>
			</div>
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
				<div class="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
					<span>🔥</span> Highest PT APY
				</div>
				<p class="text-2xl font-black text-amber-400">{stats.topApy.toFixed(2)}%</p>
			</div>
		</div>

		<!-- ── FILTERS ── -->
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs font-bold text-slate-500 uppercase tracking-wide">Chain:</span>
				{#each chains as chain}
					<button onclick={() => selectedChain = chain.id}
						class="rounded-full border px-3 py-1.5 text-xs font-bold transition-all {selectedChain === chain.id ? 'border-violet-500/50 bg-violet-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'}">
						<span class="mr-1">{chain.icon}</span>{chain.name}
					</button>
				{/each}
			</div>
			<div class="flex items-center gap-2">
				<span class="text-xs font-bold text-slate-500 uppercase tracking-wide">Asset:</span>
				<select bind:value={selectedAsset} class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white focus:border-violet-500/50 focus:outline-none">
					{#each assets as asset}
						<option value={asset.id}>{asset.icon} {asset.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- ── SEARCH ── -->
		<div class="mb-6">
			<div class="relative max-w-md">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
				<input bind:value={searchQuery} placeholder="Search PT markets..."
					class="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:shadow-[0_0_15px_rgba(139,92,246,0.1)]" />
			</div>
		</div>

		<!-- ── CONTENT ── -->
		{#if loading}
			<div class="flex h-64 flex-col items-center justify-center gap-4">
				<div class="relative">
					<div class="h-14 w-14 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
					<div class="absolute inset-0 h-14 w-14 animate-pulse rounded-full border-4 border-violet-500/30"></div>
				</div>
				<p class="text-sm font-bold tracking-widest text-slate-500 uppercase">Loading yield markets...</p>
			</div>
		{:else if error}
			<div class="rounded-2xl border border-red-500/20 bg-red-500/10 p-12 text-center">
				<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-3xl">⚠️</div>
				<h2 class="text-xl font-bold text-red-400">Failed to load markets</h2>
				<p class="mt-2 text-sm text-slate-400">{error}</p>
				<button onclick={fetchMarkets} class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20">↻ Retry</button>
			</div>
		{:else if filteredMarkets.length === 0}
			<div class="rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center">
				<p class="mb-2 text-4xl">∅</p>
				<p class="text-sm font-bold text-slate-400">No markets match your filters</p>
			</div>
		{:else}
			{#if viewMode === 'grid'}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each filteredMarkets as market, i (market.id)}
						{@const colors = getMarketColor(market.name)}
						{@const isExpanded = expandedMarket === market.id}
						<div class="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-violet-500/10"
							style="animation:fadeUp 0.4s ease {i * 50}ms backwards">
							
							<!-- Glow -->
							<div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br {colors.from} to-transparent opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-100"></div>

							<!-- Header -->
							<div class="relative mb-4 flex items-start justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br {colors.from} {colors.to} text-sm font-bold text-white shadow-lg">
										{market.underlying.slice(0, 2)}
									</div>
									<div>
										<p class="text-sm font-bold text-white">{market.name}</p>
										<p class="text-[10px] text-slate-500">{market.chain}</p>
									</div>
								</div>
								<span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
									{market.daysLeft}d left
								</span>
							</div>

							<!-- APY Display -->
							<div class="relative mb-4 grid grid-cols-2 gap-3">
								<div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
									<p class="mb-1 text-[10px] font-bold text-slate-500 uppercase">Fixed APY</p>
									<p class="text-xl font-black {colors.accent}">{market.ptApy.toFixed(2)}%</p>
								</div>
								<div class="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
									<p class="mb-1 text-[10px] font-bold text-slate-500 uppercase">Implied APY</p>
									<p class="text-xl font-black text-emerald-400">{market.ytApy.toFixed(2)}%</p>
								</div>
							</div>

							<!-- Price & TVL -->
							<div class="relative mb-4 flex items-center justify-between text-xs">
								<div>
									<p class="text-slate-500">PT Price</p>
									<p class="font-bold text-white">{fmtPrice(market.ptPrice)}</p>
								</div>
								<div class="text-right">
									<p class="text-slate-500">TVL</p>
									<p class="font-bold text-white">{fmtTvl(market.tvl)}</p>
								</div>
							</div>

							<!-- Expand Button -->
							<button onclick={() => expandedMarket = isExpanded ? null : market.id}
								class="relative w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-400 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300">
								{isExpanded ? '▲ Hide Details' : '▼ Show Details'}
							</button>

							<!-- Expanded Details -->
							{#if isExpanded}
								<div class="relative mt-4 space-y-3 border-t border-white/[0.06] pt-4" style="animation:expand 0.3s ease">
									<div class="grid grid-cols-2 gap-2 text-xs">
										<div class="flex justify-between">
											<span class="text-slate-500">Underlying APY</span>
											<span class="font-bold text-white">{market.underlyingApy}%</span>
										</div>
										<div class="flex justify-between">
											<span class="text-slate-500">YT Liquidity</span>
											<span class="font-bold text-white">{fmtTvl(market.ytLiquidity)}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-slate-500">Maturity</span>
											<span class="font-bold text-white">{fmtDate(market.expiry)}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-slate-500">PT Discount</span>
											<span class="font-bold text-emerald-400">{((1 - market.ptPrice) * 100).toFixed(2)}%</span>
										</div>
									</div>
									<a href={`https://app.pendle.finance/trade/markets/{market.chain}/{market.id}`} target="_blank" rel="noopener"
										class="block rounded-xl border border-violet-500/30 bg-violet-500/10 py-3 text-center text-xs font-bold text-violet-300 transition hover:bg-violet-500/20">
										Trade on Pendle ↗
									</a>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<!-- List View -->
				<div class="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
					<div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] items-center gap-4 border-b border-white/[0.06] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
						<span>Market</span>
						<span class="text-right">Chain</span>
						<span class="text-right">Days</span>
						<span class="text-right">PT APY</span>
						<span class="text-right">YT APY</span>
						<span class="text-right">TVL</span>
					</div>
					{#each filteredMarkets as market, i (market.id)}
						{@const colors = getMarketColor(market.name)}
						<div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] items-center gap-4 border-b border-white/[0.04] px-4 py-3 transition hover:bg-white/[0.03] last:border-0"
							style="animation:slideRight 0.3s ease {i * 30}ms backwards">
							<div class="flex items-center gap-2">
								<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br {colors.from} {colors.to} text-xs font-bold text-white">
									{market.underlying.slice(0, 2)}
								</div>
								<div>
									<p class="text-sm font-bold text-white">{market.name}</p>
									<p class="text-[10px] text-slate-500">{fmtPrice(market.ptPrice)}</p>
								</div>
							</div>
							<p class="text-right text-xs text-slate-400">{market.chain}</p>
							<p class="text-right text-xs font-bold text-slate-400">{market.daysLeft}d</p>
							<p class="text-right text-sm font-bold {colors.accent}">{market.ptApy.toFixed(2)}%</p>
							<p class="text-right text-sm font-bold text-emerald-400">{market.ytApy.toFixed(2)}%</p>
							<p class="text-right text-xs font-bold text-white">{fmtTvl(market.tvl)}</p>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- ── FOOTER ── -->
		<div class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 sm:flex-row">
			<div class="flex items-center gap-2">
				<div class="relative">
					<div class="h-1.5 w-1.5 rounded-full bg-violet-400"></div>
					<div class="absolute inset-0 animate-ping rounded-full bg-violet-400/20"></div>
				</div>
				<p class="text-xs text-slate-500">Data updated every 30s · Powered by Pendle</p>
			</div>
			<a href="https://pendle.finance" target="_blank" rel="noopener"
				class="flex items-center gap-2 text-xs font-bold text-violet-400 transition hover:text-violet-300">
				Visit Pendle Finance ↗
			</a>
		</div>
	</div>
</div>

<style>
	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(15px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes slideRight {
		from { opacity: 0; transform: translateX(-10px); }
		to { opacity: 1; transform: translateX(0); }
	}
	@keyframes expand {
		from { opacity: 0; max-height: 0; }
		to { opacity: 1; max-height: 300px; }
	}
</style>
