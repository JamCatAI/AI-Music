<script>
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	// ── Models data ─────────────────────────────────────────────
	const MODELS = [
		{
			id: 'gpt4o',
			name: 'GPT-4o',
			lab: 'OpenAI',
			color: '#10a37f',
			bg: 'from-[#10a37f] to-[#1a7f64]',
			open: false,
			params: '~200B',
			context: 128_000,
			launched: 'May 2024',
			mmlu: 88.7,
			humaneval: 90.2,
			math: 76.6,
			price_in: 2.50,
			price_out: 10.00,
			speed: 110,
			vision: true, tools: true, finetune: true, streaming: true,
			tags: ['Multimodal', 'Code', 'Vision', 'JSON'],
			desc: 'OpenAI\'s flagship omni-model. Fast, cheap, multimodal. Powers ChatGPT.'
		},
		{
			id: 'o3',
			name: 'o3',
			lab: 'OpenAI',
			color: '#10a37f',
			bg: 'from-[#0d8a6a] to-[#0a6e54]',
			open: false,
			params: 'Unknown',
			context: 200_000,
			launched: 'Apr 2025',
			mmlu: 96.7,
			humaneval: 99.5,
			math: 97.9,
			price_in: 10.00,
			price_out: 40.00,
			speed: 40,
			vision: true, tools: true, finetune: false, streaming: true,
			tags: ['Reasoning', 'SOTA', 'Code', 'Science'],
			desc: 'OpenAI\'s most powerful reasoning model. State-of-the-art on almost every benchmark.'
		},
		{
			id: 'claude4',
			name: 'Claude Opus 4.6',
			lab: 'Anthropic',
			color: '#d97757',
			bg: 'from-[#d97757] to-[#b85c35]',
			open: false,
			params: 'Unknown',
			context: 200_000,
			launched: 'Mar 2025',
			mmlu: 93.5,
			humaneval: 92.0,
			math: 89.5,
			price_in: 15.00,
			price_out: 75.00,
			speed: 55,
			vision: true, tools: true, finetune: false, streaming: true,
			tags: ['Safety', 'Reasoning', 'Long Context', 'Code'],
			desc: 'Anthropic\'s most intelligent model. Exceptional reasoning, safety-focused.'
		},
		{
			id: 'gemini25',
			name: 'Gemini 2.5 Pro',
			lab: 'Google DeepMind',
			color: '#4285f4',
			bg: 'from-[#4285f4] to-[#1a56c4]',
			open: false,
			params: 'Unknown',
			context: 1_000_000,
			launched: 'Mar 2025',
			mmlu: 90.0,
			humaneval: 87.0,
			math: 91.0,
			price_in: 3.50,
			price_out: 10.50,
			speed: 80,
			vision: true, tools: true, finetune: false, streaming: true,
			tags: ['1M Context', 'Multimodal', 'Code', 'Science'],
			desc: 'Google\'s flagship model with 1M token context. Exceptional at long documents.'
		},
		{
			id: 'grok3',
			name: 'Grok 3',
			lab: 'xAI',
			color: '#e5e5e5',
			bg: 'from-[#333] to-[#111]',
			open: false,
			params: '~300B',
			context: 131_072,
			launched: 'Feb 2025',
			mmlu: 92.7,
			humaneval: 88.0,
			math: 93.3,
			price_in: 3.00,
			price_out: 15.00,
			speed: 70,
			vision: true, tools: true, finetune: false, streaming: true,
			tags: ['Reasoning', 'Real-time', 'X/Twitter', 'Math'],
			desc: 'Elon\'s answer to GPT. Real-time X/Twitter access, strong at math and coding.'
		},
		{
			id: 'deepseekr1',
			name: 'DeepSeek R1',
			lab: 'DeepSeek',
			color: '#4d6bfe',
			bg: 'from-[#4d6bfe] to-[#2a3fbf]',
			open: true,
			params: '671B',
			context: 128_000,
			launched: 'Jan 2025',
			mmlu: 90.8,
			humaneval: 90.6,
			math: 97.3,
			price_in: 0.55,
			price_out: 2.19,
			speed: 35,
			vision: false, tools: true, finetune: true, streaming: true,
			tags: ['Open Source', 'Math', 'Cheap', 'Reasoning'],
			desc: 'Chinese open-source reasoning model that shocked the industry. 10x cheaper than o1.'
		},
		{
			id: 'mistral',
			name: 'Mistral Large 2',
			lab: 'Mistral AI',
			color: '#f54a00',
			bg: 'from-[#f54a00] to-[#c03a00]',
			open: false,
			params: '123B',
			context: 128_000,
			launched: 'Jul 2024',
			mmlu: 84.0,
			humaneval: 92.0,
			math: 73.9,
			price_in: 2.00,
			price_out: 6.00,
			speed: 95,
			vision: false, tools: true, finetune: true, streaming: true,
			tags: ['European', 'Fast', 'Code', 'Multilingual'],
			desc: 'France\'s finest. Fast, capable, multilingual. GDPR-friendly EU-based hosting.'
		},
		{
			id: 'llama33',
			name: 'Llama 3.3 70B',
			lab: 'Meta',
			color: '#0064e0',
			bg: 'from-[#0064e0] to-[#003fa3]',
			open: true,
			params: '70B',
			context: 128_000,
			launched: 'Dec 2024',
			mmlu: 86.0,
			humaneval: 88.4,
			math: 77.0,
			price_in: 0.23,
			price_out: 0.69,
			speed: 130,
			vision: false, tools: true, finetune: true, streaming: true,
			tags: ['Open Source', 'Free', 'Fast', 'Self-host'],
			desc: 'Meta\'s open-source flagship. Self-hostable. Runs on consumer GPUs at smaller sizes.'
		},
	];

	const BENCHMARKS = [
		{ key: 'mmlu',      label: 'MMLU',       desc: 'Massive Multitask Language Understanding — PhD-level questions across 57 subjects', max: 100 },
		{ key: 'humaneval', label: 'HumanEval',  desc: 'Code generation — pass@1 on Python programming problems', max: 100 },
		{ key: 'math',      label: 'MATH',        desc: 'Competition math problems across 5 difficulty levels', max: 100 },
	];

	// ── UI state ─────────────────────────────────────────────────
	let activeBench  = $state('mmlu');
	let sortKey      = $state('mmlu');
	let sortDir      = $state(-1); // -1 = desc
	let filterOpen   = $state(false);
	let compareIds   = $state([]);
	let selectedLab  = $state('All');

	const LABS = ['All', ...new Set(MODELS.map(m => m.lab))];

	let filtered = $derived(
		MODELS
			.filter(m => selectedLab === 'All' || m.lab === selectedLab)
			.sort((a, b) => sortDir * (b[sortKey] - a[sortKey]))
	);

	function toggleCompare(id) {
		if (compareIds.includes(id)) compareIds = compareIds.filter(x => x !== id);
		else if (compareIds.length < 3) compareIds = [...compareIds, id];
	}

	let benchSorted = $derived(
		[...MODELS].sort((a, b) => b[activeBench] - a[activeBench])
	);

	// ── live ticker ─────────────────────────────────────────────
	let tokensToday = $state(4_830_000_000);
	let activeUsers = $state(12_500_000);

	const TICKER = '🧠 LLM RESEARCH · GPT-4o · CLAUDE OPUS 4.6 · GEMINI 2.5 PRO · GROK 3 · DEEPSEEK R1 · LLAMA 3.3 · MISTRAL LARGE · ';

	const NEWS = [
		{ lab: 'OpenAI',        color: '#10a37f', text: 'o3 scores 99.5% on HumanEval, surpassing human experts',              ago: '2h' },
		{ lab: 'Anthropic',     color: '#d97757', text: 'Claude Opus 4.6 extended thinking mode now in beta',                  ago: '5h' },
		{ lab: 'Google',        color: '#4285f4', text: 'Gemini 2.5 Pro hits 1M context window with native multimodality',     ago: '8h' },
		{ lab: 'DeepSeek',      color: '#4d6bfe', text: 'DeepSeek R2 rumored — training on 10× more compute than R1',          ago: '1d' },
		{ lab: 'Meta',          color: '#0064e0', text: 'Llama 4 leak: 400B MoE with native vision confirmed by insiders',     ago: '1d' },
		{ lab: 'Mistral',       color: '#f54a00', text: 'Mistral raises €600M Series B at €6B valuation',                     ago: '2d' },
	];

	onMount(() => {
		const iv = setInterval(() => {
			tokensToday  += Math.floor(Math.random() * 50_000);
			activeUsers  += Math.floor((Math.random() - 0.3) * 200);
		}, 800);
		return () => clearInterval(iv);
	});

	function fmtCtx(n) {
		if (n >= 1_000_000) return `${(n/1_000_000).toFixed(0)}M`;
		return `${(n/1_000).toFixed(0)}K`;
	}

	function fmtBig(n) {
		if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(2)}B`;
		if (n >= 1_000_000)     return `${(n/1_000_000).toFixed(1)}M`;
		return n.toLocaleString();
	}
</script>

<svelte:head><title>LLM Research | JamCat</title></svelte:head>

<!-- TICKER -->
<div class="overflow-hidden border-b border-white/5 bg-black/40 py-2 backdrop-blur-xl">
	<div class="flex whitespace-nowrap" style="animation:marquee 40s linear infinite">
		{#each [TICKER,TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">{t}</span>
		{/each}
	</div>
</div>

<div class="relative min-h-screen bg-[#07070f]">

	<!-- bg glow -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-10 blur-[120px]"
			 style="background:radial-gradient(ellipse,#7c3aed,transparent 70%)"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">

		<!-- ── HERO ─────────────────────────────────────────── -->
		<div class="mb-10 text-center" in:fly={{ y: -20, duration: 500 }}>
			<div class="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-4 py-1.5">
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"></span>
				<span class="text-[10px] font-black uppercase tracking-widest text-violet-300">💬 LLM Research Dashboard · 2026</span>
			</div>

			<h1 class="mb-3 text-6xl font-black tracking-tighter sm:text-8xl">
				<span class="inline-block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">The LLM</span>
				<span class="text-white"> Race</span>
			</h1>
			<p class="mx-auto max-w-lg text-sm text-white/35">
				OpenAI · Anthropic · Google · xAI · Mistral · DeepSeek · Meta — models, benchmarks, pricing and context windows in one place.
			</p>

			<!-- live stats -->
			<div class="mt-6 flex flex-wrap justify-center gap-3">
				{#each [
					{ label: 'Tokens served today', val: fmtBig(tokensToday), color: 'text-violet-300' },
					{ label: 'Active users',         val: fmtBig(activeUsers), color: 'text-pink-300'   },
					{ label: 'Models deployed',      val: '847',               color: 'text-white'      },
					{ label: 'Labs tracked',         val: LABS.length - 1,     color: 'text-emerald-400'},
				] as s}
					<div class="rounded-full border border-white/8 bg-white/3 px-4 py-1.5 backdrop-blur-xl">
						<span class="text-xs text-white/25">{s.label} </span>
						<span class="text-xs font-black {s.color}">{s.val}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── BENCHMARK BARS ────────────────────────────────── -->
		<div class="mb-8 overflow-hidden rounded-3xl border border-white/6 bg-white/2 p-6 backdrop-blur-xl"
			 in:fly={{ y: 20, duration: 400, delay: 80 }}>

			<!-- bench tabs -->
			<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-white/25">
						{BENCHMARKS.find(b=>b.key===activeBench)?.label} BENCHMARK · BEST MODEL PER LAB
					</p>
					<p class="mt-0.5 text-[11px] text-white/20">{BENCHMARKS.find(b=>b.key===activeBench)?.desc}</p>
				</div>
				<div class="flex gap-1">
					{#each BENCHMARKS as b (b.key)}
						<button onclick={() => activeBench = b.key}
							class="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wide transition-all
								{activeBench===b.key ? 'bg-violet-500 text-white' : 'border border-white/8 text-white/30 hover:text-white'}">
							{b.label}
						</button>
					{/each}
					<span class="ml-2 rounded-full border border-white/8 bg-white/3 px-3 py-1 text-[9px] text-white/20">Higher = better · Max 100</span>
				</div>
			</div>

			<div class="space-y-3">
				{#each benchSorted as m, i (m.id)}
					<div class="flex items-center gap-4" in:fly={{ x: -20, duration: 300, delay: i*40 }}>
						<!-- label -->
						<div class="w-36 shrink-0 text-right">
							<p class="text-xs font-black text-white">{m.lab}</p>
							<p class="text-[9px] text-white/25">{m.name}</p>
						</div>
						<!-- bar -->
						<div class="relative flex-1 h-8 overflow-hidden rounded-xl bg-white/4">
							<div class="absolute inset-y-0 left-0 rounded-xl transition-all duration-700"
								 style="width:{m[activeBench]}%;background:linear-gradient(90deg,{m.color}cc,{m.color})">
							</div>
							<div class="absolute inset-0 rounded-xl" style="background:linear-gradient(90deg,transparent 70%,rgba(0,0,0,.3))"></div>
						</div>
						<!-- score -->
						<div class="flex w-20 shrink-0 items-center gap-1.5">
							<span class="text-sm font-black" style="color:{m.color}">{m[activeBench]}<span class="text-[10px] text-white/25">%</span></span>
							{#if i === 0}
								<span class="rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-black text-black">🥇 #1</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── MAIN GRID ─────────────────────────────────────── -->
		<div class="flex flex-col gap-6 lg:flex-row">

			<!-- LEFT: model cards -->
			<div class="min-w-0 flex-1">

				<!-- filter bar -->
				<div class="mb-5 flex flex-wrap items-center gap-2" in:fly={{ x: -20, duration: 400, delay: 150 }}>
					<div class="flex flex-wrap gap-1">
						{#each LABS as lab (lab)}
							<button onclick={() => selectedLab = lab}
								class="rounded-full border px-3 py-1 text-[9px] font-black uppercase transition-all
									{selectedLab===lab ? 'border-violet-400 bg-violet-400 text-black' : 'border-white/8 text-white/30 hover:text-white'}">
								{lab}
							</button>
						{/each}
					</div>
					<span class="ml-auto text-[10px] text-white/20">{filtered.length} models</span>
				</div>

				<!-- sort bar -->
				<div class="mb-4 flex flex-wrap gap-1.5 text-[9px]">
					<span class="text-white/20 self-center">Sort:</span>
					{#each [
						{ key:'mmlu',      label:'MMLU'      },
						{ key:'humaneval', label:'HumanEval' },
						{ key:'math',      label:'MATH'      },
						{ key:'speed',     label:'Speed'     },
						{ key:'price_in',  label:'Price'     },
						{ key:'context',   label:'Context'   },
					] as s}
						<button onclick={() => { if(sortKey===s.key) sortDir*=-1; else { sortKey=s.key; sortDir=-1; } }}
							class="rounded-full border px-2.5 py-0.5 font-black uppercase transition-all
								{sortKey===s.key ? 'border-violet-400 bg-violet-400/15 text-violet-300' : 'border-white/6 text-white/25 hover:text-white'}">
							{s.label} {sortKey===s.key ? (sortDir===-1?'↓':'↑') : ''}
						</button>
					{/each}
				</div>

				<!-- model list -->
				<div class="space-y-3">
					{#each filtered as m, i (m.id)}
						<div class="group overflow-hidden rounded-2xl border border-white/6 bg-[#0c0c18] transition-all hover:border-white/12"
							 in:fly={{ y: 16, duration: 300, delay: i*50 }}>

							<!-- top accent bar using model color -->
							<div class="h-[2px] w-full" style="background:linear-gradient(90deg,{m.color},transparent)"></div>

							<div class="p-4">
								<div class="flex flex-wrap items-start gap-4">

									<!-- color dot + name -->
									<div class="flex items-center gap-3 min-w-0">
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black"
											 style="background:linear-gradient(135deg,{m.color}30,{m.color}10);border:1px solid {m.color}30">
											{m.name[0]}
										</div>
										<div class="min-w-0">
											<div class="flex items-center gap-2">
												<h3 class="font-black text-white">{m.name}</h3>
												{#if m.open}
													<span class="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[8px] font-black text-emerald-400">OPEN SOURCE</span>
												{/if}
											</div>
											<p class="text-[11px]" style="color:{m.color}">{m.lab}</p>
										</div>
									</div>

									<!-- benchmark pills -->
									<div class="flex flex-wrap gap-2 ml-auto">
										{#each [
											{ label:'MMLU',      val:m.mmlu,      color:'text-violet-300' },
											{ label:'HumanEval', val:m.humaneval, color:'text-blue-300'   },
											{ label:'MATH',      val:m.math,      color:'text-pink-300'   },
										] as b}
											<div class="rounded-xl border border-white/6 bg-white/3 px-3 py-1.5 text-center">
												<p class="text-[8px] uppercase tracking-widest text-white/25">{b.label}</p>
												<p class="text-sm font-black {b.color}">{b.val}%</p>
											</div>
										{/each}
									</div>
								</div>

								<!-- desc -->
								<p class="mt-3 text-xs text-white/35">{m.desc}</p>

								<!-- tags -->
								<div class="mt-3 flex flex-wrap gap-1">
									{#each m.tags as tag (tag)}
										<span class="rounded-lg px-2 py-0.5 text-[9px] font-bold"
											  style="background:{m.color}15;color:{m.color};border:1px solid {m.color}25">{tag}</span>
									{/each}
								</div>

								<!-- stats row -->
								<div class="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-4 sm:grid-cols-4">
									{#each [
										{ label:'Context',   val:fmtCtx(m.context)        },
										{ label:'Params',    val:m.params                  },
										{ label:'In / 1M',   val:`$${m.price_in.toFixed(2)}` },
										{ label:'Out / 1M',  val:`$${m.price_out.toFixed(2)}`},
									] as stat}
										<div class="rounded-xl bg-white/3 p-2 text-center">
											<p class="text-[9px] uppercase tracking-widest text-white/20">{stat.label}</p>
											<p class="text-xs font-black text-white">{stat.val}</p>
										</div>
									{/each}
								</div>

								<!-- capabilities + compare -->
								<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
									<div class="flex gap-2 text-[9px]">
										{#each [
											{ label:'👁 Vision',   on:m.vision    },
											{ label:'🔧 Tools',    on:m.tools     },
											{ label:'🎯 Finetune', on:m.finetune  },
										] as cap}
											<span class="rounded-full px-2 py-0.5 font-bold {cap.on ? 'bg-white/8 text-white/60' : 'bg-white/3 text-white/15 line-through'}">{cap.label}</span>
										{/each}
									</div>
									<button onclick={() => toggleCompare(m.id)}
										class="rounded-full border px-3 py-1 text-[9px] font-black uppercase transition-all
											{compareIds.includes(m.id) ? 'border-violet-400 bg-violet-400/15 text-violet-300' : 'border-white/8 text-white/25 hover:text-white'}">
										{compareIds.includes(m.id) ? '✓ Comparing' : '+ Compare'}
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- RIGHT SIDEBAR -->
			<div class="w-full lg:w-72 lg:shrink-0">
				<div class="flex flex-col gap-4 lg:sticky lg:top-20">

					<!-- compare panel -->
					{#if compareIds.length > 0}
						<div class="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4" in:fly={{ x: 20, duration: 300 }}>
							<div class="mb-3 flex items-center justify-between">
								<p class="text-[10px] font-black uppercase tracking-widest text-violet-300">⚖️ Comparing {compareIds.length}/3</p>
								<button onclick={() => compareIds = []}
									class="text-[9px] text-white/25 hover:text-white transition">Clear</button>
							</div>
							<div class="space-y-3">
								{#each compareIds.map(id => MODELS.find(m => m.id === id)) as m (m.id)}
									<div class="rounded-xl border border-white/6 bg-white/3 p-3">
										<div class="mb-2 flex items-center justify-between">
											<div>
												<p class="text-xs font-black text-white">{m.name}</p>
												<p class="text-[9px]" style="color:{m.color}">{m.lab}</p>
											</div>
											<button onclick={() => toggleCompare(m.id)} class="text-[10px] text-white/20 hover:text-white">✕</button>
										</div>
										<div class="grid grid-cols-3 gap-1 text-center">
											{#each [['MMLU',m.mmlu],['HEval',m.humaneval],['MATH',m.math]] as [l,v]}
												<div>
													<p class="text-[8px] text-white/20">{l}</p>
													<p class="text-[11px] font-black text-white">{v}%</p>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- speed comparison -->
					<div class="rounded-2xl border border-white/6 bg-[#0c0c18] p-4" in:fly={{ x: 20, duration: 400, delay: 80 }}>
						<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-white/25">⚡ Speed (tok/s)</p>
						<div class="space-y-2">
							{#each [...MODELS].sort((a,b)=>b.speed-a.speed) as m (m.id)}
								<div class="flex items-center gap-2">
									<span class="w-20 shrink-0 truncate text-[10px] text-white/40">{m.name}</span>
									<div class="flex-1 h-1.5 overflow-hidden rounded-full bg-white/5">
										<div class="h-full rounded-full transition-all duration-700"
											 style="width:{(m.speed/135)*100}%;background:{m.color}"></div>
									</div>
									<span class="w-8 shrink-0 text-right text-[10px] font-black text-white/60">{m.speed}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- pricing table -->
					<div class="rounded-2xl border border-white/6 bg-[#0c0c18] p-4" in:fly={{ x: 20, duration: 400, delay: 120 }}>
						<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-white/25">💰 Pricing (per 1M tokens)</p>
						<div class="space-y-1.5">
							{#each [...MODELS].sort((a,b)=>a.price_in-b.price_in) as m (m.id)}
								<div class="flex items-center justify-between gap-2">
									<span class="truncate text-[10px] text-white/40">{m.name}</span>
									<div class="flex gap-2 shrink-0">
										<span class="text-[9px] font-black text-emerald-400">${m.price_in.toFixed(2)}</span>
										<span class="text-[9px] text-white/20">/</span>
										<span class="text-[9px] font-black text-red-400">${m.price_out.toFixed(2)}</span>
									</div>
								</div>
							{/each}
							<p class="pt-1 text-[8px] text-white/15">in / out · green = input · red = output</p>
						</div>
					</div>

					<!-- context windows -->
					<div class="rounded-2xl border border-white/6 bg-[#0c0c18] p-4" in:fly={{ x: 20, duration: 400, delay: 160 }}>
						<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-white/25">📐 Context Windows</p>
						<div class="space-y-2">
							{#each [...MODELS].sort((a,b)=>b.context-a.context) as m (m.id)}
								<div class="flex items-center gap-2">
									<span class="w-20 shrink-0 truncate text-[10px] text-white/40">{m.name}</span>
									<div class="flex-1 h-1.5 overflow-hidden rounded-full bg-white/5">
										<div class="h-full rounded-full"
											 style="width:{(m.context/1_000_000)*100}%;background:{m.color};min-width:4px"></div>
									</div>
									<span class="w-8 shrink-0 text-right text-[10px] font-black text-white/50">{fmtCtx(m.context)}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- news feed -->
					<div class="rounded-2xl border border-white/6 bg-[#0c0c18] p-4" in:fly={{ x: 20, duration: 400, delay: 200 }}>
						<div class="mb-3 flex items-center gap-2">
							<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"></span>
							<p class="text-[10px] font-black uppercase tracking-widest text-white/25">Latest News</p>
						</div>
						<div class="space-y-3">
							{#each NEWS as n (n.text)}
								<div class="border-l-2 pl-3" style="border-color:{n.color}50">
									<div class="flex items-center justify-between gap-1 mb-0.5">
										<span class="text-[9px] font-black" style="color:{n.color}">{n.lab}</span>
										<span class="text-[9px] text-white/20">{n.ago}</span>
									</div>
									<p class="text-[10px] leading-relaxed text-white/45">{n.text}</p>
								</div>
							{/each}
						</div>
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
