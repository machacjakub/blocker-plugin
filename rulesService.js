// Function to determine if the current time falls within a specified blocking time range.
/**
 * @param {{timeFrom: string, timeTo: string}} site - An object containing the start and end times (hours) for blocking.
 * @returns {boolean} - Returns true if the current time is within the blocking time range, false otherwise.
 */
export const shouldBeBlockedByTime = ({timeFrom, timeTo}) => {
    console.log('ShouldBeBlockedByTime initialized');
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const minutesNow = hour*60 + minutes;
    const arrayFrom = timeFrom.split(':');
    const arrayTo = timeTo.split(':');
    const minutesFrom = Number(arrayFrom[0])*60 + Number(arrayFrom[1]);
    const minutesTo = Number(arrayTo[0])*60 + Number(arrayTo[1]);
    console.log('SHOULD BE BLOCKED??? ', minutesFrom, minutesNow, minutesTo);
    if(minutesFrom > minutesTo) {
        return minutesNow >= minutesFrom || minutesNow <= minutesTo;
    }

    return minutesNow >= minutesFrom && minutesNow <= minutesTo;
}

// Function to generate the blocking rules
/**
 * @param {{id: number, url: string}[]} sites - An array of website URLs to be blocked.
 * @returns {{id: *, priority: number, action: {type: string, redirect: {url: *}}, condition: {urlFilter: *, resourceTypes: [string]}}[]} An array of declarativeNetRequest rule objects.
 */
export const generateBlockingRules = (sites) => {
    return sites.map((site) => ({
        id: site.id,
        priority: 1,
        action: {
            type: 'redirect',
            redirect: {
                url: chrome.runtime.getURL('blocked.html')
            }
        },
        condition: {
            urlFilter: site.url,
            resourceTypes: ['main_frame'],
        }
    }));
}

// Function to retrieve blocked sites from storage.
/**
 * @returns {Promise<{ blockedSites?: {id: number, url: string, timeFrom: string, timeTo: string}[] }>} - A promise resolving to an object containing an array of blocked site URLs.
 */
export const getBlockedSites = async () => await chrome.storage.sync.get(['blockedSites']);

// Function to remove declarativeNetRequest rules based on IDs derived from blocked sites (though the ID extraction might be incorrect).
/**
 * @returns {Promise<void>} - A promise that resolves when the specified rules have been removed.
 */
export const removeCurrentRules =  async () => {
    const { blockedSites = [] } = await getBlockedSites();
    const existingRuleIds = blockedSites.map(site => site.id);
    console.log('Removing old ids: ', existingRuleIds)
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
    });
}

// Function to add new declarativeNetRequest rules.
/**
 * @param {{id: *, priority: number, action: {type: string, redirect: {url: *}}, condition: {urlFilter: *, resourceTypes: string[]}}[]} newRules - An array of new declarativeNetRequest rule objects to be added.
 * @returns {Promise<void>} - A promise that resolves when the new rules have been added.
 */
export const setNewRules = async (newRules)=> {
    if (newRules.length > 0) {
        console.log('Adding new rules ', newRules);
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: newRules
        });
    }
}
