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

	// ── COLOR SYSTEM (x402 style) ──
	const newsColors = [
		{ ring: 'ring-cyan-400',   text: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/30',   glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',   bar: 'bg-cyan-400'   },
		{ ring: 'ring-green-400',  text: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30',  glow: 'shadow-[0_0_20px_rgba(74,222,128,0.3)]',   bar: 'bg-green-400'  },
		{ ring: 'ring-purple-400', text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.3)]', bar: 'bg-purple-400' },
		{ ring: 'ring-amber-400',  text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30',  glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',   bar: 'bg-amber-400'  },
		{ ring: 'ring-pink-400',   text: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/30',   glow: 'shadow-[0_0_20px_rgba(244,114,182,0.3)]',  bar: 'bg-pink-400'   },
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
	let newsSparkline = $state(Array.from({ length: 20 }, () => Math.random() * 60 + 20));

	let featuredNews = $derived(newsFeed.length > 0 ? newsFeed[0] : null);
	let listNews = $derived(newsFeed.slice(1));

	const getCatColor = (str) => newsColors[str.length % newsColors.length];

	// ── FETCH FUNCTIONS ──
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
					readTime: readTime(fullText),
					color: newsColors[index % newsColors.length]
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
			marketData = data.map((asset, i) => ({
				id: asset.id,
				symbol: asset.symbol.toUpperCase(),
				name: asset.name,
				price: asset.current_price,
				change: asset.price_change_percentage_24h,
				vol: asset.total_volume,
				marketCap: asset.market_cap,
				rank: asset.market_cap_rank,
				image: asset.image,
				color: newsColors[i % newsColors.length],
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
					: 'https://www.coingecko.com',
				color: newsColors[index % newsColors.length]
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
		newsSparkline = newsSparkline.map(() => Math.random() * 60 + 20);
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

	// ── FORMATTERS ──
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
</script>

<svelte:head>
	<title>News | JamCat</title>
	<meta
		name="description"
		content="Live crypto and AI news with real market movers, global market pulse, and trending assets."
	/>
</svelte:head>

<!-- Page wrapper with dark futuristic background -->
<div class="relative min-h-screen overflow-hidden bg-[#040d14] font-mono text-white">
	<!-- Ambient background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-green-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-purple-500/5 blur-[100px]"></div>
	</div>

	<!-- Scanline overlay -->
	<div class="pointer-events-none absolute inset-0 opacity-[0.015]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,0.5) 2px, rgba(0,255,100,0.5) 3px)"></div>

	<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
		<!-- ── Header ── -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-4xl font-black tracking-tight">
						<span class="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">📰</span>
					</h1>
					<span class="rounded-md border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[10px] font-bold text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
						NEWS TERMINAL
					</span>
					<span class="flex items-center gap-1.5 rounded-full border border-green-400/20 bg-green-400/5 px-3 py-1 text-xs text-green-400">
						<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]"></span>LIVE
					</span>
				</div>
				<p class="mt-1.5 text-xs text-green-400/40">
					Real-time crypto newsdesk · Market data · Trending assets
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#each categories as cat (cat.id)}
					<button type="button" onclick={() => handleCategoryClick(cat.id)} disabled={loading}
						class="group relative overflow-hidden rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-300
						{activeCategory === cat.id ? 'border-green-400/50 bg-green-400/10 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'border-white/10 bg-white/5 text-slate-400 hover:border-green-400/30 hover:bg-white/10 hover:text-white disabled:opacity-50'}">
						<span class="relative z-10 flex items-center gap-1.5">
							<span>{cat.icon}</span>{cat.label}
						</span>
						{#if activeCategory === cat.id}
							<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-green-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#if loading}
			<div class="flex h-64 flex-col items-center justify-center gap-4">
				<div class="relative">
					<div class="h-14 w-14 animate-spin rounded-full border-4 border-slate-800 border-t-green-400"></div>
					<div class="absolute inset-0 h-14 w-14 animate-pulse rounded-full border-4 border-green-400/30"></div>
				</div>
				<p class="text-sm font-bold tracking-widest text-slate-500 uppercase">Fetching the alpha...</p>
			</div>
		{:else if errorState}
			<div class="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 p-12 text-center backdrop-blur-sm">
				<div class="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-red-500/10 blur-3xl"></div>
				<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/20 text-3xl">⚠️</div>
				<h2 class="text-xl font-bold text-red-400">Feed temporarily unavailable</h2>
				<p class="mt-2 text-sm text-slate-400">Our news sources are experiencing issues. Please try again in a moment.</p>
				<button onclick={() => fetchNews(activeCategory)} class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20">↻ Retry</button>
			</div>
		{:else}
			<!-- ── Stats Bar ── -->
			<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each [
					{ label: 'Articles', value: newsFeed.length.toString(), hi: true, trend: '+3', key: 'articles', icon: '📰' },
					{ label: 'Market Cap', value: globalStats ? fmtCompact(globalStats.marketCap) : '--', trend: fmtChange(globalStats?.marketCapChange), key: 'cap', icon: '💎' },
					{ label: 'BTC Dom', value: globalStats ? fmtDominance(globalStats.btcDominance) : '--', trend: '↗', key: 'btc', icon: '₿' },
					{ label: 'Updated', value: sidebarUpdatedAt || 'now', trend: '●', key: 'time', icon: '⏱' },
				] as s (s.key)}
					<div class="group relative overflow-hidden rounded-2xl border {s.hi ? 'border-green-400/30 bg-green-400/5' : 'border-white/5 bg-white/[0.02]'} p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10 backdrop-blur-sm">
						<div class="absolute right-0 top-0 h-20 w-20 rounded-full bg-green-400/5 blur-2xl group-hover:bg-green-400/10 transition-all pointer-events-none"></div>
						<div class="flex justify-between items-start mb-2">
							<p class="text-[10px] uppercase tracking-widest text-slate-500">{s.icon} {s.label}</p>
							<span class="rounded-full bg-green-400/10 px-2 py-0.5 text-[9px] font-bold text-green-400">{s.trend}</span>
						</div>
						<p class="text-2xl font-extrabold {s.hi ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]' : 'text-white'}">{s.value}</p>
						<div class="mt-3 h-7 flex items-end gap-0.5">
							{#each newsSparkline as height, idx (idx)}
								<div class="flex-1 bg-gradient-to-t from-green-400/10 to-green-400/30 rounded-t transition-all" style="height: {height}%"></div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- ── Body ── -->
			<div class="flex flex-col gap-6 lg:flex-row">
				<!-- Left: Main Content -->
				<div class="flex-1 min-w-0 space-y-6">
					<!-- Featured News -->
					{#if featuredNews}
						<div class="relative overflow-hidden rounded-2xl border border-green-400/20 bg-gradient-to-br from-green-400/5 to-transparent p-5 shadow-xl shadow-green-500/10 backdrop-blur-sm">
							<!-- Background sparkline -->
							<div class="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
								<div class="absolute bottom-0 left-0 right-0 h-16 flex items-end gap-0.5 px-4">
									{#each newsSparkline as h, i (i)}
										<div class="flex-1 rounded-t bg-green-400/40 transition-all duration-300" style="height: {h}%"></div>
									{/each}
								</div>
							</div>

							<a href={featuredNews.link} target="_blank" rel="noopener noreferrer" class="group relative z-10 block">
								<div class="flex items-center gap-2 mb-3">
									<span class="rounded-full border border-pink-500/30 bg-pink-500/20 px-2 py-0.5 text-[9px] font-bold text-pink-300 flex items-center gap-1.5">
										<span class="h-1.5 w-1.5 rounded-full bg-pink-400 animate-pulse"></span>
										⭐ TOP STORY
									</span>
									{#each featuredNews.categories.slice(0, 2) as cat}
										{@const catColor = getCatColor(cat)}
										<span class="rounded border {catColor.border} {catColor.bg} px-1.5 py-0.5 text-[9px] font-bold {catColor.text}">{cat}</span>
									{/each}
								</div>

								<div class="flex flex-col md:flex-row gap-4">
									<div class="relative h-48 md:h-32 md:w-48 shrink-0 overflow-hidden rounded-xl border border-white/10">
										<img src={featuredNews.thumbnail} alt={featuredNews.title} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
									</div>
									<div class="flex-1 min-w-0">
										<h2 class="text-xl leading-tight font-black text-white transition-colors group-hover:text-green-300 mb-2">{featuredNews.title}</h2>
										<p class="text-sm text-slate-400 line-clamp-2 mb-3">{featuredNews.desc}</p>
										<div class="flex items-center gap-3 text-[10px] text-slate-500">
											<span class="text-green-400">{featuredNews.time}</span>
											<span>•</span>
											<span>{featuredNews.author}</span>
											<span>•</span>
											<span>{featuredNews.readTime} min read</span>
										</div>
									</div>
								</div>
							</a>
						</div>
					{/if}

					<!-- News List -->
					<div class="grid grid-cols-1 gap-4">
						{#each listNews as item, index (item.id)}
							{@const itemColor = item.color}
							<a href={item.link} target="_blank" rel="noopener noreferrer"
								class="group relative overflow-hidden flex items-start gap-4 rounded-2xl border {itemColor.border} bg-white/[0.015] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.035] hover:{itemColor.glow} backdrop-blur-sm"
								style={`animation: fadeUp 0.4s ease-out ${index * 0.05}s backwards;`}>
								
								<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full {itemColor.bg} blur-2xl opacity-0 transition-opacity group-hover:opacity-100"></div>
								
								<div class="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border {itemColor.border} ring-1 {itemColor.ring} {itemColor.bg} transition-transform duration-300 group-hover:scale-105">
									<img src={item.thumbnail} alt={item.title} class="h-full w-full object-cover rounded-lg opacity-80" loading="lazy"/>
								</div>

								<div class="min-w-0 flex-1 relative z-10">
									<div class="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase">
										<span class={itemColor.text}>{item.time}</span>
										<span class="text-slate-600">•</span>
										<span class="text-slate-500">{item.author}</span>
										{#if item.categories.length > 0}
											{@const catColor = getCatColor(item.categories[0])}
											<span class="rounded border {catColor.border} {catColor.bg} px-1.5 py-0.5 text-[9px] {catColor.text}">{item.categories[0]}</span>
										{/if}
									</div>
									<h3 class="mb-1 line-clamp-2 text-sm leading-tight font-bold text-white transition-colors group-hover:{itemColor.text}">{item.title}</h3>
									<p class="line-clamp-1 text-xs text-slate-500">{item.desc}</p>
								</div>

								<div class="hidden shrink-0 sm:flex flex-col items-center justify-center">
									<span class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition group-hover:{itemColor.bg} group-hover:{itemColor.text}">→</span>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<!-- Right: Sidebar -->
				<div class="flex shrink-0 flex-col gap-4 lg:w-72 xl:w-80">
					<!-- Market Pulse -->
					<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
						<div class="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3">
							<div class="flex items-center gap-2">
								<p class="text-sm font-bold text-white">🌍 Market Pulse</p>
								<span class="rounded-full bg-green-400/20 px-2 py-0.5 text-[9px] font-black text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.3)]">LIVE</span>
							</div>
							<span class="text-[10px] text-slate-500">{sidebarUpdatedAt || '...'}</span>
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
									{ label: 'Total Cap', value: fmtCompact(globalStats.marketCap), icon: '💎', color: newsColors[0] },
									{ label: '24H Volume', value: fmtCompact(globalStats.volume), icon: '📊', color: newsColors[1] },
									{ label: 'BTC Dom', value: fmtDominance(globalStats.btcDominance), icon: '₿', color: newsColors[2] },
									{ label: '24H Chg', value: fmtChange(globalStats.marketCapChange), icon: globalStats.marketCapChange >= 0 ? '📈' : '📉', isChange: true }
								] as stat}
									<div class="rounded-xl border border-white/[0.06] {stat.color ? stat.color.bg : (stat.isChange && globalStats.marketCapChange >= 0 ? 'bg-green-400/10 border-green-400/20' : 'bg-red-400/10 border-red-400/20')} p-3 transition hover:border-white/10">
										<div class="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
											<span>{stat.icon}</span>{stat.label}
										</div>
										<p class="font-mono text-base font-black {stat.color ? stat.color.text : (stat.isChange ? (globalStats.marketCapChange >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white')}">{stat.value}</p>
									</div>
								{/each}
							</div>
							<div class="px-3 pb-3">
								<div class="flex items-end gap-0.5 h-8">
									{#each sparklineData as h}
										<div class="flex-1 rounded-t bg-green-500/30 transition-all" style="height: {h}%"></div>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Market Movers -->
					<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
						<div class="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3">
							<div class="flex items-center gap-2">
								<p class="text-sm font-bold text-white">📈 Movers</p>
							</div>
							<div class="flex h-2 w-2 rounded-full {marketLoading ? 'animate-pulse bg-yellow-400' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]'}"></div>
						</div>

						{#if marketError}
							<div class="p-4 text-sm text-red-400">{marketError}</div>
						{:else}
							<ul class="max-h-72 divide-y divide-white/[0.04] overflow-y-auto">
								{#each marketData as asset (asset.id)}
									<li class="group px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02]">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-2">
												<div class="h-8 w-8 rounded-full {asset.color.bg} border {asset.color.border} flex items-center justify-center shrink-0">
													<img src={asset.image} alt={asset.name} class="h-6 w-6 rounded-full object-cover" />
												</div>
												<div>
													<div class="flex items-center gap-1.5">
														<span class="font-bold {asset.color.text}">{asset.name}</span>
														<span class="text-slate-600">#{asset.rank}</span>
													</div>
													<div class="mt-1 flex items-end gap-px h-3 w-16">
														{#each asset.sparkline as h}
															<div class="flex-1 rounded-t {asset.change >= 0 ? asset.color.bar : 'bg-red-400'}" style="height: {h}%"></div>
														{/each}
													</div>
												</div>
											</div>
											<div class="text-right">
												<p class="font-bold text-white">{fmtPrice(asset.price)}</p>
												<p class="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] font-bold {asset.change >= 0 ? 'text-green-400' : 'text-red-400'}">
													{asset.change >= 0 ? '▲' : '▼'}{fmtChange(asset.change)}
												</p>
											</div>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Trending Radar -->
					<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
						<div class="border-b border-white/5 bg-black/20 px-4 py-3">
							<div class="flex items-center gap-2">
								<p class="text-sm font-bold text-white">🔥 Trending</p>
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
							<div class="divide-y divide-white/[0.04]">
								{#each trendingCoins as coin, i (coin.id)}
									{@const coinColor = coin.color}
									<a href={coin.link} target="_blank" rel="noreferrer"
										class="group flex items-center justify-between px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02]">
										<div class="flex items-center gap-2">
											<div class="relative">
												<div class="h-8 w-8 rounded-full {coinColor.bg} border {coinColor.border} flex items-center justify-center">
													<img src={coin.image} alt={coin.name} class="h-6 w-6 rounded-full object-cover" />
												</div>
												<span class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white">{i + 1}</span>
											</div>
											<div>
												<span class="font-bold {coinColor.text}">{coin.name}</span>
												<span class="ml-1.5 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-slate-400">{coin.symbol}</span>
												<p class="text-[10px] text-slate-500">Rank #{coin.rank}</p>
											</div>
										</div>
										<div class="text-right">
											<p class="font-bold {coinColor.text}">{coin.price !== null ? fmtPrice(coin.price) : '--'}</p>
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
