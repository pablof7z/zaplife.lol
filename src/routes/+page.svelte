<script>
    import UserRanking from '$lib/components/UserRanking.svelte';
    import NavBar from '$lib/components/NavBar.svelte';

    import RadioButton from '$lib/components/RadioButton.svelte';

    import Hero from '$lib/components/Hero.svelte';
    import ZapFeed from '$lib/components/ZapFeed.svelte';
    import NoteRanking from '$lib/components/NoteRanking.svelte';
    import ZapRaisers from '$lib/components/ZapRaisers.svelte';

    let mode = 'zap-feed';
    let sortMode = 'amount';

    function changeMode(newMode) {
        mode = newMode;
    }

    function changeSortMode(newSortMode) {
        sortMode = newSortMode;
    }
</script>

<svelte:head>
    <title>ZAPLIFE.LOL</title>
</svelte:head>

<NavBar />

<Hero />

<div class="overflow-auto w-full flex flex-row justify-start sm:justify-center px-2">
    <div class="flex flex-row items-center justify-center text-regular sm:text-lg font-bold mb-5 whitespace-nowrap w-fit">
        <RadioButton pos="left" bind:activeValue={mode} value="zap-feed" text="zaps" />
        <RadioButton value="nostriches" bind:activeValue={mode} text="nostriches" on:click={() => changeMode('nostriches') }  />
        <RadioButton value="notes" bind:activeValue={mode} text="notes" on:click={() => changeMode('notes') } />
        <RadioButton pos="right" bind:activeValue={mode} value="zapraisers" text="zapraisers" />
    </div>
</div>


{#if ['nostriches', 'notes'].includes(mode)}
    <div class="flex flex-row items-center my-5 text-sm font-semibold">
        <RadioButton pos="left" bind:activeValue={sortMode} value="count" text="by zap count" on:click={() => changeSortMode('count')} />
        <RadioButton pos="right" bind:activeValue={sortMode} value="amount" text="by total sats" on:click={() => changeSortMode('amount')} />
    </div>
{/if}

<div class="my-4 w-full rounded">
    {#if mode === 'zap-feed'}
        <ZapFeed />
    {/if}

    {#if mode === 'nostriches'}
        <UserRanking {sortMode} />
    {/if}

    {#if mode === 'notes'}
        <NoteRanking {sortMode} />
    {/if}

    {#if mode === 'zapraisers'}
        <ZapRaisers />
    {/if}
</div>