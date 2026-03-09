<svelte:head>
	<title>Swap | JamCat DEX</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	// ── Token list ────────────────────────────────────────────────────────────────
	const ALL_TOKENS = [
		{ symbol: 'SOL',     name: 'Solana',               price: 185.42,     change:  2.34,  logo: '◎',  color: 'text-purple-400', cgId: 'solana' },
		{ symbol: 'USDC',    name: 'USD Coin',              price: 1.0000,     change:  0.00,  logo: '💵', color: 'text-blue-400',   cgId: 'usd-coin' },
		{ symbol: 'USDT',    name: 'Tether',                price: 1.0000,     change:  0.00,  logo: '💲', color: 'text-green-400',  cgId: 'tether' },
		{ symbol: 'JUP',     name: 'Jupiter',               price: 0.8921,     change:  3.12,  logo: '🪐', color: 'text-orange-400', cgId: 'jupiter-exchange-solana' },
		{ symbol: 'RAY',     name: 'Raydium',               price: 3.4100,     change: -1.44,  logo: '⚡', color: 'text-blue-300',   cgId: 'raydium' },
		{ symbol: 'ORCA',    name: 'Orca',                  price: 2.8700,     change:  0.87,  logo: '🐋', color: 'text-teal-400',   cgId: 'orca' },
		{ symbol: 'WIF',     name: 'dogwifhat',             price: 2.1840,     change:  7.34,  logo: '🐕', color: 'text-yellow-400', cgId: 'dogwifcoin' },
		{ symbol: 'BONK',    name: 'Bonk',                  price: 0.00002847, change: -4.12,  logo: '🔨', color: 'text-red-400',    cgId: 'bonk' },
		{ symbol: 'POPCAT',  name: 'Popcat',                price: 0.6213,     change: 12.77,  logo: '🐱', color: 'text-pink-400',   cgId: 'popcat' },
		{ symbol: 'MYRO',    name: 'Myro',                  price: 0.0724,     change: -8.55,  logo: '🐶', color: 'text-amber-400',  cgId: 'myro' },
		{ symbol: 'MOODENG', name: 'Moo Deng',              price: 0.1492,     change:  3.21,  logo: '🦛', color: 'text-cyan-400',   cgId: 'moo-deng' },
		{ symbol: 'PNUT',    name: 'Peanut the Squirrel',   price: 0.3381,     change: -1.88,  logo: '🐿️', color: 'text-orange-300', cgId: 'peanut-the-squirrel' },
		{ symbol: 'BOME',    name: 'Book of Meme',          price: 0.0082,     change:  5.44,  logo: '📖', color: 'text-violet-400', cgId: 'book-of-meme' },
		{ symbol: 'SLERF',   name: 'Slerf',                 price: 0.1124,     change: -2.31,  logo: '😴', color: 'text-slate-400',  cgId: 'slerf' },
		{ symbol: 'PONKE',   name: 'Ponke',                 price: 0.2341,     change:  9.18,  logo: '🐵', color: 'text-lime-400',   cgId: 'ponke' },
	];

	const POPULAR = ['SOL', 'USDC', 'WIF', 'BONK', 'POPCAT'];

	const DEXES = [
		{ name: 'Orca',     color: 'bg-teal-400/20 text-teal-300 border-teal-400/30'     },
		{ name: 'Raydium',  color: 'bg-blue-400/20 text-blue-300 border-blue-400/30'     },
		{ name: 'Meteora',  color: 'bg-purple-400/20 text-purple-300 border-purple-400/30'},
		{ name: 'Phoenix',  color: 'bg-orange-400/20 text-orange-300 border-orange-400/30'},
		{ name: 'Lifinity', color: 'bg-pink-400/20 text-pink-300 border-pink-400/30'     },
	];

	// ── Helpers ───────────────────────────────────────────────────────────────────
	const rand = (min, max) => Math.random() * (max - min) + min;
	const randInt = (min, max) => Math.floor(rand(min, max));
	const fmtUSD = (n) => n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(4) : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const fmtAmt = (n, sym) => {
		const t = ALL_TOKENS.find(x => x.symbol === sym);
		if (!t) return n.toFixed(4);
		if (t.price < 0.0001) return n.toFixed(0);
		if (t.price < 0.01) return n.toFixed(2);
		return n.toFixed(4);
	};

	function makeRoute(fromSym, toSym) {
		// generate a believable route
		const dex1 = DEXES[randInt(0, DEXES.length)];
		const multi = Math.random() > 0.55;
		if (!multi) return [{ from: fromSym, to: toSym, dex: dex1, pct: 100, hops: [] }];
		const dex2 = DEXES.filter(d => d.name !== dex1.name)[randInt(0, DEXES.length - 1)];
		const split = randInt(55, 80);
		const mids = ['USDC', 'SOL'].filter(s => s !== fromSym && s !== toSym);
		const mid = mids[0] ?? 'USDC';
		return [
			{ from: fromSym, to: toSym, dex: dex1, pct: split,       hops: [mid] },
			{ from: fromSym, to: toSym, dex: dex2, pct: 100 - split,  hops: []   },
		];
	}

	function makePriceHistory(basePrice, count = 48) {
		const pts = [];
		let p = basePrice * (1 - rand(0.04, 0.08));
		for (let i = 0; i < count; i++) {
			p *= 1 + rand(-0.008, 0.01);
			pts.push(p);
		}
		pts[pts.length - 1] = basePrice;
		return pts;
	}

	const ANONS = ['whale🐳', 'anon', 'degen', 'ape🦍', 'chad', 'ngmi', 'fren', 'ser'];
	function shortAddr() {
		const h = '0123456789abcdefABCDEF';
		const seg = (n) => Array.from({ length: n }, () => h[randInt(0, h.length)]).join('');
		return seg(4) + '…' + seg(4);
	}

	// ── State ─────────────────────────────────────────────────────────────────────
	let tokens = $state(ALL_TOKENS.map(t => ({
		...t,
		balance: +(rand(0, t.symbol === 'SOL' ? 200 : t.symbol === 'USDC' ? 5000 : rand(0, 50000))).toFixed(4),
		history: makePriceHistory(t.price),
	})));

	let fromSym = $state('SOL');
	let toSym   = $state('USDC');
	let fromAmt = $state('');
	let slippage = $state('0.5');
	let slippageCustom = $state('');
	let speed = $state('Fast');

	let walletConnected = $state(false);
	let rotated = $state(false);

	// Modals
	let showTokenModal = $state(null); // 'from' | 'to' | null
	let tokenSearch = $state('');
	let showSettings = $state(false);

	// Swap flow
	let swapping = $state(false);
	let swapSuccess = $state(false);
	let toast = $state('');

	// Chart
	let chartTf = $state('1H');
	let recentSwaps = $state([]);

	// ── Derived ───────────────────────────────────────────────────────────────────
	let fromToken = $derived(tokens.find(t => t.symbol === fromSym));
	let toToken   = $derived(tokens.find(t => t.symbol === toSym));

	let exchangeRate = $derived(() => {
		if (!fromToken || !toToken) return 0;
		return fromToken.price / toToken.price;
	});

	let toAmt = $derived(() => {
		const n = parseFloat(fromAmt);
		if (!n || !fromToken || !toToken) return '';
		return fmtAmt(n * exchangeRate(), toSym);
	});

	let toUSD = $derived(() => {
		const n = parseFloat(toAmt());
		if (!n || !toToken) return '';
		return (n * toToken.price).toFixed(2);
	});

	let priceImpact = $derived(() => {
		const n = parseFloat(fromAmt);
		if (!n || !fromToken) return 0;
		const notional = n * fromToken.price;
		if (notional < 1000) return 0.01;
		if (notional < 10000) return rand(0.05, 0.15);
		return rand(0.2, 0.8);
	});

	let minReceived = $derived(() => {
		const n = parseFloat(toAmt());
		if (!n) return '';
		const slip = parseFloat(slippage) / 100;
		return fmtAmt(n * (1 - slip), toSym);
	});

	let route = $derived(() => makeRoute(fromSym, toSym));

	let filteredTokens = $derived(
		tokens.filter(t =>
			t.symbol !== (showTokenModal === 'from' ? toSym : fromSym) &&
			(t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
			 t.name.toLowerCase().includes(tokenSearch.toLowerCase()))
		)
	);

	let chartToken = $derived(fromToken);

	let chartHistory = $derived(() => {
		if (!chartToken) return [];
		return chartToken.history;
	});

	// ── Chart SVG ─────────────────────────────────────────────────────────────────
	const CW = 380, CH = 120, PAD = 8;

	function chartPath(pts) {
		if (!pts.length) return '';
		const min = Math.min(...pts);
		const max = Math.max(...pts);
		const range = max - min || 1;
		const step = (CW - PAD * 2) / (pts.length - 1);
		const coords = pts.map((v, i) => {
			const x = PAD + i * step;
			const y = PAD + ((max - v) / range) * (CH - PAD * 2);
			return `${x},${y}`;
		});
		return `M ${coords.join(' L ')}`;
	}

	function chartFill(pts) {
		if (!pts.length) return '';
		const min = Math.min(...pts);
		const max = Math.max(...pts);
		const range = max - min || 1;
		const step = (CW - PAD * 2) / (pts.length - 1);
		const coords = pts.map((v, i) => {
			const x = PAD + i * step;
			const y = PAD + ((max - v) / range) * (CH - PAD * 2);
			return `${x},${y}`;
		});
		return `M ${PAD},${CH - PAD} L ${coords.join(' L ')} L ${CW - PAD},${CH - PAD} Z`;
	}

	// ── Actions ───────────────────────────────────────────────────────────────────
	function flipTokens() {
		rotated = !rotated;
		[fromSym, toSym] = [toSym, fromSym];
		fromAmt = toAmt() || '';
	}

	function selectToken(sym) {
		if (showTokenModal === 'from') fromSym = sym;
		else toSym = sym;
		showTokenModal = null;
		tokenSearch = '';
	}

	async function doSwap() {
		if (!fromAmt || parseFloat(fromAmt) <= 0 || !walletConnected) return;
		swapping = true;
		await new Promise(r => setTimeout(r, 2000));
		swapping = false;
		swapSuccess = true;
		// add to recent swaps
		recentSwaps = [{
			id: Date.now(), from: fromSym, to: toSym,
			fromAmt: fromAmt, toAmt: toAmt(),
			addr: shortAddr(), ts: 'just now',
		}, ...recentSwaps.slice(0, 14)];
		showToast(`✅ Swapped ${fromAmt} ${fromSym} → ${toAmt()} ${toSym}`);
		await new Promise(r => setTimeout(r, 2000));
		swapSuccess = false;
		fromAmt = '';
	}

	function showToast(msg) {
		toast = msg;
		setTimeout(() => (toast = ''), 3000);
	}

	async function fetchPrices() {
		try {
			const ids = ALL_TOKENS.map(t => t.cgId).filter(Boolean).join(',');
			const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
			if (!res.ok) throw new Error('CG API fail');
			const data = await res.json();
			tokens = tokens.map(t => {
				if (t.cgId && data[t.cgId]) {
					const price = data[t.cgId].usd;
					const change = data[t.cgId].usd_24h_change ?? t.change;
					const history = [...t.history.slice(1), price];
					return { ...t, price, change, history };
				}
				return t;
			});
		} catch (e) {
			console.warn('Price fetch failed. Using fallback drift.', e);
		}
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────────
	onMount(() => {
		// Seed recent swaps
		const pairs = [['SOL','USDC'],['WIF','SOL'],['BONK','USDC'],['POPCAT','SOL'],['SOL','JUP']];
		for (let i = 0; i < 12; i++) {
			const [f, t] = pairs[randInt(0, pairs.length)];
			const ft = tokens.find(x => x.symbol === f);
			const tt = tokens.find(x => x.symbol === t);
			const amt = rand(0.5, 200);
			recentSwaps.push({
				id: i, from: f, to: t,
				fromAmt: fmtAmt(amt, f),
				toAmt: fmtAmt(amt * (ft?.price ?? 1) / (tt?.price ?? 1), t),
				addr: shortAddr(), ts: `${randInt(10, 59)}s ago`,
			});
		}

		fetchPrices(); // Initial fetch
		const priceInterval = setInterval(fetchPrices, 30000); // Sync data every 30s

		const id = setInterval(() => {
			// Subtle drift for UI liveliness between API updates
			tokens = tokens.map(t => {
				const drift = t.price * rand(-0.0004, 0.0005);
				const newPrice = Math.max(t.price * 0.5, t.price + drift);
				const newHistory = [...t.history.slice(1), newPrice];
				return { ...t, price: newPrice, history: newHistory };
			});
			// New swap in feed
			if (Math.random() > 0.4) {
				const pairs2 = [['SOL','USDC'],['WIF','SOL'],['BONK','USDC'],['POPCAT','SOL'],['MOODENG','USDC'],['SOL','WIF']];
				const [f, t2] = pairs2[randInt(0, pairs2.length)];
				const ft = tokens.find(x => x.symbol === f);
				const tt2 = tokens.find(x => x.symbol === t2);
				const amt = rand(0.5, 500);
				recentSwaps = [{
					id: Date.now(), from: f, to: t2,
					fromAmt: fmtAmt(amt, f),
					toAmt: fmtAmt(amt * (ft?.price ?? 1) / (tt2?.price ?? 1), t2),
					addr: shortAddr(), ts: 'just now',
				}, ...recentSwaps.slice(0, 14)];
			}
		}, 2000);

		return () => {
			clearInterval(id);
			clearInterval(priceInterval);
		};
	});
</script>

<!-- ── Root ──────────────────────────────────────────────────────────────────── -->
<div class="relative min-h-screen overflow-hidden bg-[#09090f] text-white">

	<!-- ambient background orbs -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
		<div class="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#14f195]/5 blur-[100px]"></div>
		<div class="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[130px]"></div>
	</div>

	<div class="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">

		<!-- ── Header ─────────────────────────────────────────────────────────── -->
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-extrabold tracking-tight">🔄 Swap</h1>
				<p class="mt-0.5 text-xs text-slate-500">Best price across Solana DEXes · powered by JamCat</p>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={() => (showSettings = true)}
					class="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
					aria-label="Swap Settings"
				>⚙️</button>
				<button
					onclick={() => (walletConnected = !walletConnected)}
					class="rounded-xl px-4 py-2 text-sm font-bold transition-all
						{walletConnected
							? 'border border-[#14f195]/40 bg-[#14f195]/10 text-[#14f195]'
							: 'bg-[#14f195] text-black hover:opacity-90'}"
				>
					{walletConnected ? '◉ 7xKX…mQp3' : 'Connect Wallet'}
				</button>
			</div>
		</div>

		<!-- ── Two-column layout ──────────────────────────────────────────────── -->
		<div class="flex flex-col gap-6 lg:flex-row lg:items-start">

			<!-- LEFT: Swap card -->
			<div class="w-full lg:w-[420px] lg:shrink-0">
				<div class="rounded-[2.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-2xl shadow-black/40">

					<!-- From -->
					<div class="group mb-1 rounded-[1.8rem] border border-white/5 bg-black/40 p-5 transition-all focus-within:border-[#14f195]/40 focus-within:shadow-[0_0_20px_rgba(20,241,149,0.05)]">
						<div class="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
							<span>You Pay</span>
							{#if fromToken}
								<span class="flex items-center gap-2">
									Balance: <span class="font-mono font-bold text-slate-300">{fromToken.balance.toLocaleString()}</span>
									<button
										onclick={() => (fromAmt = String(fromToken.balance))}
										class="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-black text-[#14f195] border border-[#14f195]/20 hover:bg-[#14f195]/10 active:scale-95 transition-all"
									>MAX</button>
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<!-- Token selector -->
							<button
								onclick={() => { showTokenModal = 'from'; tokenSearch = ''; }}
								class="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 transition-all hover:bg-white/10 hover:border-white/30 active:scale-95"
							>
								<span class="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{fromToken?.logo ?? '?'}</span>
								<span class="text-lg font-black tracking-tight text-white">{fromSym}</span>
								<span class="text-slate-500 text-xs">▼</span>
							</button>
							<!-- Amount input -->
							<input
								bind:value={fromAmt}
								type="number"
								placeholder="0.00"
								class="min-w-0 flex-1 bg-transparent text-right text-3xl font-black text-white placeholder-slate-700 outline-none"
							/>
						</div>
						{#if fromAmt && fromToken}
							<p class="mt-2 text-right text-[11px] font-bold text-slate-500">
								≈ <span class="text-slate-400">${(parseFloat(fromAmt) * fromToken.price).toFixed(2)}</span>
							</p>
						{/if}
					</div>

					<!-- Flip button -->
					<div class="relative -my-4 flex justify-center z-10">
						<button
							onclick={flipTokens}
							class="group/flip rounded-2xl border border-white/10 bg-[#09090f] p-3 text-slate-400 shadow-xl transition-all duration-500 hover:border-[#14f195]/50 hover:text-[#14f195] hover:shadow-[0_0_15px_rgba(20,241,149,0.2)] active:scale-90"
							style="transform: rotate({rotated ? 360 : 0}deg)"
							aria-label="Flip tokens"
						>
							<span class="block transition-transform group-hover/flip:scale-110">⇅</span>
						</button>
					</div>

					<!-- To -->
					<div class="mb-4 rounded-[1.8rem] border border-white/5 bg-black/40 p-5">
						<div class="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
							<span>You Receive</span>
							{#if toToken}
								<span class="font-mono">Balance: <span class="font-bold text-slate-300">{toToken.balance.toLocaleString()}</span></span>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<button
								onclick={() => { showTokenModal = 'to'; tokenSearch = ''; }}
								class="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 transition-all hover:bg-white/10 hover:border-white/30 active:scale-95"
							>
								<span class="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{toToken?.logo ?? '?'}</span>
								<span class="text-lg font-black tracking-tight text-white">{toSym}</span>
								<span class="text-slate-500 text-xs">▼</span>
							</button>
							<div class="min-w-0 flex-1 text-right">
								<p class="truncate text-3xl font-black {toAmt() ? 'text-[#14f195] drop-shadow-[0_0_10px_rgba(20,241,149,0.3)]' : 'text-slate-700'}">{toAmt() || '0.00'}</p>
							</div>
						</div>
						{#if toUSD()}
							<p class="mt-2 text-right text-[11px] font-bold text-slate-500">≈ <span class="text-slate-400">${toUSD()}</span></p>
						{/if}
					</div>

					<!-- Exchange rate + refresh -->
					{#if fromToken && toToken}
						<div class="mb-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-3 py-2 text-xs text-slate-400">
							<span>1 {fromSym} = <span class="font-bold text-white">{fmtAmt(exchangeRate(), toSym)} {toSym}</span></span>
							<span class="text-slate-600">${fmtUSD(fromToken.price)}</span>
						</div>
					{/if}

					<!-- Route visualization -->
					{#if fromAmt && parseFloat(fromAmt) > 0}
						<div class="mb-4 rounded-xl border border-white/5 bg-white/3 p-3">
							<p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Route</p>
							{#each route() as leg}
								<div class="mb-1 flex items-center gap-1.5 text-[11px]">
									<span class="text-[10px] font-bold text-slate-500">{leg.pct}%</span>
									<span class="font-bold text-white">{leg.from}</span>
									<span class="text-slate-600">→</span>
									{#each leg.hops as hop}
										<span class="rounded border border-slate-600/40 bg-slate-700/30 px-1.5 py-0.5 text-slate-400">{hop}</span>
										<span class="text-slate-600">→</span>
									{/each}
									<span class="font-bold text-white">{leg.to}</span>
									<span class="ml-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold {leg.dex.color}">{leg.dex.name}</span>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Swap details accordion -->
					{#if fromAmt && parseFloat(fromAmt) > 0}
						<div class="mb-6 space-y-2 rounded-2xl border border-white/5 bg-white/3 px-4 py-3.5 text-[11px]">
							{#each [
								{ label: 'Price Impact',   value: priceImpact() < 0.1 ? '< 0.1%' : priceImpact().toFixed(2) + '%',
								  color: priceImpact() < 0.5 ? 'text-green-400' : priceImpact() < 2 ? 'text-yellow-400' : 'text-red-400' },
								{ label: 'Min Received',   value: `${minReceived()} ${toSym}`,          color: 'text-slate-300' },
								{ label: 'Network Fee',    value: '~0.000025 SOL',                       color: 'text-slate-300' },
								{ label: 'Slippage',       value: slippage + '%',                        color: 'text-slate-300' },
							] as row}
								<div class="flex justify-between items-center">
									<span class="text-slate-500 font-medium">{row.label}</span>
									<span class="font-bold {row.color}">{row.value}</span>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Swap button -->
					{#if !walletConnected}
						<button
							onclick={() => (walletConnected = true)}
							class="w-full rounded-[1.8rem] bg-[#14f195] py-4 text-base font-black text-black shadow-xl shadow-[#14f195]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
						>Connect Wallet</button>
					{:else if swapSuccess}
						<div class="w-full rounded-[1.8rem] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 py-4 text-center text-base font-black text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
							✅ Swap Complete!
						</div>
					{:else}
						<button
							onclick={doSwap}
							disabled={!fromAmt || parseFloat(fromAmt) <= 0 || swapping}
							class="w-full rounded-[1.8rem] py-4 text-base font-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40
								{fromAmt && parseFloat(fromAmt) > 0
									? 'bg-[#14f195] text-black shadow-xl shadow-[#14f195]/20 hover:scale-[1.02] hover:shadow-[#14f195]/30'
									: 'bg-white/5 text-slate-500 border border-white/10'}"
						>
							{#if swapping}
								<span class="flex items-center justify-center gap-2">
									<span class="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></span>
									Swapping…
								</span>
							{:else}
								{fromAmt && parseFloat(fromAmt) > 0 ? `Swap ${fromSym} → ${toSym}` : 'Enter an amount'}
							{/if}
						</button>
					{/if}
				</div>

				<!-- Quick-swap popular pairs -->
				<div class="mt-3 flex flex-wrap gap-2">
					{#each [['SOL','USDC'],['WIF','SOL'],['BONK','USDC'],['POPCAT','SOL']] as [f, t]}
						<button
							onclick={() => { fromSym = f; toSym = t; }}
							class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-400 transition-colors hover:border-[#14f195]/40 hover:text-white"
						>{f} → {t}</button>
					{/each}
				</div>
			</div>

			<!-- RIGHT: chart + stats + feed -->
			<div class="flex min-w-0 flex-1 flex-col gap-4">

				<!-- Token chart -->
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
					<div class="mb-4 flex items-center justify-between">
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class="text-2xl">{chartToken?.logo}</span>
								<span class="text-xl font-black text-white">{fromSym}</span>
								<span class="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-black text-slate-500 border border-white/10">1H</span>
							</div>
							<div class="flex items-end gap-2">
								<span class="font-mono text-2xl font-black text-white">${fmtUSD(chartToken?.price ?? 0)}</span>
								<span class="mb-1 text-xs font-bold {(chartToken?.change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center gap-0.5">
									{(chartToken?.change ?? 0) >= 0 ? '▲' : '▼'} {(Math.abs(chartToken?.change ?? 0)).toFixed(2)}%
								</span>
							</div>
						</div>
						<div class="flex gap-1.5 rounded-xl bg-black/40 p-1 border border-white/5">
							{#each ['1H','24H','7D'] as tf}
								<button
									onclick={() => (chartTf = tf)}
									class="rounded-lg px-3 py-1.5 text-[10px] font-black transition-all
										{chartTf === tf ? 'bg-[#14f195] text-black shadow-[0_0_15px_rgba(20,241,149,0.2)]' : 'text-slate-500 hover:text-white'}"
								>{tf}</button>
							{/each}
						</div>
					</div>

					<!-- SVG line chart -->
					<div class="relative h-40 w-full rounded-2xl border border-white/5 bg-black/40 overflow-hidden shadow-inner">
						<svg viewBox="0 0 {CW} {CH}" class="absolute inset-0 h-full w-full" preserveAspectRatio="none">
							<defs>
								<linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="#14f195" stop-opacity="0.25"/>
									<stop offset="100%" stop-color="#14f195" stop-opacity="0"/>
								</linearGradient>
							</defs>
							<!-- Fill -->
							<path d={chartFill(chartHistory())} fill="url(#chartGrad)"/>
							<!-- Line -->
							<path
								d={chartPath(chartHistory())}
								fill="none"
								stroke="#14f195"
								stroke-width="2.5"
								stroke-linejoin="round"
								stroke-linecap="round"
								style="filter: drop-shadow(0 0 8px rgba(20, 241, 149, 0.5));"
							/>
						</svg>
					</div>
				</div>

				<!-- Market stats -->
				{#if fromToken}
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{#each [
							{ label: '24h Volume',   value: `$${(fromToken.price * rand(500000, 5000000)).toLocaleString('en-US', {maximumFractionDigits:0})}` },
							{ label: 'Liquidity',    value: `$${(fromToken.price * rand(1000000, 20000000)).toLocaleString('en-US', {maximumFractionDigits:0})}` },
							{ label: '24h Change',   value: `${fromToken.change >= 0 ? '+' : ''}${fromToken.change.toFixed(2)}%`, color: fromToken.change >= 0 ? 'text-green-400' : 'text-red-400' },
							{ label: 'Price',        value: `$${fmtUSD(fromToken.price)}` },
						] as s}
							<div class="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10">
								<p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{s.label}</p>
								<p class="font-mono text-sm font-black {s.color ?? 'text-white'}">{s.value}</p>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Recent swaps feed -->
				<div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
					<div class="mb-4 flex items-center justify-between">
						<p class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
							<span class="h-2 w-2 animate-pulse rounded-full bg-[#14f195]"></span>
							Live Transactions
						</p>
						<span class="text-[10px] font-bold text-slate-600">Solana Mainnet</span>
					</div>
					<div class="space-y-2 max-h-72 overflow-y-auto pr-1">
						{#each recentSwaps as s (s.id)}
							<div class="group flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-[11px] transition-all hover:bg-white/5 hover:border-white/10">
								<span class="font-mono text-slate-500 group-hover:text-slate-300 transition-colors">{s.addr}</span>
								<div class="flex items-center gap-2">
									<span class="font-black text-white">{s.fromAmt} <span class="text-slate-500 uppercase">{s.from}</span></span>
									<span class="text-slate-700">→</span>
									<span class="font-black text-[#14f195] drop-shadow-[0_0_8px_rgba(20,241,149,0.2)]">{s.toAmt} <span class="text-[#14f195]/60 uppercase">{s.to}</span></span>
								</div>
								<span class="text-[10px] font-bold text-slate-600">{s.ts}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- ── Token Selector Modal ───────────────────────────────────────────────────── -->
{#if showTokenModal}
	<button
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
		onclick={() => (showTokenModal = null)}
		aria-label="Close"
	></button>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#09090f] shadow-2xl shadow-black/60">
			<!-- Glow -->
			<div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-[80px]"></div>

			<div class="relative z-10 border-b border-white/5 bg-white/3 p-6">
				<div class="flex items-center justify-between mb-4">
					<p class="text-base font-black text-white">Select Token</p>
					<button onclick={() => (showTokenModal = null)} class="text-slate-500 hover:text-white transition-colors" aria-label="Close">✕</button>
				</div>
				<div class="relative">
					<input
						bind:value={tokenSearch}
						placeholder="Search name or symbol…"
						class="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-[#14f195]/50 focus:bg-white/5"
					/>
					<span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">🔍</span>
				</div>
			</div>

			<!-- Popular -->
			{#if !tokenSearch}
				<div class="relative z-10 border-b border-white/5 p-5">
					<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Popular</p>
					<div class="flex flex-wrap gap-2">
						{#each POPULAR as sym}
							{@const t = tokens.find(x => x.symbol === sym)}
							{#if t && sym !== (showTokenModal === 'from' ? toSym : fromSym)}
								<button
									onclick={() => selectToken(sym)}
									class="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-[#14f195]/40 active:scale-95"
								>
									<span class="text-lg group-hover:scale-110 transition-transform">{t.logo}</span>
									<span>{sym}</span>
								</button>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Full list -->
			<div class="relative z-10 max-h-[40vh] overflow-y-auto p-3">
				{#each filteredTokens as t}
					<button
						onclick={() => selectToken(t.symbol)}
						class="group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-all hover:bg-white/5 active:scale-[0.98]"
					>
						<div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-[#14f195]/30">
							<span class="text-2xl">{t.logo}</span>
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-black text-white">{t.symbol}</p>
							<p class="text-[10px] font-bold text-slate-500 truncate">{t.name}</p>
						</div>
						<div class="text-right">
							<p class="font-mono text-xs font-bold text-slate-300">{t.balance.toLocaleString()}</p>
							<p class="text-[10px] font-black {t.change >= 0 ? 'text-green-400' : 'text-red-400'}">
								{t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
							</p>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- ── Settings Modal ─────────────────────────────────────────────────────────── -->
{#if showSettings}
	<button class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onclick={() => (showSettings = false)} aria-label="Close settings"></button>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#1b1d2a] p-5 shadow-2xl">
			<button onclick={() => (showSettings = false)} class="absolute right-4 top-4 text-slate-400 hover:text-white" aria-label="Close settings">✕</button>
			<h2 class="mb-5 text-base font-extrabold text-white">⚙️ Swap Settings</h2>

			<!-- Slippage -->
			<div class="mb-5">
				<label for="slippage-custom" class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Slippage Tolerance</label>
				<div class="flex gap-2">
					{#each ['0.1', '0.5', '1.0'] as s}
						<button
							onclick={() => { slippage = s; slippageCustom = ''; }}
							class="flex-1 rounded-xl border py-2 text-sm font-bold transition-all
								{slippage === s && !slippageCustom
									? 'border-[#14f195] bg-[#14f195]/10 text-[#14f195]'
									: 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}"
						>{s}%</button>
					{/each}
					<input
						id="slippage-custom"
						bind:value={slippageCustom}
						oninput={() => { if (slippageCustom) slippage = slippageCustom; }}
						type="number" placeholder="Custom"
						class="w-24 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center text-sm text-white placeholder-slate-600 outline-none focus:border-[#14f195]/50"
					/>
				</div>
			</div>

			<!-- Speed -->
			<div class="mb-5">
				<p class="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Transaction Speed</p>
				<div class="grid grid-cols-3 gap-2">
					{#each ['Fast', 'Turbo', 'Ultra'] as s}
						<button
							onclick={() => (speed = s)}
							class="rounded-xl border py-2 text-sm font-bold transition-all
								{speed === s
									? 'border-[#14f195] bg-[#14f195]/10 text-[#14f195]'
									: 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}"
						>{s}</button>
					{/each}
				</div>
				<p class="mt-1.5 text-[10px] text-slate-600">
					{speed === 'Fast' ? 'Priority fee: 0.000001 SOL' : speed === 'Turbo' ? 'Priority fee: 0.00001 SOL' : 'Priority fee: 0.0001 SOL'}
				</p>
			</div>

			<button
				onclick={() => (showSettings = false)}
				class="w-full rounded-xl bg-[#14f195] py-2.5 text-sm font-extrabold text-black hover:opacity-90"
			>Save Settings</button>
		</div>
	</div>
{/if}

<!-- ── Toast ──────────────────────────────────────────────────────────────────── -->
{#if toast}
	<div class="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-white/10 bg-[#1b1d2a] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
		{toast}
	</div>
{/if}
