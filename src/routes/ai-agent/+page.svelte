<script>
	import { onMount } from 'svelte';

	// ── COLOR SYSTEM (Violet/Indigo spectrum) ──
	const agentColors = [
		{ ring: 'ring-violet-400', text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/30', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]', bar: 'bg-violet-400', gradient: 'from-violet-500 to-purple-600' },
		{ ring: 'ring-indigo-400', text: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/30', glow: 'shadow-[0_0_20px_rgba(129,140,248,0.3)]', bar: 'bg-indigo-400', gradient: 'from-indigo-500 to-blue-600' },
		{ ring: 'ring-fuchsia-400', text: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/30', glow: 'shadow-[0_0_20px_rgba(232,121,249,0.3)]', bar: 'bg-fuchsia-400', gradient: 'from-fuchsia-500 to-pink-600' },
		{ ring: 'ring-cyan-400', text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]', bar: 'bg-cyan-400', gradient: 'from-cyan-500 to-teal-600' },
		{ ring: 'ring-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]', bar: 'bg-emerald-400', gradient: 'from-emerald-500 to-green-600' },
	];

	// ── SKILLS/CATEGORIES ──
	const skills = [
		{ id: 'trading', label: 'Trading', icon: '📈', color: agentColors[0] },
		{ id: 'research', label: 'Research', icon: '🔬', color: agentColors[1] },
		{ id: 'creative', label: 'Creative', icon: '🎨', color: agentColors[2] },
		{ id: 'analysis', label: 'Analysis', icon: '📊', color: agentColors[3] },
		{ id: 'security', label: 'Security', icon: '🔒', color: agentColors[4] },
	];

	// ── STATE ──
	let agents = $state([]);
	let featured = $state([]);
	let activityFeed = $state([]);
	let activeSkill = $state('all');
	let viewMode = $state('grid');

	let stats = $state({
		activeAgents: 0,
		totalTasks: 0,
		computeHours: 0,
		rewardsEarned: 0
	});

	let sparklineData = $state(Array.from({ length: 12 }, () => Math.random() * 100));

	// ── AGENT DATA GENERATION ──
	const agentNames = ['NOVA', 'PULSE', 'ECHO', 'SURGE', 'DRIFT', 'FLUX', 'CIPHER', 'NEXUS', 'QUANTUM', 'VERTEX', 'ORBIT', 'PRISM'];
	const agentTasks = [
		'Analyzing market sentiment data',
		'Generating trading signals',
		'Researching competitor strategies',
		'Creating content assets',
		'Processing document analysis',
		'Monitoring security alerts',
		'Optimizing portfolio allocation',
		'Synthesizing research reports',
		'Generating code solutions',
		'Running predictive models'
	];

	const integrations = [
		{ name: 'Slack', icon: '💬' },
		{ name: 'GitHub', icon: '🐙' },
		{ name: 'Figma', icon: '🎨' },
		{ name: 'Notion', icon: '📝' },
		{ name: 'API', icon: '🔌' },
		{ name: 'Database', icon: '🗄️' },
	];

	function makeAgent(name, i) {
		const skill = skills[i % skills.length];
		const agentIntegrations = integrations.slice(0, Math.floor(Math.random() * 3) + 2);
		return {
			id: i + 1,
			name,
			color: agentColors[i % agentColors.length],
			skill,
			integrations: agentIntegrations,
			tasksCompleted: Math.floor(Math.random() * 2000) + 500,
			successRate: (Math.random() * 15 + 85).toFixed(1),
			uptime: Math.floor(Math.random() * 60) + 10,
			currentTask: agentTasks[i % agentTasks.length],
			traits: {
				speed: Math.floor(Math.random() * 30 + 70),
				accuracy: Math.floor(Math.random() * 20 + 80),
				creativity: Math.floor(Math.random() * 40 + 60),
				logic: Math.floor(Math.random() * 25 + 75),
			},
			costPerTask: (Math.random() * 0.01 + 0.001).toFixed(4),
			monthlyUsage: Math.floor(Math.random() * 500) + 100,
			securityRating: Math.random() > 0.3 ? 'Enterprise' : 'Standard',
		};
	}

	function generateAgents() {
		agents = agentNames.map(makeAgent);
		featured = agents.slice(0, 6);
		stats.activeAgents = agents.length;
		stats.totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
		stats.computeHours = agents.reduce((sum, a) => sum + a.uptime, 0);
		stats.rewardsEarned = (agents.reduce((sum, a) => sum + a.tasksCompleted * parseFloat(a.costPerTask), 0)).toFixed(2);
	}

	function addActivity() {
		const agent = agents[Math.floor(Math.random() * agents.length)];
		const actions = ['completed task', 'started analysis', 'generated output', 'optimized workflow', 'processed data'];
		const action = actions[Math.floor(Math.random() * actions.length)];
		activityFeed = [
			{ id: Date.now(), agent: agent.name, action, time: 'just now', color: agent.color },
			...activityFeed.slice(0, 19)
		];
	}

	onMount(() => {
		generateAgents();
		
		// Initial activity feed
		for (let i = 0; i < 8; i++) {
			addActivity();
		}

		// Real-time updates
		const interval = setInterval(() => {
			addActivity();
			sparklineData = sparklineData.map(() => Math.random() * 100);
		}, 3000);

		return () => clearInterval(interval);
	});

	// ── FILTERS ──
	let filteredAgents = $derived(
		activeSkill === 'all' 
			? agents 
			: agents.filter(a => a.skill.id === activeSkill)
	);

	// ── FORMATTERS ──
	const fmtNum = (n) => n.toLocaleString();
	const fmtPct = (n) => `${n}%`;
</script>

<svelte:head>
	<title>AI Agents | JamCat</title>
	<meta name="description" content="Autonomous AI agent marketplace - discover, deploy, and monitor intelligent agents." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Source+Sans+3:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Page wrapper with dark futuristic background -->
<div class="ai-agent-page relative min-h-screen overflow-hidden bg-[#0a0814] text-white font-sans">

	<!-- Ambient background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-violet-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-fuchsia-500/5 blur-[100px]"></div>
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">

		<!-- ── HEADER ── -->
		<header class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
			<div class="flex items-start gap-4">
				<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-3xl shadow-2xl shadow-violet-500/10 ring-1 ring-violet-500/20">
					🤖
				</div>
				<div>
					<h1 class="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl">
						AI Agents
						<span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Marketplace</span>
					</h1>
					<p class="mt-2 max-w-lg text-sm text-white/40">Autonomous intelligence marketplace - discover, deploy, and monitor AI agents with real-time performance metrics.</p>
					<div class="mt-3 flex items-center gap-4">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 animate-pulse rounded-full bg-violet-400"></div>
							<span class="text-[10px] font-bold uppercase tracking-wider text-violet-400/60">Live</span>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<button onclick={() => viewMode = 'grid'}
					class="rounded-xl border px-3 py-2 text-sm transition {viewMode === 'grid' ? 'border-violet-500/40 bg-violet-500/10 text-violet-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					⊞
				</button>
				<button onclick={() => viewMode = 'list'}
					class="rounded-xl border px-3 py-2 text-sm transition {viewMode === 'list' ? 'border-violet-500/40 bg-violet-500/10 text-violet-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					☰
				</button>
			</div>
		</header>

		<!-- ── STATS BAR ── -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each [
				{ label: 'Active Agents', value: fmtNum(stats.activeAgents), icon: '🤖', key: 'agents' },
				{ label: 'Total Tasks', value: fmtNum(stats.totalTasks), icon: '✓', key: 'tasks' },
				{ label: 'Compute Hours', value: fmtNum(stats.computeHours) + 'h', icon: '⚡', key: 'compute' },
				{ label: 'Rewards', value: '$' + stats.rewardsEarned, icon: '💎', key: 'rewards' },
			] as stat (stat.key)}
				<div class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10">
					<div class="flex justify-between items-start mb-2">
						<p class="text-[10px] uppercase tracking-widest text-white/30">{stat.icon} {stat.label}</p>
					</div>
					<p class="text-2xl font-extrabold text-white">{stat.value}</p>
					<div class="mt-3 h-6 flex items-end gap-0.5">
						{#each sparklineData as height, idx (idx)}
							<div class="flex-1 bg-gradient-to-t from-violet-400/10 to-violet-400/30 rounded-t transition-all" style="height: {height}%"></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- ── TRENDING STRIP ── -->
		<div class="mb-8">
			<div class="mb-4 flex items-center gap-3">
				<span class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-xs">🔥</span>
				<span class="text-xs font-black uppercase tracking-widest text-white/40">Featured Agents</span>
			</div>
			<div class="flex gap-3 overflow-x-auto pb-2">
				{#each featured as agent (agent.id)}
					<div class="group flex shrink-0 items-center gap-3 rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.03] to-transparent p-3 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br {agent.color.gradient} text-lg font-black text-white/90">
							{agent.name[0]}
						</div>
						<div>
							<p class="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">AGENT_{agent.name}</p>
							<span class="rounded-md px-1.5 py-0.5 text-[9px] font-black" style="background:{agent.color.text}22;color:{agent.color.text}">{agent.skill.label}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── SKILL FILTER ── -->
		<div class="mb-6 flex flex-wrap items-center gap-2">
			<button onclick={() => activeSkill = 'all'}
				class="rounded-lg border px-3 py-1.5 text-xs font-bold transition {activeSkill === 'all' ? 'border-violet-500/40 bg-violet-500/10 text-violet-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
				All Skills
			</button>
			{#each skills as skill (skill.id)}
				<button onclick={() => activeSkill = skill.id}
					class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition {activeSkill === skill.id ? 'border-violet-500/40 bg-violet-500/10 text-violet-400' : 'border-white/10 text-white/40 hover:text-white/70'}">
					<span>{skill.icon}</span>
					{skill.label}
				</button>
			{/each}
		</div>

		<!-- ── MAIN CONTENT ── -->
		<div class="flex flex-col gap-6 lg:flex-row">

			<!-- Left: Agent Grid -->
			<div class="flex-1 min-w-0">
				{#if viewMode === 'grid'}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each filteredAgents as agent (agent.id)}
							<div class="group relative overflow-hidden rounded-xl border {agent.color.border} bg-white/[0.015] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.035] hover:{agent.color.glow}">
								
								<!-- Ambient glow -->
								<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full {agent.color.bg} blur-2xl opacity-0 transition-opacity group-hover:opacity-100"></div>

								<!-- Header -->
								<div class="relative z-10 mb-4 flex items-start justify-between">
									<div class="flex items-center gap-3">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br {agent.color.gradient} text-lg font-black text-white/90 ring-1 {agent.color.ring}">
											{agent.name[0]}
										</div>
										<div>
											<p class="text-sm font-bold {agent.color.text}">AGENT_{agent.name}</p>
											<span class="rounded-md px-1.5 py-0.5 text-[9px] font-black" style="background:{agent.color.text}22;color:{agent.color.text}">{agent.skill.label}</span>
										</div>
									</div>
									{#if agent.securityRating === 'Enterprise'}
										<span class="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-black text-emerald-400">ENT</span>
									{/if}
								</div>

								<!-- Current Task -->
								<div class="relative z-10 mb-4 rounded-xl border border-white/5 bg-black/30 px-3 py-2">
									<p class="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Current Task</p>
									<p class="truncate text-[11px] text-violet-300/80">↳ {agent.currentTask}</p>
								</div>

								<!-- Metrics -->
								<div class="relative z-10 mb-4 grid grid-cols-3 gap-2 text-center text-[10px]">
									<div class="rounded-lg bg-white/[0.03] p-2">
										<p class="font-bold text-white">{fmtNum(agent.tasksCompleted)}</p>
										<p class="text-white/30">Tasks</p>
									</div>
									<div class="rounded-lg bg-white/[0.03] p-2">
										<p class="font-bold text-white">{fmtPct(agent.successRate)}</p>
										<p class="text-white/30">Success</p>
									</div>
									<div class="rounded-lg bg-white/[0.03] p-2">
										<p class="font-bold text-white">{agent.uptime}h</p>
										<p class="text-white/30">Uptime</p>
									</div>
								</div>

								<!-- Traits -->
								<div class="relative z-10 mb-4 space-y-1.5">
									{#each ['speed', 'accuracy', 'creativity', 'logic'] as trait (trait)}
										<div class="flex items-center gap-2">
											<span class="w-12 text-[9px] text-white/30 uppercase tracking-wider shrink-0">{trait}</span>
											<div class="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
												<div class="h-full rounded-full {agent.color.bar} transition-all duration-700" style="width: {agent.traits[trait]}%"></div>
											</div>
											<span class="text-[9px] font-bold {agent.color.text} w-6 text-right">{agent.traits[trait]}</span>
										</div>
									{/each}
								</div>

								<!-- Integrations -->
								<div class="relative z-10 mb-4 flex flex-wrap gap-1">
									{#each agent.integrations as integ (integ.name)}
										<span class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] text-white/50">{integ.icon} {integ.name}</span>
									{/each}
								</div>

								<!-- Actions -->
								<div class="relative z-10 flex gap-2">
									<button class="flex-1 rounded-lg bg-violet-500/10 border border-violet-500/20 py-2 text-[10px] font-bold text-violet-400 transition hover:bg-violet-500/20">Deploy</button>
									<button class="flex-1 rounded-lg bg-white/5 border border-white/10 py-2 text-[10px] font-bold text-white/50 transition hover:bg-white/10 hover:text-white/70">Chat</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e0e]">
						<div class="grid grid-cols-[3rem_1fr_4rem_4rem_4rem] items-center gap-2 border-b border-white/[0.05] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white/20">
							<span></span>
							<span>Agent</span>
							<span class="text-right">Tasks</span>
							<span class="text-right">Success</span>
							<span></span>
						</div>
						{#each filteredAgents as agent (agent.id)}
							<div class="grid grid-cols-[3rem_1fr_4rem_4rem_4rem] items-center gap-2 border-b border-white/[0.03] px-4 py-3 text-xs transition hover:bg-white/[0.03] last:border-0">
								<div class="flex justify-center">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br {agent.color.gradient} text-[10px] font-black text-white/90">
										{agent.name[0]}
									</div>
								</div>
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-bold {agent.color.text}">AGENT_{agent.name}</span>
										<span class="rounded px-1 py-0.5 text-[8px] font-black" style="background:{agent.color.text}22;color:{agent.color.text}">{agent.skill.label}</span>
									</div>
									<p class="truncate text-[10px] text-white/30">{agent.currentTask}</p>
								</div>
								<p class="text-right font-bold text-white">{fmtNum(agent.tasksCompleted)}</p>
								<p class="text-right font-bold text-emerald-400">{fmtPct(agent.successRate)}</p>
								<div class="flex justify-center gap-1">
									<button class="rounded border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[9px] font-bold text-violet-400 transition hover:bg-violet-500/20">Deploy</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Right: Sidebar -->
			<div class="flex shrink-0 flex-col gap-4 lg:w-72 xl:w-80">

				<!-- Activity Feed -->
				<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
					<div class="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-3">
						<div class="flex items-center gap-2">
							<p class="text-sm font-bold text-white">⚡ Live Activity</p>
							<span class="rounded-full bg-violet-400/20 px-2 py-0.5 text-[9px] font-black text-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.3)]">LIVE</span>
						</div>
					</div>
					<ul class="max-h-72 divide-y divide-white/[0.04] overflow-y-auto">
						{#each activityFeed as activity (activity.id)}
							<li class="px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02]">
								<div class="flex items-center gap-2">
									<span class="font-bold {activity.color.text}">AGENT_{activity.agent}</span>
									<span class="text-white/50">{activity.action}</span>
								</div>
								<p class="mt-0.5 text-[9px] text-white/30">{activity.time}</p>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Skills Catalog -->
				<div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-sm">
					<div class="border-b border-white/5 bg-black/20 px-4 py-3">
						<div class="flex items-center gap-2">
							<p class="text-sm font-bold text-white">🎯 Skills Catalog</p>
						</div>
					</div>
					<ul class="divide-y divide-white/[0.04]">
						{#each skills as skill (skill.id)}
							<button onclick={() => activeSkill = skill.id}
								class="flex items-center justify-between w-full px-4 py-2.5 text-[11px] transition-colors hover:bg-white/[0.02] {activeSkill === skill.id ? 'bg-violet-500/5' : ''}">
								<div class="flex items-center gap-2">
									<span class="text-base">{skill.icon}</span>
									<span class="text-white/70">{skill.label}</span>
								</div>
								<span class="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black text-white/50">
									{agents.filter(a => a.skill.id === skill.id).length}
								</span>
							</button>
						{/each}
					</ul>
				</div>

				<!-- Cost Analytics -->
				<div class="rounded-2xl border border-white/5 bg-white/[0.015] p-4 backdrop-blur-sm">
					<div class="flex items-center justify-between mb-3">
						<p class="text-xs font-bold text-white">💰 Cost Analytics</p>
						<span class="text-[9px] text-white/30 uppercase tracking-wider">Est. Monthly</span>
					</div>
					<div class="space-y-2">
						{#each agents.slice(0, 5) as agent (agent.id)}
							<div class="flex items-center justify-between text-[10px]">
								<span class="text-white/50">AGENT_{agent.name}</span>
								<span class="font-bold text-white">${(agent.monthlyUsage * parseFloat(agent.costPerTask)).toFixed(2)}</span>
							</div>
						{/each}
					</div>
					<div class="mt-3 pt-3 border-t border-white/5 text-[10px] text-white/30">
						<div class="flex justify-between">
							<span>Total Estimated</span>
							<span class="font-bold text-white">${agents.reduce((sum, a) => sum + a.monthlyUsage * parseFloat(a.costPerTask), 0).toFixed(2)}</span>
						</div>
					</div>
				</div>

			</div>
		</div>
	</div>
</div>

<style>
	.ai-agent-page {
		font-family: 'Source Sans 3', sans-serif;
	}
</style>
