import {
    generateBlockingRules,
    getBlockedSites,
    removeCurrentRules,
    setNewRules,
    shouldBeBlockedByTime
} from "./rulesService.js";

// Function to update the dynamic declarativeNetRequest rules based on the stored blocked sites.
/**
 * @returns {Promise<void>} - A promise that resolves when the rules have been updated.
 */
const updateRules = async () => {
    try {
        const { blockedSites } = await getBlockedSites();
        console.log('All blocked sites:', blockedSites);
        await removeCurrentRules();

        // Clear expired pauses
        const now = Date.now();
        let hasExpiredPauses = false;
        const updatedSites = blockedSites.map(site => {
            if (site.pauseUntil && site.pauseUntil <= now) {
                hasExpiredPauses = true;
                const { pauseUntil, pauseReason, paused, ...rest } = site;
                return rest;
            }
            return site;
        });

        // Save updated sites if any pauses expired
        if (hasExpiredPauses) {
            await chrome.storage.sync.set({ blockedSites: updatedSites });
        }

            // Exclude paused sites first, then filter by time
            const nowTs = Date.now();
            const unpausedSites = (hasExpiredPauses ? updatedSites : blockedSites).filter(site => !(site.pauseUntil && site.pauseUntil > nowTs));
            const sitesToBlock = unpausedSites.filter(shouldBeBlockedByTime);
        console.log('Sites to block (after time filter):', sitesToBlock);
        const newRules = generateBlockingRules(sitesToBlock);
        console.log('New rules generated:', newRules);
        await setNewRules(newRules);
        console.log('Rules successfully updated');
    } catch (error) {
        console.error('Error updating rules:', error);
    }
}

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
});

// Initial check when the extension starts
updateRules();

// Initialize rules when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    updateRules();
});

// Listen for messages from the options page
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'UPDATE_RULES') {
        updateRules();
    }
    return true;
});

// Set up a recurring alarm to check the schedule
chrome.alarms.create('checkBlockingSchedule', {
    periodInMinutes: 0.1
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkBlockingSchedule') {
        updateRules();
    }
});