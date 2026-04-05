<script>
	import { onMount } from 'svelte';

	const categories = [
		{ id: 'latest', label: 'Latest', icon: '⚡', url: 'https://cointelegraph.com/rss' },
		{ id: 'crypto', label: 'Crypto', icon: '₿', url: 'https://cointelegraph.com/rss/tag/bitcoin' },
		{ id: 'ai', label: 'AI & Tech', icon: '🤖', url: 'https://cointelegraph.com/rss/tag/artificial-intelligence' },
		{ id: 'finance', label: 'Markets', icon: '📈', url: 'https://cointelegraph.com/rss/tag/finance' }
	];

	const MARKET_IDS = [
		'bitcoin',
		'ethereum',
		'solana',
		'artificial-superintelligence-alliance',
		'bittensor',
		'dogwifcoin'
	];

	let activeCategory = $state(categories[0].id);
	let newsFeed = $state([]);
	let loading = $state(true);
	let errorState = $state(false);

	let marketData = $state([]);
	let marketLoading = $state(true);
	let marketError = $state('');

	let globalStats = $state(null);
	let globalLoading = $state(true);
	let globalError = $state('');

	let trendingCoins = $state([]);
	let trendingLoading = $state(true);
	let trendingError = $state('');

	let sidebarUpdatedAt = $state('');
	let sparklineData = $state(Array.from({ length: 12 }, () => Math.random() * 100));

	let featuredNews = $derived(newsFeed.length > 0 ? newsFeed[0] : null);
	let listNews = $derived(newsFeed.slice(1));

	async function fetchNews(categoryId) {
		loading = true;
		errorState = false;
		newsFeed = [];

		const category = categories.find((item) => item.id === categoryId) ?? categories[0];

		try {
			const endpoint = `/api/news?url=${encodeURIComponent(category.url)}`;
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error(`News request failed with ${response.status}`);

			const data = await response.json();
			if (data.status !== 'ok') throw new Error('News feed returned a non-ok status');

			const wordCount = (text) => text?.split(/\s+/).length || 0;
			const readTime = (text) => Math.max(1, Math.ceil(wordCount(text) / 200));

			newsFeed = data.items.map((item, index) => {
				let thumbnail = item.enclosure?.link || '';
				if (!thumbnail && item.content) {
					const match = item.content.match(/src="([^"]+)"/);
					if (match) thumbnail = match[1];
				}

				const cleanDesc = item.description.replace(/<[^>]*>?/gm, '').trim();
				const fullText = item.content?.replace(/<[^>]*>?/gm, '') || cleanDesc;

				return {
					id: `${categoryId}-${index}`,
					title: item.title,
					link: item.link,
					date: new Date(item.pubDate).toLocaleDateString([], {
						month: 'short',
						day: 'numeric',
						year: 'numeric'
					}),
					time: new Date(item.pubDate).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit'
					}),
					author: item.author || 'Network',
					categories: item.categories || [],
					desc: cleanDesc
						? `${cleanDesc.substring(0, 180)}...`
						: 'Open the article for the full breakdown.',
					thumbnail: thumbnail || `https://picsum.photos/seed/jamcat-news-${index}/600/400`,
					readTime: readTime(fullText)
				};
			});
		} catch (error) {
			console.error('Failed to fetch news:', error);
			errorState = true;
		} finally {
			loading = false;
		}
	}

	async function fetchMarketMovers({ silent = false } = {}) {
		if (!silent) marketLoading = true;
		marketError = '';

		try {
			const endpoint =
				`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${MARKET_IDS.join(',')}` +
				'&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=24h';
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error(`Market request failed with ${response.status}`);

			const data = await response.json();
			marketData = data.map((asset) => ({
				id: asset.id,
				symbol: asset.symbol.toUpperCase(),
				name: asset.name,
				price: asset.current_price,
				change: asset.price_change_percentage_24h,
				vol: asset.total_volume,
				marketCap: asset.market_cap,
				rank: asset.market_cap_rank,
				image: asset.image,
				sparkline: Array.from({ length: 10 }, () => Math.random() * 100)
			}));
		} catch (error) {
			console.error('Markets fetch failed:', error);
			marketError = 'Live prices are temporarily unavailable.';
		} finally {
			marketLoading = false;
		}
	}

	async function fetchGlobalStats({ silent = false } = {}) {
		if (!silent) globalLoading = true;
		globalError = '';

		try {
			const response = await fetch('https://api.coingecko.com/api/v3/global');
			if (!response.ok) throw new Error(`Global request failed with ${response.status}`);

			const payload = await response.json();
			globalStats = {
				marketCap: payload.data?.total_market_cap?.usd ?? null,
				volume: payload.data?.total_volume?.usd ?? null,
				btcDominance: payload.data?.market_cap_percentage?.btc ?? null,
				marketCapChange: payload.data?.market_cap_change_percentage_24h_usd ?? null,
				activeCryptos: payload.data?.active_cryptocurrencies ?? null
			};
		} catch (error) {
			console.error('Global market fetch failed:', error);
			globalError = 'Global market pulse is unavailable.';
		} finally {
			globalLoading = false;
		}
	}

	async function fetchTrendingCoins({ silent = false } = {}) {
		if (!silent) trendingLoading = true;
		trendingError = '';

		try {
			const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
			if (!response.ok) throw new Error(`Trending request failed with ${response.status}`);

			const payload = await response.json();
			trendingCoins = (payload.coins || []).slice(0, 6).map(({ item }, index) => ({
				id: item.id || `${item.name}-${index}`,
				name: item.name,
				symbol: item.symbol?.toUpperCase() || '--',
				rank: item.market_cap_rank ?? item.data?.market_cap_rank ?? '--',
				price:
					typeof item.data?.price === 'number'
						? item.data.price
						: typeof item.data?.price === 'string'
							? Number(item.data.price.replace(/[^0-9.-]/g, ''))
							: null,
				priceBtc: item.price_btc ?? item.data?.price_btc ?? null,
				image: item.small || item.thumb || '',
				link: item.slug
					? `https://www.coingecko.com/en/coins/${item.slug}`
					: 'https://www.coingecko.com'
			}));
		} catch (error) {
			console.error('Trending fetch failed:', error);
			trendingError = 'Trending radar is unavailable.';
		} finally {
			trendingLoading = false;
		}
	}

	async function refreshSidebarData({ silent = false } = {}) {
		await Promise.allSettled([
			fetchMarketMovers({ silent }),
			fetchGlobalStats({ silent }),
			fetchTrendingCoins({ silent })
		]);

		sidebarUpdatedAt = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
		sparklineData = sparklineData.map(() => Math.random() * 100);
	}

	onMount(() => {
		fetchNews(activeCategory);
		refreshSidebarData();

		const sidebarPollId = setInterval(() => {
			refreshSidebarData({ silent: true });
		}, 60000);

		return () => clearInterval(sidebarPollId);
	});

	function handleCategoryClick(id) {
		if (id !== activeCategory) {
			activeCategory = id;
			fetchNews(id);
		}
	}

	const fmtPrice = (price) => {
		if (price === null || Number.isNaN(price)) return '--';
		if (price >= 1000) {
			return price.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
		}
		if (price >= 1) {
			return price.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
		}
		return `$${price.toPrecision(4)}`;
	};

	const fmtCompact = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			notation: 'compact',
			maximumFractionDigits: 2
		}).format(value);
	};

	const fmtVol = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
		if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
		if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
		return `$${value.toFixed(0)}`;
	};

	const fmtChange = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	};

	const fmtDominance = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		return `${value.toFixed(1)}%`;
	};

	const fmtBtc = (value) => {
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) return 'CoinGecko';
		return `${numeric.toFixed(8)} BTC`;
	};

	const catColors = [
		'text-pink-400 bg-pink-400/10 border-pink-400/20',
		'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
		'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
		'text-green-400 bg-green-400/10 border-green-400/20',
		'text-purple-400 bg-purple-400/10 border-purple-400/20'
	];
	const getCatColor = (str) => catColors[str.length % catColors.length];
