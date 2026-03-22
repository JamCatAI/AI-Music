<script>
	import { onMount } from 'svelte';

	let walletAddress = $state('');
	let loading = $state(false);
	let error = $state(null);
	let portfolioData = $state(null);
	let rates = $state({});
	let timeRange = $state('24h');
	let expandedAsset = $state(null);
	let copied = $state(false);

	// Demo portfolio for when no wallet is connected
	const DEMO_PORTFOLIO = {
		address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
		totalValue: 48732.41,
		totalCost: 38200.00,
		assets: [
			{ symbol: 'ETH', name: 'Ethereum', amount: 8.542, chain: 'Ethereum', color: '#627EEA', icon: '⟠' },
			{ symbol: 'BTC', name: 'Bitcoin', amount: 0.185, chain: 'Bitcoin', color: '#F7931A', icon: '₿' },
			{ symbol: 'SOL', name: 'Solana', amount: 124.3, chain: 'Solana', color: '#9945FF', icon: '◎' },
			{ symbol: 'ARB', name: 'Arbitrum', amount: 2840, chain: 'Arbitrum', color: '#28A0F0', icon: '🔵' },
			{ symbol: 'LINK', name: 'Chainlink', amount: 185, chain: 'Ethereum', color: '#2A5ADA', icon: '⬡' },
			{ symbol: 'UNI', name: 'Uniswap', amount: 95, chain: 'Ethereum', color: '#FF007A', icon: '🦄' },
			{ symbol: 'OP', name: 'Optimism', amount: 1200, chain: 'Optimism', color: '#FF0420', icon: '🔴' },
			{ symbol: 'AVAX', name: 'Avalanche', amount: 42, chain: 'Avalanche', color: '#E84142', icon: '🔺' },
			{ symbol: 'MATIC', name: 'Polygon', amount: 3500, chain: 'Polygon', color: '#8247E5', icon: '🟣' },
			{ symbol: 'DOGE', name: 'Dogecoin', amount: 8500, chain: 'Dogecoin', color: '#C3A634', icon: '🐕' }
		],
		chains: [
			{ name: 'Ethereum', value: 28450, pct: 58.4, color: '#627EEA' },
			{ name: 'Solana', value: 8920, pct: 18.3, color: '#9945FF' },
			{ name: 'Arbitrum', value: 4210, pct: 8.6, color: '#28A0F0' },
			{ name: 'Bitcoin', value: 3890, pct: 8.0, color: '#F7931A' },
			{ name: 'Other', value: 3262, pct: 6.7, color: '#64748b' }
		],
		recentTx: [
			{ type: 'swap', from: 'ETH', to: 'ARB', amount: '0.5 ETH → 1,240 ARB', time: '2h ago', chain: 'Ethereum' },
			{ type: 'receive', token: 'SOL', amount: '+12.0 SOL', time: '5h ago', chain: 'Solana' },
			{ type: 'stake', token: 'ETH', amount: '2.0 ETH staked', time: '1d ago', chain: 'Ethereum' },
			{ type: 'send', token: 'USDC', amount: '-500 USDC', time: '2d ago', chain: 'Arbitrum' },
			{ type: 'swap', from: 'USDC', to: 'LINK', amount: '200 USDC → 18 LINK', time: '3d ago', chain: 'Ethereum' },
			{ type: 'claim', token: 'ARB', amount: '+320 ARB airdrop', time: '5d ago', chain: 'Arbitrum' }
		],
		history: [42100, 43200, 41800, 44500, 43900, 45200, 46100, 45800, 47200, 46500, 48100, 47800, 49200, 48500, 48732]
	};

	// Price map for calculations
	const DEMO_PRICES = {
		ETH: 3420, BTC: 68500, SOL: 71.8, ARB: 1.48, LINK: 18.5,
		UNI: 12.3, OP: 2.85, AVAX: 42.5, MATIC: 0.88, DOGE: 0.15
	};

	async function fetchRates() {
		try {
			const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
			if (res.ok) {
				const data = await res.json();
				rates = data.data?.rates ?? {};
			}
		} catch {}
	}

	function invertRate(rate) {
		const v = parseFloat(rate);
		if (!v || isNaN(v)) return 0;
		return 1 / v;
	}

	function loadDemo() {
		loading = true;
		setTimeout(() => {
			portfolioData = DEMO_PORTFOLIO;
			loading = false;
		}, 800);
	}

	async function loadWallet(addr) {
		if (!addr || addr.length < 10) return;
		loading = true; error = null;
		// For now, load demo since we'd need API keys for real wallet data
		setTimeout(() => {
			portfolioData = { ...DEMO_PORTFOLIO, address: addr };
			loading = false;
		}, 1000);
	}

	function copyAddress() {
		if (portfolioData?.address) {
			navigator.clipboard?.writeText(portfolioData.address);
			copied = true;
			setTimeout(() => copied = false, 2000);
		}
	}

	function fmt(n, dec = 2) {
		if (n == null) return '—';
		if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
		if (n >= 1e3) return `$${n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
		return `$${n.toFixed(dec)}`;
	}

	function fmtPct(n) {
		if (n == null) return '—';
		const sign = n >= 0 ? '+' : '';
		return `${sign}${n.toFixed(2)}%`;
	}

	function fmtAmount(n) {
		if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
		if (n >= 1) return n.toFixed(2);
		return n.toFixed(4);
	}

	function txIcon(type) {
		const map = { swap: '🔄', receive: '📥', send: '📤', stake: '🔒', claim: '🎁', approve: '✅' };
		return map[type] ?? '📝';
	}

	let totalPnl = $derived(portfolioData ? portfolioData.totalValue - portfolioData.totalCost : 0);
	let totalPnlPct = $derived(portfolioData ? ((portfolioData.totalValue / portfolioData.totalCost) - 1) * 100 : 0);

	// Sparkline from history
	function historySpark(pts) {
		if (!pts?.length) return '';
		const w = 200, h = 48;
		const min = Math.min(...pts), max = Math.max(...pts);
		const range = max - min || 1;
		return pts.map((p, i) => {
			const x = (i / (pts.length - 1)) * w;
			const y = h - ((p - min) / range) * h;
			return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
		}).join(' ');
	}

	function historyArea(pts) {
		const line = historySpark(pts);
		return line + ` L200,48 L0,48 Z`;
	}

	// Donut chart
	function donutSegment(pct, offset, color) {
		const r = 40;
		const c = 2 * Math.PI * r;
		const dash = (pct / 100) * c;
		return { dash, offset: (offset / 100) * c, color, c };
	}

	let donutSegments = $derived(
		portfolioData?.chains?.reduce((acc, chain, i) => {
			const offset = acc.length ? acc[acc.length - 1]._cumulative : 0;
			acc.push({ ...donutSegment(chain.pct, offset, chain.color), _cumulative: offset + chain.pct });
			return acc;
		}, []) ?? []
	);

	const TICKER = '💼 PORTFOLIO · HOLDINGS · P&L · ASSET ALLOCATION · WALLET TRACKER · MULTI-CHAIN · DEFI POSITIONS · ';

	onMount(() => {
		fetchRates();
		loadDemo();
	});
</script>

<svelte:head><title>Portfolio | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-cyan-500/[0.06] py-2 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 40s linear infinite">
		{#each [TICKER, TICKER, TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/80">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-cyan-950">

	<!-- ambient -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[140px]"
			 style="background:radial-gradient(circle,#a855f7,transparent 70%)"></div>
		<div class="absolute -bottom-32 -left-16 h-[400px] w-[400px] rounded-full opacity-[0.05] blur-[120px]"
			 style="background:radial-gradient(circle,#06b6d4,transparent 70%)"></div>
		<div class="absolute inset-0 opacity-[0.025]"
			 style="background-image:linear-gradient(rgba(168,85,247,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,.2) 1px,transparent 1px);background-size:80px 80px"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-5 py-8 sm:px-8">

		<!-- ═══ HEADER ═══ -->
		<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
			<div>
				<div class="mb-2 flex items-center gap-3">
					<span class="text-2xl">💼</span>
					<h1 class="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">Portfolio</h1>
				</div>
				<p class="text-xs text-white/25">Track your multi-chain DeFi holdings in one view</p>
			</div>
			<!-- wallet input -->
			<div class="flex items-center gap-2">
				<div class="relative">
					<input bind:value={walletAddress}
						placeholder="Paste wallet address…"
						class="w-72 rounded-xl border border-white/[0.06] bg-white/[0.025] py-2 pl-4 pr-10 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/25 transition" />
					<button onclick={() => loadWallet(walletAddress)}
						class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-cyan-500/15 px-2 py-1 text-[9px] font-bold text-cyan-400 hover:bg-cyan-500/25 transition">
						Load
					</button>
				</div>
				<button onclick={loadDemo}
					class="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-[9px] font-bold text-white/25 hover:text-white/40 transition">
					Demo
				</button>
			</div>
		</div>

		<!-- ═══ LOADING ═══ -->
		{#if loading}
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div class="h-48 animate-pulse rounded-xl bg-white/[0.02] lg:col-span-2"></div>
				<div class="h-48 animate-pulse rounded-xl bg-white/[0.02]"></div>
			</div>
		{/if}

		<!-- ═══ PORTFOLIO CONTENT ═══ -->
		{#if portfolioData && !loading}

			<!-- ─── TOP ROW: Value + Donut ─── -->
			<div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">

				<!-- Total Value Card -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5 lg:col-span-2">
					<div class="mb-4 flex flex-wrap items-start justify-between gap-4">
						<div>
							<p class="text-[9px] uppercase tracking-[0.2em] text-white/15">Total Portfolio Value</p>
							<p class="mt-1 text-4xl font-black tracking-tight text-white">{fmt(portfolioData.totalValue)}</p>
							<div class="mt-1 flex items-center gap-2">
								<span class="text-sm font-bold {totalPnl >= 0 ? 'text-cyan-400' : 'text-red-400'}">
									{totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}
								</span>
								<span class="rounded-full px-1.5 py-0.5 text-[9px] font-bold {totalPnl >= 0 ? 'bg-cyan-500/15 text-cyan-400' : 'bg-red-500/15 text-red-400'}">
									{fmtPct(totalPnlPct)}
								</span>
							</div>
						</div>
						<!-- wallet badge -->
						<div class="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
							<div class="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
							<span class="font-mono text-[10px] text-white/30">{portfolioData.address.slice(0, 6)}…{portfolioData.address.slice(-4)}</span>
							<button onclick={copyAddress} class="text-[9px] text-white/15 hover:text-white/30 transition">
								{copied ? '✓' : 'Copy'}
							</button>
						</div>
					</div>

					<!-- sparkline -->
					{#if portfolioData.history}
						{@const spark = historySpark(portfolioData.history)}
						{@const area = historyArea(portfolioData.history)}
						<div class="relative h-16 w-full">
							<svg viewBox="0 0 200 48" class="h-full w-full" preserveAspectRatio="none">
								<defs>
									<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3"/>
										<stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
									</linearGradient>
								</defs>
								<path d={area} fill="url(#sparkGrad)"/>
								<path d={spark} fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							<!-- endpoints -->
							<div class="absolute bottom-0 left-0 text-[8px] text-white/15">${portfolioData.history[0].toLocaleString()}</div>
							<div class="absolute bottom-0 right-0 text-[8px] text-white/15">${portfolioData.history.at(-1).toLocaleString()}</div>
						</div>
						<!-- time range tabs -->
						<div class="mt-2 flex gap-1">
							{#each ['24h', '7d', '30d', '90d'] as range}
								<button onclick={() => timeRange = range}
									class="rounded-md px-2 py-1 text-[8px] font-bold transition
										{timeRange === range ? 'bg-cyan-500/15 text-cyan-400' : 'text-white/12 hover:text-white/25'}">
									{range}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Donut: Chain Allocation -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
					<p class="mb-4 text-[9px] uppercase tracking-[0.2em] text-white/15">Chain Allocation</p>
					<div class="flex items-center gap-4">
						<!-- donut -->
						<div class="relative h-24 w-24 shrink-0">
							<svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
								{#each donutSegments as seg, i}
									<circle cx="50" cy="50" r="40" fill="none"
										stroke={seg.color} stroke-width="12"
										stroke-dasharray="{seg.dash} {seg.c}"
										stroke-dashoffset={-seg.offset}
										style="animation:donutIn 0.6s ease {i*80}ms both"/>
								{/each}
							</svg>
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-xs font-black text-white/50">{portfolioData.chains?.length ?? 0}</span>
							</div>
						</div>
						<!-- legend -->
						<div class="space-y-1.5">
							{#each portfolioData.chains as chain}
								<div class="flex items-center gap-2">
									<span class="h-2 w-2 rounded-full shrink-0" style="background:{chain.color}"></span>
									<span class="text-[10px] font-bold text-white/30 flex-1">{chain.name}</span>
									<span class="text-[10px] font-bold text-white/20">{chain.pct}%</span>
									<span class="text-[9px] text-white/15">{fmt(chain.value)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- ─── MIDDLE ROW: Holdings + Activity ─── -->
			<div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">

				<!-- Holdings Table -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.025] lg:col-span-2">
					<div class="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
						<p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/15">Holdings</p>
						<span class="text-[9px] text-white/10">{portfolioData.assets.length} assets</span>
					</div>

					<!-- header -->
					<div class="grid grid-cols-[1fr_5rem_6rem_5rem_3.5rem] items-center gap-2 border-b border-white/[0.02] px-5 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/10">
						<span>Asset</span>
						<span class="text-right">Amount</span>
						<span class="text-right">Value</span>
						<span class="text-right">P&L</span>
						<span class="text-right">Alloc</span>
					</div>

					{#each portfolioData.assets as asset, i}
						{@const price = DEMO_PRICES[asset.symbol] ?? 0}
						{@const value = asset.amount * price}
						{@const costBasis = value * 0.78}
						{@const pnl = value - costBasis}
						{@const pnlPct = (value / costBasis - 1) * 100}
						{@const alloc = (value / portfolioData.totalValue) * 100}
						{@const expanded = expandedAsset === asset.symbol}
						<button
							class="w-full grid grid-cols-[1fr_5rem_6rem_5rem_3.5rem] items-center gap-2 border-b border-white/[0.012] px-5 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.02]"
							style="animation:fadeIn 0.2s ease {i*40}ms both"
							onclick={() => expandedAsset = expanded ? null : asset.symbol}>

							<!-- asset info -->
							<div class="flex items-center gap-3 min-w-0">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
									 style="background:{asset.color}18;color:{asset.color}">
									{asset.icon}
								</div>
								<div class="min-w-0">
									<p class="truncate text-[11px] font-bold text-white/70">{asset.name}</p>
									<p class="text-[9px] text-white/20">{asset.symbol} · {asset.chain}</p>
								</div>
							</div>

							<!-- amount -->
							<p class="text-right text-[11px] font-bold text-white/40">{fmtAmount(asset.amount)}</p>

							<!-- value -->
							<p class="text-right text-[11px] font-black text-white/70">{fmt(value)}</p>

							<!-- pnl -->
							<div class="text-right">
								<p class="text-[10px] font-bold {pnl >= 0 ? 'text-cyan-400' : 'text-red-400'}">{pnl >= 0 ? '+' : ''}{fmt(pnl)}</p>
							</div>

							<!-- alloc bar -->
							<div class="flex items-center justify-end gap-1">
								<div class="h-1.5 w-8 overflow-hidden rounded-full bg-white/[0.04]">
									<div class="h-full rounded-full transition-all" style="width:{alloc}%;background:{asset.color}"></div>
								</div>
								<span class="text-[8px] text-white/12">{alloc.toFixed(0)}%</span>
							</div>
						</button>

						<!-- expanded detail -->
						{#if expanded}
							<div class="border-b border-white/[0.02] bg-white/[0.01] px-5 py-3" style="animation:expand 0.2s ease">
								<div class="grid grid-cols-4 gap-4">
									<div>
										<p class="text-[8px] uppercase tracking-wider text-white/10">Avg Buy Price</p>
										<p class="text-xs font-bold text-white/30">${(costBasis / asset.amount).toFixed(2)}</p>
									</div>
									<div>
										<p class="text-[8px] uppercase tracking-wider text-white/10">Current Price</p>
										<p class="text-xs font-bold text-white/50">${price.toLocaleString()}</p>
									</div>
									<div>
										<p class="text-[8px] uppercase tracking-wider text-white/10">Cost Basis</p>
										<p class="text-xs font-bold text-white/30">{fmt(costBasis)}</p>
									</div>
									<div>
										<p class="text-[8px] uppercase tracking-wider text-white/10">ROI</p>
										<p class="text-xs font-bold {pnl >= 0 ? 'text-cyan-400' : 'text-red-400'}">{fmtPct(pnlPct)}</p>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<!-- Activity Feed -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.025]">
					<div class="border-b border-white/[0.04] px-5 py-3">
						<p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/15">Recent Activity</p>
					</div>
					<div class="divide-y divide-white/[0.02]">
						{#each portfolioData.recentTx as tx, i}
							<div class="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.02]"
								 style="animation:slideRight 0.2s ease {i*50}ms both">
								<span class="text-base">{txIcon(tx.type)}</span>
								<div class="min-w-0 flex-1">
									<p class="truncate text-[10px] font-bold text-white/40">{tx.amount}</p>
									<p class="text-[8px] text-white/12">{tx.time} · {tx.chain}</p>
								</div>
								<span class="rounded-md px-1.5 py-0.5 text-[7px] font-bold uppercase text-white/15 bg-white/[0.04]">{tx.type}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- ─── BOTTOM: Quick Stats ─── -->
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{#each [
					{ label: 'Best Performer', value: 'SOL', sub: '+28.4%', color: 'text-cyan-400', icon: '◎' },
					{ label: 'Worst Performer', value: 'DOGE', sub: '-5.2%', color: 'text-red-400', icon: '🐕' },
					{ label: 'Total Chains', value: '5', sub: 'Active', color: 'text-purple-400', icon: '⛓️' },
					{ label: 'DeFi Value', value: '$12.4K', sub: '25.4% of portfolio', color: 'text-cyan-400', icon: '🏦' }
				] as stat}
					<div class="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
						<p class="text-[8px] uppercase tracking-wider text-white/12">{stat.label}</p>
						<div class="mt-1 flex items-center gap-2">
							<span class="text-sm">{stat.icon}</span>
							<p class="text-lg font-black text-white/70">{stat.value}</p>
						</div>
						<p class="mt-0.5 text-[9px] font-bold {stat.color}">{stat.sub}</p>
					</div>
				{/each}
			</div>

			<!-- ═══ FOOTER ═══ -->
			<div class="mt-8 flex items-center justify-between border-t border-white/[0.03] pt-4">
				<div class="flex items-center gap-2">
					<div class="h-1.5 w-1.5 rounded-full bg-cyan-400/40"></div>
					<p class="text-[8px] text-white/8">Demo portfolio · paste wallet to track real holdings</p>
				</div>
				<p class="text-[8px] text-white/5">click assets to expand · click Copy to copy address</p>
			</div>
		{/if}

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
		to   { opacity: 1; max-height: 100px; }
	}
	@keyframes donutIn {
		from { stroke-dasharray: 0 252; }
	}
</style>
