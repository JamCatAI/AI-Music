<script>
	import { onMount } from 'svelte';

	const categories = [
		{ id: 'latest', label: 'Latest', url: 'https://cointelegraph.com/rss' },
		{ id: 'crypto', label: 'Crypto', url: 'https://cointelegraph.com/rss/tag/bitcoin' },
		{
			id: 'ai',
			label: 'AI & Tech',
			url: 'https://cointelegraph.com/rss/tag/artificial-intelligence'
		},
		{ id: 'finance', label: 'Finance & Markets', url: 'https://cointelegraph.com/rss/tag/finance' }
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

			newsFeed = data.items.map((item, index) => {
				let thumbnail = item.enclosure?.link || '';
				if (!thumbnail && item.content) {
					const match = item.content.match(/src="([^"]+)"/);
					if (match) thumbnail = match[1];
				}

				const cleanDesc = item.description.replace(/<[^>]*>?/gm, '').trim();

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
					thumbnail: thumbnail || `https://picsum.photos/seed/jamcat-news-${index}/600/400`
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
				image: asset.image
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

<div class="min-h-screen bg-[#0f1011] text-white">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
			<div class="text-center lg:text-left">
				<h1 class="text-4xl font-black tracking-tight drop-shadow-md sm:text-5xl">
					📰 <span
						class="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
						>News Terminal</span
					>
				</h1>
				<p class="mt-3 text-sm font-semibold text-slate-400 sm:text-base">
					Real-time newsdesk with live market tape, trending radar, and macro context.
				</p>
			</div>

			<div
				class="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/5 bg-black/40 p-1.5 shadow-inner backdrop-blur-md lg:justify-start"
			>
				{#each categories as cat (cat.id)}
					<button
						type="button"
						onclick={() => handleCategoryClick(cat.id)}
						disabled={loading}
						class="rounded-xl border border-transparent px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300
							{activeCategory === cat.id
							? 'border-blue-500/30 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
							: 'text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-50'}"
					>
						{cat.label}
					</button>
				{/each}
			</div>
		</div>

		{#if loading}
			<div class="flex h-64 flex-col items-center justify-center space-y-4">
				<div
					class="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-pink-500"
				></div>
				<p class="font-bold tracking-widest text-slate-500 uppercase">Fetching the alpha...</p>
			</div>
		{:else if errorState}
			<div class="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center">
				<p class="mb-2 text-4xl">⚠️</p>
				<h2 class="text-xl font-bold text-red-400">Unable to load the news feed.</h2>
				<p class="mt-2 text-sm text-slate-400">The matrix is glitching. Please try again later.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-8 lg:flex-row xl:gap-12">
				<div class="min-w-0 flex-1">
					{#if featuredNews}
						<a
							href={featuredNews.link}
							target="_blank"
							rel="noopener noreferrer"
							class="group relative mb-8 flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-pink-500/40 hover:shadow-[0_0_40px_rgba(236,72,153,0.2)] md:h-[400px] md:flex-row"
						>
							<div
								class="absolute -inset-40 z-0 bg-pink-500/10 blur-[100px] transition-all duration-700 group-hover:bg-purple-500/20"
							></div>

							<div class="relative h-64 w-full overflow-hidden md:h-full md:w-1/2">
								<img
									src={featuredNews.thumbnail}
									alt={featuredNews.title}
									class="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
								/>
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0f1011]"
								></div>
							</div>

							<div
								class="relative z-10 flex w-full flex-col justify-center p-6 backdrop-blur-sm md:w-1/2 md:p-10"
							>
								<div class="mb-3 flex flex-wrap items-center gap-2">
									<span
										class="rounded-full border border-pink-500/50 bg-pink-500/20 px-3 py-1 text-[9px] font-black tracking-widest text-pink-400 uppercase shadow-[0_0_15px_rgba(236,72,153,0.3)] backdrop-blur-md"
									>
										<span
											class="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500"
										></span>
										Top Story
									</span>
									{#if featuredNews.categories.length > 0}
										<span class="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
											{featuredNews.categories[0]}
										</span>
									{/if}
								</div>
								<h2
									class="mb-3 text-xl leading-tight font-black text-white transition-colors group-hover:text-pink-100 sm:text-2xl"
								>
									{featuredNews.title}
								</h2>
								<p class="mb-5 line-clamp-3 text-xs leading-relaxed font-medium text-slate-300">
									{featuredNews.desc}
								</p>
								<div
									class="mt-auto flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase"
								>
									<span class="flex items-center gap-2">
										<span
											class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px]"
										>
											✍️
										</span>
										{featuredNews.author}
									</span>
									<span>{featuredNews.date} • {featuredNews.time}</span>
								</div>
							</div>
						</a>
					{/if}

					<div class="flex flex-col gap-4">
						{#each listNews as item, index (item.id)}
							<a
								href={item.link}
								target="_blank"
								rel="noopener noreferrer"
								class="group flex flex-col items-center gap-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/5 hover:shadow-xl hover:shadow-cyan-500/5 sm:flex-row"
								style={`animation: fadeUp 0.4s ease-out ${index * 0.05}s backwards;`}
							>
								<div
									class="relative h-24 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 sm:w-36"
								>
									<img
										src={item.thumbnail}
										alt={item.title}
										class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
										loading="lazy"
									/>
								</div>

								<div class="flex min-w-0 flex-1 flex-col justify-center">
									<div
										class="mb-2 flex flex-wrap items-center gap-2 text-[9px] font-bold tracking-widest uppercase"
									>
										<span class="text-cyan-400">{item.time}</span>
										<span class="text-slate-600">•</span>
										<span class="text-slate-400">{item.author}</span>
										{#if item.categories.length > 0}
											<span class="text-slate-600">•</span>
											<span class="max-w-[120px] truncate text-slate-500">
												{item.categories[0]}
											</span>
										{/if}
									</div>
									<h3
										class="mb-1.5 line-clamp-2 text-base leading-tight font-extrabold text-slate-200 transition-colors group-hover:text-white"
									>
										{item.title}
									</h3>
									<p class="line-clamp-1 text-xs font-medium text-slate-500">{item.desc}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<div class="flex w-full shrink-0 flex-col gap-6 lg:w-[320px] xl:w-[360px]">
					<div class="overflow-hidden rounded-3xl border border-white/10 bg-[#13141b] shadow-2xl">
						<div class="border-b border-white/5 bg-black/40 px-5 py-4">
							<div class="flex items-center justify-between">
								<h3
									class="flex items-center gap-2 text-sm font-black tracking-widest text-slate-300 uppercase"
								>
									<span class="text-lg">🌍</span> Market Pulse
								</h3>
								<span class="text-[10px] font-semibold text-slate-500">
									{sidebarUpdatedAt ? `Updated ${sidebarUpdatedAt}` : 'Loading'}
								</span>
							</div>
						</div>

						{#if globalError}
							<div class="p-5 text-sm text-red-200">{globalError}</div>
						{:else if globalLoading}
							<div class="grid grid-cols-2 gap-3 p-5">
								{#each Array.from({ length: 4 }, (_, index) => index) as index (index)}
									<div class="rounded-2xl bg-white/5 p-4">
										<div class="h-3 w-16 animate-pulse rounded bg-white/10"></div>
										<div class="mt-3 h-6 w-20 animate-pulse rounded bg-white/10"></div>
									</div>
								{/each}
							</div>
						{:else if globalStats}
							<div class="grid grid-cols-2 gap-3 p-4">
								{#each [{ label: 'Total Cap', value: fmtCompact(globalStats.marketCap), tone: 'text-cyan-300', key: 'cap' }, { label: '24H Volume', value: fmtCompact(globalStats.volume), tone: 'text-amber-300', key: 'vol' }, { label: 'BTC Dom', value: fmtDominance(globalStats.btcDominance), tone: 'text-purple-300', key: 'btc' }, { label: '24H Cap Chg', value: fmtChange(globalStats.marketCapChange), tone: globalStats.marketCapChange >= 0 ? 'text-green-400' : 'text-red-400', key: 'chg' }] as stat (stat.key)}
									<div class="rounded-2xl border border-white/5 bg-white/5 p-4">
										<p class="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
											{stat.label}
										</p>
										<p class={`mt-2 font-mono text-lg font-black ${stat.tone}`}>{stat.value}</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="overflow-hidden rounded-3xl border border-white/10 bg-[#13141b] shadow-2xl">
						<div class="border-b border-white/5 bg-black/40 px-5 py-4">
							<div class="flex items-center justify-between">
								<h3
									class="flex items-center gap-2 text-sm font-black tracking-widest text-slate-300 uppercase"
								>
									<span class="text-lg">📈</span> Market Movers
								</h3>
								<span
									class={`flex h-2 w-2 rounded-full ${marketLoading ? 'animate-pulse bg-yellow-400' : 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]'}`}
								></span>
							</div>
						</div>

						{#if marketError}
							<div class="p-5 text-sm text-red-200">{marketError}</div>
						{:else}
							<div class="divide-y divide-white/5 p-2">
								{#each marketData as asset (asset.id)}
									<div
										class="group flex cursor-default items-center justify-between rounded-2xl p-3 transition-colors hover:bg-white/5"
									>
										<div class="flex items-center gap-3">
											<img
												src={asset.image}
												alt={asset.name}
												class="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-black/50 object-cover"
											/>
											<div>
												<div class="flex items-center gap-2">
													<p
														class="text-sm font-bold text-white transition-colors group-hover:text-cyan-100"
													>
														{asset.name}
													</p>
													<span class="text-[10px] font-black text-slate-500">#{asset.rank}</span>
												</div>
												<p class="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
													{asset.symbol} · Vol {fmtVol(asset.vol)}
												</p>
											</div>
										</div>
										<div class="text-right">
											<p class="font-mono text-sm font-black tracking-tighter text-slate-200">
												{fmtPrice(asset.price)}
											</p>
											<p
												class={`mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-bold ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}
											>
												{asset.change >= 0 ? '▲' : '▼'}
												{fmtChange(asset.change)}
											</p>
											<p class="text-[10px] text-slate-500">{fmtCompact(asset.marketCap)}</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="overflow-hidden rounded-3xl border border-white/10 bg-[#13141b] shadow-2xl">
						<div class="border-b border-white/5 bg-black/40 px-5 py-4">
							<h3
								class="flex items-center gap-2 text-sm font-black tracking-widest text-slate-300 uppercase"
							>
								<span class="text-lg">🔥</span> Trending Radar
							</h3>
						</div>

						{#if trendingError}
							<div class="p-5 text-sm text-red-200">{trendingError}</div>
						{:else if trendingLoading}
							<div class="space-y-2 p-3">
								{#each Array.from({ length: 5 }, (_, index) => index) as index (index)}
									<div class="rounded-2xl bg-white/5 p-4">
										<div class="h-3 w-24 animate-pulse rounded bg-white/10"></div>
										<div class="mt-3 h-5 w-32 animate-pulse rounded bg-white/10"></div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="space-y-2 p-3">
								{#each trendingCoins as coin (coin.id)}
									<a
										href={coin.link}
										target="_blank"
										rel="noreferrer"
										class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-3 transition hover:border-cyan-400/30 hover:bg-white/10"
									>
										<div class="flex items-center gap-3">
											<img
												src={coin.image}
												alt={coin.name}
												class="h-10 w-10 rounded-full border border-white/10 object-cover"
											/>
											<div>
												<div class="flex items-center gap-2">
													<p class="text-sm font-bold text-white">{coin.name}</p>
													<span
														class={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${getCatColor(coin.symbol)}`}
													>
														{coin.symbol}
													</span>
												</div>
												<p class="text-[10px] tracking-wider text-slate-500 uppercase">
													Rank #{coin.rank}
												</p>
											</div>
										</div>
										<div class="text-right">
											<p class="font-mono text-xs font-black text-cyan-300">
												{coin.price !== null ? fmtPrice(coin.price) : '--'}
											</p>
											<p class="text-[10px] text-slate-500">
												{fmtBtc(coin.priceBtc)}
											</p>
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
