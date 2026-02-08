<svelte:head>
  <title>{randomMeme ? `${randomMeme.name} | JamCat AI` : 'JamCat AI | GIF Memes'}</title>
  <meta name="description" content={randomMeme ? `Watch ${randomMeme.name} meme powered by AI` : 'Jam to AI-generated beats with JamCat'} />
</svelte:head>

<script>
import { onMount } from 'svelte';
import JamCatPopGame from '$lib/JamCatPopGame.svelte';

let defaultTitle = 'JamCat AI | GIF Memes';
let intervalId;
let isPageHidden = false;

const messages = ['JamCat is live!', 'Come back to jam!', 'Beats waiting!'];
let i = 0;

onMount(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isPageHidden = true;
      intervalId = setInterval(() => {
        document.title = messages[i % messages.length];
        i++;
      }, 100);
    } else {
      isPageHidden = false;
      clearInterval(intervalId);
      document.title = defaultTitle;
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(intervalId);
  };
});

const features = [
    "🎵 AI-Generated Beats in Seconds",
    "😼 Jam with a Smart Cat – Real-time Co-creation",
    "🎧 Remix, Loop, & Evolve Tracks",
    "📡 Export as MP3, WAV, or MIDI",
    "📈 Real-time Music Visualizer",
    "🧠 Powered by GPT + WaveNet + GANs"
];

const allGifs = [
    { name: "Kittyjam Jamming", file: "kittyjam-jamming.gif" },
    { name: "Absolute Cinema", file: "absolute-cinema.gif" },
    { name: "Grand Theft Auto", file: "grand-theft-auto.gif" },
    { name: "Lana Del Rey", file: "lana-del-rey.gif" },
    { name: "Matrix", file: "matrix.gif" },
    { name: "Mourinho", file: "mourinho.gif" },
    { name: "Red Dead Redemption", file: "red-dead-redemption.gif" }
];

const galleryGifs = allGifs.filter(gif => gif.file !== "kittyjam-jamming.gif");

let randomMeme = null;

function showRandomMeme() {
    const randomIndex = Math.floor(Math.random() * galleryGifs.length);
    randomMeme = galleryGifs[randomIndex];
}

let audio = null;

function playRandomTrack() {
    const tracks = ["music1.ogg", "music2.ogg", "music3.ogg"];
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    audio = new Audio(`/${randomTrack}`);
    audio.play();
}

const gptMemes = Array.from({ length: 10 }, (_, i) => ({
    name: `GPT Meme #${i + 1}`,
    file: `gpt/${i + 1}.png`
}));

let randomGptMeme = null;

function showRandomGptMeme() {
    const randomIndex = Math.floor(Math.random() * gptMemes.length);
    randomGptMeme = gptMemes[randomIndex];
}

const avatarPics = Array.from({ length: 40 }, (_, i) => ({
  file: `/profile-pics/jamcat${i + 1}.png`,
  name: `JamCat Avatar #${i + 1}`,
  downloadName: `jamcat${i + 1}.png`
}));

</script>

