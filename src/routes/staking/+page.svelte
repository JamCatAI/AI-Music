<script>
	import { onMount } from 'svelte';

	let pools = $state([]);
	let loading = $state(true);
	let error = $state(null);
	let searchQuery = $state('');
	let selectedChain = $state('all');
	let selectedCategory = $state('all');
	let sortKey = $state('tvlUsd');
	let sortDir = $state(-1);
	let lastUpdated = $state(null);
	let stakeAmount = $state(1000);
	let stakeDuration = $state(365);
	let compoundFreq = $state(365);
	let view = $state('grid');
	let expandedPool = $state(null);
	let favorites = $state(new Set());
	let compareMode = $state(false);
	let compareList = $state([]);
	let hoveredPool = $state(null);
	let selectedTimeRange = $state('1y');
	let showAdvancedFilters = $state(false);
	let minApy = $state(0);
	let maxApy = $state(100);
	let minTvl = $state(0);
	let riskFilter = $state('all');

	const CHAINS = [
		{ key: 'all', label: 'All Chains', emoji: '🌐', color: '#6366f1' },
		{ key: 'Ethereum', label: 'Ethereum', emoji: '⟠', color: '#627eea' },
		{ key: 'Solana', label: 'Solana', emoji: '◎', color: '#9945ff' },
		{ key: 'Arbitrum', label: 'Arbitrum', emoji: '🔵', color: '#28a0f0' },
		{ key: 'Base', label: 'Base', emoji: '🔷', color: '#0052ff' },
		{ key: 'BSC', label: 'BSC', emoji: '🟡', color: '#f0b90b' },
		{ key: 'Avalanche', label: 'Avalanche', emoji: '🔺', color: '#e84142' },
		{ key: 'Polygon', label: 'Polygon', emoji: '🟣', color: '#8247e5' }
	];

	const CATEGORIES = [
		{ key: 'all', label: 'All Types', emoji: '📊', color: '#6366f1' },
		{ key: 'liquid-staking', label: 'Liquid Staking', emoji: '💧', color: '#06b6d4' },
		{ key: 'lending', label: 'Lending', emoji: '🏦', color: '#10b981' },
		{ key: 'dexes', label: 'DEX LP', emoji: '🔄', color: '#f59e0b' },
		{ key: 'yield', label: 'Yield Aggregator', emoji: '🌾', color: '#8b5cf6' },
		{ key: 'cdp', label: 'CDP', emoji: '📦', color: '#ef4444' }
	];

	const RISK_LEVELS = [
		{ key: 'all', label: 'All Risks', emoji: '🎯', color: '#6366f1' },
		{ key: 'low', label: 'Low Risk', emoji: '🛡️', color: '#10b981' },
		{ key: 'medium', label: 'Medium Risk', emoji: '⚖️', color: '#f59e0b' },
		{ key: 'high', label: 'High Risk', emoji: '🔥', color: '#ef4444' }
	];

	const TIME_RANGES = [
		{ key: '30d', label: '30 Days', days: 30 },
		{ key: '90d', label: '90 Days', days: 90 },
		{ key: '1y', label: '1 Year', days: 365 },
		{ key: '2y', label: '2 Years', days: 730 }
	];

	const PROTOCOL_COLORS = {
		'lido': '#00A3FF', 'aave': '#B6509E', 'compound': '#00D395',
		'makerdao': '#1AAB9B', 'convex': '#3A3A3A', 'curve': '#FCEE21',
		'rocket-pool': '#FF8C00', 'jito': '#00C2A0', 'marinade': '#FF6B35',
		'pancakeswap': '#D1884F', 'uniswap': '#FF007A', 'gmx': '#3DC6C0',
		'pendle': '#05D9A1', 'eigenlayer': '#7B61FF', 'ethena': '#111',
		'raydium': '#6C5DD3', 'orca': '#FFD159', 'jupiter': '#2AB1E5',
		'morpho': '#5B98E6', 'fluid': '#6C5CE7', 'kamino': '#FF6B6B',
		'default': '#10B981'
	};

	function protocolColor(name) {
		const key = Object.keys(PROTOCOL_COLORS).find(k => name?.toLowerCase().includes(k));
		return PROTOCOL_COLORS[key] ?? PROTOCOL_COLORS.default;
	}

	function apyColor(apy) {
		if (apy >= 20) return '#ef4444';
		if (apy >= 10) return '#f59e0b';
		if (apy >= 5) return '#10b981';
		return '#6366f1';
	}

	function riskLevel(pool) {
		if (pool.apy > 50) return { label: 'High', color: '#ef4444' };
		if (pool.apy > 15) return { label: 'Med', color: '#f59e0b' };
		return { label: 'Low', color: '#10b981' };
	}

	async function fetchPools() {
		loading = true; error = null;
		try {
			const res = await fetch('https://yields.llama.fi/pools');
			if (!res.ok) throw new Error(`DeFiLlama ${res.status}`);
			const data = await res.json();
			pools = (data.data ?? [])
				.filter(p => p.tvlUsd > 100_000 && p.apy > 0 && p.apy < 500)
				.slice(0, 500);
			lastUpdated = new Date();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	let filtered = $derived(
		pools
			.filter(p => {
				if (searchQuery) {
					const q = searchQuery.toLowerCase();
					return p.project?.toLowerCase().includes(q) || p.symbol?.toLowerCase().includes(q) || p.chain?.toLowerCase().includes(q);
				}
				return true;
			})
			.filter(p => selectedChain === 'all' || p.chain === selectedChain)
			.filter(p => {
				if (selectedCategory === 'all') return true;
				return p.category?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
			})
			.sort((a, b) => {
				const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
				return sortDir * (av - bv);
			})
	);

	let stats = $derived({
		count: filtered.length,
		avgApy: filtered.length ? filtered.reduce((s, p) => s + p.apy, 0) / filtered.length : 0,
		totalTvl: filtered.reduce((s, p) => s + (p.tvlUsd ?? 0), 0),
		maxApy: filtered.length ? Math.max(...filtered.map(p => p.apy)) : 0
	});

	let topByApy = $derived(
		[...pools].filter(p => p.tvlUsd > 1_000_000).sort((a, b) => b.apy - a.apy).slice(0, 6)
	);

	let topByTvl = $derived(
		[...pools].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 6)
	);

	function setSort(key) {
		if (sortKey === key) sortDir = -sortDir;
		else { sortKey = key; sortDir = -1; }
	}

	function sortArrow(key) {
		if (sortKey !== key) return '';
		return sortDir === -1 ? ' ↓' : ' ↑';
	}

	function fmtTvl(n) {
		if (n == null) return '—';
		if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
		if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
		if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
		return `$${n.toFixed(0)}`;
	}

	function calcEarnings(apr, amount, days, compound) {
		const r = apr / 100;
		const t = days / 365;
		const n = compound / 365 * 365; // compounds per year
		return amount * Math.pow(1 + r / n, n * t) - amount;
	}

	function fakeSpark(seed) {
		let s = seed?.charCodeAt(0) * 7 + (seed?.charCodeAt(1) || 3) * 13;
		const pts = [];
		for (let i = 0; i < 12; i++) {
			s = (s * 16807 + 11) % 2147483647;
			pts.push(20 + (s % 60));
		}
		return pts;
	}

	function sparkLine(pts) {
		const w = 60, h = 16;
		const min = Math.min(...pts), max = Math.max(...pts);
		const range = max - min || 1;
		return pts.map((p, i) => {
			const x = (i / (pts.length - 1)) * w;
			const y = h - ((p - min) / range) * h;
			return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
		}).join(' ');
	}

	function toggleFav(poolId) {
		const next = new Set(favorites);
		if (next.has(poolId)) next.delete(poolId);
		else next.add(poolId);
		favorites = next;
	}

	function toggleCompare(pool) {
		const idx = compareList.findIndex(p => p.pool === pool.pool);
		if (idx >= 0) compareList = compareList.filter(p => p.pool !== pool.pool);
		else if (compareList.length < 4) compareList = [...compareList, pool];
	}

	let compareData = $derived(
		compareList.map(p => ({
			...p,
			earn30: calcEarnings(p.apy, stakeAmount, 30, compoundFreq),
			earn365: calcEarnings(p.apy, stakeAmount, 365, compoundFreq),
			earn730: calcEarnings(p.apy, stakeAmount, 730, compoundFreq),
			risk: riskLevel(p),
			color: protocolColor(p.project),
			spark: fakeSpark(p.project + p.symbol)
		}))
	);

	const TICKER = '💎 STAKING · APY YIELDS · LIQUID STAKING · LENDING · LP REWARDS · LIDO · AAVE · COMPOUND · JITO · MARINADE · DEFI YIELDS · ';

	onMount(() => {
		fetchPools();
	});
</script>

<svelte:head><title>Staking Yields | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-purple-500/5 py-2.5 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
		{#each [TICKER, TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950/50 to-purple-950/50">

	<!-- ambient bg with animated gradients -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute -left-20 -top-32 h-[600px] w-[600px] rounded-full opacity-[0.12] blur-[150px] animate-pulse"
			 style="background:radial-gradient(circle,#10b981,transparent 70%)"></div>
		<div class="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full opacity-[0.1] blur-[130px] animate-pulse" style="animation-delay:2s; background:radial-gradient(circle,#3b82f6,transparent 70%)"></div>
		<div class="absolute left-1/3 top-1/3 h-[400px] w-[400px] rounded-full opacity-[0.08] blur-[100px] animate-pulse" style="animation-delay:4s; background:radial-gradient(circle,#8b5cf6,transparent 70%)"></div>
		<div class="absolute inset-0 opacity-[0.03]"
			 style="background-image:radial-gradient(circle at 25% 25%, rgba(16,185,129,0.15) 0%, transparent 50%),radial-gradient(circle at 75% 75%, rgba(59,130,246,0.15) 0%, transparent 50%)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-5 py-10 sm:px-8">

		<!-- ═══ HERO SECTION ═══ -->
		<div class="relative mb-12 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 backdrop-blur-sm transition-all duration-700 hover:border-emerald-500/30">
			<!-- animated background particles -->
			<div class="absolute inset-0 overflow-hidden">
				{#each Array(8) as _, i}
					<div class="absolute h-1 w-1 rounded-full bg-emerald-400/20 animate-pulse"
						 style="left:{10 + i * 12}%;top:{15 + (i * 23) % 70}%;animation-delay:{i * 0.3}s;animation-duration:{3 + i % 3}s"></div>
				{/each}
			</div>
			
			<div class="relative z-10">
				<div class="flex flex-col lg:flex-row items-start gap-10">
					<!-- left: branding + stats -->
					<div class="flex-1">
						<div class="flex items-center gap-4 mb-6">
							<div class="relative group">
								<div class="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-all duration-500"></div>
								<div class="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-blue-400 to-purple-400 shadow-2xl shadow-emerald-500/30 transform transition-transform duration-300 group-hover:scale-110">
									<span class="text-3xl">💎</span>
								</div>
								<div class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 animate-pulse">
									<div class="absolute inset-0 animate-ping rounded-full bg-emerald-400/40"></div>
								</div>
							</div>
							<div>
								<h1 class="bg-gradient-to-r from-emerald-300 via-blue-300 to-purple-300 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl lg:text-7xl mb-2">Staking Yields</h1>
								<div class="flex items-center gap-3">
									<span class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
										<span class="relative flex h-2 w-2">
											<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
											<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
										</span>
										LIVE DATA
									</span>
									<span class="text-[11px] text-white/40 font-medium">Powered by DeFiLlama</span>
								</div>
							</div>
						</div>
						
						<!-- enhanced stats grid -->
						<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
							{#each [
								{ label: 'Active Pools', value: stats.count.toLocaleString(), icon: '🏊', color: 'from-blue-400 to-blue-600' },
								{ label: 'Average APY', value: stats.avgApy.toFixed(1) + '%', icon: '📈', color: 'from-emerald-400 to-emerald-600' },
								{ label: 'Total TVL', value: fmtTvl(stats.totalTvl), icon: '💰', color: 'from-purple-400 to-purple-600' },
								{ label: 'Highest APY', value: stats.maxApy.toFixed(1) + '%', icon: '🔥', color: 'from-red-400 to-orange-500' },
								{ label: 'Last Update', value: lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...', icon: '🕐', color: 'from-gray-400 to-gray-600' }
							] as stat, i}
								<div class="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/[0.15] hover:shadow-xl" style="animation:slideUp 0.5s ease {i * 100}ms both">
									<div class="absolute inset-0 bg-gradient-to-br {stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
									<div class="relative">
										<div class="mb-2 text-2xl">{stat.icon}</div>
										<p class="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-1">{stat.label}</p>
										<p class="text-xl font-black bg-gradient-to-r {stat.color} bg-clip-text text-transparent">{stat.value}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- right: enhanced calculator -->
					<div class="w-full lg:max-w-lg">
						<div class="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-sm">
							<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-2xl"></div>
							
							<div class="relative">
								<div class="flex items-center gap-2 mb-6">
									<div class="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-400">
										<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
										</svg>
									</div>
									<h3 class="text-lg font-bold text-white">Earnings Calculator</h3>
								</div>
								
								<div class="space-y-4">
									<!-- amount input -->
									<div>
										<label class="block text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Investment Amount</label>
										<div class="relative">
											<span class="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">$</span>
											<input type="number" bind:value={stakeAmount}
												class="w-full h-14 rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 text-2xl font-black text-white outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all placeholder-white/10"
												placeholder="1,000" />
										</div>
									</div>
									
									<!-- time range selection -->
									<div>
										<label class="block text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Time Period</label>
										<div class="grid grid-cols-4 gap-2">
											{#each TIME_RANGES as range}
												<button onclick={() => {stakeDuration = range.days; selectedTimeRange = range.key;}}
													class="relative overflow-hidden rounded-lg border px-3 py-3 text-xs font-bold transition-all duration-300
													{selectedTimeRange === range.key
														? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20'
														: 'border-white/[0.08] text-white/40 hover:border-white/[0.15] hover:text-white/60 hover:bg-white/[0.04]'}">
													{#if selectedTimeRange === range.key}
														<div class="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 animate-pulse"></div>
													{/if}
													<span class="relative">{range.label}</span>
												</button>
											{/each}
										</div>
									</div>
									
									<!-- compound frequency -->
									<div>
										<label class="block text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Compounding</label>
										<div class="grid grid-cols-3 gap-2">
											{#each [{v:1,l:'None',icon:'⏹️'},{v:365,l:'Daily',icon:'📅'},{v:52,l:'Weekly',icon:'📆'}] as opt}
											<button onclick={() => compoundFreq = opt.v}
												class="rounded-lg border px-3 py-2.5 text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1
												{compoundFreq === opt.v
													? 'border-blue-500/40 bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20'
													: 'border-white/[0.08] text-white/40 hover:border-white/[0.15] hover:text-white/60 hover:bg-white/[0.04]'}">
												<span>{opt.icon}</span>
											<span>{opt.l}</span>
											</button>
											{/each}
									</div>
									</div>
								</div>
							</div>
							
							<!-- earnings preview cards -->
							<div class="mt-6 grid grid-cols-3 gap-3">
								{#each [{apy:5,label:'Conservative',color:'from-blue-400 to-blue-600',icon:'🛡️'},{apy:10,label:'Moderate',color:'from-emerald-400 to-emerald-600',icon:'⚖️'},{apy:20,label:'Aggressive',color:'from-red-400 to-orange-500',icon:'🚀'}] as calc}
									{@const earn = calcEarnings(calc.apy, stakeAmount, stakeDuration, compoundFreq)}
									<div class="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 text-center transition-all duration-300 hover:scale-105 hover:border-white/[0.15] hover:shadow-xl">
										<div class="absolute inset-0 bg-gradient-to-br {calc.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
										<div class="relative">
											<div class="text-2xl mb-2">{calc.icon}</div>
											<p class="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-1">{calc.label}</p>
											<p class="text-lg font-black bg-gradient-to-r {calc.color} bg-clip-text text-transparent">+${earn.toFixed(0)}</p>
											<p class="text-[9px] text-white/20 mt-1">@ {calc.apy}% APY</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ═══ COMPARE BAR ═══ -->
		{#if compareList.length > 0}
			<div class="mb-4 flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3">
				<p class="text-[10px] font-bold text-cyan-400">Comparing {compareList.length}/4:</p>
				{#each compareList as p}
					<span class="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-white/50">
						{p.project}
						<button onclick={() => toggleCompare(p)} class="ml-1 text-white/20 hover:text-white/50">×</button>
					</span>
				{/each}
				{#if compareList.length >= 2}
					<button onclick={() => compareMode = !compareMode}
						class="ml-auto rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[9px] font-bold text-cyan-400 hover:bg-cyan-500/15 transition">
						{compareMode ? 'Hide' : 'Show'} Table
					</button>
				{/if}
				<button onclick={() => { compareList = []; compareMode = false; }}
					class="text-[9px] text-white/15 hover:text-white/30 transition">Clear</button>
			</div>
		{/if}

		<!-- ═══ COMPARE TABLE ═══ -->
		{#if compareMode && compareData.length >= 2}
			<div class="mb-6 overflow-hidden rounded-2xl border border-cyan-500/10 bg-white/[0.015]">
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead>
							<tr class="border-b border-white/[0.04] text-[9px] uppercase tracking-[0.15em] text-white/15">
								<th class="px-4 py-3">Pool</th>
								<th class="px-4 py-3 text-right">APY</th>
								<th class="px-4 py-3 text-right">TVL</th>
								<th class="px-4 py-3 text-right">Risk</th>
								<th class="px-4 py-3 text-right">30d Earn</th>
								<th class="px-4 py-3 text-right">1yr Earn</th>
								<th class="px-4 py-3 text-right">2yr Earn</th>
								<th class="px-4 py-3 text-right">Trend</th>
							</tr>
						</thead>
						<tbody>
							{#each compareData as p}
								<tr class="border-b border-white/[0.02] transition hover:bg-white/[0.02]">
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="h-7 w-7 rounded-lg text-[9px] font-black flex items-center justify-center"
												 style="background:{p.color}15;color:{p.color}">
												{p.project?.slice(0, 2).toUpperCase()}
											</div>
											<div>
												<p class="text-[11px] font-bold capitalize text-white/60">{p.project}</p>
												<p class="text-[8px] text-white/12">{p.symbol?.slice(0, 16)} · {p.chain}</p>
											</div>
										</div>
									</td>
									<td class="px-4 py-3 text-right text-sm font-black" style="color:{apyColor(p.apy)}">{p.apy.toFixed(2)}%</td>
									<td class="px-4 py-3 text-right text-[11px] text-white/30">{fmtTvl(p.tvlUsd)}</td>
									<td class="px-4 py-3 text-right">
										<span class="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
											  style="background:{p.risk.color}12;color:{p.risk.color}">{p.risk.label}</span>
									</td>
									<td class="px-4 py-3 text-right text-[11px] font-bold text-cyan-400/80">+${p.earn30.toFixed(0)}</td>
									<td class="px-4 py-3 text-right text-[11px] font-bold text-cyan-400">+${p.earn365.toFixed(0)}</td>
									<td class="px-4 py-3 text-right text-[11px] font-bold text-cyan-300">+${p.earn730.toFixed(0)}</td>
									<td class="px-4 py-3">
										<svg viewBox="0 0 60 16" class="h-4 w-14 opacity-40" preserveAspectRatio="none">
											<path d={sparkLine(p.spark)} fill="none" stroke={p.color} stroke-width="1.5" stroke-linecap="round"/>
										</svg>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- ═══ ENHANCED FILTERS ═══ -->
		<div class="mb-8 space-y-4">
			<!-- search bar -->
			<div class="relative max-w-2xl">
				<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<svg class="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
				</div>
				<input type="text" bind:value={searchQuery}
					placeholder="Search protocols, tokens, or chains..."
					class="w-full h-14 pl-12 pr-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-white placeholder-white/20 outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] focus:shadow-lg focus:shadow-emerald-500/10 transition-all text-lg" />
				{#if searchQuery}
					<button onclick={() => searchQuery = ''} class="absolute inset-y-0 right-0 pr-4 flex items-center">
						<svg class="w-5 h-5 text-white/30 hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				{/if}
			</div>
			
			<!-- filter pills -->
			<div class="flex flex-wrap gap-4">
				<!-- chains -->
				<div class="flex flex-wrap gap-2">
					<span class="text-[10px] font-bold text-white/30 self-center mr-2">CHAINS</span>
					{#each CHAINS.slice(0, 5) as chain}
						<button onclick={() => selectedChain = chain.key}
							class="group relative overflow-hidden rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-300 flex items-center gap-2
							{selectedChain === chain.key
								? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/20'
								: 'border-white/[0.08] text-white/40 hover:border-white/[0.15] hover:text-white/60 hover:bg-white/[0.04]'}">
							{#if selectedChain === chain.key}
								<div class="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 animate-pulse"></div>
							{/if}
							<span class="relative text-lg">{chain.emoji}</span>
							<span class="relative">{chain.label}</span>
						</button>
					{/each}
				</div>
				
				<!-- categories -->
				<div class="flex flex-wrap gap-2">
					<span class="text-[10px] font-bold text-white/30 self-center mr-2">TYPES</span>
					{#each CATEGORIES as cat}
						<button onclick={() => selectedCategory = cat.key}
							class="group relative overflow-hidden rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-300 flex items-center gap-2
							{selectedCategory === cat.key
								? 'border-blue-500/40 bg-blue-500/15 text-blue-300 shadow-lg shadow-blue-500/20'
								: 'border-white/[0.08] text-white/40 hover:border-white/[0.15] hover:text-white/60 hover:bg-white/[0.04]'}">
							{#if selectedCategory === cat.key}
								<div class="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
							{/if}
							<span class="relative text-lg">{cat.emoji}</span>
							<span class="relative">{cat.label}</span>
						</button>
					{/each}
				</div>
				
				<!-- view controls -->
				<div class="ml-auto flex items-center gap-2">
					<div class="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
						<button onclick={() => view = 'grid'}
							class="rounded-lg px-3 py-2 text-[10px] font-bold transition-all
							{view === 'grid' ? 'bg-white/15 text-white shadow-lg' : 'text-white/30 hover:text-white/50'}">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z"></path>
							</svg>
						</button>
						<button onclick={() => view = 'list'}
							class="rounded-lg px-3 py-2 text-[10px] font-bold transition-all
							{view === 'list' ? 'bg-white/15 text-white shadow-lg' : 'text-white/30 hover:text-white/50'}">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
							</svg>
						</button>
					</div>
					<button onclick={() => compareMode = !compareMode}
						class="relative overflow-hidden rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-300 flex items-center gap-2
						{compareMode ? 'border-purple-500/40 bg-purple-500/15 text-purple-300 shadow-lg shadow-purple-500/20' : 'border-white/[0.08] text-white/40 hover:border-white/[0.15] hover:text-white/60 hover:bg-white/[0.04]'}">
						{#if compareMode}
							<div class="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse"></div>
						{/if}
						<span class="relative">⚖️ Compare</span>
						{#if compareList.length > 0}
							<span class="relative flex h-5 w-5 items-center justify-center rounded-full bg-purple-400/20 text-purple-300 text-[9px] font-bold">
								{compareList.length}
							</span>
						{/if}
					</button>
					<button onclick={fetchPools} disabled={loading}
						class="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-bold text-white/40 transition-all hover:border-white/[0.15] hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20">
						{#if loading}
							<span class="animate-spin">⟳</span>
						{:else}
							<span>↻ Refresh</span>
						{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- ═══ ERROR ═══ -->
		{#if error}
			<div class="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-6 text-center">
				<p class="text-2xl mb-1">⚡</p>
				<p class="text-xs font-black text-red-400">{error}</p>
				<button onclick={fetchPools}
					class="mt-3 rounded-lg border border-red-400/15 bg-red-400/5 px-4 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-400/10 transition">Retry</button>
			</div>
		{/if}

		<!-- ═══ TOP ROWS ═══ -->
		{#if !searchQuery && selectedChain === 'all' && selectedCategory === 'all'}
			<div class="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Top Yields -->
				{#if topByApy.length}
					<div class="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-sm transition-all duration-500 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10">
						<div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"></div>
						
						<div class="relative">
							<div class="flex items-center justify-between mb-6">
								<div class="flex items-center gap-3">
									<div class="relative group">
										<div class="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl opacity-20 group-hover:opacity-30 blur transition-all duration-500"></div>
										<div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30 transform transition-transform duration-300 group-hover:scale-110">
											<span class="text-lg font-bold text-white">🔥</span>
										</div>
									</div>
									<div>
										<p class="text-[12px] font-black uppercase tracking-[0.25em] text-white/40">Top Yields</p>
										<p class="text-[10px] text-white/20 mt-1">Highest APY Pools</p>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<span class="rounded-full bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold text-white/30">$1M+ TVL</span>
									<button onclick={() => setSort('apy')}
										class="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[10px] font-bold text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-300 hover:scale-105">
										View All →
									</button>
								</div>
							</div>
							
							<div class="space-y-3">
								{#each topByApy.slice(0, 6) as pool, i (pool.pool + 'apy' + i)}
									{@const color = protocolColor(pool.project)}
									{@const earn = calcEarnings(pool.apy, stakeAmount, stakeDuration, compoundFreq)}
									<div class="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] px-5 py-4 transition-all duration-300 hover:border-orange-500/30 hover:bg-white/[0.05] hover:scale-[1.02] hover:shadow-lg"
										 style="animation:slideRight 0.5s ease {i*80}ms both">
										<div class="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										
										<div class="relative flex items-center gap-4">
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold shadow-lg transition-transform duration-300 group-hover:scale-110"
												 style="background:{color}20;color:{color};box-shadow:0 2px 8px {color}40">
												{i + 1}
											</div>
											<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold transition-transform duration-300 group-hover:scale-110"
												 style="background:{color}15;color:{color};box-shadow:0 4px 12px {color}30">
												{pool.project?.slice(0, 2).toUpperCase()}
											</div>
											<div class="min-w-0 flex-1">
												<p class="truncate text-[13px] font-bold capitalize text-white/70 group-hover:text-white/90 transition-colors">{pool.project}</p>
												<p class="truncate text-[10px] text-white/30">{pool.symbol?.slice(0, 20)} · {pool.chain}</p>
											</div>
											<div class="text-right">
												<p class="text-xl font-black" style="color:{apyColor(pool.apy)}; text-shadow:0 0 20px {apyColor(pool.apy)}40">{pool.apy.toFixed(1)}%</p>
												<p class="text-[10px] font-bold text-emerald-400/80">+${earn.toFixed(0)}</p>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Largest Pools -->
				{#if topByTvl.length}
					<div class="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-sm transition-all duration-500 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10">
						<div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"></div>
						
						<div class="relative">
							<div class="flex items-center justify-between mb-6">
								<div class="flex items-center gap-3">
									<div class="relative group">
										<div class="absolute -inset-1 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-xl opacity-20 group-hover:opacity-30 blur transition-all duration-500"></div>
										<div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 shadow-lg shadow-purple-500/30 transform transition-transform duration-300 group-hover:scale-110">
											<span class="text-lg font-bold text-white">🏛️</span>
										</div>
									</div>
									<div>
										<p class="text-[12px] font-black uppercase tracking-[0.25em] text-white/40">Largest Pools</p>
										<p class="text-[10px] text-white/20 mt-1">by Total Value Locked</p>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<span class="rounded-full bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold text-white/30">TVL Rank</span>
									<button onclick={() => setSort('tvlUsd')}
										class="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[10px] font-bold text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-300 hover:scale-105">
										View All →
									</button>
								</div>
							</div>
							
							<div class="space-y-3">
								{#each topByTvl.slice(0, 6) as pool, i (pool.pool + 'tvl' + i)}
									{@const color = protocolColor(pool.project)}
									<div class="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] px-5 py-4 transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.05] hover:scale-[1.02] hover:shadow-lg"
										 style="animation:slideRight 0.5s ease {i*80}ms both">
										<div class="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										
										<div class="relative flex items-center gap-4">
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold shadow-lg transition-transform duration-300 group-hover:scale-110"
												 style="background:{color}20;color:{color};box-shadow:0 2px 8px {color}40">
												{i + 1}
											</div>
											<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold transition-transform duration-300 group-hover:scale-110"
												 style="background:{color}15;color:{color};box-shadow:0 4px 12px {color}30">
												{pool.project?.slice(0, 2).toUpperCase()}
											</div>
											<div class="min-w-0 flex-1">
												<p class="truncate text-[13px] font-bold capitalize text-white/70 group-hover:text-white/90 transition-colors">{pool.project}</p>
												<p class="truncate text-[10px] text-white/30">{pool.symbol?.slice(0, 20)} · {pool.chain}</p>
											</div>
											<div class="text-right">
												<p class="text-lg font-black text-white/80">{fmtTvl(pool.tvlUsd)}</p>
												<span class="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-2.5 py-1 text-[10px] font-bold"
													  style="color:{apyColor(pool.apy)}">
													<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
														<path d="M12 7h-2v-2h2v2zm0 4h-2v6h2v-6zm-1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
													</svg>
													{pool.apy.toFixed(1)}%
												</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- ═══ LOADING ═══ -->
		{#if loading && !pools.length}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each Array.from({length: 8}), i}
					<div class="h-28 animate-pulse rounded-2xl bg-white/[0.03] border border-white/[0.06]" style="animation-delay:{i*50}ms"></div>
				{/each}
			</div>
		{/if}

		<!-- ═══ MODERN POOL GRID ═══ -->
		{#if filtered.length}
			{#if view === 'grid'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{#each filtered.slice(0, 48) as pool, i (pool.pool)}
						{@const color = protocolColor(pool.project)}
						{@const risk = riskLevel(pool)}
						{@const earn = calcEarnings(pool.apy, stakeAmount, stakeDuration, compoundFreq)}
						{@const spark = fakeSpark(pool.project + pool.symbol)}
						{@const isFav = favorites.has(pool.pool)}
						{@const isCompared = compareList.some(p => p.pool === pool.pool)}
						<div
							role="button"
							tabindex="0"
							class="group relative overflow-hidden rounded-3xl border px-6 py-5 text-left transition-all duration-500 cursor-pointer
							{isCompared ? 'border-purple-500/40 bg-purple-500/[0.08] shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-emerald-500/30 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1'}"
							style="animation:slideUp 0.6s ease {Math.min(i*12,400)}ms both"
							onclick={() => { if (compareMode) toggleCompare(pool); else expandedPool = expandedPool === pool.pool ? null : pool.pool; }}
							onkeydown={(e) => { if (e.key === 'Enter') { if (compareMode) toggleCompare(pool); else expandedPool = expandedPool === pool.pool ? null : pool.pool; } }}
							onmouseenter={() => hoveredPool = pool.pool}
							onmouseleave={() => hoveredPool = null}
							aria-label="{pool.project} pool card">

							<!-- hover glow effect -->
							<div class="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-blue-400/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
							
							<!-- expanded detail -->
							{#if expandedPool === pool.pool}
								<div class="relative mb-5 space-y-3 border-b border-white/[0.08] pb-5" style="animation:expand 0.3s ease">
									<div class="grid grid-cols-2 gap-3 text-[10px]">
										<div class="flex justify-between">
											<span class="text-white/20">Category</span>
											<span class="text-white/50 font-medium">{pool.category ?? '—'}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-white/20">Base APY</span>
											<span class="text-white/50 font-medium">{(pool.apyBase ?? 0).toFixed(2)}%</span>
										</div>
										<div class="flex justify-between">
											<span class="text-white/20">Reward APY</span>
											<span class="text-white/50 font-medium">{(pool.apyReward ?? 0).toFixed(2)}%</span>
										</div>
										{#if pool.il7d != null}
											<div class="flex justify-between">
												<span class="text-white/20">IL 7d</span>
												<span class="text-red-400/70 font-medium">{pool.il7d.toFixed(2)}%</span>
											</div>
										{/if}
										{#if pool.apyBase7d != null}
											<div class="flex justify-between">
												<span class="text-white/20">7d Avg APY</span>
												<span class="text-white/50 font-medium">{pool.apyBase7d.toFixed(2)}%</span>
											</div>
										{/if}
									</div>
									{#if pool.url}
										<a href={pool.url} target="_blank" rel="noopener"
											class="mt-3 block rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-center text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/15 transition-all duration-300 hover:scale-105">
											Visit Protocol ↗
										</a>
									{/if}
								</div>
							{/if}

							<!-- header section -->
							<div class="relative flex items-start gap-4 mb-5">
								<div class="relative group">
									<div class="absolute -inset-1 bg-gradient-to-br {color} rounded-2xl opacity-20 group-hover:opacity-30 blur transition-all duration-500"></div>
									<div class="relative flex h-12 w-12 items-center justify-center rounded-2xl text-[12px] font-black shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
										 style="background:{color}25;color:{color};box-shadow:0 4px 20px {color}40">
										{pool.project?.slice(0, 2)?.toUpperCase() ?? '??'}
									</div>
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2 mb-1">
										<p class="truncate text-[15px] font-bold capitalize text-white/80 group-hover:text-white transition-colors">{pool.project}</p>
										<span class="shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold border"
											  style="background:{risk.color}15;border-color:{risk.color}40;color:{risk.color}">{risk.label}</span>
									</div>
									<p class="truncate text-[11px] text-white/30">{pool.symbol} · {pool.chain}</p>
								</div>
								
								<!-- action buttons -->
								<div class="flex flex-col gap-2">
									<button onclick={(e) => { e.stopPropagation(); toggleFav(pool.pool); }}
										class="group/btn relative overflow-hidden rounded-xl p-2 transition-all duration-300 hover:bg-white/[0.08] {isFav ? 'text-amber-400' : 'text-white/20 hover:text-amber-400/60'}">
										{isFav ? '★' : '☆'}
									</button>
									{#if compareMode}
										<button onclick={(e) => { e.stopPropagation(); toggleCompare(pool); }}
											class="group/btn relative overflow-hidden rounded-xl p-2 transition-all duration-300 {isCompared ? 'text-purple-300 bg-purple-500/20' : 'text-white/20 hover:text-purple-300 hover:bg-purple-500/10'}">
											{isCompared ? '✓' : '+'}
										</button>
									{/if}
								</div>
							</div>

							<!-- metrics section -->
							<div class="relative grid grid-cols-3 gap-4">
								<div class="text-center">
									<p class="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-2">APY</p>
									<p class="text-2xl font-black leading-tight" style="color:{apyColor(pool.apy)}; text-shadow:0 0 25px {apyColor(pool.apy)}50">{pool.apy.toFixed(2)}%</p>
								</div>
								<div class="text-center">
									<p class="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-2">TVL</p>
									<p class="text-lg font-bold text-white/60">{fmtTvl(pool.tvlUsd)}</p>
								</div>
								<div class="text-center">
									<p class="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-2">{stakeDuration}d Earn</p>
									<p class="text-lg font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">+${earn.toFixed(0)}</p>
								</div>
							</div>
							
							<!-- sparkline -->
							<div class="relative mt-4">
								<svg viewBox="0 0 60 16" class="h-4 w-full opacity-20 group-hover:opacity-60 transition-opacity duration-300" preserveAspectRatio="none">
									<defs>
										<linearGradient id="spark-{pool.pool}" x1="0%" y1="0%" x2="100%" y2="0%">
											<stop offset="0%" stop-color={color} stop-opacity="0.8"/>
											<stop offset="100%" stop-color={color} stop-opacity="0.2"/>
										</linearGradient>
									</defs>
									<path d={sparkLine(spark)} fill="none" stroke="url(#spark-{pool.pool})" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- list view -->
			<div class="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]">
				<div class="grid grid-cols-[2.5rem_1fr_4.5rem_4.5rem_5rem_4.5rem_3rem] items-center gap-1 border-b border-white/[0.04] px-3 py-2.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/15">
						<span>#</span>
						<span>Pool</span>
						<button onclick={() => setSort('apy')} class="text-right hover:text-white/25 transition">APY{sortArrow('apy')}</button>
						<button onclick={() => setSort('apyBase')} class="text-right hover:text-white/25 transition">Base{sortArrow('apyBase')}</button>
						<button onclick={() => setSort('tvlUsd')} class="text-right hover:text-white/25 transition">TVL{sortArrow('tvlUsd')}</button>
						<span class="text-right">Chain</span>
						<span></span>
					</div>
					{#each filtered.slice(0, 80) as pool, i (pool.pool + 'l' + i)}
						{@const color = protocolColor(pool.project)}
						{@const isFav = favorites.has(pool.pool)}
						<div class="grid grid-cols-[2.5rem_1fr_4.5rem_4.5rem_5rem_4.5rem_3rem] items-center gap-1 border-b border-white/[0.012] px-3 py-2 transition-colors last:border-0 hover:bg-white/[0.015]"
							 style="animation:slideRight 0.15s ease {Math.min(i*6,300)}ms both">
							<span class="text-[8px] font-black text-white/6">{i + 1}</span>
							<div class="flex items-center gap-2 min-w-0">
								<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[7px] font-black"
									 style="background:{color}08;color:{color}">
									{pool.project?.slice(0, 2)?.toUpperCase()}
								</div>
								<div class="min-w-0">
									<p class="truncate text-[9px] font-bold capitalize text-white/40">{pool.project}</p>
									<p class="truncate text-[7px] text-white/8">{pool.symbol?.slice(0, 18)}</p>
								</div>
							</div>
							<p class="text-right text-[11px] font-black" style="color:{apyColor(pool.apy)}">{pool.apy.toFixed(1)}%</p>
							<p class="text-right text-[9px] text-white/15">{(pool.apyBase ?? 0).toFixed(1)}%</p>
							<p class="text-right text-[9px] text-white/20">{fmtTvl(pool.tvlUsd)}</p>
							<p class="text-right text-[8px] text-white/8">{pool.chain}</p>
							<button onclick={() => toggleFav(pool.pool)}
								class="text-center text-[10px] transition {isFav ? 'text-amber-400' : 'text-white/5 hover:text-white/15'}">
								{isFav ? '★' : '☆'}
							</button>
						</div>
					{/each}
				</div>
			{/if}

			{#if filtered.length > 80}
				<p class="mt-3 text-center text-[9px] text-white/6">80 of {filtered.length} pools</p>
			{/if}
		{:else if !loading && !error}
			<div class="rounded-xl border border-white/[0.06] bg-white/[0.015] p-16 text-center">
				<p class="mb-2 text-4xl opacity-15">∅</p>
				<p class="text-xs font-black text-white/20">No pools match filters</p>
			</div>
		{/if}

		<!-- ═══ FOOTER ═══ -->
		<div class="mt-10 flex items-center justify-between border-t border-white/[0.02] pt-4">
			<div class="flex items-center gap-2">
				<div class="relative">
					<div class="h-1.5 w-1.5 rounded-full bg-cyan-400/40"></div>
					<div class="absolute inset-0 animate-ping rounded-full bg-cyan-400/10"></div>
				</div>
				<p class="text-[8px] text-white/8">DeFiLlama · {pools.length} pools</p>
			</div>
			<p class="text-[8px] text-white/5">click cards to expand · ★ to favorite · ⊞ to compare</p>
		</div>

	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to   { transform: translateX(-33.33%); }
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}
	@keyframes slideRight {
		from { opacity: 0; transform: translateX(-20px); }
		to   { opacity: 1; transform: translateX(0); }
	}
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(20px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	@keyframes expand {
		from { opacity: 0; max-height: 0; }
		to   { opacity: 1; max-height: 500px; }
	}
	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-10px); }
	}
	@keyframes glow {
		0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
		50% { box-shadow: 0 0 40px rgba(16,185,129,0.6); }
	}
	@keyframes shimmer {
		0% { background-position: -200% center; }
		100% { background-position: 200% center; }
	}
</style>
