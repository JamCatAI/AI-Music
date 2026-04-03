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
<div class="overflow-hidden border-b border-white/5 bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-transparent py-2.5 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 35s linear infinite">
		{#each [TICKER, TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400/90">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-cyan-950">

	<!-- ambient -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full opacity-[0.08] blur-[150px]"
			 style="background:radial-gradient(circle,#a855f7,transparent 70%)"></div>
		<div class="absolute -bottom-32 -left-16 h-[400px] w-[400px] rounded-full opacity-[0.06] blur-[120px]"
			 style="background:radial-gradient(circle,#06b6d4,transparent 70%)"></div>
		<div class="absolute left-1/2 top-1/4 h-[300px] w-[300px] rounded-full opacity-[0.05] blur-[100px]"
			 style="background:radial-gradient(circle,#ec4899,transparent 70%)"></div>
		<div class="absolute inset-0 opacity-[0.03]"
			 style="background-image:linear-gradient(rgba(168,85,247,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,.3) 1px,transparent 1px);background-size:80px 80px"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-5 py-10 sm:px-8">

		<!-- ═══ HEADER ═══ -->
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<div class="mb-3 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 shadow-lg shadow-purple-500/30">
						<span class="text-2xl">💼</span>
					</div>
					<div>
						<h1 class="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">Portfolio</h1>
						<p class="mt-1 text-xs text-white/40">Track your multi-chain DeFi holdings in one view</p>
					</div>
				</div>
			</div>
			<!-- wallet input -->
			<div class="flex items-center gap-2">
				<div class="relative group">
					<input bind:value={walletAddress}
						placeholder="Paste wallet address..."
						class="w-72 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-4 pr-10 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/30 focus:bg-white/[0.06] transition-all" />
					<button onclick={() => loadWallet(walletAddress)}
						class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-3 py-1.5 text-[10px] font-bold text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all">
						Load
					</button>
				</div>
				<button onclick={loadDemo}
					class="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[10px] font-bold text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all">
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
			<div class="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">

				<!-- Total Value Card -->
				<div class="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 lg:col-span-2 backdrop-blur-sm transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_0_60px_rgba(6,182,212,0.15)]">
					<!-- shimmer effect -->
					<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 transition-transform duration-1000 group-hover:translate-x-full"></div>
					
					<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
						<div>
							<p class="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Total Portfolio Value</p>
							<p class="mt-2 text-5xl font-black tracking-tight text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">{fmt(portfolioData.totalValue)}</p>
							<div class="mt-3 flex items-center gap-3">
								<span class="text-lg font-bold {totalPnl >= 0 ? 'text-cyan-400' : 'text-red-400'}">
									{totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}
								</span>
								<span class="rounded-full px-2 py-1 text-[10px] font-bold {totalPnl >= 0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}">
									{fmtPct(totalPnlPct)}
								</span>
							</div>
						</div>
						<!-- wallet badge -->
						<div class="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 backdrop-blur-sm">
							<div class="relative">
								<div class="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
								<div class="absolute inset-0 h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping opacity-40"></div>
							</div>
							<span class="font-mono text-[11px] text-white/40">{portfolioData.address.slice(0, 6)}…{portfolioData.address.slice(-4)}</span>
							<button onclick={copyAddress} class="rounded-md px-2 py-1 text-[10px] font-bold text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-all">
								{copied ? '✓ Copied' : 'Copy'}
							</button>
						</div>
					</div>

					<!-- sparkline -->
					{#if portfolioData.history}
						{@const spark = historySpark(portfolioData.history)}
						{@const area = historyArea(portfolioData.history)}
						<div class="relative h-20 w-full">
							<svg viewBox="0 0 200 48" class="h-full w-full" preserveAspectRatio="none">
								<defs>
									<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stop-color="#06b6d4" stop-opacity="0.5"/>
										<stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
									</linearGradient>
									<linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
										<stop offset="0%" stop-color="#06b6d4"/>
										<stop offset="50%" stop-color="#a855f7"/>
										<stop offset="100%" stop-color="#ec4899"/>
									</linearGradient>
								</defs>
								<path d={area} fill="url(#sparkGrad)"/>
								<path d={spark} fill="none" stroke="url(#lineGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(6,182,212,0.5));"/>
							</svg>
							<!-- endpoints -->
							<div class="absolute bottom-0 left-0 text-[9px] font-bold text-white/20">${portfolioData.history[0].toLocaleString()}</div>
							<div class="absolute bottom-0 right-0 text-[9px] font-bold text-white/20">${portfolioData.history.at(-1).toLocaleString()}</div>
						</div>
						<!-- time range tabs -->
						<div class="mt-3 flex gap-2">
							{#each ['24h', '7d', '30d', '90d', '1y'] as range}
								<button onclick={() => timeRange = range}
									class="rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all
										{timeRange === range ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]'}">
									{range}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Donut: Chain Allocation -->
				<div class="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm">
					<div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-500 hover:opacity-100"></div>
					<p class="mb-5 text-[10px] font-black uppercase tracking-[0.25em] text-white/30 flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]"></span>
						Chain Allocation
					</p>
					<div class="flex items-center gap-5">
						<!-- donut -->
						<div class="relative h-28 w-28 shrink-0">
							<svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
								{#each donutSegments as seg, i}
									<circle cx="50" cy="50" r="40" fill="none"
										stroke={seg.color} stroke-width="14"
										stroke-dasharray="{seg.dash} {seg.c}"
										stroke-dashoffset={-seg.offset}
										style="animation:donutIn 0.8s ease {i*100}ms both; filter: drop-shadow(0 0 2px {seg.color});"/>
								{/each}
							</svg>
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span class="text-2xl font-black text-white/60">{portfolioData.chains?.length ?? 0}</span>
								<span class="text-[8px] uppercase tracking-wider text-white/20">chains</span>
							</div>
						</div>
						<!-- legend -->
						<div class="space-y-2 flex-1">
							{#each portfolioData.chains as chain}
								<div class="group flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/[0.04]">
									<span class="h-2.5 w-2.5 rounded-full shrink-0 shadow-[0_0_4px_rgba(0,0,0,0.3)]" style="background:{chain.color}; box-shadow: 0 0 6px {chain.color}60;"></span>
									<span class="text-[11px] font-bold text-white/50 flex-1 group-hover:text-white/70 transition-colors">{chain.name}</span>
									<span class="text-[11px] font-bold text-white/30">{chain.pct}%</span>
									<span class="text-[9px] text-white/15">{fmt(chain.value)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- ─── MIDDLE ROW: Holdings + Activity ─── -->
			<div class="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">

				<!-- Holdings Table -->
				<div class="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] lg:col-span-2 backdrop-blur-sm">
					<div class="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-purple-500/3 opacity-0 transition-opacity duration-500 hover:opacity-100 pointer-events-none"></div>
					<div class="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
						<p class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
							<span class="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]"></span>
							Holdings
						</p>
						<span class="rounded-full bg-white/[0.04] px-2 py-1 text-[9px] font-bold text-white/20">{portfolioData.assets.length} assets</span>
					</div>

					<!-- header -->
					<div class="grid grid-cols-[1fr_5.5rem_6.5rem_5.5rem_4rem] items-center gap-3 border-b border-white/[0.04] px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/15">
						<span>Asset</span>
						<span class="text-right">Amount</span>
						<span class="text-right">Value</span>
						<span class="text-right">P&L</span>
						<span class="text-right">Alloc</span>
					</div>

					{#each portfolioData.assets as asset, i (asset.symbol)}
						{@const price = DEMO_PRICES[asset.symbol] ?? 0}
						{@const value = asset.amount * price}
						{@const costBasis = value * 0.78}
						{@const pnl = value - costBasis}
						{@const pnlPct = (value / costBasis - 1) * 100}
						{@const alloc = (value / portfolioData.totalValue) * 100}
						{@const expanded = expandedAsset === asset.symbol}
						<button
							class="group relative w-full grid grid-cols-[1fr_5.5rem_6.5rem_5.5rem_4rem] items-center gap-3 border-b border-white/[0.02] px-6 py-4 text-left transition-all duration-300 last:border-0 hover:bg-white/[0.04]"
							style="animation:fadeIn 0.3s ease {i*50}ms both"
							onclick={() => expandedAsset = expanded ? null : asset.symbol}>

							<!-- hover glow -->
							<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
							<div class="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 group-hover:w-full"></div>

							<!-- asset info -->
							<div class="relative flex items-center gap-3 min-w-0">
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base shadow-lg transition-all duration-300 group-hover:scale-110"
									 style="background:{asset.color}20;color:{asset.color};box-shadow:0 4px 20px {asset.color}30">
									{asset.icon}
								</div>
								<div class="min-w-0">
									<p class="truncate text-[12px] font-bold text-white/80 group-hover:text-white transition-colors">{asset.name}</p>
									<p class="text-[10px] text-white/30">{asset.symbol} · {asset.chain}</p>
								</div>
							</div>

							<!-- amount -->
							<p class="relative text-right text-[12px] font-bold text-white/50">{fmtAmount(asset.amount)}</p>

							<!-- value -->
							<p class="relative text-right text-[12px] font-black text-white/80">{fmt(value)}</p>

							<!-- pnl -->
							<div class="relative text-right">
								<p class="text-[11px] font-bold {pnl >= 0 ? 'text-cyan-400' : 'text-red-400'}">{pnl >= 0 ? '+' : ''}{fmt(pnl)}</p>
							</div>

							<!-- alloc bar -->
							<div class="relative flex items-center justify-end gap-2">
								<div class="h-2 w-10 overflow-hidden rounded-full bg-white/[0.06]">
									<div class="h-full rounded-full transition-all duration-500" style="width:{alloc}%;background:linear-gradient(90deg,{asset.color},{asset.color}aa)"></div>
								</div>
								<span class="text-[9px] font-bold text-white/20 w-7 text-right">{alloc.toFixed(0)}%</span>
							</div>
						</button>

						<!-- expanded detail -->
						{#if expanded}
							<div class="border-b border-white/[0.04] bg-gradient-to-r from-white/[0.02] to-transparent px-6 py-4" style="animation:expand 0.25s ease">
								<div class="grid grid-cols-4 gap-4">
									<div>
										<p class="text-[9px] uppercase tracking-wider text-white/15">Avg Buy</p>
										<p class="mt-1 text-sm font-bold text-white/40">${(costBasis / asset.amount).toFixed(2)}</p>
									</div>
									<div>
										<p class="text-[9px] uppercase tracking-wider text-white/15">Current</p>
										<p class="mt-1 text-sm font-bold text-white/60">${price.toLocaleString()}</p>
									</div>
									<div>
										<p class="text-[9px] uppercase tracking-wider text-white/15">Cost Basis</p>
										<p class="mt-1 text-sm font-bold text-white/40">{fmt(costBasis)}</p>
									</div>
									<div>
										<p class="text-[9px] uppercase tracking-wider text-white/15">ROI</p>
										<p class="mt-1 text-sm font-bold {pnl >= 0 ? 'text-cyan-400' : 'text-red-400'}">{fmtPct(pnlPct)}</p>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<!-- Activity Feed -->
				<div class="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
					<div class="absolute inset-0 bg-gradient-to-br from-purple-500/3 via-transparent to-pink-500/3 opacity-0 transition-opacity duration-500 hover:opacity-100 pointer-events-none"></div>
					<div class="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
						<p class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
							<span class="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]"></span>
							Recent Activity
						</p>
						<span class="text-[9px] text-white/20">Last 7 days</span>
					</div>
					<div class="divide-y divide-white/[0.03]">
						{#each portfolioData.recentTx as tx, i (tx.amount)}
							<div class="group flex items-center gap-4 px-6 py-4 transition-all duration-300 hover:bg-white/[0.04]"
								 style="animation:slideRight 0.25s ease {i*60}ms both">
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-transform duration-300 group-hover:scale-110"
									 style="background:{tx.type === 'swap' ? 'rgba(6,182,212,0.15)' : tx.type === 'receive' ? 'rgba(34,197,94,0.15)' : tx.type === 'send' ? 'rgba(239,68,68,0.15)' : tx.type === 'stake' ? 'rgba(168,85,247,0.15)' : 'rgba(251,191,36,0.15)'};
											color:{tx.type === 'swap' ? '#06b6d4' : tx.type === 'receive' ? '#22c55e' : tx.type === 'send' ? '#ef4444' : tx.type === 'stake' ? '#a855f7' : '#fbbf24'}">
									{txIcon(tx.type)}
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-[11px] font-bold text-white/60 group-hover:text-white/80 transition-colors">{tx.amount}</p>
									<p class="text-[9px] text-white/20">{tx.time} · {tx.chain}</p>
								</div>
								<span class="rounded-lg px-2 py-1 text-[8px] font-bold uppercase
									{tx.type === 'swap' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' :
									 tx.type === 'receive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
									 tx.type === 'send' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
									 tx.type === 'stake' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
									 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}">
									{tx.type}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- ─── BOTTOM: Quick Stats ─── -->
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each [
					{ label: 'Best Performer', value: 'SOL', sub: '+28.4%', color: 'text-cyan-400', bg: 'from-cyan-500/10 to-cyan-500/5', icon: '◎' },
					{ label: 'Worst Performer', value: 'DOGE', sub: '-5.2%', color: 'text-red-400', bg: 'from-red-500/10 to-red-500/5', icon: '🐕' },
					{ label: 'Total Chains', value: '5', sub: 'Active', color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-500/5', icon: '⛓️' },
					{ label: 'DeFi Value', value: '$12.4K', sub: '25.4% of portfolio', color: 'text-pink-400', bg: 'from-pink-500/10 to-pink-500/5', icon: '🏦' }
				] as stat (stat.label)}
					<div class="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-sm transition-all duration-500 hover:border-white/[0.15] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
						<div class="absolute inset-0 bg-gradient-to-br {stat.bg} opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
						<div class="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 group-hover:w-full"></div>
						<div class="relative">
							<p class="text-[9px] font-bold uppercase tracking-wider text-white/20">{stat.label}</p>
							<div class="mt-2 flex items-center gap-3">
								<span class="text-xl">{stat.icon}</span>
								<p class="text-2xl font-black text-white/80">{stat.value}</p>
							</div>
							<p class="mt-1 text-[10px] font-bold {stat.color}">{stat.sub}</p>
						</div>
					</div>
				{/each}
			</div>

			<!-- ═══ FOOTER ═══ -->
			<div class="mt-10 flex items-center justify-between border-t border-white/[0.04] pt-5">
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]"></div>
					<p class="text-[9px] text-white/20">Demo portfolio · paste wallet to track real holdings</p>
				</div>
				<p class="text-[9px] text-white/10">click assets to expand details</p>
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
