<svelte:head>
	<title>Wallet | JamCat Assets</title>
	<meta name="description" content="Manage your crypto assets, view balances, and track portfolio performance." />
</svelte:head>

<script>
	// Wallet data
	let walletAddress = $state('8x...3j9k');
	let totalBalance = $state(45234.56);

	// Assets
	let assets = $state([
		{ symbol: 'SOL', name: 'Solana', balance: 245.5, price: 145.32, change24h: 8.4, icon: '◎', color: 'from-purple-500 to-indigo-500' },
		{ symbol: 'USDC', name: 'USD Coin', balance: 5000, price: 1.0, change24h: 0.0, icon: '💵', color: 'from-green-500 to-emerald-500' },
		{ symbol: 'BONK', name: 'Bonk', balance: 125000000, price: 0.000021, change24h: 24.5, icon: '🐕', color: 'from-orange-500 to-amber-500' },
		{ symbol: 'JUP', name: 'Jupiter', balance: 1250, price: 1.12, change24h: 12.1, icon: '🪐', color: 'from-blue-500 to-cyan-500' },
		{ symbol: 'WIF', name: 'dogwifhat', balance: 450, price: 2.45, change24h: 18.3, icon: '🎩', color: 'from-pink-500 to-rose-500' },
		{ symbol: 'ETH', name: 'Ethereum', balance: 1.25, price: 3456.78, change24h: -2.1, icon: 'Ξ', color: 'from-indigo-500 to-blue-500' },
	]);

	// Transactions
	let transactions = $state([
		{ id: 1, type: 'receive', amount: 50, token: 'SOL', from: '8x...2a1b', time: '2 min ago', status: 'confirmed' },
		{ id: 2, type: 'send', amount: 100, token: 'USDC', to: '8x...4c2d', time: '15 min ago', status: 'confirmed' },
		{ id: 3, type: 'swap', amount: 0.5, token: 'ETH', from: 'SOL', to: 'ETH', time: '1 hour ago', status: 'confirmed' },
		{ id: 4, type: 'stake', amount: 100, token: 'SOL', validator: 'Jito', time: '3 hours ago', status: 'confirmed' },
	]);

	let copied = $state(false);
	let showReceive = $state(false);
	let showSend = $state(false);

	function copyAddress() {
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	function formatNumber(num) {
		if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
		if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
		if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
		if (num < 0.01) return num.toExponential(2);
		return num.toFixed(num < 1 ? 4 : 2);
	}

	// Portfolio chart data
	let portfolioData = $state([
		{ label: 'SOL', value: 35, color: 'bg-purple-500' },
		{ label: 'USDC', value: 11, color: 'bg-green-500' },
		{ label: 'BONK', value: 6, color: 'bg-orange-500' },
		{ label: 'JUP', value: 3, color: 'bg-blue-500' },
		{ label: 'WIF', value: 2, color: 'bg-pink-500' },
		{ label: 'ETH', value: 43, color: 'bg-indigo-500' },
	]);
</script>

<div class="relative min-h-screen overflow-hidden bg-[#020207] text-white">
	<!-- Background glows -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
		<!-- Header -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-4xl font-black tracking-tight">
						<span class="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">Wallet</span>
					</h1>
					<span class="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
						SECURE
					</span>
				</div>
				<p class="mt-1.5 text-xs text-white/40">
					Manage assets · Track performance · Send & receive
				</p>
			</div>
			<div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
				<span class="text-sm text-gray-400">{walletAddress}</span>
				<button 
					onclick={copyAddress}
					class="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-white/20"
				>
					{copied ? '✓' : '📋'}
				</button>
			</div>
		</div>

		<!-- Total Balance Card -->
		<div class="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent p-8 backdrop-blur-xl">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Balance</p>
					<p class="mt-2 text-5xl font-black text-white">${totalBalance.toLocaleString()}</p>
					<div class="mt-2 flex items-center gap-2">
						<span class="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">+12.4%</span>
						<span class="text-[11px] text-gray-400">+$5,012 this week</span>
					</div>
				</div>
				<div class="flex gap-3">
					<button 
						onclick={() => showReceive = true}
						class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
					>
						<span>↓</span>
						Receive
					</button>
					<button 
						onclick={() => showSend = true}
						class="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-400/20"
					>
						<span>↑</span>
						Send
					</button>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Assets List -->
			<div class="lg:col-span-2">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-bold text-white">Assets</h2>
					<button class="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/10">
						+ Add Token
					</button>
				</div>
				<div class="space-y-3">
					{#each assets as asset (asset.symbol)}
						<div class="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]">
							<div class="flex items-center gap-4">
								<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br {asset.color} text-xl">
									{asset.icon}
								</div>
								<div>
									<h3 class="font-bold text-white">{asset.symbol}</h3>
									<p class="text-[11px] text-gray-400">{asset.name}</p>
								</div>
							</div>
							<div class="text-right">
								<p class="font-bold text-white">
									{formatNumber(asset.balance)} {asset.symbol}
								</p>
								<div class="flex items-center justify-end gap-2">
									<p class="text-[11px] text-gray-400">
										${(asset.balance * asset.price).toLocaleString()}
									</p>
									<span class="text-[11px] font-bold {asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
										{asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Portfolio Distribution -->
				<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
					<h3 class="mb-4 font-bold text-white">Portfolio</h3>
					<div class="space-y-3">
						{#each portfolioData as item (item.label)}
							<div>
								<div class="mb-1 flex items-center justify-between text-[11px]">
									<span class="text-gray-400">{item.label}</span>
									<span class="font-medium text-white">{item.value}%</span>
								</div>
								<div class="h-2 rounded-full bg-white/10">
									<div class="h-full rounded-full {item.color}" style="width: {item.value}%"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Recent Transactions -->
				<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
					<div class="border-b border-white/10 px-5 py-4">
						<h3 class="font-bold text-white">Recent Activity</h3>
					</div>
					<div class="divide-y divide-white/[0.06]">
						{#each transactions as tx (tx.id)}
							<div class="flex items-center justify-between px-5 py-3">
								<div class="flex items-center gap-3">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[11px]">
										{tx.type === 'receive' ? '↓' : tx.type === 'send' ? '↑' : tx.type === 'swap' ? '⇄' : '◎'}
									</div>
									<div>
										<p class="text-sm font-bold text-white capitalize">{tx.type}</p>
										<p class="text-[10px] text-gray-400">{tx.time}</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-sm font-bold text-white">
										{tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{tx.amount} {tx.token}
									</p>
									<span class="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
										{tx.status}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

{#if showReceive}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onclick={() => showReceive = false}>
		<div class="rounded-3xl border border-white/10 bg-[#0a0a12] p-8 text-center" onclick={(e) => e.stopPropagation()}>
			<p class="mb-4 text-6xl">📥</p>
			<h3 class="mb-2 text-xl font-bold text-white">Receive Funds</h3>
			<p class="mb-4 text-sm text-gray-400">Your wallet address</p>
			<div class="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
				<span class="text-sm text-white">{walletAddress}</span>
			</div>
			<button 
				onclick={copyAddress}
				class="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-6 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-400/20"
			>
				{copied ? '✓ Copied!' : '📋 Copy Address'}
			</button>
		</div>
	</div>
{/if}

{#if showSend}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onclick={() => showSend = false}>
		<div class="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a12] p-6" onclick={(e) => e.stopPropagation()}>
			<h3 class="mb-4 text-xl font-bold text-white">Send Funds</h3>
			<div class="space-y-4">
				<div>
					<label class="mb-2 block text-[11px] font-bold uppercase text-gray-400">Recipient Address</label>
					<input 
						type="text" 
						placeholder="Enter wallet address..."
						class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
					/>
				</div>
				<div>
					<label class="mb-2 block text-[11px] font-bold uppercase text-gray-400">Amount (SOL)</label>
					<input 
						type="number" 
						placeholder="0.00"
						class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
					/>
				</div>
				<button 
					onclick={() => { showSend = false; }}
					class="w-full rounded-xl border border-emerald-400/40 bg-emerald-400/10 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-400/20"
				>
					Send Transaction
				</button>
			</div>
		</div>
	</div>
{/if}
