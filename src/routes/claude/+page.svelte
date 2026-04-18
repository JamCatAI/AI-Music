<script>
	import { onMount } from 'svelte';

	const TICKER =
		'🧪 CLAUDE LAB · ANTHROPIC · OPUS 4.6 · SONNET 4.6 · HAIKU 4.5 · SWE-BENCH · SAFE TOOLING · CODE · VISION · COST';

	const CLAUDE_MODELS = [
		{
			id: 'opus',
			name: 'Claude Opus 4.6',
			tier: 'Flagship',
			mmlu: 90.5,
			humaneval: 80.8,
			math: 95.0,
			priceIn: 5,
			priceOut: 25.0,
			latencyMs: 140,
			context: 1_000_000,
			speed: 50,
			vision: true,
			tools: true,
			health: 'steady',
			color: 'violet',
			tags: ['Reasoning', 'Long Context', 'Code', 'Safety'],
			copy: 'Deep verification style tasks, long-form drafting, and orchestration work.'
		},
		{
			id: 'sonnet',
			name: 'Claude Sonnet 4.6',
			tier: 'Balanced',
			mmlu: 90.2,
			humaneval: 85.4,
			math: 92.6,
			priceIn: 3,
			priceOut: 15,
			latencyMs: 95,
			context: 1_000_000,
			speed: 75,
			vision: true,
			tools: true,
			health: 'steady',
			color: 'blue',
			tags: ['Stable', 'Production', 'Coding', 'Vision'],
			copy: 'Strong daily-driver model with resilient tool-calling behavior at scale.'
		},
		{
			id: 'haiku',
			name: 'Claude Haiku 4.5',
			tier: 'Cost-Efficient',
			mmlu: 88.8,
			humaneval: 83.1,
			math: 89.1,
			priceIn: 0.8,
			priceOut: 4,
			latencyMs: 60,
			context: 200_000,
			speed: 98,
			vision: true,
			tools: true,
			health: 'steady',
			color: 'cyan',
			tags: ['Low Cost', 'Throughput', 'Multitask'],
			copy: 'Great for high-volume apps and quick synthesis loops with lower spend.'
		},
		{
			id: 'mini',
			name: 'Claude Mini',
			tier: 'Compact',
			mmlu: 86.7,
			humaneval: 77.8,
			math: 84.0,
			priceIn: 0.25,
			priceOut: 0.8,
			latencyMs: 42,
			context: 128_000,
			speed: 120,
			vision: false,
			tools: true,
			health: 'steady',
			color: 'indigo',
			tags: ['Batch', 'Automation', 'Summarization'],
			copy: 'Built for scale jobs where response speed and cost dominate the margin.'
		}
	];

	const USE_CASES = [
		{ title: 'SWE-bench / Tooling', winner: 'Opus 4.6', why: 'Highest reasoning consistency for verification and refactor workflows.' },
		{ title: 'Agent Workloads', winner: 'Sonnet 4.6', why: 'Balanced quality/speed with stable tool orchestration behavior.' },
		{ title: 'High Throughput', winner: 'Mini', why: 'Lowest latency and best economics for background runs.' },
		{ title: 'Creative + Vision', winner: 'Haiku 4.5', why: 'Fast multimodal responses with clean structure and readability.' }
	];

	const LIVE_STATUSES = ['steady', 'steady', 'steady', 'busy', 'throttle', 'steady', 'recovering'];
	const STATUS_LABEL = {
		steady: { dot: 'bg-violet-400/80', text: 'STEADY', badge: 'bg-violet-400/15 text-violet-200 border-violet-400/30' },
		busy: { dot: 'bg-amber-300 animate-pulse', text: 'BUSY', badge: 'bg-amber-300/15 text-amber-200 border-amber-300/30' },
		throttle: { dot: 'bg-red-400 animate-ping', text: 'THROTTLE', badge: 'bg-red-400/15 text-red-300 border-red-400/30' },
		recovering: { dot: 'bg-sky-400 animate-pulse', text: 'RECOVER', badge: 'bg-sky-400/15 text-sky-200 border-sky-400/30' }
	};

	const MODEL_ORDER = [...CLAUDE_MODELS].sort((a, b) => b.mmlu - a.mmlu);
	const TOP = MODEL_ORDER[0];
	const cheapestIn = Math.min(...CLAUDE_MODELS.map((m) => m.priceIn));
	const cheapestOut = Math.min(...CLAUDE_MODELS.map((m) => m.priceOut));
	const cheapestOutModel = MODEL_ORDER.reduce((acc, model) => (model.priceOut < acc.priceOut ? model : acc), MODEL_ORDER[0]);
	const bestHumanevalModel = MODEL_ORDER.reduce((acc, model) => (model.humaneval > acc.humaneval ? model : acc), MODEL_ORDER[0]);
	const bestMathModel = MODEL_ORDER.reduce((acc, model) => (model.math > acc.math ? model : acc), MODEL_ORDER[0]);
	const MODEL_BY_ID = Object.fromEntries(CLAUDE_MODELS.map((m) => [m.id, m]));
	const CLAUDE_GITHUB_TARGETS = [{ owner: 'anthropics', repo: 'anthropic-sdk-python', label: 'anthropic-sdk-python' }];
	const CLAUDE_GITHUB_QUERY = 'org:anthropics';

	const modelColorClass = (color) =>
		(
			{
				violet: 'border-violet-400/20 bg-violet-400/[0.06] text-violet-300 shadow-[0_0_28px_rgba(167,139,250,0.16)]',
				blue: 'border-blue-400/20 bg-blue-400/[0.06] text-blue-300 shadow-[0_0_26px_rgba(96,165,250,0.14)]',
				cyan: 'border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300 shadow-[0_0_26px_rgba(34,211,238,0.14)]',
				indigo: 'border-indigo-400/20 bg-indigo-400/[0.06] text-indigo-300 shadow-[0_0_26px_rgba(129,140,248,0.14)]'
			}[color] ?? 'border-white/20 bg-white/5 text-white'
		);

	const MODEL_ID_TO_NAME = Object.fromEntries(CLAUDE_MODELS.map((m) => [m.id, m.name]));
	const MODEL_ID_TO_CONTEXT = Object.fromEntries(CLAUDE_MODELS.map((m) => [m.id, m.context]));

	let metrics = $state({
		tokensPerDay: 1_120_000_000,
		activeUsers: 2_600_000,
		rps: 8_400,
		uptime: 99.62,
		queueDepth: 9
	});

	let live = $state(
		MODEL_ORDER.map((m) => ({
			id: m.id,
			latency: m.latencyMs + Math.floor(Math.random() * 10 - 5),
			rps: 1_400 + m.speed * 18,
			uptime: 98.8 + Math.random() * 1.0,
			status: m.health,
			throughput: m.speed + Math.floor(Math.random() * 12 - 6),
			errorRate: +(Math.random() * 0.05).toFixed(2)
		}))
	);

	let pulseLog = $state(
		CLAUDE_MODELS.map((m, idx) => ({
			id: `initial-${idx}`,
			model: m.name,
			qps: (m.speed * 12 + idx * 50).toFixed(0),
			time: `${idx + 1}m ago`,
			cost: `$${m.priceIn} in / $${m.priceOut} out`,
			latencyMs: m.latencyMs,
			context: m.context,
			speed: m.speed
		}))
	);
	let anthropicIntel = $state({
		repos: [],
		topRepo: null,
		totalStars: 0,
		totalForks: 0,
		totalIssues: 0,
		totalWatchers: 0,
		searchCount: 0,
		updatedAt: ''
	});
	let anthropicIntelLoading = $state(true);
	let anthropicIntelError = $state('');
	let anthropicBars = $state(Array.from({ length: 12 }, () => Math.random() * 100));

	let throughputBars = $state(Array.from({ length: 16 }, () => Math.random() * 100));
	let activeModel = $state(TOP.id);
	let tick = $state(0);

	onMount(() => {
		fetchAnthropicIntel({ silent: false });
		const interval = setInterval(() => {
			tick++;
			metrics = {
				...metrics,
				tokensPerDay: metrics.tokensPerDay + Math.floor(Math.random() * 90_000),
				activeUsers: metrics.activeUsers + Math.floor(Math.random() * 1200) - 240,
				rps: Math.max(3_200, metrics.rps + Math.floor((Math.random() - 0.5) * 480)),
				uptime: Math.min(99.99, +(metrics.uptime + (Math.random() - 0.5) * 0.08).toFixed(2)),
				queueDepth: Math.max(1, metrics.queueDepth + Math.floor((Math.random() - 0.5) * 4))
			};

			live = live.map((entry, index) => {
				const model = MODEL_ORDER[index];
				return {
					...entry,
					latency: Math.max(30, entry.latency + Math.floor((Math.random() - 0.5) * 18)),
					rps: Math.max(500, entry.rps + Math.floor((Math.random() - 0.5) * 180)),
					uptime: Math.min(99.99, Math.max(98.4, entry.uptime + (Math.random() - 0.5) * 0.08)),
					throughput: Math.max(18, entry.throughput + (Math.random() - 0.5) * 8),
					errorRate: Math.max(0, +(entry.errorRate + (Math.random() - 0.5) * 0.015).toFixed(2)),
					status: LIVE_STATUSES[Math.floor(Math.random() * LIVE_STATUSES.length)]
				};
			});

			const chosen = CLAUDE_MODELS[Math.floor(Math.random() * CLAUDE_MODELS.length)];
			pulseLog = [
				{
					id: `p-${tick}`,
					model: chosen.name,
					qps: (chosen.speed * (8 + Math.random() * 20)).toFixed(0),
					time: 'just now',
					cost: `$${chosen.priceIn} in / $${chosen.priceOut} out`,
					latencyMs: chosen.latencyMs,
					context: chosen.context,
					speed: chosen.speed
				},
				...pulseLog.slice(0, 9)
			];
			throughputBars = throughputBars.map(() => Math.random() * 100);
		}, 1400);
		const anthropicInterval = setInterval(() => {
			fetchAnthropicIntel({ silent: true });
		}, 120000);

		return () => {
			clearInterval(interval);
			clearInterval(anthropicInterval);
		};
	});

	const fmtNum = (n) => {
		if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
		return `${n}`;
	};

	const fmtContext = (tokens) => {
		if (!tokens) return '—';
		if (tokens >= 1_000_000) return `${tokens / 1_000_000}M`;
		return `${Math.round(tokens / 1000)}K`;
	};
	const fmtRatio = (a, b) => `${(a / b).toFixed(1)}x`;
	const numberValue = (input) => {
		const next = Number(input);
		return Number.isFinite(next) ? next : null;
	};
	const toTimestamp = (value) => {
		const time = Date.parse(value ?? '');
		return Number.isNaN(time) ? 0 : time;
	};

	const statusBadge = (status) => STATUS_LABEL[status] ?? STATUS_LABEL.steady;
	const qualityScore = (model) => +(model.mmlu * 0.45 + model.humaneval * 0.35 + model.math * 0.2).toFixed(1);
	const ioRatio = (model) => +(model.priceOut / Math.max(model.priceIn, 0.001)).toFixed(2);
	const costEfficiency = (model) => +(model.mmlu / Math.max(model.priceIn + model.priceOut, 0.001)).toFixed(1);
	const valueIndex = (model) => +(qualityScore(model) * 2 + model.speed + (model.vision ? 4 : 0) + (model.tools ? 4 : 0) - Math.max(0, ioRatio(model) - 10)).toFixed(1);
	const avgLatency = Math.round(CLAUDE_MODELS.reduce((acc, model) => acc + model.latencyMs, 0) / CLAUDE_MODELS.length);
	const densityScore = (model) => +((model.priceIn + model.priceOut) / Math.max(model.mmlu, 0.1)).toFixed(2);
	const bestDensityModel = MODEL_ORDER.reduce((acc, model) => (densityScore(model) < densityScore(acc) ? model : acc), MODEL_ORDER[0]);
	const bestValueModel = MODEL_ORDER.reduce((acc, model) => (valueIndex(model) > valueIndex(acc) ? model : acc), MODEL_ORDER[0]);
	const fastestModel = MODEL_ORDER.reduce((acc, model) => (model.latencyMs < acc.latencyMs ? model : acc), MODEL_ORDER[0]);
	const speedChampionModel = MODEL_ORDER.reduce((acc, model) => (model.speed > acc.speed ? model : acc), MODEL_ORDER[0]);
	const contextChampionModel = MODEL_ORDER.reduce((acc, model) => (model.context > acc.context ? model : acc), MODEL_ORDER[0]);
	const avgHumaneval = +(CLAUDE_MODELS.reduce((acc, model) => acc + model.humaneval, 0) / CLAUDE_MODELS.length).toFixed(1);
	const medianMath = +(CLAUDE_MODELS.reduce((acc, model) => acc + model.math, 0) / CLAUDE_MODELS.length).toFixed(1);
	const avgInPrice = +(CLAUDE_MODELS.reduce((acc, model) => acc + model.priceIn, 0) / CLAUDE_MODELS.length).toFixed(2);
	const avgOutPrice = +(CLAUDE_MODELS.reduce((acc, model) => acc + model.priceOut, 0) / CLAUDE_MODELS.length).toFixed(2);
	const avgSpeed = Math.round(CLAUDE_MODELS.reduce((acc, model) => acc + model.speed, 0) / CLAUDE_MODELS.length);
	const avgContext = Math.round(CLAUDE_MODELS.reduce((acc, model) => acc + model.context, 0) / CLAUDE_MODELS.length);
	const cheapestInModel = MODEL_ORDER.reduce((acc, model) => (model.priceIn < acc.priceIn ? model : acc), MODEL_ORDER[0]);
	const toInt = (value) => Number.isFinite(value) ? Math.round(value) : 0;

	async function fetchAnthropicIntel({ silent = false } = {}) {
		if (!silent) anthropicIntelLoading = true;
		anthropicIntelError = '';

		try {
			const directRepoResponses = await Promise.all(
				CLAUDE_GITHUB_TARGETS.map((target) =>
					fetch(`https://api.github.com/repos/${target.owner}/${target.repo}`)
				)
			);
			const searchResponse = await fetch(
				`https://api.github.com/search/repositories?q=${encodeURIComponent(CLAUDE_GITHUB_QUERY)}&per_page=10&sort=stars&order=desc`
			);
			if (!searchResponse.ok) throw new Error(`GitHub search failed with ${searchResponse.status}`);

			const directRepos = (
				await Promise.all(
					directRepoResponses.map(async (response) => {
						if (!response.ok) return null;
						return response.json();
					})
				)
			).filter(Boolean);

			const searchPayload = await searchResponse.json();
			const searchRepos = Array.isArray(searchPayload?.items)
				? searchPayload.items
						.map((entry) => ({
							name: entry.full_name,
							stars: numberValue(entry.stargazers_count),
							forks: numberValue(entry.forks_count),
							openIssues: numberValue(entry.open_issues_count),
							watchers: numberValue(entry.watchers_count),
							updatedAt: entry.updated_at,
							url: entry.html_url,
							lang: entry.language,
							id: entry.id
						}))
						.filter((entry) => !!entry.name)
				: [];

			const mappedDirect = directRepos.map((entry) => ({
				name: entry.full_name,
				stars: numberValue(entry.stargazers_count),
				forks: numberValue(entry.forks_count),
				openIssues: numberValue(entry.open_issues_count),
				watchers: numberValue(entry.subscribers_count),
				updatedAt: entry.updated_at,
				url: entry.html_url,
				lang: entry.language,
				id: entry.id
			}));

			const merged = [...mappedDirect];
			searchRepos.forEach((entry) => {
				if (!merged.some((repo) => repo.name === entry.name)) merged.push(entry);
			});

			const ranked = merged
				.filter((entry) => Number.isFinite(entry.stars))
				.sort((a, b) => b.stars - a.stars)
				.slice(0, 8);

			if (ranked.length === 0) throw new Error('GitHub returned no repo records.');

			const latest = ranked.reduce((time, repo) => Math.max(time, toTimestamp(repo.updatedAt)), 0);

			anthropicIntel = {
				repos: ranked,
				topRepo: ranked[0],
				totalStars: ranked.reduce((acc, repo) => acc + toInt(repo.stars), 0),
				totalForks: ranked.reduce((acc, repo) => acc + toInt(repo.forks), 0),
				totalIssues: ranked.reduce((acc, repo) => acc + toInt(repo.openIssues), 0),
				totalWatchers: ranked.reduce((acc, repo) => acc + toInt(repo.watchers), 0),
				searchCount: numberValue(searchPayload.total_count) ?? ranked.length,
				updatedAt: latest ? new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
			};
			anthropicBars = Array.from({ length: 12 }, () => Math.random() * 100);
		} catch (error) {
			console.error('Anthropic repo fetch failed:', error);
			anthropicIntelError = 'Anthropic repo signal unavailable.';
		} finally {
			anthropicIntelLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Claude | JamCat AI Command</title>
	<meta
		name="description"
		content="Claude-specific live telemetry and model board in an x402-inspired command-center layout."
	/>
</svelte:head>

<style>
	.text-\[5px\] {
		font-size: 6px !important;
	}

	.text-\[6px\] {
		font-size: 7px !important;
	}

	.text-\[7px\] {
		font-size: 8px !important;
	}
</style>

<div class="relative min-h-screen overflow-hidden bg-[#040d14] font-mono text-white">
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-violet-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-sky-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]"></div>
	</div>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.015]"
		style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(167,139,250,0.5) 2px, rgba(167,139,250,0.5) 3px)"
	></div>

		<div class="sticky top-0 z-40 border-b border-white/10 bg-black/75 backdrop-blur-xl">
			<div
				class="mx-auto flex max-w-7xl items-center px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-violet-300/60 sm:px-6 lg:px-8"
			>
				<div class="ticker-marquee overflow-hidden whitespace-nowrap">
					<div class="inline-flex w-full items-center gap-4 ticker-track">{TICKER} {TICKER}</div>
				</div>
			</div>
		</div>

		<main class="relative mx-auto max-w-7xl px-2 py-1 pb-3 text-[5px] sm:px-3 lg:px-4 lg:pb-5">
			<section class="mb-1 rounded-xl border border-violet-400/20 bg-[#090f1a]/80 p-1 backdrop-blur-sm">
				<div class="mb-1 flex flex-wrap items-start justify-between gap-1">
					<div>
						<div class="mb-0.5 flex flex-wrap items-center gap-1">
							<h1 class="text-[9px] font-black tracking-tight text-violet-300 drop-shadow-[0_0_12px_rgba(167,139,250,0.5)]">
								Claude Grid
							</h1>
							<span class="rounded-md border border-violet-400/30 bg-violet-400/10 px-1.5 py-0.5 text-[7px] font-bold text-violet-200">Anthropic runtime</span>
							<span class="flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-400/5 px-1.5 py-0.5 text-[7px] text-violet-300">
								<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"></span> LIVE
							</span>
						</div>
						<p class="text-[5px] text-violet-300/55">Model telemetry, context pressure, cost curves, and live API health.</p>
					</div>
					<div class="flex gap-0.5">
						<a
							href="/ai?lab=Anthropic"
							class="group rounded-sm border border-violet-400/40 bg-violet-400/10 px-1 py-0.5 text-[6px] font-bold text-violet-200 transition hover:bg-violet-400/20"
							>Claude in AI Race</a
						>
						<a href="/ai" class="rounded-sm border border-white/10 bg-black/20 px-1 py-0.5 text-[6px] hover:border-white/25 hover:bg-white/10">All Labs</a>
					</div>
				</div>
			</section>

				<section class="mb-1.5 grid grid-cols-2 gap-0.5 sm:grid-cols-6">
					<div class="relative overflow-hidden rounded-xl border border-violet-400/30 bg-violet-400/5 p-0.5 transition-all hover:border-violet-400/50">
						<div class="absolute right-0 top-0 h-20 w-20 rounded-full bg-violet-400/5 blur-2xl"></div>
						<p class="text-[5px] uppercase tracking-[0.14em] text-slate-400">Top model</p>
						<p class="mt-1 text-[8px] font-black text-violet-300">{TOP.name}</p>
						<p class="text-[6px] text-white/70">{TOP.tier}</p>
						<p class="mt-1 text-[10px] font-black text-white">{TOP.mmlu}</p>
						<p class="mt-0.5 text-[7px] text-violet-300/65">MMLU</p>
						<p class="mt-0.5 text-[6px] text-white/55">H/eval {TOP.humaneval} · math {TOP.math}</p>
						<p class="mt-0.5 text-[6px] text-white/55">lat {TOP.latencyMs}ms · ctx {fmtContext(TOP.context)}</p>
						<p class="mt-0.5 text-[6px] text-white/55">speed {TOP.speed} · fastest {fastestModel.name}</p>
						<p class="mt-0.5 text-[6px] text-white/55">context champ {contextChampionModel.name}</p>
						<p class="mt-0.5 text-[6px] text-white/55">HE champ {bestHumanevalModel.name} · {bestHumanevalModel.humaneval}</p>
						<p class="mt-0.5 text-[6px] text-white/55">Math champ {bestMathModel.name} · {bestMathModel.math}</p>
						<p class="mt-0.5 text-[6px] text-white/55">value {valueIndex(TOP).toFixed(1)} · io {ioRatio(TOP)}x</p>
						<p class="mt-0.5 text-[6px] text-white/55">best value {bestValueModel.name}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[6px] uppercase tracking-[0.14em] text-slate-400">live request volume</p>
						<p class="mt-1 text-[11px] font-black text-cyan-300">{fmtNum(metrics.rps)}</p>
						<p class="text-[7px] text-white/65">RPS now</p>
						<p class="mt-0.5 text-[6px] text-white/55">throughput {fmtNum(metrics.tokensPerDay)} · queue {metrics.queueDepth}</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg lat {avgLatency}ms</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg HE {avgHumaneval} · math {medianMath}</p>
						<p class="mt-0.5 text-[6px] text-white/55">value lead {bestValueModel.name}</p>
						<p class="mt-0.5 text-[6px] text-white/55">quality lead {bestDensityModel.name}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[6px] uppercase tracking-[0.14em] text-slate-400">active users</p>
						<p class="mt-1 text-[11px] font-black text-fuchsia-300">{fmtNum(metrics.activeUsers)}</p>
						<p class="text-[7px] text-white/65">Tracked sessions</p>
						<p class="mt-0.5 text-[6px] text-white/55">uptime {metrics.uptime}%</p>
						<p class="mt-0.5 text-[6px] text-white/55">quality {qualityScore(TOP)} · value {valueIndex(TOP).toFixed(1)}</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg in/out ${avgInPrice} / ${avgOutPrice}</p>
						<p class="mt-0.5 text-[6px] text-white/55">quality leader {bestValueModel.name}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[5px] uppercase tracking-[0.14em] text-slate-400">top value model</p>
						<p class="mt-1 text-[10px] font-black text-amber-300">{bestValueModel.name}</p>
						<p class="text-[6px] text-white/70">{bestValueModel.tier}</p>
						<p class="mt-0.5 text-[5px] text-white/55">value {valueIndex(bestValueModel)}</p>
						<p class="mt-0.5 text-[5px] text-white/55">io {ioRatio(bestValueModel)}x</p>
						<p class="mt-0.5 text-[5px] text-white/55">speed {bestValueModel.speed} · density {densityScore(bestValueModel)}</p>
						<p class="mt-0.5 text-[5px] text-white/55">ctx {fmtContext(bestValueModel.context)} · launched {bestValueModel.launched ?? 'n/a'}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[5px] uppercase tracking-[0.14em] text-slate-400">cheapest in / out</p>
						<p class="mt-1 text-[10px] font-black text-emerald-300">${cheapestIn} / ${cheapestOut}</p>
						<p class="text-[7px] text-white/65">per 1M tokens</p>
						<p class="mt-0.5 text-[5px] text-white/55">ratio {fmtRatio(cheapestOut, cheapestIn)}</p>
						<p class="mt-0.5 text-[5px] text-white/55">from {cheapestInModel.name}</p>
						<p class="mt-0.5 text-[5px] text-white/55">speed lead {speedChampionModel.name}</p>
						<p class="mt-0.5 text-[5px] text-white/55">out champ {cheapestOutModel.name} · ${cheapestOutModel.priceOut}</p>
						<p class="mt-0.5 text-[5px] text-white/55">rank {cheapestOutModel === cheapestInModel ? '1' : '2'} by price</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[5px] uppercase tracking-[0.14em] text-slate-400">best cost model</p>
						<p class="mt-1 text-[10px] font-black text-violet-300">{bestDensityModel.name}</p>
						<p class="text-[6px] text-white/70">{bestDensityModel.tier}</p>
						<p class="mt-0.5 text-[5px] text-white/55">density {densityScore(bestDensityModel)}</p>
						<p class="mt-0.5 text-[5px] text-white/55">in+out / mmlu</p>
						<p class="mt-0.5 text-[5px] text-white/55">ctx {fmtContext(bestDensityModel.context)} · avg ctx {fmtContext(avgContext)}</p>
						<p class="mt-0.5 text-[5px] text-white/55">value {valueIndex(bestDensityModel)} · fastest {fastestModel.name}</p>
						<p class="mt-0.5 text-[5px] text-white/55">lat {Math.round(bestDensityModel.latencyMs)}ms · io {ioRatio(bestDensityModel)}x</p>
					</div>
				</section>

			<div class="flex flex-col gap-1 lg:flex-row">
				<div class="min-w-0 flex-1 space-y-0.5">
					<div class="rounded-xl border border-white/10 bg-[#0a141d]/70 p-0.5 backdrop-blur-sm">
						<div class="mb-0.5 flex items-center justify-between">
							<h2 class="text-[8px] font-bold tracking-wide text-white">Model board</h2>
							<p class="text-[8px] text-slate-500">MMLU + live metrics</p>
						</div>
						<div class="grid gap-0.5 lg:grid-cols-4">
							{#each MODEL_ORDER as model, modelIndex}
								<div class={`overflow-hidden rounded-md border p-0.5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] ${modelColorClass(model.color)}`}>
									<div class="mb-0.5 flex items-center justify-between">
										<p class="text-[8px] font-semibold uppercase tracking-[0.05em] leading-none">{model.name}</p>
										<span class="rounded-full border border-white/15 px-1 py-0 text-[6px] text-white/85">#{modelIndex + 1}</span>
									</div>
									<p class="text-[5px] leading-snug text-white/70">{model.copy}</p>
									<div class="mt-0.5 space-y-0.5 text-[5px]">
										<p class="text-[5px] leading-snug text-white/50"><span class="text-white/70">Tier:</span> {model.tier}</p>
										<div class="flex items-center justify-between">
											<span class="text-white/55">MMLU</span>
											<span class="font-bold">{model.mmlu}</span>
										</div>
										<div class="h-0.5 rounded-full bg-white/10">
											<div class="h-full rounded-full bg-violet-300/95" style={`width:${model.mmlu}%;`}></div>
										</div>
										<div class="grid grid-cols-2 gap-0.5 text-white/75">
											<p><span class="text-white/55">Lat</span> {model.latencyMs}ms</p>
											<p><span class="text-white/55">Ctx</span> {fmtContext(model.context)}</p>
											<p><span class="text-white/55">H/E</span> {model.humaneval}</p>
											<p><span class="text-white/55">Math</span> {model.math}</p>
											<p><span class="text-white/55">Score</span> {qualityScore(model)}</p>
											<p><span class="text-white/55">Cost</span> ${model.priceIn}/${model.priceOut}</p>
											<p><span class="text-white/55">Value</span> {valueIndex(model)}</p>
											<p><span class="text-white/55">IO</span> {ioRatio(model)}x</p>
											<p><span class="text-white/55">Cost-eff</span> {costEfficiency(model)}</p>
											<p><span class="text-white/55">Vision</span> {model.vision ? 'Y' : 'N'}</p>
											<p><span class="text-white/55">Tools</span> {model.tools ? 'Y' : 'N'}</p>
											<p><span class="text-white/55">Speed</span> {model.speed}</p>
											<p><span class="text-white/55">Density</span> {densityScore(model)}</p>
											<p><span class="text-white/55">Cost-eff</span> {valueIndex(model).toFixed(1)}x</p>
										</div>
										<p class="text-[5px] leading-snug text-white/50"><span class="text-white/70">Use:</span> {model.tags?.join(' • ')}</p>
										<p class="text-[5px] leading-snug text-white/50">
											<span class="text-white/70">Signals:</span> quality {qualityScore(model).toFixed(1)} · value {valueIndex(model).toFixed(1)} · io {ioRatio(model)}x
										</p>
										<div class="mt-0.5 flex items-center gap-1">
											<button
												onclick={() => (activeModel = model.id)}
												class={`rounded-full border px-1 py-0.5 text-[5px] font-black uppercase tracking-[0.12em] ${activeModel === model.id ? 'border-violet-300 bg-violet-400/20 text-violet-200' : 'border-white/15 bg-white/5 text-white/55'}`}
											>
												{activeModel === model.id ? 'Watching' : 'Watch'}
											</button>
											<span class="rounded-full border border-white/15 px-1 py-0.5 text-[5px] text-white/50">
												IO {fmtRatio(model.priceOut, model.priceIn)}
											</span>
											<span class="rounded-full border border-white/15 px-1 py-0.5 text-[5px] text-white/50">
												idle {Math.round(model.speed / 2)}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="rounded-xl border border-white/10 bg-[#0a141d]/70 p-0.5 backdrop-blur-sm">
						<h2 class="mb-0.5 text-[8px] font-bold tracking-wide text-white">Use-case routing map</h2>
						<div class="grid gap-0.5 lg:grid-cols-4">
							{#each USE_CASES as c}
								<div class="rounded-md border border-white/10 bg-black/30 p-0.5">
									<p class="mb-0.5 text-[8px] uppercase tracking-[0.14em] text-white/55">{c.title}</p>
									<p class="text-[9px] font-semibold text-violet-200">{c.winner}</p>
									<p class="mt-0.5 text-[7px] leading-tight text-white/65">{c.why}</p>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<aside class="flex shrink-0 flex-col gap-0.5 lg:w-36 xl:w-36">
					<div class="rounded-xl border border-white/10 bg-[#0a141d]/70 p-0.5 backdrop-blur-sm">
						<div class="mb-0.5 flex items-center justify-between">
							<p class="text-[8px] font-bold text-white">⚡ Live pulse</p>
							<span class="rounded-full border border-violet-400/30 bg-violet-400/15 px-1 py-0.5 text-[6px] font-black text-violet-200">SAMPLE FEED</span>
						</div>
						<ul class="space-y-0.5 text-[5px] max-h-28 overflow-y-auto pr-1">
							{#each pulseLog as p (p.id)}
								<li class="rounded-md border border-white/10 bg-black/30 px-1 py-0.5 text-white/80 hover:bg-black/50">
									<div class="flex items-center justify-between">
										<span class="text-[7px] font-bold text-violet-200">{p.model}</span>
										<span class="rounded-sm border border-white/10 px-1 py-0.5 text-[6px] font-semibold">{p.time}</span>
									</div>
										<p class="mt-0.5 text-[6px] text-white/60">
											{p.qps}k QPS · {p.cost} · lat {p.latencyMs}ms · ctx {fmtContext(p.context)} · speed {p.speed}
										</p>
									</li>
								{/each}
						</ul>
					</div>

					<div class="rounded-xl border border-violet-400/20 bg-violet-400/[0.06] p-0.5">
						<div class="mb-0.5 flex items-center justify-between">
							<p class="text-[8px] font-bold text-white">🛰️ Anthropic ecosystem</p>
							<span class="text-[8px] text-slate-400">{anthropicIntel.updatedAt || '—'}</span>
						</div>
						{#if anthropicIntelLoading}
							<p class="text-[7px] text-white/65">Resolving GitHub repo health...</p>
						{:else if anthropicIntelError}
							<p class="text-[7px] text-red-300">Ecosystem feed failed: {anthropicIntelError}</p>
						{:else}
							<div class="grid grid-cols-2 gap-0.5 text-[6px] text-white/70">
								<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
									<p class="text-white/55">tracked repos</p>
									<p class="text-[10px] font-black text-violet-300">{anthropicIntel.repos.length}</p>
								</div>
								<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
									<p class="text-white/55">search hits</p>
									<p class="text-[10px] font-black text-violet-300">{fmtNum(anthropicIntel.searchCount)}</p>
								</div>
								<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
									<p class="text-white/55">stars</p>
									<p class="text-[10px] font-black text-violet-300">{fmtNum(anthropicIntel.totalStars)}</p>
								</div>
								<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
									<p class="text-white/55">forks</p>
									<p class="text-[10px] font-black text-violet-300">{fmtNum(anthropicIntel.totalForks)}</p>
								</div>
							</div>
							<div class="mt-0.5">
								<p class="text-[6px] text-white/55">
									top repo:
									<span class="text-white/90">
										{#if anthropicIntel.topRepo}
											{anthropicIntel.topRepo.name} · {fmtNum(anthropicIntel.topRepo.stars)}★
										{:else}
											—
										{/if}
									</span>
								</p>
								<p class="mt-0.5 text-[6px] text-white/55">
									issues {fmtNum(anthropicIntel.totalIssues)} · watchers {fmtNum(anthropicIntel.totalWatchers)}
								</p>
							</div>
							<div class="mt-0.5 h-5 flex items-end gap-0.5">
								{#each anthropicBars as level, idx (idx)}
									<div class="flex-1 rounded-t bg-gradient-to-t from-violet-400/25 to-violet-400/65" style={`height:${level}%`}></div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="rounded-xl border border-white/10 bg-[#0a141d]/70 p-0.5 backdrop-blur-sm">
						<div class="mb-0.5 flex items-center justify-between">
							<p class="text-[8px] font-bold text-white">Claude model status</p>
							<span class="text-[8px] text-slate-400">Live</span>
						</div>
						<div class="space-y-0.5">
							{#each live as item}
								{@const model = MODEL_BY_ID[item.id] ?? TOP}
								{@const modelName = MODEL_ID_TO_NAME[item.id]}
								{@const st = statusBadge(item.status)}
								<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
									<div class="flex items-center justify-between gap-2">
										<div>
											<p class="font-semibold text-[9px] text-white">{modelName}</p>
											<p class="text-[7px] text-white/55">Uptime {item.uptime.toFixed(2)}%</p>
										</div>
										<span class={`rounded-full border px-1 py-0.5 text-[6px] font-black ${st.badge}`}>
											<span class={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${st.dot}`}></span>
											{st.text}
										</span>
									</div>
										<div class="mt-0.5 grid grid-cols-2 gap-1 text-[7px]">
											<div>
												<p class="text-white/55">lat</p>
												<p class="font-semibold">{item.latency}ms</p>
											</div>
											<div>
												<p class="text-white/55">rps</p>
												<p class="font-semibold">{fmtNum(item.rps)}</p>
											</div>
										</div>
										<div class="mt-0.5 grid grid-cols-3 gap-1 text-[7px]">
											<div>
												<p class="text-white/55">err%</p>
												<p class="font-semibold">{item.errorRate.toFixed(2)}</p>
											</div>
											<div>
												<p class="text-white/55">thru</p>
												<p class="font-semibold">{Math.round(item.throughput)}k</p>
											</div>
											<div>
												<p class="text-white/55">base model</p>
												<p class="font-semibold">{model?.name}</p>
											</div>
										</div>
										<div class="mt-0.5 grid grid-cols-2 gap-1 text-[6px] text-white/45">
											<p>context {fmtContext(MODEL_ID_TO_CONTEXT[item.id])}</p>
											<p>quality {qualityScore(model)}</p>
											<p>value {valueIndex(model)}</p>
											<p>io {ioRatio(model)}x</p>
											<p>speed {model?.speed}</p>
											<p>cost-eff {costEfficiency(model)}</p>
											<p>latency {model?.latencyMs}ms</p>
											<p>stream {model?.vision ? 'vision' : 'text'}</p>
										</div>
										</div>
							{/each}
						</div>
					</div>

					<div class="rounded-xl border border-violet-400/20 bg-violet-400/[0.06] p-0.5">
						<div class="mb-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-violet-300">Throughput graph</div>
						<div class="h-7 flex items-end gap-0.5">
							{#each throughputBars as h, i (i)}
								<div class="flex-1 rounded-t bg-gradient-to-t from-violet-400/20 to-violet-400/60" style={`height: ${h}%`}></div>
							{/each}
						</div>
						<p class="mt-0.5 text-[7px] text-slate-600">
							Queue depth: <span class="font-semibold text-violet-300">{metrics.queueDepth}</span>
						</p>
					</div>
			</aside>
		</div>
	</main>

	<style>
		.ticker-track {
			display: inline-flex;
			animation: ticker 22s linear infinite;
		}

		@keyframes ticker {
			from {
				transform: translateX(0);
			}
			to {
				transform: translateX(-50%);
			}
		}
	</style>
</div>
