<script>
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut, elasticOut } from 'svelte/easing';

	const categories = [
		{ key: 'all',      label: '🌐 All'      },
		{ key: 'research', label: '📡 Research'  },
		{ key: 'creative', label: '🎛️ Creative'  },
		{ key: 'code',     label: '🧰 Build'     },
		{ key: 'ops',      label: '🚚 Launch'    }
	];

	const viewModes = [
		{ key: 'grid',        label: '⊞ Grid'  },
		{ key: 'leaderboard', label: '🏆 Board' }
	];

	const subagentTemplates = [
		{
			id: 1, name: 'ScoutWire', avatar: '📡',
			specialty: 'Maps signals before the rest of the swarm commits',
			category: 'research', status: 'running', model: 'GPT-5',
			tools: ['RSS', 'Search', 'Social', 'Trend DB'],
			capabilities: ['Cluster topics', 'Find spikes', 'Filter noise', 'Write briefs'],
			runsCompleted: 18420, costPerRun: 0.9, latencyMs: 380, successRate: 98,
			lastAction: 'Collapsed 112 source hits into 4 launch-worthy narratives.',
			color: { ring: 'ring-cyan-400', border: 'border-cyan-400/30', glow: 'shadow-cyan-500/20', text: 'text-cyan-300', bg: 'bg-cyan-400/10', badge: 'bg-cyan-400/20 text-cyan-200', hex: '#22d3ee' }
		},
		{
			id: 2, name: 'PromptSmith', avatar: '🧠',
			specialty: 'Turns rough intent into clean specialist prompts',
			category: 'research', status: 'busy', model: 'Claude',
			tools: ['Prompt router', 'Spec sheets', 'Memory'],
			capabilities: ['Decompose work', 'Define constraints', 'Assign owners', 'Clarify tone'],
			runsCompleted: 15110, costPerRun: 1.4, latencyMs: 420, successRate: 97,
			lastAction: 'Generated 6 narrow prompts for a campaign sprint with zero overlap.',
			color: { ring: 'ring-indigo-400', border: 'border-indigo-400/30', glow: 'shadow-indigo-500/20', text: 'text-indigo-300', bg: 'bg-indigo-400/10', badge: 'bg-indigo-400/20 text-indigo-200', hex: '#818cf8' }
		},
		{
			id: 3, name: 'HookLab', avatar: '🎵',
			specialty: 'Builds multiple hooks and melodic directions in parallel',
			category: 'creative', status: 'running', model: 'Suno + GPT-5',
			tools: ['Stem rack', 'Prompt presets', 'Reference vault'],
			capabilities: ['Hook drafts', 'Mood variants', 'Lyric pivots', 'Stem naming'],
			runsCompleted: 12680, costPerRun: 3.8, latencyMs: 910, successRate: 95,
			lastAction: 'Rendered 5 chorus variants and ranked them by replay value.',
			color: { ring: 'ring-pink-400', border: 'border-pink-400/30', glow: 'shadow-pink-500/20', text: 'text-pink-300', bg: 'bg-pink-400/10', badge: 'bg-pink-400/20 text-pink-200', hex: '#f472b6' }
		},
		{
			id: 4, name: 'VisualSplice', avatar: '🖼️',
			specialty: 'Translates audio directions into cover art and clip systems',
			category: 'creative', status: 'running', model: 'Flux',
			tools: ['Image gen', 'Palette library', 'Template board'],
			capabilities: ['Cover prompts', 'Clip frames', 'Palette extraction', 'Export sets'],
			runsCompleted: 9410, costPerRun: 2.7, latencyMs: 650, successRate: 94,
			lastAction: 'Built a neon-jungle art pack around the winning hook direction.',
			color: { ring: 'ring-fuchsia-400', border: 'border-fuchsia-400/30', glow: 'shadow-fuchsia-500/20', text: 'text-fuchsia-300', bg: 'bg-fuchsia-400/10', badge: 'bg-fuchsia-400/20 text-fuchsia-200', hex: '#e879f9' }
		},
		{
			id: 5, name: 'CodeRunner', avatar: '🧰',
			specialty: 'Ships bounded implementation tasks without blocking the orchestrator',
			category: 'code', status: 'busy', model: 'Codex',
			tools: ['Repo search', 'Patch queue', 'Test runner'],
			capabilities: ['Edit files', 'Patch bugs', 'Add routes', 'Verify changes'],
			runsCompleted: 17330, costPerRun: 2.2, latencyMs: 480, successRate: 99,
			lastAction: 'Patched a new route, keyed lists, and cleared targeted lint.',
			color: { ring: 'ring-emerald-400', border: 'border-emerald-400/30', glow: 'shadow-emerald-500/20', text: 'text-emerald-300', bg: 'bg-emerald-400/10', badge: 'bg-emerald-400/20 text-emerald-200', hex: '#34d399' }
		},
		{
			id: 6, name: 'MergeGuard', avatar: '🧪',
			specialty: 'Checks parallel outputs for collisions and risky handoffs',
			category: 'code', status: 'idle', model: 'DeepSeek',
			tools: ['Diff review', 'Test queue', 'Conflict graph'],
			capabilities: ['Find overlap', 'Rank risk', 'Suggest fixes', 'Gate merges'],
			runsCompleted: 11240, costPerRun: 1.8, latencyMs: 290, successRate: 96,
			lastAction: 'Caught 2 overlapping edits before they made it into the main branch.',
			color: { ring: 'ring-lime-400', border: 'border-lime-400/30', glow: 'shadow-lime-500/20', text: 'text-lime-300', bg: 'bg-lime-400/10', badge: 'bg-lime-400/20 text-lime-200', hex: '#a3e635' }
		},
		{
			id: 7, name: 'ReleasePilot', avatar: '🚀',
			specialty: 'Packages the winning branch into channel-ready outputs',
			category: 'ops', status: 'running', model: 'Gemini',
			tools: ['Scheduler', 'Asset vault', 'Checklist'],
			capabilities: ['Bundle outputs', 'Write captions', 'Stage launches', 'Track readiness'],
			runsCompleted: 13820, costPerRun: 1.6, latencyMs: 340, successRate: 97,
			lastAction: 'Prepared X, Telegram, and TikTok bundles from a single source brief.',
			color: { ring: 'ring-orange-400', border: 'border-orange-400/30', glow: 'shadow-orange-500/20', text: 'text-orange-300', bg: 'bg-orange-400/10', badge: 'bg-orange-400/20 text-orange-200', hex: '#fb923c' }
		},
		{
			id: 8, name: 'FlowMarshal', avatar: '🗺️',
			specialty: 'Keeps the whole swarm legible under load',
			category: 'ops', status: 'running', model: 'GPT-5',
			tools: ['Task board', 'Priority lane', 'Slack relay'],
			capabilities: ['Assign streams', 'Resequence work', 'Track blockers', 'Close loops'],
			runsCompleted: 20110, costPerRun: 1.1, latencyMs: 260, successRate: 99,
			lastAction: 'Rebalanced 3 subagent queues after a creative bottleneck surfaced.',
			color: { ring: 'ring-sky-400', border: 'border-sky-400/30', glow: 'shadow-sky-500/20', text: 'text-sky-300', bg: 'bg-sky-400/10', badge: 'bg-sky-400/20 text-sky-200', hex: '#38bdf8' }
		}
	];

	const activityTemplates = [
		(a) => `${a.avatar} ${a.name} routed a fresh task bundle`,
		(a) => `${a.avatar} ${a.name} closed ${(Math.random() * 5 + 1) | 0} pending actions`,
		(a) => `${a.avatar} ${a.name} switched to ${a.status} mode`,
		(a) => `${a.avatar} ${a.name} exported from ${a.tools[(Math.random() * a.tools.length) | 0]}`,
		(a) => `${a.avatar} ${a.name} used ${a.model} for the current pass`,
		(a) => `${a.avatar} ${a.name} trimmed merge time by ${(Math.random() * 18 + 4).toFixed(1)}%`
	];

	let agents        = $state(subagentTemplates.map(a => ({ ...a })));
	let activeCategory = $state('all');
	let viewMode      = $state('grid');
	let searchQuery   = $state('');
	let activityFeed  = $state([]);
	let showModal     = $state(false);
	let spawnSuccess  = $state(false);
	let spawnLoading  = $state(false);
	let selectedAgent = $state(null);

	let stats = $state({
		totalSubagents: 248_190,
		activeNow: 63,
		runsToday: 82_411,
		mergeHealth: 98.6,
		avgLatency: 466,
		orchestrators: 12
	});

	let form = $state({ name: '', model: 'GPT-5', category: 'research', description: '', tools: [] });

	let filteredAgents = $derived(agents.filter(a => {
		const matchCat = activeCategory === 'all' || a.category === activeCategory;
		const q = searchQuery.toLowerCase();
		return matchCat && (a.name.toLowerCase().includes(q) || a.specialty.toLowerCase().includes(q) || a.model.toLowerCase().includes(q));
	}));

	let leaderboard   = $derived([...agents].sort((a, b) => b.runsCompleted - a.runsCompleted));
	let topPerformers = $derived([...agents].sort((a, b) => b.successRate * 1000 + b.runsCompleted - (a.successRate * 1000 + a.runsCompleted)).slice(0, 5));

	function fmtLatency(ms) { return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`; }
	function randomAgent()  { return agents[(Math.random() * agents.length) | 0]; }

	function addActivity() {
		const a   = randomAgent();
		const tmpl = activityTemplates[(Math.random() * activityTemplates.length) | 0];
		const cost = (Math.random() * 3 + 0.4).toFixed(2);
		const now  = new Date();
		const ts   = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
		activityFeed = [{ id: Math.random(), text: tmpl(a), cost, ts, color: a.color }, ...activityFeed.slice(0, 29)];
	}

	function openModal(agent) {
		selectedAgent = agent;
		form = {
			name: agent ? `${agent.name} v2` : '',
			model: agent?.model ?? 'GPT-5',
			category: agent?.category ?? 'research',
			description: agent ? `Fork ${agent.name} with a narrower mission.` : '',
			tools: []
		};
		showModal = true;
	}

	async function handleSpawn() {
		if (!form.name) return;
		spawnLoading = true;
		await new Promise(r => setTimeout(r, 1800));
		spawnLoading = false; spawnSuccess = true;
		await new Promise(r => setTimeout(r, 1600));
		spawnSuccess = false; showModal = false;
	}

	const TICKER = '🧬 SWARM ONLINE · 248,190 SUBAGENTS INDEXED · 63 ACTIVE NOW · MERGE HEALTH 98.6% · AVG LATENCY 466ms · ORCHESTRATORS: 12 · ';

	onMount(() => {
		for (let i = 0; i < 14; i++) addActivity();
		const iv = setInterval(() => {
			addActivity();
			const idx = (Math.random() * agents.length) | 0;
			agents[idx].runsCompleted += (Math.random() * 7 + 1) | 0;
			agents[idx].latencyMs = Math.max(180, agents[idx].latencyMs + (((Math.random() - 0.5) * 120) | 0));
			const pool = ['running', 'busy', 'idle', 'running', 'running'];
			agents[(Math.random() * agents.length) | 0].status = pool[(Math.random() * pool.length) | 0];
			stats.runsToday  += (Math.random() * 25 + 8) | 0;
			stats.activeNow   = 58 + ((Math.random() * 12) | 0);
			stats.avgLatency  = 430 + ((Math.random() * 80) | 0);
			stats.mergeHealth = +(98 + Math.random() * 1.7).toFixed(1);
		}, 1700);
		return () => clearInterval(iv);
	});
</script>

<svelte:head>
	<title>Subagents | JamCat</title>
</svelte:head>

<!-- TICKER -->
<div class="border-b border-white/5 bg-black/40 py-2.5 backdrop-blur-xl overflow-hidden">
	<div class="flex whitespace-nowrap" style="animation: marquee 40s linear infinite;">
		{#each [TICKER, TICKER] as t}
			<span class="mr-0 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">{t}</span>
		{/each}
	</div>
</div>

<!-- PAGE -->
<div class="relative min-h-screen overflow-hidden bg-[#09090f]">

	<!-- ambient orbs -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-32 left-1/3 h-[500px] w-[500px] rounded-full opacity-15 blur-[120px]"
			 style="background:radial-gradient(circle,#22d3ee,transparent 70%)"></div>
		<div class="absolute top-1/2 -right-20 h-[400px] w-[400px] rounded-full opacity-10 blur-[100px]"
			 style="background:radial-gradient(circle,#818cf8,transparent 70%)"></div>
		<div class="absolute bottom-0 left-10 h-[300px] w-[300px] rounded-full opacity-8 blur-[90px]"
			 style="background:radial-gradient(circle,#34d399,transparent 70%)"></div>
	</div>

	<!-- subtle grid overlay -->
	<div class="pointer-events-none absolute inset-0 opacity-[0.03]"
		 style="background-image:linear-gradient(rgba(34,211,238,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.6) 1px,transparent 1px);background-size:40px 40px"></div>

	<div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">

		<!-- ── HERO ── -->
		<div class="mb-10 text-center" in:fly={{ y: -24, duration: 500 }}>
			<div class="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"></span>
				</span>
				<span class="text-[11px] font-black uppercase tracking-widest text-cyan-300">
					Swarm Live · {stats.totalSubagents.toLocaleString()} agents indexed
				</span>
			</div>

			<h1 class="mb-3 text-5xl font-black tracking-tighter sm:text-7xl">
				<span class="bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">Subagents</span>
				<span class="text-white/20"> /</span>
				<span class="text-white"> Swarm</span>
			</h1>
			<p class="mx-auto max-w-md text-sm text-white/35">
				Parallel specialists for research, hooks, code & release. Each agent runs its lane — orchestrated, observable, composable.
			</p>
		</div>

		<!-- ── STATS ROW ── -->
		<div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4" in:fly={{ y: 20, duration: 500, delay: 80 }}>
			{#each [
				{ icon: '🧬', label: 'Indexed',      value: stats.totalSubagents.toLocaleString(), sub: '+3.2K today',  accent: '#22d3ee' },
				{ icon: '🟢', label: 'Active Now',   value: stats.activeNow,                        sub: 'running live', accent: '#34d399' },
				{ icon: '⚡', label: 'Runs Today',   value: stats.runsToday.toLocaleString(),       sub: '+1.9K/hr',     accent: '#e879f9' },
				{ icon: '🛡️', label: 'Merge Health', value: `${stats.mergeHealth}%`,                sub: 'nominal',      accent: '#fb923c' }
			] as s, i}
				<div class="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
					 in:fly={{ y: 20, duration: 400, delay: 100 + i * 60 }}>
					<!-- corner glow -->
					<div class="absolute -top-6 -right-6 h-16 w-16 rounded-full opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-40"
						 style="background:{s.accent}"></div>
					<p class="text-[10px] font-black uppercase tracking-widest text-white/30">{s.icon} {s.label}</p>
					<p class="mt-1 font-mono text-2xl font-black text-white">{s.value}</p>
					<p class="text-[10px]" style="color:{s.accent}">{s.sub}</p>
				</div>
			{/each}
		</div>

		<!-- ── MAIN LAYOUT ── -->
		<div class="flex flex-col gap-6 lg:flex-row">

			<!-- LEFT: filters + cards -->
			<div class="min-w-0 flex-1">

				<!-- filter bar -->
				<div class="mb-5 flex flex-wrap items-center gap-2" in:fly={{ x: -20, duration: 400, delay: 200 }}>
					{#each categories as cat (cat.key)}
						<button
							onclick={() => activeCategory = cat.key}
							class="rounded-full border px-3 py-1 text-xs font-black transition-all duration-150
								   {activeCategory === cat.key
								     ? 'border-cyan-400 bg-cyan-400 text-black shadow-lg shadow-cyan-400/30'
								     : 'border-white/10 bg-white/5 text-white/40 hover:border-cyan-400/40 hover:text-cyan-300'}"
						>{cat.label}</button>
					{/each}

					<div class="ml-auto flex items-center gap-2">
						<div class="flex items-center rounded-xl border border-white/10 bg-black/40 p-0.5">
							{#each viewModes as mode (mode.key)}
								<button
									onclick={() => viewMode = mode.key}
									class="rounded-lg px-3 py-1.5 text-xs font-black transition-all duration-150
										   {viewMode === mode.key ? 'bg-cyan-400 text-black shadow' : 'text-white/30 hover:text-white'}"
								>{mode.label}</button>
							{/each}
						</div>
						<input
							bind:value={searchQuery}
							placeholder="🔍 Search agents…"
							class="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
						/>
					</div>
				</div>

				<!-- ── LEADERBOARD VIEW ── -->
				{#if viewMode === 'leaderboard'}
					<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl" in:fade={{ duration: 200 }}>
						<div class="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 border-b border-white/8 bg-white/3 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white/20">
							<span>#</span><span>Agent</span><span class="text-right">Runs</span><span class="text-right">SR</span><span class="text-right">Latency</span>
						</div>
						{#each leaderboard as agent, i (agent.id)}
							<div class="grid grid-cols-[2rem_1fr_auto_auto_auto] items-center gap-x-4 border-b border-white/5 px-5 py-3 transition-colors hover:bg-white/3"
								 in:fly={{ x: -15, duration: 250, delay: i * 30 }}>
								<span class="font-mono text-sm font-black {i===0?'text-amber-400':i===1?'text-slate-300':i===2?'text-orange-500':'text-white/20'}">{i+1}</span>
								<div class="flex items-center gap-3">
									<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl ring-1 {agent.color.ring} {agent.color.bg}">{agent.avatar}</div>
									<div>
										<p class="text-sm font-bold {agent.color.text}">{agent.name}</p>
										<p class="text-[10px] text-white/25">{agent.specialty}</p>
									</div>
								</div>
								<span class="text-right font-mono text-sm font-bold text-white">{agent.runsCompleted.toLocaleString()}</span>
								<span class="text-right font-mono text-sm font-bold {agent.successRate>=97?'text-emerald-400':agent.successRate>=94?'text-yellow-400':'text-red-400'}">{agent.successRate}%</span>
								<span class="text-right font-mono text-sm font-bold text-cyan-300">{fmtLatency(agent.latencyMs)}</span>
							</div>
						{/each}
					</div>

				<!-- ── GRID VIEW ── -->
				{:else if filteredAgents.length === 0}
					<div class="py-20 text-center text-white/20">No agents match this filter.</div>
				{:else}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{#each filteredAgents as agent, i (agent.id)}
							<div class="group relative flex flex-col overflow-hidden rounded-3xl border bg-white/3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl {agent.color.border} {agent.color.glow}"
								 in:fly={{ y: 20, duration: 350, delay: i * 50 }}>

								<!-- top accent bar -->
								<div class="h-0.5 w-full opacity-60" style="background:linear-gradient(90deg,transparent,{agent.color.hex},transparent)"></div>

								<!-- PRIME badge -->
								{#if agent.runsCompleted > 16000}
									<div class="absolute top-3 right-3 z-10">
										<span class="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black text-black">PRIME</span>
									</div>
								{/if}

								<div class="flex flex-1 flex-col p-5">

									<!-- header -->
									<div class="mb-4 flex items-start justify-between">
										<div class="flex items-center gap-3">
											<div class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ring-2 transition-transform duration-300 group-hover:scale-110 {agent.color.ring} {agent.color.bg}">
												{agent.avatar}
												<!-- status dot -->
												<div class="absolute -right-1 -bottom-1">
													{#if agent.status === 'running'}
														<span class="flex h-3 w-3">
															<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
															<span class="relative inline-flex h-3 w-3 rounded-full border-2 border-[#09090f] bg-emerald-400"></span>
														</span>
													{:else if agent.status === 'busy'}
														<span class="flex h-3 w-3">
															<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
															<span class="relative inline-flex h-3 w-3 rounded-full border-2 border-[#09090f] bg-yellow-400"></span>
														</span>
													{:else}
														<span class="h-3 w-3 rounded-full border-2 border-[#09090f] bg-white/20"></span>
													{/if}
												</div>
											</div>
											<div>
												<p class="font-black {agent.color.text}">{agent.name}</p>
												<p class="text-[11px] leading-tight text-white/35">{agent.specialty}</p>
											</div>
										</div>
										<span class="rounded-full px-2 py-0.5 text-[9px] font-black uppercase
											   {agent.status==='running'?'bg-emerald-400/15 text-emerald-400':agent.status==='busy'?'bg-yellow-400/15 text-yellow-400':'bg-white/10 text-white/30'}">
											{agent.status}
										</span>
									</div>

									<!-- tools + model -->
									<div class="mb-3">
										<p class="mb-1.5 text-[9px] font-black uppercase tracking-widest text-white/20">Toolchain</p>
										<div class="flex flex-wrap gap-1">
											{#each agent.tools as tool (tool)}
												<span class="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-white/40 hover:bg-white/10 transition-colors">{tool}</span>
											{/each}
											<span class="rounded-full px-2 py-0.5 text-[10px] font-bold {agent.color.badge}">🧠 {agent.model}</span>
										</div>
									</div>

									<!-- capabilities -->
									<div class="mb-3">
										<p class="mb-1.5 text-[9px] font-black uppercase tracking-widest text-white/20">Capabilities</p>
										<div class="grid grid-cols-2 gap-1">
											{#each agent.capabilities as cap (cap)}
												<span class="rounded-lg border px-2 py-1 text-center text-[10px] font-medium {agent.color.border} {agent.color.bg} {agent.color.text} transition-opacity hover:opacity-80">{cap}</span>
											{/each}
										</div>
									</div>

									<!-- last action — terminal style -->
									<div class="mb-4 rounded-xl border border-white/5 bg-black/50 px-3 py-2.5 font-mono">
										<p class="mb-0.5 text-[9px] text-white/20">› LAST ACTION</p>
										<p class="text-[11px] leading-snug text-white/55 italic">"{agent.lastAction}"</p>
									</div>

									<!-- metrics row -->
									<div class="mb-4 grid grid-cols-3 gap-2">
										{#each [
											{ val: agent.runsCompleted.toLocaleString(), lbl: 'runs',    col: 'text-emerald-400' },
											{ val: `${agent.costPerRun} cr`,             lbl: 'per run', col: 'text-yellow-400'  },
											{ val: fmtLatency(agent.latencyMs),          lbl: 'latency', col: 'text-cyan-400'    }
										] as m (m.lbl)}
											<div class="rounded-xl bg-black/40 p-2 text-center">
												<p class="font-mono text-xs font-black {m.col}">{m.val}</p>
												<p class="text-[9px] text-white/20">{m.lbl}</p>
											</div>
										{/each}
									</div>

									<!-- success bar -->
									<div class="mb-4">
										<div class="mb-1.5 flex justify-between text-[10px]">
											<span class="text-white/30">Success rate</span>
											<span class="font-black {agent.successRate>=97?'text-emerald-400':agent.successRate>=94?'text-yellow-400':'text-red-400'}">{agent.successRate}%</span>
										</div>
										<div class="h-1.5 overflow-hidden rounded-full bg-white/5">
											<div class="h-full rounded-full transition-all duration-500"
												 style="width:{agent.successRate}%;background:{agent.color.hex}"></div>
										</div>
									</div>

									<!-- spawn button -->
									<button
										onclick={() => openModal(agent)}
										class="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-black transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95 {agent.color.border} {agent.color.bg} {agent.color.text}"
									>
										<span>🧬 Spawn from {agent.name}</span>
										<span>→</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- RIGHT SIDEBAR -->
			<div class="w-full lg:w-72 lg:shrink-0">
				<div class="flex flex-col gap-4 lg:sticky lg:top-20">

					<!-- spawn CTA -->
					<div class="rounded-2xl border border-cyan-400/25 bg-cyan-400/8 p-5 text-center backdrop-blur-xl"
						 in:fly={{ x: 20, duration: 400, delay: 100 }}>
						<p class="mb-1 text-sm font-black text-white">Spawn a New Agent</p>
						<p class="mb-4 text-xs text-white/35">Fork a specialist for a narrower task in under a minute.</p>
						<button
							onclick={() => openModal(null)}
							class="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 py-2.5 text-sm font-black text-black shadow-lg shadow-cyan-400/25 transition-all hover:scale-[1.02] hover:opacity-90 active:scale-95"
						>
							🧬 Spawn Agent
						</button>
					</div>

					<!-- swarm health -->
					<div class="rounded-2xl border border-white/8 bg-white/3 p-4 backdrop-blur-xl"
						 in:fly={{ x: 20, duration: 400, delay: 160 }}>
						<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-white/30">📡 Swarm Health</p>
						<div class="space-y-3">
							<div>
								<div class="mb-1 flex justify-between text-xs text-white/40">
									<span>Merge Health</span>
									<span class="font-black text-emerald-400">{stats.mergeHealth}%</span>
								</div>
								<div class="h-1.5 rounded-full bg-white/5">
									<div class="h-full rounded-full bg-emerald-400 transition-all duration-500" style="width:{stats.mergeHealth}%"></div>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-2">
								<div class="rounded-xl bg-white/5 p-3 text-center">
									<p class="font-mono text-lg font-black text-cyan-300">{stats.avgLatency}ms</p>
									<p class="text-[9px] text-white/25">avg latency</p>
								</div>
								<div class="rounded-xl bg-white/5 p-3 text-center">
									<p class="font-mono text-lg font-black text-violet-300">{stats.orchestrators}</p>
									<p class="text-[9px] text-white/25">orchestrators</p>
								</div>
							</div>
						</div>
					</div>

					<!-- top performers -->
					<div class="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 backdrop-blur-xl"
						 in:fly={{ x: 20, duration: 400, delay: 220 }}>
						<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-400">🏆 Top Performers</p>
						<div class="space-y-2">
							{#each topPerformers as agent, i (agent.id)}
								<div class="flex items-center justify-between gap-2">
									<span class="shrink-0 font-mono text-xs font-black {i===0?'text-amber-400':i===1?'text-slate-300':'text-white/20'}">{i+1}</span>
									<div class="flex min-w-0 flex-1 items-center gap-2">
										<span class="shrink-0 text-sm">{agent.avatar}</span>
										<span class="truncate text-xs font-bold {agent.color.text}">{agent.name}</span>
									</div>
									<span class="shrink-0 font-mono text-xs font-black text-amber-300">{agent.successRate}%</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- live activity — terminal log -->
					<div class="rounded-2xl border border-white/8 bg-white/3 p-4 backdrop-blur-xl"
						 in:fly={{ x: 20, duration: 400, delay: 280 }}>
						<div class="mb-3 flex items-center gap-2">
							<span class="relative flex h-2 w-2">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
								<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
							</span>
							<p class="text-[10px] font-black uppercase tracking-widest text-white/30">Live Activity</p>
						</div>
						<div class="max-h-80 space-y-1.5 overflow-y-auto pr-0.5 font-mono">
							{#each activityFeed as entry (entry.id)}
								<div class="rounded-lg border border-white/4 bg-black/40 px-2.5 py-2"
									 in:fly={{ x: 10, duration: 200 }}>
									<p class="text-[10px] leading-snug text-white/50">{entry.text}</p>
									<div class="mt-0.5 flex justify-between">
										<span class="text-[9px] text-white/20">{entry.ts}</span>
										<span class="text-[9px] text-amber-400/70">{entry.cost} cr</span>
									</div>
								</div>
							{/each}
						</div>
					</div>

				</div>
			</div>
		</div>
	</div>
</div>

<!-- ── MODAL ── -->
{#if showModal}
	<button
		onclick={() => showModal = false}
		class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
		in:fade={{ duration: 150 }}
		aria-label="Close"
	></button>

	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" in:scale={{ duration: 300, easing: elasticOut, start: 0.9 }}>
		<div class="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-400/25 bg-[#0c0c18] shadow-2xl shadow-cyan-500/20">

			<!-- top accent -->
			<div class="h-0.5 w-full" style="background:linear-gradient(90deg,transparent,#22d3ee,transparent)"></div>

			<div class="p-6">
				<button onclick={() => showModal = false} class="absolute top-4 right-4 text-white/20 transition hover:text-white" aria-label="Close">✕</button>

				{#if spawnSuccess}
					<div class="py-10 text-center" in:scale={{ duration: 400, easing: elasticOut }}>
						<div class="mb-4 text-6xl">🧬</div>
						<p class="text-lg font-black text-emerald-400">Agent Spawned!</p>
						<p class="mt-1 text-sm text-white/40">"{form.name}" is now queued in the swarm.</p>
					</div>
				{:else}
					<h2 class="mb-5 text-lg font-black text-white">
						🧬 {selectedAgent ? `Fork ${selectedAgent.name}` : 'New Subagent'}
					</h2>
					<div class="space-y-4">
						<div>
							<label class="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Agent Name *</label>
							<input bind:value={form.name} placeholder="e.g. HookLab Nightshift"
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20" />
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Model</label>
								<select bind:value={form.model}
									class="w-full rounded-xl border border-white/10 bg-[#0f0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50">
									{#each ['GPT-5', 'Claude', 'Codex', 'Gemini', 'DeepSeek'] as m (m)}
										<option value={m}>{m}</option>
									{/each}
								</select>
							</div>
							<div>
								<label class="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Category</label>
								<select bind:value={form.category}
									class="w-full rounded-xl border border-white/10 bg-[#0f0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50">
									{#each categories.slice(1) as cat (cat.key)}
										<option value={cat.key}>{cat.label}</option>
									{/each}
								</select>
							</div>
						</div>

						<div>
							<label class="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Mission</label>
							<textarea bind:value={form.description} rows="3" placeholder="What should this agent own?"
								class="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50"></textarea>
						</div>

						<fieldset>
							<legend class="mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">Tool Access</legend>
							<div class="flex flex-wrap gap-2">
								{#each ['Search', 'Git', 'Assets', 'Analytics', 'Scheduler', 'Publishing'] as tool (tool)}
									<label class="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40 transition hover:border-cyan-400/40 hover:text-cyan-300">
										<input type="checkbox" class="accent-cyan-400" bind:group={form.tools} value={tool} />
										{tool}
									</label>
								{/each}
							</div>
						</fieldset>

						<button
							onclick={handleSpawn}
							disabled={!form.name || spawnLoading}
							class="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 py-3 text-sm font-black text-black shadow-lg shadow-cyan-400/25 transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
						>
							{spawnLoading ? '⏳ Spawning…' : `🧬 ${selectedAgent ? `Fork ${selectedAgent.name}` : 'Spawn to Swarm'}`}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