<div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-100 via-cyan-100 to-sky-100 px-4 py-8 text-gray-800 sm:px-6 lg:px-10">
  <div class="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.16),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.2),transparent_36%),radial-gradient(circle_at_70%_85%,rgba(167,139,250,0.2),transparent_40%)]"></div>

  <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div class="cloud absolute top-10 left-[-20%] w-48 h-28 animate-cloud1 opacity-10"></div>
    <div class="cloud absolute top-[20%] left-[-30%] w-40 h-24 animate-cloud2 opacity-10"></div>
    <div class="cloud absolute top-[35%] left-[-25%] w-56 h-32 animate-cloud3 opacity-10"></div>
    <div class="cloud absolute top-[50%] left-[-35%] w-44 h-28 animate-cloud4 opacity-10"></div>
    <div class="cloud absolute top-[60%] left-[-15%] w-64 h-36 animate-cloud5 opacity-10"></div>
    <div class="cloud absolute top-[70%] left-[-40%] w-52 h-30 animate-cloud6 opacity-10"></div>
    <div class="cloud absolute top-[80%] left-[-22%] w-60 h-34 animate-cloud7 opacity-10"></div>
  </div>

  <div class="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center">
    <div class="w-full rounded-3xl border border-white/70 bg-white/55 p-4 backdrop-blur-md shadow-lg shadow-cyan-500/10">
      <div class="flex flex-wrap items-center justify-center gap-3 md:justify-between">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-gray-600">JamCat Community Links</p>
        <div class="flex flex-wrap justify-center gap-3 text-white">
          <a href="https://x.com/JamCatCTO" target="_blank" aria-label="X / Twitter"
              class="rounded-full bg-black px-4 py-2 text-sm font-semibold shadow-md transition hover:scale-105 hover:bg-gray-800">
          🐦 X / Twitter
          </a>
          <a href="https://instagram.com/JamCatCTO" target="_blank" aria-label="Instagram"
              class="rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-4 py-2 text-sm font-semibold shadow-md transition hover:scale-105">
          📸 Instagram
          </a>
          <a href="https://tiktok.com/@Jam.Cat.CTO" target="_blank" aria-label="TikTok"
              class="rounded-full bg-black px-4 py-2 text-sm font-semibold shadow-md transition hover:scale-105">
          🎵 TikTok
          </a>
          <a href="https://www.coingecko.com/en/coins/jam-cat" target="_blank" aria-label="CoinGecko"
              class="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold shadow-md transition hover:scale-105 hover:bg-green-700">
          🦎 CoinGecko
          </a>
          <a href="https://dexscreener.com/solana/35jzmqqc6ewrw6pefwdlhmtxbkvnc9mxpbes4rbws1ww" target="_blank" aria-label="DexScreener"
              class="rounded-full bg-purple-700 px-4 py-2 text-sm font-semibold shadow-md transition hover:scale-105 hover:bg-purple-800">
          📊 DexScreener
          </a>
          <a href="https://t.me/JamCatOnSolana" target="_blank" aria-label="Telegram"
              class="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold shadow-md transition hover:scale-105 hover:bg-blue-600">
              💬 Telegram
          </a>
        </div>
      </div>
    </div>

    <section class="mt-8 w-full rounded-3xl border border-cyan-200/70 bg-white/40 p-4 shadow-xl shadow-cyan-500/10 backdrop-blur-md md:p-6">
      <h2 class="text-3xl font-extrabold text-center mb-4 text-cyan-700">🎮 JamCat Leaderboard</h2>
      <p class="text-center text-gray-700 mb-6">Play directly on the main page and push your country rank.</p>
      <JamCatPopGame />
    </section>

    <div class="my-12 h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent"></div>

    <section class="w-full max-w-6xl rounded-3xl border border-white/70 bg-white/55 p-6 text-center shadow-xl shadow-pink-500/10 backdrop-blur-md md:p-8">
      <h1 class="text-5xl md:text-6xl font-extrabold mb-4">
          🎶 Welcome to <span class="text-pink-600">JamCat AI</span> 😺
      </h1>

      <p class="mx-auto mb-6 max-w-xl text-xl">
          Where <span class="font-semibold">AI 🤖 meets Music 🎧</span> to create <span class="font-semibold">sonic magic ✨</span>
      </p>

      <img
          src="/kittyjam-jamming.gif"
          alt="Kitty Jamming"
          class="mx-auto w-64 h-auto rounded-2xl border-4 border-pink-400 shadow-lg transition-transform duration-300 hover:scale-105 md:w-80"
      />
    </section>

    <section class="mt-8 w-full max-w-6xl rounded-3xl border border-white/70 bg-white/55 p-6 shadow-xl shadow-purple-500/10 backdrop-blur-md md:p-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mx-auto">
        {#each avatarPics as avatar}
          <div class="flex flex-col items-center rounded-2xl border border-pink-100 bg-white p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
            <img
              src={avatar.file}
              alt={avatar.name}
              class="mb-3 h-40 w-40 rounded-full border-4 border-pink-400 object-cover shadow-md transition-transform duration-300 hover:scale-105"
            />
            <a
              href={avatar.file}
              download={avatar.downloadName}
              class="rounded-full bg-pink-500 px-4 py-2 text-white shadow-md transition hover:scale-105 hover:bg-pink-600"
            >
              ⬇️ Download
            </a>
          </div>
        {/each}
      </div>
    </section>

    <div class="my-12 h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-pink-500/70 to-transparent"></div>

    <section class="w-full max-w-6xl rounded-3xl border border-white/70 bg-white/55 p-6 shadow-xl shadow-fuchsia-500/10 backdrop-blur-md md:p-8">
      <h2 class="text-3xl font-extrabold text-center mb-8 text-purple-700">🎬 AI Music Meme Gallery 🎶</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {#each galleryGifs as gif}
          <div class="flex flex-col items-center rounded-2xl border border-purple-100 bg-white p-4 shadow-md transition-transform duration-300 hover:scale-105">
              <div class="w-full aspect-[1/1] overflow-hidden rounded-xl border-4 border-purple-300">
              <img
                  src={`/${gif.file}`}
                  alt={gif.name}
                  class="h-full w-full object-cover"
              />
              </div>
              <p class="mt-3 text-center font-semibold text-gray-700">{gif.name}</p>
          </div>
          {/each}
      </div>
    </section>

    <div class="my-12 h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent"></div>

    <div class="grid w-full max-w-6xl gap-6 md:grid-cols-2">
      <section class="rounded-3xl border border-white/70 bg-white/55 p-6 text-center shadow-xl shadow-amber-500/10 backdrop-blur-md">
        <button
            class="rounded-xl bg-yellow-400 px-6 py-3 text-lg font-bold text-black shadow-md transition hover:scale-105 hover:bg-yellow-500"
            on:click={showRandomMeme}
        >
            🎲 Generate Random Meme!
        </button>

        {#if randomMeme}
            <div class="mt-8 flex flex-col items-center">
                <img
                    src={`/${randomMeme.file}`}
                    alt={randomMeme.name}
                    class="h-auto w-72 rounded-lg border-4 border-yellow-300 shadow-lg transition-transform duration-300 hover:scale-105"
                />
                <p class="mt-2 text-xl font-semibold text-gray-700">🔥 {randomMeme.name} 🔥</p>
            </div>
        {/if}
      </section>

      <section class="rounded-3xl border border-white/70 bg-white/55 p-6 text-center shadow-xl shadow-indigo-500/10 backdrop-blur-md">
        <button
            class="rounded-xl bg-indigo-500 px-6 py-3 text-lg font-bold text-white shadow-md transition hover:scale-105 hover:bg-indigo-600"
            on:click={showRandomGptMeme}
        >
            🧠 Generate AI GPT Meme!
        </button>

        {#if randomGptMeme}
            <div class="mt-8 flex flex-col items-center">
                <img
                    src={`/${randomGptMeme.file}`}
                    alt={randomGptMeme.name}
                    class="h-auto w-72 rounded-lg border-4 border-indigo-400 shadow-lg transition-transform duration-300 hover:scale-105"
                />
                <p class="mt-2 text-xl font-semibold text-gray-700">🤯 {randomGptMeme.name} 🔮</p>
                <p class="mt-1 text-sm italic text-gray-500">💡 100% Neural Net-powered ✨ – GPT meets Meme Mayhem 🧬🔥</p>
            </div>
        {/if}
      </section>
    </div>

    <button
        class="mt-12 rounded-xl bg-pink-500 px-6 py-3 text-lg text-white shadow-lg transition hover:scale-105 hover:bg-pink-600"
        on:click={playRandomTrack}
    >
        🚀 Start Jamming with AI Music
    </button>

    <div class="mt-12 w-full max-w-4xl rounded-3xl border border-white/70 bg-white/60 p-8 shadow-xl shadow-purple-500/10 backdrop-blur-md">
      <h2 class="text-2xl font-bold mb-4 text-center text-purple-600">✨ Why You'll Love It ✨</h2>
      <ul class="space-y-3 text-lg">
      {#each features as feature}
          <li class="flex items-center">
          <span class="text-pink-500 text-xl mr-2">💎</span> {feature}
          </li>
      {/each}
      </ul>
    </div>

    <div class="mt-12 flex flex-wrap justify-center gap-4">
      <a
          href="https://www.coingecko.com/en/coins/jam-cat"
          target="_blank"
          class="rounded-xl bg-purple-600 px-5 py-2 text-lg text-white shadow-md transition hover:bg-purple-700"
      >
          🦎 View on CoinGecko
      </a>
      <a
          href="https://dexscreener.com/solana/35jzmqqc6ewrw6pefwdlhmtxbkvnc9mxpbes4rbws1ww"
          target="_blank"
          class="rounded-xl bg-green-500 px-5 py-2 text-lg text-white shadow-md transition hover:bg-green-600"
      >
          📊 $JAM on DexScreener
      </a>
      <a
        href="/whitepaper.pdf"
        target="_blank"
        download
        class="rounded-xl bg-blue-600 px-5 py-2 text-lg text-white shadow-md transition hover:bg-blue-700"
      >
        📄 Download Whitepaper
      </a>
    </div>

    <footer class="mt-16 text-center text-sm text-gray-600">
      🧠 Built with ❤️ by <strong>JamCat AI</strong> · 🚀 SvelteKit + Tailwind + Vibes<br/>
      👤 Follow <strong>@JamCatCTO</strong> on your fave platforms!
    </footer>
  </div>
</div>
