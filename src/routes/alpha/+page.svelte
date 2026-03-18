<script>
	import { onMount } from 'svelte';

	const categories = [
		{ key: 'all', label: 'All' },
		{ key: 'macro', label: 'Macro' },
		{ key: 'ai', label: 'AI' },
		{ key: 'memes', label: 'Memes' },
		{ key: 'solana', label: 'Solana' }
	];

	const sortOptions = [
		{ key: 'alpha', label: 'Alpha Score' },
		{ key: 'change', label: '24H Change' },
		{ key: 'volume', label: '24H Volume' }
	];

	const viewModes = [
		{ key: 'leaderboard', label: 'Board' },
		{ key: 'grid', label: 'Grid' }
	];

	const feedOptions = [
		{ key: 'latest', label: 'Latest', url: 'https://cointelegraph.com/rss' },
		{ key: 'ai', label: 'AI', url: 'https://cointelegraph.com/rss/tag/artificial-intelligence' },
		{ key: 'bitcoin', label: 'Bitcoin', url: 'https://cointelegraph.com/rss/tag/bitcoin' }
	];

	const tokenCatalog = [
		{
			id: 'bitcoin',
			symbol: 'BTC',
			name: 'Bitcoin',
			category: 'macro',
			thesis:
				'The liquidity magnet. When BTC catches sponsorship, everything downstream reprices around it.',
			catalysts: ['ETF flows', 'Treasury demand', 'Macro easing'],
			color: {
				ring: 'ring-amber-400',
				border: 'border-amber-400/25',
				text: 'text-amber-300',
				bg: 'bg-amber-400/10',
				soft: 'from-amber-400/14 to-amber-400/0'
			}
		},
		{
			id: 'solana',
			symbol: 'SOL',
			name: 'Solana',
			category: 'solana',
			thesis:
				'Fastest read on risk appetite across the chain beta complex and app revenue narrative.',
			catalysts: ['Fee growth', 'App launches', 'Meme rotation'],
			color: {
				ring: 'ring-violet-400',
				border: 'border-violet-400/25',
				text: 'text-violet-300',
				bg: 'bg-violet-400/10',
				soft: 'from-violet-400/14 to-violet-400/0'
			}
		},
		{
			id: 'artificial-superintelligence-alliance',
			symbol: 'FET',
			name: 'ASI Alliance',
			category: 'ai',
			thesis: 'Liquid AI beta with the cleanest sensitivity to model and agent narrative rotation.',
			catalysts: ['Model launches', 'Agent narrative', 'Inference demand'],
			color: {
				ring: 'ring-cyan-400',
				border: 'border-cyan-400/25',
				text: 'text-cyan-300',
				bg: 'bg-cyan-400/10',
				soft: 'from-cyan-400/14 to-cyan-400/0'
			}
		},
		{
			id: 'bittensor',
			symbol: 'TAO',
			name: 'Bittensor',
			category: 'ai',
			thesis:
				'Higher-octane AI infrastructure expression with strong reflexivity in momentum regimes.',
			catalysts: ['Subnet growth', 'Compute pricing', 'AI strength'],
			color: {
				ring: 'ring-sky-400',
				border: 'border-sky-400/25',
				text: 'text-sky-300',
				bg: 'bg-sky-400/10',
				soft: 'from-sky-400/14 to-sky-400/0'
			}
		},
		{
			id: 'dogwifcoin',
			symbol: 'WIF',
			name: 'dogwifhat',
			category: 'memes',
			thesis: 'First responder when attention rotates back into Solana meme beta.',
			catalysts: ['Social spikes', 'Exchange momentum', 'Meme rotation'],
			color: {
				ring: 'ring-pink-400',
				border: 'border-pink-400/25',
				text: 'text-pink-300',
				bg: 'bg-pink-400/10',
				soft: 'from-pink-400/14 to-pink-400/0'
			}
		},
		{
			id: 'bonk',
			symbol: 'BONK',
			name: 'Bonk',
			category: 'memes',
			thesis:
				'Deep community mindshare and one of the cleaner gauges for retail meme participation.',
			catalysts: ['Wallet integration', 'Retail flows', 'Community pushes'],
			color: {
				ring: 'ring-rose-400',
				border: 'border-rose-400/25',
				text: 'text-rose-300',
				bg: 'bg-rose-400/10',
				soft: 'from-rose-400/14 to-rose-400/0'
			}
		},
		{
			id: 'popcat',
			symbol: 'POPCAT',
			name: 'Popcat',
			category: 'memes',
			thesis: 'Cleaner small-to-mid cap reflexivity when meme breadth expands past the majors.',
			catalysts: ['Viral clips', 'Spec rotation', 'Community raids'],
			color: {
				ring: 'ring-fuchsia-400',
				border: 'border-fuchsia-400/25',
				text: 'text-fuchsia-300',
				bg: 'bg-fuchsia-400/10',
				soft: 'from-fuchsia-400/14 to-fuchsia-400/0'
			}
		},
		{
			id: 'myro',
			symbol: 'MYRO',
			name: 'Myro',
			category: 'solana',
			thesis:
				'Smaller dog beta that tends to move harder when the Solana stack is already in motion.',
			catalysts: ['Watchlist inflows', 'Momentum squeezes', 'Beta expansion'],
			color: {
				ring: 'ring-emerald-400',
				border: 'border-emerald-400/25',
				text: 'text-emerald-300',
				bg: 'bg-emerald-400/10',
				soft: 'from-emerald-400/14 to-emerald-400/0'
			}
		}
	];

	const categoryLabels = {
		all: 'All',
		macro: 'Macro',
		ai: 'AI',
		memes: 'Memes',
		solana: 'Solana'
	};

	let tokens = $state(
		tokenCatalog.map((token) => ({
			...token,
			price: null,
			change: null,
			volume: null,
			marketCap: null,
			alphaScore: 0
		}))
	);
	let headlines = $state([]);
	let activityFeed = $state([]);
	let trendingCoins = $state([]);

	let activeCategory = $state('all');
	let activeSort = $state('alpha');
	let activeFeed = $state('latest');
	let viewMode = $state('leaderboard');
	let searchQuery = $state('');
	let selectedId = $state('bitcoin');

	let loadingMarkets = $state(true);
	let loadingNews = $state(true);
	let loadingTrending = $state(true);
	let refreshing = $state(false);

	let marketError = $state('');
	let newsError = $state('');
	let trendingError = $state('');
	let lastUpdated = $state('');

	let filteredTokens = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		const list = tokens.filter((token) => {
			const categoryMatch = activeCategory === 'all' || token.category === activeCategory;
			const queryMatch =
				!query ||
				token.name.toLowerCase().includes(query) ||
				token.symbol.toLowerCase().includes(query) ||
				token.thesis.toLowerCase().includes(query);

			return categoryMatch && queryMatch;
		});

		return [...list].sort((left, right) => {
			if (activeSort === 'change') return (right.change ?? -Infinity) - (left.change ?? -Infinity);
			if (activeSort === 'volume') return (right.volume ?? -Infinity) - (left.volume ?? -Infinity);
			return (right.alphaScore ?? -Infinity) - (left.alphaScore ?? -Infinity);
		});
	});

	let selectedToken = $derived.by(
		() => tokens.find((token) => token.id === selectedId) ?? filteredTokens[0] ?? tokens[0] ?? null
	);

	let leaders = $derived(filteredTokens.slice(0, 5));

	let marketStructure = $derived.by(() => {
		const liveTokens = tokens.filter((token) => token.price !== null);
		const positive = liveTokens.filter((token) => (token.change ?? 0) >= 0).length;
		const avgChange =
			liveTokens.length > 0
				? liveTokens.reduce((sum, token) => sum + (token.change ?? 0), 0) / liveTokens.length
				: 0;
		const totalVolume = liveTokens.reduce((sum, token) => sum + (token.volume ?? 0), 0);
		const avgScore =
			liveTokens.length > 0
				? liveTokens.reduce((sum, token) => sum + token.alphaScore, 0) / liveTokens.length
				: 0;

		return {
			positive,
			negative: Math.max(0, liveTokens.length - positive),
			breadth: liveTokens.length ? (positive / liveTokens.length) * 100 : 0,
			avgChange,
			totalVolume,
			avgScore,
			tracked: liveTokens.length
		};
	});

	let categoryHeat = $derived.by(() =>
		categories
			.filter((category) => category.key !== 'all')
			.map((category) => {
				const list = tokens.filter(
					(token) => token.category === category.key && token.price !== null
				);
				const avgChange =
					list.length > 0
						? list.reduce((sum, token) => sum + (token.change ?? 0), 0) / list.length
						: 0;
				const leader = [...list].sort((left, right) => right.alphaScore - left.alphaScore)[0];

				return {
					key: category.key,
					label: category.label,
					count: list.length,
					avgChange,
					leader: leader?.symbol ?? '--'
				};
			})
			.sort((left, right) => right.avgChange - left.avgChange)
	);

	function alphaScoreFor(token) {
		const change = token.change ?? 0;
		const volume = token.volume ?? 0;
		const marketCap = token.marketCap ?? 1;
		const relativeVolume = Math.log10(Math.max(volume, 1));
		const sizePenalty = Math.log10(Math.max(marketCap, 1));
		const categoryBoost = token.category === 'memes' ? 8 : token.category === 'ai' ? 6 : 3;
		const score = 50 + change * 2.8 + relativeVolume * 4 - sizePenalty * 2 + categoryBoost;

		return Math.max(1, Math.min(99, Math.round(score)));
	}

	function formatPrice(value) {
		if (value === null || Number.isNaN(value)) return '--';
		if (value >= 1000) {
			return value.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				maximumFractionDigits: 0
			});
		}
		if (value >= 1) {
			return value.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
		}

		return `$${value.toPrecision(4)}`;
	}

	function formatCompactCurrency(value) {
		if (value === null || Number.isNaN(value)) return '--';

		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			notation: 'compact',
			maximumFractionDigits: 2
		}).format(value);
	}

	function formatChange(value) {
		if (value === null || Number.isNaN(value)) return '--';
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	}

	function formatScore(value) {
		if (value >= 80) return 'High Conviction';
		if (value >= 65) return 'Constructive';
		if (value >= 50) return 'Neutral';
		return 'Weak Tape';
	}

	function sparkBars(token) {
		const base = Math.max(10, Math.min(92, 48 + (token.change ?? 0) * 3));
		return Array.from({ length: 14 }, (_, index) => {
			const wave = Math.sin(index * 1.18 + token.alphaScore / 16) * 12;
			const volumeLift = Math.min(18, Math.log10((token.volume ?? 1) + 1) * 1.8);
			return Math.max(12, Math.min(98, base + wave + volumeLift));
		});
	}

	function hydrateActivity(list) {
		activityFeed = list.slice(0, 8).map((token, index) => ({
			id: `${token.id}-${index}`,
			symbol: token.symbol,
			move: formatChange(token.change),
			text: `${token.symbol} printing ${formatCompactCurrency(token.volume)} with score ${token.alphaScore}`,
			time: index === 0 ? 'just now' : `${index * 3}m ago`,
			tone: (token.change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
		}));
	}

	async function fetchMarkets({ silent = false } = {}) {
		if (!silent) loadingMarkets = true;
		refreshing = true;
		marketError = '';

		try {
			const ids = tokenCatalog.map((token) => token.id).join(',');
			const url =
				`https://api.coingecko.com/api/v3/simple/price?ids=${ids}` +
				'&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true';
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Market request failed with ${response.status}`);
			const data = await response.json();

			const nextTokens = tokenCatalog.map((token) => {
				const live = data[token.id] ?? {};
				const nextToken = {
					...token,
					price: live.usd ?? null,
					change: live.usd_24h_change ?? null,
					volume: live.usd_24h_vol ?? null,
					marketCap: live.usd_market_cap ?? null
				};

				return {
					...nextToken,
					alphaScore: alphaScoreFor(nextToken)
				};
			});

			const ranked = [...nextTokens].sort((left, right) => right.alphaScore - left.alphaScore);
			tokens = nextTokens;
			hydrateActivity(ranked);

			if (!ranked.find((token) => token.id === selectedId)) {
				selectedId = ranked[0]?.id ?? selectedId;
			}

			lastUpdated = new Date().toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		} catch (error) {
			console.error('Alpha markets fetch failed', error);
			marketError = 'Unable to fetch live market data right now.';
		} finally {
			loadingMarkets = false;
			refreshing = false;
		}
	}

	async function fetchHeadlines(feedKey = activeFeed) {
		loadingNews = true;
		newsError = '';

		try {
			const selectedFeed = feedOptions.find((feed) => feed.key === feedKey) ?? feedOptions[0];
			const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(selectedFeed.url)}`;
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error(`News request failed with ${response.status}`);
			const data = await response.json();

			if (data.status !== 'ok') throw new Error('News feed returned a non-ok status');

			headlines = data.items.slice(0, 6).map((item, index) => ({
				id: `${feedKey}-${index}`,
				title: item.title,
				link: item.link,
				source: 'Cointelegraph',
				time: new Date(item.pubDate).toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit'
				}),
				desc: item.description
					.replace(/<[^>]*>?/gm, '')
					.trim()
					.slice(0, 150)
			}));
		} catch (error) {
			console.error('Alpha news fetch failed', error);
			newsError = 'Unable to fetch live headlines right now.';
		} finally {
			loadingNews = false;
		}
	}

	async function fetchTrending() {
		loadingTrending = true;
		trendingError = '';

		try {
			const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
			if (!response.ok) throw new Error(`Trending request failed with ${response.status}`);
			const payload = await response.json();

			trendingCoins = (payload.coins || []).slice(0, 5).map(({ item }, index) => ({
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
				link: item.slug
					? `https://www.coingecko.com/en/coins/${item.slug}`
					: 'https://www.coingecko.com'
			}));
		} catch (error) {
			console.error('Alpha trending fetch failed', error);
			trendingError = 'Unable to fetch trending assets right now.';
		} finally {
			loadingTrending = false;
		}
	}

	function setFeed(feedKey) {
		if (feedKey === activeFeed) return;
		activeFeed = feedKey;
		fetchHeadlines(feedKey);
	}

	onMount(() => {
		fetchMarkets();
		fetchHeadlines();
		fetchTrending();

		const marketPollId = setInterval(() => {
			fetchMarkets({ silent: true });
		}, 60000);

		return () => clearInterval(marketPollId);
	});
