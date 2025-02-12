// Initialize rule counter
let ruleIdCounter = 1;

// Function to update blocking rules
async function updateRules() {
    try {
        // Get the current blocked sites
        const { blockedSites = [] } = await chrome.storage.sync.get(['blockedSites']);

        // Remove existing rules
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        const existingRuleIds = existingRules.map(rule => rule.id);

        if (existingRuleIds.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: existingRuleIds
            });
        }

        // Create new rules for each blocked site
        const newRules = blockedSites.map((site) => ({
            id: ruleIdCounter++,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    url: chrome.runtime.getURL('blocked.html')
                }
            },
            condition: {
                urlFilter: site,
                resourceTypes: ['main_frame']
            }
        }));

        if (newRules.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: newRules
            });
        }
    } catch (error) {
        console.error('Error updating rules:', error);
    }
}

// Listen for messages from the options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_RULES') {
        updateRules();
    }
    return true;
});

// Initialize rules when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    updateRules();
});