</script>

<svelte:head>
	<title>News | JamCat</title>
	<meta
		name="description"
		content="Live crypto and AI news with real market movers, global market pulse, and trending assets."
	/>
</svelte:head>

<div class="min-h-screen bg-[#0a0b0f] text-white">
	<!-- Ambient Background -->
	<div class="pointer-events-none fixed inset-0">
		<div class="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[150px]"></div>
		<div class="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[120px]"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- ── Hero Header ── -->
		<div class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<div class="mb-2 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xl shadow-lg shadow-cyan-500/20">📰</div>
					<div class="flex items-center gap-2">
						<span class="text-xs font-black tracking-[0.3em] text-cyan-400 uppercase">JamCat News</span>
						<span class="flex h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
					</div>
				</div>
				<h1 class="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
					<span class="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">News Terminal</span>
				</h1>
				<p class="mt-2 max-w-md text-sm text-slate-400">Real-time crypto newsdesk with live market data, trending assets, and macro context.</p>
			</div>

			<!-- Category Pills -->
			<div class="flex flex-wrap items-center gap-2">
				{#each categories as cat (cat.id)}
					<button type="button" onclick={() => handleCategoryClick(cat.id)} disabled={loading}
						class="group relative overflow-hidden rounded-full border px-4 py-2.5 text-xs font-bold tracking-wide transition-all duration-300
						{activeCategory === cat.id ? 'border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50'}">
						<span class="relative z-10 flex items-center gap-1.5">
							<span class="text-sm">{cat.icon}</span>{cat.label}
						</span>
						{#if activeCategory === cat.id}
							<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#if loading}
			<div class="flex h-64 flex-col items-center justify-center gap-4">
				<div class="relative">
					<div class="h-14 w-14 animate-spin rounded-full border-4 border-slate-800 border-t-cyan-500"></div>
					<div class="absolute inset-0 h-14 w-14 animate-pulse rounded-full border-4 border-cyan-500/30"></div>
				</div>
				<p class="text-sm font-bold tracking-widest text-slate-500 uppercase">Fetching the alpha...</p>
			</div>
		{:else if errorState}
			<div class="rounded-2xl border border-red-500/20 bg-red-500/10 p-12 text-center">
				<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-3xl">⚠️</div>
				<h2 class="text-xl font-bold text-red-400">Feed temporarily unavailable</h2>
				<p class="mt-2 text-sm text-slate-400">Our news sources are experiencing issues. Please try again in a moment.</p>
				<button onclick={() => fetchNews(activeCategory)} class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20">↻ Retry</button>
			</div>
		{:else}
			<div class="flex flex-col gap-8 lg:flex-row xl:gap-12">
				<div class="min-w-0 flex-1">
					{#if featuredNews}
						<a href={featuredNews.link} target="_blank" rel="noopener noreferrer"
							class="group relative mb-8 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] shadow-2xl shadow-black/50 transition-all duration-500 hover:-translate-y-1.5 hover:border-cyan-500/30 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)] md:h-[420px] md:flex-row">
							<div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px] opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>

							<div class="relative h-64 w-full overflow-hidden md:h-full md:w-1/2">
								<img src={featuredNews.thumbnail} alt={featuredNews.title} class="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"/>
								<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent md:bg-gradient-to-r md:from-transparent md:via-black/40 md:to-[#0a0b0f]"></div>
								<div class="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/20 px-3 py-1.5 backdrop-blur-md">
									<span class="flex h-2 w-2 rounded-full bg-pink-400 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
									<span class="text-[10px] font-black tracking-wider text-pink-300 uppercase">Top Story</span>
								</div>
							</div>

							<div class="relative z-10 flex w-full flex-col justify-center p-6 md:w-1/2 md:p-10">
								<div class="mb-4 flex flex-wrap items-center gap-2">
									{#each featuredNews.categories.slice(0, 3) as cat}
										<span class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-wide text-slate-300 {getCatColor(cat)}">{cat}</span>
									{/each}
								</div>
								<h2 class="mb-3 text-2xl leading-tight font-black text-white transition-colors group-hover:text-cyan-100 sm:text-3xl">{featuredNews.title}</h2>
								<p class="mb-6 line-clamp-3 text-sm leading-relaxed font-medium text-slate-400">{featuredNews.desc}</p>
								<div class="mt-auto flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-500">
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-sm">✍️</div>
										<div>
											<p class="font-bold text-slate-300">{featuredNews.author}</p>
											<p class="text-[10px] uppercase tracking-wider">{featuredNews.date}</p>
										</div>
									</div>
									<div class="flex items-center gap-3">
										<span class="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
											<span class="text-slate-400">⏱</span>
											<span class="font-bold text-slate-300">{featuredNews.readTime} min read</span>
										</span>
										<span class="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 transition group-hover:bg-cyan-500 group-hover:text-white">→</span>
									</div>
								</div>
							</div>
						</a>
					{/if}

					<div class="flex flex-col gap-3">
						{#each listNews as item, index (item.id)}
							<a href={item.link} target="_blank" rel="noopener noreferrer"
								class="group flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-cyan-500/20 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-cyan-500/5"
								style={`animation: fadeUp 0.4s ease-out ${index * 0.05}s backwards;`}>
								<div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10">
									<img src={item.thumbnail} alt={item.title} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy"/>
								</div>

								<div class="min-w-0 flex-1">
									<div class="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
										<span class="text-cyan-400">{item.time}</span>
										<span class="text-slate-600">•</span>
										<span class="text-slate-400">{item.author}</span>
										{#if item.categories.length > 0}
											<span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-wide text-slate-300 {getCatColor(item.categories[0])}">{item.categories[0]}</span>
										{/if}
									</div>
									<h3 class="mb-1 line-clamp-2 text-sm leading-tight font-bold text-slate-200 transition-colors group-hover:text-white">{item.title}</h3>
									<p class="line-clamp-1 text-xs text-slate-500">{item.desc}</p>
								</div>

								<div class="hidden shrink-0 flex-col items-center gap-1 sm:flex">
									<span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition group-hover:bg-cyan-500/20 group-hover:text-cyan-400">→</span>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<div class="flex w-full shrink-0 flex-col gap-5 lg:w-[320px] xl:w-[360px]">
					<!-- Market Pulse -->
					<div class="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0e12] shadow-xl shadow-black/50">
						<div class="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-sm">🌍</span>
									<h3 class="text-sm font-bold text-white">Market Pulse</h3>
								</div>
								<span class="text-[10px] font-semibold text-slate-500">{sidebarUpdatedAt || 'Loading...'}</span>
							</div>
						</div>

						{#if globalError}
							<div class="p-4 text-sm text-red-400">{globalError}</div>
						{:else if globalLoading}
							<div class="grid grid-cols-2 gap-2 p-3">
								{#each [1,2,3,4] as i}
									<div class="rounded-xl bg-white/5 p-3">
										<div class="h-2.5 w-14 animate-pulse rounded bg-white/10"></div>
										<div class="mt-2 h-5 w-16 animate-pulse rounded bg-white/10"></div>
									</div>
								{/each}
							</div>
						{:else if globalStats}
							<div class="grid grid-cols-2 gap-2 p-3">
								{#each [
									{ label: 'Total Cap', value: fmtCompact(globalStats.marketCap), icon: '💎', color: 'from-cyan-500/20 to-blue-500/20', text: 'text-cyan-300' },
									{ label: '24H Volume', value: fmtCompact(globalStats.volume), icon: '📊', color: 'from-amber-500/20 to-orange-500/20', text: 'text-amber-300' },
									{ label: 'BTC Dom', value: fmtDominance(globalStats.btcDominance), icon: '₿', color: 'from-purple-500/20 to-pink-500/20', text: 'text-purple-300' },
									{ label: '24H Chg', value: fmtChange(globalStats.marketCapChange), icon: globalStats.marketCapChange >= 0 ? '📈' : '📉', color: globalStats.marketCapChange >= 0 ? 'from-green-500/20 to-emerald-500/20' : 'from-red-500/20 to-rose-500/20', text: globalStats.marketCapChange >= 0 ? 'text-green-400' : 'text-red-400' }
								] as stat}
									<div class="rounded-xl border border-white/[0.06] bg-gradient-to-br {stat.color} p-3 transition hover:border-white/10">
										<div class="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
											<span>{stat.icon}</span>{stat.label}
										</div>
										<p class="font-mono text-base font-black {stat.text}">{stat.value}</p>
									</div>
								{/each}
							</div>
							<!-- Mini sparkline -->
							<div class="px-3 pb-3">
								<div class="flex items-end gap-0.5 h-8">
									{#each sparklineData as h}
										<div class="flex-1 rounded-t bg-cyan-500/30 transition-all" style="height: {h}%"></div>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Market Movers -->
					<div class="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0e12] shadow-xl shadow-black/50">
						<div class="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-sm">📈</span>
									<h3 class="text-sm font-bold text-white">Market Movers</h3>
								</div>
								<div class="flex h-2 w-2 rounded-full {marketLoading ? 'animate-pulse bg-yellow-400' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]'}"></div>
							</div>
						</div>

						{#if marketError}
							<div class="p-4 text-sm text-red-400">{marketError}</div>
						{:else}
							<div class="divide-y divide-white/[0.04] p-2">
								{#each marketData as asset (asset.id)}
									<div class="group flex items-center justify-between rounded-xl p-2.5 transition hover:bg-white/[0.03]">
										<div class="flex items-center gap-2.5">
											<img src={asset.image} alt={asset.name} class="h-9 w-9 shrink-0 rounded-full border border-white/10 bg-black/50 object-cover" />
											<div>
												<div class="flex items-center gap-1.5">
													<p class="text-sm font-bold text-white transition-colors">{asset.name}</p>
													<span class="text-[10px] font-black text-slate-500">#{asset.rank}</span>
												</div>
												<!-- Sparkline -->
												<div class="mt-1 flex items-end gap-px h-4 w-20">
													{#each asset.sparkline as h}
														<div class="flex-1 rounded-t {asset.change >= 0 ? 'bg-green-500/40' : 'bg-red-500/40'}" style="height: {h}%"></div>
													{/each}
												</div>
											</div>
										</div>
										<div class="text-right">
											<p class="font-mono text-sm font-black text-slate-200">{fmtPrice(asset.price)}</p>
											<p class="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] font-bold {asset.change >= 0 ? 'text-green-400' : 'text-red-400'}">
												{asset.change >= 0 ? '▲' : '▼'}{fmtChange(asset.change)}
											</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Trending Radar -->
					<div class="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0e12] shadow-xl shadow-black/50">
						<div class="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
							<div class="flex items-center gap-2">
								<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 text-sm">🔥</span>
								<h3 class="text-sm font-bold text-white">Trending Radar</h3>
							</div>
						</div>

						{#if trendingError}
							<div class="p-4 text-sm text-red-400">{trendingError}</div>
						{:else if trendingLoading}
							<div class="space-y-1.5 p-2">
								{#each [1,2,3,4,5] as i}
									<div class="rounded-xl bg-white/5 p-3">
										<div class="h-2.5 w-20 animate-pulse rounded bg-white/10"></div>
										<div class="mt-2 h-4 w-28 animate-pulse rounded bg-white/10"></div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="space-y-1 p-2">
								{#each trendingCoins as coin, i (coin.id)}
									<a href={coin.link} target="_blank" rel="noreferrer"
										class="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-orange-500/30 hover:bg-white/[0.04]">
										<div class="flex items-center gap-2.5">
											<div class="relative">
												<img src={coin.image} alt={coin.name} class="h-8 w-8 rounded-full border border-white/10 object-cover" />
												<span class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-black text-white">{i + 1}</span>
											</div>
											<div>
												<div class="flex items-center gap-1.5">
													<p class="text-sm font-bold text-white transition-colors group-hover:text-orange-300">{coin.name}</p>
													<span class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">{coin.symbol}</span>
												</div>
												<p class="text-[10px] text-slate-500">Rank #{coin.rank}</p>
											</div>
										</div>
										<div class="text-right">
											<p class="font-mono text-sm font-black text-orange-300">{coin.price !== null ? fmtPrice(coin.price) : '--'}</p>
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
