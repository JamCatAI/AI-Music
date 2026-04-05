<script>
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	/** Kraken `result` keys for `pair=XBTUSD,ETHUSD,...` style requests */
	const PAIRS = [
		{ key: 'XXBTZUSD', sym: 'BTC', name: 'Bitcoin' },
		{ key: 'XETHZUSD', sym: 'ETH', name: 'Ethereum' },
		{ key: 'SOLUSD', sym: 'SOL', name: 'Solana' },
		{ key: 'XXRPZUSD', sym: 'XRP', name: 'XRP' },
		{ key: 'ADAUSD', sym: 'ADA', name: 'Cardano' },
		{ key: 'DOTUSD', sym: 'DOT', name: 'Polkadot' },
		{ key: 'LINKUSD', sym: 'LINK', name: 'Chainlink' },
		{ key: 'XDGUSD', sym: 'DOGE', name: 'Dogecoin' },
		{ key: 'AVAXUSD', sym: 'AVAX', name: 'Avalanche' },
		{ key: 'ATOMUSD', sym: 'ATOM', name: 'Cosmos' },
		{ key: 'XLTCZUSD', sym: 'LTC', name: 'Litecoin' },
		{ key: 'BCHUSD', sym: 'BCH', name: 'Bitcoin Cash' },
		{ key: 'UNIUSD', sym: 'UNI', name: 'Uniswap' },
		{ key: 'AAVEUSD', sym: 'AAVE', name: 'Aave' },
		{ key: 'SHIBUSD', sym: 'SHIB', name: 'Shiba Inu' },
		{ key: 'ARBUSD', sym: 'ARB', name: 'Arbitrum' },
		{ key: 'OPUSD', sym: 'OP', name: 'Optimism' },
		{ key: 'NEARUSD', sym: 'NEAR', name: 'NEAR' },
		{ key: 'APTUSD', sym: 'APT', name: 'Aptos' },
		{ key: 'SUIUSD', sym: 'SUI', name: 'Sui' }
	];

	const PAIR_PARAM = PAIRS.map((p) => {
		if (p.key === 'XXBTZUSD') return 'XBTUSD';
		if (p.key === 'XETHZUSD') return 'ETHUSD';
		if (p.key === 'XXRPZUSD') return 'XRPUSD';
		if (p.key === 'XDGUSD') return 'DOGEUSD';
		if (p.key === 'XLTCZUSD') return 'LTCUSD';
		return `${p.sym}USD`;
	}).join(',');

	let rows = $state([]);
	let loading = $state(true);
	let error = $state(null);
	let search = $state('');
	let sortKey = $state('vol');
	let sortDir = $state(-1);
	let lastUpdated = $state(null);
	let pulseSync = $state(false);
	let serverTime = $state(null);

	const KRAKEN_PURPLE = '#5741d9';
	const KRAKEN_ACCENT = '#7c5cff';

	function fmtPrice(n) {
		if (n == null || Number.isNaN(n)) return '—';
		const v = Math.abs(n);
		if (v >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
		if (v >= 1e3) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
		if (v >= 1) return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		if (v >= 0.0001) return `$${n.toFixed(6)}`;
		return `$${n.toExponential(2)}`;
	}

	function fmtVolUsd(n) {
		if (n == null || Number.isNaN(n)) return '—';
		if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
		if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
		if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
		return `$${n.toFixed(0)}`;
	}

	function pctChange(last, open) {
		if (open == null || open === 0 || last == null) return null;
		return ((last - open) / open) * 100;
	}

	function pctStr(n) {
		if (n == null) return '—';
		const sign = n >= 0 ? '+' : '';
		return `${sign}${n.toFixed(2)}%`;
	}

	function sparkPath(seed) {
		let s = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
		const pts = [];
		for (let i = 0; i < 24; i++) {
			s = (s * 16807 + 7) % 2147483647;
			pts.push(28 + (s % 36));
		}
		const w = 72,
			h = 28;
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

	function parseTicker(t) {
		const last = parseFloat(t.c?.[0]);
		const open = parseFloat(t.o);
		const bid = parseFloat(t.b?.[0]);
		const ask = parseFloat(t.a?.[0]);
		const volBase = parseFloat(t.v?.[1] ?? t.v?.[0]);
		const volUsd = volBase * last;
		const change = pctChange(last, open);
		return { last, open, bid, ask, volBase, volUsd, change };
	}

	async function fetchKraken() {
		loading = true;
		error = null;
		try {
			const [tickRes, timeRes] = await Promise.all([
				fetch(`https://api.kraken.com/0/public/Ticker?pair=${PAIR_PARAM}`),
				fetch('https://api.kraken.com/0/public/Time')
			]);

			const tickJson = await tickRes.json();
			if (!tickRes.ok || tickJson.error?.length) {
				throw new Error(tickJson.error?.join('; ') || `HTTP ${tickRes.status}`);
			}

			const result = tickJson.result ?? {};
			const out = [];
			for (const p of PAIRS) {
				const raw = result[p.key];
				if (!raw) continue;
				out.push({
					...p,
					raw,
					...parseTicker(raw)
				});
			}

			rows = out;
			lastUpdated = new Date();

			if (timeRes.ok) {
				const tj = await timeRes.json();
				serverTime = tj.result?.unixtime ?? null;
			}

			pulseSync = true;
			setTimeout(() => (pulseSync = false), 400);
		} catch (e) {
			error = e.message ?? String(e);
		} finally {
			loading = false;
		}
	}

	function setSort(key) {
		if (sortKey === key) sortDir = -sortDir;
		else {
			sortKey = key;
			sortDir = key === 'sym' ? 1 : -1;
		}
	}

	let filtered = $derived(
		!search
			? rows
			: rows.filter(
					(r) =>
						r.sym.toLowerCase().includes(search.toLowerCase()) ||
						r.name.toLowerCase().includes(search.toLowerCase())
				)
	);

	let topByVol = $derived.by(() =>
		[...rows].sort((a, b) => (b.volUsd ?? 0) - (a.volUsd ?? 0)).slice(0, 4)
	);

	let sorted = $derived.by(() => {
		const list = [...filtered];
		const d = sortDir;
		switch (sortKey) {
			case 'sym':
				list.sort((a, b) => d * a.sym.localeCompare(b.sym));
				break;
			case 'price':
				list.sort((a, b) => d * ((a.last ?? 0) - (b.last ?? 0)));
				break;
			case 'chg':
				list.sort((a, b) => d * ((a.change ?? 0) - (b.change ?? 0)));
				break;
			case 'vol':
				list.sort((a, b) => d * ((a.volUsd ?? 0) - (b.volUsd ?? 0)));
				break;
			case 'spread':
				list.sort((a, b) => {
					const sa = a.ask && a.bid ? a.ask - a.bid : 0;
					const sb = b.ask && b.bid ? b.ask - b.bid : 0;
					return d * (sa - sb);
				});
				break;
			default:
				break;
		}
		return list;
	});

	const TICKER_SEGMENTS = [
		{ text: 'KRAKEN', style: 'text-violet-400' },
		{ text: 'SPOT', style: 'text-white/45' },
		{ text: '●', style: 'text-emerald-400 animate-pulse' },
		{ text: 'REST_0', style: 'text-violet-300/70' },
		{ text: 'PUBLIC_TICKER', style: 'text-white/40' },
		{ text: 'USD_PAIRS', style: 'text-fuchsia-400/80' },
		{ text: 'DEPTH', style: 'text-white/35' },
		{ text: 'TRADE_SAFE', style: 'text-cyan-400/60' }
	];

	let syncStr = $derived(lastUpdated ? lastUpdated.toLocaleTimeString('en-GB', { hour12: false }) : '—');

	let serverTimeLabel = $derived(
		serverTime != null
			? new Date(serverTime * 1000).toISOString().slice(11, 19) + ' UTC'
			: null
	);

	onMount(() => {
		fetchKraken();
		const iv = setInterval(fetchKraken, 20_000);
		return () => clearInterval(iv);
	});
</script>

<svelte:head>
	<title>Kraken | JamCat</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
	</style>
</svelte:head>

<div
	class="kraken-root relative min-h-screen overflow-hidden bg-[#07060d] text-white"
	style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif;"
>
	<div class="pointer-events-none fixed inset-0">
		<div
			class="absolute inset-0 opacity-[0.035]"
			style="background-image: linear-gradient(rgba(87,65,217,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(87,65,217,0.4) 1px, transparent 1px); background-size: 44px 44px;"
		></div>
		<div
			class="absolute -top-24 right-1/4 h-[480px] w-[480px] rounded-full opacity-[0.12] blur-[120px]"
			style="background: radial-gradient(circle, {KRAKEN_PURPLE}, transparent 70%);"
		></div>
		<div
			class="absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full opacity-[0.1] blur-[100px]"
			style="background: radial-gradient(circle, #a78bfa, transparent 72%);"
		></div>
	</div>

	<div
		class="relative z-20 border-b border-violet-500/20 bg-black/45 backdrop-blur-2xl"
		style="box-shadow: 0 0 40px rgba(87,65,217,0.08);"
	>
		<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
			<div class="flex flex-wrap items-center gap-4">
				<div class="flex items-center gap-2">
					<span
						class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] {pulseSync
							? 'animate-ping'
							: 'animate-pulse'}"
					></span>
					<span class="text-[10px] font-bold tracking-[0.2em] text-emerald-400/90">LIVE</span>
				</div>
				<div class="hidden h-4 w-px bg-white/15 sm:block"></div>
				<span class="font-mono text-[9px] text-white/35">api.kraken.com/0/public</span>
			</div>
			<div class="min-w-0 flex-1 overflow-hidden px-4">
				<div class="flex w-max animate-kraken-marquee gap-5 whitespace-nowrap">
					{#each [0, 1] as _}
						{#each TICKER_SEGMENTS as seg}
							<span class="text-[10px] font-bold tracking-wider {seg.style}">{seg.text}</span>
							<span class="text-white/20">//</span>
						{/each}
					{/each}
				</div>
			</div>
			<div class="font-mono text-[9px] text-white/40">
				SYNC <span class="text-violet-300">{syncStr}</span>
				{#if serverTimeLabel}
					<span class="text-white/25"> · SRV {serverTimeLabel}</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="relative z-10 mx-auto max-w-6xl px-4 py-8">
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4" in:fly={{ y: -10, duration: 320 }}>
			<div class="flex items-start gap-3">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/35 bg-violet-950/40 text-2xl shadow-[0_0_28px_rgba(87,65,217,0.25)]"
				>
					🐙
				</div>
				<div>
					<h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
						Kraken <span style="color: {KRAKEN_ACCENT}">Spot</span>
					</h1>
					<p class="mt-0.5 text-sm text-white/45">
						USD pairs · public REST ticker · refreshes every 20s
					</p>
				</div>
			</div>
			<button
				type="button"
				onclick={fetchKraken}
				disabled={loading}
				class="rounded-xl border border-violet-500/40 bg-violet-600/15 px-4 py-2.5 text-xs font-bold tracking-wide text-violet-200 transition hover:bg-violet-600/25 disabled:opacity-40"
			>
				{loading ? 'Updating…' : 'Refresh'}
			</button>
		</div>

		{#if error}
			<div
				class="mb-6 rounded-2xl border border-red-500/30 bg-red-950/25 p-6 text-center backdrop-blur-xl"
				in:fade
			>
				<p class="text-sm font-bold text-red-400">Kraken API error</p>
				<p class="mt-2 font-mono text-xs text-white/50">{error}</p>
				<button
					type="button"
					onclick={fetchKraken}
					class="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10"
				>
					Retry
				</button>
			</div>
		{/if}

		{#if loading && !rows.length}
			<div class="space-y-2">
				{#each Array(8) as _, i}
					<div class="h-14 animate-pulse rounded-xl bg-white/[0.05]" style="animation-delay: {i * 80}ms"></div>
				{/each}
			</div>
		{/if}

		{#if rows.length}
			<div
				class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
				in:fly={{ y: 12, duration: 360, delay: 40 }}
			>
				{#each topByVol as r, i (r.key)}
					<div
						class="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition hover:border-violet-500/30"
						in:fly={{ y: 8, duration: 280, delay: 60 + i * 40 }}
					>
						<p class="text-[10px] font-bold uppercase tracking-widest text-white/35">{r.sym}</p>
						<p class="mt-1 text-lg font-extrabold tabular-nums text-white">{fmtPrice(r.last)}</p>
						<p
							class="mt-1 text-xs font-bold tabular-nums {r.change >= 0
								? 'text-emerald-400'
								: 'text-rose-400'}"
						>
							{pctStr(r.change)}
						</p>
						<p class="mt-2 font-mono text-[10px] text-white/30">Vol ≈ {fmtVolUsd(r.volUsd)}</p>
					</div>
				{/each}
			</div>

			<div
				class="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/35 shadow-inner backdrop-blur-2xl"
				in:fade={{ duration: 260 }}
			>
				<div
					class="flex flex-wrap items-center gap-3 border-b border-violet-500/15 bg-violet-950/20 px-4 py-3"
				>
					<input
						bind:value={search}
						placeholder="Filter pair…"
						class="h-9 max-w-xs flex-1 rounded-lg border border-white/10 bg-black/40 px-3 font-mono text-xs text-white placeholder-white/25 outline-none focus:border-violet-500/40"
					/>
					<span class="font-mono text-[10px] text-white/30">{sorted.length} pairs</span>
				</div>

				<div class="kraken-scroll max-h-[min(62vh,560px)] overflow-auto">
					<div class="min-w-[720px]">
						<div
							class="grid grid-cols-[4.5rem_1fr_6.5rem_5rem_5.5rem_6rem_4rem] gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-white/35"
						>
							<button type="button" class="text-left hover:text-violet-300" onclick={() => setSort('sym')}
								>Asset</button
							>
							<span class="hidden sm:block"></span>
							<button
								type="button"
								class="text-right hover:text-violet-300"
								onclick={() => setSort('price')}>Last</button
							>
							<button type="button" class="text-right hover:text-violet-300" onclick={() => setSort('chg')}
								>24h</button
							>
							<button type="button" class="text-right hover:text-violet-300" onclick={() => setSort('vol')}
								>Vol ~$</button
							>
							<button
								type="button"
								class="hidden text-right hover:text-violet-300 md:block"
								onclick={() => setSort('spread')}>Sprd</button
							>
							<span class="hidden text-right lg:block">Pulse</span>
						</div>

						{#each sorted as r, i (r.key)}
							<div
								class="grid grid-cols-[4.5rem_1fr_6.5rem_5rem_5.5rem_6rem_4rem] items-center gap-2 border-b border-white/[0.04] px-4 py-3 text-sm transition-colors hover:bg-violet-500/[0.04] last:border-0"
								in:fly={{ x: -6, duration: 160, delay: Math.min(i * 10, 200) }}
							>
							<div>
								<p class="font-bold text-white">{r.sym}</p>
								<p class="hidden text-[10px] text-white/30 sm:block">{r.name}</p>
							</div>
							<div class="hidden min-w-0 sm:block"></div>
							<p class="text-right font-mono text-xs font-semibold tabular-nums text-white">{fmtPrice(r.last)}</p>
							<p
								class="text-right font-mono text-xs font-bold tabular-nums {r.change >= 0
									? 'text-emerald-400'
									: 'text-rose-400'}"
							>
								{pctStr(r.change)}
							</p>
							<p class="text-right font-mono text-[10px] tabular-nums text-white/45">
								{fmtVolUsd(r.volUsd)}
							</p>
							<p class="hidden text-right font-mono text-[10px] tabular-nums text-violet-300/80 md:block">
								{r.bid && r.ask ? fmtPrice(r.ask - r.bid) : '—'}
							</p>
							<div class="hidden justify-end lg:flex">
								<svg viewBox="0 0 72 28" class="h-7 w-16" preserveAspectRatio="none">
									<path
										d={sparkPath(r.key)}
										fill="none"
										stroke={r.change >= 0 ? '#34d399' : '#fb7185'}
										stroke-width="1.2"
										stroke-linejoin="round"
										opacity="0.85"
									/>
								</svg>
							</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<p class="mt-6 text-center font-mono text-[10px] leading-relaxed text-white/25">
				Volume shown as base × last trade (USD estimate). Not financial advice.
				<a
					href="https://www.kraken.com"
					target="_blank"
					rel="noopener noreferrer"
					class="text-violet-400/80 underline-offset-2 hover:underline">Kraken</a
				>
				·
				<a
					href="https://docs.kraken.com/api/docs/rest-api/get-ticker-information"
					target="_blank"
					rel="noopener noreferrer"
					class="text-violet-400/80 underline-offset-2 hover:underline">API docs</a
				>
			</p>
		{/if}
	</div>
</div>

<style>
	@keyframes kraken-marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
	.animate-kraken-marquee {
		animation: kraken-marquee 32s linear infinite;
	}
	.kraken-scroll {
		scrollbar-width: thin;
		scrollbar-color: rgba(124, 92, 255, 0.35) rgba(0, 0, 0, 0.35);
	}
	.kraken-scroll::-webkit-scrollbar {
		width: 6px;
	}
	.kraken-scroll::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.35);
		border-radius: 3px;
	}
	.kraken-scroll::-webkit-scrollbar-thumb {
		background: rgba(124, 92, 255, 0.3);
		border-radius: 3px;
	}
	.kraken-scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(124, 92, 255, 0.5);
	}
</style>
