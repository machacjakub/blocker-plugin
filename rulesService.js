/**
 * Determines if the current time falls within a specified blocking time range.
 * @param {{ timeFrom: string, timeTo: string }} site - An object containing the start and end times (HH:mm) for blocking.
 * @returns {boolean} Returns true if the current time is within the blocking time range, false otherwise.
 */
export function shouldBeBlockedByTime({ timeFrom, timeTo }) {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const [fromHour, fromMinute] = timeFrom.split(":").map(Number);
    const [toHour, toMinute] = timeTo.split(":").map(Number);
    const minutesFrom = fromHour * 60 + fromMinute;
    const minutesTo = toHour * 60 + toMinute;
    // Handles overnight ranges (e.g., 22:00-06:00)
    if (minutesFrom > minutesTo) {
        return minutesNow >= minutesFrom || minutesNow <= minutesTo;
    }
    return minutesNow >= minutesFrom && minutesNow <= minutesTo;
}

/**
 * Generates Chrome declarativeNetRequest rules for the given sites.
 * @param {{ id: number, url: string, paused?: boolean, pauseUntil?: number }[]} sites - Array of sites to block.
 * @returns {Array<{ id: number, priority: number, action: { type: string, redirect: { url: string } }, condition: { urlFilter: string, resourceTypes: string[] } }>} Array of rule objects.
 */
export function generateBlockingRules(sites) {
    const now = Date.now();
    return sites
        .filter(site => {
            // Skip if paused and pause hasn't expired
            if (site.pauseUntil && site.pauseUntil > now) {
                return false;
            }
            return true;
        })
        .map(site => ({
            id: site.id,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    url: chrome.runtime.getURL('blocked.html'),
                },
            },
            condition: {
                urlFilter: site.url,
                resourceTypes: ['main_frame'],
            },
        }));
}

/**
 * Retrieves blocked sites from Chrome storage.
 * @returns {Promise<{ blockedSites?: { id: number, url: string, timeFrom: string, timeTo: string }[] }>} Promise resolving to an object containing blockedSites array.
 */
export async function getBlockedSites() {
    return await chrome.storage.sync.get(['blockedSites']);
}

/**
 * Removes current declarativeNetRequest rules based on blocked site IDs.
 * @returns {Promise<void>} Promise that resolves when rules are removed.
 */
export async function removeCurrentRules() {
    const { blockedSites = [] } = await getBlockedSites();
    const existingRuleIds = blockedSites.map(site => site.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
    });
}

/**
 * Adds new declarativeNetRequest rules.
 * @param {Array<{ id: number, priority: number, action: { type: string, redirect: { url: string } }, condition: { urlFilter: string, resourceTypes: string[] } }>} newRules - Array of new rule objects to add.
 * @returns {Promise<void>} Promise that resolves when new rules are added.
 */
export async function setNewRules(newRules) {
    if (newRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: newRules,
        });
    }
}
