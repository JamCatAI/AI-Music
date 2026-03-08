<script>
	import { onMount } from 'svelte';

	// Category configuration
	const categories = [
		{ id: 'latest', label: 'Latest', url: 'https://cointelegraph.com/rss' },
		{ id: 'crypto', label: 'Crypto', url: 'https://cointelegraph.com/rss/tag/bitcoin' },
		{ id: 'ai', label: 'AI & Tech', url: 'https://cointelegraph.com/rss/tag/artificial-intelligence' },
		{ id: 'finance', label: 'Finance & Markets', url: 'https://cointelegraph.com/rss/tag/finance' }
	];

	let activeCategory = $state(categories[0].id);
	let newsFeed = $state([]);
	let loading = $state(true);
	let errorState = $state(false);

	// Sidebar Market Data
	let marketData = $state([]);
	let marketLoading = $state(true);

	// The first item will be featured (Hero)
	let featuredNews = $derived(newsFeed.length > 0 ? newsFeed[0] : null);
	// The rest go into the dense feed list
	let listNews = $derived(newsFeed.slice(1));

	async function fetchNews(categoryId) {
		loading = true;
		errorState = false;
		newsFeed = [];
		const catInfo = categories.find(c => c.id === categoryId);
		
		try {
			const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(catInfo.url)}`);
			const data = await res.json();
			if (data.status === 'ok') {
				newsFeed = data.items.map(item => {
					let thumb = item.enclosure?.link || '';
					if (!thumb && item.content) {
						const match = item.content.match(/src="([^"]+)"/);
						if (match) thumb = match[1];
					}
					const cleanDesc = item.description.replace(/<[^>]*>?/gm, '').substring(0, 180) + '...';

					return {
						title: item.title,
						link: item.link,
						date: new Date(item.pubDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
						time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
						author: item.author || 'Network',
						categories: item.categories || [],
						desc: cleanDesc,
						thumbnail: thumb || 'https://picsum.photos/seed/' + Math.random() + '/600/400'
					};
				});
			} else {
				throw new Error('API returned non-ok status');
			}
		} catch (err) {
			console.error('Failed to fetch news:', err);
			errorState = true;
		} finally {
			loading = false;
		}
	}

	async function fetchMarketMovers() {
		try {
			const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,artificial-superintelligence-alliance,bittensor&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true');
			if (!res.ok) throw new Error('CoinGecko fetch failed');
			const data = await res.json();
			
			marketData = [
				{ symbol: 'BTC', name: 'Bitcoin', price: data['bitcoin'].usd, change: data['bitcoin'].usd_24h_change, vol: data['bitcoin'].usd_24h_vol },
				{ symbol: 'ETH', name: 'Ethereum', price: data['ethereum'].usd, change: data['ethereum'].usd_24h_change, vol: data['ethereum'].usd_24h_vol },
				{ symbol: 'SOL', name: 'Solana', price: data['solana'].usd, change: data['solana'].usd_24h_change, vol: data['solana'].usd_24h_vol },
				{ symbol: 'FET', name: 'Artificial S.A.', price: data['artificial-superintelligence-alliance'].usd, change: data['artificial-superintelligence-alliance'].usd_24h_change, vol: data['artificial-superintelligence-alliance'].usd_24h_vol },
				{ symbol: 'TAO', name: 'Bittensor', price: data['bittensor'].usd, change: data['bittensor'].usd_24h_change, vol: data['bittensor'].usd_24h_vol },
			];
		} catch (err) {
			console.error('Markets fetch failed:', err);
			// Fallback simulated data
			marketData = [
				{ symbol: 'BTC', name: 'Bitcoin', price: 68420.50, change: 2.4, vol: 32000000000 },
				{ symbol: 'ETH', name: 'Ethereum', price: 3450.20, change: -1.2, vol: 15000000000 },
				{ symbol: 'SOL', name: 'Solana', price: 185.60, change: 5.8, vol: 5000000000 },
				{ symbol: 'FET', name: 'Artificial S.A.', price: 1.42, change: 12.5, vol: 450000000 },
				{ symbol: 'TAO', name: 'Bittensor', price: 420.69, change: -3.4, vol: 210000000 },
			];
		} finally {
			marketLoading = false;
		}
	}

	onMount(() => {
		fetchNews(activeCategory);
		fetchMarketMovers();
	});

	// Handle tab switching
	$effect(() => {
		// Only re-fetch if the activeCategory actually changed and we aren't already loading
		if (!loading) {
			// This effect intentionally responds to activeCategory changes down below in the UI
		}
	});

	function handleCategoryClick(id) {
		if (id !== activeCategory) {
			activeCategory = id;
			fetchNews(id);
		}
	}

	// Formatting utils
	const fmtPrice = (p) => (p >= 1000 ? p.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : p.toLocaleString('en-US', { style: 'currency', currency: 'USD' }));
	const fmtVol = (v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : `$${(v/1e6).toFixed(1)}M`;
	const fmtChange = (c) => `${c >= 0 ? '+' : ''}${c.toFixed(2)}%`;

	// Colors for dynamic category tags
	const catColors = ['text-pink-400 bg-pink-400/10 border-pink-400/20', 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', 'text-green-400 bg-green-400/10 border-green-400/20', 'text-purple-400 bg-purple-400/10 border-purple-400/20'];
	const getCatColor = (str) => catColors[str.length % catColors.length];
</script>

<svelte:head>
	<title>News | JamCat</title>
</svelte:head>

<div class="min-h-screen bg-[#0f1011] text-white">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

		<!-- Header & Categories -->
		<div class="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
			<div class="text-center lg:text-left">
				<h1 class="text-4xl font-black tracking-tight drop-shadow-md sm:text-5xl">📰 <span class="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">News Terminal</span></h1>
				<p class="mt-3 text-sm font-semibold text-slate-400 sm:text-base">Real-time market intel and sector analysis.</p>
			</div>

			<!-- Category Tabs -->
			<div class="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/5 bg-black/40 p-1.5 shadow-inner backdrop-blur-md lg:justify-start">
				{#each categories as cat}
					<button
						onclick={() => handleCategoryClick(cat.id)}
						disabled={loading}
						class="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300
							{activeCategory === cat.id 
								? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/30' 
								: 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent disabled:opacity-50'}"
					>{cat.label}</button>
				{/each}
			</div>
		</div>

		{#if loading}
			<div class="flex h-64 flex-col items-center justify-center space-y-4">
				<div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-pink-500"></div>
				<p class="font-bold tracking-widest text-slate-500 uppercase">Fetching the alpha...</p>
			</div>
		{:else if errorState}
			<div class="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center">
				<p class="mb-2 text-4xl">⚠️</p>
				<h2 class="text-xl font-bold text-red-400">Unable to load the news feed.</h2>
				<p class="mt-2 text-sm text-slate-400">The matrix is glitching. Please try again later.</p>
			</div>
		{:else}

		<!-- Layout Grid: Main Feed (Left/Center) + Sidebar (Right) -->
		<div class="flex flex-col gap-8 lg:flex-row xl:gap-12">
			
			<!-- MAIN FEED (Left/Center) -->
			<div class="flex-1 min-w-0">
				
				<!-- Featured Article Hero -->
				{#if featuredNews}
					<a href={featuredNews.link} target="_blank" rel="noopener noreferrer" class="group relative mb-8 flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 transition-all duration-500 hover:-translate-y-1 hover:border-pink-500/40 hover:shadow-[0_0_40px_rgba(236,72,153,0.2)] md:h-[400px] md:flex-row shadow-2xl">
						
						<!-- Background Ambient Glow -->
						<div class="absolute -inset-40 z-0 bg-pink-500/10 blur-[100px] transition-all duration-700 group-hover:bg-purple-500/20"></div>

						<!-- Image Section -->
						<div class="relative h-64 w-full overflow-hidden md:h-full md:w-1/2">
							<img src={featuredNews.thumbnail} alt={featuredNews.title} class="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
							<!-- Inner shadow overlay -->
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0f1011]"></div>
						</div>

						<!-- Content Section -->
						<div class="relative z-10 flex w-full flex-col justify-center p-6 md:w-1/2 md:p-10 backdrop-blur-sm">
							<div class="mb-3 flex flex-wrap items-center gap-2">
								<span class="rounded-full border border-pink-500/50 bg-pink-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] backdrop-blur-md">
									<span class="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500"></span>Top Story
								</span>
								{#if featuredNews.categories.length > 0}
									<span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{featuredNews.categories[0]}</span>
								{/if}
							</div>
							<h2 class="mb-3 text-xl font-black leading-tight text-white drop-shadow-md sm:text-2xl transition-colors group-hover:text-pink-100">{featuredNews.title}</h2>
							<p class="mb-5 line-clamp-3 text-xs font-medium leading-relaxed text-slate-300">{featuredNews.desc}</p>
							<div class="mt-auto flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
								<span class="flex items-center gap-2">
									<span class="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">✍️</span>
									{featuredNews.author}
								</span>
								<span>{featuredNews.date} • {featuredNews.time}</span>
							</div>
						</div>
					</a>
				{/if}

				<!-- Dense List Feed (Terminal Style) -->
				<div class="flex flex-col gap-4">
					{#each listNews as item, i}
						<a href={item.link} target="_blank" rel="noopener noreferrer" class="group flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/5 hover:shadow-xl hover:shadow-cyan-500/5" style="animation: fadeUp 0.4s ease-out {i * 0.05}s backwards;">
							
							<!-- Thumbnail Snippet -->
							<div class="relative h-24 w-full sm:w-36 shrink-0 overflow-hidden rounded-xl border border-white/10">
								<img src={item.thumbnail} alt={item.title} class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
							</div>

							<!-- Content -->
							<div class="flex-1 min-w-0 flex flex-col justify-center">
								<div class="mb-2 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
									<span class="text-cyan-400">{item.time}</span>
									<span class="text-slate-600">•</span>
									<span class="text-slate-400">{item.author}</span>
									{#if item.categories.length > 0}
										<span class="text-slate-600">•</span>
										<span class="text-slate-500 truncate max-w-[120px]">{item.categories[0]}</span>
									{/if}
								</div>
								<h3 class="mb-1.5 text-base font-extrabold leading-tight text-slate-200 transition-colors group-hover:text-white drop-shadow-sm line-clamp-2">{item.title}</h3>
								<p class="line-clamp-1 text-xs text-slate-500 font-medium">{item.desc}</p>
							</div>
						</a>
					{/each}
				</div>
			</div>

			<!-- RIGHT SIDEBAR (Market Context) -->
			<div class="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col gap-6">
				
				<!-- Market Movers Widget -->
				<div class="rounded-3xl border border-white/10 bg-[#13141b] overflow-hidden shadow-2xl">
					<div class="border-b border-white/5 bg-black/40 px-5 py-4">
						<div class="flex items-center justify-between">
							<h3 class="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
								<span class="text-lg">📈</span> Market Movers
							</h3>
							<span class="flex h-2 w-2 rounded-full {marketLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]'}"></span>
						</div>
					</div>
					
					<div class="divide-y divide-white/5 p-2">
						{#each marketData as asset}
							<div class="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-xs font-black {asset.change >= 0 ? 'text-green-400' : 'text-red-400'} shadow-inner">
										{asset.symbol}
									</div>
									<div>
										<p class="text-sm font-bold text-white group-hover:text-cyan-100 transition-colors">{asset.name}</p>
										<p class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Vol {fmtVol(asset.vol)}</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-sm font-black text-slate-200 font-mono tracking-tighter">{fmtPrice(asset.price)}</p>
									<p class="text-[11px] font-bold {asset.change >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center justify-end gap-0.5 mt-0.5">
										{asset.change >= 0 ? '▲' : '▼'} {fmtChange(Math.abs(asset.change))}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Newsletter Widget / Ad space -->
				<div class="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/5 p-6 shadow-xl">
					<div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-pink-500/20 blur-[30px] pointer-events-none"></div>
					<h3 class="mb-2 text-lg font-black text-white">Daily Alpha Drop</h3>
					<p class="mb-5 text-xs font-medium text-slate-400 leading-relaxed">Join 45,000+ degens getting the most actionable crypto and AI intel delivered straight to their inbox.</p>
					<div class="flex flex-col gap-2">
						<input type="email" placeholder="Enter your email" class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500/50 focus:bg-pink-900/10 transition-colors" />
						<button class="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all">
							Subscribe
						</button>
					</div>
				</div>

			</div>
		</div>

		{/if}
	</div>
</div>

<style>
	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
