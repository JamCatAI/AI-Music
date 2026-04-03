<svelte:head>
	<title>Bridge | JamCat Cross-Chain</title>
	<meta name="description" content="Bridge assets between Solana, Ethereum, Bitcoin, and other chains." />
</svelte:head>

<script>
	// Bridge configuration
	const chains = [
		{ id: 'solana', name: 'Solana', icon: '◎', color: 'from-purple-400 to-indigo-500', native: 'SOL' },
		{ id: 'ethereum', name: 'Ethereum', icon: 'Ξ', color: 'from-blue-400 to-indigo-400', native: 'ETH' },
		{ id: 'bitcoin', name: 'Bitcoin', icon: '₿', color: 'from-amber-400 to-orange-500', native: 'BTC' },
		{ id: 'arbitrum', name: 'Arbitrum', icon: '🔷', color: 'from-blue-300 to-indigo-300', native: 'ETH' },
		{ id: 'base', name: 'Base', icon: '🔵', color: 'from-blue-400 to-cyan-400', native: 'ETH' },
	];

	let fromChain = $state(chains[0]);
	let toChain = $state(chains[1]);
	let amount = $state('');
	let bridging = $state(false);
	let bridgeSuccess = $state(false);

	// Swap chains
	function swapChains() {
		const temp = fromChain;
		fromChain = toChain;
		toChain = temp;
	}

	async function bridge() {
		if (!amount) return;
		bridging = true;
		await new Promise(r => setTimeout(r, 3000));
		bridging = false;
		bridgeSuccess = true;
		setTimeout(() => bridgeSuccess = false, 3000);
	}

	// Recent bridge transactions
	let recentBridges = $state([
		{ id: 1, from: 'Solana', to: 'Ethereum', amount: 50, token: 'SOL', time: '2m ago', status: 'completed' },
		{ id: 2, from: 'Ethereum', to: 'Solana', amount: 0.5, token: 'ETH', time: '5m ago', status: 'completed' },
		{ id: 3, from: 'Bitcoin', to: 'Solana', amount: 0.1, token: 'BTC', time: '12m ago', status: 'pending' },
	]);

	// Supported tokens
	const tokens = [
		{ symbol: 'SOL', name: 'Solana', icon: '◎', balance: 245.5 },
		{ symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', balance: 1.25 },
		{ symbol: 'USDC', name: 'USD Coin', icon: '💵', balance: 5000 },
		{ symbol: 'USDT', name: 'Tether', icon: '💲', balance: 3200 },
	];

	let selectedToken = $state(tokens[0]);
</script>

<div class="relative min-h-screen overflow-hidden bg-[#020207] text-white">
	<!-- Background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]"></div>
	</div>

	<div class="relative mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
		<!-- Header -->
		<div class="mb-8 text-center">
			<h1 class="text-4xl font-black tracking-tight">
				<span class="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Bridge</span>
			</h1>
			<p class="mt-2 text-sm text-white/40">
				Cross-chain transfers · Instant settlement · Low fees
			</p>
		</div>

		<!-- Bridge Card -->
		<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
			<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
			
			<div class="relative space-y-6">
				<!-- From Chain -->
				<div class="space-y-2">
					<label class="text-[11px] font-bold uppercase tracking-wider text-gray-500">From</label>
					<div class="flex items-center gap-4">
						<div class="flex-1">
							<select 
								bind:value={fromChain}
								class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-bold text-white outline-none transition-all focus:border-blue-400/50"
							>
								{#each chains as chain (chain.id)}
									<option value={chain} class="bg-[#020207]">
										{chain.icon} {chain.name}
									</option>
								{/each}
							</select>
						</div>
						<div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
							<select 
								bind:value={selectedToken}
								class="bg-transparent text-sm font-bold text-white outline-none"
							>
								{#each tokens as token (token.symbol)}
									<option value={token} class="bg-[#020207]">
										{token.symbol}
									</option>
								{/each}
							</select>
							<p class="mt-1 text-[10px] text-gray-500">Balance: {selectedToken.balance}</p>
						</div>
					</div>
				</div>

				<!-- Swap Button -->
				<div class="flex justify-center">
					<button 
						onclick={swapChains}
						class="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:scale-110 hover:border-blue-400/30"
					>
						<svg class="h-5 w-5 text-white/60 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
						</svg>
					</button>
				</div>

				<!-- To Chain -->
				<div class="space-y-2">
					<label class="text-[11px] font-bold uppercase tracking-wider text-gray-500">To</label>
					<div class="flex items-center gap-4">
						<div class="flex-1">
							<select 
								bind:value={toChain}
								class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-bold text-white outline-none transition-all focus:border-blue-400/50"
							>
								{#each chains as chain (chain.id)}
									<option value={chain} class="bg-[#020207]" disabled={chain.id === fromChain.id}>
										{chain.icon} {chain.name}
									</option>
								{/each}
							</select>
						</div>
						<div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
							<p class="text-sm font-bold text-white">~{Number(amount || 0) * 0.98}</p>
							<p class="text-[10px] text-gray-500">Estimated receive</p>
						</div>
					</div>
				</div>

				<!-- Amount Input -->
				<div class="space-y-2">
					<label class="text-[11px] font-bold uppercase tracking-wider text-gray-500">Amount</label>
					<div class="relative">
						<input
							type="number"
							bind:value={amount}
							placeholder="0.00"
							class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-2xl font-bold text-white outline-none transition-all focus:border-blue-400/50"
						/>
						<button class="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 px-3 py-1 text-[11px] font-bold text-white/60 transition-colors hover:bg-white/20">
							MAX
						</button>
					</div>
				</div>

				<!-- Bridge Details -->
				<div class="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
					<div class="flex items-center justify-between text-[12px]">
						<span class="text-gray-500">Bridge Fee</span>
						<span class="font-medium text-white">0.5%</span>
					</div>
					<div class="flex items-center justify-between text-[12px]">
						<span class="text-gray-500">Network Fee</span>
						<span class="font-medium text-white">~$2.50</span>
					</div>
					<div class="flex items-center justify-between text-[12px]">
						<span class="text-gray-500">Time</span>
						<span class="font-medium text-white">~5-15 min</span>
					</div>
				</div>

				<!-- Bridge Button -->
				<button
					onclick={bridge}
					disabled={!amount || bridging}
					class="group relative w-full overflow-hidden rounded-2xl border border-blue-400/40 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 py-4 text-sm font-bold text-blue-400 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<span class="relative z-10 flex items-center justify-center gap-2">
						{#if bridging}
							<span class="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></span>
							<span>Bridging...</span>
						{:else if bridgeSuccess}
							<span>✓ Bridged!</span>
						{:else}
							<span>🌉</span>
							<span>Bridge Assets</span>
						{/if}
					</span>
				</button>
			</div>
		</div>

		<!-- Recent Bridges -->
		<div class="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
			<div class="border-b border-white/10 px-5 py-4">
				<h3 class="font-bold text-white">Recent Bridges</h3>
			</div>
			<div class="divide-y divide-white/[0.06]">
				{#each recentBridges as bridge (bridge.id)}
					<div class="flex items-center justify-between px-5 py-3">
						<div class="flex items-center gap-3">
							<div class="flex items-center gap-2">
								<span class="text-[11px] font-medium text-white">{bridge.from}</span>
								<svg class="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
								</svg>
								<span class="text-[11px] font-medium text-white">{bridge.to}</span>
							</div>
						</div>
						<div class="flex items-center gap-4">
							<span class="text-sm font-bold text-white">{bridge.amount} {bridge.token}</span>
							<span class="text-[10px] text-gray-500">{bridge.time}</span>
							<span class="rounded-full px-2 py-0.5 text-[10px] font-bold {bridge.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}">
								{bridge.status}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Bridge Stats -->
		<div class="mt-8 grid grid-cols-3 gap-4">
			{#each [
				{ label: 'Total Bridged', value: '$284M+', icon: '💰' },
				{ label: 'Avg Time', value: '8 min', icon: '⚡' },
				{ label: 'Chains', value: '12', icon: '🔗' },
				] as stat (stat.label)}
				<div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl">
					<p class="text-2xl">{stat.icon}</p>
					<p class="mt-1 text-lg font-bold text-white">{stat.value}</p>
					<p class="text-[10px] uppercase tracking-wider text-gray-500">{stat.label}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
