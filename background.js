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
    console.log('THIS SHOULD LOG');
    try {
        console.log('UpdateRules initialized');
        const { blockedSites } = await getBlockedSites();
        await removeCurrentRules();

        const sitesToBlock = blockedSites.filter(shouldBeBlockedByTime);
        const newRules = generateBlockingRules(sitesToBlock);
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