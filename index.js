import { getInSkyblock, replaceAuctionMessage, truncateNumbers, createClickable, stripRank, getAuctionLinkFromEvent } from './functions.js';
import { getAuctionResponse } from './formatFunctions.js';
import Audio from './audio.js'; 
import PogObject from '../PogData';

const ahAudio = new Audio();
const AH_PREFIX = '&6[AH] ';  
let moduleVersion = JSON.parse(FileLib.read("BetterAH", "metadata.json")).version;  
const ahDebug = false; 

const ahData = new PogObject("BetterAH", {
    'sounds': false,
    'firstInstall': false,
})
ahData.autosave(5);

register('command', (event) => {
    if (!ahData.sounds) {
        ahData.sounds = true;
        ChatLib.chat(`&6[BetterAH] &rSounds: &aON`);
    } else if (ahData.sounds) {
        ahData.sounds = false;
        ChatLib.chat(`&6[BetterAH] &rSounds: &cOFF`);
    }
}).setName('ahsounds');         

register('gameLoad', () => {    
    let soundStatus = ahData.sounds ? '&aON' : '&cOFF';
    ChatLib.chat(`&6[BetterAH] &7Loaded! &3[&rSounds: ${soundStatus}&3]`);
    if (ahData.firstInstall) {
        if (moduleVersion === '1.0.3') {
            ChatLib.chat(`&e&lNEW Features: (v1.0.3)`);
            ChatLib.chat(`o &rDo &b/ahsounds &rto turn ding sounds on/off`)
            ChatLib.chat(`&7Note: These sounds are only available for when someone buys your auction!`)
        }
    }               
});


register('chat', (event) => {
    if (!getInSkyblock()) return;
    
    const message = ChatLib.getChatMessage(event, true);
    if (message == '&b-----------------------------------------------------&r') {
        cancel(event);
    };
}).setCriteria('---------').setContains();

//! auction house process messages
const auctionHouseMessages = [
    /Setting up the auction\.\.\./,
    /Putting item in escrow\.\.\./,
    /Putting coins in escrow\.\.\./,
    /Processing bid\.\.\./,
    /Auction started for .+/,
    /BIN Auction started for .+!/,
    /Processing purchase\.\.\./,
    /Visit the Auction House to collect your item!/,
    /You cannot bid on your own auctions!/,
    /Claiming BIN auction\.\.\./,
    /Placing your bid\.\.\./,
    /You canceled your auction for .+!/,
    /Checking escrow for recent transaction\.\.\./,
];

auctionHouseMessages.forEach(msg => {
    register('chat', (event) => {   
        if (!getInSkyblock()) return;
        cancel(event);
    }).setCriteria(msg).setContains();
});

//! auction house error messages
const auctionHouseErrors = [
    "Couldn't read this number!",
    "Minimum duration is 5 minutes!",
    "You already have the highest bid on this auction!",
];

auctionHouseErrors.forEach(error => {
    register('chat', (event) => {
        if (!getInSkyblock()) return;
        if (ahDebug) ChatLib.chat('ah error response');
        replaceAuctionMessage(event, `${AH_PREFIX}&c${error}`);                 
    }).setCriteria(error);
});
        

//!! item is bought by someone
register('chat', (playerInfo, item, cost, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('item bought by player response');
    const message = ChatLib.getChatMessage(event, true);
    let messageParts = new Message(EventLib.getMessage(event)).getMessageParts();
    let auctionLink = messageParts[0].clickValue;
    let auctionBoughtMessage = getAuctionResponse(AH_PREFIX, message, 'auctionBoughtBy');
    let auctionClickable = createClickable(auctionBoughtMessage, auctionLink);
    replaceAuctionMessage(event, auctionClickable, bypass=true);
    if (ahData.sounds) ahAudio.playDingSound();    
}).setCriteria('[Auction] ${playerInfo} bought ${item} for ${cost} coins CLICK');

