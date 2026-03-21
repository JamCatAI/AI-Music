<script>
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	// ── state ────────────────────────────────────────────────────
	let coins        = $state([]);
	let trending     = $state([]);
	let global_data  = $state(null);
	let loading      = $state(true);
	let error        = $state(null);
	let search       = $state('');
	let category     = $state('all');
	let sortKey      = $state('market_cap_rank');
	let sortDir      = $state(1); // 1 = asc, -1 = desc
	let page         = $state(1);
	let lastUpdated  = $state(null);

	const CATEGORIES = [
		{ key: 'all',   label: 'All'        },
		{ key: 'defi',  label: '🏦 DeFi'    },
		{ key: 'layer1',label: '⛓️ L1'      },
		{ key: 'meme',  label: '🐸 Memes'   },
		{ key: 'ai',    label: '🤖 AI'      }
	];

	// CoinGecko free API (no key needed for basic endpoints)
	async function fetchCoins() {
		loading = true; error = null;
		try {
			const [coinsRes, globalRes, trendRes] = await Promise.all([
				fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`),
				fetch('https://api.coingecko.com/api/v3/global'),
				fetch('https://api.coingecko.com/api/v3/search/trending')
			]);

			if (!coinsRes.ok) throw new Error(`CoinGecko ${coinsRes.status}: ${coinsRes.statusText}`);

			coins       = await coinsRes.json();
			global_data = globalRes.ok ? (await globalRes.json()).data : null;
			trending    = trendRes.ok  ? (await trendRes.json()).coins?.slice(0,7) ?? [] : [];
			lastUpdated = new Date();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function sparkPath(pts) {
		if (!pts?.length) return '';
		const w = 80, h = 32;
		const min = Math.min(...pts), max = Math.max(...pts);
		const range = max - min || 1;
		return pts.map((p, i) => {
			const x = (i / (pts.length - 1)) * w;
			const y = h - ((p - min) / range) * h;
			return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
		}).join(' ');
	}

	function fmt(n, digits = 2) {
		if (n == null) return '—';
		if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
		if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
		if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
		if (Math.abs(n) >= 1e3)  return `$${n.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
		return `$${n.toFixed(digits > 4 ? 6 : digits)}`;
	}

	function pct(n) {
		if (n == null) return '—';
		const sign = n >= 0 ? '+' : '';
		return `${sign}${n.toFixed(2)}%`;
	}

	function pctColor(n) {
		if (n == null) return 'text-white/30';
		return n >= 0 ? 'text-emerald-400' : 'text-red-400';
	}

	function setSort(key) {
		if (sortKey === key) sortDir = -sortDir;
		else { sortKey = key; sortDir = key === 'market_cap_rank' ? 1 : -1; }
	}

	let filtered = $derived(
		coins
			.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))
			.sort((a, b) => {
				const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
				return sortDir * (av - bv);
			})
	);

	const TICKER = '🦎 COINGECKO · LIVE CRYPTO PRICES · MARKET CAP · VOLUME · TRENDING · BTC · ETH · SOL · BNB · DEFI · LAYER1 · MEMES · ';

	onMount(() => {
		fetchCoins();
		const iv = setInterval(fetchCoins, 60_000); // refresh every 60s
		return () => clearInterval(iv);
	});
</script>

<svelte:head><title>CoinGecko | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-black/40 py-2.5 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 40s linear infinite">
		{#each [TICKER,TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#8dc63f">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen bg-[#080b08]">

	<!-- ambient -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 right-1/3 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-[130px]"
			 style="background:radial-gradient(circle,#8dc63f,transparent 70%)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">

		<!-- ── HERO ─────────────────────────────────────────────── -->
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4" in:fly={{ y: -16, duration: 400 }}>
			<div>
				<div class="mb-2 flex items-center gap-2">
					<span class="text-2xl">🦎</span>
					<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl">CoinGecko</h1>
				</div>
				<p class="text-sm text-white/30">Live market data · powered by CoinGecko API</p>
				{#if lastUpdated}
					<p class="mt-1 text-[10px] text-white/15">Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 60s</p>
				{/if}
			</div>
			<button onclick={fetchCoins} disabled={loading}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30">
				{loading ? '⟳ Loading…' : '⟳ Refresh'}
			</button>
		</div>

		<!-- ── GLOBAL STATS ──────────────────────────────────────── -->
		{#if global_data}
			<div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4" in:fly={{ y: 12, duration: 400, delay: 60 }}>
				{#each [
					{ l:'Total Market Cap',  v: fmt(global_data.total_market_cap?.usd),       sub: pct(global_data.market_cap_change_percentage_24h_usd), pos: global_data.market_cap_change_percentage_24h_usd >= 0 },
					{ l:'24h Volume',        v: fmt(global_data.total_volume?.usd),             sub: '', pos: true },
					{ l:'BTC Dominance',     v: `${global_data.market_cap_percentage?.btc?.toFixed(1)}%`, sub: '', pos: true },
					{ l:'Active Cryptos',    v: global_data.active_cryptocurrencies?.toLocaleString(), sub: '', pos: true }
				] as s}
					<div class="rounded-2xl border border-white/6 bg-[#0f120f] p-4">
						<p class="text-[9px] uppercase tracking-widest text-white/25">{s.l}</p>
						<p class="mt-1 text-lg font-black text-white">{s.v}</p>
						{#if s.sub}
							<p class="text-[10px] font-bold {s.pos ? 'text-emerald-400' : 'text-red-400'}">{s.sub}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="flex flex-col gap-6 lg:flex-row">

			<!-- LEFT: main table -->
			<div class="min-w-0 flex-1">

				<!-- search + filters -->
				<div class="mb-5 flex flex-wrap items-center gap-3" in:fly={{ x: -16, duration: 400, delay: 80 }}>
					<input bind:value={search} placeholder="Search coins…"
						class="rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-[#8dc63f]/40 focus:bg-white/6 transition w-48" />

					<div class="flex flex-wrap gap-1">
						{#each CATEGORIES as c (c.key)}
							<button onclick={() => category = c.key}
								class="rounded-full border px-3 py-1 text-[10px] font-black transition
									   {category === c.key ? 'border-[#8dc63f] bg-[#8dc63f] text-black' : 'border-white/8 text-white/30 hover:text-white'}">
								{c.label}
							</button>
						{/each}
					</div>

					<span class="ml-auto text-[10px] text-white/20">{filtered.length} coins</span>
				</div>

				<!-- error state -->
				{#if error}
					<div class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/8 p-6 text-center" in:fade>
						<p class="text-2xl mb-2">⚠️</p>
						<p class="text-sm font-black text-red-400">API Error</p>
						<p class="text-xs text-white/40 mt-1">{error}</p>
						<p class="text-[10px] text-white/20 mt-2">CoinGecko free tier has rate limits. Try again in a moment.</p>
						<button onclick={fetchCoins} class="mt-4 rounded-xl border border-red-400/30 px-4 py-2 text-xs font-black text-red-400 hover:bg-red-400/10 transition">Retry</button>
					</div>
				{/if}

				<!-- loading skeleton -->
				{#if loading && !coins.length}
					<div class="space-y-2">
						{#each Array(10) as _, i}
							<div class="h-14 animate-pulse rounded-xl bg-white/4" style="animation-delay:{i*60}ms"></div>
						{/each}
					</div>
				{/if}

				<!-- coins table -->
				{#if coins.length}
					<div class="overflow-hidden rounded-2xl border border-white/6 bg-[#0f120f]" in:fade={{ duration: 300 }}>
						<!-- table header -->
						<div class="grid grid-cols-[2rem_1fr_6rem_6rem_6rem_5rem_5rem_5rem] items-center gap-2 border-b border-white/5 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white/20">
							<span>#</span>
							<button onclick={() => setSort('name')} class="text-left hover:text-white/50 transition">Coin</button>
							<button onclick={() => setSort('current_price')} class="text-right hover:text-white/50 transition">Price</button>
							<button onclick={() => setSort('price_change_percentage_1h_in_currency')} class="text-right hover:text-white/50 transition">1h %</button>
							<button onclick={() => setSort('price_change_percentage_24h')} class="text-right hover:text-white/50 transition">24h %</button>
							<button onclick={() => setSort('market_cap')} class="hidden text-right hover:text-white/50 transition sm:block">Mkt Cap</button>
							<button onclick={() => setSort('total_volume')} class="hidden text-right hover:text-white/50 transition md:block">Volume</button>
							<span class="hidden text-right lg:block">7d</span>
						</div>

						{#each filtered as coin, i (coin.id)}
							{@const change24 = coin.price_change_percentage_24h}
							{@const change1h  = coin.price_change_percentage_1h_in_currency}
							{@const change7d  = coin.price_change_percentage_7d_in_currency}
							{@const spark7    = coin.sparkline_in_7d?.price ?? []}
							<div class="grid grid-cols-[2rem_1fr_6rem_6rem_6rem_5rem_5rem_5rem] items-center gap-2 border-b border-white/3 px-4 py-3 text-xs transition-colors hover:bg-white/2 last:border-0"
								 in:fly={{ x: -8, duration: 200, delay: Math.min(i*20, 400) }}>
								<!-- rank -->
								<span class="text-[10px] font-black text-white/20">{coin.market_cap_rank}</span>

								<!-- coin name -->
								<div class="flex items-center gap-2 min-w-0">
									{#if coin.image}
										<img src={coin.image} alt={coin.name} class="h-7 w-7 shrink-0 rounded-full" loading="lazy" />
									{/if}
									<div class="min-w-0">
										<p class="truncate font-black text-white">{coin.name}</p>
										<p class="text-[9px] uppercase text-white/25">{coin.symbol}</p>
									</div>
								</div>

								<!-- price -->
								<p class="text-right font-black text-white">{fmt(coin.current_price, coin.current_price < 1 ? 6 : 2)}</p>

								<!-- 1h -->
								<p class="text-right text-[11px] font-bold {pctColor(change1h)}">{pct(change1h)}</p>

								<!-- 24h -->
								<p class="text-right text-[11px] font-bold {pctColor(change24)}">{pct(change24)}</p>

								<!-- market cap -->
								<p class="hidden text-right text-[10px] text-white/40 sm:block">{fmt(coin.market_cap)}</p>

								<!-- volume -->
								<p class="hidden text-right text-[10px] text-white/40 md:block">{fmt(coin.total_volume)}</p>

								<!-- 7d sparkline -->
								<div class="hidden justify-end lg:flex">
									{#if spark7.length}
										<svg viewBox="0 0 80 32" class="h-8 w-20" preserveAspectRatio="none">
											<path d={sparkPath(spark7)} fill="none"
												  stroke={change7d >= 0 ? '#34d399' : '#f87171'}
												  stroke-width="1.5" stroke-linejoin="round"/>
										</svg>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					<!-- pagination -->
					<div class="mt-4 flex justify-center gap-2">
						<button onclick={() => { page = Math.max(1, page - 1); fetchCoins(); }}
							disabled={page === 1 || loading}
							class="rounded-xl border border-white/8 px-4 py-2 text-xs font-black text-white/40 transition hover:text-white disabled:opacity-20">← Prev</button>
						<span class="flex items-center px-3 text-xs text-white/30">Page {page}</span>
						<button onclick={() => { page++; fetchCoins(); }}
							disabled={loading}
							class="rounded-xl border border-white/8 px-4 py-2 text-xs font-black text-white/40 transition hover:text-white disabled:opacity-20">Next →</button>
					</div>
				{/if}
			</div>

			<!-- RIGHT: trending sidebar -->
			<div class="w-full lg:w-56 lg:shrink-0">
				<div class="lg:sticky lg:top-20 space-y-4">

					<!-- trending -->
					<div class="rounded-2xl border border-[#8dc63f]/15 bg-[#0f120f] p-4" in:fly={{ x: 20, duration: 400, delay: 100 }}>
						<p class="mb-4 text-[10px] font-black uppercase tracking-widest text-[#8dc63f]/60">🔥 Trending</p>
						{#if trending.length}
							<div class="space-y-3">
								{#each trending as t, i (t.item?.id)}
									{@const item = t.item}
									<div class="flex items-center gap-2">
										<span class="w-4 text-center text-[10px] text-white/20 font-black">{i+1}</span>
										{#if item.small}
											<img src={item.small} alt={item.name} class="h-6 w-6 rounded-full" loading="lazy" />
										{/if}
										<div class="min-w-0 flex-1">
											<p class="truncate text-xs font-black text-white/70">{item.name}</p>
											<p class="text-[9px] uppercase text-white/25">{item.symbol}</p>
										</div>
										<span class="text-[10px] font-black text-[#8dc63f]">#{item.market_cap_rank ?? '?'}</span>
									</div>
								{/each}
							</div>
						{:else if loading}
							{#each Array(7) as _}
								<div class="h-8 animate-pulse rounded-lg bg-white/4"></div>
							{/each}
						{/if}
					</div>

					<!-- api info -->
					<div class="rounded-2xl border border-white/6 bg-[#0f120f] p-4" in:fly={{ x: 20, duration: 400, delay: 160 }}>
						<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-white/25">API Info</p>
						{#each [
							{ l:'Source',   v:'CoinGecko v3'         },
							{ l:'Auth',     v:'No key required'       },
							{ l:'Limit',    v:'30 calls / min'        },
							{ l:'Data',     v:'50 coins per page'     },
							{ l:'Refresh',  v:'Every 60s'             }
						] as r}
							<div class="mb-2 flex justify-between text-[10px] last:mb-0">
								<span class="text-white/25">{r.l}</span>
								<span class="font-bold text-white/50">{r.v}</span>
							</div>
						{/each}
					</div>

				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to   { transform: translateX(-50%); }
	}
</style>
