<svelte:head>
	<title>Analytics | JamCat Market Intelligence</title>
	<meta name="description" content="Real-time market analytics, on-chain data, and trading intelligence." />
</svelte:head>

<script>
	import { onMount } from 'svelte';

	// Market data
	let marketStats = $state({
		tvl: 4.2, // billions
		volume24h: 892, // millions
		activeUsers: 284000,
		transactions: 1.8, // millions
	});

	// Price data for sparklines
	let priceData = $state(Array.from({ length: 20 }, () => Math.random() * 40 + 30));
	let volumeData = $state(Array.from({ length: 20 }, () => Math.random() * 100));

	// Top movers
	let topMovers = $state([
		{ symbol: 'BONK', name: 'Bonk', change24h: 24.5, price: 0.000012, volume: 45.2, icon: '🐕' },
		{ symbol: 'WIF', name: 'dogwifhat', change24h: 18.3, price: 2.45, volume: 38.7, icon: '🎩' },
		{ symbol: 'JUP', name: 'Jupiter', change24h: 12.1, price: 1.12, volume: 124.5, icon: '🪐' },
		{ symbol: 'JTO', name: 'Jito', change24h: -8.4, price: 3.28, volume: 67.3, icon: '⚡' },
		{ symbol: 'RAY', name: 'Raydium', change24h: -5.2, price: 0.89, volume: 23.1, icon: '💧' },
	]);

	// On-chain metrics
	let chainMetrics = $state([
		{ label: 'TPS', value: '2,847', subtext: ' avg', status: 'good', sparkline: [65, 68, 72, 70, 74, 78, 76, 80, 82, 79] },
		{ label: 'Block Time', value: '420', subtext: 'ms', status: 'good', sparkline: [400, 415, 420, 418, 425, 422, 420, 418, 420, 422] },
		{ label: 'Fees', value: '$0.002', subtext: ' avg', status: 'good', sparkline: [0.003, 0.0025, 0.002, 0.0018, 0.002, 0.0015, 0.002, 0.0022, 0.002, 0.0018] },
		{ label: 'Success Rate', value: '99.8', subtext: '%', status: 'good', sparkline: [99.5, 99.6, 99.7, 99.8, 99.8, 99.9, 99.8, 99.8, 99.9, 99.8] },
	]);

	let tick = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			tick++;
			// Update sparklines
			priceData = [...priceData.slice(1), Math.random() * 40 + 30];
			volumeData = [...volumeData.slice(1), Math.random() * 100];
		}, 2000);
		return () => clearInterval(id);
	});

	function formatNumber(num) {
		if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
		if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
		if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
		return num.toString();
	}
</script>

