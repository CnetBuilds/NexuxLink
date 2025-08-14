document.addEventListener('DOMContentLoaded', async function () {
    // ======================
    // 1. GLOBAL VARIABLES
    // ======================
    let links = [];
    const DB_FILE = 'links_db.txt';

    // DOM Elements
    const expandedView = document.querySelector('.expanded-view-overlay');
    const closeExpanded = document.querySelector('.close-expanded');
    const adminOverlay = document.querySelector('.admin-overlay');
    const linksContainer = document.querySelector('.links-container');
    const closeAdminBtn = document.querySelector('.close-admin');
    const adminTabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const addLinkForm = document.getElementById('add-link-form');

    // ======================
    // 2. CORE FUNCTIONS
    // ======================

    // Save links to text file on server
    async function saveLinksToFile() {
        try {
            const response = await fetch('save_links.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    links: links,
                    action: 'save'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save links');
            }
            return true;
        } catch (error) {
            console.error('Error saving links:', error);
            alert('Error saving links. Please check console for details.');
            return false;
        }
    }

    // Load links from text file on server
    async function loadLinksFromFile() {
        try {
            const response = await fetch(DB_FILE);
            if (!response.ok) {
                throw new Error('Failed to load links');
            }

            const text = await response.text();
            if (!text.trim()) {
                throw new Error('Database file is empty');
            }

            links = JSON.parse(text);
            renderLinks();
        } catch (error) {
            console.error('Error loading links:', error);
            links = [];
            renderLinks();
            alert('Error loading links. Please check console for details.');
        }
    }

    // Render main links grid
    function renderLinks(filteredLinks = null) {
        const linksToRender = filteredLinks || links;
        linksContainer.innerHTML = '';

        if (linksToRender.length === 0) {
            linksContainer.innerHTML = `
                <div class="no-results glass-panel">
                    <i class="fas fa-search"></i>
                    <h3>No links found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
            return;
        }

        linksToRender.forEach(link => {
            const linkCard = document.createElement('div');
            linkCard.className = 'link-card';
            linkCard.dataset.id = link.id;
            linkCard.innerHTML = `
                <div class="link-icon">
                    <i class="${link.icon}"></i>
                </div>
                <h3>${link.title}</h3>
                <p>${link.description}</p>
                <div class="link-meta">
                    <span class="link-category">${link.category}</span>
                </div>
                <a href="${link.url}" target="_blank" class="glass-button">
                    <i class="fas fa-external-link-alt"></i> Visit
                </a>
            `;
            linksContainer.appendChild(linkCard);
        });
    }

    // Open expanded view
    function openExpandedView(linkData) {
        document.getElementById('expanded-icon').className = linkData.icon;
        document.getElementById('expanded-title').textContent = linkData.title;
        document.getElementById('expanded-category').textContent = linkData.category;
        document.getElementById('expanded-url').href = linkData.url;
        document.getElementById('expanded-description').textContent = linkData.description;

        const imagePreview = document.getElementById('link-preview-image');
        if (linkData.imageUrl) {
            imagePreview.src = linkData.imageUrl;
            imagePreview.style.display = 'block';
        } else {
            imagePreview.style.display = 'none';
        }

        expandedView.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ======================
    // 3. EVENT HANDLERS
    // ======================

    // Card click handler
    linksContainer.addEventListener('click', (e) => {
        const linkCard = e.target.closest('.link-card');
        if (linkCard) {
            const linkId = parseInt(linkCard.dataset.id);
            const linkData = links.find(link => link.id === linkId);
            if (linkData) openExpandedView(linkData);
        }
    });

    // Close expanded view
    closeExpanded.addEventListener('click', () => {
        expandedView.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Close admin panel
    closeAdminBtn.addEventListener('click', () => {
        adminOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Admin tab switching
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            adminTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Admin password protection
    document.getElementById('admin-toggle').addEventListener('click', async (e) => {
        e.preventDefault();
        const password = prompt("Enter admin password:");
        if (password === null) return;

        const hash = await sha256(password);
        const correctHash = "559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd"; // "123"

        if (hash === correctHash) {
            adminOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            renderLinkList();
        } else {
            alert("❌ Incorrect password!");
        }
    });

    // Search functionality
    document.querySelector('.glass-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredLinks = links.filter(link =>
            link.title.toLowerCase().includes(searchTerm) ||
            link.description.toLowerCase().includes(searchTerm) ||
            link.category.toLowerCase().includes(searchTerm)
        );
        renderLinks(filteredLinks);
    });

    // Add link form submission
    addLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(addLinkForm);
        const title = formData.get('title');
        const url = formData.get('url');
        const description = formData.get('description');
        const icon = formData.get('icon') || 'fas fa-link';
        const category = formData.get('category');
        const imageUrl = formData.get('image-url') || '';

        const submitBtn = addLinkForm.querySelector('.submit-btn');
        const isEditing = submitBtn.dataset.editingId;

        try {
            if (isEditing) {
                // Update existing link
                const id = parseInt(submitBtn.dataset.editingId);
                const index = links.findIndex(link => link.id === id);
                
                if (index !== -1) {
                    links[index] = { id, title, url, description, icon, category, imageUrl };
                    const success = await saveLinksToFile();
                    
                    if (success) {
                        renderLinks();
                        renderLinkList();
                        submitBtn.innerHTML = '<i class="fas fa-check"></i> Link Updated!';
                        setTimeout(() => {
                            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Link';
                            delete submitBtn.dataset.editingId;
                            addLinkForm.reset();
                        }, 2000);
                    }
                }
            } else {
                // Add new link
                const newLink = {
                    id: Date.now(),
                    title,
                    url,
                    description,
                    icon,
                    category,
                    imageUrl
                };
                
                links.push(newLink);
                const success = await saveLinksToFile();
                
                if (success) {
                    renderLinks();
                    renderLinkList();
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> Link Added!';
                    setTimeout(() => {
                        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Link';
                        addLinkForm.reset();
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error saving link:', error);
            alert('Failed to save link. Please check console for details.');
        }
    });

    // ======================
    // 4. HELPER FUNCTIONS
    // ======================

    // SHA-256 hashing
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Render link list for admin panel
    function renderLinkList() {
        const linkList = document.querySelector('.link-list');
        linkList.innerHTML = '';

        if (links.length === 0) {
            linkList.innerHTML = `
                <div class="no-links glass-panel">
                    <i class="fas fa-link"></i>
                    <h3>No links added yet</h3>
                    <p>Add your first link using the "Add Link" tab</p>
                </div>
            `;
            return;
        }

        links.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item glass-panel';
            linkItem.innerHTML = `
                <div class="link-item-header">
                    <div class="link-item-icon">
                        <i class="${link.icon}"></i>
                    </div>
                    <h4>${link.title}</h4>
                    <span class="link-item-category">${link.category}</span>
                </div>
                <p class="link-item-desc">${link.description}</p>
                ${link.imageUrl ? `<img src="${link.imageUrl}" class="link-item-image" alt="${link.title} preview">` : ''}
                <div class="link-item-actions">
                    <button class="edit-link glass-button" data-id="${link.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-link glass-button" data-id="${link.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            linkList.appendChild(linkItem);
        });

        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                editLink(id);
            });
        });

        document.querySelectorAll('.delete-link').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                await deleteLink(id);
            });
        });
    }

    // Edit link function
    function editLink(id) {
        const link = links.find(link => link.id === id);
        if (!link) return;

        // Ensure image URL field exists
        if (!addLinkForm.querySelector('input[name="image-url"]')) {
            const imageUrlGroup = document.createElement('div');
            imageUrlGroup.className = 'form-group';
            imageUrlGroup.innerHTML = `
                <label>Image URL</label>
                <input type="url" class="glass-input" name="image-url" placeholder="https://example.com/image.jpg">
            `;
            addLinkForm.insertBefore(imageUrlGroup, addLinkForm.querySelector('.form-group:last-child'));
        }

        // Populate form fields
        addLinkForm.querySelector('input[name="title"]').value = link.title;
        addLinkForm.querySelector('input[name="url"]').value = link.url;
        addLinkForm.querySelector('textarea[name="description"]').value = link.description;
        addLinkForm.querySelector('input[name="icon"]').value = link.icon;
        addLinkForm.querySelector('select[name="category"]').value = link.category;
        addLinkForm.querySelector('input[name="image-url"]').value = link.imageUrl || '';

        // Update submit button
        const submitBtn = addLinkForm.querySelector('.submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Link';
        submitBtn.dataset.editingId = id;

        // Switch to add tab
        document.querySelector('.tab-btn[data-tab="add-link"]').click();
    }

    // Delete link function
    async function deleteLink(id) {
        if (confirm('Are you sure you want to delete this link?')) {
            links = links.filter(link => link.id !== id);
            const success = await saveLinksToFile();
            if (success) {
                renderLinks();
                renderLinkList();
            } else {
                alert('Failed to save changes after deletion');
            }
        }
    }

    // ======================
    // 5. INITIALIZATION
    // ======================

    // Initialize page
    await loadLinksFromFile();
    document.querySelector('.year').textContent = new Date().getFullYear();

    // Custom cursor effects
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        setTimeout(() => {
            cursorFollower.style.left = e.clientX + 'px';
            cursorFollower.style.top = e.clientY + 'px';
        }, 100);
    });

    // Interactive elements effect
    const interactiveElements = 'button, a, input, .link-card, .tab-btn';
    document.querySelectorAll(interactiveElements).forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursorFollower.style.width = '30px';
            cursorFollower.style.height = '30px';
            cursorFollower.style.borderWidth = '3px';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorFollower.style.width = '40px';
            cursorFollower.style.height = '40px';
            cursorFollower.style.borderWidth = '2px';
        });
    });
});
