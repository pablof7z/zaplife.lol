import { nostrNotes, seenEvents, zaps, zapraisers, zapsPerNote, profiles, relayEvents, totalsPerNote, totalsPerRecipient, totalsPerSender, totalsPerZapper } from "$lib/store";
import "websocket-polyfill"
import {RelayPool, Relay} from 'nostr';
import { v4 as uuidv4 } from 'uuid';
import { calculateZapriserAmount } from '$lib/utils';
import { eventToZap } from '$lib/nostr/utils';

const connectionStatus = {
    connecting: 'connecting',
    connected: 'connected',
    disconnected: 'disconnected',
    error: 'error',
}
export default class Nostr {
	constructor() {
        this.pool = {
            pool: new RelayPool([]),
            subscriptionQueue: {},
            delayedSubscriptions: {},
            activeSubscriptions: []
        }
        // this.profilePool = {
        //     pool: new RelayPool(['wss://nos.lol', 'wss://relay.damus.io', 'wss://relay.snort.social']),
        //     subscriptionQueue: {},
        //     delayedSubscriptions: {},
        //     activeSubscriptions: []
        // };
        this.relays = []
        this.relayStatus = connectionStatus.disconnected;
	}

    async add(relayUrl) {
        const relay = new Relay(relayUrl);
        this.pool.pool.add(relay);
        this.pool.pool.on('open', (relay) => {
            // this.relayStatus = connectionStatus.connected;
            this.relays.push(relay);
            relayEvents.update((relays) => {
                relays[relay.url] = 0;
                return relays;
            })
            Object.values(this.pool.subscriptionQueue).forEach((queries) => {
                relay.subscribe(uuidv4(), queries);
            })
        })

        this.pool.pool.on('event', async (relay, subId, e) => await this.processEvent(e, relay))
        // this.profilePool.pool.on('event', async (relay, subId, e) => await this.processEvent(e, relay))
        // this.pool.on('notice', async (relay, message) => {
        //     console.log(`NOTICE from ${relay.url}: ${message}`);
        // })
        // this.pool.on('eose', async (relay, subId) => {
        //     console.log(`EOSE from ${relay.url} ${subId}`);
        // })
    }

    subscribe(queries, cleanAfter=2000, pool) {
        if (!pool) { pool = this.pool; }
        const subId = uuidv4()
        if (!Object.values(this.pool.subscriptionQueue).find((q) => JSON.stringify(q) === JSON.stringify(queries))) {
            this.pool.subscriptionQueue[subId] = queries;
        }

        if (queries[0]?.kinds && queries[0]?.kinds[0] === 0) {
            console.log('delayed subscription', queries, pool.pool.relays[0].url);
        } else {
            console.log(queries)
        }

        pool.pool.subscribe(subId, queries)

        if (cleanAfter) {
            setTimeout(() => {
                delete this.pool.subscriptionQueue[subId];
                this.unsubscribe(subId, pool);
            }, cleanAfter);
        }

        pool.activeSubscriptions.push(subId);

        return subId;
    }

    unsubscribe(subId, pool) {
        if (!pool) { pool = this.pool; }
        delete this.pool.subscriptionQueue[subId];
        pool.pool.unsubscribe(subId);
    }

    async unsubscribeAll() {
        for (let subId of this.pool.activeSubscriptions) {
            delete this.pool.subscriptionQueue[subId];
            this.pool.pool.unsubscribe(subId);
            // this.profilePool.pool.unsubscribe(subId);
        }

        this.pool.pool.subscriptionQueue = {};
        this.pool.pool.activeSubscriptions = [];
        // this.profilePool.pool.subscriptionQueue = {};
        // this.profilePool.pool.activeSubscriptions = [];
    }

    async reset() {
        zaps.update(() => []);
        seenEvents.update(() => { return {}; });
        zapsPerNote.update(() => { return {}; });
        totalsPerNote.update(() => { return {}; });
        totalsPerSender.update(() => { return {}; });
        totalsPerRecipient.update(() => { return {}; });
    }

