<script>
    import { nostrPool, relayEvents } from "$lib/store";
    import TimeAgo from 'javascript-time-ago'
    import en from 'javascript-time-ago/locale/en';
	import { onMount } from "svelte";

    TimeAgo.addDefaultLocale(en)

    onMount(async () => {
        // await $nostrPool.add('ws://localhost:8080');
        // await $nostrPool.add('wss://atlas.nostr.land');
        // await $nostrPool.add('wss://brb.io');
        await $nostrPool.add('wss://nos.lol');
        await $nostrPool.add('wss://relay.f7z.io');
        // // await $nostrPool.add('wss://nostr-relay.aapi.me');
        // await $nostrPool.add('wss://nostr-relay.nokotaro.com');
        // await $nostrPool.add('wss://nostr.jatm.link');
        // await $nostrPool.add('wss://nostr1.tunnelsats.com');
        await $nostrPool.add('wss://relay.nostr.band');
        // await $nostrPool.add("wss://relay.snort.social");
        // await $nostrPool.add("wss://offchain.pub");
        await $nostrPool.add("wss://nostr2.actn.io");
        // await $nostrPool.add("wss://nostr.lnprivate.network");
        // await $nostrPool.add("wss://nostr.com.de");
        // await $nostrPool.add("wss://relay.nostr.au");
        // await $nostrPool.add("wss://no.str.cr");
        // await $nostrPool.add("wss://1.noztr.com");
        // await $nostrPool.add("wss://nostr-verif.slothy.win");
        // await $nostrPool.add("wss://nostr-relay.digitalmob.ro");
        // await $nostrPool.add("wss://nostr.fractalized.ovh");
        // await $nostrPool.add("wss://relay.nostr.scot");
        // await $nostrPool.add("wss://relay.wellorder.net");
        // // await $nostrPool.add("wss://nostr.bitcoin-21.org");
        // await $nostrPool.add("wss://nostr.bongbong.com");
        // await $nostrPool.add("wss://nostr.mom");
        // await $nostrPool.add("wss://nostr.ginuerzh.xyz");
        // await $nostrPool.add("wss://nostr.rocket-tech.net");
        // await $nostrPool.add("wss://nostr.8e23.net");
        // await $nostrPool.add("wss://nostr3.actn.io");
        // await $nostrPool.add("wss://nostr.radixrat.com");
        // await $nostrPool.add("wss://knostr.neutrine.com");
        // await $nostrPool.add("wss://nostr.cercatrova.me");
        // await $nostrPool.add("wss://nostr.cro.social");
        // await $nostrPool.add("wss://relay.nostr.bg");
        // await $nostrPool.add("wss://nostr.jatm.link");
        // await $nostrPool.add("wss://nostr.yuv.al");
        // await $nostrPool.add("wss://relay.austrich.net");
        await $nostrPool.add("wss://relay.damus.io");
        // await $nostrPool.add("wss://relay.valera.co");
        // await $nostrPool.add("wss://nostr.globals.fans");
        // await $nostrPool.add("wss://nostr.einundzwanzig.space");
        // await $nostrPool.add("wss://nostr.swiss-enigma.ch");
        // await $nostrPool.add("wss://nostr.wine");
        await $nostrPool.add("wss://nostr.21crypto.ch");
        await $nostrPool.add("wss://nostr.mustardnodes.com");
        await $nostrPool.add("wss://nostr-pub.wellorder.net");
        await $nostrPool.add("wss://nostr.walletofsatoshi.com");

        // try {
        //     const userRelays = await window.nostr?.getRelays()
        //     console.log('userRelays', userRelays, window.nostr);
        //     if (userRelays) {
        //         Object.keys(userRelays).forEach(relay => $nostrPool.add(relay))
        //     }
        // } catch (e) {
        //     console.log('error getting relays', e)
        // }
    })

    import "../app.css";

    let displayRelayInfo = false;

    let relayUrls;
    $: relayUrls = Object.keys($relayEvents).filter(url => url.match(/\/\//));

    async function addNewRelay(e) {
        const formData = new FormData(e.target);
        $nostrPool.add(formData.get('newRelay'));
        e.target.reset();
    }
</script>

<div class="fixed flex-row items-center gap-2 bottom-0 left-0 text-4xl opacity-90 m-2 hidden md:flex cursor-pointer hover:opacity-100" on:click={()=>{displayRelayInfo=!displayRelayInfo}}>
    <div>⚙️</div>
    <div class="text-black dark:text-white text-base font-bold opacity-50 hover:opacity-100">Relays</div>
</div>
{#if displayRelayInfo}
<div class="fixed bottom-12 left-0 hidden md:block  p-5 m-2 rounded-lg shadow-lg bg-purple-900 text-white">
    <div class="font-bold text-lg mb-3">Relays</div>

    <ul class="list-none">
        {#each relayUrls as relayUrl}
            {#if $relayEvents[relayUrl] > 0}
            <li>
                <b>{relayUrl}:</b> {$relayEvents[relayUrl]} events
            </li>
            {/if}
        {/each}

        <li>
<form on:submit|preventDefault={addNewRelay} class="mt-3 flex rounded-md shadow-sm">
    <div class="relative flex flex-grow items-stretch focus-within:z-10">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"stroke-width="1.5" stroke="currentColor" fill="none" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        </div>
        <input type="newRelay" name="newRelay" id="newRelay" class="block w-full rounded-none rounded-l-md border-gray-300 pl-10 text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="wss://...">
      </div>
      <button type="submit" class="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-purple-700 bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <span>Add</span>
      </button>
    </form>
    </ul>
</div>
{/if}

<div class="flex flex-col min-h-screen items-center bottom-0 w-screen">
    <div class="flex flex-col items-center max-w-3xl w-full flex-grow">
        <slot />
    </div>
    <footer class="py-3 bg-purple-1000 font-mono text-white text-center mt-12 px-10 rounded-t-lg">
        <div class="flex justify-center flex-row">
            <div class="text-sm">
                ZAPLIFE.LOL
                by
                <a class="text-purple-50 hover:text-purple-400" href="https://pablof7z.com">
                    @pablof7z
                </a>
            </div>
        </div>
    </footer>
</div>