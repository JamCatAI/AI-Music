<script>
	import { onMount } from 'svelte';

	const TICKER =
		'🧠 OPENAI COMMAND GRID · GPT-5.5 · GPT-5.4 · O3 · GPT-4o mini · TOOL CALLING · API LATENCY · COST / TOKEN · LIVE STATUS';

	const OPENAI_MODELS = [
		{
			id: 'gpt55',
			name: 'GPT-5.5',
			tier: 'Flagship',
			mmlu: 96.7,
			humaneval: 99.5,
			math: 97.9,
			priceIn: 2.5,
			priceOut: 15.0,
			latencyMs: 124,
			context: 1_000_000,
			speed: 95,
			vision: true,
			tools: true,
			tags: ['Tool-first', 'SWE-bench', 'Long context'],
			health: 'steady',
			color: 'green',
			copy: 'Highest benchmark leader with strong tool routing and enterprise reliability.',
			launched: 'Mar 2026'
		},
		{
			id: 'gpt54',
			name: 'GPT-5.4',
			tier: 'Legacy Flagship',
			mmlu: 91.4,
			humaneval: 74.9,
			math: 83.0,
			priceIn: 2.5,
			priceOut: 15.0,
			latencyMs: 182,
			context: 1_000_000,
			speed: 95,
			vision: true,
			tools: true,
			tags: ['Balanced', 'Long context', 'Automation'],
			health: 'steady',
			color: 'emerald',
			copy: 'Trusted production layer for large prompt batches and long context flows.',
			launched: 'Jan 2025'
		},
		{
			id: 'o3',
			name: 'o3',
			tier: 'Reasoning Specialist',
			mmlu: 96.7,
			humaneval: 99.5,
			math: 97.9,
			priceIn: 10.0,
			priceOut: 40.0,
			latencyMs: 332,
			context: 200_000,
			speed: 40,
			vision: true,
			tools: true,
			tags: ['Math', 'Formal reasoning', 'Verifier'],
			health: 'busy',
			color: 'amber',
			copy: 'Highest-cost reasoning path for deep symbolic workloads.',
			launched: 'Jan 2025'
		},
		{
			id: 'gpt4omini',
			name: 'GPT-4o mini',
			tier: 'High-Efficiency',
			mmlu: 82,
			humaneval: 77,
			math: 79.0,
			priceIn: 0.15,
			priceOut: 0.6,
			latencyMs: 76,
			context: 128_000,
			speed: 170,
			vision: true,
			tools: true,
			tags: ['Streaming', 'Cost cap', 'High-throughput'],
			health: 'steep',
			color: 'cyan',
			copy: 'Best economics for high-throughput tasks and short-turnaround generation.',
			launched: 'Nov 2024'
		}
	];

	const USE_CASES = [
		{ title: 'Reasoning stack', winner: 'GPT-5.5', why: 'Strongest mix of MMLU + latency stability for tool-heavy flows.' },
		{ title: 'Long-context analysis', winner: 'GPT-5.4', why: '1M context with reliable behavior over large inputs.' },
		{ title: 'Math and theorem checks', winner: 'o3', why: 'Highest depth for complex symbolic and verification routines.' },
		{ title: 'Scale jobs', winner: 'GPT-4o mini', why: 'Lowest cost baseline when cost per token dominates.' }
	];

	const LIVE_STATUSES = ['steady', 'steady', 'busy', 'steady', 'throttle', 'steady', 'recovering'];
	const STATUS_LABEL = {
		steady: { dot: 'bg-green-400/80', text: 'STEADY', badge: 'bg-green-400/15 text-green-300 border-green-400/30' },
		busy: { dot: 'bg-amber-300/90 animate-pulse', text: 'BUSY', badge: 'bg-amber-300/15 text-amber-200 border-amber-300/30' },
		throttle: { dot: 'bg-red-400 animate-ping', text: 'THROTTLE', badge: 'bg-red-400/15 text-red-300 border-red-400/30' },
		recovering: { dot: 'bg-sky-400 animate-pulse', text: 'RECOVER', badge: 'bg-sky-400/15 text-sky-200 border-sky-400/30' }
	};

	const MODEL_ORDER = [...OPENAI_MODELS].sort((a, b) => b.mmlu - a.mmlu);
	const TOP = MODEL_ORDER[0];
	const cheapestIn = Math.min(...OPENAI_MODELS.map((m) => m.priceIn));
	const cheapestOut = Math.min(...OPENAI_MODELS.map((m) => m.priceOut));
	const cheapestOutModel = MODEL_ORDER.reduce((acc, model) => (model.priceOut < acc.priceOut ? model : acc), MODEL_ORDER[0]);
	const bestHumanevalModel = MODEL_ORDER.reduce((acc, model) => (model.humaneval > acc.humaneval ? model : acc), MODEL_ORDER[0]);
	const bestMathModel = MODEL_ORDER.reduce((acc, model) => (model.math > acc.math ? model : acc), MODEL_ORDER[0]);
	const MODEL_BY_ID = Object.fromEntries(OPENAI_MODELS.map((m) => [m.id, m]));
	const OPENAI_GITHUB_TARGETS = [
		{ owner: 'openai', repo: 'openai-python', label: 'openai-python' },
		{ owner: 'openai', repo: 'openai-node', label: 'openai-node' },
		{ owner: 'openai', repo: 'openai-cookbook', label: 'openai-cookbook' },
		{ owner: 'openai', repo: 'openai-openapi', label: 'openai-openapi' }
	];
	const OPENAI_GITHUB_QUERY = 'org:openai';

	const modelColorClass = (color) =>
		({
			green: 'border-green-400/20 bg-green-400/[0.06] text-green-300 shadow-[0_0_28px_rgba(74,222,128,0.16)]',
			emerald: 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300 shadow-[0_0_26px_rgba(16,185,129,0.14)]',
			amber: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300 shadow-[0_0_26px_rgba(251,191,36,0.16)]',
			cyan: 'border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300 shadow-[0_0_26px_rgba(34,211,238,0.14)]'
		})[color] ?? 'border-white/20 bg-white/5 text-white';

	let metrics = $state({
		tokensPerDay: 1_450_000_000,
		activeUsers: 3_010_000,
		rps: 11_200,
		uptime: 99.74,
		queueDepth: 12
	});

	let live = $state(
			MODEL_ORDER.map((m) => ({
				id: m.id,
				latency: m.latencyMs + Math.floor(Math.random() * 8 - 4),
				rps: 2_400 + m.speed * 18,
				uptime: 99.2 + Math.random() * 0.7,
				status: m.health,
				throughput: m.speed + Math.floor(Math.random() * 10),
				errorRate: +(Math.random() * 0.08).toFixed(2)
			}))
		);

	let pulseLog = $state(
		OPENAI_MODELS.map((m, idx) => ({
			id: `initial-${idx}`,
			model: m.name,
			qps: (m.speed * 23).toFixed(0),
		time: `${idx + 1}m ago`,
		cost: `$${m.priceIn} in / $${m.priceOut} out`,
		latencyMs: m.latencyMs,
			context: m.context,
			speed: m.speed
		}))
	);
	let ecosystemIntel = $state({
		repos: [],
		topRepo: null,
		totalStars: 0,
		totalForks: 0,
		totalIssues: 0,
		totalWatchers: 0,
		searchCount: 0,
		updatedAt: ''
	});
	let ecosystemIntelLoading = $state(true);
	let ecosystemIntelError = $state('');
	let ecosystemBars = $state(Array.from({ length: 12 }, () => Math.random() * 100));
	let intelligence = $state({
		market: null,
		topGainers: [],
		topLosers: [],
		fearGreed: null,
		updatedAt: ''
	});
	let intelligenceLoading = $state(true);
	let intelligenceError = $state('');
	let throughputBars = $state(Array.from({ length: 16 }, () => Math.random() * 100));
	let activeModel = $state(TOP.id);

	let tick = $state(0);
	onMount(() => {
		fetchIntel({ silent: false });
		fetchEcosystemIntel({ silent: false });
		const interval = setInterval(() => {
			tick++;
			metrics = {
				...metrics,
				tokensPerDay: metrics.tokensPerDay + Math.floor(Math.random() * 120_000),
				activeUsers: metrics.activeUsers + Math.floor(Math.random() * 1_800) - 420,
				rps: Math.max(2_900, metrics.rps + Math.floor((Math.random() - 0.5) * 640)),
				uptime: Math.min(99.99, +(metrics.uptime + (Math.random() - 0.48) * 0.06).toFixed(2)),
				queueDepth: Math.max(2, metrics.queueDepth + Math.floor((Math.random() - 0.5) * 4))
			};

			live = live.map((entry, index) => {
				const model = MODEL_ORDER[index];
				return {
					...entry,
					latency: Math.max(35, entry.latency + Math.floor((Math.random() - 0.5) * 20)),
					rps: Math.max(500, entry.rps + Math.floor((Math.random() - 0.5) * 210)),
					uptime: Math.min(99.99, Math.max(98.5, entry.uptime + (Math.random() - 0.5) * 0.07)),
					throughput: Math.max(18, entry.throughput + (Math.random() - 0.5) * 8),
					errorRate: Math.max(0, +(entry.errorRate + (Math.random() - 0.5) * 0.02).toFixed(2)),
					status: LIVE_STATUSES[Math.floor(Math.random() * LIVE_STATUSES.length)]
				};
			});

				const chosen = OPENAI_MODELS[Math.floor(Math.random() * OPENAI_MODELS.length)];
				pulseLog = [
					{
						id: `p-${tick}`,
						model: chosen.name,
						qps: (chosen.speed * (9 + Math.random() * 20)).toFixed(0),
						time: 'just now',
						cost: `$${chosen.priceIn} in / $${chosen.priceOut} out`,
						latencyMs: chosen.latencyMs,
						context: chosen.context,
						speed: chosen.speed
					},
					...pulseLog.slice(0, 9)
				];

			throughputBars = throughputBars.map(() => Math.random() * 100);
		}, 1500);
		const intelInterval = setInterval(() => {
			fetchIntel({ silent: true });
		}, 65000);
		const ecosystemInterval = setInterval(() => {
			fetchEcosystemIntel({ silent: true });
		}, 120000);

		return () => {
			clearInterval(interval);
			clearInterval(intelInterval);
			clearInterval(ecosystemInterval);
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
	const fmtTime = (v) => `${v}ms`;
	const numberValue = (input) => {
		const next = Number(input);
		return Number.isFinite(next) ? next : null;
	};
	const fmtSigned = (value) => {
		if (value === null || Number.isNaN(value)) return '--';
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	};
	const toTimestamp = (value) => {
		const time = Date.parse(value ?? '');
		return Number.isNaN(time) ? 0 : time;
	};
	const fearSignalTone = (value) => {
		if (value === null) return { bar: 'bg-slate-400/60', text: 'text-slate-300' };
		if (value >= 75) return { bar: 'bg-emerald-400', text: 'text-emerald-300' };
		if (value >= 55) return { bar: 'bg-cyan-400', text: 'text-cyan-300' };
		if (value >= 45) return { bar: 'bg-amber-300', text: 'text-amber-200' };
		return { bar: 'bg-red-400', text: 'text-red-300' };
	};
	const statusBadge = (status) => STATUS_LABEL[status] ?? STATUS_LABEL.steady;
	const qualityScore = (model) => +(model.mmlu * 0.45 + model.humaneval * 0.35 + model.math * 0.2).toFixed(1);
	const ioRatio = (model) => +(model.priceOut / Math.max(model.priceIn, 0.001)).toFixed(2);
	const valueIndex = (model) => +(qualityScore(model) * 1.8 + model.speed + (model.tools ? 3 : 0) - (model.latencyMs / 10) + (model.vision ? 2 : 0) - Math.max(0, ioRatio(model) - 16)).toFixed(1);
	const avgLatency = Math.round(OPENAI_MODELS.reduce((acc, model) => acc + model.latencyMs, 0) / OPENAI_MODELS.length);
	const densityScore = (model) => +((model.priceIn + model.priceOut) / Math.max(model.mmlu, 0.1)).toFixed(2);
	const bestDensityModel = MODEL_ORDER.reduce((acc, model) => (densityScore(model) < densityScore(acc) ? model : acc), MODEL_ORDER[0]);
	const bestValueModel = MODEL_ORDER.reduce((acc, model) => (valueIndex(model) > valueIndex(acc) ? model : acc), MODEL_ORDER[0]);
	const avgHumaneval = +(OPENAI_MODELS.reduce((acc, model) => acc + model.humaneval, 0) / OPENAI_MODELS.length).toFixed(1);
	const avgContext = Math.round(OPENAI_MODELS.reduce((acc, model) => acc + model.context, 0) / OPENAI_MODELS.length);
	const avgSpeed = Math.round(OPENAI_MODELS.reduce((acc, model) => acc + model.speed, 0) / OPENAI_MODELS.length);
	const avgOutPrice = +(OPENAI_MODELS.reduce((acc, model) => acc + model.priceOut, 0) / OPENAI_MODELS.length).toFixed(2);
	const avgInPrice = +(OPENAI_MODELS.reduce((acc, model) => acc + model.priceIn, 0) / OPENAI_MODELS.length).toFixed(2);
	const cheapestInModel = MODEL_ORDER.reduce((acc, model) => (model.priceIn < acc.priceIn ? model : acc), MODEL_ORDER[0]);
	const contextChampionModel = MODEL_ORDER.reduce((acc, model) => (model.context > acc.context ? model : acc), MODEL_ORDER[0]);
	const fastestModel = MODEL_ORDER.reduce((acc, model) => (model.latencyMs < acc.latencyMs ? model : acc), MODEL_ORDER[0]);
	const avgMmlu = +(OPENAI_MODELS.reduce((acc, model) => acc + model.mmlu, 0) / OPENAI_MODELS.length).toFixed(1);
	const avgMath = +(OPENAI_MODELS.reduce((acc, model) => acc + model.math, 0) / OPENAI_MODELS.length).toFixed(1);
	const quickestModel = MODEL_ORDER.reduce((acc, model) => (model.latencyMs < acc.latencyMs ? model : acc), MODEL_ORDER[0]);
	const toInt = (value) => Number.isFinite(value) ? Math.round(value) : 0;

	async function fetchEcosystemIntel({ silent = false } = {}) {
		if (!silent) ecosystemIntelLoading = true;
		ecosystemIntelError = '';

		try {
			const directRepoResponses = await Promise.all(
				OPENAI_GITHUB_TARGETS.map((target) =>
					fetch(`https://api.github.com/repos/${target.owner}/${target.repo}`)
				)
			);
			const searchResponse = await fetch(
				`https://api.github.com/search/repositories?q=${encodeURIComponent(OPENAI_GITHUB_QUERY)}&per_page=8&sort=stars&order=desc`
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

			ecosystemIntel = {
				repos: ranked,
				topRepo: ranked[0],
				totalStars: ranked.reduce((acc, repo) => acc + toInt(repo.stars), 0),
				totalForks: ranked.reduce((acc, repo) => acc + toInt(repo.forks), 0),
				totalIssues: ranked.reduce((acc, repo) => acc + toInt(repo.openIssues), 0),
				totalWatchers: ranked.reduce((acc, repo) => acc + toInt(repo.watchers), 0),
				searchCount: numberValue(searchPayload.total_count) ?? ranked.length,
				updatedAt: latest ? new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
			};
			ecosystemBars = Array.from({ length: 12 }, () => Math.random() * 100);
		} catch (error) {
			console.error('Ecosystem fetch failed:', error);
			ecosystemIntelError = 'Ecosystem feed unavailable.';
		} finally {
			ecosystemIntelLoading = false;
		}
	}

	async function fetchIntel({ silent = false } = {}) {
		if (!silent) intelligenceLoading = true;
		intelligenceError = '';

		try {
			const [globalRes, moversRes, fearRes] = await Promise.all([
				fetch('https://api.coinlore.net/api/global/'),
				fetch('https://api.coinlore.net/api/tickers/?start=0&limit=15'),
				fetch('https://api.alternative.me/fng/?limit=8&format=json&date_format=us')
			]);
			if (!globalRes.ok) throw new Error(`Pulse request failed with ${globalRes.status}`);
			if (!moversRes.ok) throw new Error(`Movers request failed with ${moversRes.status}`);
			if (!fearRes.ok) throw new Error(`Sentiment request failed with ${fearRes.status}`);

			const globalPayload = await globalRes.json();
			const moversPayload = await moversRes.json();
			const fearPayload = await fearRes.json();

			const global = Array.isArray(globalPayload) && globalPayload.length > 0 ? globalPayload[0] : null;
			const movers = Array.isArray(moversPayload?.data) ? moversPayload.data : [];
			const fearRows = Array.isArray(fearPayload?.data) ? fearPayload.data : [];
			if (!global || movers.length === 0 || fearRows.length === 0) throw new Error('Pulse feed unavailable');

			const parsedFear = fearRows
				.map((entry) => ({
					value: Number(entry.value),
					label: entry.value_classification || 'Neutral',
					when: new Date(Number(entry.timestamp) * 1000).toLocaleDateString([], {
						month: 'short',
						day: 'numeric'
					})
				}))
				.filter((entry) => Number.isFinite(entry.value))
				.reverse();

			const ranked = movers
				.map((asset) => ({
					name: asset.name,
					symbol: asset.symbol?.toUpperCase() || asset.name,
					change24h: numberValue(asset.percent_change_24h),
					price: numberValue(asset.price_usd),
					volume: numberValue(asset.volume24)
				}))
				.filter((asset) => asset.change24h !== null)
				.sort((a, b) => b.change24h - a.change24h);

			intelligence = {
				market: {
					totalMarketCap: numberValue(global.total_mcap),
					totalVolume: numberValue(global.total_volume),
					activeMarkets: numberValue(global.active_markets),
					btcDominance: numberValue(global.btc_d),
					ethDominance: numberValue(global.eth_d),
					mcapChange: numberValue(global.mcap_change),
					volumeChange: numberValue(global.volume_change)
				},
				topGainers: ranked.slice(0, 3),
				topLosers: ranked.slice(-3).reverse(),
				fearGreed: {
					current: parsedFear.at(-1)?.value ?? null,
					label: parsedFear.at(-1)?.label ?? 'Neutral',
					previous: parsedFear.length > 1 ? parsedFear.at(-2)?.value : null,
					lastUpdated: parsedFear.at(-1)?.when ?? '--'
				},
				updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			};
		} catch (error) {
			console.error('Intel fetch failed:', error);
			intelligenceError = 'Open intelligence feed unavailable.';
		} finally {
			intelligenceLoading = false;
		}
	}

	const topGainer = $derived(intelligence.topGainers[0] ?? null);
	const topLoser = $derived(intelligence.topLosers[0] ?? null);
	const currentFear = $derived(intelligence.fearGreed?.current ?? null);
</script>

<svelte:head>
	<title>OpenAI | JamCat AI Command</title>
	<meta
		name="description"
		content="OpenAI-specific telemetry and model board in a live command-center view with x402-inspired neon styling."
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
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-green-500/8 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/6 blur-[140px]"></div>
		<div class="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px]"></div>
	</div>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.015]"
		style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(74,222,128,0.5) 2px, rgba(74,222,128,0.5) 3px)"
	/>

		<div class="sticky top-0 z-40 border-b border-white/10 bg-black/75 backdrop-blur-xl">
			<div class="mx-auto flex max-w-7xl items-center px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-green-300/60 sm:px-6 lg:px-8">
				<div class="ticker-marquee overflow-hidden whitespace-nowrap">
					<div class="inline-flex w-full items-center gap-4 ticker-track">{TICKER} {TICKER}</div>
				</div>
			</div>
		</div>

		<main class="relative mx-auto max-w-7xl px-2 py-1 pb-4 text-[6px] sm:px-3 lg:px-4 lg:pb-6">
			<section class="mb-1 rounded-xl border border-green-400/20 bg-[#06140f]/80 p-1 backdrop-blur-sm">
				<div class="mb-1 flex flex-wrap items-start justify-between gap-1">
					<div>
						<div class="mb-0.5 flex flex-wrap items-center gap-1">
					<h1 class="text-[10px] font-black tracking-tight text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.5)]">
								OpenAI Grid
							</h1>
							<span class="rounded-md border border-green-400/30 bg-green-400/10 px-1.5 py-0.5 text-[7px] font-bold text-green-300">API RUNTIME</span>
							<span class="flex items-center gap-1 rounded-full border border-green-400/20 bg-green-400/5 px-1.5 py-0.5 text-[8px] text-green-300">
								<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span> LIVE
							</span>
						</div>
						<p class="text-[7px] text-green-400/55">Model telemetry, pricing pressure, and live utilization in one compact board.</p>
					</div>
					<div class="flex gap-0.5">
							<a
								href="/ai?lab=OpenAI"
								class="group rounded-sm border border-green-400/40 bg-green-400/10 px-1 py-0.5 text-[6px] font-bold text-green-200 transition hover:bg-green-400/20"
								>OpenAI in AI Race</a
							>
							<a
								href="/ai"
								class="rounded-sm border border-white/10 bg-black/20 px-1 py-0.5 text-[6px] hover:border-white/25 hover:bg-white/10"
								>All Labs</a
							>
						</div>
					</div>
				</section>

				<section class="mb-1.5 grid grid-cols-2 gap-0.5 sm:grid-cols-7">
					<div class="relative overflow-hidden rounded-xl border border-green-400/30 bg-green-400/5 p-0.5 transition-all hover:border-green-400/50">
						<div class="absolute right-0 top-0 h-20 w-20 rounded-full bg-green-400/5 blur-2xl"></div>
						<p class="text-[6px] uppercase tracking-[0.14em] text-slate-400">Top model</p>
						<p class="mt-1 text-[8px] font-black text-green-300">{TOP.name}</p>
						<p class="text-[7px] text-white/70">{TOP.tier}</p>
						<p class="mt-1 text-[10px] font-black text-white">{TOP.mmlu}</p>
						<p class="mt-0.5 text-[8px] text-green-400/65">MMLU</p>
						<p class="mt-0.5 text-[6px] text-white/55">H/eval {TOP.humaneval} · math {TOP.math}</p>
						<p class="mt-0.5 text-[6px] text-white/55">lat {fmtTime(TOP.latencyMs)} · ctx {fmtContext(TOP.context)}</p>
						<p class="mt-0.5 text-[6px] text-white/55">edge {(MODEL_ORDER[0].mmlu - MODEL_ORDER[1].mmlu).toFixed(1)} over {MODEL_ORDER[1].name}</p>
						<p class="mt-0.5 text-[7px] text-white/55">quickest {quickestModel.name}</p>
						<p class="mt-0.5 text-[6px] text-white/55">value {valueIndex(TOP).toFixed(1)} · io {ioRatio(TOP)}x</p>
						<p class="mt-0.5 text-[7px] text-white/55">launched {TOP.launched}</p>
						<p class="mt-0.5 text-[6px] text-white/55">HE champ {bestHumanevalModel.name} · {bestHumanevalModel.humaneval}</p>
						<p class="mt-0.5 text-[6px] text-white/55">Math champ {bestMathModel.name} · {bestMathModel.math}</p>
						<p class="mt-0.5 text-[6px] text-white/55">ctx champ {contextChampionModel.name} · {contextChampionModel.mmlu}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[6px] uppercase tracking-[0.14em] text-slate-400">live request volume</p>
						<p class="mt-1 text-[11px] font-black text-cyan-300">{fmtNum(metrics.rps)}</p>
						<p class="text-[7px] text-white/65">RPS now</p>
						<p class="mt-0.5 text-[6px] text-white/55">throughput {fmtNum(metrics.tokensPerDay)}</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg lat {avgLatency}ms</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg MMLU {avgMmlu}</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg math {avgMath}</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg HE {avgHumaneval}</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg ctx {fmtContext(avgContext)} · avg speed {avgSpeed}</p>
						<p class="mt-0.5 text-[6px] text-white/55">value lead {bestValueModel.name}</p>
						<p class="mt-0.5 text-[6px] text-white/55">density lead {bestDensityModel.name}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[6px] uppercase tracking-[0.14em] text-slate-400">active users</p>
						<p class="mt-1 text-[11px] font-black text-fuchsia-300">{fmtNum(metrics.activeUsers)}</p>
						<p class="text-[7px] text-white/65">Tracked sessions</p>
						<p class="mt-0.5 text-[6px] text-white/55">uptime {metrics.uptime}%</p>
						<p class="mt-0.5 text-[6px] text-white/55">quality {qualityScore(TOP)}</p>
						<p class="mt-0.5 text-[6px] text-white/55">queue {metrics.queueDepth} · avg ctx {fmtContext(avgContext)}</p>
						<p class="mt-0.5 text-[6px] text-white/55">avg in/out ${avgInPrice} / ${avgOutPrice}</p>
						<p class="mt-0.5 text-[6px] text-white/55">quality leader {bestValueModel.name}</p>
						<p class="mt-0.5 text-[6px] text-white/55">value spread {valueIndex(bestValueModel).toFixed(1)} vs {valueIndex(cheapestInModel).toFixed(1)}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[6px] uppercase tracking-[0.14em] text-slate-400">best value model</p>
						<p class="mt-1 text-[10px] font-black text-emerald-300">{bestValueModel.name}</p>
						<p class="text-[6px] text-white/70">{bestValueModel.tier}</p>
						<p class="mt-0.5 text-[6px] text-white/55">value {valueIndex(bestValueModel)}</p>
						<p class="mt-0.5 text-[7px] text-white/55">io {ioRatio(bestValueModel)}x</p>
						<p class="mt-0.5 text-[7px] text-white/55">ctx {fmtContext(bestValueModel.context)} · speed {bestValueModel.speed}</p>
						<p class="mt-0.5 text-[7px] text-white/55">fastest {fastestModel.name} · launched {fastestModel.launched}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[7px] uppercase tracking-[0.14em] text-slate-400">cheapest in / out</p>
						<p class="mt-1 text-[12px] font-black text-emerald-300">${cheapestIn} / ${cheapestOut}</p>
						<p class="text-[9px] text-white/65">per 1M tokens</p>
						<p class="mt-0.5 text-[7px] text-white/55">ratio {fmtRatio(cheapestOut, cheapestIn)}</p>
						<p class="mt-0.5 text-[7px] text-white/55">from {cheapestInModel.name}</p>
						<p class="mt-0.5 text-[7px] text-white/55">tier {cheapestInModel.tier}</p>
						<p class="mt-0.5 text-[7px] text-white/55">out champ {cheapestOutModel.name} · ${cheapestOutModel.priceOut}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
						<p class="text-[6px] uppercase tracking-[0.14em] text-slate-400">best cost model</p>
						<p class="mt-1 text-[10px] font-black text-violet-300">{bestDensityModel.name}</p>
						<p class="text-[6px] text-white/70">{bestDensityModel.tier}</p>
						<p class="mt-0.5 text-[7px] text-white/55">density {densityScore(bestDensityModel)}</p>
						<p class="mt-0.5 text-[6px] text-white/55">in+out / mmlu</p>
						<p class="mt-0.5 text-[6px] text-white/55">context champ {contextChampionModel.name}</p>
						<p class="mt-0.5 text-[6px] text-white/55">price spread ${(cheapestOut - cheapestIn).toFixed(2)} / M</p>
						<p class="mt-0.5 text-[7px] text-white/55">fastest {fastestModel.name}</p>
						<p class="mt-0.5 text-[7px] text-white/55">quality {qualityScore(bestDensityModel)}</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-emerald-400/5 p-0.5">
						<p class="text-[6px] uppercase tracking-[0.14em] text-slate-400">market pulse</p>
						{#if intelligenceLoading}
							<p class="mt-1 text-[10px] font-black text-emerald-300">—</p>
							<p class="mt-0.5 text-[7px] text-white/65">Updating...</p>
						{:else if intelligenceError}
							<p class="mt-1 text-[10px] font-black text-red-300">Unavailable</p>
							<p class="mt-0.5 text-[7px] text-white/65">{intelligenceError}</p>
						{:else if intelligence.market}
							<p class="mt-1 text-[10px] font-black text-emerald-300">{intelligence.market.totalMarketCap ? fmtNum(intelligence.market.totalMarketCap) : '--'}</p>
							<p class="text-[7px] text-white/65">global mcap</p>
							<p class="mt-0.5 text-[6px] text-white/55">
								24h {fmtSigned(intelligence.market.mcapChange)} · BTC {intelligence.market.btcDominance ? `${intelligence.market.btcDominance.toFixed(2)}%` : '--'}
							</p>
							<p class="mt-0.5 text-[6px] text-white/55">vol {fmtSigned(intelligence.market.volumeChange)} · ETH {intelligence.market.ethDominance ? `${intelligence.market.ethDominance.toFixed(2)}%` : '--'}</p>
							<p class="mt-0.5 text-[6px] text-white/55">updated {intelligence.updatedAt}</p>
						{/if}
					</div>
				</section>

			<div class="flex flex-col gap-1 lg:flex-row">
				<div class="min-w-0 flex-1 space-y-0.5">
					<div class="rounded-xl border border-white/10 bg-[#0a1613]/70 p-0.5 backdrop-blur-sm">
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
											<div class="h-full rounded-full bg-green-300/95" style={`width:${model.mmlu}%;`} />
										</div>
											<div class="grid grid-cols-2 gap-0.5 text-white/75">
												<p><span class="text-white/55">Lat</span> {fmtTime(model.latencyMs + 0)}</p>
												<p><span class="text-white/55">Ctx</span> {fmtContext(model.context)}</p>
												<p><span class="text-white/55">Cost-eff</span> {valueIndex(model).toFixed(1)}x</p>
												<p><span class="text-white/55">H/E</span> {model.humaneval}</p>
												<p><span class="text-white/55">Math</span> {model.math}</p>
												<p><span class="text-white/55">Score</span> {qualityScore(model)}</p>
												<p><span class="text-white/55">Cost</span> ${model.priceIn}/${model.priceOut}</p>
												<p><span class="text-white/55">Launched</span> {model.launched}</p>
												<p><span class="text-white/55">Value</span> {valueIndex(model)}</p>
											<p><span class="text-white/55">IO</span> {ioRatio(model)}x</p>
												<p><span class="text-white/55">Vision</span> {model.vision ? 'Y' : 'N'}</p>
												<p><span class="text-white/55">Tools</span> {model.tools ? 'Y' : 'N'}</p>
												<p><span class="text-white/55">Speed</span> {model.speed}</p>
												<p><span class="text-white/55">Density</span> {densityScore(model)}</p>
												<p><span class="text-white/55">Cost-eff</span> {valueIndex(model).toFixed(1)}x</p>
												<p><span class="text-white/55">Fastest</span> {fastestModel.name}</p>
											</div>
										<p class="text-[5px] leading-snug text-white/50">
											<span class="text-white/70">Use:</span> {model.tags?.join(' • ')}
										</p>
										<p class="text-[5px] leading-snug text-white/50">
											<span class="text-white/70">Signals:</span> value {valueIndex(model).toFixed(1)} · quality {qualityScore(model).toFixed(1)} · io {ioRatio(model)}x
										</p>
										<div class="mt-0.5 flex items-center gap-1">
											<button
												onclick={() => (activeModel = model.id)}
												class={`rounded-full border px-1 py-0.5 text-[5px] font-black uppercase tracking-[0.12em] ${activeModel === model.id ? 'border-green-300 bg-green-400/20 text-green-200' : 'border-white/15 bg-white/5 text-white/55'}`}
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

					<div class="rounded-xl border border-white/10 bg-[#0a1613]/70 p-0.5 backdrop-blur-sm">
						<h2 class="mb-0.5 text-[8px] font-bold tracking-wide text-white">Use-case routing map</h2>
						<div class="grid gap-0.5 lg:grid-cols-4">
							{#each USE_CASES as c}
								<div class="rounded-md border border-white/10 bg-black/30 p-0.5">
									<p class="mb-0.5 text-[8px] uppercase tracking-[0.14em] text-white/55">{c.title}</p>
									<p class="text-[9px] font-semibold text-green-200">{c.winner}</p>
									<p class="mt-0.5 text-[7px] leading-tight text-white/65">{c.why}</p>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<aside class="flex shrink-0 flex-col gap-0.5 lg:w-36 xl:w-36">
					<div class="rounded-xl border border-white/10 bg-[#0a1613]/70 p-0.5 backdrop-blur-sm">
						<div class="mb-0.5 flex items-center justify-between">
							<p class="text-[8px] font-bold text-white">⚡ Live pulse</p>
							<span class="rounded-full border border-green-400/30 bg-green-400/15 px-1 py-0.5 text-[6px] font-black text-green-200">SAMPLE FEED</span>
						</div>
							<ul class="space-y-0.5 text-[5px] max-h-28 overflow-y-auto pr-1">
								{#each pulseLog as p (p.id)}
									<li class="rounded-md border border-white/10 bg-black/30 px-1 py-0.5 text-white/80 hover:bg-black/50">
										<div class="flex items-center justify-between">
											<span class="text-[7px] font-bold text-green-200">{p.model}</span>
											<span class="rounded-sm border border-white/10 px-1 py-0.5 text-[6px] font-semibold">{p.time}</span>
										</div>
										<p class="mt-0.5 text-[6px] text-white/60">
												{p.qps}k QPS · {p.cost} · lat {p.latencyMs}ms · ctx {fmtContext(p.context)} · speed {p.speed}
											</p>
										</li>
									{/each}
								</ul>
							</div>

						<div class="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-0.5">
							<div class="mb-0.5 flex items-center justify-between">
								<p class="text-[8px] font-bold text-white">🌎 OpenAI desk signal</p>
								<span class="text-[8px] text-slate-400">{intelligence.updatedAt || '—'}</span>
							</div>
							{#if intelligenceLoading}
								<p class="text-[7px] text-white/65">Fetching global and sentiment feed...</p>
							{:else if intelligenceError}
								<p class="text-[7px] text-red-300">Signal degraded: {intelligenceError}</p>
							{:else if intelligence.market}
								<div class="space-y-0.5">
									<div class="rounded-md border border-white/10 bg-black/25 p-0.5 text-[6px] text-white/70">
										<div class="flex items-center justify-between">
											<p class="text-white/50">Fear & Greed</p>
											<p class={currentFear !== null ? fearSignalTone(currentFear).text : 'text-slate-400'}>{currentFear !== null ? `${currentFear} (${intelligence.fearGreed.label})` : 'No signal'}</p>
										</div>
										<div class="mt-1 flex items-end gap-0.5">
											{#each [1,2,3,4,5,6,7,8,9,10] as i}
												<div class="flex-1 rounded-t bg-white/15" style={`height: ${((currentFear ?? 50) * i) % 100}%`}></div>
											{/each}
										</div>
									</div>
									<div class="grid grid-cols-2 gap-0.5">
										<div class="rounded-md border border-white/10 bg-black/25 p-0.5 text-[6px]">
											<p class="text-white/55">Top gainer</p>
											<p class="mt-0.5 text-white/85">{topGainer ? `${topGainer.symbol} ${fmtSigned(topGainer.change24h)}` : 'No data'}</p>
										</div>
										<div class="rounded-md border border-white/10 bg-black/25 p-0.5 text-[6px]">
											<p class="text-white/55">Top loser</p>
											<p class="mt-0.5 text-white/85">{topLoser ? `${topLoser.symbol} ${fmtSigned(topLoser.change24h)}` : 'No data'}</p>
										</div>
									</div>
									<div class="text-[6px] text-white/55">
										Active markets: {intelligence.market.activeMarkets ? intelligence.market.activeMarkets.toLocaleString() : '--'}
									</div>
								</div>
							{/if}
						</div>

						<div class="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-0.5">
							<div class="mb-0.5 flex items-center justify-between">
								<p class="text-[8px] font-bold text-white">🛰️ OpenAI ecosystem</p>
								<span class="text-[8px] text-slate-400">{ecosystemIntel.updatedAt || '—'}</span>
							</div>
							{#if ecosystemIntelLoading}
								<p class="text-[7px] text-white/65">Resolving GitHub repo health...</p>
							{:else if ecosystemIntelError}
								<p class="text-[7px] text-red-300">Ecosystem feed failed: {ecosystemIntelError}</p>
							{:else}
								<div class="grid grid-cols-2 gap-0.5 text-[6px] text-white/70">
									<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
										<p class="text-white/55">tracked repos</p>
										<p class="text-[10px] font-black text-cyan-300">{ecosystemIntel.repos.length}</p>
									</div>
									<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
										<p class="text-white/55">search hits</p>
										<p class="text-[10px] font-black text-cyan-300">{fmtNum(ecosystemIntel.searchCount)}</p>
									</div>
									<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
										<p class="text-white/55">stars</p>
										<p class="text-[10px] font-black text-cyan-300">{fmtNum(ecosystemIntel.totalStars)}</p>
									</div>
									<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
										<p class="text-white/55">forks</p>
										<p class="text-[10px] font-black text-cyan-300">{fmtNum(ecosystemIntel.totalForks)}</p>
									</div>
								</div>
								<div class="mt-0.5">
									<p class="text-[6px] text-white/55">
										top repo:
										<span class="text-white/90">
											{#if ecosystemIntel.topRepo}
												{ecosystemIntel.topRepo.name} · {fmtNum(ecosystemIntel.topRepo.stars)}★
											{:else}
												—
											{/if}
										</span>
									</p>
									<p class="mt-0.5 text-[6px] text-white/55">
										issues {fmtNum(ecosystemIntel.totalIssues)} · watchers {fmtNum(ecosystemIntel.totalWatchers)}
									</p>
								</div>
								<div class="mt-0.5 h-5 flex items-end gap-0.5">
									{#each ecosystemBars as level, idx (idx)}
										<div class="flex-1 rounded-t bg-gradient-to-t from-cyan-400/25 to-cyan-400/65" style={`height:${level}%`}></div>
									{/each}
								</div>
							{/if}
						</div>

						<div class="rounded-xl border border-white/10 bg-[#0a1613]/70 p-0.5 backdrop-blur-sm">
							<div class="mb-0.5 flex items-center justify-between">
								<p class="text-[8px] font-bold text-white">OpenAI Model status</p>
								<span class="text-[8px] text-slate-400">Live</span>
							</div>
							<div class="space-y-0.5">
								{#each live as item}
								{@const model = MODEL_BY_ID[item.id] ?? TOP}
								{@const st = statusBadge(item.status)}
								<div class="rounded-md border border-white/10 bg-black/25 p-0.5">
									<div class="flex items-center justify-between gap-2">
										<div>
											<p class="font-semibold text-[9px] text-white">{model?.name}</p>
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
													<p class="text-white/55">lat budget</p>
													<p class="font-semibold">{model?.latencyMs}ms</p>
												</div>
											</div>
											<div class="mt-0.5 grid grid-cols-2 gap-1 text-[6px] text-white/45">
												<p>context {fmtContext(model?.context)}</p>
												<p>launched {model?.launched}</p>
												<p>quality {qualityScore(model ?? TOP)}</p>
												<p>value {valueIndex(model ?? TOP)}</p>
												<p>io {ioRatio(model ?? TOP)}x</p>
												<p>speed {(model?.speed ?? 'n/a')}</p>
												<p>density {densityScore(model ?? TOP)}</p>
												<p>latency band {Math.round((model?.latencyMs ?? 0) / 50)}x</p>
											</div>
									</div>
								{/each}
							</div>
						</div>

						<div class="rounded-xl border border-green-400/20 bg-green-400/[0.06] p-0.5">
							<div class="mb-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-green-300">Throughput</div>
							<div class="h-7 flex items-end gap-0.5">
								{#each throughputBars as height (height)}
									<div
										class="flex-1 rounded-t bg-gradient-to-t from-green-400/20 to-green-400/60"
										style={`height: ${height}%`}
									></div>
								{/each}
							</div>
							<p class="mt-0.5 text-[7px] text-slate-600">Queue depth: <span class="font-semibold text-green-300">{metrics.queueDepth}</span></p>
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