    processZap(event) {
        let zap;
        zap = eventToZap(event, profiles);

        if (zap) {
            if (zap.event.created_at > Date.now() / 1000 - (2 * 60)) {
                this.reqProfile([zap.sender, zap.recipient]);
            }

            // add zap
            try {
            zaps.update((zaps) => {
                let index = 0;
                while (index < zaps.length && zaps[index].created_at < zap.created_at) {
                    index++;
                }
                zaps.splice(index, 0, zap);
                return zaps;
            });} catch (e) { console.log('1', e)}

            // add to zaps per note
            try {
            zapsPerNote.update((zapsPerNote) => {
                let noteZaps = zapsPerNote[zap.zappedNoteId] || [];
                let index = 0;

                while (index < noteZaps.length && noteZaps[index].amount < zap.amount) {
                    index++;
                }
                noteZaps.splice(index, 0, zap);
                zapsPerNote[zap.zappedNoteId] = noteZaps;
                return zapsPerNote;
            })} catch (e) { console.log('2', e)}

            // add to total per note
            try {
            totalsPerNote.update((totals) => {
                let t = totals[zap.zappedNoteId] || { count: 0, amount: 0 };

                t.count++;
                t.amount += zap.amount;
                totals[zap.zappedNoteId] = t;

                return totals;
            })} catch (e) { console.log('3', e)}

            // add to total per recipient
            try {
            totalsPerRecipient.update((totals) => {
                let t = totals[zap.recipient] || { count: 0, amount: 0 };

                t.count++;
                t.amount += zap.amount;
                totals[zap.recipient] = t;

                return totals;
            })} catch (e) { console.log('4', e)}

            // add to total per sender
            try {
            totalsPerSender.update((totals) => {
                let t = totals[zap.sender] || { count: 0, amount: 0 };

                t.count++;
                t.amount += zap.amount;
                totals[zap.sender] = t;

                return totals;
            })} catch (e) { console.log('5', e)}

            // add to total per sender
            try {
                if (zap.zapper) {
                    totalsPerZapper.update((totals) => {
                        let t = totals[zap.zapper] || { count: 0, amount: 0 };

                        t.count++;
                        t.amount += zap.amount;
                        totals[zap.zapper] = t;

                        return totals;
                    })
                }
            } catch (e) { console.log('5', e)}
        }
    }

    processMetadata(event) {
        try {
            event.content = JSON.parse(event.content);
        } catch (e) {
            return;
        }

        profiles.update((profiles) => {
            profiles[event.pubkey] = {
                ...profiles[event.pubkey],
                ...event.content
            };
            return profiles;
        })
    }

    processNote(event) {
        let isZapraiser = event.tags.find((t) => t[1].matches === 'zapraiser');

        nostrNotes.update((notes) => {
            if (isZapraiser) {
                const zapraiseAmount = calculateZapriserAmount(event);
                if (zapraiseAmount) {
                    event.zapraiseAmount = zapraiseAmount;
                } else {
                    isZapraiser = false;
                }
            }

            notes[event.id] = event;
            return notes;
        });

        if (isZapraiser) {
            this.delayedSubscribe([{ '#e': [event.id] }], 'zapraiser', 1000);

            zapraisers.update((notes) => {
                notes.push(event.id);
                return notes;
            });
        }
    }

    updateEventsSeenPerRelay(relay) {
        relayEvents.update(relays => {
            relays[relay.url] = (relays[relay.url] || 0) + 1;
            return relays;
        })
    }

    async processEvent(event, relay) {
        let existingEvent = false;

        seenEvents.update((events) => {
            if (events[event.id]) {
                existingEvent = true;
                return events;
            }
            events[event.id] = true;
            return events;
        });

        if (existingEvent) { return; }

        this.updateEventsSeenPerRelay(relay);

        switch (event.kind) {
            case 9734, 9735: await this.processZap(event); break;
            case 0: await this.processMetadata(event); break;
            case 1: await this.processNote(event); break;
        }

        // if (event.kind === 9735) {
        //     this.pool.send(
        //         ['EVENT', event],
        //         ['wss://relay.f7z.io']);
        // }
    }

    delayedSubscribe(filters, name, delay, closeAfter=false, pool) {
        if (!pool) { pool = this.pool; }

        pool.delayedSubscriptions[name] = pool.delayedSubscriptions[name] || { filters: []};
        filters.forEach((f) => {
            if (!pool.delayedSubscriptions[name].filters.find((q) => JSON.stringify(q) === JSON.stringify(f))) {
                pool.delayedSubscriptions[name].filters.push(f);
            }
        });

        if (!pool.delayedSubscriptions[name].timeout) {
            pool.delayedSubscriptions[name].timeout = setTimeout(() => {
                console.log('subscribing', filters, pool);
                this.subscribe(pool.delayedSubscriptions[name].filters, closeAfter, pool);
                delete pool.delayedSubscriptions[name];
            }, delay);
        }
    }

    reqEvent(eventId, delay=1000) {
        if (!zaps[eventId]) {
            if (delay === 0) {
                this.subscribe([{ids: [eventId]}, { '#e': [eventId] }]);
            } else {
                this.delayedSubscribe([{ids: [eventId]}, { '#e': [eventId] }], 'reqEvent', delay);
            }
        }
    }

    reqProfile(pubkeys) {
        let subpubkeys = [];
        if (Array.isArray(pubkeys)) {
            subpubkeys = pubkeys // .filter((p) => !profiles[p]);
        } else {
            subpubkeys = [pubkeys];
        }

        if (subpubkeys.length) {
            // this.delayedSubscribe([{kinds:[0], authors: subpubkeys}], 'reqProfile', 500, 500, this.profilePool);
            this.delayedSubscribe([{kinds:[0], authors: subpubkeys}], 'reqProfile', 500, 500);
        }
    }
}
