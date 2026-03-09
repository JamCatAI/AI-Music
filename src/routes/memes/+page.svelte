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
</script>

<div class="relative overflow-hidden selection:bg-pink-500/30">

	<!-- Dark Overlay for extra contrast -->
	<div class="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>

	<!-- Ambient Background -->
	<div class="pointer-events-none absolute inset-0 z-0 opacity-30">
		<div class="absolute -top-40 -left-20 h-[600px] w-[600px] rounded-full bg-pink-600/10 blur-[150px]"></div>
		<div class="absolute top-1/4 -right-20 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]"></div>
		<div class="absolute bottom-0 left-1/4 h-[700px] w-[700px] rounded-full bg-indigo-900/20 blur-[180px]"></div>
	</div>

	<!-- Ticker -->
	<div class="relative z-20 border-b border-white/5 bg-black/60 py-2.5 backdrop-blur-xl">
		<div class="marquee whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] text-[#14f195]">
			{tickerText} TOP SOLANA MEMES REPORTING FOR DUTY • $WIF HAT ON • $BONK BULLISH • MOO DENG TRENDING • PEANUT SAVES SOLANA •
		</div>
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6">
		
		<!-- Header -->
		<div class="mb-12 flex flex-col items-center text-center">
			<div in:fly={{ y: -20, duration: 800 }} class="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-pink-400">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
				</span>
				Live Meme Terminal
			</div>
			<h1 in:fly={{ y: -10, delay: 200, duration: 800 }} class="text-5xl font-extrabold tracking-tighter sm:text-7xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
				SOLANA <span class="bg-gradient-to-r from-[#14f195] to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_0_15px_rgba(20,241,149,0.3)]">MEME HUB</span>
			</h1>
			<p in:fade={{ delay: 400 }} class="mt-4 max-w-2xl text-lg font-medium text-slate-300 drop-shadow-sm">
				The ultimate command center for the most degenerate tokens in the galaxy. 
				Track prices, volume, and pure unadulterated hype.
			</p>
		</div>

		<div class="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
			<div in:scale={{ start: 0.95, delay: 600 }} class="group relative rounded-3xl border border-white/10 bg-[#0a0a1a]/60 p-6 backdrop-blur-2xl transition-all hover:bg-[#0a0a1a]/80 hover:border-white/20">
				<p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-[#14f195] transition-colors">Global Meme Cap</p>
				<h2 class="mt-2 text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">${fmtNum(globalStats.totalMcap)}</h2>
				<div class="mt-4 flex items-center gap-1 text-[10px] font-bold text-[#14f195]">
					<span class="rounded bg-[#14f195]/10 px-1.5 py-0.5">↑ +2.4%</span>
					<span class="text-slate-500">vs yesterday</span>
				</div>
			</div>
			<div in:scale={{ start: 0.95, delay: 700 }} class="group relative rounded-3xl border border-white/10 bg-[#0a0a1a]/60 p-6 backdrop-blur-2xl transition-all hover:bg-[#0a0a1a]/80 hover:border-white/20">
				<p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-cyan-400 transition-colors">Total 24h Volume</p>
				<h2 class="mt-2 text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">${fmtNum(globalStats.totalVol)}</h2>
				<div class="mt-4 flex items-center gap-1 text-[10px] font-bold text-cyan-400">
					<span class="rounded bg-cyan-400/10 px-1.5 py-0.5">↑ High Activity</span>
				</div>
			</div>
			<div in:scale={{ start: 0.95, delay: 800 }} class="group relative rounded-3xl border border-white/10 bg-[#0a0a1a]/60 p-6 backdrop-blur-2xl transition-all hover:bg-[#0a0a1a]/80 hover:border-white/20">
				<p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-pink-400 transition-colors">Meme Sentiment</p>
				<div class="mt-4 flex items-end gap-3">
					<div class="flex-1 space-y-2">
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-black/40 shadow-inner">
							<div class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-[#14f195] shadow-[0_0_10px_rgba(20,241,149,0.3)]" style="width: 82%"></div>
						</div>
						<div class="flex justify-between text-[9px] font-black text-slate-600">
							<span>REKT</span>
							<span class="text-[#14f195]">MOON SEASON</span>
						</div>
					</div>
					<span class="text-4xl font-black text-[#14f195] drop-shadow-[0_0_12px_rgba(20,241,149,0.4)]">82</span>
				</div>
			</div>
		</div>

		<!-- Meme of the Week -->
		<div class="mb-16 overflow-hidden rounded-[3rem] border border-white/10 bg-[#0a0a1a]/80 p-8 shadow-2xl sm:p-12">
			<div class="flex flex-col gap-10 lg:flex-row lg:items-center">
				<div class="relative group">
					<div class="absolute -inset-4 rounded-full bg-pink-500/20 blur-2xl group-hover:bg-pink-500/40 transition-all duration-700"></div>
					<div class="relative flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-pink-400 to-purple-600 text-6xl shadow-2xl sm:h-48 sm:w-48 transition-transform group-hover:scale-105 group-hover:rotate-3">
						🐕
						<div class="absolute -right-2 -top-2 rounded-full bg-pink-500 border-2 border-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-xl text-white">Spotlight</div>
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-3xl font-black tracking-tighter text-white sm:text-5xl drop-shadow-md">MEME OF THE WEEK: $WIF</h3>
					<p class="mt-6 text-xl leading-relaxed text-slate-400 drop-shadow-sm">
						The hat stays on. dogwifhat continues to defy gravity, reaching new heights in both holders and unadulterated vibes. 
						While others sleep, WIF leads the charge for the entire Solana ecosystem.
					</p>
					<div class="mt-8 flex flex-wrap gap-6">
						<div class="rounded-2xl border border-white/5 bg-black/60 px-8 py-4 shadow-inner">
							<p class="text-[10px] font-black uppercase tracking-widest text-[#14f195]">Holders</p>
							<p class="text-2xl font-black text-white">142,000+</p>
						</div>
						<div class="rounded-2xl border border-white/5 bg-black/60 px-8 py-4 shadow-inner">
							<p class="text-[10px] font-black uppercase tracking-widest text-pink-400">Viral Score</p>
							<p class="text-2xl font-black text-white">9.8/10</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Grid -->
		<div class="mb-8 flex items-center justify-between">
			<h3 class="text-xl font-black uppercase tracking-tighter">🔥 Top Movers</h3>
			<div class="flex gap-2">
				{#each ['mcap', 'change', 'vol'] as sort}
					<button 
						onclick={() => sortBy = sort}
						class="rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all
							{sortBy === sort ? 'border-[#14f195] bg-[#14f195]/10 text-[#14f195]' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}"
					>By {sort}</button>
				{/each}
			</div>
		</div>

		{#if loading}
			<div class="flex h-64 items-center justify-center">
				<div class="h-12 w-12 animate-spin rounded-full border-4 border-[#14f195] border-t-transparent"></div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each sortedTokens as token, i (token.id)}
					<div 
						in:fly={{ y: 20, delay: i * 50 }}
						class="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a1a]/80 p-6 backdrop-blur-2xl transition-all duration-500 hover:border-[#14f195]/50 hover:bg-[#0a0a1a] {token.symbol === 'JAM' ? 'ring-2 ring-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'shadow-xl'}"
					>
						<!-- Card Background Glow -->
						<div class="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-gradient-to-br {token.color} opacity-0 blur-[80px] transition-opacity duration-700 group-hover:opacity-20"></div>

						<div class="relative z-10">
							<div class="mb-6 flex items-start justify-between">
								<div class="flex items-center gap-4">
									<div class="relative">
										<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br {token.color} text-3xl shadow-lg shadow-black/60 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
											{token.logo}
										</div>
										{#if token.symbol === 'JAM'}
											<div class="absolute -right-2.5 -top-2.5 rounded-full bg-pink-500 border-2 border-white/20 px-2 py-0.5 text-[9px] font-black text-white shadow-xl">OFFICIAL</div>
										{/if}
									</div>
									<div>
										<h4 class="text-2xl font-black tracking-tighter flex items-center gap-2 text-white">
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
									<p class="text-sm font-black {token.change >= 0 ? 'text-[#14f195]' : 'text-rose-500'}">
										{token.change >= 0 ? '▲' : '▼'} {Math.abs(token.change).toFixed(2)}%
									</p>
								</div>
							</div>

							<!-- Stats Row -->
							<div class="mb-6 grid grid-cols-2 gap-4">
								<div class="rounded-2xl bg-black/40 p-3">
									<p class="text-[9px] font-black uppercase tracking-widest text-slate-500">Market Cap</p>
									<p class="mt-0.5 text-sm font-bold text-white">${fmtNum(token.mcap)}</p>
								</div>
								<div class="rounded-2xl bg-black/40 p-3">
									<p class="text-[9px] font-black uppercase tracking-widest text-slate-500">24h Vol</p>
									<p class="mt-0.5 text-sm font-bold text-white">${fmtNum(token.vol)}</p>
								</div>
							</div>

							<!-- Footer Interaction -->
							<div class="flex items-center justify-between border-t border-white/5 pt-4">
								<p class="text-[10px] font-black italic tracking-widest text-slate-600 group-hover:text-white/40 transition-colors">"{token.slogan}"</p>
								<a 
									href="/swap"
									class="rounded-xl border border-[#14f195]/30 bg-[#14f195]/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#14f195] transition-all hover:bg-[#14f195] hover:text-black active:scale-95"
								>Trade</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Bottom CTA -->
		<div class="mt-20 flex flex-col items-center rounded-[3rem] border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-12 text-center backdrop-blur-3xl">
			<h2 class="text-3xl font-black tracking-tighter sm:text-4xl">MISSING THE NEXT 1000X?</h2>
			<p class="mt-4 max-w-xl text-slate-400">Join the JamCat alpha group to get notified about the hottest meme launches and high-momentum signals.</p>
			<button class="mt-8 rounded-full bg-white px-8 py-3 text-sm font-extrabold text-black transition-all hover:scale-105 active:scale-95">JOIN TELEGRAM</button>
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
</style>
