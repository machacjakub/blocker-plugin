import { removeCurrentRules} from "./rulesService.js";

document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const timeFromInput = document.getElementById('timeFromInput');
    const timeToInput = document.getElementById('timeToInput');
    const addButton = document.getElementById('addWebsite');
    const websiteList = document.getElementById('websiteList');

    // Load saved websites
    function loadWebsites() {
        chrome.storage.sync.get(['blockedSites'], function(result) {
            const sites = result.blockedSites || [];
            websiteList.innerHTML = '';
            sites.forEach(function(site) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="url-time-wrapper">
                        <div class="url"><img alt="Blocking" src="./icons/block.svg" width="24px"/><div class="url-ellipsis">${site.url}</div></div> <div class="time">${site.timeFrom} - ${site.timeTo}</div></div>
                    <button class="delete-btn" data-site="${site.id}"><img alt="Remove" class="delete-svg" data-site="${site.id}" width="24px" src="./icons/remove-icon.svg"/></button>
        `;
                websiteList.appendChild(li);
            });
        });
    }

    // Add new website
    addButton.addEventListener('click', function() {
        const url = urlInput.value.trim();
        const timeFrom = timeFromInput.value;
        const timeTo = timeToInput.value;
        if (url && timeFromInput && timeToInput) {
            chrome.storage.sync.get(['blockedSites'], function(result) {
                const sites = result.blockedSites || [];
                sites.push({id: sites.length + 1, url, timeFrom, timeTo});
                chrome.storage.sync.set({ blockedSites: sites }, function() {
                    urlInput.value = '';
                    timeFromInput.value = '';
                    timeToInput.value = '';
                    loadWebsites();
                    // Update blocking rules
                    chrome.runtime.sendMessage({ type: 'UPDATE_RULES' });
                });
            });
        }
    });

    // Delete website
    websiteList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-svg')) {
            const idToDelete = e.target.getAttribute('data-site');
            console.log('Deleting website with id: ', idToDelete);
            chrome.storage.sync.get(['blockedSites'], function(result) {
                removeCurrentRules();
                const sites = result.blockedSites || [];
                const newSites = sites.filter(site => String(site.id) !== idToDelete);
                chrome.storage.sync.set({ blockedSites: newSites }, function() {
                    loadWebsites();
                    // Update blocking rules
                    chrome.runtime.sendMessage({ type: 'UPDATE_RULES' });
                });
            });
        }
    });

    // Initial load
    loadWebsites();
});