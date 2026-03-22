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

	const CHAINS = [
		{ key: 'all', label: 'All', emoji: '🌐' },
		{ key: 'Ethereum', label: 'ETH', emoji: '⟠' },
		{ key: 'Solana', label: 'SOL', emoji: '◎' },
		{ key: 'Arbitrum', label: 'ARB', emoji: '🔵' },
		{ key: 'Base', label: 'Base', emoji: '🔷' },
		{ key: 'BSC', label: 'BSC', emoji: '🟡' },
		{ key: 'Avalanche', label: 'AVAX', emoji: '🔺' },
		{ key: 'Polygon', label: 'MATIC', emoji: '🟣' }
	];

	const CATEGORIES = [
		{ key: 'all', label: 'All', emoji: '📊' },
		{ key: 'liquid-staking', label: 'Liquid', emoji: '💧' },
		{ key: 'lending', label: 'Lending', emoji: '🏦' },
		{ key: 'dexes', label: 'DEX LP', emoji: '🔄' },
		{ key: 'yield', label: 'Yield', emoji: '🌾' },
		{ key: 'cdp', label: 'CDP', emoji: '📦' }
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

<svelte:head><title>Staking | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-cyan-500/[0.06] py-2 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 40s linear infinite">
		{#each [TICKER, TICKER, TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/80">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-cyan-950">

	<!-- ambient bg -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute -left-20 -top-32 h-[600px] w-[600px] rounded-full opacity-[0.08] blur-[140px]"
			 style="background:radial-gradient(circle,#a855f7,transparent 70%)"></div>
		<div class="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-[120px]"
			 style="background:radial-gradient(circle,#06b6d4,transparent 70%)"></div>
		<div class="absolute inset-0 opacity-[0.03]"
			 style="background-image:linear-gradient(rgba(168,85,247,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,.2) 1px,transparent 1px);background-size:80px 80px"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-5 py-8 sm:px-8">

		<!-- ═══ HEADER + CALCULATOR (combined) ═══ -->
		<div class="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm">
			<div class="flex flex-wrap items-start gap-8">
				<!-- left: title + stats -->
				<div class="min-w-0 flex-1">
					<div class="mb-3 flex items-center gap-3">
						<span class="text-2xl">💎</span>
						<h1 class="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">Staking</h1>
						<span class="rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300">LIVE</span>
					</div>
					<!-- quick stats -->
					<div class="flex flex-wrap gap-x-5 gap-y-1">
						<div>
							<p class="text-[9px] uppercase tracking-wider text-white/12">Pools</p>
							<p class="text-sm font-black text-white/60">{stats.count}</p>
						</div>
						<div>
							<p class="text-[9px] uppercase tracking-wider text-white/12">Avg APY</p>
							<p class="text-sm font-black text-cyan-400">{stats.avgApy.toFixed(1)}%</p>
						</div>
						<div>
							<p class="text-[9px] uppercase tracking-wider text-white/12">Total TVL</p>
							<p class="text-sm font-black text-white/60">{fmtTvl(stats.totalTvl)}</p>
						</div>
						<div>
							<p class="text-[9px] uppercase tracking-wider text-white/12">Max APY</p>
							<p class="text-sm font-black" style="color:{apyColor(stats.maxApy)}">{stats.maxApy.toFixed(1)}%</p>
						</div>
						{#if lastUpdated}
							<div>
								<p class="text-[9px] uppercase tracking-wider text-white/12">Updated</p>
								<p class="text-sm font-black text-white/30">{lastUpdated.toLocaleTimeString()}</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- right: calculator -->
				<div class="w-full max-w-md">
					<p class="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/15">Earnings Estimator</p>
					<div class="flex flex-wrap gap-3">
						<div>
							<label class="mb-0.5 block text-[8px] uppercase tracking-wider text-white/10">Amount</label>
							<div class="flex items-center gap-0">
								<span class="rounded-l-lg border border-r-0 border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[10px] font-bold text-white/20">$</span>
								<input type="number" bind:value={stakeAmount}
									class="w-24 rounded-r-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-xs font-black text-white outline-none focus:border-cyan-500/25 transition" />
							</div>
						</div>
						<div>
							<label class="mb-0.5 block text-[8px] uppercase tracking-wider text-white/10">Period</label>
							<div class="flex gap-0.5">
								{#each [{d:30,l:'30d'},{d:90,l:'90d'},{d:365,l:'1y'},{d:730,l:'2y'}] as opt}
									<button onclick={() => stakeDuration = opt.d}
										class="rounded-md border px-2 py-1.5 text-[9px] font-bold transition
											{stakeDuration === opt.d ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-white/[0.04] text-white/15 hover:text-white/30'}">
										{opt.l}
									</button>
								{/each}
							</div>
						</div>
						<div>
							<label class="mb-0.5 block text-[8px] uppercase tracking-wider text-white/10">Compound</label>
							<div class="flex gap-0.5">
								{#each [{v:1,l:'None'},{v:365,l:'Daily'},{v:52,l:'Weekly'}] as opt}
									<button onclick={() => compoundFreq = opt.v}
										class="rounded-md border px-2 py-1.5 text-[9px] font-bold transition
											{compoundFreq === opt.v ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-white/[0.04] text-white/15 hover:text-white/30'}">
										{opt.l}
									</button>
								{/each}
							</div>
						</div>
					</div>
					<!-- earnings preview -->
					<div class="mt-3 flex gap-3">
						{#each [{apy:5,label:'5% Safe'},{apy:10,label:'10% Mid'},{apy:20,label:'20% Agg'}] as calc}
							{@const earn = calcEarnings(calc.apy, stakeAmount, stakeDuration, compoundFreq)}
							<div class="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-center">
								<p class="text-[8px] uppercase tracking-wider text-white/12">{calc.label}</p>
								<p class="text-sm font-black text-cyan-400">+${earn.toFixed(0)}</p>
							</div>
						{/each}
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

		<!-- ═══ FILTERS ═══ -->
		<div class="mb-5 space-y-2">
			<!-- row 1: search + chains -->
			<div class="flex flex-wrap items-center gap-2">
				<div class="relative">
					<input bind:value={searchQuery}
						placeholder="Search…"
						class="w-36 rounded-lg border border-white/[0.05] bg-white/[0.02] py-1.5 pl-3.5 pr-8 text-xs text-white placeholder-white/12 outline-none focus:border-cyan-500/25 focus:w-44 transition-all" />
					<span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/10">⌕</span>
				</div>
				<div class="h-4 w-px bg-white/[0.06]"></div>
				<div class="flex flex-wrap gap-1">
					{#each CHAINS as ch}
						<button onclick={() => selectedChain = ch.key}
							class="rounded-md border px-2 py-1 text-[9px] font-bold transition
								{selectedChain === ch.key
									? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
									: 'border-white/[0.04] text-white/12 hover:border-white/[0.08] hover:text-white/25'}">
							{ch.emoji} {ch.label}
						</button>
					{/each}
				</div>
			</div>
			<!-- row 2: categories + view + actions -->
			<div class="flex flex-wrap items-center gap-2">
				{#each CATEGORIES as cat}
					<button onclick={() => selectedCategory = cat.key}
						class="rounded-md border px-2 py-1 text-[9px] font-bold transition
							{selectedCategory === cat.key
								? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
								: 'border-white/[0.04] text-white/12 hover:border-white/[0.08] hover:text-white/25'}">
						{cat.emoji} {cat.label}
					</button>
				{/each}

				<div class="ml-auto flex items-center gap-1.5">
					<button onclick={() => compareMode = !compareMode}
						class="rounded-md border px-2 py-1 text-[9px] font-bold transition
							{compareMode ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-white/[0.04] text-white/12 hover:text-white/25'}">
						⊞ Compare
					</button>
					<div class="h-4 w-px bg-white/[0.06]"></div>
					<div class="flex gap-0.5 rounded-md border border-white/[0.04] bg-white/[0.02] p-0.5">
						<button onclick={() => view = 'grid'}
							class="rounded px-2 py-0.5 text-[9px] font-bold transition
								{view === 'grid' ? 'bg-white/10 text-white' : 'text-white/12 hover:text-white/25'}">⊞</button>
						<button onclick={() => view = 'list'}
							class="rounded px-2 py-0.5 text-[9px] font-bold transition
								{view === 'list' ? 'bg-white/10 text-white' : 'text-white/12 hover:text-white/25'}">☰</button>
					</div>
					<button onclick={fetchPools} disabled={loading}
						class="rounded-md border border-white/[0.04] bg-white/[0.02] px-2 py-1 text-[9px] font-bold text-white/15 transition hover:text-white/30 disabled:opacity-20">
						{loading ? '⟳' : '↻'}
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

		<!-- ═══ TOP ROWS (only on default filters) ═══ -->
		{#if !searchQuery && selectedChain === 'all' && selectedCategory === 'all'}
			<div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
				<!-- Top APY -->
				{#if topByApy.length}
					<div class="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
						<div class="mb-3 flex items-center gap-2">
							<span class="text-[10px]">🔥</span>
							<p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Top Yields</p>
							<span class="text-[8px] text-white/8">$1M+ TVL</span>
						</div>
						<div class="space-y-2">
							{#each topByApy as pool, i (pool.pool + 'apy' + i)}
								{@const color = protocolColor(pool.project)}
								{@const earn = calcEarnings(pool.apy, stakeAmount, stakeDuration, compoundFreq)}
								<div class="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/[0.03]"
									 style="animation:slideRight 0.3s ease {i*50}ms both">
									<span class="w-4 text-[9px] font-black text-white/10">{i + 1}</span>
									<div class="flex h-7 w-7 items-center justify-center rounded-lg text-[8px] font-black"
										 style="background:{color}12;color:{color}">
										{pool.project?.slice(0, 2).toUpperCase()}
									</div>
									<div class="min-w-0 flex-1">
										<p class="truncate text-[10px] font-bold capitalize text-white/40">{pool.project}</p>
										<p class="truncate text-[8px] text-white/12">{pool.symbol?.slice(0, 18)}</p>
									</div>
									<div class="text-right">
										<p class="text-sm font-black" style="color:{apyColor(pool.apy)}">{pool.apy.toFixed(1)}%</p>
										<p class="text-[8px] text-cyan-400/50">+${earn.toFixed(0)}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Top TVL -->
				{#if topByTvl.length}
					<div class="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
						<div class="mb-3 flex items-center gap-2">
							<span class="text-[10px]">🏛️</span>
							<p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Largest Pools</p>
							<span class="text-[8px] text-white/8">by TVL</span>
						</div>
						<div class="space-y-2">
							{#each topByTvl as pool, i (pool.pool + 'tvl' + i)}
								{@const color = protocolColor(pool.project)}
								{@const risk = riskLevel(pool)}
								<div class="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/[0.03]"
									 style="animation:slideRight 0.3s ease {i*50}ms both">
									<span class="w-4 text-[9px] font-black text-white/10">{i + 1}</span>
									<div class="flex h-7 w-7 items-center justify-center rounded-lg text-[8px] font-black"
										 style="background:{color}12;color:{color}">
										{pool.project?.slice(0, 2).toUpperCase()}
									</div>
									<div class="min-w-0 flex-1">
										<p class="truncate text-[10px] font-bold capitalize text-white/40">{pool.project}</p>
										<p class="truncate text-[8px] text-white/12">{pool.symbol?.slice(0, 18)}</p>
									</div>
									<p class="text-right text-xs font-black text-white/50">{fmtTvl(pool.tvlUsd)}</p>
									<span class="rounded px-1 py-0.5 text-[8px] font-bold"
										  style="background:{apyColor(pool.apy)}12;color:{apyColor(pool.apy)}">{pool.apy.toFixed(1)}%</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- ═══ LOADING ═══ -->
		{#if loading && !pools.length}
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
				{#each Array(8) as _, i}
					<div class="h-24 animate-pulse rounded-xl bg-white/[0.02]" style="animation-delay:{i*40}ms"></div>
				{/each}
			</div>
		{/if}

		<!-- ═══ POOLS ═══ -->
		{#if filtered.length}
			{#if view === 'grid'}
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each filtered.slice(0, 48) as pool, i (pool.pool + i)}
						{@const color = protocolColor(pool.project)}
						{@const risk = riskLevel(pool)}
						{@const earn = calcEarnings(pool.apy, stakeAmount, stakeDuration, compoundFreq)}
						{@const spark = fakeSpark(pool.project + pool.symbol)}
						{@const isFav = favorites.has(pool.pool)}
						{@const isCompared = compareList.some(p => p.pool === pool.pool)}
						<div
							role="button"
							tabindex="0"
							class="group relative overflow-hidden rounded-xl border px-4 py-3 text-left transition-all cursor-pointer
								{isCompared ? 'border-cyan-500/25 bg-cyan-500/[0.05]' : 'border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.03]'}"
							style="animation:fadeIn 0.2s ease {Math.min(i*10,300)}ms both"
							onclick={() => { if (compareMode) toggleCompare(pool); else expandedPool = expandedPool === pool.pool ? null : pool.pool; }}
							onkeydown={(e) => { if (e.key === 'Enter') { if (compareMode) toggleCompare(pool); else expandedPool = expandedPool === pool.pool ? null : pool.pool; } }}>

							<!-- expanded detail -->
							{#if expandedPool === pool.pool}
								<div class="mb-3 space-y-2 border-b border-white/[0.04] pb-3" style="animation:expand 0.2s ease">
									<div class="flex justify-between text-[9px]">
										<span class="text-white/12">Category</span>
										<span class="text-white/30">{pool.category ?? '—'}</span>
									</div>
									<div class="flex justify-between text-[9px]">
										<span class="text-white/12">Base APY</span>
										<span class="text-white/30">{(pool.apyBase ?? 0).toFixed(2)}%</span>
									</div>
									<div class="flex justify-between text-[9px]">
										<span class="text-white/12">Reward APY</span>
										<span class="text-white/30">{(pool.apyReward ?? 0).toFixed(2)}%</span>
									</div>
									{#if pool.il7d != null}
										<div class="flex justify-between text-[9px]">
											<span class="text-white/12">IL 7d</span>
											<span class="text-red-400/50">{pool.il7d.toFixed(2)}%</span>
										</div>
									{/if}
									{#if pool.apyBase7d != null}
										<div class="flex justify-between text-[9px]">
											<span class="text-white/12">7d Avg APY</span>
											<span class="text-white/30">{pool.apyBase7d.toFixed(2)}%</span>
										</div>
									{/if}
									{#if pool.url}
										<a href={pool.url} target="_blank" rel="noopener"
											class="mt-1 block rounded-lg border border-cyan-500/15 bg-cyan-500/5 py-1.5 text-center text-[9px] font-bold text-cyan-400 hover:bg-cyan-500/10 transition">
											Visit Protocol ↗
										</a>
									{/if}
								</div>
							{/if}

							<!-- top row -->
							<div class="flex items-start gap-2.5">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black transition-transform group-hover:scale-105"
									 style="background:{color}10;color:{color}">
									{pool.project?.slice(0, 2)?.toUpperCase() ?? '??'}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-1.5">
										<p class="truncate text-[10px] font-bold capitalize text-white/50">{pool.project}</p>
										<span class="shrink-0 rounded px-1 py-0.5 text-[7px] font-bold"
											  style="background:{risk.color}10;color:{risk.color}">{risk.label}</span>
									</div>
									<p class="truncate text-[8px] text-white/12">{pool.symbol} · {pool.chain}</p>
								</div>
								<!-- fav btn -->
								<button onclick={(e) => { e.stopPropagation(); toggleFav(pool.pool); }}
									class="shrink-0 text-[11px] transition {isFav ? 'text-amber-400' : 'text-white/8 hover:text-white/20'}">
									{isFav ? '★' : '☆'}
								</button>
							</div>

							<!-- bottom row -->
							<div class="mt-2 flex items-end justify-between">
								<div>
									<p class="text-[8px] uppercase tracking-wider text-white/8">APY</p>
									<p class="text-lg font-black leading-tight" style="color:{apyColor(pool.apy)}">{pool.apy.toFixed(2)}%</p>
								</div>
								<div class="text-right">
									<p class="text-[8px] uppercase tracking-wider text-white/8">TVL</p>
									<p class="text-xs font-bold text-white/30">{fmtTvl(pool.tvlUsd)}</p>
								</div>
								<div class="text-right">
									<p class="text-[8px] uppercase tracking-wider text-white/8">{stakeDuration}d</p>
									<p class="text-xs font-bold text-cyan-400/60">+${earn.toFixed(0)}</p>
								</div>
								<svg viewBox="0 0 60 16" class="h-4 w-12 opacity-25 group-hover:opacity-50 transition-opacity" preserveAspectRatio="none">
									<path d={sparkLine(spark)} fill="none" stroke={color} stroke-width="1.5" stroke-linecap="round"/>
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
		from { opacity: 0; transform: translateX(-6px); }
		to   { opacity: 1; transform: translateX(0); }
	}
	@keyframes expand {
		from { opacity: 0; max-height: 0; }
		to   { opacity: 1; max-height: 200px; }
	}
</style>
