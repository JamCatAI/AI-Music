<script>
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	// ── state ────────────────────────────────────────────────────
	let pairs      = $state([]);
	let searched   = $state([]);
	let boosted    = $state([]);
	let loading    = $state(true);
	let searching  = $state(false);
	let error      = $state(null);
	let query      = $state('');
	let chain      = $state('all');
	let sortKey    = $state('volume');
	let lastUpdated = $state(null);

	const CHAINS = [
		{ key:'all',      label:'All Chains',  color:'#888' },
		{ key:'solana',   label:'⚡ Solana',   color:'#9945FF' },
		{ key:'ethereum', label:'💎 Ethereum', color:'#627EEA' },
		{ key:'bsc',      label:'🟡 BSC',      color:'#F3BA2F' },
		{ key:'base',     label:'🔵 Base',     color:'#0052FF' }
	];

	// DexScreener public API — no key needed
	const BASE = 'https://api.dexscreener.com';

	async function fetchTrending() {
		loading = true; error = null;
		try {
			// Get latest/boosted tokens on DexScreener
			const [trendRes, boostRes] = await Promise.all([
				fetch(`${BASE}/token-profiles/latest/v1`),
				fetch(`${BASE}/token-boosts/top/v1`)
			]);

			if (trendRes.ok) {
				const data = await trendRes.json();
				// data is an array of token profiles
				const profiles = Array.isArray(data) ? data.slice(0, 30) : [];
				// For each profile, fetch pair data
				await fetchPairsForProfiles(profiles);
			} else {
				// Fallback: search for popular tokens
				await searchPairs('SOL');
			}

			if (boostRes.ok) {
				const data = await boostRes.json();
				boosted = Array.isArray(data) ? data.slice(0, 5) : [];
			}

			lastUpdated = new Date();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function fetchPairsForProfiles(profiles) {
		// Batch fetch pairs by chain/address from profiles
		const addresses = profiles
			.filter(p => p.tokenAddress && p.chainId)
			.slice(0, 20)
			.map(p => ({ chain: p.chainId, addr: p.tokenAddress }));

		if (!addresses.length) { await searchPairs('SOL'); return; }

		// Fetch by pairs for a few representative ones
		const res = await fetch(`${BASE}/latest/dex/tokens/${addresses.slice(0,5).map(a=>a.addr).join(',')}`);
		if (res.ok) {
			const data = await res.json();
			pairs = (data.pairs ?? []).slice(0, 50);
		} else {
			await searchPairs('SOL');
		}
	}

	async function searchPairs(q) {
		if (!q.trim()) return;
		searching = true; error = null;
		try {
			const res = await fetch(`${BASE}/latest/dex/search?q=${encodeURIComponent(q)}`);
			if (!res.ok) throw new Error(`DexScreener ${res.status}`);
			const data = await res.json();
			const result = data.pairs ?? [];
			if (q !== 'SOL') {
				searched = result.slice(0, 30);
			} else {
				pairs = result.slice(0, 50);
			}
		} catch (e) {
			error = e.message;
		} finally {
			searching = false;
		}
	}

	let debounceTimer;
	function onSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			if (query.length > 1) searchPairs(query);
			else searched = [];
		}, 400);
	}

	// Use searched results if there's a query, otherwise use fetched pairs
	let displayPairs = $derived(
		(query.length > 1 ? searched : pairs)
			.filter(p => chain === 'all' || p.chainId === chain)
			.sort((a, b) => {
				if (sortKey === 'volume') return (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0);
				if (sortKey === 'price_change') return (b.priceChange?.h24 ?? 0) - (a.priceChange?.h24 ?? 0);
				if (sortKey === 'liquidity') return (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0);
				if (sortKey === 'txns') return (b.txns?.h24?.buys + b.txns?.h24?.sells ?? 0) - (a.txns?.h24?.buys + a.txns?.h24?.sells ?? 0);
				return 0;
			})
	);

	function fmt(n) {
		if (n == null || isNaN(n)) return '—';
		if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
		if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
		if (n >= 1e3)  return `$${(n/1e3).toFixed(1)}K`;
		return `$${n.toFixed(2)}`;
	}

	function fmtPrice(p) {
		if (p == null) return '—';
		const n = parseFloat(p);
		if (isNaN(n)) return '—';
		if (n >= 1000) return `$${n.toLocaleString(undefined,{maximumFractionDigits:2})}`;
		if (n >= 1)    return `$${n.toFixed(4)}`;
		if (n >= 0.01) return `$${n.toFixed(6)}`;
		return `$${n.toExponential(3)}`;
	}

	function pct(n) {
		if (n == null || isNaN(n)) return '—';
		const sign = n >= 0 ? '+' : '';
		return `${sign}${n.toFixed(2)}%`;
	}

	function pctColor(n) {
		if (n == null) return 'text-white/30';
		return n >= 0 ? 'text-emerald-400' : 'text-red-400';
	}

	function chainBadge(chainId) {
		const map = {
			solana: { label: 'SOL', color: '#9945FF' },
			ethereum: { label: 'ETH', color: '#627EEA' },
			bsc: { label: 'BSC', color: '#F3BA2F' },
			base: { label: 'BASE', color: '#0052FF' },
			polygon: { label: 'POL', color: '#8247E5' },
			arbitrum: { label: 'ARB', color: '#12AAFF' },
			avalanche: { label: 'AVAX', color: '#E84142' }
		};
		return map[chainId] ?? { label: chainId?.toUpperCase().slice(0,4) ?? '?', color: '#888' };
	}

	const TICKER = '📊 DEXSCREENER · LIVE DEX PAIRS · SOLANA · ETHEREUM · BSC · BASE · VOLUME · LIQUIDITY · PRICE CHANGE · REAL-TIME TRADING DATA · ';

	onMount(() => {
		fetchTrending();
		const iv = setInterval(fetchTrending, 30_000);
		return () => clearInterval(iv);
	});
