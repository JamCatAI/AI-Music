<script>
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'jamcat-pop-local-v2';
	const countries = [
		'US',
		'VN',
		'JP',
		'KR',
		'GB',
		'DE',
		'FR',
		'BR',
		'IN',
		'CA',
		'AU',
		'MX'
	];

	const countryNames = {
		US: 'United States',
		VN: 'Vietnam',
		JP: 'Japan',
		KR: 'South Korea',
		GB: 'United Kingdom',
		DE: 'Germany',
		FR: 'France',
		BR: 'Brazil',
		IN: 'India',
		CA: 'Canada',
		AU: 'Australia',
		MX: 'Mexico'
	};

	let selectedCountry = 'US';
	let localScore = 0;
	let combo = 1;
	let tapsInWindow = 0;
	let lastTapAt = 0;
	let pressed = false;
	let animating = false;
	let leaderboard = [];
	let worldTick = 0;
	let pressTimeout;
	let animateTimeout;
	const BASE_LEADERBOARD_SCORE = 9_600_000;
	const SCORE_STEP = 420_000;
	const RANDOM_SCORE_RANGE = 1_400_000;
	const TRAFFIC_MIN = 12;
	const TRAFFIC_RANGE = 48;

	function formatScore(value) {
		return new Intl.NumberFormat('de-DE').format(Math.floor(value));
	}

	function makeStarterBoard() {
		return countries.map((code, i) => ({
			code,
			score:
				BASE_LEADERBOARD_SCORE -
				i * SCORE_STEP +
				Math.floor(Math.random() * RANDOM_SCORE_RANGE)
		}));
	}

	function readBoard() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return makeStarterBoard();
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed) || parsed.length === 0) return makeStarterBoard();
			return parsed;
		} catch {
			return makeStarterBoard();
		}
	}

	function persistBoard() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(leaderboard));
	}

	function sortedBoard() {
		leaderboard = [...leaderboard].sort((a, b) => b.score - a.score);
	}

	function addToCountry(code, points) {
		const idx = leaderboard.findIndex((row) => row.code === code);
		if (idx === -1) return;
		leaderboard[idx].score += points;
		sortedBoard();
		persistBoard();
	}

	function recalcCombo(now) {
		if (now - lastTapAt > 1400) {
			tapsInWindow = 0;
			combo = 1;
		}

		tapsInWindow += 1;
		lastTapAt = now;

		if (tapsInWindow >= 35) combo = 4;
		else if (tapsInWindow >= 24) combo = 3;
		else if (tapsInWindow >= 12) combo = 2;
		else combo = 1;
	}

	function bopCat() {
		const now = Date.now();
		recalcCombo(now);
		const points = 1;
		localScore += points;
		pressed = true;
		animating = true;
		clearTimeout(pressTimeout);
		clearTimeout(animateTimeout);
		pressTimeout = setTimeout(() => (pressed = false), 110);
		animateTimeout = setTimeout(() => (animating = false), 520);
		addToCountry(selectedCountry, points);
	}

	function simulateWorldTraffic() {
		const bursts = 22;
		for (let i = 0; i < bursts; i++) {
			const randomCountry = countries[Math.floor(Math.random() * countries.length)];
			const randomPoints = TRAFFIC_MIN + Math.floor(Math.random() * TRAFFIC_RANGE);
			addToCountry(randomCountry, randomPoints);
		}
		worldTick += 1;
	}

	function resetFakeBoard() {
		leaderboard = makeStarterBoard();
		sortedBoard();
		persistBoard();
		localScore = 0;
		combo = 1;
		tapsInWindow = 0;
	}

	function onKeyTap(event) {
		if (event.code === 'Space' || event.code === 'Enter') {
			event.preventDefault();
			bopCat();
		}
	}

	onMount(() => {
		leaderboard = readBoard();
		sortedBoard();
		const timer = setInterval(simulateWorldTraffic, 2800);
		window.addEventListener('keydown', onKeyTap);
		return () => {
			clearInterval(timer);
			window.removeEventListener('keydown', onKeyTap);
			clearTimeout(pressTimeout);
			clearTimeout(animateTimeout);
		};
	});

	$: topRows = leaderboard.slice(0, 8);
	$: myRow = leaderboard.find((r) => r.code === selectedCountry);
