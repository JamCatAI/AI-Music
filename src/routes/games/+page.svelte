<svelte:head>
	<title>Games | JamCat Arcade</title>
	<meta name="description" content="Play web3 games, earn rewards, and compete on leaderboards." />
</svelte:head>

<script>
	import { onMount } from 'svelte';

	// Featured games
	let featuredGames = $state([
		{ id: 1, name: 'DeFi Tower Defense', category: 'Strategy', players: '12.4K', rewards: '500 SOL/day', image: '🏰', color: 'from-purple-500 to-indigo-500' },
		{ id: 2, name: 'NFT Racing', category: 'Racing', players: '8.2K', rewards: '250 SOL/day', image: '🏎️', color: 'from-red-500 to-orange-500' },
		{ id: 3, name: 'Crypto Cards', category: 'Card Game', players: '24.1K', rewards: '1,000 SOL/day', image: '🎴', color: 'from-blue-500 to-cyan-500' },
	]);

	// All games
	let games = $state([
		{ id: 4, name: 'Meme Merge', category: 'Puzzle', players: '5.3K', rewards: '100 SOL/day', icon: '🧩', hot: true },
		{ id: 5, name: 'Token Clicker', category: 'Idle', players: '15.7K', rewards: '150 SOL/day', icon: '🖱️', hot: false },
		{ id: 6, name: 'Chain Battles', category: 'RPG', players: '3.8K', rewards: '200 SOL/day', icon: '⚔️', hot: true },
		{ id: 7, name: 'Solana Slots', category: 'Casino', players: '9.1K', rewards: '800 SOL/day', icon: '🎰', hot: true },
		{ id: 8, name: 'Block Puzzle', category: 'Puzzle', players: '4.2K', rewards: '75 SOL/day', icon: '🧊', hot: false },
		{ id: 9, name: 'Airdrop Hunter', category: 'Adventure', players: '6.9K', rewards: '300 SOL/day', icon: '🎯', hot: true },
	]);

	// User stats
	let userStats = $state({
		gamesPlayed: 47,
		totalEarned: 125.5,
		bestScore: 999999,
		rank: 2847,
	});

	// Leaderboard
	let leaderboard = $state([
		{ rank: 1, name: 'CryptoKing', score: 9999999, reward: '50 SOL', avatar: '👑' },
		{ rank: 2, name: 'DeFiMaster', score: 8754321, reward: '30 SOL', avatar: '💎' },
		{ rank: 3, name: 'MoonWalker', score: 7643210, reward: '20 SOL', avatar: '🚀' },
		{ rank: 4, name: 'You', score: userStats.bestScore, reward: '-', avatar: '😺', isUser: true },
		{ rank: 5, name: 'TokenTrader', score: 5432109, reward: '10 SOL', avatar: '📈' },
	]);

	let selectedGame = $state(null);
	let playing = $state(false);

	function playGame(game) {
		selectedGame = game;
		playing = true;
		setTimeout(() => {
			playing = false;
		}, 3000);
	}
</script>

