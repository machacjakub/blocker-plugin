import { removeCurrentRules } from "./rulesService.js";

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
                
                // Calculate remaining time if paused
                let pauseInfo = '';
                if (site.pauseUntil && site.pauseUntil > Date.now()) {
                    const remaining = Math.ceil((site.pauseUntil - Date.now()) / 60000);
                    pauseInfo = ` <span class="pause-info">(Paused: ${formatRemainingTime(remaining)} left)</span>`;
                }
                
                li.innerHTML = `
                    <div class="url-time-wrapper">
                        <div class="url"><img alt="Blocking" src="./icons/block.svg" width="2px"/><div class="url-ellipsis">${site.url}</div></div> <div class="time">${site.timeFrom} - ${site.timeTo}${pauseInfo}</div></div>
                    <button class="pause-btn" data-site="${site.id}">
                        <img alt="Pause/Resume" class="pause-svg" data-site="${site.id}" width="22px" src="./icons/pause-icon.svg"/>
                    </button>
                    <button class="delete-btn" data-site="${site.id}"><img alt="Remove" class="delete-svg" data-site="${site.id}" width="24px" src="./icons/remove-icon.svg"/></button>
        `;
                li.setAttribute('data-site-id', site.id);
                websiteList.appendChild(li);
            });
        });
    }
    
    // Format remaining time
    function formatRemainingTime(minutes) {
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
        return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
    }

    // Add new website
    addButton.addEventListener('click', function() {
        const url = urlInput.value.trim();
        const timeFrom = timeFromInput.value;
        const timeTo = timeToInput.value;
        if (url && timeFromInput && timeToInput) {
            chrome.storage.sync.get(['blockedSites'], function(result) {
                const sites = result.blockedSites || [];
                // Find max existing id and add 1, or use 1 if none exist
                const maxId = sites.length > 0 ? Math.max(...sites.map(site => typeof site.id === 'number' ? site.id : 0)) : 0;
                const newId = maxId + 1;
                sites.push({id: newId, url, timeFrom, timeTo, paused: false});
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

    // Show pause form
    function showPauseForm(siteId) {
        // Remove any existing forms
        document.querySelectorAll('.pause-form').forEach(form => form.remove());
        
        const li = document.querySelector(`li[data-site-id="${siteId}"]`);
        if (!li) return;
        
        const form = document.createElement('div');
        form.className = 'pause-form';
        form.innerHTML = `
            <div class="pause-form-content">
                <label for="duration-${siteId}">Duration:</label>
                <select id="duration-${siteId}" class="duration-select">
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="30" selected>30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="240">4 hours</option>
                    <option value="1440">1 day</option>
                </select>
                <label for="reason-${siteId}">Reason (min 15 chars):</label>
                <input type="text" id="reason-${siteId}" class="reason-input" placeholder="Why are you pausing this block?" />
                <span class="reason-error" style="display:none; color: red; font-size: 0.8em;">Reason must be at least 15 characters</span>
                <div class="form-actions">
                    <button class="form-submit" data-site="${siteId}">Pause</button>
                    <button class="form-cancel">Cancel</button>
                </div>
            </div>
        `;
        li.insertAdjacentElement('afterend', form);
    }
    
    // Pause/Resume and Delete website
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
        } else if (e.target.classList.contains('pause-svg')) {
            const idToPause = e.target.getAttribute('data-site');
            showPauseForm(idToPause);
        } else if (e.target.classList.contains('form-cancel')) {
            // Remove the pause form regardless of its position
            const form = e.target.closest('.pause-form');
            if (form) form.remove();
        } else if (e.target.classList.contains('form-submit')) {
            const siteId = e.target.getAttribute('data-site');
            const durationSelect = document.getElementById(`duration-${siteId}`);
            const reasonInput = document.getElementById(`reason-${siteId}`);
            const form = e.target.closest('.pause-form');
            const errorSpan = form ? form.querySelector('.reason-error') : null;

            const duration = parseInt(durationSelect.value);
            const reason = reasonInput.value.trim();

            // Validate reason
            if (reason.length < 15) {
                if (errorSpan) errorSpan.style.display = 'block';
                reasonInput.focus();
                return;
            }

            // Calculate pause expiration
            const pauseUntil = Date.now() + (duration * 60 * 1000);

            // Save pause to site data
            chrome.storage.sync.get(['blockedSites'], function(result) {
                let sites = result.blockedSites || [];
                const site = sites.find(s => String(s.id) === siteId);

                sites = sites.map(s => {
                    if (String(s.id) === siteId) {
                        return { ...s, paused: true, pauseUntil, pauseReason: reason };
                    }
                    return s;
                });

                chrome.storage.sync.set({ blockedSites: sites }, function() {
                    // Log to localStorage for accountability
                    const logs = JSON.parse(localStorage.getItem('reasons_to_pause') || '[]');
                    logs.push({
                        siteId: parseInt(siteId),
                        siteUrl: site.url,
                        reason: reason,
                        duration: durationSelect.options[durationSelect.selectedIndex].text,
                        timestamp: Date.now()
                    });
                    localStorage.setItem('reasons_to_pause', JSON.stringify(logs));

                    // Remove the pause form after successful pause
                    if (form) form.remove();
                    // Update blocking rules, then refresh the UI after a short delay so countdown is visible
                    chrome.runtime.sendMessage({ type: 'UPDATE_RULES' }, function() {
                        setTimeout(loadWebsites, 200);
                    });
                });
            });
        }
    });

    // Initial load
    loadWebsites();
});