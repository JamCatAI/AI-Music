<script>
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	// ── Data ────────────────────────────────────────────────────────────────────
	let tokens = $state([
		{ id: 'jam-cat', symbol: 'JAM', name: 'jam cat', price: 0, change: 0, mcap: 0, vol: 0, logo: '😺', color: 'from-pink-500 to-rose-600', slogan: 'THE CAT THAT JAMS' },
		{ id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', price: 0, change: 0, mcap: 0, vol: 0, logo: '🐕', color: 'from-orange-400 to-yellow-600', slogan: 'WIF HAT ON' },
		{ id: 'bonk', symbol: 'BONK', name: 'Bonk', price: 0, change: 0, mcap: 0, vol: 0, logo: '🔨', color: 'from-orange-600 to-red-600', slogan: 'BONK OR BE BONKED' },
		{ id: 'popcat', symbol: 'POPCAT', name: 'Popcat', price: 0, change: 0, mcap: 0, vol: 0, logo: '🐱', color: 'from-pink-400 to-purple-600', slogan: 'POP POP POP' },
		{ id: 'moo-deng', symbol: 'MOODENG', name: 'Moo Deng', price: 0, change: 0, mcap: 0, vol: 0, logo: '🦛', color: 'from-cyan-400 to-blue-600', slogan: 'BITE ME' },
		{ id: 'peanut-the-squirrel', symbol: 'PNUT', name: 'Peanut', price: 0, change: 0, mcap: 0, vol: 0, logo: '🐿️', color: 'from-amber-600 to-orange-800', slogan: 'GO NUTS' },
		{ id: 'book-of-meme', symbol: 'BOME', name: 'BOME', price: 0, change: 0, mcap: 0, vol: 0, logo: '📖', color: 'from-green-400 to-emerald-600', slogan: 'THE HOLY SCRIPT' },
		{ id: 'myro', symbol: 'MYRO', name: 'Myro', price: 0, change: 0, mcap: 0, vol: 0, logo: '🐶', color: 'from-blue-400 to-indigo-600', slogan: 'MYRO TO THE MOON' },
		{ id: 'ponke', symbol: 'PONKE', name: 'Ponke', price: 0, change: 0, mcap: 0, vol: 0, logo: '🐵', color: 'from-lime-400 to-green-600', slogan: 'PONKE IT UP' },
		{ id: 'slerf', symbol: 'SLERF', name: 'Slerf', price: 0, change: 0, mcap: 0, vol: 0, logo: '😴', color: 'from-slate-400 to-slate-600', slogan: 'SLEEPING ON IT' },
		{ id: 'wen', symbol: 'WEN', name: 'Wen', price: 0, change: 0, mcap: 0, vol: 0, logo: '🐈', color: 'from-purple-400 to-indigo-700', slogan: 'WEN LAMBO' },
	]);

	let loading = $state(true);
	let sortBy = $state('mcap');
	let isRefreshing = $state(false);
	let showRefreshSuccess = $state(false);
	let lastUpdated = $state('');
	let tickerText = "JAM CAT IS NOW LIVE • $JAM THE CAT THAT JAMS • $WIF +5.2% • $BONK BULLISH • MOO DENG TRENDING • PEANUT SAVES SOLANA •";

	// ── Formatter ───────────────────────────────────────────────────────────────
	const fmtNum = (n) => {
		if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
		if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
		if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
		return n.toFixed(2);
	};

	const fmtPrice = (p) => {
		if (p === 0) return '---';
		if (p < 0.0001) return p.toFixed(8);
		if (p < 1) return p.toFixed(4);
		return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	// ── Derived ──────────────────────────────────────────────────────────────────
	const sortedTokens = $derived([...tokens].sort((a, b) => b[sortBy] - a[sortBy]));
	const globalStats = $derived({
		totalMcap: tokens.reduce((acc, t) => acc + t.mcap, 0),
		totalVol: tokens.reduce((acc, t) => acc + t.vol, 0),
		avgChange: tokens.reduce((acc, t) => acc + t.change, 0) / tokens.length
	});

	// ── API ──────────────────────────────────────────────────────────────────────
	async function fetchData() {
		try {
			const ids = tokens.map(t => t.id).join(',');
			const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`);
			if (!res.ok) throw new Error('API Error');
			const data = await res.json();
			
			tokens = tokens.map(t => {
				if (data[t.id]) {
					return {
						...t,
						price: data[t.id].usd || 0,
						change: data[t.id].usd_24h_change || 0,
						mcap: data[t.id].usd_market_cap || 0,
						vol: data[t.id].usd_24h_vol || 0
					};
				}
				return t;
			});
			loading = false;
		} catch (e) {
			console.error('Fetch failed:', e);
			// Fallback to dummy drift if needed
			loading = false;
		}
	}

	onMount(() => {
		fetchData();
		const interval = setInterval(fetchData, 60000);
		return () => clearInterval(interval);
	});

	async function handleRefresh() {
		isRefreshing = true;
		showRefreshSuccess = false;
		await fetchData();
		lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		isRefreshing = false;
		showRefreshSuccess = true;
		setTimeout(() => showRefreshSuccess = false, 2000);
	}
</script>

<div class="relative overflow-hidden selection:bg-pink-500/30">

	<!-- Dark Overlay for extra contrast -->
	<div class="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div>

	<!-- Ambient Background -->
	<div class="pointer-events-none absolute inset-0 z-0 opacity-40">
		<div class="absolute -top-40 -left-20 h-[600px] w-[600px] rounded-full bg-pink-600/15 blur-[150px]"></div>
		<div class="absolute top-1/4 -right-20 h-[500px] w-[500px] rounded-full bg-cyan-600/12 blur-[120px]"></div>
		<div class="absolute bottom-0 left-1/4 h-[700px] w-[700px] rounded-full bg-indigo-900/25 blur-[180px]"></div>
		<div class="absolute top-1/2 right-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]"></div>
	</div>

	<!-- Ticker -->
	<div class="relative z-20 border-b border-white/8 bg-black/70 py-2.5 backdrop-blur-xl">
		<div class="marquee whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] text-[#14f195]">
			{tickerText} TOP SOLANA MEMES REPORTING FOR DUTY • $WIF HAT ON • $BONK BULLISH • MOO DENG TRENDING • PEANUT SAVES SOLANA •
		</div>
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6">
		
		<!-- Header -->
		<div class="mb-12 flex flex-col items-center text-center">
			<div in:fly={{ y: -20, duration: 800 }} class="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
				</span>
				Live Meme Terminal
				<span class="text-slate-500">|</span>
				<button type="button" onclick={handleRefresh} disabled={isRefreshing} class="flex items-center gap-1.5 text-[9px] text-slate-400 hover:text-white transition-colors disabled:opacity-50">
					{isRefreshing ? '⟳' : showRefreshSuccess ? '✓' : '↻'} {isRefreshing ? 'Updating...' : showRefreshSuccess ? 'Updated' : 'Refresh'}
				</button>
			</div>
			<h1 in:fly={{ y: -10, delay: 200, duration: 800 }} class="text-5xl font-extrabold tracking-tighter sm:text-7xl drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
				SOLANA <span class="bg-gradient-to-r from-[#14f195] via-cyan-400 to-[#14f195] bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(20,241,149,0.4)] animate-gradient">MEME HUB</span>
			</h1>
			<p in:fade={{ delay: 400 }} class="mt-4 max-w-2xl text-lg font-medium text-slate-300 drop-shadow-lg">
				The ultimate command center for the most degenerate tokens in the galaxy. 
				Track prices, volume, and pure unadulterated hype.
			</p>
			{#if lastUpdated}
				<p in:fade class="mt-2 text-[10px] font-mono text-slate-500">Last updated: {lastUpdated}</p>
			{/if}
		</div>

		<div class="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
			<div in:scale={{ start: 0.95, delay: 600 }} class="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1a]/80 to-[#0a0a1a]/60 p-6 backdrop-blur-2xl transition-all duration-500 hover:border-[#14f195]/30 hover:bg-[#0a0a1a]/90 hover:shadow-[0_0_30px_rgba(20,241,149,0.1)]">
				<div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#14f195]/10 blur-[60px] opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>
				<p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-[#14f195] transition-colors">Global Meme Cap</p>
				<h2 class="mt-2 text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">${fmtNum(globalStats.totalMcap)}</h2>
				<div class="mt-4 flex items-center gap-1 text-[10px] font-bold text-[#14f195]">
					<span class="rounded-lg bg-[#14f195]/10 px-2 py-0.5 border border-[#14f195]/20">↑ +2.4%</span>
					<span class="text-slate-500">vs yesterday</span>
				</div>
			</div>
			<div in:scale={{ start: 0.95, delay: 700 }} class="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1a]/80 to-[#0a0a1a]/60 p-6 backdrop-blur-2xl transition-all duration-500 hover:border-cyan-400/30 hover:bg-[#0a0a1a]/90 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
				<div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-[60px] opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>
				<p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-cyan-400 transition-colors">Total 24h Volume</p>
				<h2 class="mt-2 text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">${fmtNum(globalStats.totalVol)}</h2>
				<div class="mt-4 flex items-center gap-1 text-[10px] font-bold text-cyan-400">
					<span class="rounded-lg bg-cyan-400/10 px-2 py-0.5 border border-cyan-400/20">↑ High Activity</span>
				</div>
			</div>
			<div in:scale={{ start: 0.95, delay: 800 }} class="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1a]/80 to-[#0a0a1a]/60 p-6 backdrop-blur-2xl transition-all duration-500 hover:border-pink-500/30 hover:bg-[#0a0a1a]/90 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
				<div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-pink-500/10 blur-[60px] opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>
				<p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-pink-400 transition-colors">Meme Sentiment</p>
				<div class="mt-4 flex items-end gap-3">
					<div class="flex-1 space-y-2">
						<div class="h-2 w-full overflow-hidden rounded-full bg-black/40 shadow-inner">
							<div class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-[#14f195] shadow-[0_0_15px_rgba(20,241,149,0.4)] transition-all duration-1000" style="width: 82%"></div>
						</div>
						<div class="flex justify-between text-[9px] font-black text-slate-600">
							<span>REKT</span>
							<span class="text-[#14f195]">MOON SEASON</span>
						</div>
					</div>
					<span class="text-4xl font-black text-[#14f195] drop-shadow-[0_0_15px_rgba(20,241,149,0.5)]">82</span>
				</div>
			</div>
		</div>

		<!-- Meme of the Week -->
		<div class="mb-16 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#0a0a1a]/90 to-[#0a0a1a]/70 p-8 shadow-2xl sm:p-12 backdrop-blur-2xl">
			<div class="flex flex-col gap-10 lg:flex-row lg:items-center">
				<div class="relative group">
					<div class="absolute -inset-6 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-600/30 blur-3xl group-hover:opacity-100 opacity-60 transition-all duration-1000"></div>
					<div class="relative flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-pink-400 via-pink-500 to-purple-600 text-6xl shadow-2xl shadow-pink-500/30 sm:h-48 sm:w-48 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-pink-500/50">
						<span class="drop-shadow-2xl">🐕</span>
						<div class="absolute -right-3 -top-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 border-2 border-white/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-xl text-white">Spotlight</div>
					</div>
				</div>
				<div class="flex-1">
					<div class="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-pink-400">
						<span class="rounded-full bg-pink-500/20 px-2 py-0.5 border border-pink-500/30">Trending</span>
						<span class="text-slate-500">|</span>
						<span class="text-slate-400">Week of Apr 11, 2026</span>
					</div>
					<h3 class="text-3xl font-black tracking-tighter text-white sm:text-5xl drop-shadow-lg">MEME OF THE WEEK: $WIF</h3>
					<p class="mt-6 text-xl leading-relaxed text-slate-400 drop-shadow-md">
						The hat stays on. dogwifhat continues to defy gravity, reaching new heights in both holders and unadulterated vibes. 
						While others sleep, WIF leads the charge for the entire Solana ecosystem.
					</p>
					<div class="mt-8 flex flex-wrap gap-4">
						<div class="rounded-2xl border border-white/8 bg-black/40 px-6 py-3 shadow-inner backdrop-blur-sm transition-all hover:border-[#14f195]/30 hover:bg-[#14f195]/5">
							<p class="text-[10px] font-black uppercase tracking-widest text-[#14f195]">Holders</p>
							<p class="text-2xl font-black text-white">142,000+</p>
						</div>
						<div class="rounded-2xl border border-white/8 bg-black/40 px-6 py-3 shadow-inner backdrop-blur-sm transition-all hover:border-pink-500/30 hover:bg-pink-500/5">
							<p class="text-[10px] font-black uppercase tracking-widest text-pink-400">Viral Score</p>
							<p class="text-2xl font-black text-white">9.8/10</p>
						</div>
						<div class="rounded-2xl border border-white/8 bg-black/40 px-6 py-3 shadow-inner backdrop-blur-sm transition-all hover:border-cyan-400/30 hover:bg-cyan-400/5">
							<p class="text-[10px] font-black uppercase tracking-widest text-cyan-400">24h Volume</p>
							<p class="text-2xl font-black text-white">$89.2M</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Grid -->
		<div class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h3 class="text-xl font-black uppercase tracking-tighter">🔥 Top Movers</h3>
				<span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-500">{sortedTokens.length} tokens</span>
			</div>
			<div class="flex gap-2">
				{#each ['mcap', 'change', 'vol'] as sort, idx (sort + idx)}
					<button 
						onclick={() => sortBy = sort}
						class="rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all duration-300
							{sortBy === sort ? 'border-[#14f195] bg-[#14f195]/10 text-[#14f195] shadow-[0_0_15px_rgba(20,241,149,0.2)]' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'}"
					>By {sort}</button>
				{/each}
			</div>
		</div>

		{#if loading}
			<div class="flex h-64 items-center justify-center">
				<div class="flex flex-col items-center gap-4">
					<div class="relative">
						<div class="h-12 w-12 animate-spin rounded-full border-4 border-[#14f195] border-t-transparent"></div>
						<div class="absolute inset-0 h-12 w-12 animate-ping rounded-full border-2 border-[#14f195]/30"></div>
					</div>
					<p class="text-[11px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Loading meme data...</p>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each sortedTokens as token, i (token.id)}
					<div 
						in:fly={{ y: 20, delay: i * 50 }}
						class="group relative overflow-hidden rounded-[2.5rem] border border-white/8 bg-gradient-to-br from-[#0a0a1a]/90 to-[#0a0a1a]/70 p-6 backdrop-blur-2xl transition-all duration-500 hover:border-[#14f195]/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#14f195]/5 {token.symbol === 'JAM' ? 'ring-2 ring-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.2)]' : 'shadow-xl'}"
					>
						<!-- Card Background Glow -->
						<div class="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-gradient-to-br {token.color} opacity-0 blur-[100px] transition-all duration-700 group-hover:opacity-25"></div>

						<div class="relative z-10">
							<div class="mb-6 flex items-start justify-between">
								<div class="flex items-center gap-4">
									<div class="relative">
										<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br {token.color} text-3xl shadow-lg shadow-black/60 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-xl transition-all duration-500">
											{token.logo}
										</div>
										{#if token.symbol === 'JAM'}
											<div class="absolute -right-2.5 -top-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 border-2 border-white/30 px-2 py-0.5 text-[9px] font-black text-white shadow-xl">OFFICIAL</div>
										{/if}
									</div>
									<div>
										<h4 class="text-2xl font-black tracking-tighter flex items-center gap-2 text-white group-hover:text-[#14f195] transition-colors">
											{token.symbol}
											{#if token.symbol === 'JAM'}
												<span class="animate-pulse text-pink-500 text-sm">✨</span>
											{/if}
										</h4>
										<p class="text-xs font-bold text-slate-500">{token.name}</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-xl font-black text-white drop-shadow-sm">${fmtPrice(token.price)}</p>
									<p class="text-sm font-black {token.change >= 0 ? 'text-[#14f195]' : 'text-rose-500'} flex items-center justify-end gap-1">
										<span class="text-xs">{token.change >= 0 ? '▲' : '▼'}</span> {Math.abs(token.change).toFixed(2)}%
									</p>
								</div>
							</div>

							<!-- Stats Row -->
							<div class="mb-6 grid grid-cols-2 gap-4">
								<div class="rounded-2xl border border-white/5 bg-black/40 p-3 transition-all group-hover:border-white/10 group-hover:bg-black/50">
									<p class="text-[9px] font-black uppercase tracking-widest text-slate-500">Market Cap</p>
									<p class="mt-0.5 text-sm font-bold text-white">${fmtNum(token.mcap)}</p>
								</div>
								<div class="rounded-2xl border border-white/5 bg-black/40 p-3 transition-all group-hover:border-white/10 group-hover:bg-black/50">
									<p class="text-[9px] font-black uppercase tracking-widest text-slate-500">24h Vol</p>
									<p class="mt-0.5 text-sm font-bold text-white">${fmtNum(token.vol)}</p>
								</div>
							</div>

							<!-- Footer Interaction -->
							<div class="flex items-center justify-between border-t border-white/5 pt-4">
								<p class="text-[10px] font-black italic tracking-widest text-slate-600 group-hover:text-slate-400 transition-colors">"{token.slogan}"</p>
								<a 
									href="/swap"
									class="rounded-xl border border-[#14f195]/30 bg-[#14f195]/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#14f195] transition-all hover:bg-[#14f195] hover:text-black hover:border-[#14f195] hover:shadow-[0_0_15px_rgba(20,241,149,0.3)] active:scale-95"
								>Trade</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Bottom CTA -->
		<div class="mt-20 flex flex-col items-center rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent p-12 text-center backdrop-blur-3xl shadow-2xl">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl shadow-xl shadow-indigo-500/30">🚀</div>
			<h2 class="text-3xl font-black tracking-tighter sm:text-4xl drop-shadow-lg">MISSING THE NEXT 1000X?</h2>
			<p class="mt-4 max-w-xl text-slate-400">Join the JamCat alpha group to get notified about the hottest meme launches and high-momentum signals.</p>
			<div class="mt-8 flex gap-3">
				<button class="rounded-full bg-gradient-to-r from-[#14f195] to-cyan-400 px-8 py-3 text-sm font-extrabold text-black shadow-lg shadow-[#14f195]/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#14f195]/30 active:scale-95">JOIN TELEGRAM</button>
				<button class="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/30 active:scale-95">Learn More</button>
			</div>
		</div>

	</div>
</div>

<style>
	:global(.marquee) {
		display: inline-block;
		animation: marquee 30s linear infinite;
	}

	@keyframes marquee {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50%); }
	}

	@keyframes gradient {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	:global(.animate-gradient) {
		background-size: 200% auto;
		animation: gradient 3s ease infinite;
	}
</style>
