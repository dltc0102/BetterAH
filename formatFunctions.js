import { abbreviateWords, stripRank, truncateNumbers } from './functions';

function generateMessage(prefix, message, regex, formatHandler) {
    const match = message.match(regex);
    if (match) {
        return formatHandler(prefix, match);    
    } else {    
        console.log('not matched -- ah');    
        console.log(`matched: false`);
        console.log(`formatHandler: ${formatHandler}`);
        console.log(`message: ${message}`);
        console.log(`regex: ${regex}`);
        console.log(' ');
        return;
    }
}

export function getAuctionResponse(prefix, message, type) {
    const patterns = {
        // template: {
        //     regex: /./,
        //     format: formatFunc,
        // },
        auctionBoughtBy: {
            regex: /&6\[Auction\] (.+) &ebought (.+) &efor &6(.+) coins &lCLICK&r/,
            format: formatAuctionBoughtBy
        },
        auctionCreated: {
            regex: /(.+) &r&ecreated an auction for (.+)&r&e!&r/,
            format: formatAuctionCreated
        },
        binCreated: {
            regex: /(&[a-qs-z0-9])(.+) &r&ecreated a BIN auction for (.+) &r&eat &r&6(.+) coins!&r/,
            format: formatBINCreated
        },
        cancelledAuction: {
            regex: /(&[a-qs-z0-9])(.+)&r&f &r&ecancelled an auction for &r(.+)&r&e!&r/,
            format: formatCancelledAuction
        },
        auctionBought: {
            regex: /&r&eYou purchased &r&f&r&f&r(.+) &r&efor &r&6(.+) coins&r&e\!&r/,
            format: formatBoughtAuction
        },
        claimBought: {
            regex: /&r&eYou claimed &r&f&r(.+) &r&efrom &r(&[a-qs-z0-9])(.+)&r&e's auction\!&r/,
            format: formatClaimedBought
        },
        youExpiredAuction: {
            regex: /&r&eYou claimed &r&f&r(.+) &r&eback from your expired auction!&r/,
            format: getExpiredAuctionItem
        },
        playerExpiredAuction: {
            regex: /(&[a-qs-z0-9])(.+)&r&f &r&ecollected an expired auction!&r/,
            format: getExpiredCollector
        },
        auctionBid: {
            regex: /&6\[Auction\] (&[a-qs-z0-9])(.+) &ebid &6(.+) coins &eon (.+) &e&lCLICK&r/,
            format: formatAuctionBidMessage
        },
        playerPlacedBid: {
            regex: /&r&eBid of &r&6(.+) coins &r&eplaced for &r&f&r&f&r(.+)&r&e!&r/,
            format: formatPlayerPlacedBid
        },
        auctionOutBid: {                        
            regex: /&6\[Auction\] (.+) &eoutbid you by &6(.+) coins &efor (.+) &e&lCLICK&r/,
            format: formatOutBid
        },
    };

    const { regex, format } = patterns[type];
    return generateMessage(prefix, message, regex, format);
}   

function formatAuctionBoughtBy(prefix, match) {
    let [_, formattedPlayerName, formattedItemName, itemCost] = match;  
    return `${prefix}${formattedPlayerName} &7bought ${formattedItemName} &7for &6${truncateNumbers(itemCost)}`;   
}

function formatAuctionCreated(prefix, match) {
    let [_, formattedName, formattedItem] = match;
    return `${prefix}&eAUCTION: ${formattedName} &7listed ${formattedItem}&7!`;
}

function formatBINCreated(prefix, match) {
    let [_, nameColor, name, formattedItem, itemCost] = match;
    return `${prefix}&eBIN: ${nameColor}${stripRank(name.removeFormatting())} &7listed ${formattedItem} &r&7for &6${truncateNumbers(itemCost)}&7!`;        
}

function formatBoughtAuction(prefix, match) {
    let [_, formattedItemName, itemCost] = match;
    return {
        item: formattedItemName,
        cost: truncateNumbers(itemCost)
    };
}

function formatClaimedBought(prefix, match) {
    let [_, formattedItemName, sellerColor, sellerName] = match;
    return {
        item: formattedItemName,
        seller: `${sellerColor}${stripRank(sellerName.removeFormatting())}`
    };
}           

function getExpiredAuctionItem(prefix, match) {
    let [_, formattedItem] = match;
    return formattedItem;
}

function getExpiredCollector(prefix, match) {
    let [_, collectorColor, collectorName] = match;
    let name = stripRank(collectorName.removeFormatting()).trim();
    return `${collectorColor}${name}`;
}

function formatCancelledAuction(prefix, match) {
    let [_, collectorColor,  collectorName, formattedItemName] = match;
    return `${prefix}&cCANCELLED: ${formattedItemName} &7by ${collectorColor}${stripRank(collectorName.removeFormatting())}`;
}

function formatAuctionBidMessage(prefix, match) {
    let [_, bidderColor, bidderName, bidAmount, bidItem] = match;
    return `${prefix}BID: ${bidderColor}${bidderName} &7bid &6${truncateNumbers(bidAmount)} &7on ${bidItem}&7! `;
}

function formatPlayerPlacedBid(prefix, match) {
    let [_, bidAmount, bidItem] = match;
    return `${prefix}BID: &7You bid &6${truncateNumbers(bidAmount)} &7on ${bidItem}&7!`;
}

function formatOutBid(prefix, match) {
    let [_, formattedName, bidAmount, bidItem] = match;
    return `${prefix}OUTBID: &6${truncateNumbers(bidAmount)} &7by ${formattedName} &7on ${bidItem}&7! `;
}
