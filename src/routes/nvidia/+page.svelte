<script>
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	// ── mock NVDA stock ─────────────────────────────────────────
	let nvdaPrice    = $state(875.42);
	let nvdaChange   = $state(+18.64);
	let nvdaChangePct = $state(+2.18);
	let nvdaHigh     = $state(891.20);
	let nvdaLow      = $state(862.15);
	let nvdaOpen     = $state(863.00);
	let nvdaMktCap   = $state(2.14); // trillion

	// sparkline points (last 30 ticks)
	let spark = $state(Array.from({ length: 40 }, (_, i) =>
		820 + i * 1.6 + Math.sin(i * 0.6) * 14 + Math.random() * 8
	));

	function sparkPath(pts) {
		const w = 280, h = 64;
		const min = Math.min(...pts), max = Math.max(...pts);
		const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
		const ys = pts.map(p => h - ((p - min) / (max - min || 1)) * h);
		return xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
	}

	// ── GPU product cards ───────────────────────────────────────
	const GPUS = [
		{ name: 'RTX 5090',     msrp: 1_999, street: 3_840, vram: '32 GB',  tflops: 209.4, tdp: 575, tier: 'GOD',      emoji: '👑', avail: 'Scarce'    },
		{ name: 'RTX 5080',     msrp:   999, street: 1_350, vram: '16 GB',  tflops: 137.6, tdp: 360, tier: 'ULTRA',    emoji: '💪', avail: 'Low'       },
		{ name: 'RTX 4090',     msrp: 1_599, street: 1_640, vram: '24 GB',  tflops: 82.6,  tdp: 450, tier: 'LEGEND',   emoji: '🔥', avail: 'Available' },
		{ name: 'RTX 4080 S',   msrp:   999, street: 980,   vram: '16 GB',  tflops: 52.2,  tdp: 320, tier: 'STRONG',   emoji: '⚡', avail: 'Available' },
		{ name: 'H100 SXM',     msrp: 30_000, street: 34_000, vram: '80 GB', tflops: 989.5, tdp: 700, tier: 'DATACENTER', emoji: '🏭', avail: 'Waitlist' },
		{ name: 'H200',         msrp: 40_000, street: 45_000, vram: '141 GB', tflops: 1979,  tdp: 1000, tier: 'DATACENTER', emoji: '🤖', avail: 'Waitlist' }
	];

	const TIER_STYLE = {
		GOD:        'from-yellow-400 to-amber-500 text-black',
		ULTRA:      'from-purple-400 to-fuchsia-500 text-white',
		LEGEND:     'from-orange-400 to-red-500 text-white',
		STRONG:     'from-sky-400 to-blue-500 text-white',
		DATACENTER: 'from-emerald-400 to-teal-500 text-black'
	};

	// ── AI revenue chart (quarterly) ────────────────────────────
	const QUARTERS = [
		{ q: 'Q1 23', rev: 7.19  },
		{ q: 'Q2 23', rev: 13.51 },
		{ q: 'Q3 23', rev: 18.12 },
		{ q: 'Q4 23', rev: 22.10 },
		{ q: 'Q1 24', rev: 26.04 },
		{ q: 'Q2 24', rev: 30.04 },
		{ q: 'Q3 24', rev: 35.08 },
		{ q: 'Q4 24', rev: 39.33 },
		{ q: 'Q1 25', rev: 44.06 }
	];

	const BAR_MAX = Math.max(...QUARTERS.map(q => q.rev));

	// ── JamCat × NVDA portfolio joke ────────────────────────────
	let jamHoldings  = $state(420_000);
	let jamInNvda    = $derived((jamHoldings * 0.000042 / nvdaPrice).toFixed(4));

	// ── Jensen quotes ────────────────────────────────────────────
	const QUOTES = [
		{ text: '"The more you buy, the more you save."', ctx: '— Jensen Huang, probably' },
		{ text: '"Blackwell is in full production."',      ctx: '— Jensen Huang, every quarter' },
		{ text: '"The next wave of AI is physical AI."',   ctx: '— Jensen Huang, GTC 2025' },
		{ text: '"CUDA or die."',                          ctx: '— Every ML engineer' },
		{ text: '"One more thing... it fits in a GB200."', ctx: '— Jensen Huang' }
	];
	let quoteIdx = $state(0);

	// ── news feed ────────────────────────────────────────────────
	const NEWS = [
		{ icon: '📈', title: 'NVDA hits $3T market cap milestone', time: '2h ago',  tag: 'Markets'  },
		{ icon: '🤖', title: 'Blackwell Ultra ships to hyperscalers', time: '4h ago',  tag: 'Product'  },
		{ icon: '💰', title: 'Q1 FY26 earnings beat: $44B revenue', time: '1d ago',  tag: 'Earnings' },
		{ icon: '🏭', title: 'TSMC 3nm allocation doubled for H-series', time: '2d ago',  tag: 'Supply'   },
		{ icon: '🎮', title: 'RTX 5090 supply normalizing in Asia', time: '3d ago',  tag: 'Gaming'   },
		{ icon: '🌐', title: 'NIM microservices available on all clouds', time: '4d ago',  tag: 'Software' }
	];

	// ── live ticker ──────────────────────────────────────────────
	let orderFlow = $state([
		{ side: 'BUY',  qty: 420,  price: 874.88 },
		{ side: 'SELL', qty: 150,  price: 875.20 },
		{ side: 'BUY',  qty: 1200, price: 874.50 },
		{ side: 'BUY',  qty: 88,   price: 875.42 },
		{ side: 'SELL', qty: 300,  price: 875.60 }
	]);

	function pushOrder() {
		const side  = Math.random() > 0.42 ? 'BUY' : 'SELL';
		const price = +(nvdaPrice + (Math.random() - 0.5) * 1.2).toFixed(2);
		const qty   = Math.floor(Math.random() * 1400) + 10;
		orderFlow = [{ side, qty, price }, ...orderFlow.slice(0, 9)];
	}

	const TICKER = '🟢 NVDA · NVIDIA CORP · AI INFRASTRUCTURE · DATA CENTER · CUDA · BLACKWELL · RTX · JENSEN HUANG · OMNIVERSE · DRIVE · ';

	onMount(() => {
		const iv = setInterval(() => {
			const delta   = (Math.random() - 0.46) * 3.2;
			nvdaPrice     = +(nvdaPrice + delta).toFixed(2);
			nvdaChange    = +(nvdaPrice - nvdaOpen).toFixed(2);
			nvdaChangePct = +((nvdaChange / nvdaOpen) * 100).toFixed(2);
			nvdaHigh      = Math.max(nvdaHigh, nvdaPrice);
			nvdaLow       = Math.min(nvdaLow, nvdaPrice);
			spark         = [...spark.slice(1), nvdaPrice];
			if (Math.random() < 0.4) pushOrder();
		}, 800);

		const qiv = setInterval(() => {
			quoteIdx = (quoteIdx + 1) % QUOTES.length;
		}, 4000);

		return () => { clearInterval(iv); clearInterval(qiv); };
	});

	const up = $derived(nvdaChange >= 0);
