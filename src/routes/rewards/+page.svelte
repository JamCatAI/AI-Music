<svelte:head>
	<title>Rewards | JamCat DeFi</title>
	<meta name="description" content="Claim and track your DeFi rewards, staking yields, and airdrops." />
</svelte:head>

<script>
	import { onMount } from 'svelte';

	// Rewards data
	let rewards = $state([
		{ id: 1, name: 'SOL Staking', amount: 12.45, token: 'SOL', value: 2450, type: 'staking', claimable: true, apy: 6.8, icon: '◎' },
		{ id: 2, name: 'Jupiter Swap Fees', amount: 384.22, token: 'JUP', value: 420, type: 'fees', claimable: true, apy: null, icon: '🪐' },
		{ id: 3, name: 'Marinade Liquid', amount: 89.5, token: 'mSOL', value: 1890, type: 'staking', claimable: false, apy: 7.2, icon: '⚗️' },
		{ id: 4, name: 'Airdrop - Kamino', amount: 2500, token: 'KMNO', value: 125, type: 'airdrop', claimable: true, apy: null, icon: '🎁' },
		{ id: 5, name: 'Raydium LP Rewards', amount: 156.8, token: 'RAY', value: 95, type: 'lp', claimable: true, apy: 24.5, icon: '💧' },
		{ id: 6, name: 'Drift Trading', amount: 45.2, token: 'DRIFT', value: 67, type: 'trading', claimable: false, apy: null, icon: '🌊' },
	]);

	let totalClaimable = $derived(rewards.filter(r => r.claimable).reduce((sum, r) => sum + r.value, 0));
	let totalStaked = $derived(rewards.filter(r => r.type === 'staking').reduce((sum, r) => sum + r.value, 0));
	let monthlyYield = $derived(totalStaked * 0.006); // Approx 0.6% monthly

	let claiming = $state(false);
	let claimedSuccess = $state(false);

	async function claimAll() {
		claiming = true;
		await new Promise(r => setTimeout(r, 2000));
		claiming = false;
		claimedSuccess = true;
		setTimeout(() => claimedSuccess = false, 3000);
	}

	// Animated counter
	let animatedTotal = $state(0);
	onMount(() => {
		const target = totalClaimable;
		const duration = 1000;
		const start = performance.now();
		
		const animate = (now) => {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			animatedTotal = Math.floor(target * progress);
			if (progress < 1) requestAnimationFrame(animate);
		};
		requestAnimationFrame(animate);
	});

	const typeColors = {
		staking: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
		fees: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
		airdrop: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
		lp: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
		trading: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
	};

	const typeLabels = {
		staking: 'Staking Rewards',
		fees: 'Protocol Fees',
		airdrop: 'Airdrop',
		lp: 'Liquidity Pool',
		trading: 'Trading Rewards',
	};
</script>

<div class="relative min-h-screen overflow-hidden bg-[#020207] text-white">
	<!-- Background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]"></div>
		<div class="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
		<!-- Header -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-4xl font-black tracking-tight">
						<span class="bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 bg-clip-text text-transparent">Rewards</span>
					</h1>
					<span class="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
						DEFI YIELDS
					</span>
				</div>
				<p class="mt-1.5 text-xs text-white/40">
					Staking rewards · LP fees · Airdrops · Protocol incentives
				</p>
			</div>
			<button
				onclick={claimAll}
				disabled={claiming || totalClaimable === 0}
				class="group relative overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-400/10 to-yellow-400/10 px-6 py-3 text-sm font-bold text-amber-400 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 hover:shadow-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<span class="relative z-10 flex items-center gap-2">
					{#if claiming}
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></span>
						<span>Claiming...</span>
					{:else if claimedSuccess}
						<span>✓ Claimed!</span>
					{:else}
						<span>🎁</span>
						<span>Claim All (${animatedTotal})</span>
					{/if}
				</span>
			</button>
		</div>

		<!-- Stats Cards -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each [
				{ label: 'Claimable Now', value: `$${totalClaimable.toLocaleString()}`, icon: '💰', color: 'from-amber-400 to-yellow-500' },
				{ label: 'Total Staked', value: `$${totalStaked.toLocaleString()}`, icon: '◎', color: 'from-emerald-400 to-green-500' },
				{ label: 'Monthly Yield', value: `~$${monthlyYield.toFixed(0)}`, icon: '📈', color: 'from-blue-400 to-cyan-500' },
				{ label: 'Active Positions', value: rewards.length.toString(), icon: '🔥', color: 'from-purple-400 to-pink-500' },
			] as stat (stat.label)}
				<div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br {stat.color} opacity-0 blur-2xl transition-opacity group-hover:opacity-20"></div>
					<p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">{stat.icon} {stat.label}</p>
					<p class="mt-2 text-2xl font-black text-white">{stat.value}</p>
				</div>
			{/each}
		</div>

		<!-- Rewards List -->
		<div class="space-y-4">
			{#each rewards as reward (reward.id)}
				<div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]">
					<div class="absolute inset-0 bg-gradient-to-br {typeColors[reward.type]} opacity-0 transition-opacity group-hover:opacity-5"></div>
					
					<div class="relative flex items-center justify-between gap-4">
						<div class="flex items-center gap-4">
							<div class="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-2xl">
								{reward.icon}
							</div>
							<div>
								<div class="flex items-center gap-2">
									<h3 class="font-bold text-white">{reward.name}</h3>
									<span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-400">
										{typeLabels[reward.type]}
									</span>
								</div>
								<p class="text-sm text-gray-400">
									{reward.amount.toLocaleString()} {reward.token}
									{#if reward.apy}
										<span class="ml-2 rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
											APY {reward.apy}%
										</span>
									{/if}
								</p>
							</div>
						</div>

						<div class="flex items-center gap-4">
							<div class="text-right">
								<p class="font-bold text-white">${reward.value.toLocaleString()}</p>
								<p class="text-[10px] text-gray-500">USD value</p>
							</div>
							<button
								disabled={!reward.claimable}
								class="rounded-xl px-4 py-2 text-sm font-bold transition-all {reward.claimable 
									? 'border border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20' 
									: 'border border-white/10 bg-white/5 text-gray-500 cursor-not-allowed'}"
							>
								{reward.claimable ? 'Claim' : 'Locked'}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
