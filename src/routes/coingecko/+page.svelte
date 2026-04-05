<script>
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	const NEON = {
		cyan: '#00f0ff',
		magenta: '#ff006e',
		green: '#39ff14',
		red: '#ff3864',
		amber: '#ffbe0b',
		purple: '#bc13fe',
		gecko: '#8dc63f'
	};

	let coins = $state([]);
	let trending = $state([]);
	let global_data = $state(null);
	let loading = $state(true);
	let error = $state(null);
	let search = $state('');
	let category = $state('all');
	let sortKey = $state('market_cap_rank');
	let sortDir = $state(1);
	let page = $state(1);
	let lastUpdated = $state(null);
	let pulseSync = $state(false);

	const CATEGORIES = [
		{ key: 'all', label: 'ALL' },
		{ key: 'defi', label: 'DEFI' },
		{ key: 'layer1', label: 'L1' },
		{ key: 'meme', label: 'MEME' },
		{ key: 'ai', label: 'AI' }
	];

	const TICKER_SEGMENTS = [
		{ text: 'COINGECKO', style: 'text-[#00f0ff]' },
		{ text: 'STREAM', style: 'text-white/45' },
		{ text: '●', style: 'text-[#39ff14] animate-pulse' },
		{ text: 'GLOBAL_IDX', style: 'text-[#8dc63f]/70' },
		{ text: 'MARKET_CAP', style: 'text-white/40' },
		{ text: 'VOLUME_24H', style: 'text-[#bc13fe]/80' },
		{ text: 'TRENDING', style: 'text-[#ff006e]' },
		{ text: 'BTC_ETH_SOL', style: 'text-[#00f0ff]/70' },
		{ text: 'LAYER1_DEFI_AI', style: 'text-[#39ff14]/55' }
	];

	async function fetchCoins() {
		loading = true;
		error = null;
		try {
			const [coinsRes, globalRes, trendRes] = await Promise.all([
				fetch(
					`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`
				),
				fetch('https://api.coingecko.com/api/v3/global'),
				fetch('https://api.coingecko.com/api/v3/search/trending')
			]);

			if (!coinsRes.ok) throw new Error(`CoinGecko ${coinsRes.status}: ${coinsRes.statusText}`);

			coins = await coinsRes.json();
			global_data = globalRes.ok ? (await globalRes.json()).data : null;
			trending = trendRes.ok ? (await trendRes.json()).coins?.slice(0, 8) ?? [] : [];
			lastUpdated = new Date();
			pulseSync = true;
			setTimeout(() => (pulseSync = false), 380);
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function sparkPath(pts) {
		if (!pts?.length) return '';
		const w = 80,
			h = 32;
		const min = Math.min(...pts),
			max = Math.max(...pts);
		const range = max - min || 1;
		return pts
			.map((p, i) => {
				const x = (i / (pts.length - 1)) * w;
				const y = h - ((p - min) / range) * h;
				return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}

	function fmt(n, digits = 2) {
		if (n == null) return '—';
		if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
		if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
		if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
		if (Math.abs(n) >= 1e3) return `$${n.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
		return `$${n.toFixed(digits > 4 ? 6 : digits)}`;
	}

	function pct(n) {
		if (n == null) return '—';
		const sign = n >= 0 ? '+' : '';
		return `${sign}${n.toFixed(2)}%`;
	}

	function pctColor(n) {
		if (n == null) return 'text-white/35';
		return n >= 0 ? 'text-[#39ff14]' : 'text-[#ff3864]';
	}

	function setSort(key) {
		if (sortKey === key) sortDir = -sortDir;
		else {
			sortKey = key;
			sortDir = key === 'market_cap_rank' ? 1 : -1;
		}
	}

	let filtered = $derived(
		coins
			.filter(
				(c) =>
					!search ||
					c.name.toLowerCase().includes(search.toLowerCase()) ||
					c.symbol.toLowerCase().includes(search.toLowerCase())
			)
			.sort((a, b) => {
				const av = a[sortKey] ?? 0,
					bv = b[sortKey] ?? 0;
				return sortDir * (av - bv);
			})
	);

	let syncTimeStr = $derived(lastUpdated ? lastUpdated.toLocaleTimeString('en-GB', { hour12: false }) : '—');

	onMount(() => {
		fetchCoins();
		const iv = setInterval(fetchCoins, 60_000);
		return () => clearInterval(iv);
	});
</script>

<svelte:head>
	<title>CG // MARKET TERMINAL | JamCat</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Orbitron:wght@500;700;800;900&display=swap');
	</style>
</svelte:head>

<div
	class="cg-root relative min-h-screen overflow-hidden bg-[#030308] text-white"
	style="font-family: 'JetBrains Mono', ui-monospace, monospace;"
>
	<!-- atmosphere -->
	<div class="pointer-events-none fixed inset-0">
		<div
			class="absolute inset-0 opacity-[0.04]"
			style="background-image: linear-gradient(rgba(0,240,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.35) 1px, transparent 1px); background-size: 48px 48px;"
		></div>
		<div
			class="absolute -top-32 left-1/3 h-[520px] w-[520px] rounded-full opacity-[0.14] blur-[140px]"
			style="background: radial-gradient(circle, {NEON.cyan}, transparent 68%);"
		></div>
		<div
			class="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full opacity-[0.12] blur-[120px]"
			style="background: radial-gradient(circle, {NEON.magenta}, transparent 70%);"
		></div>
		<div
			class="absolute top-1/2 -left-20 h-[280px] w-[280px] rounded-full opacity-[0.08] blur-[100px]"
			style="background: radial-gradient(circle, {NEON.gecko}, transparent 72%);"
		></div>
		<div
			class="absolute inset-0 opacity-[0.025]"
			style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.45) 2px, rgba(0,240,255,0.45) 3px);"
		></div>
		<div
			class="absolute inset-0"
			style="background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,240,255,0.06), transparent 55%);"
		></div>
	</div>

	<!-- top command bar -->
	<div
		class="relative z-20 border-b border-cyan-500/20 bg-black/50 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,240,255,0.06)]"
	>
		<div class="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-5">
			<div class="flex flex-wrap items-center gap-3 sm:gap-5">
				<div class="flex items-center gap-2">
					<span
						class="h-2 w-2 rounded-full bg-[#39ff14] shadow-[0_0_12px_#39ff14] {pulseSync
							? 'animate-ping'
							: 'animate-pulse'}"
						style="animation-duration: {pulseSync ? '0.6s' : '2s'};"
					></span>
					<span class="text-[10px] font-bold tracking-[0.2em] text-[#39ff14]" style="text-shadow: 0 0 8px #39ff1440;"
						>LIVE FEED</span
					>
				</div>
				<div class="hidden h-4 w-px bg-white/15 sm:block"></div>
				<span class="text-[9px] tracking-wider text-white/35">NODE // CG-MKT-01</span>
				<div class="hidden h-4 w-px bg-white/15 md:block"></div>
				<span class="text-[9px] text-white/40"
					>LAST_SYNC <span class="font-bold text-cyan-300/90">{syncTimeStr}</span> UTC_LOCAL</span
				>
			</div>
			<div class="min-w-0 flex-1 overflow-hidden px-2 md:px-8">
				<div class="flex w-max animate-marquee gap-5 whitespace-nowrap">
					{#each [0, 1] as _}
						{#each TICKER_SEGMENTS as seg}
							<span class="text-[10px] font-bold tracking-wider {seg.style}">{seg.text}</span>
							<span class="text-white/25">//</span>
						{/each}
					{/each}
				</div>
			</div>
			<div class="flex items-center gap-4 text-[9px]">
				<div class="hidden items-center gap-1.5 sm:flex">
					<span class="text-white/35">API</span>
					<span class="font-bold text-cyan-400/90" style="text-shadow: 0 0 6px rgba(0,240,255,0.4);">v3</span>
				</div>
				<div class="hidden h-4 w-px bg-white/15 lg:block"></div>
				<div class="hidden items-center gap-1.5 lg:flex">
					<span class="text-white/35">INTERVAL</span>
					<span class="font-bold text-[#8dc63f]">60s</span>
				</div>
			</div>
		</div>
	</div>

	<div class="relative z-10 mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-5">
		<!-- header + actions -->
		<div class="mb-4 flex flex-wrap items-end justify-between gap-4" in:fly={{ y: -12, duration: 380 }}>
			<div class="flex min-w-0 items-start gap-3">
				<div
					class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-400/40 bg-black/50 shadow-[0_0_24px_rgba(0,240,255,0.15)]"
				>
					<div class="absolute inset-0 bg-gradient-to-br from-cyan-500/25 to-transparent"></div>
					<span class="relative text-xl drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]">🦎</span>
				</div>
				<div class="min-w-0">
					<h1
						class="text-lg font-black tracking-[0.18em] text-white sm:text-xl"
						style="font-family: 'Orbitron', sans-serif;"
					>
						COINGECKO<span class="text-cyan-400" style="text-shadow: 0 0 20px rgba(0,240,255,0.45);"
							>.TERMINAL</span
						>
					</h1>
					<p class="text-[9px] tracking-[0.12em] text-white/40">
						MARKET_CAP // VOLUME // DOMINANCE // TRENDING_COINS
					</p>
					{#if lastUpdated}
						<p class="mt-1 text-[8px] text-white/25">
							AUTO_REFRESH 60s · SOURCE coingecko.com/api/v3
						</p>
					{/if}
				</div>
			</div>
			<button
				onclick={fetchCoins}
				disabled={loading}
				class="group rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-4 py-2 text-[10px] font-bold tracking-wider text-cyan-200/90 shadow-[0_0_20px_rgba(0,240,255,0.08)] transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:shadow-[0_0_28px_rgba(0,240,255,0.18)] disabled:opacity-35"
			>
				<span class="inline-block transition group-hover:rotate-180">{loading ? '⟳' : '↻'}</span>
				{loading ? ' SYNC…' : ' RESYNC'}
			</button>
		</div>

		<!-- global metrics strip -->
		{#if global_data}
			<div
				class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3"
				in:fly={{ y: 10, duration: 360, delay: 40 }}
			>
				{#each [
					{
						l: 'TTL_MKT_CAP',
						v: fmt(global_data.total_market_cap?.usd),
						sub: pct(global_data.market_cap_change_percentage_24h_usd),
						pos: global_data.market_cap_change_percentage_24h_usd >= 0,
						accent: 'cyan'
					},
					{
						l: 'VOL_24H',
						v: fmt(global_data.total_volume?.usd),
						sub: '',
						pos: true,
						accent: 'purple'
					},
					{
						l: 'BTC_DOM',
						v: `${global_data.market_cap_percentage?.btc?.toFixed(1)}%`,
						sub: '',
						pos: true,
						accent: 'gecko'
					},
					{
						l: 'ACTIVE_PAIRS',
						v: global_data.active_cryptocurrencies?.toLocaleString(),
						sub: '',
						pos: true,
						accent: 'magenta'
					}
				] as s}
					<div
						class="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl transition hover:border-cyan-400/25 hover:bg-white/[0.05] hover:shadow-[0_0_32px_rgba(0,240,255,0.08)]"
					>
						<div
							class="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl transition group-hover:opacity-50"
							style="background: {s.accent === 'cyan'
								? 'rgba(0,240,255,0.5)'
								: s.accent === 'purple'
									? 'rgba(188,19,254,0.45)'
									: s.accent === 'gecko'
										? 'rgba(141,198,63,0.5)'
										: 'rgba(255,0,110,0.45)'};"
						></div>
						<p class="text-[8px] font-bold tracking-[0.2em] text-white/30">{s.l}</p>
						<p class="mt-1 font-mono text-base font-bold tabular-nums tracking-tight text-white sm:text-lg">
							{s.v}
						</p>
						{#if s.sub}
							<p
								class="mt-0.5 text-[9px] font-bold tabular-nums {s.pos ? 'text-[#39ff14]' : 'text-[#ff3864]'}"
								style="text-shadow: 0 0 8px currentColor;"
							>
								{s.sub} <span class="text-white/25">24h</span>
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="flex flex-col gap-4 lg:flex-row lg:items-start">
			<!-- main matrix -->
			<div class="min-w-0 flex-1">
				<div
					class="mb-3 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3"
					in:fly={{ x: -10, duration: 340, delay: 60 }}
				>
					<input
						bind:value={search}
						placeholder="> QUERY_SYMBOL…"
						class="h-9 w-full max-w-[220px] rounded-lg border border-white/10 bg-black/40 px-3 font-mono text-[11px] text-cyan-100/90 placeholder-white/25 outline-none ring-cyan-500/0 transition focus:border-cyan-400/40 focus:bg-black/55 focus:ring-2 focus:ring-cyan-500/20 sm:max-w-[260px]"
					/>
					<div class="flex flex-wrap gap-1">
						{#each CATEGORIES as c (c.key)}
							<button
								onclick={() => (category = c.key)}
								class="rounded border px-2.5 py-1 text-[8px] font-bold tracking-[0.15em] transition
									{category === c.key
									? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_rgba(0,240,255,0.2)]'
									: 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/70'}"
							>
								{c.label}
							</button>
						{/each}
					</div>
					<span
						class="ml-auto font-mono text-[9px] tabular-nums text-white/30"
						>{filtered.length}<span class="text-white/15"> / {coins.length}</span> ROWS</span
					>
				</div>

				{#if error}
					<div
						class="mb-4 rounded-xl border border-red-500/35 bg-red-950/20 p-5 text-center backdrop-blur-xl"
						in:fade
					>
						<p class="mb-1 text-2xl">⚠</p>
						<p class="text-xs font-bold tracking-wider text-red-400" style="text-shadow: 0 0 12px #f8717188;">
							UPLINK_ERROR
						</p>
						<p class="mt-2 font-mono text-[10px] text-white/45">{error}</p>
						<p class="mt-2 text-[9px] text-white/25">Rate limit on free tier — retry shortly.</p>
						<button
							onclick={fetchCoins}
							class="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-[10px] font-bold text-red-300 transition hover:bg-red-500/10"
						>
							RETRY_HANDSHAKE
						</button>
					</div>
				{/if}

				{#if loading && !coins.length}
					<div class="space-y-1.5">
						{#each Array(12) as _, i}
							<div
								class="h-12 animate-pulse rounded-lg bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04]"
								style="animation-delay: {i * 45}ms"
							></div>
						{/each}
					</div>
				{/if}

				{#if coins.length}
					<div
						class="overflow-hidden rounded-xl border border-white/[0.08] bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl"
						in:fade={{ duration: 280 }}
					>
						<div
							class="grid grid-cols-[1.75rem_1fr_5.5rem_4.5rem_4.5rem_4.5rem_4.5rem_4.25rem] items-center gap-1.5 border-b border-cyan-500/15 bg-cyan-950/20 px-2 py-2.5 text-[8px] font-bold uppercase tracking-[0.18em] text-white/35 sm:px-3 sm:text-[9px]"
						>
							<span class="text-center">#</span>
							<button
								type="button"
								onclick={() => setSort('name')}
								class="text-left transition hover:text-cyan-300/80">Asset</button
							>
							<button
								type="button"
								onclick={() => setSort('current_price')}
								class="text-right transition hover:text-cyan-300/80">Px</button
							>
							<button
								type="button"
								onclick={() => setSort('price_change_percentage_1h_in_currency')}
								class="text-right transition hover:text-cyan-300/80">1h</button
							>
							<button
								type="button"
								onclick={() => setSort('price_change_percentage_24h')}
								class="text-right transition hover:text-cyan-300/80">24h</button
							>
							<button
								type="button"
								onclick={() => setSort('market_cap')}
								class="hidden text-right transition hover:text-cyan-300/80 sm:block">Mcap</button
							>
							<button
								type="button"
								onclick={() => setSort('total_volume')}
								class="hidden text-right transition hover:text-cyan-300/80 md:block">Vol</button
							>
							<span class="hidden text-right lg:block">7d</span>
						</div>

						<div class="cg-scroll max-h-[min(70vh,720px)] overflow-auto">
							{#each filtered as coin, i (coin.id)}
								{@const change24 = coin.price_change_percentage_24h}
								{@const change1h = coin.price_change_percentage_1h_in_currency}
								{@const change7d = coin.price_change_percentage_7d_in_currency}
								{@const spark7 = coin.sparkline_in_7d?.price ?? []}
								<div
									class="grid grid-cols-[1.75rem_1fr_5.5rem_4.5rem_4.5rem_4.5rem_4.5rem_4.25rem] items-center gap-1.5 border-b border-white/[0.04] px-2 py-2 text-[10px] transition-colors last:border-0 hover:bg-cyan-500/[0.04] sm:px-3 sm:py-2.5 sm:text-[11px]"
									in:fly={{ x: -6, duration: 180, delay: Math.min(i * 12, 320) }}
								>
									<span class="text-center font-mono text-[9px] text-white/30">{coin.market_cap_rank}</span>
									<div class="flex min-w-0 items-center gap-2">
										{#if coin.image}
											<img
												src={coin.image}
												alt={coin.name}
												class="h-7 w-7 shrink-0 rounded-full ring-1 ring-white/10"
												loading="lazy"
											/>
										{/if}
										<div class="min-w-0">
											<p class="truncate font-bold tracking-tight text-white/95">{coin.name}</p>
											<p class="text-[8px] font-bold uppercase tracking-wider text-white/30">
												{coin.symbol}
											</p>
										</div>
									</div>
									<p class="text-right font-mono font-bold tabular-nums text-white/90">
										{fmt(coin.current_price, coin.current_price < 1 ? 6 : 2)}
									</p>
									<p class="text-right font-mono text-[10px] font-bold tabular-nums {pctColor(change1h)}">
										{pct(change1h)}
									</p>
									<p class="text-right font-mono text-[10px] font-bold tabular-nums {pctColor(change24)}">
										{pct(change24)}
									</p>
									<p class="hidden text-right font-mono text-[9px] tabular-nums text-white/45 sm:block">
										{fmt(coin.market_cap)}
									</p>
									<p class="hidden text-right font-mono text-[9px] tabular-nums text-white/45 md:block">
										{fmt(coin.total_volume)}
									</p>
									<div class="hidden justify-end lg:flex">
										{#if spark7.length}
											<svg viewBox="0 0 80 32" class="h-7 w-[4.5rem]" preserveAspectRatio="none">
												<path
													d={sparkPath(spark7)}
													fill="none"
													stroke={change7d >= 0 ? NEON.green : NEON.red}
													stroke-width="1.25"
													stroke-linejoin="round"
													style="filter: drop-shadow(0 0 3px currentColor);"
												/>
											</svg>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="mt-3 flex items-center justify-center gap-2">
						<button
							onclick={() => {
								page = Math.max(1, page - 1);
								fetchCoins();
							}}
							disabled={page === 1 || loading}
							class="rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[9px] font-bold tracking-wider text-white/45 backdrop-blur-md transition hover:border-cyan-400/30 hover:text-cyan-200 disabled:opacity-25"
						>
							◀ PREV
						</button>
						<span class="px-2 font-mono text-[9px] tabular-nums text-white/35"
							>PAGE <span class="text-cyan-400/80">{page}</span></span
						>
						<button
							onclick={() => {
								page++;
								fetchCoins();
							}}
							disabled={loading}
							class="rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[9px] font-bold tracking-wider text-white/45 backdrop-blur-md transition hover:border-cyan-400/30 hover:text-cyan-200 disabled:opacity-25"
						>
							NEXT ▶
						</button>
					</div>
				{/if}
			</div>

			<!-- side stack -->
			<div class="flex w-full shrink-0 flex-col gap-3 lg:w-64 xl:w-72">
				<div
					class="rounded-xl border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-950/25 to-black/40 p-3 shadow-[0_0_40px_rgba(255,0,110,0.06)] backdrop-blur-2xl"
					in:fly={{ x: 14, duration: 360, delay: 80 }}
				>
					<div class="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2">
						<p class="text-[9px] font-bold tracking-[0.2em] text-fuchsia-300/80">TRENDING</p>
						<span class="text-[8px] text-white/25">search/trending</span>
					</div>
					{#if trending.length}
						<div class="space-y-2">
							{#each trending as t, i (t.item?.id)}
								{@const item = t.item}
								<div
									class="flex items-center gap-2 rounded-lg border border-transparent px-1 py-1 transition hover:border-fuchsia-500/20 hover:bg-white/[0.03]"
								>
									<span class="w-4 text-center font-mono text-[9px] font-bold text-white/25">{i + 1}</span>
									{#if item.small}
										<img
											src={item.small}
											alt={item.name}
											class="h-6 w-6 rounded-full ring-1 ring-fuchsia-500/20"
											loading="lazy"
										/>
									{/if}
									<div class="min-w-0 flex-1">
										<p class="truncate text-[10px] font-bold text-white/85">{item.name}</p>
										<p class="text-[8px] font-bold uppercase tracking-wider text-white/30">{item.symbol}</p>
									</div>
									<span class="font-mono text-[9px] font-bold text-fuchsia-400/90"
										>#{item.market_cap_rank ?? '?'}</span
									>
								</div>
							{/each}
						</div>
					{:else if loading}
						<div class="space-y-2">
							{#each Array(8) as _}
								<div class="h-9 animate-pulse rounded-lg bg-white/[0.06]"></div>
							{/each}
						</div>
					{/if}
				</div>

				<div
					class="rounded-xl border border-cyan-500/15 bg-black/40 p-3 backdrop-blur-2xl"
					in:fly={{ x: 14, duration: 360, delay: 120 }}
				>
					<p class="mb-2 border-b border-white/[0.06] pb-2 text-[9px] font-bold tracking-[0.2em] text-cyan-400/70">
						UPLINK_SPEC
					</p>
					{#each [
						{ l: 'SOURCE', v: 'CoinGecko v3' },
						{ l: 'AUTH', v: 'Public' },
						{ l: 'LIMIT', v: '~30 / min' },
						{ l: 'PAGE', v: '50 assets' },
						{ l: 'POLL', v: '60s' }
					] as r}
						<div class="mb-1.5 flex justify-between gap-2 text-[9px] last:mb-0">
							<span class="text-white/30">{r.l}</span>
							<span class="font-mono font-bold text-white/55">{r.v}</span>
						</div>
					{/each}
				</div>

				<div
					class="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 font-mono text-[8px] leading-relaxed text-white/30 backdrop-blur-xl"
					in:fly={{ x: 14, duration: 360, delay: 160 }}
				>
					<span class="text-cyan-500/60">$</span> jamcat market terminal · not financial advice · data may lag
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
	.animate-marquee {
		animation: marquee 36s linear infinite;
	}
	.cg-scroll {
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 240, 255, 0.35) rgba(0, 0, 0, 0.35);
	}
	.cg-scroll::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}
	.cg-scroll::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.35);
		border-radius: 3px;
	}
	.cg-scroll::-webkit-scrollbar-thumb {
		background: rgba(0, 240, 255, 0.28);
		border-radius: 3px;
	}
	.cg-scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 240, 255, 0.45);
	}
</style>