</script>

<svelte:head><title>NVIDIA | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-black/40 py-2.5 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 34s linear infinite">
		{#each [TICKER,TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#76b900">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen bg-[#070a07]">

	<!-- ambient green glow -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-32 left-1/4 h-[500px] w-[600px] rounded-full opacity-10 blur-[130px]"
			 style="background:radial-gradient(circle,#76b900,transparent 70%)"></div>
		<div class="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-8 blur-[100px]"
			 style="background:radial-gradient(circle,#76b900,transparent 70%)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">

		<!-- ── HERO STOCK CARD ──────────────────────────────────── -->
		<div class="mb-10 overflow-hidden rounded-3xl border border-[#76b900]/20 bg-[#0c110c] backdrop-blur-xl"
			 in:fly={{ y: -20, duration: 500 }}>

			<!-- green top accent -->
			<div class="h-[3px]" style="background:linear-gradient(90deg,transparent,#76b900,#a3d900,transparent)"></div>

			<div class="grid gap-6 p-6 lg:grid-cols-3">

				<!-- price block -->
				<div class="flex flex-col justify-between lg:col-span-1">
					<div>
						<div class="mb-3 flex items-center gap-3">
							<div class="flex h-12 w-12 items-center justify-center rounded-2xl" style="background:#76b900">
								<span class="text-xl font-black text-black">N</span>
							</div>
							<div>
								<p class="text-xl font-black text-white">NVDA</p>
								<p class="text-xs text-white/30">NVIDIA Corporation · NASDAQ</p>
							</div>
						</div>

						<p class="mb-1 text-5xl font-black tabular-nums text-white">${nvdaPrice.toFixed(2)}</p>

						<div class="flex items-center gap-2">
							<span class="rounded-full px-2.5 py-0.5 text-sm font-black {up ? 'bg-[#76b900]/15 text-[#76b900]' : 'bg-red-500/15 text-red-400'}">
								{up ? '▲' : '▼'} {Math.abs(nvdaChange).toFixed(2)} ({Math.abs(nvdaChangePct).toFixed(2)}%)
							</span>
							<span class="text-xs text-white/25">today</span>
						</div>
					</div>

					<div class="mt-4 grid grid-cols-2 gap-2">
						{#each [
							{ l: 'Open',    v: `$${nvdaOpen.toFixed(2)}`                   },
							{ l: 'High',    v: `$${nvdaHigh.toFixed(2)}`                   },
							{ l: 'Low',     v: `$${nvdaLow.toFixed(2)}`                    },
							{ l: 'Mkt Cap', v: `$${nvdaMktCap.toFixed(2)}T`               }
						] as s}
							<div class="rounded-xl border border-white/6 bg-white/3 p-3">
								<p class="text-[9px] uppercase tracking-widest text-white/25">{s.l}</p>
								<p class="text-sm font-black text-white">{s.v}</p>
							</div>
						{/each}
					</div>
				</div>

				<!-- sparkline chart -->
				<div class="flex flex-col justify-between lg:col-span-2">
					<div class="mb-2 flex items-center justify-between">
						<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Live Price</p>
						<span class="rounded-full border border-[#76b900]/25 bg-[#76b900]/10 px-2.5 py-0.5 text-[10px] font-black text-[#76b900]">● LIVE</span>
					</div>

					<div class="relative flex-1 overflow-hidden rounded-2xl border border-white/5 bg-white/2 px-4 py-3" style="min-height:120px">
						<!-- grid lines -->
						{#each [0.25, 0.5, 0.75] as pct}
							<div class="absolute left-0 right-0 border-t border-white/4" style="top:{pct*100}%"></div>
						{/each}

						<svg class="w-full" viewBox="0 0 280 64" preserveAspectRatio="none" style="height:80px">
							<!-- fill area -->
							<defs>
								<linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%"   stop-color="#76b900" stop-opacity="0.3"/>
									<stop offset="100%" stop-color="#76b900" stop-opacity="0"/>
								</linearGradient>
							</defs>
							{#key spark}
								<path d="{sparkPath(spark)} L280,64 L0,64 Z" fill="url(#sparkFill)" opacity="0.8"/>
								<path d={sparkPath(spark)} fill="none" stroke="#76b900" stroke-width="1.5" stroke-linejoin="round"/>
							{/key}
						</svg>

						<!-- current price dot -->
						<div class="absolute right-4 top-3 rounded-full border border-[#76b900]/40 bg-[#76b900]/15 px-2 py-0.5">
							<span class="text-[10px] font-black text-[#76b900]">${nvdaPrice.toFixed(2)}</span>
						</div>
					</div>

					<!-- rotating Jensen quote -->
					<div class="mt-3 rounded-xl border border-[#76b900]/12 bg-[#76b900]/5 px-4 py-3" in:fade={{ duration: 400 }}>
						{#key quoteIdx}
							<div in:fly={{ y: 8, duration: 300 }}>
								<p class="text-sm italic text-white/60">{QUOTES[quoteIdx].text}</p>
								<p class="mt-0.5 text-[10px] text-white/25">{QUOTES[quoteIdx].ctx}</p>
							</div>
						{/key}
					</div>
				</div>
			</div>
		</div>

		<!-- ── MAIN GRID ────────────────────────────────────────── -->
		<div class="grid gap-6 lg:grid-cols-3">

			<!-- LEFT: GPU cards + revenue chart -->
			<div class="space-y-6 lg:col-span-2">

				<!-- GPU lineup -->
				<div in:fly={{ y: 20, duration: 450, delay: 80 }}>
					<p class="mb-4 text-[10px] font-black uppercase tracking-widest text-white/25">GPU Lineup · Street vs MSRP</p>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each GPUS as gpu, i (gpu.name)}
							<div class="group relative overflow-hidden rounded-2xl border border-white/6 bg-[#0c110c] transition-all duration-300 hover:border-[#76b900]/30 hover:shadow-lg hover:shadow-[#76b900]/8"
								 in:fly={{ y: 16, duration: 300, delay: i * 50 }}>

								<!-- tier gradient line top -->
								<div class="h-[2px] bg-gradient-to-r {TIER_STYLE[gpu.tier]}"></div>

								<div class="p-4">
									<div class="mb-3 flex items-start justify-between">
										<div class="flex items-center gap-2">
											<span class="text-2xl">{gpu.emoji}</span>
											<div>
												<p class="font-black text-white">{gpu.name}</p>
												<p class="text-[9px] uppercase tracking-widest text-white/25">{gpu.vram} VRAM · {gpu.tdp}W TDP</p>
											</div>
										</div>
										<span class="rounded-full bg-gradient-to-r px-2 py-0.5 text-[9px] font-black {TIER_STYLE[gpu.tier]}">{gpu.tier}</span>
									</div>

									<div class="mb-3 grid grid-cols-2 gap-2 text-xs">
										<div class="rounded-lg border border-white/5 bg-white/3 p-2">
											<p class="text-[9px] text-white/25">MSRP</p>
											<p class="font-black text-white">${gpu.msrp.toLocaleString()}</p>
										</div>
										<div class="rounded-lg border border-white/5 p-2 {gpu.street > gpu.msrp ? 'bg-red-500/8 border-red-500/15' : 'bg-[#76b900]/8 border-[#76b900]/15'}">
											<p class="text-[9px] text-white/25">Street</p>
											<p class="font-black {gpu.street > gpu.msrp ? 'text-red-400' : 'text-[#76b900]'}">${gpu.street.toLocaleString()}</p>
										</div>
									</div>

									<div class="flex items-center justify-between">
										<div>
											<p class="text-[9px] text-white/25">AI TFLOPS (FP8)</p>
											<p class="text-sm font-black text-white/80">{gpu.tflops.toLocaleString()}</p>
										</div>
										<span class="rounded-full border px-2.5 py-0.5 text-[9px] font-bold
											{gpu.avail === 'Available' ? 'border-[#76b900]/30 text-[#76b900]' :
											 gpu.avail === 'Scarce'    ? 'border-orange-400/30 text-orange-400' :
											 gpu.avail === 'Waitlist'  ? 'border-purple-400/30 text-purple-400' :
											                             'border-red-400/30 text-red-400'}">
											{gpu.avail}
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- AI Revenue chart -->
				<div class="rounded-2xl border border-white/6 bg-[#0c110c] p-5"
					 in:fly={{ y: 20, duration: 450, delay: 160 }}>
					<div class="mb-4 flex items-center justify-between">
						<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Data Center Revenue · Quarterly ($B)</p>
						<span class="text-xs font-black text-[#76b900]">↑ 427% YoY</span>
					</div>
					<div class="flex items-end gap-2">
						{#each QUARTERS as q, i (q.q)}
							<div class="flex flex-1 flex-col items-center gap-1">
								<span class="text-[8px] font-black text-[#76b900]">{q.q === 'Q1 25' ? `$${q.rev}B` : ''}</span>
								<div class="w-full overflow-hidden rounded-t-lg transition-all duration-500"
									 style="height:{Math.max(8,(q.rev/BAR_MAX)*120)}px;background:{i===QUARTERS.length-1?'#76b900':'rgba(118,185,0,0.35)'}">
								</div>
								<span class="text-[7px] text-white/20 rotate-45 origin-left hidden sm:block">{q.q}</span>
								<span class="text-[8px] text-white/20 sm:hidden">{q.q.replace(' ','')}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- JamCat × NVDA calculator -->
				<div class="rounded-2xl border border-[#76b900]/15 bg-[#76b900]/4 p-5"
					 in:fly={{ y: 20, duration: 450, delay: 200 }}>
					<p class="mb-1 text-[10px] font-black uppercase tracking-widest text-[#76b900]/60">🐱 JamCat × NVDA Calculator</p>
					<p class="mb-4 text-xs text-white/30">How many NVDA shares could your $JAM bag buy?</p>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div class="flex-1 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
							<p class="mb-1 text-[9px] text-white/25">Your $JAM balance</p>
							<input type="number" bind:value={jamHoldings} min="0"
								class="w-full bg-transparent text-xl font-black text-white outline-none placeholder-white/15"
								placeholder="420000" />
						</div>
						<span class="text-center text-2xl text-white/20">→</span>
						<div class="flex-1 rounded-xl border border-[#76b900]/20 bg-[#76b900]/8 px-4 py-3">
							<p class="mb-1 text-[9px] text-white/35">NVDA shares you could buy</p>
							<p class="text-xl font-black text-[#76b900]">{jamInNvda} <span class="text-sm font-normal text-white/30">shares</span></p>
						</div>
					</div>
					<p class="mt-2 text-[9px] text-white/15">1 $JAM ≈ $0.000042 USD · Rate is mock data</p>
				</div>
			</div>

			<!-- RIGHT SIDEBAR -->
			<div class="space-y-4">

				<!-- order flow -->
				<div class="rounded-2xl border border-white/6 bg-[#0c110c] p-4"
					 in:fly={{ x: 20, duration: 400, delay: 80 }}>
					<div class="mb-3 flex items-center gap-2">
						<span class="relative flex h-1.5 w-1.5">
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style="background:#76b900"></span>
							<span class="relative inline-flex h-1.5 w-1.5 rounded-full" style="background:#76b900"></span>
						</span>
						<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Order Flow</p>
					</div>
					<div class="space-y-1">
						<!-- header -->
						<div class="flex justify-between px-1 text-[8px] uppercase tracking-widest text-white/15">
							<span>Side</span><span>Qty</span><span>Price</span>
						</div>
						{#each orderFlow.slice(0, 8) as order, i (i)}
							<div class="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-all {order.side === 'BUY' ? 'bg-[#76b900]/6' : 'bg-red-500/6'}"
								 in:fly={{ x: 6, duration: 180 }}>
								<span class="w-10 font-black {order.side === 'BUY' ? 'text-[#76b900]' : 'text-red-400'}">{order.side}</span>
								<span class="text-white/50">{order.qty.toLocaleString()}</span>
								<span class="font-mono text-white/70">${order.price.toFixed(2)}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- key metrics -->
				<div class="rounded-2xl border border-white/6 bg-[#0c110c] p-4"
					 in:fly={{ x: 20, duration: 400, delay: 140 }}>
					<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-white/25">Key Metrics</p>
					<div class="space-y-2.5">
						{#each [
							{ l: 'P/E Ratio',        v: '34.2x',    note: 'FWD' },
							{ l: 'Revenue TTM',      v: '$130B',    note: '' },
							{ l: 'Gross Margin',     v: '78.4%',    note: '↑ QoQ' },
							{ l: 'Data Center %',    v: '87%',      note: 'of revenue' },
							{ l: 'R&D Spend',        v: '$8.7B',    note: 'annual' },
							{ l: 'Free Cash Flow',   v: '$26.2B',   note: 'TTM' },
							{ l: 'Employees',        v: '29,600',   note: '' },
							{ l: 'Founded',          v: '1993',     note: 'Santa Clara' }
						] as m}
							<div class="flex items-center justify-between border-b border-white/4 pb-2 last:border-0 last:pb-0">
								<span class="text-xs text-white/35">{m.l}</span>
								<div class="text-right">
									<span class="text-xs font-black text-white">{m.v}</span>
									{#if m.note}<span class="ml-1 text-[9px] text-white/20">{m.note}</span>{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- news -->
				<div class="rounded-2xl border border-white/6 bg-[#0c110c] p-4"
					 in:fly={{ x: 20, duration: 400, delay: 200 }}>
					<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-white/25">Latest News</p>
					<div class="space-y-3">
						{#each NEWS as n (n.title)}
							<div class="flex gap-3">
								<span class="mt-0.5 text-base">{n.icon}</span>
								<div>
									<p class="text-xs font-bold leading-tight text-white/65">{n.title}</p>
									<div class="mt-0.5 flex items-center gap-1.5">
										<span class="rounded-full bg-[#76b900]/12 px-1.5 py-0.5 text-[8px] font-bold text-[#76b900]/70">{n.tag}</span>
										<span class="text-[9px] text-white/20">{n.time}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

			</div>
		</div>

		<!-- ── PRODUCT ROADMAP ──────────────────────────────────── -->
		<div class="mt-8 rounded-2xl border border-white/6 bg-[#0c110c] p-6"
			 in:fly={{ y: 20, duration: 450, delay: 250 }}>
			<p class="mb-6 text-[10px] font-black uppercase tracking-widest text-white/25">GPU Architecture Roadmap</p>
			<div class="relative flex flex-col gap-0 sm:flex-row">
				<!-- line -->
				<div class="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#76b900]/50 to-transparent sm:left-0 sm:right-0 sm:top-5 sm:bottom-auto sm:h-[2px] sm:w-auto sm:bg-gradient-to-r"></div>

				{#each [
					{ arch: 'Ampere',    year: '2020', gpu: 'A100 / RTX 3090', status: 'done'    },
					{ arch: 'Hopper',    year: '2022', gpu: 'H100 / H200',     status: 'done'    },
					{ arch: 'Ada',       year: '2022', gpu: 'RTX 4090',        status: 'done'    },
					{ arch: 'Blackwell', year: '2024', gpu: 'B200 / RTX 5090', status: 'current' },
					{ arch: 'Vera Rubin',year: '2026', gpu: 'R100',            status: 'next'    }
				] as node, i}
					<div class="relative flex flex-1 flex-row items-start gap-4 pl-10 pb-6 sm:flex-col sm:items-center sm:pl-0 sm:pb-0 sm:text-center">
						<!-- dot -->
						<div class="absolute left-2 top-1 h-4 w-4 shrink-0 rounded-full border-2 sm:relative sm:left-auto sm:top-auto sm:mb-3
							{node.status === 'current' ? 'border-[#76b900] bg-[#76b900] shadow-[0_0_12px_#76b900]' :
							 node.status === 'done'    ? 'border-[#76b900]/50 bg-[#76b900]/25' :
							                            'border-white/15 bg-white/5'}"></div>
						<div>
							<p class="font-black {node.status === 'current' ? 'text-[#76b900]' : 'text-white/60'}">{node.arch}</p>
							<p class="text-[10px] text-white/25">{node.year}</p>
							<p class="text-[10px] text-white/40">{node.gpu}</p>
						</div>
					</div>
				{/each}
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
