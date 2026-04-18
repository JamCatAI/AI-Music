<script>
	import { onMount } from 'svelte';

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
				{ name: 'GPT-5.4', ctx: '1M', input: 2.5, output: 15, mmlu: 91.4, modal: true },
				{ name: 'GPT-5.5', ctx: '1M', input: 2.5, output: 15, mmlu: 96.7, modal: true },
				{ name: 'GPT-4o mini', ctx: '128K', input: 0.15, output: 0.6, mmlu: 82.0, modal: true }
			],
			hq: 'San Francisco',
			api: true,
			open: false,
			news: 'GPT-5.5 improves reasoning and tool routing. Leads SWE-bench at 74.9%.'
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
				{ name: 'Claude Sonnet 4.6', ctx: '1M', input: 3, output: 15, mmlu: 90.5, modal: true },
				{ name: 'Claude Opus 4.6', ctx: '1M', input: 5, output: 25, mmlu: 90.5, modal: true },
				{ name: 'Claude Haiku 4.5', ctx: '200K', input: 0.8, output: 4, mmlu: 85.0, modal: true }
			],
			hq: 'San Francisco',
			api: true,
			open: false,
			news: 'Claude Opus 4.6 leads SWE-bench Verified at 80.8%. Adaptive Thinking mode ships.'
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
				{ name: 'Grok 4.20', ctx: '128K', input: 2, output: 10, mmlu: 93.5, modal: true },
				{ name: 'Grok-3 mini', ctx: '131K', input: 0.3, output: 0.5, mmlu: 87.4, modal: false },
				{ name: 'Grok-2', ctx: '131K', input: 2, output: 10, mmlu: 87.5, modal: true }
			],
			hq: 'Austin, TX',
			api: true,
			open: false,
			news: 'Grok 4.20 uses four-agent architecture. Real-time X/Twitter data unique to frontier models.'
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
				{ name: 'Mistral Large 2', ctx: '128K', input: 3, output: 9, mmlu: 84.0, modal: false },
				{ name: 'Mixtral 8x22B', ctx: '65K', input: 2, output: 6, mmlu: 77.8, modal: false },
				{ name: 'Mistral 7B', ctx: '32K', input: 0.25, output: 0.25, mmlu: 62.5, modal: false }
			],
			hq: 'Paris, France',
			api: true,
			open: true,
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
				{ name: 'Gemini 3.1 Pro', ctx: '1M', input: 2, output: 12, mmlu: 94.1, modal: true },
				{ name: 'Gemini 2.0 Flash', ctx: '1M', input: 0.1, output: 0.4, mmlu: 83.6, modal: true },
				{ name: 'Gemma 3 27B', ctx: '128K', input: 0, output: 0, mmlu: 76.0, modal: false }
			],
			hq: 'London / Mountain View',
			api: true,
			open: true,
			news: 'Gemini 3.1 Pro leads MMLU at 94.1%. SWE-bench at 78.8%. Best price-performance ratio.'
		},
		{
			id: 'meta',
			name: 'Meta',
			logo: '👥',
			tagline: 'Open-weight scale, long context by default',
			color: '#1877f2',
			bg: '#07182f',
			border: 'rgba(24,119,242,0.24)',
			founded: 2004,
			valuation: 'Private',
			models: [
				{ name: 'Llama 4 Maverick', ctx: '1M', input: 0.19, output: 0.49, mmlu: 89.8, modal: true },
				{ name: 'Llama 4 Scout', ctx: '1M', input: 0.1, output: 0.3, mmlu: 87.6, modal: true },
				{ name: 'Llama 3.3 70B', ctx: '128K', input: 0.12, output: 0.35, mmlu: 84.5, modal: false }
			],
			hq: 'Menlo Park',
			api: true,
			open: true,
			news: 'Meta pushes open-weight options with 1M context and strong multimodal fine-tuning potential.'
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
				{ name: 'DeepSeek V4', ctx: '128K', input: 0.28, output: 0.42, mmlu: 89.0, modal: true },
				{ name: 'DeepSeek R1', ctx: '128K', input: 0.55, output: 2.19, mmlu: 90.8, modal: false },
				{ name: 'DeepSeek V3', ctx: '128K', input: 0.27, output: 1.1, mmlu: 88.5, modal: false }
			],
			hq: 'Hangzhou, China',
			api: true,
			open: true,
			news: 'DeepSeek V4 trained on Huawei Ascend chips. 1T params, 90% of GPT-5.4 at 1/50th price.'
		}
	];

	// ── Benchmarks ──────────────────────────────────────────────
	const DETAILED_BENCHMARKS = [
		{ key: 'mmlu', label: 'MMLU', desc: 'Massive Multitask Language Understanding', max: 100 },
		{ key: 'humaneval', label: 'HumanEval', desc: 'Code generation', max: 100 },
		{ key: 'math', label: 'MATH', desc: 'Advanced math reasoning', max: 100 }
	];

	// Best model per lab for race chart
	const RACE_DATA = LABS.map((l) => ({
		id: l.id,
		name: l.name,
		color: l.color,
		score: Math.max(...l.models.map((m) => m.mmlu)),
		topModel: l.models.reduce((a, b) => (a.mmlu > b.mmlu ? a : b)).name
	})).sort((a, b) => b.score - a.score);

	const PRICE_DATA = LABS.map((l) => ({
		name: l.name,
		color: l.color,
		cheapest: Math.min(...l.models.map((m) => m.input)),
		costliest: Math.max(...l.models.map((m) => m.output))
	})).sort((a, b) => a.cheapest - b.cheapest);

	let statuses = $state(
		LABS.map((l) => ({
			id: l.id,
			latency: Math.floor(Math.random() * 300) + 80,
			uptime: +(99 + Math.random() * 0.99).toFixed(2),
			rps: Math.floor(Math.random() * 8000) + 2000,
			ok: true
		}))
	);

	let totalTokens = $state(4_820_341_920);
	let activeUsers = $state(12_480_200);
	let modelsDeployed = $state(847);

	const TICKER =
		'🧠 AI RACE 2026 · OPENAI · ANTHROPIC · GROK · MISTRAL · GOOGLE DEEPMIND · DEEPSEEK · META · LLAMA · GEMMA · CLAUDE · GPT · ';

	const MODELS = [
		{
			id: 'gpt54',
			name: 'GPT-5.4',
			lab: 'OpenAI',
			color: '#10a37f',
			bg: 'from-[#10a37f] to-[#1a7f64]',
			open: false,
			params: '~500B',
			context: 1_000_000,
			launched: 'Mar 2026',
			mmlu: 91.4,
			humaneval: 74.9,
			math: 83.0,
			price_in: 2.5,
			price_out: 15.0,
			speed: 95,
			vision: true,
			tools: true,
			finetune: true,
			streaming: true,
			tags: ['Multimodal', 'Code', 'Vision', 'SOTA'],
			desc: 'OpenAI\'s latest flagship. Unifies GPT and Codex lines. Tool Search for dynamic tool loading. 1M context.'
		},
		{
			id: 'gpt55',
			name: 'GPT-5.5',
			lab: 'OpenAI',
			color: '#10a37f',
			bg: 'from-[#0d8a6a] to-[#0a6e54]',
			open: false,
			params: '~500B',
			context: 1_000_000,
			launched: 'Mar 2026',
			mmlu: 96.7,
			humaneval: 99.5,
			math: 97.9,
			price_in: 2.5,
			price_out: 15.0,
			speed: 95,
			vision: true,
			tools: true,
			finetune: false,
			streaming: true,
			tags: ['Reasoning', 'Code', 'Science', 'SOTA'],
			desc: 'OpenAI\'s current flagship reasoning model, replacing the prior generation.'
		},
		{
			id: 'claudeopus',
			name: 'Claude Opus 4.6',
			lab: 'Anthropic',
			color: '#d97757',
			bg: 'from-[#d97757] to-[#b85c35]',
			open: false,
			params: 'Unknown',
			context: 1_000_000,
			launched: 'Feb 2026',
			mmlu: 90.5,
			humaneval: 80.8,
			math: 95.0,
			price_in: 5.0,
			price_out: 25.0,
			speed: 50,
			vision: true,
			tools: true,
			finetune: false,
			streaming: true,
			tags: ['Safety', 'Reasoning', 'Long Context', 'Code'],
			desc: 'Anthropic\'s most intelligent model. Leads SWE-bench Verified at 80.8%. Adaptive Thinking mode.'
		},
		{
			id: 'claudesonnet',
			name: 'Claude Sonnet 4.6',
			lab: 'Anthropic',
			color: '#d97757',
			bg: 'from-[#e88963] to-[#b85c35]',
			open: false,
			params: 'Unknown',
			context: 1_000_000,
			launched: 'Feb 2026',
			mmlu: 90.2,
			humaneval: 85.4,
			math: 92.6,
			price_in: 3.0,
			price_out: 15.0,
			speed: 75,
			vision: true,
			tools: true,
			finetune: false,
			streaming: true,
			tags: ['Balanced', 'Long Context', 'Code', 'Reasoning'],
			desc: 'Claude Sonnet for reliable day-to-day coding, writing, and structured reasoning workloads.'
		},
		{
			id: 'claudehaiku',
			name: 'Claude Haiku 4.5',
			lab: 'Anthropic',
			color: '#d97757',
			bg: 'from-[#f0a17c] to-[#c56a41]',
			open: false,
			params: 'Unknown',
			context: 200_000,
			launched: 'Jan 2026',
			mmlu: 88.8,
			humaneval: 83.1,
			math: 89.1,
			price_in: 0.8,
			price_out: 4.0,
			speed: 98,
			vision: true,
			tools: true,
			finetune: false,
			streaming: true,
			tags: ['Fast', 'Cost-Efficient', 'Code', 'Vision'],
			desc: 'A fast Claude-tier option for high-volume prompts and lightweight agents.'
		},
		{
			id: 'gemini31',
			name: 'Gemini 3.1 Pro',
			lab: 'Google DeepMind',
			color: '#4285f4',
			bg: 'from-[#4285f4] to-[#1a56c4]',
			open: true,
			params: 'Unknown',
			context: 1_000_000,
			launched: 'Feb 2026',
			mmlu: 94.1,
			humaneval: 78.8,
			math: 94.3,
			price_in: 2.0,
			price_out: 12.0,
			speed: 85,
			vision: true,
			tools: true,
			finetune: false,
			streaming: true,
			tags: ['1M Context', 'Multimodal', 'Code', 'Science'],
			desc: 'Google\'s strongest all-around model. Leads MMLU at 94.1% with excellent price-performance.'
		},
		{
			id: 'grok420',
			name: 'Grok 4.20',
			lab: 'xAI',
			color: '#e5e5e5',
			bg: 'from-[#333] to-[#111]',
			open: false,
			params: '~300B',
			context: 128_000,
			launched: 'Feb 2026',
			mmlu: 93.5,
			humaneval: 70.0,
			math: 92.0,
			price_in: 2.0,
			price_out: 10.0,
			speed: 75,
			vision: true,
			tools: true,
			finetune: false,
			streaming: true,
			tags: ['Reasoning', 'Real-time', 'Social Data', 'Math'],
			desc: 'Four-agent architecture with live X/Twitter integration for freshness and novelty.'
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
			humaneval: 92.5,
			math: 97.3,
			price_in: 0.55,
			price_out: 2.19,
			speed: 35,
			vision: false,
			tools: true,
			finetune: true,
			streaming: true,
			tags: ['Open Source', 'Math', 'Reasoning', 'Cheap'],
			desc: 'Open-source reasoning model that remains one of the strongest benchmarks-to-cost options.'
		},
		{
			id: 'deepseekv4',
			name: 'DeepSeek V4',
			lab: 'DeepSeek',
			color: '#4d6bfe',
			bg: 'from-[#2f4bb2] to-[#18338f]',
			open: true,
			params: '1T MoE',
			context: 128_000,
			launched: 'Mar 2026',
			mmlu: 89.0,
			humaneval: 77.8,
			math: 90.0,
			price_in: 0.28,
			price_out: 0.42,
			speed: 55,
			vision: true,
			tools: true,
			finetune: true,
			streaming: true,
			tags: ['Open Source', 'MoE', 'Cheap', 'Chat'],
			desc: '1T params with efficient throughput and competitive benchmark performance.'
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
			price_in: 2.0,
			price_out: 6.0,
			speed: 95,
			vision: false,
			tools: true,
			finetune: true,
			streaming: true,
			tags: ['European', 'Fast', 'Code', 'Multilingual'],
			desc: 'Great balanced model with a strong open-source community.'
		},
		{
			id: 'glm5',
			name: 'GLM-5',
			lab: 'Zhipu AI',
			color: '#8b5cf6',
			bg: 'from-[#8b5cf6] to-[#6d28d9]',
			open: true,
			params: '744B MoE',
			context: 128_000,
			launched: 'Feb 2026',
			mmlu: 88.0,
			humaneval: 77.8,
			math: 92.7,
			price_in: 0.15,
			price_out: 0.45,
			speed: 70,
			vision: true,
			tools: true,
			finetune: true,
			streaming: true,
			tags: ['Open Source', 'MoE', 'Chinese', 'Fast'],
			desc: 'Strong open-source performance with a solid efficiency profile.'
		},
		{
			id: 'llama4',
			name: 'Llama 4 Maverick',
			lab: 'Meta',
			color: '#0064e0',
			bg: 'from-[#0064e0] to-[#003fa3]',
			open: true,
			params: '400B MoE',
			context: 1_000_000,
			launched: 'Mar 2026',
			mmlu: 89.8,
			humaneval: 80.0,
			math: 88.5,
			price_in: 0.19,
			price_out: 0.49,
			speed: 120,
			vision: true,
			tools: true,
			finetune: true,
			streaming: true,
			tags: ['Open Source', 'MoE', 'Fast', 'Vision'],
			desc: 'Great 1M-context on-prem-friendly choice for teams that need deployment flexibility.'
		},
		{
			id: 'kimi',
			name: 'Kimi K1.5',
			lab: 'Moonshot AI',
			color: '#7c3aed',
			bg: 'from-[#7c3aed] to-[#5b21b6]',
			open: true,
			params: '1T MoE',
			context: 256_000,
			launched: 'Jan 2025',
			mmlu: 87.3,
			humaneval: 89.2,
			math: 95.8,
			price_in: 0.5,
			price_out: 2.0,
			speed: 65,
			vision: true,
			tools: true,
			finetune: false,
			streaming: true,
			tags: ['Chinese', 'Long Context', 'Reasoning', '1T MoE'],
			desc: 'Long-context champion in many benchmark workflows with strong bilingual support.'
		},
		{
			id: 'qwen35',
			name: 'Qwen 3.5 9B',
			lab: 'Alibaba',
			color: '#ff6a00',
			bg: 'from-[#ff6a00] to-[#c44a00]',
			open: true,
			params: '9B',
			context: 128_000,
			launched: 'Mar 2026',
			mmlu: 85.0,
			humaneval: 81.7,
			math: 83.2,
			price_in: 0.1,
			price_out: 0.3,
			speed: 80,
			vision: true,
			tools: true,
			finetune: true,
			streaming: true,
			tags: ['Open Source', 'MoE', 'Chinese', 'Fast'],
			desc: 'Compact model that can run locally while remaining strong in long-form reasoning.'
		},
		{
			id: 'llama4scout',
			name: 'Llama 4 Scout',
			lab: 'Meta',
			color: '#1877f2',
			bg: 'from-[#1877f2] to-[#0f4fa8]',
			open: true,
			params: '70B MoE',
			context: 1_000_000,
			launched: 'Apr 2026',
			mmlu: 87.6,
			humaneval: 86.7,
			math: 90.1,
			price_in: 0.1,
			price_out: 0.3,
			speed: 125,
			vision: true,
			tools: true,
			finetune: true,
			streaming: true,
			tags: ['Open Source', 'Long Context', 'Vision', 'Fast'],
			desc: 'Lower-cost Llama 4 variant with very long context and practical multimodal throughput.'
		},
	];

	const SORT_OPTIONS = [
		{ key: 'mmlu', label: 'MMLU', better: 'higher' },
		{ key: 'humaneval', label: 'HumanEval', better: 'higher' },
		{ key: 'math', label: 'MATH', better: 'higher' },
		{ key: 'speed', label: 'Speed', better: 'higher' },
		{ key: 'context', label: 'Context', better: 'higher' },
		{ key: 'price_in', label: 'Input Price', better: 'lower' }
	];

	const MODEL_LABS = ['All', ...new Set(MODELS.map((m) => m.lab))];
	const NAV_LINKS = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'race', label: 'Race' },
		{ id: 'labs', label: 'Labs' },
		{ id: 'markets', label: 'Market' },
		{ id: 'matrix', label: 'Matrix' },
		{ id: 'models', label: 'Models' },
		{ id: 'facts', label: 'Insights' }
	];
	const NAV_SECTION_IDS = NAV_LINKS.map((link) => link.id);
	const PANEL_PREVIEW = 3;
	const labsSummary = $derived(LABS.slice(0, 4));
	const LAB_ID_BY_NAME = Object.fromEntries(LABS.map((lab) => [lab.name, lab.id]));
	const qualityScore = (model) => +(model.mmlu * 0.45 + model.humaneval * 0.2 + model.math * 0.2 + Math.min(model.speed, 100) * 0.15).toFixed(1);
	const ioCostRatio = (model) => +(model.price_out / Math.max(0.01, model.price_in)).toFixed(2);
	const contextLabel = (v) => (v >= 1_000_000 ? `${v / 1_000_000}M` : `${(v / 1000).toFixed(0)}K`);
	const valueDensity = (model) =>
		+(model.mmlu * 0.5 + model.math * 0.25 + model.humaneval * 0.25 + model.speed * 0.01).toFixed(1);
	const valueEfficiency = (model) => +(valueDensity(model) / Math.max(0.01, model.price_in)).toFixed(2);
	const featureBits = (model) => ['Vision', 'Tools', 'Fine-tune', 'Streaming'].filter((_, i) => [model.vision, model.tools, model.finetune, model.streaming][i]).join(' · ');

	let sortKey = $state('mmlu');
	let sortDir = $state(-1);
	let selectedLab = $state('All');
	let searchQuery = $state('');
	let showOpenOnly = $state(false);
	let panelExpanded = $state({
		labs: false,
		markets: false,
		matrix: false,
		models: false,
		facts: false
	});
	let compactMode = $state(true);
	let navHidden = $state(false);
	let activeNav = $state('overview');
	let lastScrollTop = $state(0);
	let scrollTimer = 0;

	let filteredModels = $derived(
		MODELS
			.filter((m) => selectedLab === 'All' || m.lab === selectedLab)
			.filter((m) => (showOpenOnly ? m.open : true))
			.filter((m) => {
				const q = searchQuery.trim().toLowerCase();
				if (!q) return true;
				const text = `${m.name} ${m.lab} ${m.desc} ${m.tags.join(' ')}`.toLowerCase();
				return text.includes(q);
			})
			.sort((a, b) => {
				const va = a[sortKey];
				const vb = b[sortKey];
				const sortDef = SORT_OPTIONS.find((s) => s.key === sortKey);
				const lowerIsBetter = sortDef?.better === 'lower';
				if (lowerIsBetter) return sortDir === -1 ? va - vb : vb - va;
				return sortDir === -1 ? vb - va : va - vb;
			})
	);

	const topModelsByMmlu = $derived([...MODELS].sort((a, b) => b.mmlu - a.mmlu).slice(0, 5));
	const filteredTop = $derived(filteredModels.slice(0, 9));
	const activeModelsCount = $derived(filteredModels.length);
	const topLabs = $derived(RACE_DATA.slice(0, 3));
	const topModelsPreview = $derived(filteredModels.slice(0, PANEL_PREVIEW));
	const maxCheapestPrice = $derived(Math.max(...PRICE_DATA.map((x) => x.cheapest), 1));
	const compactStats = $derived(PRICE_DATA.slice(0, 3));
	const compactHealth = $derived(statuses.slice(0, 3));
	const compactByScore = $derived(RACE_DATA.slice(0, 4));
	const compactMarket = $derived([...PRICE_DATA].sort((a, b) => a.cheapest - b.cheapest).slice(0, 4));
	const topByQuality = $derived([...filteredModels].sort((a, b) => qualityScore(b) - qualityScore(a)).slice(0, 5));
	const topByValue = $derived([...filteredModels].sort((a, b) => valueDensity(b) - valueDensity(a)).slice(0, 6));
	const topByHumanEval = $derived([...filteredModels].slice().sort((a, b) => b.humaneval - a.humaneval).slice(0, 4));
	const topByMath = $derived([...filteredModels].slice().sort((a, b) => b.math - a.math).slice(0, 4));
	const topByOpen = $derived([...filteredModels].filter((m) => m.open).slice().sort((a, b) => b.mmlu - a.mmlu).slice(0, 4));
	const topBySpeed = $derived([...filteredModels].slice().sort((a, b) => b.speed - a.speed).slice(0, 3));
	const topByContext = $derived([...filteredModels].slice().sort((a, b) => b.context - a.context).slice(0, 3));
	const topByCheapestIn = $derived([...filteredModels].slice().sort((a, b) => a.price_in - b.price_in).slice(0, 3));
	const statusMap = $derived(Object.fromEntries(statuses.map((entry) => [entry.id, entry])));

	const mapStatusByLab = (labName) => {
		const labId = LAB_ID_BY_NAME[labName];
		return statusMap[labId] || { latency: '—', uptime: '—', rps: '—' };
	};

	const formatCompact = (num) => {
		if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(2)}T`;
		if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
		if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
		return num.toLocaleString();
	};

	function jumpToSection(sectionId) {
		const el = document.getElementById(sectionId);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function togglePanel(key) {
		panelExpanded = { ...panelExpanded, [key]: !panelExpanded[key] };
	}

	onMount(() => {
		const tick = () => {
			statuses = statuses.map((s) => ({
				...s,
				latency: Math.max(40, s.latency + Math.floor((Math.random() - 0.5) * 30)),
				rps: Math.max(1000, s.rps + Math.floor((Math.random() - 0.5) * 400))
			}));
			totalTokens += Math.floor(Math.random() * 2_000_000);
			activeUsers += Math.floor((Math.random() - 0.4) * 1200);
			modelsDeployed += Math.random() < 0.05 ? 1 : 0;
		};

		function onScroll() {
			if (scrollTimer) {
				window.cancelAnimationFrame(scrollTimer);
			}
			scrollTimer = window.requestAnimationFrame(() => {
				const y = window.scrollY || 0;
				const delta = y - lastScrollTop;
				const threshold = 24;
				const hideOffset = 170;

				if (Math.abs(delta) > threshold) {
					navHidden = y > hideOffset && delta > 0;
					lastScrollTop = y;
				}

				const marker = window.innerHeight * 0.42;
				let next = activeNav;
				for (let i = 0; i < NAV_SECTION_IDS.length; i += 1) {
					const id = NAV_SECTION_IDS[i];
					const section = document.getElementById(id);
					if (!section) continue;
					const rect = section.getBoundingClientRect();
					if (rect.top <= marker && rect.bottom >= marker) {
						next = id;
						break;
					}
				}
				activeNav = next;
			});
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		const iv = setInterval(() => {
			tick();
		}, 1200);

		return () => {
			clearInterval(iv);
			window.removeEventListener('scroll', onScroll);
			if (scrollTimer) window.cancelAnimationFrame(scrollTimer);
		};
	});
</script>

<div class="relative min-h-screen overflow-hidden bg-[#04070f] text-white">
	<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(66,133,244,0.24),_transparent_45%),radial-gradient(circle_at_70%_20%,_rgba(76,175,80,0.12),_transparent_38%)]" />

	<div class="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/55">
		<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-white/75 sm:px-6 lg:px-8">
			<div class="ticker-marquee overflow-hidden whitespace-nowrap">
					<div class="inline-flex w-full items-center gap-4 ticker-track">
					<span>{TICKER}</span><span>{TICKER}</span>
				</div>
			</div>
		</div>
	</div>

<header class="mx-auto grid max-w-7xl gap-2 px-3 py-3 sm:px-6 lg:px-8" id="overview">
    <div class="rounded-xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-md">
			<p class="text-[8px] uppercase tracking-[0.22em] text-blue-300">Live AI Competition Board</p>
			<h1 class="mt-1.5 text-xl font-semibold tracking-tight text-white md:text-3xl">
				AI Race <span class="text-transparent bg-gradient-to-r from-[#60a5fa] to-[#a855f7] bg-clip-text">2026</span>
			</h1>
			<p class="mt-1 max-w-3xl text-[9px] leading-relaxed text-white/70 sm:text-[10px]">
				Frontier model competition board: benchmark score, pricing pressure, and deployment profile in one quick read.
			</p>
		<div class="mt-1 grid gap-1 sm:grid-cols-3 lg:grid-cols-7">
				{#each [
					{ label: 'Tokens served today', value: formatCompact(totalTokens), trend: '+7.4%' },
					{ label: 'Active users', value: formatCompact(activeUsers), trend: '+2.3%' },
					{ label: 'Models deployed', value: modelsDeployed.toLocaleString(), trend: '+0.6%' },
					{ label: 'Labs tracked', value: `${LABS.length}`, trend: '+0.0%' },
					{ label: 'Top quality', value: `${topByQuality[0]?.mmlu.toFixed(1)} ${topByQuality[0]?.name ?? ''}`, trend: topByQuality[0]?.lab ?? 'n/a' },
					{ label: 'Top HumanEval', value: `${topByHumanEval[0]?.humaneval.toFixed(1)} ${topByHumanEval[0]?.name ?? ''}`, trend: topByHumanEval[0]?.lab ?? 'n/a' },
					{ label: 'Top MATH', value: `${topByMath[0]?.math.toFixed(1)} ${topByMath[0]?.name ?? ''}`, trend: topByMath[0]?.lab ?? 'n/a' }
				] as stat}
					<div class="rounded-lg border border-white/10 bg-black/30 p-1">
						<p class="text-[8px] uppercase tracking-[0.13em] text-white/55">{stat.label}</p>
						<div class="mt-1 flex items-end justify-between">
						<p class="text-[9px] font-semibold leading-tight text-white">{stat.value}</p>
						<p class="text-[7px] text-emerald-300">{stat.trend}</p>
					</div>
				</div>
				{/each}
			</div>
			<div class="mt-1.5 flex flex-wrap gap-2">
				{#if compactMode}
					<button
						type="button"
						onclick={() => (compactMode = false)}
				class="rounded-lg bg-white/15 px-1.5 py-0.5 text-[8px] font-semibold text-white transition hover:bg-white/25"
					>
						Open full dashboard
					</button>
				{:else}
					<button
						type="button"
						onclick={() => (compactMode = true)}
				class="rounded-lg border border-white/20 px-1.5 py-0.5 text-[8px] font-semibold text-white/80 transition hover:bg-white/10"
					>
						Back to screenshot mode
					</button>
				{/if}
				<button
					type="button"
					onclick={() => window.print()}
			class="rounded-lg border border-white/20 px-1.5 py-0.5 text-[8px] font-semibold text-white/80 transition hover:bg-white/10"
				>
					Export snapshot
				</button>
			</div>
		</div>
	</header>

	{#if !compactMode}
		<nav
		class={`sticky top-0 z-40 border-y border-white/10 bg-black/55 px-2 py-1.5 backdrop-blur transition-transform duration-300 sm:px-6 lg:px-8 ${
				navHidden ? 'translate-y-[-110%]' : 'translate-y-0'
			}`}
		>
			<div class="mx-auto grid max-w-7xl place-items-center sm:block">
					<div class="inline-flex w-full max-w-full flex-wrap justify-start gap-1 rounded-lg border border-white/10 bg-black/55 p-0.5">
					{#each NAV_LINKS as link}
						<button
							type="button"
							onclick={() => jumpToSection(link.id)}
						class={`rounded-md px-2 py-0.5 text-[8px] tracking-[0.11em] transition ${
								activeNav === link.id
									? 'bg-white/15 text-white'
									: 'text-white/65 hover:bg-white/10 hover:text-white'
								}`}
						>
							{link.label}
						</button>
					{/each}
				</div>
			</div>
		</nav>
	{/if}

	<main class="mx-auto max-w-7xl space-y-1.5 px-3 pb-12 pt-3 sm:px-6 lg:px-8">
			{#if compactMode}
				<section id="snapshot" class="grid gap-1 md:grid-cols-2 xl:grid-cols-5">
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-1 xl:col-span-2">
						<p class="text-[8px] uppercase tracking-[0.15em] text-white/55">Snapshot</p>
						<h2 class="mt-1 text-[11px] font-semibold">Top now by MMLU + telemetry</h2>
						<div class="mt-1 space-y-1">
							{#each compactByScore as lab}
								{@const telemetry = mapStatusByLab(lab.name)}
								{@const labLead = MODELS.find((m) => m.lab === lab.name && m.name === lab.topModel)}
								<div class="rounded-md border border-white/10 bg-black/20 p-1">
									<div class="flex items-center justify-between text-[9px]">
										<p class="truncate font-medium" style={`color:${lab.color}`}>{lab.name}</p>
										<p class="font-mono text-white/75">{lab.score.toFixed(1)} · {lab.topModel}</p>
									</div>
									<div class="mt-1 flex items-center justify-between text-[7px] text-white/60">
										<span>{labLead ? `${contextLabel(labLead.context)}ctx` : 'N/A'}</span>
										<span>{telemetry.latency}ms · {telemetry.uptime}% · {telemetry.rps}rps</span>
									</div>
									<p class="mt-1 text-[7px] text-white/55">
										{labLead ? `tags ${labLead.tags?.slice(0, 2).join(' · ')}` : ''}
									</p>
									<p class="mt-0.5 text-[7px] text-white/45">
										Lead span {(lab.score - 80).toFixed(1)} · rank window
									</p>
									<div class="mt-1.5 h-1 w-full rounded-full bg-white/10">
										<div class="h-full rounded-full" style={`width:${Math.round((lab.score / 100) * 100)}%; background:${lab.color}`} />
									</div>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[8px] uppercase tracking-[0.15em] text-white/55">Cheapest in</p>
						<h2 class="mt-1 text-[11px] font-semibold">Price pressure lane</h2>
						<div class="mt-1 space-y-1">
							{#each compactMarket as row}
								<div class="rounded-md border border-white/10 bg-black/20 p-1">
									<div class="flex items-center justify-between text-[9px]">
										<p class="font-medium" style={`color:${row.color}`}>{row.name}</p>
										<p class="font-mono text-white/80">${row.cheapest.toFixed(2)} / ${row.costliest.toFixed(2)}</p>
									</div>
									<p class="mt-1 text-[7px] text-white/55">
										IO ratio {(row.costliest / Math.max(row.cheapest, 0.01)).toFixed(1)}x · best in-score lane
									</p>
									<p class="mt-0.5 text-[7px] text-white/45">Cheapest model spread ${(row.costliest - row.cheapest).toFixed(2)}</p>
									<div class="mt-1 h-1 rounded-full bg-white/10">
										<div class="h-full rounded-full" style={`width:${Math.round((row.cheapest / maxCheapestPrice) * 100)}%; background:${row.color};`} />
									</div>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[8px] uppercase tracking-[0.15em] text-white/55">Live health</p>
						<h2 class="mt-1 text-[11px] font-semibold">Runtime pulse</h2>
						<div class="mt-1 space-y-1">
							{#each compactHealth as s}
								<div class="rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 text-[8px]">
									<div class="font-medium">{LABS.find((x) => x.id === s.id)?.name}</div>
									<p class="text-[7px] text-white/60">
										{s.latency}ms · {s.uptime}% uptime · {s.rps}rps
									</p>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[8px] uppercase tracking-[0.15em] text-white/55">Quality leaders</p>
						<h2 class="mt-1 text-[11px] font-semibold">AI quality index top</h2>
						<div class="mt-1 space-y-1">
							{#each topByQuality as model, i}
								<div class="rounded-md border border-white/10 bg-black/20 p-1 text-[8px]">
									<div class="flex items-center justify-between">
										<p class="min-w-0 truncate text-white">#{i + 1} {model.name}</p>
										<p class="whitespace-nowrap font-mono text-emerald-200">{qualityScore(model).toFixed(1)}</p>
								</div>
								<div class="min-w-0">
										<p class="text-[7px] text-white/60">
											{model.lab} · {contextLabel(model.context)}ctx · launched {model.launched}
										</p>
										<p class="mt-0.5 text-[7px] text-white/55">
											Speed {model.speed} · Context {contextLabel(model.context)} · IO {ioCostRatio(model).toFixed(2)}x
										</p>
										<p class="mt-0.5 text-[7px] text-white/65">
											Quality {qualityScore(model).toFixed(1)} · Value {valueDensity(model).toFixed(1)} · IO {ioCostRatio(model).toFixed(2)}x
										</p>
										<p class="mt-0.5 text-[7px] text-white/55">Rank {i + 1} · open {model.open ? 'yes' : 'no'}</p>
										<p class="mt-0.5 text-[7px] text-white/55">{featureBits(model)}</p>
									</div>
							</div>
						{/each}
						</div>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[8px] uppercase tracking-[0.15em] text-white/55">Open-first lane</p>
						<h2 class="mt-1 text-[11px] font-semibold">Open models by MMLU</h2>
						<div class="mt-1 space-y-1">
							{#if topByOpen.length === 0}
								<p class="text-[8px] text-white/55">No open models match current filters.</p>
							{:else}
								{#each topByOpen as model}
									<div class="rounded-md border border-white/10 bg-black/20 p-1 text-[8px]">
										<div class="flex items-center justify-between">
											<p class="min-w-0 truncate text-white">{model.name}</p>
											<p class="font-mono text-emerald-300">{model.mmlu.toFixed(1)}</p>
										</div>
										<p class="text-[7px] text-white/55">ctx {contextLabel(model.context)} · lat {model.speed > 100 ? `${model.speed - 30}ms` : `${model.speed + 60}ms`}</p>
										<p class="text-[7px] text-white/55">IO {ioCostRatio(model).toFixed(2)}x · {model.tags?.slice(0, 2).join(' · ')}</p>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</section>

			<section id="quick-glance">
				<div class="grid gap-1 md:grid-cols-3 xl:grid-cols-6">
					{#each topByValue as m, i}
						<div class="rounded-lg border border-white/10 bg-white/[0.03] p-1">
							<p class="text-[8px] text-white/55">Value #{i + 1}</p>
							<p class="mt-1 text-[8px] font-semibold">{m.name}</p>
							<p class="text-[7px] text-white/65">{m.lab} · {contextLabel(m.context)} ctx</p>
							<p class="mt-1 text-[7px] text-white/55">
								{m.price_in} in / {m.price_out} out · {m.context.toLocaleString()} ctx
							</p>
							<p class="mt-1 text-[7px] text-white/55">
								{m.open ? 'Open model' : 'API model'} · streaming {m.streaming ? 'yes' : 'no'} · speed {m.speed}
							</p>
							<div class="mt-1 grid grid-cols-3 gap-1 text-[7px]">
								<div class="rounded bg-white/5 p-1 text-center">
									<div class="text-white/55">Q</div>
									<p class="font-mono text-white">{qualityScore(m).toFixed(1)}</p>
								</div>
								<div class="rounded bg-white/5 p-1 text-center">
									<div class="text-white/55">MMLU</div>
									<p class="font-mono text-white">{m.mmlu.toFixed(1)}</p>
								</div>
								<div class="rounded bg-white/5 p-1 text-center">
									<div class="text-white/55">Value</div>
									<p class="font-mono text-white">{valueDensity(m).toFixed(1)}</p>
								</div>
							</div>
							<p class="mt-1 text-[7px] text-white/55">
								<span class="inline-flex rounded border border-white/15 px-1 py-0.5">Speed {m.speed}</span>
								<span class="ml-1 inline-flex rounded border border-white/15 px-1 py-0.5">Ctx {contextLabel(m.context)}</span>
								<span class="ml-1 inline-flex rounded border border-white/15 px-1 py-0.5">Value/Eff {valueEfficiency(m).toFixed(1)}</span>
							</p>
							<p class="mt-0.5 text-[7px] text-white/50">
								IO {ioCostRatio(m).toFixed(2)}x · Value {valueDensity(m).toFixed(1)}
							</p>
							<p class="mt-0.5 text-[7px] text-white/50">{featureBits(m)}</p>
							<p class="mt-0.5 text-[7px] text-white/50">Latency band {Math.round(m.speed / 5)}x</p>
							<p class="mt-0.5 text-[7px] text-white/50">launched {m.launched}</p>
						</div>
					{/each}
				</div>

				<div class="mt-1 grid gap-1 md:grid-cols-5">
					<div class="rounded-lg border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[7px] uppercase tracking-[0.15em] text-white/55">Speed lane</p>
						<div class="mt-1 space-y-1">
							{#each topBySpeed as m}
								<div class="flex items-center justify-between text-[7px]">
									<p class="truncate text-white">{m.name}</p>
									<p class="font-mono text-emerald-300">{m.speed}</p>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[7px] uppercase tracking-[0.15em] text-white/55">Context lane</p>
						<div class="mt-1 space-y-1">
							{#each topByContext as m}
								<div class="flex items-center justify-between text-[7px]">
									<p class="truncate text-white">{m.name}</p>
									<p class="font-mono text-blue-300">{contextLabel(m.context)}</p>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[7px] uppercase tracking-[0.15em] text-white/55">Cheapest input</p>
						<div class="mt-1 space-y-1">
							{#each topByCheapestIn as m}
								<div class="flex items-center justify-between text-[7px]">
									<p class="truncate text-white">{m.name}</p>
									<p class="font-mono text-emerald-300">${m.price_in}</p>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[7px] uppercase tracking-[0.15em] text-white/55">HumanEval lane</p>
						<div class="mt-1 space-y-1">
							{#each topByHumanEval as m}
								<div class="flex items-center justify-between text-[7px]">
									<p class="truncate text-white">{m.name}</p>
									<p class="font-mono text-emerald-300">{m.humaneval.toFixed(1)}</p>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-white/[0.03] p-1">
						<p class="text-[7px] uppercase tracking-[0.15em] text-white/55">Math lane</p>
						<div class="mt-1 space-y-1">
							{#each topByMath as m}
								<div class="flex items-center justify-between text-[7px]">
									<p class="truncate text-white">{m.name}</p>
									<p class="font-mono text-blue-300">{m.math.toFixed(1)}</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</section>
		{:else}
		<section id="race" class="scroll-mt-24">
			<div class="grid gap-2 lg:grid-cols-[1.35fr,1fr]">
				<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
					<div class="flex items-end justify-between">
						<div>
							<p class="text-xs uppercase tracking-[0.15em] text-white/55">At a glance</p>
							<h2 class="mt-1 text-base font-semibold">Race Snapshot (Top by MMLU)</h2>
						</div>
						<p class="text-xs text-white/55">{LABS.length} labs tracked</p>
					</div>
						<div class="mt-2 space-y-1.5">
						{#each topLabs as lab}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-xs">
									<p class="font-medium" style={`color:${lab.color}`}>{lab.name}</p>
									<p class="font-mono text-white/75">{lab.score.toFixed(1)} · {lab.topModel}</p>
								</div>
								<div class="h-2 w-full rounded-full bg-white/10">
									<div class="h-full rounded-full" style={`width:${Math.round((lab.score / 100) * 100)}%; background:${lab.color}`} />
								</div>
							</div>
						{/each}
					</div>
					<p class="mt-2 text-xs text-white/60">Open for deeper lab-by-lab comparison in Labs.</p>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold">Top Leaders</h2>
						<p class="text-xs text-white/55">{topModelsByMmlu.length} models shown</p>
					</div>
					<div class="mt-2 space-y-1.5">
						{#each topModelsByMmlu as m, i}
							<div class="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 p-1.5">
								<div class="grid h-6 w-6 place-items-center rounded-md border border-white/10 text-[10px]" style={`background:linear-gradient(130deg,${m.color},#101010)`}>
									{i + 1}
								</div>
								<div class="flex-1 min-w-0">
									<p class="truncate text-xs font-medium">{m.name}</p>
									<p class="text-[10px] text-white/60">{m.lab} · {m.context.toLocaleString()} ctx</p>
								</div>
								<p class="font-mono text-white text-[10px]">{m.mmlu.toFixed(1)}</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<section id="labs" class="scroll-mt-24">
			<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs uppercase tracking-[0.15em] text-white/55">Labs</p>
						<h2 class="text-base font-semibold">Who leads by score + market signal</h2>
					</div>
					<button
						type="button"
						class="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-white/75 transition hover:bg-white/10"
						onclick={() => togglePanel('labs')}
					>
						{panelExpanded.labs ? 'Hide all labs' : `Show ${LABS.length - labsSummary.length} more`}
					</button>
				</div>
				<div class="mt-2.5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
					{#each (panelExpanded.labs ? LABS : labsSummary) as lab}
						<article class="rounded-lg border p-2.5" style={`background:${lab.bg}; border-color:${lab.border};`}>
							<div class="flex items-start justify-between">
								<div>
									<p class="text-xs uppercase tracking-[0.15em]" style={`color:${lab.color}`}>{lab.logo} {lab.name}</p>
									<p class="mt-1 text-xs font-medium" style={`color:${lab.color}`}>{lab.tagline}</p>
								</div>
								<p class="text-xs text-white/60">{lab.founded}</p>
							</div>
							<p class="mt-2 text-xs text-white/75">{lab.news}</p>
							<div class="mt-2 space-y-1.5">
								{#each lab.models as model}
									<div class="flex items-center justify-between text-xs">
										<div>{model.name}</div>
										<div class="font-mono text-white/65">{model.mmlu.toFixed(1)} MMLU</div>
									</div>
									<div class="h-0.5 rounded-full bg-white/15">
										<div class="h-full rounded-full" style={`width:${model.mmlu}%; background:${lab.color}`}></div>
									</div>
								{/each}
							</div>
							<div class="mt-2 border-t border-white/10 pt-2 text-[10px] text-white/60">Valuation: {lab.valuation}</div>
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section id="markets" class="scroll-mt-24">
			<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs uppercase tracking-[0.15em] text-white/55">Pricing</p>
						<h2 class="text-base font-semibold">Cheapest input models (preview + full)</h2>
					</div>
					<button
						type="button"
						class="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-white/75 transition hover:bg-white/10"
						onclick={() => togglePanel('markets')}
					>
						{panelExpanded.markets ? 'Hide all prices' : `Show all ${PRICE_DATA.length}`}
					</button>
				</div>
				<div class="mt-2.5 grid gap-1.5">
					{#each (panelExpanded.markets ? PRICE_DATA : PRICE_DATA.slice(0, PANEL_PREVIEW)) as row}
						<div>
							<div class="mb-0.5 flex items-center justify-between text-xs">
								<p class="font-medium" style={`color:${row.color}`}>{row.name}</p>
								<p class="font-mono text-white/70">${row.cheapest.toFixed(2)} - ${row.costliest.toFixed(2)}</p>
							</div>
							<div class="h-1 rounded-full bg-white/10">
								<div
									class="h-full rounded-full"
									style={`width:${Math.round((row.cheapest / maxCheapestPrice) * 100)}%; background:${row.color};`}
								/>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section id="matrix" class="scroll-mt-24">
			<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs uppercase tracking-[0.15em] text-white/55">Matrix</p>
						<h2 class="text-base font-semibold">Benchmark dimensions</h2>
					</div>
					<button
						type="button"
						class="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-white/75 transition hover:bg-white/10"
						onclick={() => togglePanel('matrix')}
					>
						{panelExpanded.matrix ? 'Hide details' : 'Show full matrix'}
					</button>
				</div>
				<div class="mt-2.5 space-y-1.5">
					{#each (panelExpanded.matrix ? DETAILED_BENCHMARKS : DETAILED_BENCHMARKS.slice(0, 1)) as b}
						<div>
							<div class="flex items-center justify-between text-sm">
								<div class="font-medium">{b.label}</div>
								<div class="text-[10px] text-white/60">{b.desc}</div>
							</div>
							<div class="mt-1.5 grid gap-1">
								{#each RACE_DATA as row}
									<div class="h-1 rounded-full bg-white/10">
										<div class="h-full rounded-full" style={`width:${Math.min((row.score / b.max) * 100, 100)}%; background:${row.color}`}></div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section id="models" class="scroll-mt-24">
			<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
				<div class="flex flex-wrap items-end justify-between gap-2">
					<div>
						<p class="text-xs uppercase tracking-[0.15em] text-white/55">Models</p>
						<h2 class="text-base font-semibold">Model Explorer</h2>
					</div>
					<button
						type="button"
						class="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-white/75 transition hover:bg-white/10"
						onclick={() => togglePanel('models')}
					>
						{panelExpanded.models ? 'Hide rows' : `Show ${filteredModels.length} rows`}
					</button>
				</div>
				<div class="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
					<input
						class="rounded-md border border-white/15 bg-black/25 px-2 py-1.5 text-[10px] text-white outline-none ring-offset-0 transition focus:border-white/35"
						placeholder="Search model, lab, tags"
						bind:value={searchQuery}
					/>
					<select
						class="rounded-md border border-white/15 bg-black/25 px-2 py-1.5 text-[10px] text-white"
						bind:value={selectedLab}
					>
						{#each MODEL_LABS as lab}
							<option value={lab}>{lab}</option>
						{/each}
					</select>
					<select
						class="rounded-md border border-white/15 bg-black/25 px-2 py-1.5 text-[10px] text-white"
						bind:value={sortKey}
					>
						{#each SORT_OPTIONS as s}
							<option value={s.key}>{s.label}</option>
						{/each}
					</select>
					<button
						type="button"
						class="rounded-md border border-white/15 bg-black/25 px-2 py-1.5 text-[10px] tracking-[0.08em] uppercase"
						onclick={() => (sortDir = -sortDir)}
					>
						{sortDir === -1 ? 'Desc' : 'Asc'}
					</button>
				</div>
				<label class="mt-2 inline-flex items-center gap-1.5 text-[10px] text-white/70">
					<input type="checkbox" bind:checked={showOpenOnly} />
					Only open models
				</label>
				<p class="mt-1.5 text-[10px] text-white/60">Showing {activeModelsCount} models</p>
				<div class="mt-2 grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
					{#if filteredModels.length === 0}
						<p class="rounded-lg border border-dashed border-white/15 p-3 text-[11px] text-white/65">No models match your filters. Try broader search terms.</p>
					{:else}
						{#each (panelExpanded.models ? filteredModels : topModelsPreview) as m}
							<div class="rounded-lg border border-white/10 bg-black/30 p-2.5">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="text-[11px] font-semibold">{m.name}</p>
										<p class="text-[10px] text-white/60">{m.lab} · {m.params} · {m.context.toLocaleString()} ctx · {m.launched}</p>
									</div>
									<span class="rounded-md border border-white/15 px-1.5 py-1 text-[9px] text-white/60">{m.open ? 'open' : 'api'}</span>
								</div>
								<p class="mt-1.5 text-[10px] text-white/75">{m.desc}</p>
								<div class="mt-1.5 grid gap-1">
									{#each m.tags as t}
										<span class="inline-flex w-fit rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] text-white/70">{t}</span>
									{/each}
								</div>
								<div class="mt-1.5 grid grid-cols-5 gap-1 text-center text-[10px]">
									<div class="rounded-md bg-white/5 p-1">
										<div class="text-white/60">MMLU</div>
										<p class="font-mono">{m.mmlu}</p>
									</div>
									<div class="rounded-md bg-white/5 p-1">
										<div class="text-white/60">Quality</div>
										<p class="font-mono">{qualityScore(m).toFixed(1)}</p>
									</div>
									<div class="rounded-md bg-white/5 p-1">
										<div class="text-white/60">Math</div>
										<p class="font-mono">{m.math}</p>
									</div>
									<div class="rounded-md bg-white/5 p-1">
										<div class="text-white/60">Price In</div>
										<p class="font-mono">${m.price_in}</p>
									</div>
									<div class="rounded-md bg-white/5 p-1">
										<div class="text-white/60">IO Ratio</div>
										<p class="font-mono">{ioCostRatio(m).toFixed(2)}x</p>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</section>

		<section id="facts" class="scroll-mt-24">
			<div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs uppercase tracking-[0.15em] text-white/55">Insights</p>
						<h2 class="text-base font-semibold">Ranking policy & signals</h2>
					</div>
					<button
						type="button"
						class="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-white/75 transition hover:bg-white/10"
						onclick={() => togglePanel('facts')}
					>
						{panelExpanded.facts ? 'Hide details' : 'Show details'}
					</button>
				</div>
				{#if panelExpanded.facts}
					<div class="mt-2.5 grid gap-2 md:grid-cols-2">
						<div class="rounded-lg border border-white/10 bg-black/20 p-2.5">
							<h3 class="font-semibold">Why this ranking changes fast</h3>
							<ul class="mt-2 list-disc space-y-1.5 pl-5 text-[10px] text-white/75">
								<li>Tooling + throughput shifts rank positions when benchmark margins are close.</li>
								<li>Context length and latency are major differentiators in production workloads.</li>
								<li>Open ecosystem maturity is weighted in for long-term adoption signals.</li>
							</ul>
						</div>
						<div class="rounded-lg border border-white/10 bg-black/20 p-2.5">
							<h3 class="font-semibold">Weighting rule</h3>
							<div class="mt-2 grid gap-1.5 text-[10px] text-white/75">
								<p><span class="text-white">Primary</span>: MMLU 40%, HumanEval 20%, MATH 20%, throughput/features 20%</p>
								<p><span class="text-white">Refresh</span>: Local simulation every 1.2s</p>
								<p><span class="text-white">Price</span>: Based on published public $/1M input-output values</p>
							</div>
						</div>
					</div>
				{:else}
					<p class="mt-2 text-[10px] text-white/65">Signal model: benchmark first, then cost, then runtime behavior. Expand for full policy.</p>
				{/if}
			</div>
			</section>
		{/if}
	</main>
</div>

<style>
@keyframes ticker {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	.ticker-track {
		animation: ticker 22s linear infinite;
	}
</style>
