export function showAlert(someTitle) {
    Client.showTitle(someTitle, '', 1, 30, 1);
}

export function stripRank(name) {
    const rankNameRegex = /\[(?:MVP\+\+|MVP\+|MVP|VIP\+|VIP)\] (\S+)/;
    let nameMatch = name.match(rankNameRegex);
    return nameMatch ? nameMatch[1] : name.trim();
}

export function abbreviateWords(name) {
    let newName = name;
    if (name.includes('Enchanted')) newName = name.replace(/Enchanted/g, 'Ench.');
    return newName.removeFormatting();
}

export function truncateNumbers(amt) { 
    const cost = Number(amt.toString().replace(/,/g, ''));
    const formatNumber = (num) => {
        const fixedNum = num.toFixed(2);
        return fixedNum.endsWith('.00') ? num.toFixed(0) : fixedNum;
    };

    switch (true) {
        case cost >= 1_000_000_000_000:
            return formatNumber(cost / 1_000_000_000_000) + 'T';
        case cost >= 1_000_000_000:
            return formatNumber(cost / 1_000_000_000) + 'B';
        case cost >= 1_000_000:
            return formatNumber(cost / 1_000_000) + 'M';
        case cost >= 1_000:
            return formatNumber(cost / 1_000) + 'K';
        case cost !== 1 && cost < 1_000:
            return cost.toString() + ' coins';
        default:
            return cost.toString() + ' coin';
    }
};


export function stripRomanNumerals(name) {
    return name
        .replace(/I/g, '')
        .replace(/V/g, '');
}

export function getInSkyblock() {
    if (!World.isLoaded()) return false;
    return ChatLib.removeFormatting(Scoreboard.getTitle()).includes("SKYBLOCK");
}

export function getCurrArea() {
    if (!getInSkyblock()) return;
    let rawArea = '';
    TabList.getNames().forEach(line => {
        let fLine = line.removeFormatting();
        let areaMatch = fLine.match(/Area: (.+)/);
        if (areaMatch) rawArea = areaMatch[1];
    });
    return rawArea;
}

export function replaceAuctionMessage(event, message, bypass=false) {
    cancel(event);

    if (Array.isArray(message)) {
        message.forEach(msg => {
            if (!bypass) ChatLib.chat(msg);
            if (bypass) msg.chat();
        });
    } else {
        if (!bypass) ChatLib.chat(message);
        if (bypass) message.chat();
    };
};

export function createClickable(fullMessage, linkMessage) {
    const titleMessage = `${fullMessage.trim()}&r&7! `;
    const linkObject = new TextComponent("&6&l[CLICK]").setClick("run_command", linkMessage);
    return new Message (
        titleMessage,
        linkObject 
    )
}   

function comment(str) { return ChatLib.simulateChat(`&8${str}`); }
function simulate(str) { return ChatLib.simulateChat(str); }

export function getAuctionLinkFromEvent(event) {
    let messageParts = new Message(EventLib.getMessage(event)).getMessageParts();
    let auctionLink = messageParts[0].clickValue;
    return auctionLink;
}