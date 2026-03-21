<script>
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut, elasticOut } from 'svelte/easing';

	// ── AI Labs ─────────────────────────────────────────────────
	const LABS = [
		{
			id: 'openai',
			name: 'OpenAI',
			logo: '⬛',
			tagline: 'AGI for humanity (and Microsoft)',
			color: '#ffffff',
			bg: '#0f0f0f',
			border: 'rgba(255,255,255,0.15)',
			founded: 2015,
			valuation: '$157B',
			models: [
				{ name: 'GPT-4o',       ctx: '128K', input: 2.50,  output: 10.00, mmlu: 88.7, modal: true  },
				{ name: 'o3',           ctx: '200K', input: 10.00, output: 40.00, mmlu: 96.7, modal: false },
				{ name: 'GPT-4o mini',  ctx: '128K', input: 0.15,  output: 0.60,  mmlu: 82.0, modal: true  }
			],
			hq: 'San Francisco',
			api: true, open: false,
			news: 'o3 scores 96.7% on MMLU, surpasses PhD-level reasoning on most benchmarks'
		},
		{
			id: 'anthropic',
			name: 'Anthropic',
			logo: '🔶',
			tagline: 'AI safety, serious vibes',
			color: '#d97757',
			bg: '#100c08',
			border: 'rgba(217,119,87,0.25)',
			founded: 2021,
			valuation: '$61B',
			models: [
				{ name: 'Claude Sonnet 4.6', ctx: '200K', input: 3.00,  output: 15.00, mmlu: 90.2, modal: true  },
				{ name: 'Claude Opus 4.6',   ctx: '200K', input: 15.00, output: 75.00, mmlu: 93.5, modal: true  },
				{ name: 'Claude Haiku 4.5',  ctx: '200K', input: 0.80,  output: 4.00,  mmlu: 85.0, modal: true  }
			],
			hq: 'San Francisco',
			api: true, open: false,
			news: 'Claude 4.6 family ships with extended thinking and 200K context across all tiers'
		},
		{
			id: 'xai',
			name: 'xAI / Grok',
			logo: '✖',
			tagline: 'Based, real-time, unfiltered',
			color: '#ffffff',
			bg: '#080808',
			border: 'rgba(255,255,255,0.12)',
			founded: 2023,
			valuation: '$50B',
			models: [
				{ name: 'Grok-3',       ctx: '131K', input: 3.00,  output: 15.00, mmlu: 92.7, modal: true  },
				{ name: 'Grok-3 mini',  ctx: '131K', input: 0.30,  output: 0.50,  mmlu: 87.4, modal: false },
				{ name: 'Grok-2',       ctx: '131K', input: 2.00,  output: 10.00, mmlu: 87.5, modal: true  }
			],
			hq: 'Austin, TX',
			api: true, open: false,
			news: 'Grok-3 beats GPT-4o on math & coding; live X/Twitter data gives real-time edge'
		},
		{
			id: 'mistral',
			name: 'Mistral AI',
			logo: '💨',
			tagline: 'European speed demon, open source hero',
			color: '#ff7000',
			bg: '#0e0800',
			border: 'rgba(255,112,0,0.22)',
			founded: 2023,
			valuation: '$6.2B',
			models: [
				{ name: 'Mistral Large 2', ctx: '128K', input: 3.00,  output: 9.00,  mmlu: 84.0, modal: false },
				{ name: 'Mixtral 8x22B',   ctx: '65K',  input: 2.00,  output: 6.00,  mmlu: 77.8, modal: false },
				{ name: 'Mistral 7B',      ctx: '32K',  input: 0.25,  output: 0.25,  mmlu: 62.5, modal: false }
			],
			hq: 'Paris, France',
			api: true, open: true,
			news: 'Mistral 7B remains the king of open-weight models — free, fast, deployable anywhere'
		},
		{
			id: 'deepmind',
			name: 'Google DeepMind',
			logo: '🔵',
			tagline: 'Science-first, AlphaEverything',
			color: '#4285f4',
			bg: '#080d18',
			border: 'rgba(66,133,244,0.22)',
			founded: 2010,
			valuation: 'Alphabet ($2T)',
			models: [
				{ name: 'Gemini 2.5 Pro',   ctx: '1M',  input: 3.50,  output: 10.50, mmlu: 90.0, modal: true  },
				{ name: 'Gemini 2.0 Flash', ctx: '1M',  input: 0.10,  output: 0.40,  mmlu: 83.6, modal: true  },
				{ name: 'Gemma 3 27B',      ctx: '128K', input: 0.00, output: 0.00,  mmlu: 76.0, modal: false }
			],
			hq: 'London / Mountain View',
			api: true, open: true,
			news: 'Gemini 2.5 Pro tops Chatbot Arena with 1M context window and native multimodality'
		},
		{
			id: 'deepseek',
			name: 'DeepSeek',
			logo: '🐋',
			tagline: 'Chinese R&D, shook the world for $6M',
			color: '#4d6bfe',
			bg: '#080a18',
			border: 'rgba(77,107,254,0.22)',
			founded: 2023,
			valuation: 'Private',
			models: [
				{ name: 'DeepSeek R1',      ctx: '128K', input: 0.55,  output: 2.19, mmlu: 90.8, modal: false },
				{ name: 'DeepSeek V3',      ctx: '128K', input: 0.27,  output: 1.10, mmlu: 88.5, modal: false },
				{ name: 'DeepSeek R1 Zero', ctx: '128K', input: 0.55,  output: 2.19, mmlu: 89.1, modal: false }
			],
			hq: 'Hangzhou, China',
			api: true, open: true,
			news: 'DeepSeek R1 trained for ~$6M, matched GPT-4o, triggered NVDA -17% in one day'
		}
	];

	// ── Benchmarks ──────────────────────────────────────────────
	const BENCHMARKS = [
		{ label: 'MMLU',      key: 'mmlu',      desc: 'Massive Multitask Language Understanding', max: 100 },
	];

	// Best model per lab for chart
	const RACE_DATA = LABS.map(l => ({
		name: l.name,
		color: l.color,
		score: Math.max(...l.models.map(m => m.mmlu)),
		topModel: l.models.reduce((a,b) => a.mmlu > b.mmlu ? a : b).name
	})).sort((a,b) => b.score - a.score);

	// ── Token pricing comparison (per 1M tokens) ─────────────────
	// built from LABS data — cheapest input model per lab
	const PRICE_DATA = LABS.map(l => ({
		name: l.name,
		color: l.color,
		cheapest: Math.min(...l.models.map(m => m.input)),
		costliest: Math.max(...l.models.map(m => m.output))
	})).sort((a,b) => a.cheapest - b.cheapest);

	// ── Live API status (mock) ────────────────────────────────────
	let statuses = $state(LABS.map(l => ({
		id: l.id,
		latency: Math.floor(Math.random() * 300) + 80,
		uptime: +(99 + Math.random() * 0.99).toFixed(2),
		rps: Math.floor(Math.random() * 8000) + 2000,
		ok: true
	})));

	// ── Pulse live stats ─────────────────────────────────────────
	let totalTokens = $state(4_820_341_920);
	let activeUsers = $state(12_480_200);
	let modelsDeployed = $state(847);

	// ── selected lab for detail view ─────────────────────────────
	let selected = $state(null);

	// ── filters ──────────────────────────────────────────────────
	let filterOpen = $state(false);

	const TICKER = '🧠 AI RACE 2026 · OPENAI · ANTHROPIC · GROK · MISTRAL · GOOGLE DEEPMIND · DEEPSEEK · LLAMA · GEMMA · CLAUDE · GPT · ';

	onMount(() => {
		const iv = setInterval(() => {
			statuses = statuses.map(s => ({
				...s,
				latency: Math.max(40, s.latency + Math.floor((Math.random()-0.5)*30)),
				rps:     Math.max(1000, s.rps + Math.floor((Math.random()-0.5)*400))
			}));
			totalTokens  += Math.floor(Math.random() * 2_000_000);
			activeUsers  += Math.floor((Math.random()-0.4)*1200);
			modelsDeployed += Math.random() < 0.05 ? 1 : 0;
		}, 1200);
		return () => clearInterval(iv);
	});

	function fmtB(n) {
		if (n >= 1e12) return (n/1e12).toFixed(2) + 'T';
		if (n >= 1e9)  return (n/1e9).toFixed(2)  + 'B';
		if (n >= 1e6)  return (n/1e6).toFixed(1)  + 'M';
		return n.toLocaleString();
	}
