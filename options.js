document.addEventListener('DOMContentLoaded', function() {
    const websiteInput = document.getElementById('websiteInput');
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
          ${site}
          <button class="delete-btn" data-site="${site}">Delete</button>
        `;
                websiteList.appendChild(li);
            });
        });
    }

    // Add new website
    addButton.addEventListener('click', function() {
        const website = websiteInput.value.trim();
        if (website) {
            chrome.storage.sync.get(['blockedSites'], function(result) {
                const sites = result.blockedSites || [];
                if (!sites.includes(website)) {
                    sites.push(website);
                    chrome.storage.sync.set({ blockedSites: sites }, function() {
                        websiteInput.value = '';
                        loadWebsites();
                        // Update blocking rules
                        chrome.runtime.sendMessage({ type: 'UPDATE_RULES' });
                    });
                }
            });
        }
    });

    // Delete website
    websiteList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const siteToDelete = e.target.getAttribute('data-site');
            chrome.storage.sync.get(['blockedSites'], function(result) {
                const sites = result.blockedSites || [];
                const newSites = sites.filter(site => site !== siteToDelete);
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