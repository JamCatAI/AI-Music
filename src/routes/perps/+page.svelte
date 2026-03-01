<svelte:head>
	<title>Perps | JamCat DEX</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	// ── Markets ──────────────────────────────────────────────────────────────────
	const MARKETS = [
		{ id: 'SOL-PERP',  base: 'SOL',  price: 185.42, change: 2.34,  vol: '842M',  oi: '234M',  funding:  0.0082, decimals: 2 },
		{ id: 'BTC-PERP',  base: 'BTC',  price: 94820,  change: -0.87, vol: '2.1B',  oi: '1.2B',  funding: -0.0031, decimals: 1 },
		{ id: 'ETH-PERP',  base: 'ETH',  price: 3284,   change: 1.12,  vol: '980M',  oi: '560M',  funding:  0.0045, decimals: 2 },
		{ id: 'JTO-PERP',  base: 'JTO',  price: 3.84,   change: 5.21,  vol: '42M',   oi: '18M',   funding:  0.0124, decimals: 4 },
		{ id: 'WIF-PERP',  base: 'WIF',  price: 2.17,   change: -3.44, vol: '38M',   oi: '15M',   funding: -0.0089, decimals: 4 },
		{ id: 'JUP-PERP',  base: 'JUP',  price: 0.89,   change: 0.54,  vol: '61M',   oi: '22M',   funding:  0.0011, decimals: 4 },
	];

	// ── Helpers ───────────────────────────────────────────────────────────────────
	const rand = (min, max) => Math.random() * (max - min) + min;
	const randInt = (min, max) => Math.floor(rand(min, max));
	const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
	const fmtPrice = (n, dec) => n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

	// ── Candle generation ─────────────────────────────────────────────────────────
	function makeCandles(basePrice, count = 60) {
		const candles = [];
		let price = basePrice * (1 - rand(0.04, 0.08));
		for (let i = 0; i < count; i++) {
			const move = price * rand(-0.012, 0.014);
			const open = price;
			const close = price + move;
			const high = Math.max(open, close) * (1 + rand(0, 0.006));
			const low = Math.min(open, close) * (1 - rand(0, 0.006));
			const vol = rand(500_000, 8_000_000);
			candles.push({ open, close, high, low, vol });
			price = close;
		}
		return candles;
	}

	// ── Orderbook generation ──────────────────────────────────────────────────────
	function makeBook(midPrice, levels = 14) {
		const asks = [];
		const bids = [];
		let ap = midPrice * 1.0002;
		let bp = midPrice * 0.9998;
		for (let i = 0; i < levels; i++) {
			asks.push({ price: ap, size: rand(1, 120) });
			bids.push({ price: bp, size: rand(1, 120) });
			ap *= 1 + rand(0.0001, 0.0004);
			bp *= 1 - rand(0.0001, 0.0004);
		}
		return { asks: asks.reverse(), bids };
	}

	// ── State ─────────────────────────────────────────────────────────────────────
	let selectedMarketId = $state('SOL-PERP');
	let markets = $state(MARKETS.map(m => ({ ...m })));

	let market = $derived(markets.find(m => m.id === selectedMarketId));

	let candles = $state([]);
	let book = $state({ asks: [], bids: [] });
	let priceFlash = $state(''); // 'up' | 'down' | ''

	// Order form
	let side = $state('long');        // 'long' | 'short'
	let orderType = $state('market'); // 'market' | 'limit'
	let leverage = $state(10);
	let sizeUSD = $state('1000');
	let limitPrice = $state('');
	let showTpSl = $state(false);
	let tpPrice = $state('');
	let slPrice = $state('');
	let balance = $state(10000);

	// Bottom panel
	let bottomTab = $state('positions');
	let positions = $state([
		{ id: 1, market: 'SOL-PERP',  side: 'long',  size: 10,  entry: 181.20, liq: 162.80, mark: 185.42, decimals: 2 },
		{ id: 2, market: 'BTC-PERP',  side: 'short', size: 0.1, entry: 95400,  liq: 99200,  mark: 94820,  decimals: 1 },
	]);
	let openOrders = $state([
		{ id: 1, market: 'SOL-PERP', type: 'Limit', side: 'long',  size: 5,   price: 178.00, filled: 0,   time: '14:22:01' },
		{ id: 2, market: 'ETH-PERP', type: 'Limit', side: 'short', size: 0.5, price: 3320.00, filled: 0,  time: '14:18:44' },
		{ id: 3, market: 'JTO-PERP', type: 'Limit', side: 'long',  size: 100, price: 3.71,   filled: 40,  time: '14:05:12' },
	]);
	let tradeHistory = $state([]);
	let toast = $state('');
	let fundingCountdown = $state(0);
	let chartTf = $state('1H');

	// Hover for chart tooltip
	let hoveredCandle = $state(null);
	let hoveredX = $state(0);

	// ── Derived order info ────────────────────────────────────────────────────────
	let sizeContracts = $derived(() => {
		const usd = parseFloat(sizeUSD) || 0;
		const px = market ? market.price : 1;
		return (usd / px).toFixed(4);
	});

	let notional = $derived(() => parseFloat(sizeUSD) || 0);

	let fees = $derived(() => ((parseFloat(sizeUSD) || 0) * 0.0005).toFixed(4));

	let liqPrice = $derived(() => {
		if (!market) return 0;
		const px = market.price;
		const lev = leverage;
		if (side === 'long') return (px * (1 - 1 / lev + 0.005)).toFixed(market.decimals);
		return (px * (1 + 1 / lev - 0.005)).toFixed(market.decimals);
	});

	// ── Chart SVG helpers ─────────────────────────────────────────────────────────
	const CHART_W = 700;
	const CHART_H = 300;
	const VOL_H = 50;
	const PAD_L = 8;
	const PAD_R = 52;
	const PAD_T = 8;
	const PAD_B = 24;

	let chartPrices = $derived(() => candles.map(c => [c.high, c.low]).flat());
	let chartMin = $derived(() => Math.min(...(chartPrices() || [0])) * 0.999);
	let chartMax = $derived(() => Math.max(...(chartPrices() || [1])) * 1.001);
	let chartVolMax = $derived(() => Math.max(...(candles.map(c => c.vol) || [1])));

	function py(price) {
		const min = chartMin();
		const max = chartMax();
		const range = max - min || 1;
		return PAD_T + ((max - price) / range) * (CHART_H - PAD_T - PAD_B);
	}

	function volH(vol) {
		return (vol / (chartVolMax() || 1)) * VOL_H;
	}

	const candleW = $derived(() => {
		const usable = CHART_W - PAD_L - PAD_R;
		return Math.max(2, usable / (candles.length || 1) - 1);
	});

	function candleX(i) {
		const usable = CHART_W - PAD_L - PAD_R;
		const step = usable / (candles.length || 1);
		return PAD_L + i * step + step / 2;
	}

	// ── Init chart + book on market change ────────────────────────────────────────
	$effect(() => {
		if (market) {
			candles = makeCandles(market.price);
			book = makeBook(market.price);
			limitPrice = market.price.toFixed(market.decimals);
		}
	});

	// ── Lifecycle ─────────────────────────────────────────────────────────────────
	onMount(() => {
		// Seed trade history
		const names = ['NOVA', 'PULSE', 'ECHO', 'SURGE', 'DRIFT', 'anon'];
		for (let i = 0; i < 20; i++) {
			const m = MARKETS[randInt(0, MARKETS.length)];
			tradeHistory.push({
				id: i,
				market: m.id,
				side: Math.random() > 0.5 ? 'long' : 'short',
				size: rand(0.1, 50).toFixed(2),
				price: fmtPrice(m.price * (1 + rand(-0.002, 0.002)), m.decimals),
				time: `${randInt(10,23)}:${randInt(10,59)}:${randInt(10,59)}`,
				trader: names[randInt(0, names.length)],
			});
		}

		// Funding countdown (seconds until next 8h mark)
		const now = Date.now();
		const nextFunding = Math.ceil(now / (8 * 3600_000)) * (8 * 3600_000);
		fundingCountdown = Math.floor((nextFunding - now) / 1000);

		// Fast tick — orderbook
		const fastId = setInterval(() => {
			if (!market) return;
			book = makeBook(market.price);
		}, 600);

		// Slow tick — price, chart, positions
		let tick = 0;
		const slowId = setInterval(() => {
			tick++;
			fundingCountdown = Math.max(0, fundingCountdown - 1);

			// Jitter market prices
			const prev = markets.find(m => m.id === selectedMarketId)?.price ?? 0;
			markets = markets.map(m => {
				const drift = m.price * rand(-0.0008, 0.001);
				return { ...m, price: +(m.price + drift).toFixed(m.decimals) };
			});
			const curr = markets.find(m => m.id === selectedMarketId)?.price ?? 0;
			priceFlash = curr > prev ? 'up' : curr < prev ? 'down' : '';
			setTimeout(() => (priceFlash = ''), 400);

			// Update last candle close
			if (candles.length > 0) {
				const last = candles[candles.length - 1];
				const newClose = last.close * (1 + rand(-0.001, 0.0012));
				candles = [
					...candles.slice(0, -1),
					{ ...last, close: newClose, high: Math.max(last.high, newClose), low: Math.min(last.low, newClose) },
				];
			}

			// Update position marks
			positions = positions.map(p => {
				const m = markets.find(x => x.id === p.market);
				return m ? { ...p, mark: m.price } : p;
			});

			// New trade history entry every 3 ticks
			if (tick % 3 === 0) {
				const m = markets[randInt(0, markets.length)];
				const names = ['NOVA', 'PULSE', 'ECHO', 'anon'];
				tradeHistory = [{
					id: Date.now(),
					market: m.id,
					side: Math.random() > 0.5 ? 'long' : 'short',
					size: rand(0.1, 30).toFixed(2),
					price: fmtPrice(m.price, m.decimals),
					time: new Date().toTimeString().slice(0, 8),
					trader: names[randInt(0, names.length)],
				}, ...tradeHistory.slice(0, 29)];
			}
		}, 1000);

		return () => { clearInterval(fastId); clearInterval(slowId); };
	});

	// ── Actions ───────────────────────────────────────────────────────────────────
	function placeOrder() {
		if (!sizeUSD || parseFloat(sizeUSD) <= 0) return;
		const m = market;
		const newPos = {
			id: Date.now(),
			market: m.id,
			side,
			size: parseFloat(sizeContracts()),
			entry: m.price,
			liq: parseFloat(liqPrice()),
			mark: m.price,
			decimals: m.decimals,
		};
		positions = [...positions, newPos];
		balance -= parseFloat(sizeUSD) / leverage;
		showToast(`✅ ${side === 'long' ? 'Long' : 'Short'} ${m.id} opened`);
		bottomTab = 'positions';
	}

	function closePosition(id) {
		positions = positions.filter(p => p.id !== id);
		showToast('✅ Position closed');
	}

	function cancelOrder(id) {
		openOrders = openOrders.filter(o => o.id !== id);
		showToast('❌ Order cancelled');
	}

	function showToast(msg) {
		toast = msg;
		setTimeout(() => (toast = ''), 2500);
	}

	function fmtCountdown(s) {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
	}

	function pnl(pos) {
		const diff = pos.side === 'long' ? pos.mark - pos.entry : pos.entry - pos.mark;
		return diff * pos.size;
	}

	function pnlPct(pos) {
		const diff = pos.side === 'long' ? pos.mark - pos.entry : pos.entry - pos.mark;
		return (diff / pos.entry) * 100 * leverage;
	}

	// Depth bar max for orderbook
	function depthMax(rows) {
		return Math.max(...rows.map(r => r.size), 1);
	}

	const TFS = ['1m', '5m', '15m', '1H', '4H', '1D'];
