<svelte:head>
	<title>Jam.fun | Music Token Launchpad</title>
	<meta name="description" content="Launch and trade music tokens on Jam.fun – the pump.fun for music." />
</svelte:head>

<script>
	import { onMount } from 'svelte';

	// ── Token name / desc pools for random spawns ─────────────────────
	const namePool = [
		['Acid Jazz',       'ACID',  '🎹', 'Bebop meets blockchain. Every note a buy signal. 🎷'],
		['Deep House',      'DEPH',  '🏠', '4-to-the-floor and your portfolio is going up. 🎶'],
		['Phonk Cat',       'PHONK', '😾', 'Drift music for degen traders. Skrrt skrrt. 🚗💨'],
		['Techno Rat',      'TRAT',  '🐀', 'Underground rave energy. 180 BPM. No sleep. ⚡'],
		['Vibe Check',      'VIBE',  '✅', 'If you know, you know. If you don\'t, ape in. 😤'],
		['Night Owl',       'NWOL',  '🦉', 'Only pumps after midnight. We don\'t sleep. 🌙'],
		['Trap Queen',      'TQEN',  '👸', 'Royalty on Solana. Bow down. 👑🎵'],
		['Wave Rider',      'WAVE',  '🌊', 'Catching waves before they hit CoinGecko. 🏄'],
		['Synth Lord',      'SYNT',  '🎛️', 'Analog warmth in a digital universe. 🌌'],
		['Drill Bro',       'DRIL',  '🔩', 'Brooklyn energy on Solana. No cap. 🗣️'],
		['Funk Token',      'FUNK',  '🕶️', 'James Brown would have aped. Get on up. 🎤'],
		['Ambient Ape',     'AMBI',  '🦧', 'Meditative vibes, aggressive gains. 🧘'],
		['Reggaeton Rex',   'RGRX',  '🦁', 'Dale! Every tick is a party. 🥁🔥'],
		['K-Pop Kitty',     'KPOP',  '💅', 'Stan culture meets DeFi culture. FOMO activated. 💖'],
		['Folk Degen',      'FOLK',  '🪕', 'Acoustic moon mission. Simple tools, big bags. 🎸'],
		['Metal Moon',      'METL',  '🤘', 'Headbanging through liquidation cascades. 💀'],
		['Samba Sol',       'SAMBA', '🥁', 'Brazilian rizz on the Solana blockchain. 🌴'],
		['Grunge God',      'GRUN',  '🧟', 'Born in Seattle, rugged on Solana. 🪨'],
		['Cumbia Coin',     'CMBA',  '🪗', 'Latin heat meets crypto cold. Bailamos. 💃'],
		['Bossa Nova',      'BOSS',  '🌺', 'Smooth like Jobim, pumps like a meme coin. ☀️'],
	];

	const gradientPool = [
		'from-rose-600 to-pink-400',
		'from-violet-700 to-purple-400',
		'from-sky-600 to-cyan-400',
		'from-emerald-600 to-green-400',
		'from-orange-600 to-yellow-400',
		'from-fuchsia-600 to-pink-400',
		'from-indigo-700 to-blue-400',
		'from-red-700 to-orange-500',
		'from-teal-600 to-emerald-400',
		'from-amber-600 to-yellow-300',
	];

	// picsum gives deterministic photos by seed number
	const imgUrl = (seed) => `https://picsum.photos/seed/${seed}/80/80`;

	let nextId = 100;
	const randAddr = () => {
		const c = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
		const r = (n) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
		return `${r(4)}...${r(4)}`;
	};
	const randImgSeed = () => Math.floor(Math.random() * 900) + 10;

	function spawnToken() {
		const [name, ticker, icon, description] = namePool[Math.floor(Math.random() * namePool.length)];
		const gradient = gradientPool[Math.floor(Math.random() * gradientPool.length)];
		const mcap = Math.floor(Math.random() * 3000) + 200;
		return {
			id: nextId++,
			name,
			ticker,
			icon,
			gradient,
			imgSeed: randImgSeed(),
			description,
			creator: randAddr(),
			createdAgo: 'just now',
			marketCap: mcap,
			price: +(mcap / 1_000_000_000).toFixed(10),
			change24h: +(Math.random() * 40 - 5).toFixed(1),
			volume24h: Math.floor(Math.random() * 400) + 50,
			holders: Math.floor(Math.random() * 8) + 1,
			trades: Math.floor(Math.random() * 12) + 1,
			progress: Math.floor(Math.random() * 8),
			replies: 0,
			tag: 'new',
		};
	}

	// ── Initial token data ────────────────────────────────────────────
	let mockTokens = $state([
		{
			id: 1, name: 'Beat Drop', ticker: 'BEET', icon: '🥁',
			gradient: 'from-red-600 to-orange-400', imgSeed: 42,
			description: 'The hardest drops on Solana. Every bar a banger. 🎶🔥',
			creator: '7xKp...m3Qa', createdAgo: '2m ago',
			marketCap: 18400, price: 0.0000184, change24h: 312.4,
			volume24h: 5200, holders: 84, trades: 213, progress: 72, replies: 47, tag: 'trending',
		},
		{
			id: 2, name: 'Lo-Fi Cat', ticker: 'LOFI', icon: '🎧',
			gradient: 'from-indigo-600 to-blue-400', imgSeed: 87,
			description: 'Chill beats to study and relax to. Purring since genesis. 😺☕',
			creator: 'Aq2r...9WnB', createdAgo: '11m ago',
			marketCap: 9800, price: 0.0000098, change24h: 88.1,
			volume24h: 2100, holders: 52, trades: 99, progress: 38, replies: 22, tag: 'new',
		},
		{
			id: 3, name: 'Solana Serenade', ticker: 'SEREN', icon: '🎻',
			gradient: 'from-amber-500 to-yellow-300', imgSeed: 156,
			description: 'Classical vibes meet DeFi chaos. Beethoven would ape in. 🎻✨',
			creator: 'BcZz...4Kpw', createdAgo: '34m ago',
			marketCap: 63000, price: 0.000063, change24h: 541.9,
			volume24h: 14800, holders: 231, trades: 704, progress: 91, replies: 138, tag: 'graduating',
		},
		{
			id: 4, name: 'Trap God', ticker: 'TRAP', icon: '💀',
			gradient: 'from-gray-700 to-green-900', imgSeed: 211,
			description: 'Hi-hats so fast they skip confirmation. 808s harder than validators. 🔊💀',
			creator: 'Pnmk...7Lqr', createdAgo: '1h ago',
			marketCap: 4200, price: 0.0000042, change24h: -12.3,
			volume24h: 890, holders: 19, trades: 41, progress: 14, replies: 8, tag: 'new',
		},
		{
			id: 5, name: 'Jazz Paws', ticker: 'JPAW', icon: '🎷',
			gradient: 'from-amber-700 to-yellow-500', imgSeed: 333,
			description: 'Smooth jazz NFT for the refined degenerate. Sip espresso. Buy more. ☕🎷',
			creator: 'Wqnz...2Tsc', createdAgo: '2h ago',
			marketCap: 31500, price: 0.0000315, change24h: 199.7,
			volume24h: 7600, holders: 118, trades: 388, progress: 58, replies: 63, tag: 'trending',
		},
		{
			id: 6, name: 'Rave Kitty', ticker: 'RAVE', icon: '🪩',
			gradient: 'from-pink-500 to-cyan-400', imgSeed: 401,
			description: 'PLUR. Paws Up. 4AM on a Tuesday. No regrets. 🌈😼',
			creator: 'Hxqp...8Nzd', createdAgo: '3h ago',
			marketCap: 12200, price: 0.0000122, change24h: 44.2,
			volume24h: 3100, holders: 67, trades: 155, progress: 45, replies: 29, tag: 'new',
		},
		{
			id: 7, name: 'Moon Melody', ticker: 'MOON', icon: '🌙',
			gradient: 'from-slate-800 to-blue-700', imgSeed: 512,
			description: 'When the music takes you higher than the market. Still going up. 🌙🚀',
			creator: 'Ymnb...5Rxk', createdAgo: '5h ago',
			marketCap: 78000, price: 0.000078, change24h: 892.3,
			volume24h: 21400, holders: 344, trades: 1102, progress: 97, replies: 211, tag: 'graduating',
		},
		{
			id: 8, name: 'Pixel Punk', ticker: 'PUNK', icon: '👾',
			gradient: 'from-lime-400 to-yellow-300', imgSeed: 617,
			description: 'Chiptune chaos energy. 8-bit never looked so degenerate. 👾🎮',
			creator: 'Kqpr...3Mnv', createdAgo: '7h ago',
			marketCap: 5600, price: 0.0000056, change24h: -34.7,
			volume24h: 1200, holders: 28, trades: 62, progress: 21, replies: 11, tag: 'new',
		},
		{
			id: 9, name: 'Degen Disco', ticker: 'DISCO', icon: '🕺',
			gradient: 'from-purple-600 to-amber-400', imgSeed: 723,
			description: 'Saturday night fever meets liquidation cascade. Dance thru the dip. 🕺🪩',
			creator: 'Lvwq...6Opt', createdAgo: '9h ago',
			marketCap: 44200, price: 0.0000442, change24h: 267.8,
			volume24h: 11900, holders: 176, trades: 529, progress: 79, replies: 94, tag: 'trending',
		},
		{
			id: 10, name: 'Bass Surge', ticker: 'BASS', icon: '🎸',
			gradient: 'from-teal-600 to-cyan-300', imgSeed: 808,
			description: 'Sub bass frequencies that liquidate your eardrums and portfolio equally. 🎸💥',
			creator: 'Rtnp...1Kxz', createdAgo: '12h ago',
			marketCap: 22800, price: 0.0000228, change24h: 103.6,
			volume24h: 5800, holders: 91, trades: 247, progress: 53, replies: 41, tag: 'new',
		},
		{
			id: 11, name: 'Gospel Cat', ticker: 'GOSP', icon: '🙏',
			gradient: 'from-yellow-200 to-amber-400', imgSeed: 888,
			description: 'Praise the liquidity. Hallelujah, we are going up. Amen ser. 🙏😇',
			creator: 'Cmqz...9Rvw', createdAgo: '16h ago',
			marketCap: 88500, price: 0.0000885, change24h: 1204.1,
			volume24h: 31200, holders: 502, trades: 1788, progress: 100, replies: 387, tag: 'completed',
		},
		{
			id: 12, name: 'Vaporwave Nyan', ticker: 'NYAN', icon: '🌈',
			gradient: 'from-pink-400 via-purple-400 to-cyan-400', imgSeed: 999,
			description: 'A E S T H E T I C. Pink cat. Rainbow trail. Eternal pump. 🌸🌀',
			creator: 'Fxmb...2Qln', createdAgo: '1d ago',
			marketCap: 34700, price: 0.0000347, change24h: 158.3,
			volume24h: 8900, holders: 143, trades: 418, progress: 65, replies: 77, tag: 'trending',
		},
	]);

	// ── Live feed ─────────────────────────────────────────────────────
	let liveFeed = $state([
		{ user: '7xKp...m3Qa', action: 'bought', token: 'BEET', sol: 0.42, time: '1s ago' },
		{ user: 'Aq2r...9WnB', action: 'sold',   token: 'MOON', sol: 1.10, time: '2s ago' },
		{ user: 'Pnmk...7Lqr', action: 'bought', token: 'SEREN', sol: 2.30, time: '4s ago' },
		{ user: 'Wqnz...2Tsc', action: 'bought', token: 'DISCO', sol: 0.75, time: '6s ago' },
		{ user: 'Hxqp...8Nzd', action: 'sold',   token: 'JPAW', sol: 0.31, time: '8s ago' },
		{ user: 'Ymnb...5Rxk', action: 'bought', token: 'GOSP', sol: 3.50, time: '11s ago' },
		{ user: 'Kqpr...3Mnv', action: 'bought', token: 'NYAN', sol: 0.88, time: '15s ago' },
		{ user: 'Lvwq...6Opt', action: 'sold',   token: 'RAVE', sol: 0.22, time: '19s ago' },
	]);

	// ── Stats ─────────────────────────────────────────────────────────
	let stats = $state({ totalTokens: 4821, totalVolume: 2.4, graduated: 312, activeTraders: 18240 });

	// ── Filters ───────────────────────────────────────────────────────
	const filterTabs = [
		{ key: 'all',        label: '🌐 All' },
		{ key: 'trending',   label: '🔥 Trending' },
		{ key: 'new',        label: '⏱ New' },
		{ key: 'graduating', label: '🎓 Graduating' },
		{ key: 'completed',  label: '🏆 Completed' },
	];
	let activeFilter = $state('all');
	let searchQuery  = $state('');
	let showCreateModal = $state(false);
	let form = $state({ name: '', ticker: '', description: '' });
	let createSuccess = $state(false);

	function handleCreate() {
		if (!form.name || !form.ticker) return;
		createSuccess = true;
		setTimeout(() => {
			showCreateModal = false;
			createSuccess = false;
			form = { name: '', ticker: '', description: '' };
		}, 2000);
	}

	let filtered = $derived(
		mockTokens.filter((t) => {
			const matchesFilter = activeFilter === 'all' || t.tag === activeFilter;
			const matchesSearch = !searchQuery ||
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.ticker.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesFilter && matchesSearch;
		})
	);

	let king = $derived(
		mockTokens.reduce((best, t) => (t.marketCap > best.marketCap ? t : best), mockTokens[0])
	);

	// ── Tick counter for slower events ───────────────────────────────
	let tick = 0;

	onMount(() => {
		const id = setInterval(() => {
			tick++;

			// ── 1. Live feed: new trade every tick ────────────────────
			const tickers = mockTokens.map((t) => t.ticker);
			const tradeTicker = tickers[Math.floor(Math.random() * tickers.length)];
			const action = Math.random() > 0.38 ? 'bought' : 'sold';
			const sol = +(Math.random() * 5 + 0.05).toFixed(2);
			liveFeed = [
				{ user: randAddr(), action, token: tradeTicker, sol, time: 'just now' },
				...liveFeed.slice(0, 7),
			];

			// ── 2. Update every token's price / stats ─────────────────
			mockTokens = mockTokens.map((t) => {
				if (t.tag === 'completed') return t;
				const pct = (Math.random() * 6 - 2) / 100; // −2% to +4%
				const newMcap = Math.max(100, Math.round(t.marketCap * (1 + pct)));
				const newPrice = +(t.price * (1 + pct)).toPrecision(4);
				const newChange = +(t.change24h + (Math.random() * 8 - 3)).toFixed(1);
				const newTrades = t.trades + Math.floor(Math.random() * 5);
				const newHolders = t.holders + (Math.random() < 0.3 ? 1 : 0);
				const newReplies = t.replies + (Math.random() < 0.15 ? 1 : 0);
				const newProgress =
					t.progress >= 100 ? 100
					: t.tag === 'graduating' ? Math.min(100, t.progress + (Math.random() < 0.4 ? 1 : 0))
					: Math.min(99, t.progress + (Math.random() < 0.12 ? 1 : 0));
				const newTag =
					newProgress >= 100 ? 'completed'
					: newProgress >= 80 ? 'graduating'
					: newMcap > 20000 && t.tag === 'new' ? 'trending'
					: t.tag;
				const newVolume = Math.round(t.volume24h * (1 + (Math.random() * 0.06 - 0.01)));
				// swap image every ~8s for "new" tokens (feels like art is being updated)
				const newImgSeed = t.tag === 'new' && Math.random() < 0.08 ? randImgSeed() : t.imgSeed;
				return { ...t, marketCap: newMcap, price: newPrice, change24h: newChange,
					trades: newTrades, holders: newHolders, replies: newReplies,
					progress: newProgress, tag: newTag, volume24h: newVolume, imgSeed: newImgSeed };
			});

			// ── 3. Every 5 ticks: kill the weakest token, spawn fresh ──
			if (tick % 5 === 0) {
				// find lowest mcap non-graduating/completed token
				const killable = mockTokens
					.filter((t) => t.tag === 'new' || t.tag === 'trending')
					.sort((a, b) => a.marketCap - b.marketCap);
				if (killable.length > 0) {
					const victim = killable[0];
					const fresh = spawnToken();
					mockTokens = [fresh, ...mockTokens.filter((t) => t.id !== victim.id)];
					stats.totalTokens += 1;
				}
			}

			// ── 4. Occasionally graduate a token and bump stats ────────
			if (tick % 20 === 0) {
				const almostDone = mockTokens.find((t) => t.progress === 100 && t.tag !== 'completed');
				if (almostDone) {
					mockTokens = mockTokens.map((t) =>
						t.id === almostDone.id ? { ...t, tag: 'completed' } : t
					);
					stats.graduated += 1;
				}
			}

			// ── 5. Global stats tick ───────────────────────────────────
			stats.activeTraders = Math.max(1000, stats.activeTraders + Math.floor(Math.random() * 9 - 3));
			stats.totalVolume = +(stats.totalVolume + Math.random() * 0.005).toFixed(3);
		}, 1000);

		return () => clearInterval(id);
	});

	// ── Helpers ───────────────────────────────────────────────────────
	function fmtMcap(n) {
		if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
		return `$${n}`;
	}
	function progressColor(p) {
		if (p >= 90) return 'bg-green-500';
		if (p >= 50) return 'bg-yellow-400';
		return 'bg-pink-400';
	}
	function tagBadge(tag) {
		const map = {
			trending:   'bg-orange-100 text-orange-700',
			new:        'bg-cyan-100 text-cyan-700',
			graduating: 'bg-purple-100 text-purple-700',
			completed:  'bg-green-100 text-green-700',
		};
		return map[tag] ?? 'bg-gray-100 text-gray-600';
	}
	function tagLabel(tag) {
		return { trending: '🔥 Hot', new: '⏱ New', graduating: '🎓 Moon', completed: '🏆 Done' }[tag] ?? tag;
	}