<div class="relative min-h-screen overflow-hidden bg-[#020207] text-white">
	<!-- Background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-pink-500/10 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-[140px]"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
		<!-- Header -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-4xl font-black tracking-tight">
						<span class="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">Games</span>
					</h1>
					<span class="rounded-md border border-pink-400/30 bg-pink-400/10 px-2 py-0.5 text-[10px] font-bold text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
						ARCADE
					</span>
				</div>
				<p class="mt-1.5 text-xs text-white/40">
					Play to earn · Compete · Win rewards
				</p>
			</div>
		</div>

		<!-- User Stats -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each [
				{ label: 'Games Played', value: userStats.gamesPlayed.toString(), icon: '🎮', color: 'from-pink-400 to-rose-500' },
				{ label: 'Total Earned', value: `${userStats.totalEarned} SOL`, icon: '💰', color: 'from-emerald-400 to-green-500' },
				{ label: 'Best Score', value: userStats.bestScore.toLocaleString(), icon: '🏆', color: 'from-amber-400 to-yellow-500' },
				{ label: 'Global Rank', value: `#${userStats.rank.toLocaleString()}`, icon: '📊', color: 'from-blue-400 to-cyan-500' },
			] as stat (stat.label)}
				<div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br {stat.color} opacity-0 blur-2xl transition-opacity group-hover:opacity-20"></div>
					<p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">{stat.icon} {stat.label}</p>
					<p class="mt-2 text-2xl font-black text-white">{stat.value}</p>
				</div>
			{/each}
		</div>

		<!-- Featured Games -->
		<div class="mb-8">
			<h2 class="mb-4 text-lg font-bold text-white">Featured Games</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{#each featuredGames as game (game.id)}
					<button 
						onclick={() => playGame(game)}
						class="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-left transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
					>
						<div class="absolute inset-0 bg-gradient-to-br {game.color} opacity-0 transition-opacity group-hover:opacity-10"></div>
						<div class="relative">
							<div class="mb-4 flex text-6xl">{game.image}</div>
							<div class="flex items-center justify-between">
								<div>
									<h3 class="font-bold text-white">{game.name}</h3>
									<p class="text-[11px] text-gray-400">{game.category}</p>
								</div>
								<span class="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
									{game.players}
								</span>
							</div>
							<p class="mt-2 text-[11px] text-amber-400">🏆 {game.rewards}</p>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- All Games -->
			<div class="lg:col-span-2">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-bold text-white">All Games</h2>
					<div class="flex gap-2">
						<button class="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/10">All</button>
						<button class="rounded-lg border border-white/10 bg-transparent px-3 py-1 text-[11px] font-medium text-gray-400 transition-colors hover:text-white">Hot</button>
						<button class="rounded-lg border border-white/10 bg-transparent px-3 py-1 text-[11px] font-medium text-gray-400 transition-colors hover:text-white">New</button>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{#each games as game (game.id)}
						<button 
							onclick={() => playGame(game)}
							class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
						>
							{#if game.hot}
								<span class="absolute right-2 top-2 rounded-full bg-rose-400/20 px-1.5 py-0.5 text-[8px] font-bold text-rose-400">
									🔥 HOT
								</span>
							{/if}
							<div class="mb-3 text-4xl">{game.icon}</div>
							<h3 class="font-bold text-white">{game.name}</h3>
							<p class="text-[10px] text-gray-400">{game.category}</p>
							<div class="mt-2 flex items-center justify-between">
								<span class="text-[10px] text-emerald-400">{game.players}</span>
								<span class="text-[9px] text-amber-400">{game.rewards}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Leaderboard -->
			<div>
				<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
					<div class="border-b border-white/10 px-5 py-4">
						<h3 class="font-bold text-white">🏆 Leaderboard</h3>
					</div>
					<div class="divide-y divide-white/[0.06]">
						{#each leaderboard as player (player.rank)}
							<div class="flex items-center gap-3 px-5 py-3 {player.isUser ? 'bg-white/[0.04]' : ''}">
								<span class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold
									{player.rank === 1 ? 'bg-amber-400/20 text-amber-400' : 
									 player.rank === 2 ? 'bg-gray-400/20 text-gray-400' : 
									 player.rank === 3 ? 'bg-orange-400/20 text-orange-400' : 
									 'bg-white/10 text-white'}">
									{player.rank}
								</span>
								<span class="text-xl">{player.avatar}</span>
								<div class="flex-1">
									<p class="font-bold text-white text-sm">{player.name}</p>
									<p class="text-[10px] text-gray-400">{player.score.toLocaleString()}</p>
								</div>
								{#if player.reward !== '-'}
									<span class="rounded bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
										{player.reward}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Daily Challenge -->
				<div class="mt-4 overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-transparent p-5 backdrop-blur-xl">
					<div class="flex items-center gap-2 mb-3">
						<span class="text-xl">🎯</span>
						<h3 class="font-bold text-white">Daily Challenge</h3>
					</div>
					<p class="text-sm text-gray-400 mb-3">Score 100,000 points in DeFi Tower Defense</p>
					<div class="flex items-center justify-between text-[11px]">
						<span class="text-gray-500">Progress: 67%</span>
						<span class="text-amber-400 font-bold">25 SOL</span>
					</div>
					<div class="mt-2 h-2 rounded-full bg-white/10">
						<div class="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

{#if playing}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
		<div class="text-center">
			<div class="mb-4 text-6xl animate-bounce">{selectedGame?.image || '🎮'}</div>
			<p class="text-xl font-bold text-white">Launching {selectedGame?.name}...</p>
			<div class="mt-4 flex justify-center gap-2">
				<span class="h-2 w-2 rounded-full bg-pink-400 animate-pulse"></span>
				<span class="h-2 w-2 rounded-full bg-purple-400 animate-pulse delay-100"></span>
				<span class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse delay-200"></span>
			</div>
		</div>
	</div>
{/if}