</script>

<!-- ── Root ──────────────────────────────────────────────────────────────────── -->
<div class="flex min-h-screen flex-col bg-[#0d0e14] font-mono text-white select-none">

	<!-- ── Market Header ─────────────────────────────────────────────────────── -->
	<div class="border-b border-white/5 bg-[#13141b]">
		<!-- Market selector row -->
		<div class="flex items-center gap-0 overflow-x-auto">
			{#each markets as m}
				<button
					onclick={() => { selectedMarketId = m.id; }}
					class="flex shrink-0 flex-col items-start border-b-2 px-4 py-2.5 transition-all
						{selectedMarketId === m.id
							? 'border-blue-400 bg-white/5'
							: 'border-transparent hover:bg-white/3 hover:border-white/10'}"
				>
					<span class="text-xs font-bold {selectedMarketId === m.id ? 'text-white' : 'text-slate-400'}">{m.id}</span>
					<div class="flex items-baseline gap-1.5 mt-0.5">
						<span class="text-sm font-extrabold {priceFlash === 'up' && selectedMarketId === m.id ? 'text-green-400' : priceFlash === 'down' && selectedMarketId === m.id ? 'text-red-400' : 'text-white'} transition-colors duration-300">
							{fmtPrice(m.price, m.decimals)}
						</span>
						<span class="text-[10px] {m.change >= 0 ? 'text-green-400' : 'text-red-400'}">
							{m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
						</span>
					</div>
				</button>
			{/each}
		</div>

		<!-- Stats row -->
		{#if market}
			<div class="flex flex-wrap items-center gap-6 border-t border-white/5 px-4 py-2 text-[11px]">
				<div>
					<span class="text-slate-500">Mark </span>
					<span class="text-white">{fmtPrice(market.price * 1.00005, market.decimals)}</span>
				</div>
				<div>
					<span class="text-slate-500">Index </span>
					<span class="text-white">{fmtPrice(market.price * 0.9999, market.decimals)}</span>
				</div>
				<div>
					<span class="text-slate-500">24h Vol </span>
					<span class="text-white">${market.vol}</span>
				</div>
				<div>
					<span class="text-slate-500">Open Interest </span>
					<span class="text-white">${market.oi}</span>
				</div>
				<div>
					<span class="text-slate-500">Funding </span>
					<span class="{market.funding >= 0 ? 'text-green-400' : 'text-red-400'}">
						{market.funding >= 0 ? '+' : ''}{(market.funding).toFixed(4)}%
					</span>
				</div>
				<div>
					<span class="text-slate-500">Next Funding </span>
					<span class="text-blue-300">{fmtCountdown(fundingCountdown)}</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- ── Main 3-column area ─────────────────────────────────────────────────── -->
	<div class="flex min-h-0 flex-1 flex-col lg:flex-row">

		<!-- LEFT: Order Panel -->
		<div class="w-full shrink-0 border-b border-white/5 bg-[#13141b] lg:w-72 lg:border-b-0 lg:border-r">
			<div class="p-4">
				<!-- Long / Short toggle -->
				<div class="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-black/30 p-1">
					<button
						onclick={() => (side = 'long')}
						class="rounded-md py-2 text-xs font-extrabold tracking-wide transition-all
							{side === 'long' ? 'bg-green-500 text-white shadow-md shadow-green-500/30' : 'text-slate-400 hover:text-slate-200'}"
					>▲ LONG</button>
					<button
						onclick={() => (side = 'short')}
						class="rounded-md py-2 text-xs font-extrabold tracking-wide transition-all
							{side === 'short' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'text-slate-400 hover:text-slate-200'}"
					>▼ SHORT</button>
				</div>

				<!-- Market / Limit tabs -->
				<div class="mb-4 flex gap-3 border-b border-white/5 pb-2">
					{#each ['market', 'limit'] as ot}
						<button
							onclick={() => (orderType = ot)}
							class="pb-1 text-xs font-semibold capitalize transition-all
								{orderType === ot ? 'border-b-2 border-blue-400 text-white' : 'text-slate-500 hover:text-slate-300'}"
						>{ot}</button>
					{/each}
				</div>

				<!-- Balance -->
				<div class="mb-3 flex justify-between text-[11px]">
					<span class="text-slate-500">Available</span>
					<span class="text-white">{fmt(balance)} USDC</span>
				</div>

				<!-- Limit price (only for limit orders) -->
				{#if orderType === 'limit'}
					<div class="mb-3">
						<label class="mb-1 block text-[10px] text-slate-500 uppercase tracking-wider">Limit Price</label>
						<input
							bind:value={limitPrice}
							type="number"
							class="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
						/>
					</div>
				{/if}

				<!-- Size -->
				<div class="mb-1">
					<label class="mb-1 block text-[10px] text-slate-500 uppercase tracking-wider">Size (USD)</label>
					<input
						bind:value={sizeUSD}
						type="number"
						class="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
					/>
				</div>
				<div class="mb-4 grid grid-cols-4 gap-1">
					{#each [25, 50, 75, 100] as pct}
						<button
							onclick={() => (sizeUSD = String(Math.floor(balance * leverage * pct / 100)))}
							class="rounded border border-white/10 bg-white/5 py-1 text-[10px] text-slate-400 hover:border-blue-400/40 hover:text-white transition-colors"
						>{pct}%</button>
					{/each}
				</div>

				<!-- Leverage -->
				<div class="mb-4">
					<div class="mb-1 flex justify-between">
						<label class="text-[10px] text-slate-500 uppercase tracking-wider">Leverage</label>
						<span class="text-xs font-bold text-blue-400">{leverage}×</span>
					</div>
					<input
						bind:value={leverage}
						type="range" min="1" max="100" step="1"
						class="w-full accent-blue-400 cursor-pointer"
					/>
					<div class="mt-1 flex justify-between text-[9px] text-slate-600">
						<span>1×</span><span>25×</span><span>50×</span><span>75×</span><span>100×</span>
					</div>
				</div>

				<!-- TP/SL toggle -->
				<div class="mb-3">
					<button
						onclick={() => (showTpSl = !showTpSl)}
						class="flex w-full items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-[11px] text-slate-400 hover:border-white/20 transition-colors"
					>
						<span>TP / SL</span>
						<span class="text-blue-400">{showTpSl ? '▲' : '▼'}</span>
					</button>
					{#if showTpSl}
						<div class="mt-2 grid grid-cols-2 gap-2">
							<div>
								<label class="mb-1 block text-[9px] text-green-400 uppercase">Take Profit</label>
								<input bind:value={tpPrice} type="number" placeholder="Price"
									class="w-full rounded-lg border border-green-400/20 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-green-400/50" />
							</div>
							<div>
								<label class="mb-1 block text-[9px] text-red-400 uppercase">Stop Loss</label>
								<input bind:value={slPrice} type="number" placeholder="Price"
									class="w-full rounded-lg border border-red-400/20 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-red-400/50" />
							</div>
						</div>
					{/if}
				</div>

				<!-- Order summary -->
				<div class="mb-4 space-y-1.5 rounded-lg border border-white/5 bg-black/20 p-3 text-[11px]">
					{#each [
						{ label: 'Size', value: `${sizeContracts()} ${market?.base ?? ''}` },
						{ label: 'Notional', value: `$${fmt(notional())}` },
						{ label: 'Fees', value: `$${fees()}` },
						{ label: 'Liq. Price', value: fmtPrice(parseFloat(liqPrice()) || 0, market?.decimals ?? 2) },
					] as row}
						<div class="flex justify-between">
							<span class="text-slate-500">{row.label}</span>
							<span class="text-white">{row.value}</span>
						</div>
					{/each}
				</div>

				<!-- Place Order button -->
				<button
					onclick={placeOrder}
					disabled={!sizeUSD || parseFloat(sizeUSD) <= 0}
					class="w-full rounded-xl py-3 text-sm font-extrabold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95
						{side === 'long'
							? 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-400'
							: 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-400'}"
				>
					{side === 'long' ? '▲ Place Long' : '▼ Place Short'}
				</button>
			</div>
		</div>

		<!-- CENTER: Chart -->
		<div class="flex min-w-0 flex-1 flex-col border-b border-white/5 lg:border-b-0 lg:border-r">
			<!-- Timeframe tabs -->
			<div class="flex items-center gap-0 border-b border-white/5 px-3">
				{#each TFS as tf}
					<button
						onclick={() => (chartTf = tf)}
						class="px-3 py-2.5 text-xs font-semibold transition-colors
							{chartTf === tf ? 'text-white border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}"
					>{tf}</button>
				{/each}
				<span class="ml-auto text-[10px] text-slate-600">Simulated · not real data</span>
			</div>

			<!-- SVG candlestick chart -->
			<div class="relative flex-1 min-h-[300px]"
				onmouseleave={() => (hoveredCandle = null)}
			>
				{#if candles.length > 0}
					<svg
						class="h-full w-full"
						viewBox="0 0 {CHART_W} {CHART_H + VOL_H}"
						preserveAspectRatio="none"
						onmousemove={(e) => {
							const rect = e.currentTarget.getBoundingClientRect();
							const xRatio = (e.clientX - rect.left) / rect.width;
							const idx = Math.min(candles.length - 1, Math.max(0, Math.floor(xRatio * candles.length)));
							hoveredCandle = { ...candles[idx], idx };
							hoveredX = xRatio * 100;
						}}
					>
						<!-- Grid lines -->
						{#each [0.2, 0.4, 0.6, 0.8] as ratio}
							<line
								x1={PAD_L} y1={PAD_T + ratio * (CHART_H - PAD_T - PAD_B)}
								x2={CHART_W - PAD_R} y2={PAD_T + ratio * (CHART_H - PAD_T - PAD_B)}
								stroke="rgba(255,255,255,0.04)" stroke-width="1"
							/>
						{/each}

						<!-- Y-axis price labels -->
						{#each [0, 0.25, 0.5, 0.75, 1] as ratio}
							{@const price = chartMax() - ratio * (chartMax() - chartMin())}
							<text
								x={CHART_W - PAD_R + 4}
								y={PAD_T + ratio * (CHART_H - PAD_T - PAD_B) + 4}
								fill="rgba(148,163,184,0.7)"
								font-size="9"
								font-family="monospace"
							>{fmtPrice(price, market?.decimals ?? 2)}</text>
						{/each}

						<!-- Current price line -->
						{#if market}
							{@const currentPy = py(market.price)}
							<line
								x1={PAD_L} y1={currentPy}
								x2={CHART_W - PAD_R} y2={currentPy}
								stroke="rgba(96,165,250,0.5)" stroke-width="0.8" stroke-dasharray="3,3"
							/>
							<rect x={CHART_W - PAD_R} y={currentPy - 7} width={PAD_R - 2} height={14}
								fill="#1d4ed8" rx="2"
							/>
							<text x={CHART_W - PAD_R + 3} y={currentPy + 4} fill="white" font-size="8" font-family="monospace">
								{fmtPrice(market.price, market.decimals)}
							</text>
						{/if}

						<!-- Candles -->
						{#each candles as c, i}
							{@const bull = c.close >= c.open}
							{@const col = bull ? '#22c55e' : '#ef4444'}
							{@const x = candleX(i)}
							{@const cw = candleW()}
							{@const bodyTop = py(Math.max(c.open, c.close))}
							{@const bodyBot = py(Math.min(c.open, c.close))}
							{@const bodyH = Math.max(1, bodyBot - bodyTop)}
							<!-- Wick -->
							<line x1={x} y1={py(c.high)} x2={x} y2={py(c.low)} stroke={col} stroke-width="1" />
							<!-- Body -->
							<rect x={x - cw / 2} y={bodyTop} width={cw} height={bodyH} fill={col} opacity="0.9" />
						{/each}

						<!-- Volume bars -->
						{#each candles as c, i}
							{@const bull = c.close >= c.open}
							{@const col = bull ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}
							{@const x = candleX(i)}
							{@const cw = candleW()}
							{@const vh = volH(c.vol)}
							<rect
								x={x - cw / 2} y={CHART_H + VOL_H - vh}
								width={cw} height={vh}
								fill={col}
							/>
						{/each}

						<!-- Hover crosshair -->
						{#if hoveredCandle}
							<line
								x1={candleX(hoveredCandle.idx)} y1={PAD_T}
								x2={candleX(hoveredCandle.idx)} y2={CHART_H}
								stroke="rgba(255,255,255,0.15)" stroke-width="1"
							/>
						{/if}
					</svg>

					<!-- Hover tooltip -->
					{#if hoveredCandle}
						<div
							class="pointer-events-none absolute top-2 left-3 rounded-lg border border-white/10 bg-[#13141b]/95 px-3 py-2 text-[10px] space-y-0.5"
						>
							{#each [
								{ l: 'O', v: fmtPrice(hoveredCandle.open, market?.decimals ?? 2), c: hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400' },
								{ l: 'H', v: fmtPrice(hoveredCandle.high, market?.decimals ?? 2), c: 'text-green-400' },
								{ l: 'L', v: fmtPrice(hoveredCandle.low, market?.decimals ?? 2), c: 'text-red-400' },
								{ l: 'C', v: fmtPrice(hoveredCandle.close, market?.decimals ?? 2), c: hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400' },
							] as row}
								<div class="flex gap-2">
									<span class="text-slate-500 w-3">{row.l}</span>
									<span class="{row.c} font-bold">{row.v}</span>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- RIGHT: Orderbook -->
		<div class="w-full shrink-0 bg-[#13141b] lg:w-52 xl:w-56">
			<div class="border-b border-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
				Orderbook
			</div>

			<!-- Column headers -->
			<div class="grid grid-cols-3 gap-1 px-3 py-1 text-[9px] text-slate-600">
				<span>Price</span><span class="text-right">Size</span><span class="text-right">Total</span>
			</div>

			<!-- Asks (red, reversed — highest at top) -->
			<div class="px-2">
				{#each book.asks as ask}
					{@const pct = (ask.size / depthMax(book.asks)) * 100}
					<div class="relative mb-px grid grid-cols-3 gap-1 rounded-sm px-1 py-[3px] text-[11px]">
						<div class="pointer-events-none absolute inset-0 rounded-sm bg-red-500/10" style="width: {pct}%; margin-left: auto"></div>
						<span class="relative text-red-400">{fmtPrice(ask.price, market?.decimals ?? 2)}</span>
						<span class="relative text-right text-slate-300">{ask.size.toFixed(1)}</span>
						<span class="relative text-right text-slate-500">{(ask.size * ask.price).toFixed(0)}</span>
					</div>
				{/each}
			</div>

			<!-- Spread -->
			{#if book.asks.length && book.bids.length}
				{@const spread = book.asks[0].price - book.bids[0].price}
				{@const spreadPct = (spread / book.bids[0].price * 100).toFixed(3)}
				<div class="my-1 flex items-center justify-between border-y border-white/5 px-3 py-1.5 text-[10px]">
					<span class="font-bold text-white">{fmtPrice(book.asks[0].price - spread / 2, market?.decimals ?? 2)}</span>
					<span class="text-slate-500">Spread {spreadPct}%</span>
				</div>
			{/if}

			<!-- Bids (green) -->
			<div class="px-2">
				{#each book.bids as bid}
					{@const pct = (bid.size / depthMax(book.bids)) * 100}
					<div class="relative mb-px grid grid-cols-3 gap-1 rounded-sm px-1 py-[3px] text-[11px]">
						<div class="pointer-events-none absolute inset-0 rounded-sm bg-green-500/10" style="width: {pct}%"></div>
						<span class="relative text-green-400">{fmtPrice(bid.price, market?.decimals ?? 2)}</span>
						<span class="relative text-right text-slate-300">{bid.size.toFixed(1)}</span>
						<span class="relative text-right text-slate-500">{(bid.size * bid.price).toFixed(0)}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- ── Bottom Panel ───────────────────────────────────────────────────────── -->
	<div class="border-t border-white/5 bg-[#13141b]">
		<!-- Tabs -->
		<div class="flex items-center gap-0 border-b border-white/5 px-4">
			{#each [
				{ key: 'positions',    label: `Positions (${positions.length})` },
				{ key: 'orders',       label: `Open Orders (${openOrders.length})` },
				{ key: 'history',      label: 'Trade History' },
			] as tab}
				<button
					onclick={() => (bottomTab = tab.key)}
					class="mr-4 pb-2 pt-2.5 text-xs font-semibold transition-colors
						{bottomTab === tab.key ? 'border-b-2 border-blue-400 text-white' : 'text-slate-500 hover:text-slate-300'}"
				>{tab.label}</button>
			{/each}
		</div>

		<!-- Positions -->
		{#if bottomTab === 'positions'}
			<div class="overflow-x-auto">
				{#if positions.length === 0}
					<p class="py-6 text-center text-xs text-slate-600">No open positions</p>
				{:else}
					<table class="w-full text-[11px]">
						<thead>
							<tr class="border-b border-white/5 text-left text-[9px] text-slate-600 uppercase tracking-wider">
								{#each ['Market', 'Side', 'Size', 'Entry', 'Mark', 'Liq.', 'PnL', 'PnL %', ''] as h}
									<th class="px-4 py-2 font-medium">{h}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each positions as pos (pos.id)}
								{@const p = pnl(pos)}
								{@const pp = pnlPct(pos)}
								<tr class="border-b border-white/[0.03] hover:bg-white/[0.02]">
									<td class="px-4 py-2.5 font-bold text-white">{pos.market}</td>
									<td class="px-4 py-2.5">
										<span class="rounded px-2 py-0.5 text-[10px] font-extrabold
											{pos.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
											{pos.side.toUpperCase()}
										</span>
									</td>
									<td class="px-4 py-2.5 text-slate-200">{pos.size}</td>
									<td class="px-4 py-2.5 text-slate-300">{fmtPrice(pos.entry, pos.decimals)}</td>
									<td class="px-4 py-2.5 text-white">{fmtPrice(pos.mark, pos.decimals)}</td>
									<td class="px-4 py-2.5 text-red-400">{fmtPrice(pos.liq, pos.decimals)}</td>
									<td class="px-4 py-2.5 font-bold {p >= 0 ? 'text-green-400' : 'text-red-400'}">
										{p >= 0 ? '+' : ''}{fmt(p, 2)}
									</td>
									<td class="px-4 py-2.5 font-bold {pp >= 0 ? 'text-green-400' : 'text-red-400'}">
										{pp >= 0 ? '+' : ''}{pp.toFixed(2)}%
									</td>
									<td class="px-4 py-2.5">
										<button
											onclick={() => closePosition(pos.id)}
											class="rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 hover:border-red-400/50 hover:text-red-400 transition-colors"
										>Close</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

		<!-- Open Orders -->
		{:else if bottomTab === 'orders'}
			<div class="overflow-x-auto">
				{#if openOrders.length === 0}
					<p class="py-6 text-center text-xs text-slate-600">No open orders</p>
				{:else}
					<table class="w-full text-[11px]">
						<thead>
							<tr class="border-b border-white/5 text-left text-[9px] text-slate-600 uppercase tracking-wider">
								{#each ['Market', 'Type', 'Side', 'Size', 'Price', 'Filled', 'Time', ''] as h}
									<th class="px-4 py-2 font-medium">{h}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each openOrders as o (o.id)}
								<tr class="border-b border-white/[0.03] hover:bg-white/[0.02]">
									<td class="px-4 py-2.5 font-bold text-white">{o.market}</td>
									<td class="px-4 py-2.5 text-slate-400">{o.type}</td>
									<td class="px-4 py-2.5">
										<span class="rounded px-2 py-0.5 text-[10px] font-extrabold
											{o.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
											{o.side.toUpperCase()}
										</span>
									</td>
									<td class="px-4 py-2.5 text-slate-200">{o.size}</td>
									<td class="px-4 py-2.5 text-white">{o.price}</td>
									<td class="px-4 py-2.5 text-slate-400">{o.filled}%</td>
									<td class="px-4 py-2.5 text-slate-500">{o.time}</td>
									<td class="px-4 py-2.5">
										<button
											onclick={() => cancelOrder(o.id)}
											class="rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 hover:border-red-400/50 hover:text-red-400 transition-colors"
										>Cancel</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

		<!-- Trade History -->
		{:else if bottomTab === 'history'}
			<div class="max-h-40 overflow-y-auto">
				<table class="w-full text-[11px]">
					<thead class="sticky top-0 bg-[#13141b]">
						<tr class="border-b border-white/5 text-left text-[9px] text-slate-600 uppercase tracking-wider">
							{#each ['Market', 'Side', 'Size', 'Price', 'Time', 'Trader'] as h}
								<th class="px-4 py-2 font-medium">{h}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each tradeHistory as t (t.id)}
							<tr class="border-b border-white/[0.03] hover:bg-white/[0.02]">
								<td class="px-4 py-2 font-bold text-white">{t.market}</td>
								<td class="px-4 py-2">
									<span class="{t.side === 'long' ? 'text-green-400' : 'text-red-400'} font-semibold">
										{t.side === 'long' ? '▲' : '▼'} {t.side}
									</span>
								</td>
								<td class="px-4 py-2 text-slate-300">{t.size}</td>
								<td class="px-4 py-2 text-white">{t.price}</td>
								<td class="px-4 py-2 text-slate-500">{t.time}</td>
								<td class="px-4 py-2 text-slate-400">{t.trader}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- ── Toast ──────────────────────────────────────────────────────────────────── -->
{#if toast}
	<div class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-white/10 bg-[#1a1b25] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
		{toast}
	</div>
{/if}