</script>

<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-violet-950 via-indigo-950 to-black text-white">

	<div class="pointer-events-none absolute inset-0 opacity-5"
		style="background-image:linear-gradient(rgba(168,85,247,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,.5) 1px,transparent 1px);background-size:40px 40px;">
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-10">

		<!-- Header -->
		<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<div>
				<h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
					🚀 <span class="text-pink-400">Jam</span><span class="text-purple-400">.fun</span>
				</h1>
				<p class="mt-1 text-sm text-gray-400">Launch music tokens. Trade the vibe. Graduate to glory.</p>
			</div>
			<div class="flex items-center gap-3">
				<div class="relative">
					<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
					<input bind:value={searchQuery} type="text" placeholder="Search tokens…"
						class="w-44 rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur focus:border-pink-500 focus:outline-none sm:w-56" />
				</div>
				<button onclick={() => (showCreateModal = true)}
					class="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-sm font-bold shadow-lg shadow-pink-500/30 transition hover:scale-105">
					+ Launch Token
				</button>
			</div>
		</div>

		<!-- Stats Bar -->
		<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each [
				{ label: 'Total Tokens',   value: stats.totalTokens.toLocaleString(),       icon: '🎵' },
				{ label: 'Total Volume',   value: `${stats.totalVolume.toFixed(2)}M SOL`,   icon: '💰' },
				{ label: 'Graduated',      value: stats.graduated.toLocaleString(),          icon: '🎓' },
				{ label: 'Active Traders', value: stats.activeTraders.toLocaleString(),      icon: '👥' },
			] as s}
				<div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-xs text-gray-400">{s.icon} {s.label}</p>
					<p class="mt-1 text-xl font-extrabold">{s.value}</p>
				</div>
			{/each}
		</div>

		<!-- Main layout -->
		<div class="flex flex-col gap-6 lg:flex-row">

			<!-- Left: King + grid -->
			<div class="flex-1 min-w-0">

				<!-- King of the Hill -->
				{#if king}
					<div class="mb-6 overflow-hidden rounded-3xl border border-yellow-400/30 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-pink-500/10 p-5 backdrop-blur">
						<p class="mb-3 text-xs font-bold uppercase tracking-widest text-yellow-400">👑 King of the Hill</p>
						<div class="flex items-center gap-4">
							<div class="relative h-16 w-16 shrink-0">
								<img src="https://picsum.photos/seed/{king.imgSeed}/80/80"
									alt={king.name}
									class="h-16 w-16 rounded-2xl border-2 border-yellow-400 object-cover shadow-lg shadow-yellow-500/30" />
								<span class="absolute -bottom-1 -right-1 text-lg leading-none">{king.icon}</span>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-xl font-extrabold">{king.name}</span>
									<span class="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-bold text-yellow-300">${king.ticker}</span>
								</div>
								<p class="mt-0.5 truncate text-sm text-gray-400">{king.description}</p>
							</div>
							<div class="hidden text-right sm:block">
								<p class="text-lg font-extrabold text-green-400">{fmtMcap(king.marketCap)}</p>
								<p class="text-xs text-gray-400">market cap</p>
							</div>
						</div>
						<div class="mt-4">
							<div class="mb-1 flex justify-between text-xs text-gray-400">
								<span>Bonding curve progress</span>
								<span class="font-bold text-white">{king.progress}%</span>
							</div>
							<div class="h-2.5 overflow-hidden rounded-full bg-white/10">
								<div class="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-700"
									style="width:{king.progress}%"></div>
							</div>
							{#if king.progress >= 100}
								<p class="mt-1 text-xs text-green-400">🎉 Graduated to Raydium!</p>
							{:else}
								<p class="mt-1 text-xs text-gray-500">{fmtMcap(Math.max(0, 85000 - king.marketCap))} remaining to graduate</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Filter Tabs -->
				<div class="mb-4 flex flex-wrap gap-2">
					{#each filterTabs as ft}
						<button onclick={() => (activeFilter = ft.key)}
							class="rounded-full px-4 py-1.5 text-sm font-semibold transition-all
								{activeFilter === ft.key
									? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
									: 'border border-white/10 bg-white/5 text-gray-300 hover:border-pink-400/50 hover:text-white'}">
							{ft.label}
						</button>
					{/each}
				</div>

				<!-- Token Grid -->
				{#if filtered.length === 0}
					<div class="py-16 text-center text-gray-500">No tokens found 🐱</div>
				{:else}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{#each filtered as token (token.id)}
							<div class="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-500/10">

								<!-- Card header -->
								<div class="flex items-start gap-3 p-4 pb-2">
									<div class="relative h-12 w-12 shrink-0">
										<img src="https://picsum.photos/seed/{token.imgSeed}/80/80"
											alt={token.name}
											class="h-12 w-12 rounded-xl object-cover border border-white/10 bg-white/5" />
										<span class="absolute -bottom-1 -right-1 text-sm leading-none">{token.icon}</span>
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2 flex-wrap">
											<span class="font-bold leading-tight">{token.name}</span>
											<span class="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-gray-300">${token.ticker}</span>
										</div>
										<p class="mt-0.5 text-[10px] text-gray-500">by {token.creator} · {token.createdAgo}</p>
									</div>
									<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold {tagBadge(token.tag)}">
										{tagLabel(token.tag)}
									</span>
								</div>

								<!-- Description -->
								<p class="px-4 text-xs leading-relaxed text-gray-400 line-clamp-2">{token.description}</p>

								<!-- Stats row -->
								<div class="mt-3 grid grid-cols-3 gap-px border-y border-white/5 bg-white/5 text-center text-xs">
									<div class="bg-black/20 py-2">
										<p class="font-bold text-white">{fmtMcap(token.marketCap)}</p>
										<p class="text-gray-500">mkt cap</p>
									</div>
									<div class="bg-black/20 py-2">
										<p class="font-bold {token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}">
											{token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(1)}%
										</p>
										<p class="text-gray-500">24h</p>
									</div>
									<div class="bg-black/20 py-2">
										<p class="font-bold text-white">{token.holders}</p>
										<p class="text-gray-500">holders</p>
									</div>
								</div>

								<!-- Bonding curve -->
								<div class="px-4 pt-3">
									<div class="mb-1 flex justify-between text-[10px] text-gray-500">
										<span>Bonding curve</span>
										<span class="font-semibold text-white">{token.progress}%</span>
									</div>
									<div class="h-1.5 overflow-hidden rounded-full bg-white/10">
										<div class="h-full rounded-full transition-all duration-500 {progressColor(token.progress)}"
											style="width:{token.progress}%"></div>
									</div>
								</div>

								<!-- Buy / Sell -->
								<div class="mt-3 flex gap-2 px-4 pb-4">
									<button class="flex-1 rounded-xl bg-green-500/20 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500/30">Buy</button>
									<button class="flex-1 rounded-xl bg-red-500/20 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/30">Sell</button>
								</div>

								<!-- Footer -->
								<div class="border-t border-white/5 px-4 pb-3 pt-2 flex justify-between text-[10px] text-gray-600">
									<span>💬 {token.replies}</span>
									<span>🔄 {token.trades}</span>
									<span>📊 {fmtMcap(token.volume24h)}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Right: Live Feed -->
			<div class="lg:w-64 xl:w-72 shrink-0">
				<div class="sticky top-20 rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
					<div class="border-b border-white/10 px-4 py-3">
						<p class="text-sm font-bold">⚡ Live Trades</p>
						<span class="inline-flex items-center gap-1 text-[10px] text-green-400">
							<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span>
							Real-time
						</span>
					</div>
					<ul class="divide-y divide-white/5">
						{#each liveFeed as trade, i (i)}
							<li class="flex items-center gap-2 px-4 py-2.5 text-xs">
								<span class="text-base">{trade.action === 'bought' ? '🟢' : '🔴'}</span>
								<div class="min-w-0 flex-1">
									<p class="truncate font-semibold text-gray-200">{trade.user}</p>
									<p class="text-gray-500">{trade.action} <span class="font-bold text-white">${trade.token}</span></p>
								</div>
								<div class="text-right shrink-0">
									<p class="font-bold {trade.action === 'bought' ? 'text-green-400' : 'text-red-400'}">{trade.sol} SOL</p>
									<p class="text-gray-600">{trade.time}</p>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Create Token Modal -->
{#if showCreateModal}
	<button class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
		onclick={() => (showCreateModal = false)} aria-label="Close modal"></button>

	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950 to-indigo-950 p-6 shadow-2xl shadow-purple-500/20">
			<button onclick={() => (showCreateModal = false)}
				class="absolute right-4 top-4 text-gray-400 hover:text-white text-xl">✕</button>

			<h2 class="mb-1 text-xl font-extrabold">🎵 Launch a Music Token</h2>
			<p class="mb-5 text-sm text-gray-400">Fill in the vibe. Deploy to the chain.</p>

			{#if createSuccess}
				<div class="rounded-2xl bg-green-500/20 border border-green-400/30 p-6 text-center">
					<p class="text-4xl mb-2">🎉</p>
					<p class="text-lg font-bold text-green-400">Token launched successfully!</p>
					<p class="text-sm text-gray-400 mt-1">Redirecting back to the launchpad…</p>
				</div>
			{:else}
				<div class="space-y-4">
					<div>
						<label class="mb-1 block text-xs font-semibold text-gray-400">Token Name *</label>
						<input bind:value={form.name} type="text" placeholder="e.g. Beat Drop"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none" />
					</div>
					<div>
						<label class="mb-1 block text-xs font-semibold text-gray-400">Ticker *</label>
						<div class="relative">
							<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
							<input bind:value={form.ticker} type="text" placeholder="BEET" maxlength="8"
								class="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-7 pr-4 text-sm uppercase text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none" />
						</div>
					</div>
					<div>
						<label class="mb-1 block text-xs font-semibold text-gray-400">Description</label>
						<textarea bind:value={form.description} rows="3" placeholder="Describe the vibe…"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none resize-none"></textarea>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-gray-400 space-y-1">
						<p>💰 <span class="text-white font-semibold">Cost to deploy:</span> 0.02 SOL</p>
						<p>📈 <span class="text-white font-semibold">Initial supply:</span> 1,000,000,000 tokens</p>
						<p>🎓 <span class="text-white font-semibold">Graduation target:</span> $85K market cap</p>
					</div>
					<button onclick={handleCreate} disabled={!form.name || !form.ticker}
						class="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-bold shadow-lg shadow-pink-500/30 transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
						🚀 Launch Token
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