</script>

<svelte:head><title>DEX | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-black/40 py-2.5 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 38s linear infinite">
		{#each [TICKER,TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#00d4aa">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen bg-[#080b0b]">

	<!-- ambient -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full opacity-[0.06] blur-[140px]"
			 style="background:radial-gradient(circle,#00d4aa,transparent 70%)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">

		<!-- ── HERO ─────────────────────────────────────────────── -->
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4" in:fly={{ y:-16, duration:400 }}>
			<div>
				<div class="mb-2 flex items-center gap-3">
					<span class="text-2xl">📊</span>
					<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl">DexScreener</h1>
				</div>
				<p class="text-sm text-white/30">Real-time DEX pairs across all chains · powered by DexScreener API</p>
				{#if lastUpdated}
					<p class="mt-1 text-[10px] text-white/15">Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 30s</p>
				{/if}
			</div>
			<button onclick={fetchTrending} disabled={loading}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30">
				{loading ? '⟳ Loading…' : '⟳ Refresh'}
			</button>
		</div>

		<!-- ── BOOSTED TOKENS ────────────────────────────────────── -->
		{#if boosted.length}
			<div class="mb-8" in:fly={{ y:12, duration:400, delay:60 }}>
				<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-white/20">🚀 Boosted</p>
				<div class="flex flex-wrap gap-2">
					{#each boosted as b (b.tokenAddress)}
						{@const ch = chainBadge(b.chainId)}
						<a href={b.url ?? '#'} target="_blank" rel="noopener"
							class="flex items-center gap-2 rounded-xl border border-white/8 bg-[#0f1414] px-3 py-2 transition hover:border-[#00d4aa]/30 hover:bg-white/5">
							{#if b.icon}
								<img src={b.icon} alt="" class="h-6 w-6 rounded-full" loading="lazy" />
							{/if}
							<span class="text-xs font-black text-white/70">{b.description?.slice(0,20) ?? 'Token'}</span>
							<span class="rounded-full px-1.5 py-0.5 text-[8px] font-black" style="background:{ch.color}22;color:{ch.color}">{ch.label}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ── SEARCH + FILTERS ──────────────────────────────────── -->
		<div class="mb-6 flex flex-wrap items-center gap-3" in:fly={{ x:-16, duration:400, delay:80 }}>
			<!-- search -->
			<div class="relative">
				<input bind:value={query} oninput={onSearch}
					placeholder="Search token, pair or address…"
					class="w-64 rounded-xl border border-white/8 bg-white/4 py-2 pl-4 pr-10 text-sm text-white placeholder-white/20 outline-none focus:border-[#00d4aa]/40 transition" />
				{#if searching}
					<div class="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin rounded-full border-2 border-[#00d4aa]/30 border-t-[#00d4aa]"></div>
				{:else}
					<span class="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">🔍</span>
				{/if}
			</div>

			<!-- chain filter -->
			<div class="flex flex-wrap gap-1">
				{#each CHAINS as c (c.key)}
					<button onclick={() => chain = c.key}
						class="rounded-full border px-3 py-1 text-[10px] font-black transition
							   {chain === c.key ? 'bg-white text-black border-white' : 'border-white/8 text-white/30 hover:text-white'}">
						{c.label}
					</button>
				{/each}
			</div>

			<!-- sort -->
			<div class="ml-auto flex gap-2 items-center">
				<span class="text-[9px] text-white/20">Sort:</span>
				{#each [
					{key:'volume',label:'Volume'},{key:'liquidity',label:'Liquidity'},
					{key:'price_change',label:'Change'},{key:'txns',label:'Txns'}
				] as s (s.key)}
					<button onclick={() => sortKey = s.key}
						class="text-[9px] font-black transition {sortKey===s.key?'text-[#00d4aa]':'text-white/20 hover:text-white/50'}">
						{s.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- ── ERROR ─────────────────────────────────────────────── -->
		{#if error}
			<div class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/8 p-6 text-center" in:fade>
				<p class="text-2xl mb-2">⚠️</p>
				<p class="text-sm font-black text-red-400">API Error</p>
				<p class="text-xs text-white/40 mt-1">{error}</p>
				<button onclick={fetchTrending} class="mt-4 rounded-xl border border-red-400/30 px-4 py-2 text-xs font-black text-red-400 hover:bg-red-400/10 transition">Retry</button>
			</div>
		{/if}

		<!-- ── SKELETON ──────────────────────────────────────────── -->
		{#if loading && !pairs.length}
			<div class="space-y-2">
				{#each Array(12) as _, i}
					<div class="h-16 animate-pulse rounded-xl bg-white/4" style="animation-delay:{i*50}ms"></div>
				{/each}
			</div>
		{/if}

		<!-- ── PAIRS TABLE ───────────────────────────────────────── -->
		{#if displayPairs.length}
			<div class="overflow-hidden rounded-2xl border border-white/6 bg-[#0f1414]" in:fade={{ duration:300 }}>
				<!-- header -->
				<div class="grid grid-cols-[5rem_1fr_5rem_5rem_5rem_5rem_4rem] items-center gap-2 border-b border-white/5 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white/20">
					<span>Chain</span>
					<span>Pair</span>
					<span class="text-right">Price</span>
					<span class="text-right">24h %</span>
					<span class="hidden text-right sm:block">Volume</span>
					<span class="hidden text-right md:block">Liquidity</span>
					<span class="hidden text-right lg:block">Txns 24h</span>
				</div>

				{#each displayPairs.slice(0,40) as pair, i (pair.pairAddress ?? i)}
					{@const ch = chainBadge(pair.chainId)}
					{@const change24 = pair.priceChange?.h24}
					{@const txns = (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0)}
					<a href={pair.url ?? '#'} target="_blank" rel="noopener"
						class="grid grid-cols-[5rem_1fr_5rem_5rem_5rem_5rem_4rem] items-center gap-2 border-b border-white/3 px-4 py-3 text-xs transition hover:bg-white/2 last:border-0"
						in:fly={{ x:-8, duration:200, delay:Math.min(i*15,400) }}>

						<!-- chain -->
						<div>
							<span class="rounded-full px-2 py-0.5 text-[9px] font-black"
								  style="background:{ch.color}20;color:{ch.color}">{ch.label}</span>
						</div>

						<!-- pair name -->
						<div class="flex items-center gap-2 min-w-0">
							{#if pair.info?.imageUrl}
								<img src={pair.info.imageUrl} alt="" class="h-7 w-7 shrink-0 rounded-full" loading="lazy" />
							{:else}
								<div class="h-7 w-7 shrink-0 rounded-full bg-white/8 flex items-center justify-center">
									<span class="text-[10px] font-black text-white/30">{pair.baseToken?.symbol?.[0] ?? '?'}</span>
								</div>
							{/if}
							<div class="min-w-0">
								<p class="truncate font-black text-white">
									{pair.baseToken?.symbol ?? '?'}<span class="text-white/30">/{pair.quoteToken?.symbol ?? '?'}</span>
								</p>
								<p class="truncate text-[9px] text-white/25">{pair.baseToken?.name ?? ''}</p>
							</div>
						</div>

						<!-- price -->
						<p class="text-right font-black text-white text-[11px]">{fmtPrice(pair.priceUsd)}</p>

						<!-- 24h change -->
						<p class="text-right text-[11px] font-bold {pctColor(change24)}">{pct(change24)}</p>

						<!-- volume -->
						<p class="hidden text-right text-[10px] text-white/40 sm:block">{fmt(pair.volume?.h24)}</p>

						<!-- liquidity -->
						<p class="hidden text-right text-[10px] text-white/40 md:block">{fmt(pair.liquidity?.usd)}</p>

						<!-- txns -->
						<p class="hidden text-right text-[10px] text-white/40 lg:block">{txns ? txns.toLocaleString() : '—'}</p>
					</a>
				{/each}
			</div>

			<p class="mt-3 text-center text-[10px] text-white/15">
				Showing {Math.min(displayPairs.length, 40)} of {displayPairs.length} pairs · Click any row to view on DexScreener
			</p>
		{:else if !loading && !error}
			<div class="rounded-2xl border border-white/6 bg-[#0f1414] p-12 text-center" in:fade>
				<p class="text-3xl mb-3">📊</p>
				<p class="text-sm font-black text-white/40">No pairs found</p>
				<p class="text-xs text-white/20 mt-1">Try a different search or chain filter</p>
			</div>
		{/if}

	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to   { transform: translateX(-50%); }
	}
</style>
