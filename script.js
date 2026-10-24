/**
 * YHWH - Application Script & Infinite Scroll Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    let currentProfiles = [];
    let nextIdCounter = 1000000000000007n;
    const feedEl = document.getElementById('feed');
    const loadingEl = document.getElementById('loadingIndicator');
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const modal = document.getElementById('profileModal');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');

    currentProfiles = [...CURATED_PROFILES];
    renderFeed(currentProfiles);
    generateBatch(5);

    const observerOptions = {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadMoreProfiles();
            }
        });
    }, observerOptions);

    observer.observe(loadingEl);

    function generateBatch(count) {
        for (let i = 0; i < count; i++) {
            const profile = generateInfiniteProfile(nextIdCounter.toString());
            currentProfiles.push(profile);
            nextIdCounter += 1n;
        }
    }

    function loadMoreProfiles() {
        setTimeout(() => {
            generateBatch(4);
            renderFeed(currentProfiles, false);
        }, 300);
    }

    function renderFeed(profiles, reset = true) {
        feedEl.innerHTML = '';

        profiles.forEach(profile => {
            const card = document.createElement('article');
            card.className = 'profile-card';
            card.dataset.id = profile.id;
            
            card.innerHTML = `
                <div class="card-meta-top">
                    <span class="card-id">ID: ${profile.id}</span>
                    <span class="card-category">${profile.category}</span>
                </div>
                <h2 class="card-title">${profile.name}</h2>
                <div class="card-terminology">${profile.originalTerminology} &bull; ${profile.historicalPeriod}</div>
                <p class="card-excerpt">${profile.description}</p>
                <div class="card-footer">
                    <span class="card-period">${profile.subcategory}</span>
                    <span class="read-more">Inspect Archive &rarr;</span>
                </div>
            `;

            card.addEventListener('click', () => openModal(profile));
            feedEl.appendChild(card);
        });
    }

    function openModal(profile) {
        let covenantHTML = '';
        if (profile.covenantDetails) {
            covenantHTML = `
                <div class="modal-section">
                    <h3>Covenant Architecture</h3>
                    <div class="meta-grid">
                        <div class="meta-item"><label>Parties</label><span>${profile.covenantDetails.parties}</span></div>
                        <div class="meta-item"><label>Promises</label><span>${profile.covenantDetails.promises}</span></div>
                        <div class="meta-item"><label>Obligations</label><span>${profile.covenantDetails.obligations}</span></div>
                        <div class="meta-item"><label>Signs</label><span>${profile.covenantDetails.signs}</span></div>
                        <div class="meta-item"><label>Conditionality</label><span>${profile.covenantDetails.conditionality}</span></div>
                    </div>
                </div>
            `;
        }

        let questionsHTML = profile.researchQuestions.map(q => `<li>${q}</li>`).join('');
        let sourcesHTML = profile.sourcePassages.map(s => `<li>${s}</li>`).join('');
        let tagsHTML = profile.tags.map(t => `<span class="tag-pill">#${t}</span>`).join('');

        modalBody.innerHTML = `
            <div class="modal-header-meta">ID: ${profile.id} &bull; ${profile.category}</div>
            <h2 class="modal-title">${profile.name}</h2>
            <div class="modal-terminology">${profile.originalTerminology} &mdash; ${profile.translation}</div>
            
            <div class="meta-grid">
                <div class="meta-item"><label>Historical Period</label><span>${profile.historicalPeriod}</span></div>
                <div class="meta-item"><label>Subcategory</label><span>${profile.subcategory}</span></div>
            </div>

            <div class="modal-section">
                <h3>Detailed Description</h3>
                <p>${profile.description}</p>
            </div>

            <div class="modal-section">
                <h3>Religious & Historical Context</h3>
                <p>${profile.religiousContext}</p>
            </div>

            <div class="modal-section">
                <h3>Relevant Rule / Obligation</h3>
                <p>${profile.relevantRule}</p>
            </div>

            <div class="modal-section">
                <h3>Primary Source Passages</h3>
                <ul>${sourcesHTML}</ul>
            </div>

            <div class="modal-section">
                <h3>Historical Development & Interpretation</h3>
                <p>${profile.explanation}</p>
                <p><strong>Applicable To:</strong> ${profile.applicableTo}</p>
                <p><strong>Development:</strong> ${profile.historicalDevelopment}</p>
                <p><strong>Interpretive Differences:</strong> ${profile.differencesOfInterpretation}</p>
                <p><strong>Documented Controversies:</strong> ${profile.controversies}</p>
            </div>

            ${covenantHTML}

            <div class="modal-section">
                <h3>Research Questions for Further Inquiry</h3>
                <ul>${questionsHTML}</ul>
            </div>

            <div class="modal-section">
                <h3>Searchable Tags</h3>
                <div class="tags-container">${tagsHTML}</div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
            searchSuggestions.classList.add('hidden');
            renderFeed(currentProfiles);
            return;
        }

        if (/^\d+$/.test(query)) {
            let targetProfile = currentProfiles.find(p => p.id === query);
            if (!targetProfile) {
                targetProfile = generateInfiniteProfile(query);
                currentProfiles.unshift(targetProfile);
            }
            renderFeed([targetProfile]);
            searchSuggestions.classList.add('hidden');
            return;
        }

        const matches = currentProfiles.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.originalTerminology.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.tags.some(t => t.toLowerCase().includes(query)) ||
            p.description.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            searchSuggestions.innerHTML = matches.slice(0, 6).map(m => `
                <div class="suggestion-item" data-id="${m.id}">
                    <strong>${m.name}</strong> <span style="color: var(--parchment-dim); font-size: 0.85rem;">(${m.category})</span>
                </div>
            `).join('');
            searchSuggestions.classList.remove('hidden');

            document.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const found = currentProfiles.find(p => p.id === id);
                    if (found) {
                        renderFeed([found]);
                        openModal(found);
                        searchSuggestions.classList.add('hidden');
                        searchInput.value = found.name;
                    }
                });
            });
        } else {
            searchSuggestions.innerHTML = `<div class="suggestion-item">No matching profiles found in active index. Scrolling will generate related entries.</div>`;
            searchSuggestions.classList.remove('hidden');
        }

        renderFeed(matches);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchSuggestions.classList.add('hidden');
        }
    });
});
