<script>
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';

	// Featured TikTok viral meme tokens
	const FEATURED_TOKENS = [
		{
			id: 'skibidi',
			symbol: 'SKIBIDI',
			name: 'Skibidi Toilet',
			emoji: '🚽',
			color: 'from-purple-500 to-pink-500',
			description: 'The viral sensation that took over the internet. Skibidi dop dop dop yes yes.',
			holders: '21,841',
			price: '$0.0001938',
			change: '+451%',
			volume: '$754K',
			txns: '5,678',
			age: '14h',
			trending: true
		},
		{
			id: 'unc',
			symbol: 'UNC',
			name: 'unc',
			emoji: '🦍',
			color: 'from-orange-500 to-red-500',
			description: 'The unclad king of meme tokens. Pure chaos, pure gains.',
			holders: '9,484',
			price: '$0.0007272',
			change: '+2,001%',
			volume: '$619K',
			txns: '1,759',
			age: '4h',
			trending: true
		},
		{
			id: 'triplet',
			symbol: 'TRIPLET',
			name: 'Tung Tung Tung Sahur',
			emoji: '🥁',
			color: 'from-amber-500 to-yellow-400',
			description: 'The legendary sound that wakes up the degen spirit. Tung tung tung tung tung.',
			holders: '14,469',
			price: '$0.005060',
			change: '+26.86%',
			volume: '$2.1M',
			txns: '2,839',
			age: '1mo',
			trending: false
		},
		{
			id: 'triplec',
			symbol: 'TRIPLEC',
			name: 'Chill Chill Chill Sahur',
			emoji: '😎',
			color: 'from-cyan-400 to-blue-500',
			description: 'The chillest token in the Sahurverse. Relax and watch it pump.',
			holders: '5,560',
			price: '$0.049729',
			change: '+177%',
			volume: '$193K',
			txns: '1,261',
			age: '54m',
			trending: true
		},
		{
			id: 'neet',
			symbol: 'NEET',
			name: 'NotInEmploymentEducationTraining',
			emoji: '🛋️',
			color: 'from-emerald-500 to-teal-400',
			description: 'For those who chose the NEET life. Living the dream, one pump at a time.',
			holders: '4,323',
			price: '$0.03681',
			change: '+40.45%',
			volume: '$1.5M',
			txns: '628',
			age: '11mo',
			trending: false
		},
		{
			id: 'ngogo',
			symbol: 'NGOGO',
			name: 'The Ngogo Chimp War',
			emoji: '🐵',
			color: 'from-green-600 to-lime-500',
			description: 'The great chimp war rages on. Choose your side, fight for your gains.',
			holders: '30,614',
			price: '$0.0002608',
			change: '-8.54%',
			volume: '$1.8M',
			txns: '4,777',
			age: '1d',
			trending: false
		}
	];

	let loading = $state(true);
	let isRefreshing = $state(false);
	let showRefreshSuccess = $state(false);
	let lastUpdated = $state('');

	async function handleRefresh() {
		isRefreshing = true;
		showRefreshSuccess = false;
		await new Promise(r => setTimeout(r, 800));
		lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		isRefreshing = false;
		showRefreshSuccess = true;
		setTimeout(() => showRefreshSuccess = false, 2000);
	}

	onMount(() => {
		setTimeout(() => {
			loading = false;
			lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		}, 800);
	});
</script>

<svelte:head>
	<title>TikTok Viral | JamCat</title>
</svelte:head>