</script>

<div class="bg-slate-950 text-slate-100 px-5 py-8 rounded-2xl border border-slate-700 shadow-2xl">
	<div class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_1fr]">
		<section class="rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-500/10">
			<h2 class="text-3xl font-black tracking-tight text-cyan-300">JamCat</h2>
			<p class="mt-2 text-sm text-slate-300">Tap or press Space/Enter to boost your country score.</p>

			<div class="mt-4 flex flex-wrap items-center gap-3">
				<label class="text-xs uppercase tracking-widest text-slate-400" for="country">Country</label>
				<select
					id="country"
					bind:value={selectedCountry}
					class="rounded-lg border border-cyan-300/30 bg-slate-800 px-3 py-2 text-sm"
				>
					{#each countries as code}
						<option value={code}>{countryNames[code]}</option>
					{/each}
				</select>
			</div>

			<button
				type="button"
				on:click={bopCat}
				class="group mt-6 w-full rounded-2xl border border-cyan-200/30 bg-gradient-to-b from-cyan-400/20 to-blue-500/20 p-6"
			>
				<img
					src={animating ? '/kittyjam-jamming.gif' : '/kittyjam-still.png'}
					alt="JamCat"
					class="mx-auto h-52 w-auto rounded-xl border-4 border-cyan-200/40 shadow-xl transition duration-75 group-active:scale-95 {pressed
						? 'scale-95 rotate-2'
						: 'scale-100'}"
				/>
			</button>

			<div class="mt-5 grid grid-cols-3 gap-3 text-center">
				<div class="rounded-xl bg-slate-800 p-3">
					<div class="text-xs text-slate-400">My Score</div>
					<div class="text-2xl font-extrabold text-cyan-300">{formatScore(localScore)}</div>
				</div>
				<div class="rounded-xl bg-slate-800 p-3">
					<div class="text-xs text-slate-400">Combo</div>
					<div class="text-2xl font-extrabold text-emerald-300">x{combo}</div>
				</div>
				<div class="rounded-xl bg-slate-800 p-3">
					<div class="text-xs text-slate-400">My Country</div>
					<div class="text-lg font-bold text-amber-300">{myRow ? formatScore(myRow.score) : 0}</div>
				</div>
			</div>

			<div class="mt-4 flex gap-2">
				<button
					type="button"
					on:click={simulateWorldTraffic}
					class="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
				>
					Refresh live traffic
				</button>
				<button
					type="button"
					on:click={resetFakeBoard}
					class="rounded-lg border border-slate-500 px-4 py-2 text-sm hover:bg-slate-800"
				>
					Reset leaderboard
				</button>
			</div>
		</section>

		<section class="rounded-2xl border border-fuchsia-300/20 bg-slate-900/70 p-5 shadow-2xl shadow-fuchsia-500/10">
			<h3 class="text-xl font-black text-fuchsia-300">Country Leaderboard</h3>
			<p class="mt-1 text-xs text-slate-400">Live activity across all JamCat regions.</p>
			<p class="mt-1 text-xs text-slate-500">Background ticks: {worldTick}</p>

			<ol class="mt-4 space-y-2">
				{#each topRows as row, idx}
					<li
						class="flex items-center justify-between rounded-lg border px-3 py-2 {row.code === selectedCountry
							? 'border-amber-300/60 bg-amber-300/10'
							: 'border-slate-700 bg-slate-800/80'}"
					>
						<div class="flex items-center gap-3">
							<span class="w-6 text-sm font-bold text-slate-400">#{idx + 1}</span>
							<span class="font-semibold">{countryNames[row.code]}</span>
						</div>
						<span class="font-mono text-cyan-300">{formatScore(row.score)}</span>
					</li>
				{/each}
			</ol>
		</section>
	</div>
</div>
