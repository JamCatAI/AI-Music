<svelte:head>
	<title>Bitcoin | JamCat</title>
</svelte:head>

<script>
	import { onMount } from 'svelte';

	const rand = (min, max) => Math.random() * (max - min) + min;
	const randInt = (min, max) => Math.floor(rand(min, max));
	const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
	const fmtB = (n) => n >= 1e12 ? `$${(n/1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`;
	const fmtBTC = (n) => n.toFixed(8);

	// ── Market data ───────────────────────────────────────────────────────────────
	let btcPrice    = $state(95_420);
	let btcChange   = $state(2.14);
	let marketCap   = $state(1_880_000_000_000);
	let dominance   = $state(54.2);
	let dailyVol    = $state(48_300_000_000);
	let ath         = $state(109_114);
	let athDate     = '2024-12-17';

	// ── Network stats ─────────────────────────────────────────────────────────────
	let hashrate    = $state(812.4);   // EH/s
	let difficulty  = $state(108.5);   // T
	let blockHeight = $state(891_442);
	let mempoolTx   = $state(142_300);
	let mempoolMB   = $state(284.7);
	let avgFee      = $state(14.2);    // sat/vB
	let nextHalving = $state(48_558);  // blocks away
	let blockReward = $state(3.125);
	let totalSupply = $state(19_843_712);
	let maxSupply   = 21_000_000;

	// ── Price chart ───────────────────────────────────────────────────────────────
	const CW = 700, CH = 140;
	let priceHistory = $state([]);

	function makePriceHistory() {
		const pts = [];
		let p = 82000;
		for (let i = 0; i < 120; i++) {
			p += rand(-1200, 1400);
			pts.push(Math.max(60000, p));
		}
		pts.push(95420);
		return pts;
	}

	function pricePath(pts) {
		if (!pts.length) return '';
		const min = Math.min(...pts), max = Math.max(...pts);
		const range = max - min || 1;
		const x = (i) => (i / (pts.length - 1)) * CW;
		const y = (v) => CH - ((v - min) / range) * CH;
		return pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
	}
	function priceArea(pts) {
		if (!pts.length) return '';
		return pricePath(pts) + ` L${CW},${CH} L0,${CH} Z`;
	}

	let chartTf = $state('1D');
	const TFS = ['1H', '4H', '1D', '1W', '1M', 'ALL'];

	// ── Layers / Ecosystem ────────────────────────────────────────────────────────
	const CATEGORIES = ['All', 'L2', 'DeFi', 'NFT', 'Mining', 'Custody', 'Lightning'];

	const ECOSYSTEM = [
		{ name: 'Lightning Network', cat: 'Lightning', desc: 'Instant off-chain BTC payments, ~5,400 BTC capacity', logo: '⚡', color: '#F7931A', stat: '5,400 BTC', statLabel: 'Capacity', hot: true  },
		{ name: 'Stacks',            cat: 'L2',        desc: 'Smart contracts & DeFi secured by Bitcoin',          logo: '📦', color: '#5546FF', stat: '$890M',    statLabel: 'TVL',      hot: true  },
		{ name: 'Rootstock (RSK)',   cat: 'L2',        desc: 'EVM-compatible Bitcoin sidechain',                   logo: '🌿', color: '#00B520', stat: '$340M',    statLabel: 'TVL',      hot: false },
		{ name: 'Merlin Chain',      cat: 'L2',        desc: 'ZK-rollup L2 with BTC native yield',                 logo: '🧙', color: '#9B59B6', stat: '$1.2B',    statLabel: 'TVL',      hot: true  },
		{ name: 'ALEX',              cat: 'DeFi',      desc: 'DeFi hub on Stacks — swap, lend, farm',              logo: '🔷', color: '#00D4FF', stat: '$210M',    statLabel: 'TVL',      hot: false },
		{ name: 'Ordinals',          cat: 'NFT',       desc: 'Native Bitcoin NFTs via inscription protocol',       logo: '🔮', color: '#FF6B35', stat: '78M+',     statLabel: 'Inscribed', hot: true  },
		{ name: 'Runes',             cat: 'NFT',       desc: 'Fungible token protocol on Bitcoin L1',              logo: '🪄', color: '#FFD700', stat: '210K+',    statLabel: 'Tokens',   hot: true  },
		{ name: 'Foundry USA',       cat: 'Mining',    desc: 'Largest Bitcoin mining pool by hashrate',            logo: '⛏️', color: '#718096', stat: '28.4%',    statLabel: 'Pool %',   hot: false },
		{ name: 'Antpool',           cat: 'Mining',    desc: 'Bitmain-operated global mining pool',                logo: '🏭', color: '#E53E3E', stat: '18.1%',    statLabel: 'Pool %',   hot: false },
		{ name: 'Coinbase Custody',  cat: 'Custody',   desc: 'Institutional grade cold storage',                   logo: '🏦', color: '#0052FF', stat: '~$50B',    statLabel: 'AUM',      hot: false },
		{ name: 'Fedi',              cat: 'Lightning',  desc: 'Fedimint-based community custody wallets',          logo: '🤝', color: '#F7931A', stat: '40K+',     statLabel: 'Users',    hot: true  },
		{ name: 'BitVM',             cat: 'L2',        desc: 'Turing-complete computation on Bitcoin',             logo: '💻', color: '#48BB78', stat: 'Testnet',  statLabel: 'Status',   hot: true  },
	];

	let selectedCat = $state('All');
	let filtered = $derived(selectedCat === 'All' ? ECOSYSTEM : ECOSYSTEM.filter(p => p.cat === selectedCat));

	// ── Mining pools ──────────────────────────────────────────────────────────────
	const POOLS = [
		{ name: 'Foundry USA',  pct: 28.4, color: '#718096' },
		{ name: 'AntPool',      pct: 18.1, color: '#E53E3E' },
		{ name: 'ViaBTC',       pct: 14.7, color: '#48BB78' },
		{ name: 'F2Pool',       pct: 11.2, color: '#ECC94B' },
		{ name: 'Binance Pool', pct:  8.8, color: '#F6AD55' },
		{ name: 'Others',       pct: 18.8, color: '#4A5568' },
	];

	// Donut chart
	function donutPaths(pools, cx, cy, r, gap = 2) {
		const total = pools.reduce((s, p) => s + p.pct, 0);
		let angle = -Math.PI / 2;
		return pools.map(p => {
			const sweep = (p.pct / total) * (2 * Math.PI) - (gap * Math.PI / 180);
			const x1 = cx + r * Math.cos(angle);
			const y1 = cy + r * Math.sin(angle);
			const x2 = cx + r * Math.cos(angle + sweep);
			const y2 = cy + r * Math.sin(angle + sweep);
			const large = sweep > Math.PI ? 1 : 0;
			const d = `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
			angle += sweep + (gap * Math.PI / 180);
			return { ...p, d };
		});
	}

	let poolSlices = $derived(donutPaths(POOLS, 80, 80, 68));

	// ── Fee levels ────────────────────────────────────────────────────────────────
	const FEE_LEVELS = [
		{ label: 'No Priority', fee: () => Math.max(1, Math.round(avgFee * 0.3)),  time: '60+ min', color: '#718096' },
		{ label: 'Low',         fee: () => Math.round(avgFee * 0.7),               time: '~30 min', color: '#48BB78' },
		{ label: 'Medium',      fee: () => Math.round(avgFee),                     time: '~10 min', color: '#ECC94B' },
		{ label: 'High',        fee: () => Math.round(avgFee * 1.5),               time: '~1 min',  color: '#F7931A' },
	];

	// ── Recent blocks ─────────────────────────────────────────────────────────────
	function makeBlock(height) {
		return {
			height,
			txCount: randInt(1800, 4200),
			size: rand(0.8, 1.6).toFixed(2),
			reward: (3.125 + rand(0.01, 0.4)).toFixed(4),
			miner: POOLS[randInt(0, POOLS.length - 1)].name,
			age: randInt(1, 12),
		};
	}

	let recentBlocks = $state([]);

	// Fetch real BTC price from CoinGecko
	async function fetchBtcData() {
		try {
			const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=true');
			if (res.ok) {
				const data = await res.json();
				if (data && data[0]) {
					btcPrice = data[0].current_price;
					btcChange = data[0].price_change_percentage_24h || 0;
					marketCap = data[0].market_cap || marketCap;
					dailyVol = data[0].total_volume || dailyVol;
					ath = data[0].ath || ath;
					if (data[0].sparkline_in_7d?.price?.length > 0) {
						priceHistory = data[0].sparkline_in_7d.price.slice(-120);
					}
				}
			}
		} catch (e) {
			console.log('CoinGecko fetch failed:', e.message);
		}
	}

	onMount(() => {
		priceHistory = makePriceHistory();
		recentBlocks = Array.from({ length: 8 }, (_, i) => makeBlock(blockHeight - i));
		
		// Fetch real BTC price
		fetchBtcData();
		const priceRefresh = setInterval(fetchBtcData, 60000);

		const tickPrice = setInterval(() => {
			// Only small variations since we fetch real price from API
			btcPrice = Math.round(btcPrice * (1 + rand(-0.0001, 0.0001)));
			dailyVol += rand(-1e8, 1.2e8);
			hashrate = parseFloat((hashrate + rand(-3, 3)).toFixed(1));
			mempoolTx += randInt(-200, 300);
			avgFee = parseFloat((avgFee + rand(-0.3, 0.4)).toFixed(1));
		}, 1500);

		const tickBlock = setInterval(() => {
			blockHeight += 1;
			recentBlocks = [makeBlock(blockHeight), ...recentBlocks.slice(0, 7)];
			nextHalving -= 1;
		}, 8000);

		const tickChart = setInterval(() => {
			priceHistory = [...priceHistory.slice(1), btcPrice + rand(-200, 200)];
		}, 2500);

		return () => {
			clearInterval(priceRefresh);
			clearInterval(tickPrice);
			clearInterval(tickBlock);
			clearInterval(tickChart);
		};
	});
</script>

<div class="min-h-screen" style="background: radial-gradient(ellipse at 25% 10%, #1a0e00 0%, #0d0d0d 50%, #1a0a00 100%);">

	<!-- Header -->
	<div class="border-b border-white/10 bg-black/40 backdrop-blur-md px-6 py-4">
		<div class="mx-auto max-w-7xl flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl text-2xl" style="background: linear-gradient(135deg, #F7931A, #FFD700);">
					₿
				</div>
				<div>
					<h1 class="text-xl font-black text-white">Bitcoin</h1>
					<p class="text-xs text-white/40">Network · Ecosystem · Layers</p>
				</div>
			</div>
			<div class="flex items-center gap-4 text-xs font-mono">
				<div class="text-center">
					<p class="text-white/40">Next halving</p>
					<p class="text-orange-400 font-bold">{nextHalving.toLocaleString()} blocks</p>
				</div>
				<div class="text-center">
					<p class="text-white/40">Supply</p>
					<p class="text-white font-bold">{(totalSupply/1e6).toFixed(3)}M / 21M</p>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-orange-400 animate-pulse"></span>
					<span class="text-orange-400">Block {blockHeight.toLocaleString()}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 py-6 space-y-6">

		<!-- Top stats -->
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each [
				{ label: 'BTC Price',    value: `$${fmt(btcPrice, 0)}`,            sub: `${btcChange >= 0 ? '+' : ''}${fmt(btcChange)}% 24h`,   up: btcChange >= 0 },
				{ label: 'Market Cap',   value: fmtB(marketCap),                   sub: `${fmt(dominance, 1)}% dominance`,                       up: true },
				{ label: 'Hashrate',     value: `${fmt(hashrate, 1)} EH/s`,        sub: `Difficulty ${fmt(difficulty, 1)}T`,                     up: true },
				{ label: 'Mempool',      value: `${fmt(mempoolTx, 0)} tx`,         sub: `${fmt(mempoolMB, 1)} MB · ${fmt(avgFee, 0)} sat/vB`,    up: false },
			] as s}
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
				<p class="text-xs text-white/40 mb-1">{s.label}</p>
				<p class="text-2xl font-black text-white font-mono leading-tight">{s.value}</p>
				<p class="text-xs mt-1 {s.up ? 'text-orange-400' : 'text-yellow-400'}">{s.sub}</p>
			</div>
			{/each}
		</div>

		<!-- Chart + Supply -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- Price chart -->
			<div class="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<div>
						<p class="text-white font-bold">BTC / USD</p>
						<p class="text-3xl font-black font-mono" style="color: #F7931A">${fmt(btcPrice, 0)}</p>
						<p class="text-sm {btcChange >= 0 ? 'text-green-400' : 'text-red-400'}">{btcChange >= 0 ? '+' : ''}{fmt(btcChange)}% today · ATH ${fmt(ath, 0)}</p>
					</div>
					<div class="flex gap-1">
						{#each TFS as tf}
						<button onclick={() => chartTf = tf}
							class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all {chartTf === tf ? 'text-black' : 'text-white/40 hover:text-white/70'}"
							style={chartTf === tf ? 'background: #F7931A' : ''}
						>{tf}</button>
						{/each}
					</div>
				</div>

				{#if priceHistory.length > 0}
				<svg viewBox="0 0 {CW} {CH}" class="w-full" preserveAspectRatio="none" style="height:150px">
					<defs>
						<linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="#F7931A" stop-opacity="0.4"/>
							<stop offset="100%" stop-color="#F7931A" stop-opacity="0"/>
						</linearGradient>
					</defs>
					<path d={priceArea(priceHistory)} fill="url(#btcGrad)"/>
					<path d={pricePath(priceHistory)} fill="none" stroke="#F7931A" stroke-width="2.5" stroke-linejoin="round"/>
				</svg>
				{/if}

				<div class="mt-3 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
					<div><p class="text-xs text-white/40">24h Vol</p><p class="text-sm font-bold text-white">{fmtB(dailyVol)}</p></div>
					<div><p class="text-xs text-white/40">Block Reward</p><p class="text-sm font-bold text-white">{blockReward} BTC</p></div>
					<div><p class="text-xs text-white/40">Mined Supply</p><p class="text-sm font-bold text-white">{((totalSupply/maxSupply)*100).toFixed(2)}%</p></div>
				</div>
			</div>

			<!-- Supply + Halving -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-5">
				<p class="text-white font-bold">Supply & Halving</p>

				<!-- Supply bar -->
				<div>
					<div class="flex justify-between text-xs mb-1">
						<span class="text-white/50">Mined</span>
						<span class="text-white font-mono font-bold">{totalSupply.toLocaleString()} / 21,000,000</span>
					</div>
					<div class="h-3 rounded-full bg-white/10 overflow-hidden">
						<div class="h-full rounded-full" style="width:{(totalSupply/maxSupply*100).toFixed(2)}%; background: linear-gradient(90deg, #F7931A, #FFD700)"></div>
					</div>
					<p class="text-xs text-white/30 mt-1">{(maxSupply - totalSupply).toLocaleString()} BTC remaining to mine</p>
				</div>

				<!-- Halving countdown -->
				<div class="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-center">
					<p class="text-xs text-orange-400/70 mb-1">Next Halving</p>
					<p class="text-3xl font-black font-mono text-orange-400">{nextHalving.toLocaleString()}</p>
					<p class="text-xs text-white/40 mt-1">blocks · ~{Math.round(nextHalving * 10 / 60 / 24)} days</p>
					<div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
						<div class="h-full rounded-full bg-orange-400" style="width:{((210000 - nextHalving % 210000) / 210000 * 100).toFixed(1)}%"></div>
					</div>
				</div>

				<!-- Halving history -->
				<div class="space-y-2 text-xs">
					{#each [
						{ n: 1, date: 'Nov 2012', reward: 25,    price: '$12' },
						{ n: 2, date: 'Jul 2016', reward: 12.5,  price: '$650' },
						{ n: 3, date: 'May 2020', reward: 6.25,  price: '$8,700' },
						{ n: 4, date: 'Apr 2024', reward: 3.125, price: '$63,700' },
					] as h}
					<div class="flex justify-between items-center rounded-lg bg-white/5 px-3 py-2">
						<span class="text-white/40">Halving #{h.n}</span>
						<span class="text-white/50">{h.date}</span>
						<span class="text-orange-400 font-mono font-bold">{h.reward} BTC</span>
						<span class="text-white/60">{h.price}</span>
					</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Ecosystem -->
		<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
			<div class="flex items-center justify-between mb-4 flex-wrap gap-3">
				<p class="text-white font-bold text-lg">Bitcoin Ecosystem</p>
				<div class="flex flex-wrap gap-1">
					{#each CATEGORIES as cat}
					<button onclick={() => selectedCat = cat}
						class="px-3 py-1 rounded-full text-xs font-bold transition-all border {selectedCat === cat ? 'border-transparent text-black' : 'border-white/20 text-white/50 hover:text-white/80'}"
						style={selectedCat === cat ? 'background: linear-gradient(135deg, #F7931A, #FFD700)' : ''}
					>{cat}</button>
					{/each}
				</div>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each filtered as p}
				<div class="relative rounded-xl border bg-white/5 p-4 hover:bg-white/10 transition-all cursor-pointer"
				     style="border-color: {p.color}33">
					{#if p.hot}
					<span class="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold text-black" style="background: #F7931A">🔥 Hot</span>
					{/if}
					<div class="flex items-center gap-3 mb-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
						     style="background: {p.color}22; border: 1px solid {p.color}44">{p.logo}</div>
						<div>
							<p class="text-white font-bold text-sm">{p.name}</p>
							<span class="text-xs px-2 py-0.5 rounded-full" style="background: {p.color}22; color: {p.color}">{p.cat}</span>
						</div>
					</div>
					<p class="text-white/50 text-xs mb-3">{p.desc}</p>
					<div class="flex justify-between text-xs">
						<span class="text-white/30">{p.statLabel}</span>
						<span class="text-white font-mono font-bold">{p.stat}</span>
					</div>
				</div>
				{/each}
			</div>
		</div>

		<!-- Bottom row: Mining pools + Fee market + Recent blocks -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

			<!-- Mining pool donut -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<p class="text-white font-bold mb-4">Mining Pools (7d)</p>
				<div class="flex items-center gap-4">
					<svg viewBox="0 0 160 160" class="shrink-0" style="width:160px;height:160px">
						{#each poolSlices as s}
						<path d={s.d} fill={s.color} class="hover:opacity-80 transition-opacity cursor-pointer"/>
						{/each}
						<circle cx="80" cy="80" r="36" fill="#0d0d0d"/>
						<text x="80" y="76" text-anchor="middle" fill="white" font-size="9" font-family="monospace" fill-opacity="0.5">Hashrate</text>
						<text x="80" y="90" text-anchor="middle" fill="white" font-size="11" font-family="monospace" font-weight="bold">{fmt(hashrate,0)}</text>
						<text x="80" y="102" text-anchor="middle" fill="#F7931A" font-size="9" font-family="monospace">EH/s</text>
					</svg>
					<div class="space-y-2 flex-1">
						{#each POOLS as p}
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-1.5">
								<span class="h-2 w-2 rounded-full shrink-0" style="background:{p.color}"></span>
								<span class="text-white/70 truncate">{p.name}</span>
							</div>
							<span class="text-white font-mono font-bold">{p.pct}%</span>
						</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Fee market -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<p class="text-white font-bold mb-1">Fee Market</p>
				<p class="text-xs text-white/40 mb-4">Mempool: {mempoolTx.toLocaleString()} tx · {fmt(mempoolMB, 1)} MB</p>
				<div class="space-y-3">
					{#each FEE_LEVELS as f}
					<div class="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
						<div>
							<p class="text-sm font-bold" style="color:{f.color}">{f.label}</p>
							<p class="text-xs text-white/40">{f.time}</p>
						</div>
						<div class="text-right">
							<p class="text-lg font-black font-mono text-white">{f.fee()}</p>
							<p class="text-xs text-white/40">sat/vB</p>
						</div>
					</div>
					{/each}
				</div>
			</div>

			<!-- Recent blocks -->
			<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
				<div class="flex items-center justify-between mb-4">
					<p class="text-white font-bold">Recent Blocks</p>
					<span class="flex items-center gap-1 text-xs text-orange-400">
						<span class="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse"></span>Live
					</span>
				</div>
				<div class="space-y-2">
					{#each recentBlocks as b}
					<div class="rounded-xl bg-white/5 border border-white/10 p-3">
						<div class="flex items-center justify-between mb-1">
							<span class="text-orange-400 font-mono font-bold text-sm">#{b.height.toLocaleString()}</span>
							<span class="text-white/40 text-xs">{b.age}m ago</span>
						</div>
						<div class="flex items-center justify-between text-xs text-white/50">
							<span>{b.txCount.toLocaleString()} tx · {b.size} MB</span>
							<span class="text-yellow-400 font-mono">{b.reward} BTC</span>
						</div>
						<p class="text-xs text-white/30 mt-0.5 truncate">{b.miner}</p>
					</div>
					{/each}
				</div>
			</div>

		</div>
	</div>
</div>