</script>

<svelte:head>
	<title>Alpha | JamCat</title>
	<meta
		name="description"
		content="Kraken-inspired JamCat alpha terminal with live market data, signal-ranked watchlists, trending radar, and news wire."
	/>
</svelte:head>

<div class="relative min-h-screen overflow-hidden bg-[#09090d] text-white">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(82,255,168,0.06),transparent_26%),radial-gradient(circle_at_85%_18%,rgba(61,61,152,0.22),transparent_24%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:auto,auto,96px_96px,96px_96px]"
	></div>

	<div class="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
		<section
			class="overflow-hidden rounded-[30px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
		>
			<div class="border-b border-white/8 px-5 py-5 sm:px-6">
				<div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
					<div>
						<div
							class="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold tracking-[0.28em] text-emerald-300 uppercase"
						>
							<span
								class="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]"
							></span>
							Alpha Terminal
						</div>
						<h1 class="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
							Kraken mood.
							<span class="block text-slate-400">JamCat speed.</span>
						</h1>
						<p class="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
							Live market tape, score-ranked setups, trend radar, and a cleaner focus panel for
							whichever asset currently deserves attention.
						</p>
					</div>

					<div
						class="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase"
					>
						<div class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
							Last update: <span class="text-slate-200">{lastUpdated || 'Connecting'}</span>
						</div>
						<button
							type="button"
							onclick={() => fetchMarkets()}
							class="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-emerald-300 transition hover:bg-emerald-400/20"
						>
							{refreshing ? 'Refreshing' : 'Refresh Tape'}
						</button>
					</div>
				</div>
			</div>

			<div
				class="grid gap-2 border-b border-white/8 bg-black/20 px-3 py-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8"
			>
				{#each tokens as token (token.id)}
					<button
						type="button"
						onclick={() => (selectedId = token.id)}
						class={`rounded-2xl border p-3 text-left transition-all duration-200 hover:border-white/16 hover:bg-white/[0.04] ${selectedId === token.id ? `${token.color.border} bg-white/[0.05]` : 'border-white/6 bg-black/20'}`}
					>
						<div class="flex items-center justify-between gap-3">
							<div>
								<div
									class={`text-[11px] font-black tracking-[0.24em] uppercase ${token.color.text}`}
								>
									{token.symbol}
								</div>
								<div class="mt-1 text-sm font-semibold text-slate-200">{token.name}</div>
							</div>
							<div
								class:text-green-400={(token.change ?? 0) >= 0}
								class:text-red-400={(token.change ?? 0) < 0}
								class="text-xs font-bold"
							>
								{formatChange(token.change)}
							</div>
						</div>
						<div class="mt-3 font-mono text-lg font-black text-white">
							{formatPrice(token.price)}
						</div>
					</button>
				{/each}
			</div>
		</section>

		<div
			class="mt-5 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-[#0b0e13]/95 px-4 py-4 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between"
		>
			<div class="flex flex-wrap items-center gap-2">
				{#each categories as category (category.key)}
					<button
						type="button"
						onclick={() => (activeCategory = category.key)}
						class={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase transition ${activeCategory === category.key ? 'border-white/20 bg-white text-black' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'}`}
					>
						{category.label}
					</button>
				{/each}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<div class="flex items-center rounded-full border border-white/10 bg-black/30 p-1">
					{#each viewModes as mode (mode.key)}
						<button
							type="button"
							onclick={() => (viewMode = mode.key)}
							class={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase transition ${viewMode === mode.key ? 'bg-white text-black' : 'text-slate-400 hover:text-slate-200'}`}
						>
							{mode.label}
						</button>
					{/each}
				</div>

				<select
					bind:value={activeSort}
					class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-400/40"
					aria-label="Sort assets"
				>
					{#each sortOptions as option (option.key)}
						<option value={option.key}>{option.label}</option>
					{/each}
				</select>

				<input
					bind:value={searchQuery}
					placeholder="Search market..."
					class="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400/40"
					aria-label="Search alpha markets"
				/>
			</div>
		</div>

		<div class="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1.1fr_0.82fr]">
			<section
				class="rounded-[28px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
			>
				<div class="border-b border-white/8 px-5 py-4 sm:px-6">
					<div class="flex items-center justify-between gap-4">
						<div>
							<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
								Focus Asset
							</p>
							<h2 class="mt-2 text-2xl font-black text-white sm:text-3xl">
								{selectedToken?.name ?? 'No selection'}
							</h2>
						</div>
						{#if selectedToken}
							<div
								class={`rounded-full border px-3 py-1 text-xs font-bold tracking-[0.22em] uppercase ${selectedToken.color.border} ${selectedToken.color.text} ${selectedToken.color.bg}`}
							>
								{formatScore(selectedToken.alphaScore)}
							</div>
						{/if}
					</div>
				</div>

				{#if loadingMarkets && !selectedToken}
					<div class="flex h-[420px] items-center justify-center">
						<div
							class="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400"
						></div>
					</div>
				{:else if marketError && !selectedToken}
					<div class="p-6 text-sm text-red-200">{marketError}</div>
				{:else if selectedToken}
					<div class="space-y-6 px-5 py-5 sm:px-6">
						<div
							class={`rounded-[24px] border ${selectedToken.color.border} bg-gradient-to-br ${selectedToken.color.soft} p-5`}
						>
							<div class="flex flex-wrap items-start justify-between gap-4">
								<div>
									<div
										class={`text-[12px] font-black tracking-[0.28em] uppercase ${selectedToken.color.text}`}
									>
										{selectedToken.symbol} / USD
									</div>
									<div class="mt-3 font-mono text-4xl font-black text-white sm:text-5xl">
										{formatPrice(selectedToken.price)}
									</div>
									<div
										class:text-green-400={(selectedToken.change ?? 0) >= 0}
										class:text-red-400={(selectedToken.change ?? 0) < 0}
										class="mt-2 text-sm font-bold tracking-[0.16em] uppercase"
									>
										24H {formatChange(selectedToken.change)}
									</div>
								</div>

								<div class="grid min-w-[220px] gap-3 sm:grid-cols-2">
									{#each [{ label: 'Market Cap', value: formatCompactCurrency(selectedToken.marketCap), key: 'mcap' }, { label: '24H Volume', value: formatCompactCurrency(selectedToken.volume), key: 'vol' }, { label: 'Alpha Score', value: `${selectedToken.alphaScore}/99`, key: 'score' }, { label: 'Category', value: categoryLabels[selectedToken.category], key: 'cat' }] as stat (stat.key)}
										<div class="rounded-2xl border border-white/8 bg-black/25 p-3">
											<div class="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
												{stat.label}
											</div>
											<div class="mt-2 font-mono text-lg font-black text-white">{stat.value}</div>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<div class="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
							<div class="rounded-[24px] border border-white/8 bg-black/25 p-5">
								<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
									Setup Read
								</p>
								<p class="mt-3 text-sm leading-7 text-slate-300">{selectedToken.thesis}</p>

								<div class="mt-5">
									<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
										Catalysts
									</p>
									<div class="mt-3 flex flex-wrap gap-2">
										{#each selectedToken.catalysts as catalyst (catalyst)}
											<span
												class={`rounded-full border px-3 py-1 text-[11px] font-semibold ${selectedToken.color.border} ${selectedToken.color.text} ${selectedToken.color.bg}`}
											>
												{catalyst}
											</span>
										{/each}
									</div>
								</div>
							</div>

							<div class="rounded-[24px] border border-white/8 bg-black/25 p-5">
								<div class="flex items-center justify-between gap-3">
									<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
										Signal Meter
									</p>
									<p
										class={`text-xs font-bold tracking-[0.18em] uppercase ${selectedToken.color.text}`}
									>
										{formatScore(selectedToken.alphaScore)}
									</p>
								</div>
								<div class="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
									<div
										class={`h-full rounded-full ${selectedToken.color.bg}`}
										style={`width: ${selectedToken.alphaScore}%`}
									></div>
								</div>
								<div
									class="mt-2 flex justify-between text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase"
								>
									<span>Weak</span>
									<span>Constructive</span>
									<span>High Conviction</span>
								</div>

								<div class="mt-6">
									<p class="mb-3 text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
										Momentum Profile
									</p>
									<div class="flex h-36 items-end gap-1.5">
										{#each sparkBars(selectedToken) as height, index (index)}
											<div
												class={`flex-1 rounded-t bg-gradient-to-t ${selectedToken.change !== null && selectedToken.change >= 0 ? 'from-emerald-500/10 to-emerald-400/70' : 'from-red-500/10 to-red-400/70'}`}
												style={`height: ${height}%`}
											></div>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<a
							href={`https://www.coingecko.com/en/coins/${selectedToken.id}`}
							target="_blank"
							rel="noreferrer"
							class={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition hover:bg-white/[0.04] ${selectedToken.color.border} ${selectedToken.color.text}`}
						>
							<span>Open {selectedToken.symbol} on CoinGecko</span>
							<span>→</span>
						</a>
					</div>
				{/if}
			</section>

			<section
				class="rounded-[28px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
			>
				<div class="border-b border-white/8 px-5 py-4 sm:px-6">
					<div class="flex items-center justify-between gap-4">
						<div>
							<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
								Signal Board
							</p>
							<h2 class="mt-2 text-2xl font-black text-white">Ranked Watchlist</h2>
						</div>
						<div
							class="text-right text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase"
						>
							{filteredTokens.length} markets
						</div>
					</div>
				</div>

				{#if loadingMarkets && filteredTokens.length === 0}
					<div class="flex h-[560px] items-center justify-center">
						<div
							class="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400"
						></div>
					</div>
				{:else if marketError && filteredTokens.length === 0}
					<div class="p-6 text-sm text-red-200">{marketError}</div>
				{:else if viewMode === 'leaderboard'}
					<div class="overflow-hidden">
						<div
							class="grid grid-cols-[2rem_1.2fr_0.9fr_0.8fr_0.7fr] gap-x-4 border-b border-white/8 bg-black/20 px-5 py-3 text-[10px] font-black tracking-[0.22em] text-slate-500 uppercase sm:px-6"
						>
							<span>#</span>
							<span>Market</span>
							<span class="text-right">Last</span>
							<span class="text-right">24H</span>
							<span class="text-right">Score</span>
						</div>

						{#each filteredTokens as token, index (token.id)}
							<button
								type="button"
								onclick={() => (selectedId = token.id)}
								class={`grid w-full grid-cols-[2rem_1.2fr_0.9fr_0.8fr_0.7fr] items-center gap-x-4 border-b border-white/6 px-5 py-4 text-left transition hover:bg-white/[0.04] sm:px-6 ${selectedId === token.id ? 'bg-white/[0.04]' : ''}`}
							>
								<span
									class:text-amber-400={index === 0}
									class:text-slate-300={index === 1}
									class:text-orange-500={index === 2}
									class:text-slate-500={index > 2}
									class="font-mono text-sm font-black"
								>
									{index + 1}
								</span>

								<div class="min-w-0">
									<div class="flex items-center gap-3">
										<div
											class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black ${token.color.border} ${token.color.bg} ${token.color.text}`}
										>
											{token.symbol}
										</div>
										<div class="min-w-0">
											<div class={`truncate text-sm font-bold ${token.color.text}`}>
												{token.name}
											</div>
											<div class="truncate text-[10px] tracking-[0.18em] text-slate-500 uppercase">
												{categoryLabels[token.category]}
											</div>
										</div>
									</div>
								</div>

								<div class="text-right font-mono text-sm font-bold text-white">
									{formatPrice(token.price)}
								</div>
								<div
									class:text-green-400={(token.change ?? 0) >= 0}
									class:text-red-400={(token.change ?? 0) < 0}
									class="text-right font-mono text-sm font-bold"
								>
									{formatChange(token.change)}
								</div>
								<div class="text-right">
									<div class="font-mono text-sm font-black text-white">{token.alphaScore}</div>
									<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
										<div
											class={`h-full rounded-full ${token.change !== null && token.change >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
											style={`width: ${token.alphaScore}%`}
										></div>
									</div>
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<div class="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
						{#each filteredTokens as token (token.id)}
							<button
								type="button"
								onclick={() => (selectedId = token.id)}
								class={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.04] ${selectedId === token.id ? `${token.color.border} bg-white/[0.04]` : 'border-white/8 bg-black/20'}`}
							>
								<div class="flex items-start justify-between gap-3">
									<div>
										<div
											class={`text-[11px] font-black tracking-[0.22em] uppercase ${token.color.text}`}
										>
											{token.symbol}
										</div>
										<div class="mt-1 text-base font-bold text-white">{token.name}</div>
									</div>
									<div
										class:text-green-400={(token.change ?? 0) >= 0}
										class:text-red-400={(token.change ?? 0) < 0}
										class="text-xs font-bold tracking-[0.16em] uppercase"
									>
										{formatChange(token.change)}
									</div>
								</div>

								<div class="mt-4 font-mono text-2xl font-black text-white">
									{formatPrice(token.price)}
								</div>

								<div
									class="mt-4 flex items-center justify-between text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
								>
									<span>{categoryLabels[token.category]}</span>
									<span>Score {token.alphaScore}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</section>

			<aside class="space-y-5">
				<section
					class="rounded-[28px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
				>
					<div class="border-b border-white/8 px-5 py-4">
						<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
							Market Structure
						</p>
					</div>
					<div class="space-y-4 px-5 py-5">
						<div>
							<div
								class="mb-2 flex justify-between text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase"
							>
								<span>Positive Breadth</span>
								<span class="font-mono text-emerald-300">
									{marketStructure.positive}/{marketStructure.tracked}
								</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-white/8">
								<div
									class="h-full rounded-full bg-emerald-400"
									style={`width: ${marketStructure.breadth}%`}
								></div>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							{#each [{ label: 'Avg Move', value: formatChange(marketStructure.avgChange), tone: marketStructure.avgChange >= 0 ? 'text-emerald-300' : 'text-red-300', key: 'move' }, { label: 'Avg Score', value: `${marketStructure.avgScore.toFixed(1)}`, tone: 'text-white', key: 'score' }, { label: 'Tracked Vol', value: formatCompactCurrency(marketStructure.totalVolume), tone: 'text-cyan-300', key: 'vol' }, { label: 'Red Breadth', value: `${marketStructure.negative}`, tone: 'text-slate-300', key: 'red' }] as stat (stat.key)}
								<div class="rounded-2xl border border-white/8 bg-black/20 p-3">
									<div class="text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase">
										{stat.label}
									</div>
									<div class={`mt-2 font-mono text-lg font-black ${stat.tone}`}>{stat.value}</div>
								</div>
							{/each}
						</div>
					</div>
				</section>

				<section
					class="rounded-[28px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
				>
					<div class="border-b border-white/8 px-5 py-4">
						<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
							Heat By Bucket
						</p>
					</div>
					<div class="space-y-2 px-4 py-4">
						{#each categoryHeat as bucket (bucket.key)}
							<div class="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
								<div class="flex items-center justify-between gap-3">
									<div>
										<div class="text-xs font-bold tracking-[0.16em] text-slate-300 uppercase">
											{bucket.label}
										</div>
										<div class="mt-1 text-[10px] tracking-[0.16em] text-slate-500 uppercase">
											Leader {bucket.leader} · {bucket.count} names
										</div>
									</div>
									<div
										class:text-green-400={bucket.avgChange >= 0}
										class:text-red-400={bucket.avgChange < 0}
										class="font-mono text-sm font-black"
									>
										{formatChange(bucket.avgChange)}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</section>

				<section
					class="rounded-[28px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
				>
					<div class="border-b border-white/8 px-5 py-4">
						<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
							Top Five
						</p>
					</div>
					<div class="space-y-2 p-4">
						{#each leaders as token, index (token.id)}
							<button
								type="button"
								onclick={() => (selectedId = token.id)}
								class="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-left transition hover:bg-white/[0.04]"
							>
								<div class="flex items-center gap-3">
									<div class="font-mono text-xs font-black text-slate-500">0{index + 1}</div>
									<div>
										<div
											class={`text-xs font-black tracking-[0.18em] uppercase ${token.color.text}`}
										>
											{token.symbol}
										</div>
										<div class="mt-1 text-sm font-semibold text-white">{token.name}</div>
									</div>
								</div>
								<div class="text-right">
									<div class="font-mono text-sm font-black text-white">{token.alphaScore}</div>
									<div
										class:text-green-400={(token.change ?? 0) >= 0}
										class:text-red-400={(token.change ?? 0) < 0}
										class="mt-1 text-[10px] font-bold"
									>
										{formatChange(token.change)}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</section>

				<section
					class="rounded-[28px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
				>
					<div class="border-b border-white/8 px-5 py-4">
						<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
							Trending Radar
						</p>
					</div>
					{#if trendingError}
						<div class="p-5 text-sm text-red-200">{trendingError}</div>
					{:else if loadingTrending}
						<div class="space-y-2 p-4">
							{#each Array.from({ length: 4 }, (_, index) => index) as index (index)}
								<div class="rounded-2xl border border-white/8 bg-black/20 p-4">
									<div class="h-3 w-20 animate-pulse rounded bg-white/10"></div>
									<div class="mt-3 h-5 w-28 animate-pulse rounded bg-white/10"></div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="space-y-2 p-4">
							{#each trendingCoins as coin (coin.id)}
								<a
									href={coin.link}
									target="_blank"
									rel="noreferrer"
									class="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-3 py-3 transition hover:bg-white/[0.04]"
								>
									<div>
										<div class="text-xs font-black tracking-[0.18em] text-slate-300 uppercase">
											{coin.symbol}
										</div>
										<div class="mt-1 text-sm font-semibold text-white">{coin.name}</div>
									</div>
									<div class="text-right">
										<div class="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
											Rank
										</div>
										<div class="mt-1 font-mono text-sm font-black text-cyan-300">#{coin.rank}</div>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</section>

				<section
					class="rounded-[28px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
				>
					<div class="border-b border-white/8 px-5 py-4">
						<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">Tape</p>
					</div>
					<div class="space-y-2 p-4">
						{#each activityFeed as entry (entry.id)}
							<div class="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
								<div class="flex items-center justify-between gap-3">
									<div class="text-xs font-black tracking-[0.18em] text-slate-300 uppercase">
										{entry.symbol}
									</div>
									<div class={`font-mono text-xs font-bold ${entry.tone}`}>{entry.move}</div>
								</div>
								<p class="mt-2 text-[11px] leading-6 text-slate-400">{entry.text}</p>
								<div
									class="mt-2 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase"
								>
									{entry.time}
								</div>
							</div>
						{/each}
					</div>
				</section>
			</aside>
		</div>

		<section
			class="mt-5 rounded-[28px] border border-white/8 bg-[#0b0e13]/95 shadow-[0_12px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
		>
			<div
				class="flex flex-col gap-4 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6"
			>
				<div>
					<p class="text-[11px] font-black tracking-[0.24em] text-slate-500 uppercase">
						Catalyst Wire
					</p>
					<h2 class="mt-2 text-2xl font-black text-white">Headline Flow</h2>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					{#each feedOptions as feed (feed.key)}
						<button
							type="button"
							onclick={() => setFeed(feed.key)}
							class={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase transition ${activeFeed === feed.key ? 'border-white/20 bg-white text-black' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'}`}
						>
							{feed.label}
						</button>
					{/each}
				</div>
			</div>

			{#if newsError}
				<div class="p-6 text-sm text-red-200">{newsError}</div>
			{:else if loadingNews}
				<div class="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
					{#each Array.from({ length: 6 }, (_, index) => index) as index (index)}
						<div class="rounded-[22px] border border-white/8 bg-black/20 p-4">
							<div class="h-3 w-20 animate-pulse rounded bg-white/10"></div>
							<div class="mt-4 h-5 w-full animate-pulse rounded bg-white/10"></div>
							<div class="mt-2 h-5 w-3/4 animate-pulse rounded bg-white/10"></div>
							<div class="mt-4 h-12 w-full animate-pulse rounded bg-white/10"></div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
					{#each headlines as headline (headline.id)}
						<a
							href={headline.link}
							target="_blank"
							rel="noreferrer"
							class="rounded-[22px] border border-white/8 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.04]"
						>
							<div class="flex items-center justify-between gap-3">
								<div class="text-[10px] font-black tracking-[0.2em] text-cyan-300 uppercase">
									{headline.source}
								</div>
								<div class="font-mono text-[10px] text-slate-500">{headline.time}</div>
							</div>
							<h3 class="mt-4 text-lg leading-7 font-bold text-white">{headline.title}</h3>
							<p class="mt-3 text-sm leading-6 text-slate-400">{headline.desc}...</p>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>
