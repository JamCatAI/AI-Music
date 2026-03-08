<svelte:head>
	<title>Perps | JamCat DEX</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	// ── Markets ──────────────────────────────────────────────────────────────────
	const MARKETS = [
		{ id: 'WIF-PERP',     base: 'WIF',     price: 2.1840,  change:  7.34,  vol: '312M',  oi: '84M',   funding:  0.0214, decimals: 4 },
		{ id: 'BONK-PERP',    base: 'BONK',    price: 0.00002847, change: -4.12, vol: '198M', oi: '51M',  funding: -0.0088, decimals: 8 },
		{ id: 'POPCAT-PERP',  base: 'POPCAT',  price: 0.6213,  change: 12.77,  vol: '87M',   oi: '23M',   funding:  0.0341, decimals: 4 },
		{ id: 'MYRO-PERP',    base: 'MYRO',    price: 0.0724,  change: -8.55,  vol: '43M',   oi: '11M',   funding: -0.0156, decimals: 4 },
		{ id: 'MOODENG-PERP', base: 'MOODENG', price: 0.1492,  change:  3.21,  vol: '61M',   oi: '17M',   funding:  0.0097, decimals: 4 },
		{ id: 'PNUT-PERP',    base: 'PNUT',    price: 0.3381,  change: -1.88,  vol: '55M',   oi: '14M',   funding: -0.0043, decimals: 4 },
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
	let selectedMarketId = $state('WIF-PERP');
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
		{ id: 1, market: 'WIF-PERP',    side: 'long',  size: 500,   entry: 2.0340, liq: 1.8200, mark: 2.1840, decimals: 4 },
		{ id: 2, market: 'POPCAT-PERP', side: 'short', size: 200,   entry: 0.6890, liq: 0.7580, mark: 0.6213, decimals: 4 },
	]);
	let openOrders = $state([
		{ id: 1, market: 'WIF-PERP',     type: 'Limit', side: 'long',  size: 1000, price: 1.9500,     filled: 0,  time: '14:22:01' },
		{ id: 2, market: 'BONK-PERP',    type: 'Limit', side: 'short', size: 5000000, price: 0.00002610, filled: 0, time: '14:18:44' },
		{ id: 3, market: 'MOODENG-PERP', type: 'Limit', side: 'long',  size: 800,  price: 0.1340,     filled: 35, time: '14:05:12' },
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
		// Fetch real market data
		(async () => {
			try {
				const cgIds = 'dogwifcoin,bonk,popcat,myro,moo-deng,peanut-the-squirrel';
				const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;
				const res = await fetch(url);
				if (!res.ok) throw new Error('API down');
				const data = await res.json();
				
				const idMap = {
					'dogwifcoin': 'WIF-PERP',
					'bonk': 'BONK-PERP',
					'popcat': 'POPCAT-PERP',
					'myro': 'MYRO-PERP',
					'moo-deng': 'MOODENG-PERP',
					'peanut-the-squirrel': 'PNUT-PERP'
				};

				markets = markets.map(m => {
					const cgId = Object.keys(idMap).find(k => idMap[k] === m.id);
					if (cgId && data[cgId]) {
						const price = data[cgId].usd;
						const change = data[cgId].usd_24h_change ?? m.change;
						let vol = m.vol;
						if (data[cgId].usd_24h_vol) {
							const v = data[cgId].usd_24h_vol;
							vol = v > 1e6 ? (v / 1e6).toFixed(1) + 'M' : (v / 1e3).toFixed(1) + 'K';
						}
						return { ...m, price, change, vol };
					}
					return m;
				});
			} catch (e) {
				console.warn('Real data fetch failed. Falling back to dummy data.', e);
			}
		})();

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
<div class="relative flex min-h-screen flex-col bg-[#0d0e14] font-mono text-white select-none overflow-hidden">
	
	<!-- Ambient Background Glow -->
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none z-0"></div>

	<!-- ── Market Header ─────────────────────────────────────────────────────── -->
	<div class="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl shadow-md">
		<!-- Market selector row -->
		<div class="flex items-center gap-0 overflow-x-auto">
			{#each markets as m}
				<button
					onclick={() => { selectedMarketId = m.id; }}
					class="relative flex shrink-0 flex-col items-start px-5 py-3 transition-all duration-300
						{selectedMarketId === m.id
							? 'bg-gradient-to-t from-blue-500/10 to-transparent'
							: 'hover:bg-white/5'}"
				>
					{#if selectedMarketId === m.id}
						<!-- Active glowing top border -->
						<div class="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
					{/if}
					<span class="text-xs font-black tracking-wider uppercase {selectedMarketId === m.id ? 'text-white drop-shadow-sm' : 'text-slate-500'}">{m.id}</span>
					<div class="flex items-baseline gap-2 mt-1">
						<span class="text-[15px] font-extrabold {priceFlash === 'up' && selectedMarketId === m.id ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' : priceFlash === 'down' && selectedMarketId === m.id ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' : 'text-slate-200'} transition-all duration-300">
							{fmtPrice(m.price, m.decimals)}
						</span>
						<span class="text-[10px] font-bold {m.change >= 0 ? 'text-green-400' : 'text-red-400'}">
							{m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
						</span>
					</div>
				</button>
			{/each}
		</div>

		<!-- Stats row -->
		{#if market}
			<div class="flex flex-wrap items-center gap-6 border-t border-white/10 bg-black/20 px-5 py-2.5 text-[11px] backdrop-blur-sm">
				<div class="flex items-center gap-1.5">
					<span class="text-slate-400 font-medium">Mark</span>
					<span class="text-white font-bold tracking-wide">{fmtPrice(market.price * 1.00005, market.decimals)}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="text-slate-400 font-medium">Index</span>
					<span class="text-slate-200 font-bold">{fmtPrice(market.price * 0.9999, market.decimals)}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="text-slate-400 font-medium">24h Vol</span>
					<span class="text-slate-200 font-bold">${market.vol}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="text-slate-400 font-medium">Open Interest</span>
					<span class="text-slate-200 font-bold">${market.oi}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="text-slate-400 font-medium">Funding</span>
					<span class="font-extrabold {market.funding >= 0 ? 'text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.3)]' : 'text-red-400 drop-shadow-[0_0_3px_rgba(248,113,113,0.3)]'}">
						{market.funding >= 0 ? '+' : ''}{(market.funding).toFixed(4)}%
					</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="text-slate-400 font-medium">Next Funding</span>
					<span class="font-bold text-blue-400">{fmtCountdown(fundingCountdown)}</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- ── Main 3-column area ─────────────────────────────────────────────────── -->
	<div class="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">

		<!-- LEFT: Order Panel -->
		<div class="w-full shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-lg lg:w-[320px] lg:border-b-0 lg:border-r">
			<div class="p-4">
				<!-- Long / Short toggle -->
				<div class="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-black/40 p-1.5 shadow-inner">
					<button
						onclick={() => (side = 'long')}
						class="rounded-lg py-2.5 text-xs font-black tracking-wider transition-all duration-300
							{side === 'long' 
								? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-[0_0_20px_rgba(74,222,128,0.4)] scale-[1.02]' 
								: 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}"
					>▲ LONG</button>
					<button
						onclick={() => (side = 'short')}
						class="rounded-lg py-2.5 text-xs font-black tracking-wider transition-all duration-300
							{side === 'short' 
								? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-[0_0_20px_rgba(248,113,113,0.4)] scale-[1.02]' 
								: 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}"
					>▼ SHORT</button>
				</div>

				<!-- Market / Limit tabs -->
				<div class="mb-5 flex gap-1 border-b border-white/10 pb-2">
					{#each ['market', 'limit'] as ot}
						<button
							onclick={() => (orderType = ot)}
							class="px-3 py-1.5 rounded text-xs font-bold capitalize transition-all duration-300
								{orderType === ot 
									? 'bg-blue-500/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
									: 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}"
						>{ot}</button>
					{/each}
				</div>

				<!-- Balance -->
				<div class="mb-4 flex justify-between text-[11px] items-center">
					<span class="text-slate-500 font-medium">Available</span>
					<span class="text-white font-bold tracking-wide">{fmt(balance)} USDC</span>
				</div>

				<!-- Limit price (only for limit orders) -->
				{#if orderType === 'limit'}
					<div class="mb-4 group">
						<label for="limitPrice" class="mb-1.5 block text-[10px] text-slate-400 font-bold uppercase tracking-wider group-focus-within:text-blue-400 transition-colors">Limit Price</label>
						<input
							id="limitPrice"
							bind:value={limitPrice}
							type="number"
							class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-blue-500/60 focus:bg-blue-900/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all"
						/>
					</div>
				{/if}

				<!-- Size -->
				<div class="mb-1.5 group">
					<label for="sizeUSD" class="mb-1.5 block text-[10px] text-slate-400 font-bold uppercase tracking-wider group-focus-within:text-blue-400 transition-colors">Size (USD)</label>
					<input
						id="sizeUSD"
						bind:value={sizeUSD}
						type="number"
						class="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-blue-500/60 focus:bg-blue-900/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all"
					/>
				</div>
				<div class="mb-6 grid grid-cols-4 gap-1.5">
					{#each [25, 50, 75, 100] as pct}
						<button
							onclick={() => (sizeUSD = String(Math.floor(balance * leverage * pct / 100)))}
							class="rounded-lg border border-white/10 bg-white/5 py-1.5 text-[10px] font-bold text-slate-400 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300 transition-all active:scale-95"
						>{pct}%</button>
					{/each}
				</div>

				<!-- Leverage -->
				<div class="mb-6 rounded-xl border border-white/5 bg-black/20 p-3">
					<div class="mb-2 flex justify-between items-center">
						<label for="leverageInput" class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Leverage</label>
						<div class="rounded bg-blue-500/20 px-2 py-0.5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
							<span class="text-xs font-black text-blue-400">{leverage}×</span>
						</div>
					</div>
					<input
						id="leverageInput"
						bind:value={leverage}
						type="range" min="1" max="100" step="1"
						class="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
					/>
					<div class="mt-2 flex justify-between text-[9px] font-bold text-slate-500">
						<span>1×</span><span>25×</span><span>50×</span><span>75×</span><span>100×</span>
					</div>
				</div>

				<!-- TP/SL toggle -->
				<div class="mb-5">
					<button
						onclick={() => (showTpSl = !showTpSl)}
						class="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-white/20 hover:bg-white/10 transition-all"
					>
						<span>Take Profit / Stop Loss</span>
						<span class="text-blue-400 transition-transform duration-300 {showTpSl ? 'rotate-180' : ''}">▼</span>
					</button>
					{#if showTpSl}
						<div class="mt-3 grid grid-cols-2 gap-3">
							<div class="group">
								<label for="tpPrice" class="mb-1.5 block text-[9px] font-black text-green-400 tracking-wider">TAKE PROFIT</label>
								<input id="tpPrice" bind:value={tpPrice} type="number" placeholder="Price"
									class="w-full rounded-lg border border-green-500/30 bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none focus:border-green-400 focus:bg-green-900/20 focus:shadow-[0_0_10px_rgba(74,222,128,0.2)] transition-all" />
							</div>
							<div class="group">
								<label for="slPrice" class="mb-1.5 block text-[9px] font-black text-red-400 tracking-wider">STOP LOSS</label>
								<input id="slPrice" bind:value={slPrice} type="number" placeholder="Price"
									class="w-full rounded-lg border border-red-500/30 bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-400 focus:bg-red-900/20 focus:shadow-[0_0_10px_rgba(248,113,113,0.2)] transition-all" />
							</div>
						</div>
					{/if}
				</div>

				<!-- Order summary -->
				<div class="mb-6 space-y-2 rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 text-[11px] shadow-lg backdrop-blur-sm">
					{#each [
						{ label: 'Size', value: `${sizeContracts()} ${market?.base ?? ''}`, highlight: false },
						{ label: 'Notional', value: `$${fmt(notional())}`, highlight: false },
						{ label: 'Fees', value: `$${fees()}`, highlight: false },
						{ label: 'Liq. Price', value: fmtPrice(parseFloat(liqPrice()) || 0, market?.decimals ?? 2), highlight: true },
					] as row}
						<div class="flex justify-between items-center group/row">
							<span class="text-slate-400 font-medium group-hover/row:text-slate-300 transition-colors">{row.label}</span>
							<span class="font-bold {row.highlight ? (side === 'long' ? 'text-red-400 drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]' : 'text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]') : 'text-slate-100'}">
								{row.value}
							</span>
						</div>
					{/each}
				</div>

				<!-- Place Order button -->
				<button
					onclick={placeOrder}
					disabled={!sizeUSD || parseFloat(sizeUSD) <= 0}
					class="w-full rounded-xl py-3.5 text-[13px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed active:scale-[0.98] active:translate-y-0.5
						{side === 'long'
							? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-[0_0_30px_rgba(74,222,128,0.4)] hover:shadow-[0_0_40px_rgba(74,222,128,0.6)] border border-green-400/50'
							: 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-[0_0_30px_rgba(248,113,113,0.4)] hover:shadow-[0_0_40px_rgba(248,113,113,0.6)] border border-red-400/50'}"
				>
					{side === 'long' ? 'Place Long Order' : 'Place Short Order'}
				</button>
			</div>
		</div>

		<!-- CENTER: Chart -->
		<div class="relative flex min-w-0 flex-1 flex-col border-b border-white/5 lg:border-b-0 lg:border-r">
			<!-- Chart glow -->
			<div class="absolute inset-0 bg-gradient-to-t from-blue-900/5 to-transparent pointer-events-none"></div>

			<!-- Timeframe tabs -->
			<div class="relative z-10 flex items-center gap-1 border-b border-white/10 px-4 py-2 bg-black/10 backdrop-blur-sm">
				{#each TFS as tf}
					<button
						onclick={() => (chartTf = tf)}
						class="px-3 py-1.5 rounded-md text-[11px] font-bold transition-all duration-300
							{chartTf === tf 
								? 'bg-blue-500/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
								: 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}"
					>{tf}</button>
				{/each}
				<div class="ml-auto rounded-full bg-white/5 border border-white/10 px-3 py-1 mt-0.5">
					<span class="text-[9px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
						<span class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)] animate-pulse"></span>
						Live Price Data
					</span>
				</div>
			</div>

			<!-- SVG candlestick chart -->
			<div class="relative flex-1 min-h-[300px]"
				role="application"
				aria-label="Interactive chart container"
				onmouseleave={() => (hoveredCandle = null)}
			>
				{#if candles.length > 0}
					<svg
						role="img"
						aria-label="Candlestick price chart"
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
							class="pointer-events-none absolute top-4 left-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md px-4 py-3 text-[10px] shadow-2xl space-y-1 z-20"
						>
							{#each [
								{ l: 'O', v: fmtPrice(hoveredCandle.open, market?.decimals ?? 2), c: hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400' },
								{ l: 'H', v: fmtPrice(hoveredCandle.high, market?.decimals ?? 2), c: 'text-green-400' },
								{ l: 'L', v: fmtPrice(hoveredCandle.low, market?.decimals ?? 2), c: 'text-red-400' },
								{ l: 'C', v: fmtPrice(hoveredCandle.close, market?.decimals ?? 2), c: hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400' },
							] as row}
								<div class="flex gap-3 justify-between">
									<span class="text-slate-500 font-bold">{row.l}</span>
									<span class="{row.c} font-black drop-shadow-[0_0_2px_currentColor]">{row.v}</span>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- RIGHT: Orderbook -->
		<div class="w-full shrink-0 bg-black/20 backdrop-blur-lg lg:w-[280px]">
			<div class="border-b border-white/10 px-4 py-3 bg-white/5 backdrop-blur-sm">
				<span class="text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">
					Orderbook
				</span>
			</div>

			<!-- Column headers -->
			<div class="grid grid-cols-3 gap-1 px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
				<span>Price</span><span class="text-right">Size</span><span class="text-right">Total</span>
			</div>

			<!-- Asks (red, reversed — highest at top) -->
			<div class="px-2 space-y-0.5">
				{#each book.asks as ask}
					{@const pct = (ask.size / depthMax(book.asks)) * 100}
					<div class="relative group grid grid-cols-3 gap-1 rounded py-0.5 px-2 text-[11px] font-medium hover:bg-white/5 transition-colors cursor-pointer">
						<div class="pointer-events-none absolute inset-0 rounded bg-red-500/10 group-hover:bg-red-500/20 transition-colors" style="width: {pct}%; margin-left: auto"></div>
						<span class="relative text-red-400 font-bold group-hover:drop-shadow-[0_0_3px_rgba(248,113,113,0.5)] transition-all">{fmtPrice(ask.price, market?.decimals ?? 2)}</span>
						<span class="relative text-right text-slate-300">{ask.size.toFixed(1)}</span>
						<span class="relative text-right text-slate-500 group-hover:text-slate-400 transition-colors">{(ask.size * ask.price).toFixed(0)}</span>
					</div>
				{/each}
			</div>

			<!-- Spread -->
			{#if book.asks.length && book.bids.length}
				{@const spread = book.asks[0].price - book.bids[0].price}
				{@const spreadPct = (spread / book.bids[0].price * 100).toFixed(3)}
				<div class="my-2 flex items-center justify-between border-y border-white/10 bg-white/5 px-4 py-2 text-[10px] shadow-inner">
					<span class="font-extrabold text-blue-300 drop-shadow-[0_0_5px_rgba(147,197,253,0.4)] text-[12px]">{fmtPrice(book.asks[0].price - spread / 2, market?.decimals ?? 2)}</span>
					<span class="text-slate-400 font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/10">Spread <span class="text-slate-200">{spreadPct}%</span></span>
				</div>
			{/if}

			<!-- Bids (green) -->
			<div class="px-2 space-y-0.5">
				{#each book.bids as bid}
					{@const pct = (bid.size / depthMax(book.bids)) * 100}
					<div class="relative group grid grid-cols-3 gap-1 rounded py-0.5 px-2 text-[11px] font-medium hover:bg-white/5 transition-colors cursor-pointer">
						<div class="pointer-events-none absolute inset-0 rounded bg-green-500/10 group-hover:bg-green-500/20 transition-colors" style="width: {pct}%"></div>
						<span class="relative text-green-400 font-bold group-hover:drop-shadow-[0_0_3px_rgba(74,222,128,0.5)] transition-all">{fmtPrice(bid.price, market?.decimals ?? 2)}</span>
						<span class="relative text-right text-slate-300">{bid.size.toFixed(1)}</span>
						<span class="relative text-right text-slate-500 group-hover:text-slate-400 transition-colors">{(bid.size * bid.price).toFixed(0)}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- ── Bottom Panel ───────────────────────────────────────────────────────── -->
	<div class="relative z-10 border-t border-white/10 bg-[#0d0e14]/90 backdrop-blur-xl">
		<!-- Tabs -->
		<div class="flex items-center gap-2 border-b border-white/5 px-4 py-3">
			{#each [
				{ key: 'positions',    label: `Positions (${positions.length})` },
				{ key: 'orders',       label: `Open Orders (${openOrders.length})` },
				{ key: 'history',      label: 'Trade History' },
			] as tab}
				<button
					onclick={() => (bottomTab = tab.key)}
					class="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300
						{bottomTab === tab.key 
							? 'bg-blue-500/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
							: 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}"
				>{tab.label}</button>
			{/each}
		</div>

		<!-- Positions -->
		{#if bottomTab === 'positions'}
			<div class="overflow-x-auto min-h-[200px]">
				{#if positions.length === 0}
					<div class="flex items-center justify-center p-8">
						<p class="text-sm font-bold text-slate-500 tracking-widest uppercase">No open positions</p>
					</div>
				{:else}
					<table class="w-full text-[11px]">
						<thead>
							<tr class="border-b border-white/5 text-left text-[9px] font-bold text-slate-600 uppercase tracking-widest bg-black/20">
								{#each ['Market', 'Side', 'Size', 'Entry', 'Mark', 'Liq.', 'PnL', 'PnL %', ''] as h}
									<th class="px-5 py-3">{h}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each positions as pos (pos.id)}
								{@const p = pnl(pos)}
								{@const pp = pnlPct(pos)}
								<tr class="border-b border-white/[0.03] hover:bg-white/5 transition-colors group cursor-pointer">
									<td class="px-5 py-3 font-black text-white tracking-wider">{pos.market}</td>
									<td class="px-5 py-3">
										<span class="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest
											{pos.side === 'long' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
											{pos.side.toUpperCase()}
										</span>
									</td>
									<td class="px-5 py-3 font-medium text-slate-300 group-hover:text-white transition-colors">{pos.size}</td>
									<td class="px-5 py-3 font-medium text-slate-400">{fmtPrice(pos.entry, pos.decimals)}</td>
									<td class="px-5 py-3 font-medium text-slate-200">{fmtPrice(pos.mark, pos.decimals)}</td>
									<td class="px-5 py-3 font-medium text-orange-400/80">{fmtPrice(pos.liq, pos.decimals)}</td>
									<td class="px-5 py-3 font-black {p >= 0 ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.4)]'}">
										{p >= 0 ? '+' : ''}{fmt(p, 2)}
									</td>
									<td class="px-5 py-3 font-black {pp >= 0 ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.4)]'}">
										{pp >= 0 ? '+' : ''}{pp.toFixed(2)}%
									</td>
									<td class="px-5 py-3 text-right">
										<button
											onclick={() => closePosition(pos.id)}
											class="rounded-lg border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-400 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-400 transition-all active:scale-95"
										>CLOSE</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

		<!-- Open Orders -->
		{:else if bottomTab === 'orders'}
			<div class="overflow-x-auto min-h-[200px]">
				{#if openOrders.length === 0}
					<div class="flex items-center justify-center p-8">
						<p class="text-sm font-bold text-slate-500 tracking-widest uppercase">No open orders</p>
					</div>
				{:else}
					<table class="w-full text-[11px]">
						<thead>
							<tr class="border-b border-white/5 text-left text-[9px] font-bold text-slate-600 uppercase tracking-widest bg-black/20">
								{#each ['Market', 'Type', 'Side', 'Size', 'Price', 'Filled', 'Time', ''] as h}
									<th class="px-5 py-3">{h}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each openOrders as o (o.id)}
								<tr class="border-b border-white/[0.03] hover:bg-white/5 transition-colors group cursor-pointer">
									<td class="px-5 py-3 font-black text-white tracking-wider">{o.market}</td>
									<td class="px-5 py-3 font-bold text-slate-500">{o.type}</td>
									<td class="px-5 py-3">
										<span class="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest
											{o.side === 'long' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
											{o.side.toUpperCase()}
										</span>
									</td>
									<td class="px-5 py-3 font-medium text-slate-300 group-hover:text-white transition-colors">{o.size}</td>
									<td class="px-5 py-3 font-medium text-slate-200">{o.price}</td>
									<td class="px-5 py-3 font-medium text-slate-400">
										<div class="flex items-center gap-2">
											<div class="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
												<div class="h-full bg-blue-500 rounded-full" style="width: {o.filled}%"></div>
											</div>
											{o.filled}%
										</div>
									</td>
									<td class="px-5 py-3 font-medium text-slate-500">{o.time}</td>
									<td class="px-5 py-3 text-right">
										<button
											onclick={() => cancelOrder(o.id)}
											class="rounded-lg border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-400 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-400 transition-all active:scale-95"
										>CANCEL</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

		<!-- Trade History -->
		{:else if bottomTab === 'history'}
			<div class="max-h-60 overflow-y-auto">
				<table class="w-full text-[11px]">
					<thead class="sticky top-0 bg-[#0d0e14] z-10 shadow-md">
						<tr class="border-b border-white/5 text-left text-[9px] font-bold text-slate-600 uppercase tracking-widest bg-black/40 backdrop-blur-md">
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