</script>

<svelte:head><title>AI Race | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-black/40 py-2.5 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 40s linear infinite">
		{#each [TICKER,TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em]" style="color:#a78bfa">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen bg-[#08080f]">

	<!-- ambient -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full opacity-8 blur-[140px]"
			 style="background:conic-gradient(from 0deg,#ff7000,#4285f4,#d97757,#4d6bfe,#ffffff,#ff7000)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">

		<!-- ── HERO ─────────────────────────────────────────────── -->
		<div class="mb-10 text-center" in:fly={{ y: -24, duration: 500 }}>
			<div class="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-4 py-1.5">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-violet-400"></span>
				</span>
				<span class="text-[11px] font-black uppercase tracking-widest text-violet-300">The AI Arms Race · 2026</span>
			</div>

			<h1 class="mb-3 text-6xl font-black tracking-tighter sm:text-8xl">
				<span class="inline-block bg-gradient-to-r from-violet-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">The AI</span>
				<span class="text-white"> Race</span>
			</h1>
			<p class="mx-auto max-w-lg text-sm text-white/35">
				OpenAI · Anthropic · Grok · Mistral · DeepMind · DeepSeek — all in one dashboard. Models, benchmarks, pricing, live API status.
			</p>

			<!-- global stats -->
			<div class="mt-7 flex flex-wrap justify-center gap-3">
				{#each [
					{ label: 'Tokens served today', val: fmtB(totalTokens), color: 'text-violet-300' },
					{ label: 'Active users',         val: fmtB(activeUsers), color: 'text-pink-300'   },
					{ label: 'Models deployed',      val: modelsDeployed,    color: 'text-orange-300' },
					{ label: 'Labs tracked',         val: LABS.length,       color: 'text-sky-300'    }
				] as s}
					<div class="rounded-full border border-white/8 bg-white/4 px-4 py-1.5 backdrop-blur-xl">
						<span class="text-xs text-white/30">{s.label} </span>
						<span class="text-xs font-black {s.color}">{s.val}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── BENCHMARK RACE ────────────────────────────────────── -->
		<div class="mb-8 rounded-3xl border border-white/6 bg-[#0c0c14] p-6"
			 in:fly={{ y: 20, duration: 450, delay: 80 }}>
			<div class="mb-5 flex items-center justify-between flex-wrap gap-2">
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-white/25">MMLU Benchmark · Best Model per Lab</p>
					<p class="mt-0.5 text-[10px] text-white/15">Massive Multitask Language Understanding — PhD-level questions across 57 subjects</p>
				</div>
				<span class="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[10px] text-white/30">Higher = better · Max 100</span>
			</div>

			<div class="space-y-3">
				{#each RACE_DATA as lab, i (lab.name)}
					<div class="flex items-center gap-4" in:fly={{ x: -20, duration: 350, delay: i*60 }}>
						<div class="w-28 shrink-0 text-right">
							<p class="text-xs font-black text-white/70">{lab.name}</p>
							<p class="text-[9px] text-white/25">{lab.topModel}</p>
						</div>
						<div class="flex-1 relative h-8 overflow-hidden rounded-full bg-white/4">
							<div class="absolute inset-y-0 left-0 flex items-center rounded-full transition-all duration-700 pr-3"
								 style="width:{lab.score}%;background:linear-gradient(90deg,{lab.color}55,{lab.color})">
							</div>
							<div class="absolute inset-y-0 left-0 flex items-center pl-3" style="width:{lab.score}%">
								<span class="text-xs font-black" style="color:{lab.color === '#ffffff' ? '#000' : '#fff'};mix-blend-mode:normal">&nbsp;</span>
							</div>
						</div>
						<div class="w-16 shrink-0 text-right">
							<span class="text-sm font-black" style="color:{lab.color}">{lab.score}</span>
							<span class="text-[9px] text-white/25">%</span>
						</div>
						{#if i === 0}
							<span class="rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2 py-0.5 text-[9px] font-black text-black">🏆 #1</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- ── LAB CARDS GRID ────────────────────────────────────── -->
		<div class="mb-8">
			<p class="mb-4 text-[10px] font-black uppercase tracking-widest text-white/25">Labs & Models</p>
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each LABS as lab, i (lab.id)}
					{@const status = statuses.find(s => s.id === lab.id)}
					<div class="group flex flex-col overflow-hidden rounded-2xl border bg-[#0c0c14] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
						 style="border-color:{lab.border};--hover-shadow:{lab.color}18"
						 in:fly={{ y: 24, duration: 380, delay: i*60 }}
						 onmouseenter={() => {}}
						 role="article">

						<!-- top color bar -->
						<div class="h-[3px]" style="background:linear-gradient(90deg,transparent,{lab.color},{lab.color}88,transparent)"></div>

						<div class="flex flex-1 flex-col p-5">

							<!-- header -->
							<div class="mb-4 flex items-start justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-11 w-11 items-center justify-center rounded-xl text-xl border"
										 style="background:{lab.bg};border-color:{lab.border}">
										{lab.logo}
									</div>
									<div>
										<p class="font-black text-white">{lab.name}</p>
										<p class="text-[9px] text-white/25">{lab.hq} · est. {lab.founded}</p>
									</div>
								</div>
								<!-- open source badge -->
								{#if lab.open}
									<span class="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black text-emerald-400">⊕ Open</span>
								{/if}
							</div>

							<p class="mb-4 text-xs italic text-white/35">"{lab.tagline}"</p>

							<!-- models table -->
							<div class="mb-4 overflow-hidden rounded-xl border border-white/5 bg-white/2">
								<div class="grid grid-cols-4 border-b border-white/5 px-3 py-1.5 text-[8px] uppercase tracking-widest text-white/20">
									<span>Model</span><span class="text-center">CTX</span><span class="text-center">In $</span><span class="text-center">Out $</span>
								</div>
								{#each lab.models as m (m.name)}
									<div class="grid grid-cols-4 items-center border-b border-white/4 px-3 py-2 last:border-0 text-[10px]">
										<div class="min-w-0">
											<p class="truncate font-bold text-white/75">{m.name}</p>
											{#if m.modal}<span class="text-[8px] text-white/20">👁 multi</span>{/if}
										</div>
										<span class="text-center text-white/40">{m.ctx}</span>
										<span class="text-center font-bold" style="color:{m.input < 1 ? '#4ade80' : m.input < 5 ? '#facc15' : '#f87171'}">${m.input}</span>
										<span class="text-center text-white/40">${m.output}</span>
									</div>
								{/each}
							</div>

							<!-- valuation + api status -->
							<div class="mb-4 flex gap-2">
								<div class="flex-1 rounded-xl border border-white/6 bg-white/3 px-3 py-2">
									<p class="text-[8px] text-white/20 uppercase tracking-wider">Valuation</p>
									<p class="text-xs font-black text-white/70">{lab.valuation}</p>
								</div>
								{#if status}
									<div class="flex-1 rounded-xl border border-white/6 bg-white/3 px-3 py-2">
										<p class="text-[8px] text-white/20 uppercase tracking-wider">API latency</p>
										<p class="text-xs font-black {status.latency < 150 ? 'text-emerald-400' : status.latency < 250 ? 'text-yellow-400' : 'text-red-400'}">{status.latency}ms</p>
									</div>
								{/if}
							</div>

							<!-- news blurb -->
							<div class="mt-auto rounded-xl border px-3 py-2.5 text-[10px] leading-snug text-white/40"
								 style="border-color:{lab.border};background:{lab.color}08">
								📰 {lab.news}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── PRICING COMPARISON + API STATUS ───────────────────── -->
		<div class="mb-8 grid gap-6 lg:grid-cols-2">

			<!-- cheapest input pricing -->
			<div class="rounded-2xl border border-white/6 bg-[#0c0c14] p-5"
				 in:fly={{ y: 20, duration: 450, delay: 100 }}>
				<p class="mb-1 text-[10px] font-black uppercase tracking-widest text-white/25">Cheapest Input · per 1M tokens</p>
				<p class="mb-4 text-[10px] text-white/15">Lower = cheaper to run at scale</p>
				<div class="space-y-3">
					{#each PRICE_DATA as lab (lab.name)}
						<div class="flex items-center gap-3">
							<span class="w-24 shrink-0 text-right text-xs font-bold text-white/50">{lab.name}</span>
							<div class="flex-1 h-6 overflow-hidden rounded-full bg-white/4 relative">
								<div class="absolute inset-y-0 left-0 rounded-full flex items-center"
									 style="width:{Math.max(4,(lab.cheapest/3.5)*100)}%;background:{lab.color}80">
								</div>
							</div>
							<span class="w-16 text-right text-xs font-black"
								  style="color:{lab.cheapest === 0 ? '#4ade80' : lab.color}">
								{lab.cheapest === 0 ? 'FREE' : `$${lab.cheapest}`}
							</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- live API status -->
			<div class="rounded-2xl border border-white/6 bg-[#0c0c14] p-5"
				 in:fly={{ y: 20, duration: 450, delay: 150 }}>
				<div class="mb-4 flex items-center gap-2">
					<span class="relative flex h-1.5 w-1.5">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
					</span>
					<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Live API Status</p>
				</div>
				<div class="space-y-2.5">
					{#each LABS as lab (lab.id)}
						{@const s = statuses.find(x => x.id === lab.id)}
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-2 min-w-0">
								<span class="text-base shrink-0">{lab.logo}</span>
								<span class="text-xs font-bold text-white/60 truncate">{lab.name}</span>
							</div>
							<div class="flex items-center gap-3 shrink-0">
								<span class="text-[10px] font-bold {s && s.latency < 150 ? 'text-emerald-400' : s && s.latency < 250 ? 'text-yellow-400' : 'text-red-400'}">{s?.latency}ms</span>
								<span class="text-[10px] text-white/25">{s?.uptime}% up</span>
								<div class="flex gap-0.5">
									{#each Array(5) as _, k}
										<div class="h-3.5 w-1 rounded-sm {k < 4 ? '' : 'opacity-30'}"
											 style="background:{lab.color};height:{8 + Math.random()*12}px"></div>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- ── MODEL FEATURE MATRIX ─────────────────────────────── -->
		<div class="mb-8 rounded-2xl border border-white/6 bg-[#0c0c14] overflow-hidden"
			 in:fly={{ y: 20, duration: 450, delay: 180 }}>
			<div class="border-b border-white/5 px-5 py-4">
				<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Model Feature Matrix · Best per Lab</p>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-xs">
					<thead>
						<tr class="border-b border-white/5">
							<th class="px-4 py-3 text-left text-[9px] uppercase tracking-widest text-white/20 font-bold">Lab</th>
							<th class="px-4 py-3 text-left text-[9px] uppercase tracking-widest text-white/20 font-bold">Top Model</th>
							<th class="px-3 py-3 text-center text-[9px] uppercase tracking-widest text-white/20 font-bold">MMLU</th>
							<th class="px-3 py-3 text-center text-[9px] uppercase tracking-widest text-white/20 font-bold">Context</th>
							<th class="px-3 py-3 text-center text-[9px] uppercase tracking-widest text-white/20 font-bold">Multimodal</th>
							<th class="px-3 py-3 text-center text-[9px] uppercase tracking-widest text-white/20 font-bold">Open</th>
							<th class="px-3 py-3 text-center text-[9px] uppercase tracking-widest text-white/20 font-bold">API</th>
							<th class="px-4 py-3 text-right text-[9px] uppercase tracking-widest text-white/20 font-bold">Price / 1M</th>
						</tr>
					</thead>
					<tbody>
						{#each LABS as lab, i (lab.id)}
							{@const top = lab.models.reduce((a,b) => a.mmlu > b.mmlu ? a : b)}
							<tr class="border-b border-white/4 transition-colors hover:bg-white/2 last:border-0">
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<span>{lab.logo}</span>
										<span class="font-black" style="color:{lab.color}">{lab.name}</span>
									</div>
								</td>
								<td class="px-4 py-3 text-white/60">{top.name}</td>
								<td class="px-3 py-3 text-center">
									<span class="font-black" style="color:{top.mmlu > 90 ? '#4ade80' : top.mmlu > 85 ? '#facc15' : '#fb923c'}">{top.mmlu}</span>
								</td>
								<td class="px-3 py-3 text-center text-white/50">{top.ctx}</td>
								<td class="px-3 py-3 text-center">{top.modal ? '✅' : '—'}</td>
								<td class="px-3 py-3 text-center">{lab.open ? '✅' : '—'}</td>
								<td class="px-3 py-3 text-center">{lab.api ? '✅' : '—'}</td>
								<td class="px-4 py-3 text-right font-bold text-white/60">${top.input} in · ${top.output} out</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- ── FUN FACTS ROW ─────────────────────────────────────── -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
			 in:fly={{ y: 20, duration: 450, delay: 220 }}>
			{#each [
				{ icon: '💸', fact: 'DeepSeek R1 cost ~$6M to train vs GPT-4\'s ~$100M+',      color: '#4d6bfe' },
				{ icon: '📏', fact: 'Gemini 2.5 Pro has the longest context: 1 million tokens', color: '#4285f4' },
				{ icon: '🔓', fact: 'Mistral & DeepSeek publish model weights — truly open',    color: '#ff7000' },
				{ icon: '🏆', fact: 'o3 achieves 96.7% MMLU — near human expert level',         color: '#ffffff' },
				{ icon: '🌍', fact: 'Anthropic\'s Constitutional AI is the safety gold standard', color: '#d97757' },
				{ icon: '⚡', fact: 'Grok has live X/Twitter data — no knowledge cutoff',        color: '#ffffff' }
			] as f, i (i)}
				<div class="rounded-2xl border border-white/6 bg-[#0c0c14] p-4"
					 in:fly={{ y: 16, duration: 300, delay: i*40 }}>
					<p class="mb-2 text-xl">{f.icon}</p>
					<p class="text-[10px] leading-snug text-white/40">{f.fact}</p>
				</div>
			{/each}
		</div>

	</div>
</div>

<style>
	@keyframes marquee {
		from { transform: translateX(0); }
		to   { transform: translateX(-50%); }
	}
</style>
