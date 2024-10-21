import { stripRank, getInSkyblock, truncateNumbers } from "./functions"

function getAhMessageInfo(msg) {
    let msgType = msg.includes('You collected') ? "personal" : "coop";
    let resultItemName, resultCollector, resultBuyer, resultCost;

    if (msgType === 'personal') {
        const playerMessageRegex = /&r&eYou collected &r&6(.+) coins &r&efrom selling &r&f&r(.+) &r&eto &r(&[a-qs-z0-9])(.+) &r&ein an auction!&r/;
        const match = msg.match(playerMessageRegex);
        if (match) {
            const [_, cost, itemName, buyerColor, buyerName] = match;
            const formattedBuyer = `${buyerColor}${stripRank(buyerName.removeFormatting())}`;
            resultItemName = itemName;
            resultBuyer = formattedBuyer;
            resultCost = truncateNumbers(cost);
        }
    } else if (msgType === 'coop') {
        const coopMessageRegex = /(&[a-qs-z0-9])(.+)&r&f &r&ecollected an auction for &r&6(.+) coins&r&e!&r/;
        const match = msg.match(coopMessageRegex);
        if (match) {
            const [_, collectorColor, collectorName, cost] = match;
            const formattedCollector = `${collectorColor}${stripRank(collectorName.removeFormatting())}`;
            resultCollector = formattedCollector;
            resultCost = truncateNumbers(cost);
        }
    }

    return {
        type: msgType,
        item: resultItemName,
        collector: resultCollector,
        buyer: resultBuyer,
        cost: resultCost
    };      
}

function attemptAhMessageMatch(msg1, msg2) {
    const msg1Info = getAhMessageInfo(msg1);
    const msg2Info = getAhMessageInfo(msg2);
    if (msg1Info.type === msg2Info.type) return null;  // One must be personal, the other coop
    if (msg1Info.cost !== msg2Info.cost) return null;  // Must match on cost
    return {
        item: msg1Info.item ?? msg2Info.item,
        collector: msg1Info.collector ?? msg2Info.collector,
        buyer: msg1Info.buyer ?? msg2Info.buyer,
        cost: msg1Info.cost 
    };                  
}           

const AH_PREFIX = `&6[AH] `;
let storedClaimedMessages = [];
register('chat', (cost, item, recipient, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    storedClaimedMessages.push(message);
    cancel(event);   

    if (storedClaimedMessages.length < 2) return;   
    const [msg1, msg2] = storedClaimedMessages;
    const claimedMessageObject = attemptAhMessageMatch(msg1, msg2);          
    ChatLib.chat(`${AH_PREFIX}&r${claimedMessageObject.collector} &6CLAIMED: ${claimedMessageObject.item} &7for &6${claimedMessageObject.cost} &7to ${claimedMessageObject.buyer}`)
    storedClaimedMessages = [];
}).setCriteria('You collected ${cost} coins from selling ${item} to ${recipient} in an auction!');

register('chat', (collector, coins, event) => {
    if (!getInSkyblock()) return;
    if (collector === 'You') return;
    const message = ChatLib.getChatMessage(event, true);
    storedClaimedMessages.push(message);
    cancel(event);      
    
    if (storedClaimedMessages.length < 2) return;   
    const [msg1, msg2] = storedClaimedMessages;
    const claimedMessageObject = attemptAhMessageMatch(msg1, msg2);
    ChatLib.chat(`${AH_PREFIX}&r${claimedMessageObject.collector} &6CLAIMED: ${claimedMessageObject.item} &7for &6${claimedMessageObject.cost} &7to ${claimedMessageObject.buyer}`)
    storedClaimedMessages = [];
}).setCriteria('${collector} collected an auction for ${coins}');

function getAhExpiredMessageInfo(msg) {
    let msgType = msg.includes('You claimed') ? 'personal' : 'coop';
    let resultItemName, resultCollector;
    if (msgType === 'personal') {
        const playerMessageRegex = /&r&eYou claimed &r&f&r&9Glowstone Gauntlet &r&eback from your expired auction!&r/;
        const match = msg.match(playerMessageRegex);
        if (match) {
            const [_, formattedItem] = match;
            resultItemName = formattedItem;
        }
    } else if (msgType === 'coop') {
        const coopMessageRegex = /(&[a-qs-z0-9])(.+)&r&f &r&ecollected an expired auction!&r/;
        const match = msg.match(coopMessageRegex);
        if (match) {
            const [_, collectorColor, collectorName] = match;
            const formattedCollector = `${collectorColor}${stripRank(collectorName.removeFormatting())}`;
            resultCollector = formattedCollector;
        }
    }

    return {
        type: msgType,
        item: resultItemName,
        collector: resultCollector
    };
}

function attemptAhExpiredMessageMatch(msg1, msg2) {
    const msg1Info = getAhExpiredMessageInfo(msg1);
    const msg2Info = getAhExpiredMessageInfo(msg2);
    if (msg1Info.type === msg2Info.type) return null;
    return {
        item: msg1Info.item ?? msg2Info.item,
        collector: msg1Info.collector ?? msg2Info.collector
    };
}

let storedExpiredMessages = [];
register('chat', (item, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    storedExpiredMessages.push(message);
    cancel(event);   
    
    if (storedExpiredMessages.length < 2) return;
    const [msg1, msg2] = storedExpiredMessages;
    const claimedExpiredObject = attemptAhExpiredMessageMatch(msg1, msg2);
    ChatLib.chat(`${AH_PREFIX}&6CLAIMED &cEXPIRED: &r${claimedExpiredObject.item} &7by ${claimedExpiredObject.collector}`);
    storedExpiredMessages = [];
}).setCriteria('You claimed ${item} back from your expired auction!');

register('chat', (collector, event) => {
    if (!getInSkyblock()) return;
    if (collector === 'You') return;
    const message = ChatLib.getChatMessage(event, true);
    storedExpiredMessages.push(message);
    cancel(event);

    if (storedExpiredMessages.length < 2) return;
    const [msg1, msg2] = storedExpiredMessages;
    const claimedExpiredObject = attemptAhExpiredMessageMatch(msg1, msg2);
    ChatLib.chat(`${AH_PREFIX}&6CLAIMED &cEXPIRED: &r${claimedExpiredObject.item} &7by ${claimedExpiredObject.collector}`);
    storedExpiredMessages = [];
}).setCriteria('${collector} collected an expired auction!');