//! created a normal auction --  
register('chat', (player, item, event) => {                     
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('normal auction creation response');
    const message = ChatLib.getChatMessage(event, true);
    let ahMessage = getAuctionResponse(AH_PREFIX, message, 'auctionCreated');
    replaceAuctionMessage(event, ahMessage); 
}).setCriteria('${player} created an auction for ${item}!');

//! created a bin auction -- good for coop  
register('chat', (playerInfo, item, cost, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('bin auction creation response');
    const message = ChatLib.getChatMessage(event, true);
    let binMessage = getAuctionResponse(AH_PREFIX, message, 'binCreated');
    replaceAuctionMessage(event, binMessage); 
}).setCriteria('${playerInfo} created a BIN auction for ${item} at ${cost} coins!');

//! Cancelling Auctions
//* you canceled auction (bin/normal) -- hide
//* player cancelled auction (bin/normal)   
register('chat', (player, item, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('player cancelled auction response');
    const message = ChatLib.getChatMessage(event, true);
    let cancelledMessage = getAuctionResponse(AH_PREFIX, message, 'cancelledAuction')
    replaceAuctionMessage(event, cancelledMessage);
}).setCriteria('${player} cancelled an auction for ${item}!');

//! buying an auction
register('chat', (item, cost, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('player purchasing item response');
    const message = ChatLib.getChatMessage(event, true);
    let boughtMessage = getAuctionResponse(AH_PREFIX, message, 'auctionBought');
    replaceAuctionMessage(event, boughtMessage);
}).setCriteria('You purchased ${item} for ${cost} coins!');

//! claiming an expired auction
//* you claimed expired
let expiredItem = '';
register('chat', (item, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('you claimed expired auction response');
    const message = ChatLib.getChatMessage(event, true);
    expiredItem = getAuctionResponse(AH_PREFIX, message, 'youExpiredAuction');
    cancel(event);
}).setCriteria('You claimed ${item} back from your expired auction!');

//* player claimed expired
register('chat', (player, event) => {
    if (!getInSkyblock()) return;
    if (expiredItem === '') return;
    if (ahDebug) ChatLib.chat('player claimed expired auction response');
    const message = ChatLib.getChatMessage(event, true);
    let [collectorColor, collectorName] = getAuctionResponse(AH_PREFIX, message, 'playerExpiredAuction');   
    let expiredMessage = `${AH_PREFIX}&cEXPIRED: ${expiredItem} &7by ${collectorColor}${collectorName}&7!`;
    replaceAuctionMessage(event, expiredMessage);
}).setCriteria('${player} collected an expired auction!');

//! claiming a bought item          
register('chat', (item, seller, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('you claimed item reponse');
    const message = ChatLib.getChatMessage(event, true);
    let claimedMessage = getAuctionResponse(AH_PREFIX, message, 'claimBought');
    replaceAuctionMessage(event, claimedMessage);
}).setCriteria("You claimed ${item} from ${seller}'s auction!");

//! claimed auction 2 ways (cuz hypixel dumb)
const claimObject = {
    'youFirst': false,
    'collector': '',
    'itemName': '',
    'cost': '',
    'recipient': '',
};
register('chat', (cost, item, recipient, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    if (ahDebug) ChatLib.chat('you collection coins from selling response');
    const regex = /&r&eYou collected &r&6(.+) coins &r&efrom selling &r&f&r(.+) &r&eto &r(&[a-qs-z0-9])(.+) &r&ein an auction!&r/;
    let match = message.match(regex);
    if (match) {
        let [_, itemCost, formattedItemName, receiverColor, receiverName] = match;
        claimObject.recipient = `${receiverColor}${stripRank(receiverName.removeFormatting())}`;
        claimObject.itemName = formattedItemName;

        //* youfirst is true
        if (!claimObject.youFirst && claimObject.collector === '') {
            claimObject.youFirst = true;
            claimObject.cost = `&6${truncateNumbers(itemCost)}`;    
            cancel(event);

        //* youfirst is false
        } else if (!claimObject.youFirst && claimObject.collector !== '') { 
            cancel(event);          
            ChatLib.chat(`${AH_PREFIX}&6SOLD: ${claimObject.itemName} &7collected by ${claimObject.collector} &7for ${claimObject.cost}!`);
            claimObject.youFirst = false;
            claimObject.recipient = '';
            claimObject.collector = '';
            claimObject.itemName = '';
            claimObject.cost = '';
        }
    }
}).setCriteria('You collected ${cost} coins from selling ${item} to ${recipient} in an auction!');

