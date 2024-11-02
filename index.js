import { getInSkyblock, getInHub, replaceAuctionMessage, truncateNumbers, createClickable, stripRank, getAuctionLinkFromEvent } from './functions.js';
import { getAuctionResponse } from './formatFunctions.js';
import Audio from './audio.js'; 
import PogObject from '../PogData';
import './queueMessages.js'
    
const ahAudio = new Audio();
const AH_PREFIX = '&6[AH] ';  
const moduleVersion = JSON.parse(FileLib.read("BetterAH", "metadata.json")).version;  
const supportLink = 'https://discord.gg/gGd6RD5Z';
const supportClickable = new TextComponent('&c&l[REPORT ERRORS HERE]')
    .setClick('open_url', supportLink)
    .setHover('show_text', supportLink);

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
    const soundStatus = ahData.sounds ? '&aON' : '&cOFF';
    const ahLoadMessage = `&6[BetterAH] &7Loaded! &3[&rSounds: ${soundStatus}&3]`;
    const ahSupportMessage = new Message(
        `${ahLoadMessage} &r&8-- `, supportClickable
    )

    ChatLib.chat(ahSupportMessage);
    if (ahData.firstInstall) {
        ahData.firstInstall = false;
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
    /There was an error with the auction house! \(AUCTION_EXPIRED_OR_NOT_FOUND\)/,
    /Failed to claim bid! \(NOT_FOUND_OR_ALREADY_CLAIMED\)/,
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
    "This auction wasn't found!",
];

auctionHouseErrors.forEach(error => {
    register('chat', (event) => {
        if (!getInSkyblock()) return;
        replaceAuctionMessage(event, `${AH_PREFIX}&c${error}`);                 
    }).setCriteria(error);
});
        

//!! item is bought by someone
register('chat', (playerInfo, item, cost, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
        const messageParts = new Message(EventLib.getMessage(event)).getMessageParts();
        const auctionLink = messageParts[0].clickValue;
    const auctionBoughtMessage = getAuctionResponse(AH_PREFIX, message, 'auctionBoughtBy');
    const auctionClickable = createClickable(auctionBoughtMessage, auctionLink);
    replaceAuctionMessage(event, auctionClickable, bypass=true);
    if (ahData.sounds) ahAudio.playDingSound();    
}).setCriteria('[Auction] ${playerInfo} bought ${item} for ${cost} coins CLICK');   



//! created a normal auction --  
register('chat', (player, item, event) => {                     
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    const ahMessage = getAuctionResponse(AH_PREFIX, message, 'auctionCreated');
    replaceAuctionMessage(event, ahMessage); 
}).setCriteria('${player} created an auction for ${item}!');

//! created a bin auction -- good for coop  
register('chat', (playerInfo, item, cost, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    const binMessage = getAuctionResponse(AH_PREFIX, message, 'binCreated');
    replaceAuctionMessage(event, binMessage); 
}).setCriteria('${playerInfo} created a BIN auction for ${item} at ${cost} coins!');

//! Cancelling Auctions
//* you canceled auction (bin/normal) -- hide
//* player cancelled auction (bin/normal)   
register('chat', (player, item, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    const cancelledMessage = getAuctionResponse(AH_PREFIX, message, 'cancelledAuction')
    replaceAuctionMessage(event, cancelledMessage);
}).setCriteria('${player} cancelled an auction for ${item}!');

//! buying an auction
const hubObject = {
    item: '',
    cost: '',
    seller: '',
};
register('chat', (item, cost, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    const boughtMessage = getAuctionResponse(AH_PREFIX, message, 'auctionBought');
    if (getInHub()) {   
        hubObject.item = boughtMessage.item;
        hubObject.cost = boughtMessage.cost;
        cancel(event);

    } else {
        replaceAuctionMessage(event, `${AH_PREFIX}BOUGHT: ${boughtMessage.item} &7for &6${boughtMessage.cost}&7!`);
    }
}).setCriteria('You purchased ${item} for ${cost} coins!');