<div class="relative min-h-screen overflow-hidden bg-[#020207] text-white">
	<!-- Background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]"></div>
		<div class="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[140px]"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
		<!-- Header -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-4xl font-black tracking-tight">
						<span class="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Analytics</span>
					</h1>
					<span class="rounded-md border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
						LIVE DATA
					</span>
				</div>
				<p class="mt-1.5 text-xs text-white/40">
					Real-time market intelligence · On-chain metrics · Trading analytics
				</p>
			</div>
			<div class="flex items-center gap-2">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
				</span>
				<span class="text-[11px] font-bold text-emerald-400">Live Updates</span>
			</div>
		</div>

		<!-- Global Stats -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each [
				{ label: 'Total TVL', value: `$${marketStats.tvl}B`, change: '+8.4%', icon: '💰', color: 'from-emerald-400 to-green-500' },
				{ label: '24h Volume', value: `$${marketStats.volume24h}M`, change: '+12.2%', icon: '📊', color: 'from-blue-400 to-cyan-500' },
				{ label: 'Active Users', value: formatNumber(marketStats.activeUsers), change: '+5.1%', icon: '👥', color: 'from-purple-400 to-pink-500' },
				{ label: 'Transactions', value: `${marketStats.transactions}M`, change: '+18.7%', icon: '⚡', color: 'from-amber-400 to-orange-500' },
			] as stat (stat.label)}
				<div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br {stat.color} opacity-0 blur-2xl transition-opacity group-hover:opacity-20"></div>
					<div class="flex items-center justify-between">
						<p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">{stat.icon} {stat.label}</p>
						<span class="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">{stat.change}</span>
					</div>
					<p class="mt-2 text-2xl font-black text-white">{stat.value}</p>
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main Chart Area -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Price Chart -->
				<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="font-bold text-white">Market Activity</h3>
						<div class="flex gap-2">
							{#each ['1H', '24H', '7D', '30D'] as timeframe}
								<button class="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-gray-400 transition-all hover:bg-white/10 hover:text-white {timeframe === '24H' ? 'bg-white/10 text-white' : ''}">
									{timeframe}
								</button>
								{/each}
						</div>
					</div>
					<div class="h-48 flex items-end gap-1">
						{#each priceData as h, i (i)}
							<div
								class="flex-1 rounded-t bg-gradient-to-t from-blue-500/20 to-cyan-500/40 transition-all duration-500"
								style="height: {h}%"
							></div>
						{/each}
					</div>
					<div class="mt-4 flex justify-between text-[10px] text-gray-500">
						<span>00:00</span>
						<span>06:00</span>
						<span>12:00</span>
						<span>18:00</span>
						<span>Now</span>
					</div>
				</div>

				<!-- Top Movers -->
				<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
					<div class="border-b border-white/10 px-5 py-4">
						<h3 class="font-bold text-white">Top Movers</h3>
					</div>
					<div class="divide-y divide-white/[0.06]">
						{#each topMovers as token (token.symbol)}
							<div class="group flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.02]">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg">
										{token.icon}
									</div>
									<div>
										<div class="flex items-center gap-2">
											<span class="font-bold text-white">{token.symbol}</span>
											<span class="text-[11px] text-gray-500">{token.name}</span>
										</div>
										<p class="text-sm text-gray-400">${token.price < 0.01 ? token.price.toExponential(2) : token.price.toFixed(token.price < 1 ? 4 : 2)}</p>
									</div>
								</div>
								<div class="flex items-center gap-4">
									<div class="text-right">
										<p class="text-[11px] text-gray-500">Vol: ${token.volume}M</p>
									</div>
									<span class="rounded-lg px-2 py-1 text-sm font-bold {token.change24h > 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}">
										{token.change24h > 0 ? '+' : ''}{token.change24h}%
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Sidebar Metrics -->
			<div class="space-y-6">
				<!-- Chain Health -->
				<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
					<h3 class="mb-4 font-bold text-white">Network Health</h3>
					<div class="space-y-4">
						{#each chainMetrics as metric (metric.label)}
							<div>
								<div class="mb-2 flex items-center justify-between">
									<span class="text-[11px] font-medium text-gray-400">{metric.label}</span>
									<div class="flex items-baseline gap-1">
										<span class="text-lg font-bold text-white">{metric.value}</span>
										<span class="text-[10px] text-gray-500">{metric.subtext}</span>
									</div>
								</div>
								<div class="flex items-end gap-0.5 h-8">
									{#each metric.sparkline as h, i (i)}
										<div
											class="flex-1 rounded-t bg-emerald-400/30 transition-all duration-300"
											style="height: {(h / Math.max(...metric.sparkline)) * 100}%"
										></div>
										{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Volume Distribution -->
				<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
					<h3 class="mb-4 font-bold text-white">Volume (24h)</h3>
					<div class="space-y-3">
						{#each [
							{ label: 'DEX', value: 65, color: 'from-blue-400 to-cyan-400' },
							{ label: 'Perps', value: 20, color: 'from-purple-400 to-pink-400' },
							{ label: 'NFT', value: 10, color: 'from-amber-400 to-orange-400' },
							{ label: 'Bridge', value: 5, color: 'from-emerald-400 to-green-400' },
							] as item (item.label)}
							<div>
								<div class="mb-1 flex items-center justify-between text-[11px]">
									<span class="text-gray-400">{item.label}</span>
									<span class="font-medium text-white">{item.value}%</span>
								</div>
								<div class="h-2 rounded-full bg-white/10">
									<div class="h-full rounded-full bg-gradient-to-r {item.color} transition-all duration-1000" style="width: {item.value}%"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
