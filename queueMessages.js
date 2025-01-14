import { stripRank, getInSkyblock, truncateNumbers, replaceAuctionMessage } from "./functions"

function getAhMessageInfo(msg) {
    const msgType = msg.includes('You collected') ? "personal" : "coop";
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

const channels = ['Guild > ', 'Party > ', 'Co-op > ', 'From', 'To', 'You'];  
const regexNormalChannels = [/^\[\d+\]/];
const AH_PREFIX = `&6[AH] `;
let storedClaimedMessages = [];
register('chat', (cost, item, recipient, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    for (let idx = 0; idx < storedClaimedMessages.length; idx++) {
        let storedMessage = storedClaimedMessages[idx];
        const attemptMatchObject = attemptAhMessageMatch(message, storedMessage);
        if (attemptMatchObject) {   
            storedClaimedMessages.pop(idx);
            const shownCollector = attemptMatchObject.collector.removeFormatting().trim() === Player.getName() ? '&7!' : ` &7by ${attemptMatchObject.collector}&7!`;
            replaceAuctionMessage(event, `${AH_PREFIX}&6CLAIMED: ${attemptMatchObject.item} &7for &6${attemptMatchObject.cost} &7to ${attemptMatchObject.buyer}${shownCollector}`);    
            return;         
            // [AH] CLAIMED: Empty Thunder Bottle for 600k to Aidanqt by Dompay (coop)
            // [AH] CLAIMED: Empty Thunder Bottle for 600k to Aidanqt (self)
        }
    }  
    storedClaimedMessages.push(message);
    cancel(event);
}).setCriteria('You collected ${cost} coins from selling ${item} to ${recipient} in an auction!');  

register('chat', (collector, coins, event) => { 
    if (!getInSkyblock()) return;
    if (channels.some(channel => collector.startsWith(channel)) ||
    regexNormalChannels.some(regex => regex.test(collector))) return;
    const message = ChatLib.getChatMessage(event, true);
    const collectorName = stripRank(collector).trim();
    if (collectorName !== Player.getName()) {   
        const matchObject = getAhMessageInfo(message);  
        replaceAuctionMessage(event, `${AH_PREFIX}CLAIMED: &6${matchObject.cost} &7by ${matchObject.collector}&7!`);
        return;
        // [AH] CLAIMED: 600k by Dompay     
    }

    for (let idx = 0; idx < storedClaimedMessages.length; idx++) {
        let storedMessage = storedClaimedMessages[idx];
        const attemptMatchObject = attemptAhMessageMatch(message, storedMessage);
        if (attemptMatchObject) {   
            storedClaimedMessages.pop(idx);
            const shownCollector = attemptMatchObject.collector.removeFormatting().trim() === Player.getName() ? '&7!' : ` &7by ${attemptMatchObject.collector}&7!`;
            replaceAuctionMessage(event, `${AH_PREFIX}&6CLAIMED: ${attemptMatchObject.item} &7for &6${attemptMatchObject.cost} &7to ${attemptMatchObject.buyer}${shownCollector}`);    
            return;
            // [AH] CLAIMED: Empty Thunder Bottle for 600k to Aidanqt by Dompay
            // [AH] CLAIMED: Empty Thunder Bottle for 600k to Aidanqt 
        }
    }   
    storedClaimedMessages.push(message);
    cancel(event);
}).setCriteria('${collector} collected an auction for ${coins}');







function getExpiredInfo(msg) {
    const msgType = msg.includes('You claimed') ? "personal" : "coop";
    let resultItem, resultCollector;
    if (msgType === "personal") {
        const personalRegex = /&r&eYou claimed &r&f&r(.+) &r&eback from your expired auction!&r/;
        const match = msg.match(personalRegex);
        if (match) {
            const [_, formattedItem] = match;
            resultItem = formattedItem;
        }

    } else if (msgType === "coop") {
        const coopRegex = /(&[a-qs-z0-9])(.+)&r&f &r&ecollected an expired auction!&r/;
        const match = msg.match(coopRegex);
        if (match) {
            const [_, collectorColor, collectorName] = match;
            const formattedCollector = `${collectorColor}${stripRank(collectorName.removeFormatting())}`;
            resultCollector = formattedCollector;
        }
    }

    return {
        type: msgType,
        item: resultItem,
        collector: resultCollector
    }
};

function attemptExpiredMatch(msg1, msg2) {
    const msg1Info = getExpiredInfo(msg1);
    const msg2Info = getExpiredInfo(msg2);
    if (msg1Info.type === msg2Info.type) return null;
    return {
        item: msg1Info.item ?? msg2Info.item,
        collector: msg1Info.collector ?? msg2Info.collector
    };
}

let storedExpiredMessages = [];
register('chat', (item, event) => {
    if (!getInSkyblock()) return;``
    const message = ChatLib.getChatMessage(event, true);
    for (let idx = 0; idx < storedExpiredMessages.length; idx++) {
        let expiredMessage = storedExpiredMessages[idx];
        const attemptMatchObject = attemptExpiredMatch(message, expiredMessage);
        if (attemptMatchObject) {
            storedExpiredMessages.pop(idx);
            const shownCollector = attemptMatchObject.collector.removeFormatting().trim() === Player.getName() ? ` &7by ${attemptMatchObject.collector}&7!` : '&7!';            
            replaceAuctionMessage(event, `${AH_PREFIX}CLAIMED &cEXPIRED: &r${attemptMatchObject.item}${shownCollector}`);
            return;
            // [AH] CLAIMED EXPIRED: Empty Thunder Bottle by Dompay (coop)
            // [AH] CLAIMED EXPIRED: Empty Thunder Bottle (self)
        }
    }
    storedExpiredMessages.push(message);
    cancel(event);
}).setCriteria('You claimed ${item} back from your expired auction!');

register('chat', (collector, event) => {
    if (!getInSkyblock()) return;
    if (channels.some(channel => collector.startsWith(channel)) ||
    regexNormalChannels.some(regex => regex.test(collector))) return;       
    const message = ChatLib.getChatMessage(event, true);
    const collectorName = stripRank(collector).trim();
    if (collectorName !== Player.getName()) {
        const matchObject = getExpiredInfo(message);
        replaceAuctionMessage(event, `${AH_PREFIX}&r${matchObject.collector} &7claimed an &cexpired&7 item!`);
    }
    
    for (let idx = 0; idx < storedExpiredMessages.length; idx++) {
        let expiredMessage = storedExpiredMessages[idx];
        const attemptMatchObject = attemptExpiredMatch(message, expiredMessage);
        if (attemptMatchObject) {   
            storedExpiredMessages.pop(idx);
            const shownCollector = attemptMatchObject.collector.removeFormatting().trim() === Player.getName() ? ` &7by ${attemptMatchObject.collector}&7!` : '&7!';  
            replaceAuctionMessage(event, `${AH_PREFIX}CLAIMED &cEXPIRED: &r${attemptMatchObject.item}${shownCollector}`);
            return;
            // [AH] CLAIMED EXPIRED: Empty Thunder Bottle by Dompay (coop)
            // [AH] CLAIMED EXPIRED: Empty Thunder Bottle (self)
        }
    }
    storedExpiredMessages.push(message);
    cancel(event);
}).setCriteria('${collector} collected an expired auction!');