//! claiming a bought item          
register('chat', (item, seller, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    const claimedObject = getAuctionResponse(AH_PREFIX, message, 'claimBought');
    if (getInHub() && hubObject.item === claimedObject.item) {
        hubObject.seller = claimedObject.seller;
        replaceAuctionMessage(event, `${AH_PREFIX}CLAIMED: ${hubObject.item} &7for &6${hubObject.cost} &7from ${hubObject.seller}&7!`);

    } else {
        replaceAuctionMessage(event, `${AH_PREFIX}CLAIMED: ${claimedObject.item} &7from ${claimedObject.seller}&7!`);
    }
}).setCriteria("You claimed ${item} from ${seller}'s auction!");

//! Bid message on your item
register('chat', (player, cost, item, event) => {
    if (!getInSkyblock()) return;
    const auctionLink = getAuctionLinkFromEvent(event);
    const message = ChatLib.getChatMessage(event, true);
    const auctionBidMessage = getAuctionResponse(AH_PREFIX, message, 'auctionBid');
    const auctionClickable = new TextComponent('&6&l[CLICK]').setClick('run_command', auctionLink);
    const finalMessage = new Message( auctionBidMessage, auctionClickable);
    replaceAuctionMessage(event, finalMessage);     
}).setCriteria('[Auction] ${player} bid ${cost} coins on ${item} CLICK');

//! Bid message by you
register('chat', (bidAmount, bidItem, event) => {
    if (!getInSkyblock()) return;
    const message = ChatLib.getChatMessage(event, true);
    const auctionBidMessage = getAuctionResponse(AH_PREFIX, message, 'playerPlacedBid')               
    replaceAuctionMessage(event, auctionBidMessage);
}).setCriteria('Bid of ${bidAmount} coins placed for ${bidItem}!');

//! outbid message  
register('chat', (player, diffCoins, item, event) => {
    if (!getInSkyblock()) return;   
    const auctionLink = getAuctionLinkFromEvent(event);        
    const message = ChatLib.getChatMessage(event, true);
    const outbidMessage = getAuctionResponse(AH_PREFIX, message, 'auctionOutBid');
    const outbidClickable = new TextComponent("&6&l[CLICK]").setClick('run_command', auctionLink);
    const auctionOutbidMessage = new Message( outbidMessage,  outbidClickable );
    replaceAuctionMessage(event, auctionOutbidMessage);
}).setCriteria('[Auction] ${player} outbid you by ${diffCoins} coins for ${item} CLICK');      

//! refund from not getting top bid
register('chat', (coins, event) => {
    if (!getInSkyblock()) return;
    replaceAuctionMessage(event, `${AH_PREFIX}&cREFUND: &a+&6${truncateNumbers(coins)} &7from failed auction bid!`);     
}).setCriteria("You collected ${coins} coins back from an auction which you didn't hold the top bid!");

//! refund from escrow for shens
register('chat', (coins, event) => {
    if (!getInSkyblock()) return;
    replaceAuctionMessage(event, `${AH_PREFIX}&cREFUND: &7Collected &6${truncateNumbers(coins)} &7from failed shen's bid!`);  
}).setCriteria('Escrow refunded ${coins} coins for Special Auction Claim!');

//! This BIN sale is still in its grace period!
register('chat', (event) => {
    if (!getInSkyblock()) return;
    replaceAuctionMessage(event, `${AH_PREFIX}GRACE PERIOD: &cBIN will be active soon!`);       
}).setCriteria('This BIN sale is still in its grace period!');  

//! escrow
register('chat', (coins, event) => {
    if (!getInSkyblock()) return;
        replaceAuctionMessage(event, `${AH_PREFIX}&cREFUND: &r&6${truncateNumbers(coins)} &7from &eEscrow!`);
}).setCriteria('Escrow refunded ${coins} coins for BIN Auction Buy!');