register('chat', (collector, coins, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('player collected coins from selling response');
    const message = ChatLib.getChatMessage(event, true);
    const regex = /(&[a-qs-z0-9])(.+?) &r&ecollected an auction for &r&6(.+) coins&r&e\!&r/;
    let match = message.match(regex);
    if (match) {    
        let [_, collectorColor, collectorName, formattedCost] = match;
        claimObject.collector = `${collectorColor}${stripRank(collectorName.removeFormatting())}`;
        
        if (claimObject.youFirst && claimObject.recipient !== '') {
            cancel(event);
            ChatLib.chat(`${AH_PREFIX}&6SOLD: ${claimObject.itemName} &7collected by ${claimObject.collector} &7for ${claimObject.cost}!`);   
            claimObject.youFirst = false;
            claimObject.recipient = '';
            claimObject.collector = '';
            claimObject.itemName = '';
            claimObject.cost = '';

        } else if (!claimObject.youFirst && claimObject.recipient === '') {
            claimObject.cost = `&6${truncateNumbers(formattedCost)}`;
            cancel(event);
        }
    }
}).setCriteria('${collector} collected an auction for ${coins}');

//! Bid message on your item
register('chat', (player, cost, item, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('player bid on your item response');
    let auctionLink = getAuctionLinkFromEvent(event);
    const message = ChatLib.getChatMessage(event, true);
    let auctionBidMessage = getAuctionResponse(AH_PREFIX, message, 'auctionBid');
    let auctionClickable = new TextComponent('&6&l[CLICK]').setClick('run_command', auctionLink);
    let finalMessage = new Message( auctionBidMessage, auctionClickable);
    replaceAuctionMessage(event, finalMessage);     
}).setCriteria('[Auction] ${player} bid ${cost} coins on ${item} CLICK');

//! Bid message by you
register('chat', (bidAmount, bidItem, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('you bid on item response');
    const message = ChatLib.getChatMessage(event, true);
    let auctionBidMessage = getAuctionResponse(AH_PREFIX, message, 'playerPlacedBid')               
    replaceAuctionMessage(event, auctionBidMessage);
}).setCriteria('Bid of ${bidAmount} coins placed for ${bidItem}!');

//! outbid message  
register('chat', (player, diffCoins, item, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('player outbid you for item response');
    let auctionLink = getAuctionLinkFromEvent(event);        
    const message = ChatLib.getChatMessage(event, true);
    let outbidMessage = getAuctionResponse(AH_PREFIX, message, 'auctionOutBid');
    let outbidClickable = new TextComponent("&6&l[CLICK]").setClick('run_command', auctionLink);
    let auctionOutbidMessage = new Message( outbidMessage,  outbidClickable );
    replaceAuctionMessage(event, auctionOutbidMessage);
}).setCriteria('[Auction] ${player} outbid you by ${diffCoins} coins for ${item} CLICK');      

//! refund from not getting top bid
register('chat', (coins, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('refund from normal auction');
    replaceAuctionMessage(event, `${AH_PREFIX}&cREFUND: &a+&6${truncateNumbers(coins)} &7from failed auction bid!`);     
}).setCriteria("You collected ${coins} coins back from an auction which you didn't hold the top bid!");

//! refund from escrow for shens
register('chat', (coins, event) => {
    if (!getInSkyblock()) return;
    if (ahDebug) ChatLib.chat('refund from special auction');
    replaceAuctionMessage(event, `${AH_PREFIX}&cREFUND: &7Collected &6${truncateNumbers(coins)} &7from failed shen's bid!`);  
}).setCriteria('Escrow refunded ${coins} coins for Special Auction Claim!');