<div class="relative min-h-screen overflow-hidden bg-[#0a1f0a] text-white">
	<!-- Dark Overlay -->
	<div class="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a1f0a]/70 to-[#051005]/90"></div>

	<!-- Ambient Background -->
	<div class="pointer-events-none absolute inset-0 z-0">
		<div class="absolute -top-20 -left-20 h-[600px] w-[600px] rounded-full bg-emerald-600/15 blur-[150px]"></div>
		<div class="absolute top-1/3 -right-20 h-[500px] w-[500px] rounded-full bg-green-500/10 blur-[120px]"></div>
		<div class="absolute bottom-0 left-1/3 h-[700px] w-[700px] rounded-full bg-lime-900/20 blur-[180px]"></div>
		<div class="absolute top-1/2 left-1/2 h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-[100px]"></div>
	</div>

	<!-- Scanline Overlay -->
	<div class="pointer-events-none fixed inset-0 z-10 opacity-[0.02]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px);"></div>

	<div class="relative z-20 mx-auto max-w-6xl px-4 py-8">
		<!-- Header -->
		<div class="mb-10 flex flex-col items-center text-center">
			<div in:fly={{ y: -20, duration: 800 }} class="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
				</span>
				Viral Token Terminal
				<span class="text-slate-500">|</span>
				<button type="button" onclick={handleRefresh} disabled={isRefreshing} class="flex items-center gap-1.5 text-[9px] text-slate-400 hover:text-white transition-colors disabled:opacity-50">
					{isRefreshing ? '⟳' : showRefreshSuccess ? '✓' : '↻'} {isRefreshing ? 'Updating...' : showRefreshSuccess ? 'Updated' : 'Refresh'}
				</button>
			</div>
			<h1 in:fly={{ y: -10, delay: 200, duration: 800 }} class="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
				<span class="bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">TIKTOK</span> <span class="bg-gradient-to-r from-[#ff0050] via-[#ff4081] to-[#00f2ea] bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(255,0,80,0.4)] animate-tiktok">MEMES</span>
			</h1>
			<p in:fade={{ delay: 400 }} class="mt-4 max-w-2xl text-lg font-medium text-slate-300 drop-shadow-lg">
				The most viral meme tokens from the internet. From Skibidi to Tung Tung Sahur, track the trends that break the internet.
			</p>
			{#if lastUpdated}
				<p in:fade class="mt-2 text-[10px] font-mono text-slate-500">Last updated: {lastUpdated}</p>
			{/if}
		</div>

		<!-- Featured Tokens Grid -->
		{#if loading}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(6) as _, i (i)}
					<div class="h-64 animate-pulse rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.06] border border-white/[0.04]" style="animation-delay: {i * 100}ms"></div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each FEATURED_TOKENS as token, i (token.id)}
					<div 
						in:fly={{ y: 30, delay: i * 100, duration: 500 }}
						class="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#0a0a1a]/90 to-[#0a0a1a]/70 p-6 backdrop-blur-2xl transition-all duration-500 hover:border-pink-500/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/10"
					>
						<!-- Background Glow -->
						<div class="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-gradient-to-br {token.color} opacity-0 blur-[100px] transition-all duration-700 group-hover:opacity-25"></div>

						<!-- Trending Badge -->
						{#if token.trending}
							<div class="absolute -right-1 -top-1 rounded-full bg-gradient-to-r from-[#ff0050] to-[#ff4081] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
								🔥 HOT
							</div>
						{/if}

						<div class="relative z-10">
							<!-- Header -->
							<div class="mb-6 flex items-start justify-between">
								<div class="flex items-center gap-4">
									<div class="relative">
										<div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br {token.color} text-4xl shadow-lg shadow-black/60 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
											{token.emoji}
										</div>
									</div>
									<div>
										<h3 class="text-2xl font-black tracking-tighter text-white group-hover:text-pink-400 transition-colors">{token.symbol}</h3>
										<p class="text-xs font-bold text-slate-500">{token.name}</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-2xl font-black text-[#ff0050] tracking-tighter">HODL</p>
									<p class="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Viral Status</p>
								</div>
							</div>

							<!-- Description -->
							<p class="mb-6 text-sm text-slate-400 line-clamp-2">{token.description}</p>

							<!-- Stats Row -->
							<div class="mb-6 grid grid-cols-3 gap-3">
								<div class="rounded-xl border border-white/5 bg-black/40 p-3 text-center transition-all group-hover:border-white/10 group-hover:bg-black/50">
									<p class="text-[9px] font-black uppercase tracking-widest text-slate-500">Age</p>
									<p class="mt-0.5 text-sm font-bold text-white">{token.age}</p>
								</div>
								<div class="rounded-xl border border-white/5 bg-black/40 p-3 text-center transition-all group-hover:border-white/10 group-hover:bg-black/50">
									<p class="text-[9px] font-black uppercase tracking-widest text-slate-500">Txns</p>
									<p class="mt-0.5 text-sm font-bold text-white">{token.txns}</p>
								</div>
								<div class="rounded-xl border border-white/5 bg-black/40 p-3 text-center transition-all group-hover:border-white/10 group-hover:bg-black/50">
									<p class="text-[9px] font-black uppercase tracking-widest text-slate-500">Vol</p>
									<p class="mt-0.5 text-sm font-bold text-white">{token.volume}</p>
								</div>
							</div>

							<!-- Holders -->
							<div class="mb-4 flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-2">
								<span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Holders</span>
								<span class="text-sm font-black text-white">{token.holders}</span>
							</div>

							<!-- Footer -->
							<div class="flex items-center justify-between pt-2">
								<div class="flex items-center gap-2">
									<span class="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
									<span class="text-[10px] font-bold text-slate-500">Live</span>
								</div>
								<a 
									href="/swap"
									class="rounded-xl border border-[#ff0050]/30 bg-[#ff0050]/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-pink-400 transition-all hover:bg-[#ff0050] hover:text-white hover:border-[#ff0050] hover:shadow-[0_0_15px_rgba(255,0,80,0.3)] active:scale-95"
								>
									Buy Now
								</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Viral Stats -->
		<div class="mt-16 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#ff0050]/10 via-purple-500/5 to-cyan-500/10 p-8 backdrop-blur-2xl shadow-2xl">
			<div class="flex flex-col items-center text-center">
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff0050] to-[#ff4081] text-3xl shadow-xl shadow-pink-500/30">📱</div>
				<h2 class="text-2xl font-black tracking-tighter text-white sm:text-3xl">VIRAL TOKEN DASHBOARD</h2>
				<p class="mt-2 max-w-xl text-slate-400">Track the meme tokens that are breaking the internet right now.</p>
				
				<div class="mt-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="rounded-2xl border border-white/8 bg-black/40 p-4 backdrop-blur-sm">
						<p class="text-[10px] font-black uppercase tracking-widest text-[#ff0050]">24h Volume</p>
						<p class="mt-1 text-2xl font-black text-white">$15.77B</p>
					</div>
					<div class="rounded-2xl border border-white/8 bg-black/40 p-4 backdrop-blur-sm">
						<p class="text-[10px] font-black uppercase tracking-widest text-[#00f2ea]">24h Txns</p>
						<p class="mt-1 text-2xl font-black text-white">38.3M</p>
					</div>
					<div class="rounded-2xl border border-white/8 bg-black/40 p-4 backdrop-blur-sm">
						<p class="text-[10px] font-black uppercase tracking-widest text-pink-400">New Pairs</p>
						<p class="mt-1 text-2xl font-black text-white">142,877</p>
					</div>
					<div class="rounded-2xl border border-white/8 bg-black/40 p-4 backdrop-blur-sm">
						<p class="text-[10px] font-black uppercase tracking-widest text-amber-400">Chains</p>
						<p class="mt-1 text-2xl font-black text-white">78+</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom CTA -->
		<div class="mt-16 flex flex-col items-center rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-pink-500/15 p-12 text-center backdrop-blur-3xl shadow-2xl">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff0050] to-[#00f2ea] text-3xl shadow-xl">🚀</div>
			<h2 class="text-3xl font-black tracking-tighter text-white sm:text-4xl drop-shadow-lg">MISSING THE NEXT VIRAL?</h2>
			<p class="mt-4 max-w-xl text-slate-400">Join the JamCat alpha group to get notified about the hottest viral tokens before they moon.</p>
			<div class="mt-8 flex gap-3">
				<button class="rounded-full bg-gradient-to-r from-[#ff0050] to-[#ff4081] px-8 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-500/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-pink-500/30 active:scale-95">JOIN TELEGRAM</button>
				<button class="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/30 active:scale-95">View All Trending</button>
			</div>
		</div>

		<!-- Footer -->
		<p class="mt-12 text-center font-mono text-[10px] text-white/25">
			Data provided by community sources. Not financial advice. DYOR.
		</p>
	</div>
</div>

<style>
	@keyframes tiktok-gradient {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	:global(.animate-tiktok) {
		background-size: 200% auto;
		animation: tiktok-gradient 3s ease infinite;
	}
</style>
