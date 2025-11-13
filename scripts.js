// Sample Event Data for demonstration (as requested, this would be imported in a real SPA)
const events = [
    {
        id: 1,
        title: "Keynote: The Future of AI",
        type: "Talk",
        date: new Date(2025, 11, 15, 10, 0, 0), // Dec 15, 2025 10:00 AM
        description: "An in-depth look at the next generation of artificial intelligence and its impact on the industry.",
        speaker: "Dr. Evelyn Reed",
        image: "images/ai.jpg"
    },
    {
        id: 2,
        title: "Hands-on React Workshop",
        type: "Workshop",
        date: new Date(2025, 11, 15, 14, 30, 0), // Dec 15, 2025 2:30 PM
        description: "Build a single-page application from scratch using the latest React hooks and best practices.",
        speaker: "Mark O'Connell",
        image: "images/react.jpg"
    },
    {
        id: 3,
        title: "Web3 & Blockchain Security",
        type: "Talk",
        date: new Date(2025, 11, 16, 9, 0, 0), // Dec 16, 2025 9:00 AM
        description: "Understanding the vulnerabilities and necessary security layers for decentralized applications.",
        speaker: "Samantha Poe",
        image: "images/web3.jpg"
    },
    {
        id: 4,
        title: "Advanced CSS Grid Layouts",
        type: "Workshop",
        date: new Date(2025, 11, 16, 13, 0, 0), // Dec 16, 2025 1:00 PM
        description: "Mastering complex, responsive layouts without the use of frameworks.",
        speaker: "David Chen",
        image: "images/css.jpg"
    },
    {
        id: 5,
        title: "Post-Event Networking Mixer",
        type: "Social",
        date: new Date(2025, 11, 17, 18, 0, 0), // Dec 17, 2025 6:00 PM
        description: "An informal gathering to meet fellow attendees, speakers, and sponsors.",
        speaker: "TechCon Staff",
        image: "images/mixer.jpg"
    },
    {
        id: 6,
        title: "The Legacy of COBOL",
        type: "Talk",
        date: new Date(2025, 0, 10, 10, 0, 0), // Jan 10, 2025 10:00 AM (Past event)
        description: "A historical look at the language that still powers modern banking and finance systems.",
        speaker: "Jessica Alba",
        image: "images/cobol.jpg"
    }
];

// --- Global Variables & DOM Elements ---
const eventContainer = document.getElementById('event-container');
const searchInput = document.getElementById('event-search');
const filterButtons = document.querySelectorAll('.filter-btn');
const statusMessage = document.getElementById('status-message');
const themeToggle = document.getElementById('theme-toggle');

let currentFilter = 'All';
let currentSearchTerm = '';
let countdownIntervals = {};

// --- Level 5: Add to Calendar Helper Functions ---

/**
 * Creates a downloadable .ics file for a given event.
 * @param {Object} event - The event object.
 */
function createIcsFile(event) {
    const formattedDate = (date) => {
        // Format YYYYMMDDTHHMMSSZ (Zulu time required for standard .ics)
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minute = String(date.getUTCMinutes()).padStart(2, '0');
        const second = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    };

    const startTime = formattedDate(event.date);
    // Assuming 1-hour duration for simplicity. Adjust as needed.
    const endTime = formattedDate(new Date(event.date.getTime() + 60 * 60 * 1000));

    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TechCon//Event Calendar//EN\nBEGIN:VEVENT\nUID:${event.id}@techcon2025.org\nDTSTAMP:${formattedDate(new Date())}\nDTSTART:${startTime}\nDTEND:${endTime}\nSUMMARY:${event.title}\nDESCRIPTION:${event.description} - Speaker: ${event.speaker}\nLOCATION:Main Hall\nEND:VEVENT\nEND:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- Level 6: Live Countdown Timer ---

/**
 * Updates the countdown for a single event card.
 * @param {number} eventId - The ID of the event.
 * @param {Date} eventDate - The date of the event.
 * @param {HTMLElement} countdownElement - The DOM element to update.
 */
function updateCountdown(eventId, eventDate, countdownElement) {
    const now = new Date();
    const difference = eventDate.getTime() - now.getTime();

    // Clear previous interval if it exists
    if (countdownIntervals[eventId]) {
        clearInterval(countdownIntervals[eventId]);
    }

    if (difference <= 0) {
        countdownElement.textContent = 'Event has ended';
        countdownElement.classList.add('ended');
        countdownElement.classList.remove('live');
        return;
    }
    
    // Function to calculate and display the time remaining
    const tick = () => {
        const remaining = eventDate.getTime() - new Date().getTime();
        
        if (remaining <= 0) {
            countdownElement.textContent = 'Event has ended';
            countdownElement.classList.add('ended');
            countdownElement.classList.remove('live');
            clearInterval(countdownIntervals[eventId]);
            return;
        }

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        countdownElement.textContent = `Starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        countdownElement.classList.add('live');
    };

    // Initial call and set the interval
    tick();
    countdownIntervals[eventId] = setInterval(tick, 1000);
}

// --- Core Function: Create and Render Cards ---

/**
 * Creates the HTML for a single event card.
 * @param {Object} event - The event object.
 * @param {string} searchTerm - The current search term for highlighting.
 * @returns {HTMLElement} The assembled event card div.
 */
function createEventCard(event, searchTerm = '') {
    const card = document.createElement('div');
    card.classList.add('event-card', 'card-enter'); // Level 8: Add enter class for animation
    card.setAttribute('data-id', event.id);

    // Image (Placeholders used as actual image files are not provided)
    const img = document.createElement('img');
    img.src = event.image || 'https://via.placeholder.com/400x200?text=TechCon+Event';
    img.alt = `Image for ${event.title}`;
    card.appendChild(img);

    const content = document.createElement('div');
    content.classList.add('card-content');

    // Title (Base & Level 7: Highlight)
    const title = document.createElement('h2');
    title.innerHTML = highlightMatch(event.title, searchTerm);
    content.appendChild(title);

    // Description (Base & Level 7: Highlight)
    const description = document.createElement('p');
    description.innerHTML = highlightMatch(event.description, searchTerm);
    content.appendChild(description);

    // Details
    const details = document.createElement('div');
    details.classList.add('details');
    const formattedDate = event.date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    details.innerHTML = `
        <p><strong>Type:</strong> ${event.type}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Speaker:</strong> ${event.speaker}</p>
    `;
    content.appendChild(details);

    // Level 6: Live Countdown
    const countdown = document.createElement('div');
    countdown.classList.add('countdown');
    content.appendChild(countdown);
    // Start the countdown update loop for this card
    updateCountdown(event.id, event.date, countdown);

    // Level 5: Add to Calendar Button
    const calendarButton = document.createElement('button');
    calendarButton.textContent = 'Add to Calendar (.ics)';
    calendarButton.classList.add('add-to-calendar');
    calendarButton.setAttribute('aria-label', `Add ${event.title} to your calendar`);
    calendarButton.addEventListener('click', () => createIcsFile(event));
    content.appendChild(calendarButton);

    card.appendChild(content);

    // Set a timeout to remove the entrance animation class after it runs
    setTimeout(() => {
        card.classList.remove('card-enter');
    }, 400); // Matches CSS transition time

    return card;
}

/**
 * Level 7: Highlights the matching text within a string.
 * @param {string} text - The original string.
 * @param {string} term - The search term.
 * @returns {string} The string with matching text wrapped in <mark> tags.
 */
function highlightMatch(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Selects, filters, and renders the event cards. (Base Requirement & Levels 2, 7, 8, 9)
 * @param {Array<Object>} eventsToRender - The array of events to display.
 * @param {string} searchTerm - The current search term.
 */
function renderEvents(eventsToRender, searchTerm = '') {
    // Level 8: Setup for fluid animation (find which cards to remove)
    const existingCardIds = Array.from(eventContainer.children).map(c => c.getAttribute('data-id'));
    const newCardIds = eventsToRender.map(e => String(e.id));
    
    const cardsToRemove = Array.from(eventContainer.children).filter(
        c => !newCardIds.includes(c.getAttribute('data-id'))
    );
    
    // Level 8: Animate cards to be removed
    cardsToRemove.forEach(card => {
        card.classList.add('card-exit');
        // Clear countdown interval for removed cards
        const eventId = card.getAttribute('data-id');
        if (countdownIntervals[eventId]) {
            clearInterval(countdownIntervals[eventId]);
            delete countdownIntervals[eventId];
        }
        // Wait for the exit animation to complete before removing from DOM
        setTimeout(() => {
            if (card.parentNode === eventContainer) {
                eventContainer.removeChild(card);
            }
        }, 400); // Matches CSS transition time
    });

    // Clear the container of non-animated cards immediately
    // Wait slightly for the animation to start, then add new cards.
    setTimeout(() => {
        // Only clear if the array is empty to handle removal animation better
        if (eventsToRender.length === 0) {
            eventContainer.innerHTML = '';
        }

        // Add the new/remaining cards
        eventsToRender.forEach(event => {
            if (!existingCardIds.includes(String(event.id))) {
                const card = createEventCard(event, searchTerm);
                eventContainer.appendChild(card);
            } else {
                // For existing cards, ensure highlighting is updated (Level 7)
                const existingCard = eventContainer.querySelector(`[data-id="${event.id}"]`);
                if (existingCard) {
                    existingCard.querySelector('h2').innerHTML = highlightMatch(event.title, searchTerm);
                    existingCard.querySelector('.card-content > p').innerHTML = highlightMatch(event.description, searchTerm);
                }
            }
        });

        // Level 9: ARIA Live Region update
        const resultCount = eventsToRender.length;
        const resultText = resultCount === 0 
            ? "No events match your criteria." 
            : `Now showing ${resultCount} event${resultCount === 1 ? '' : 's'}.`;
        
        statusMessage.textContent = resultText;
        console.log(resultText); // Log for non-screen reader users
    }, 10);
}

// --- Combined Filter and Search Logic (Levels 2 & 7) ---

/**
 * Main function to filter and search the events.
 */
function updateEventView() {
    const term = currentSearchTerm.toLowerCase().trim();

    let filteredEvents = events.filter(event => {
        // Level 2: Filter by type
        const typeMatch = currentFilter === 'All' || event.type === currentFilter;

        // Level 7: Filter by search term
        const searchMatch = !term || 
            event.title.toLowerCase().includes(term) ||
            event.description.toLowerCase().includes(term) ||
            event.speaker.toLowerCase().includes(term) ||
            event.type.toLowerCase().includes(term);

        return typeMatch && searchMatch;
    });

    renderEvents(filteredEvents, term);
}

// --- Event Listeners ---

// Level 7: Search Input Listener
searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    updateEventView();
});

// Level 2: Filter Button Listeners
filterButtons.forEach(button => {
    // Level 9: Keyboard control for filters
    button.addEventListener('click', (e) => {
        // Update active state
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        e.currentTarget.classList.add('active');
        e.currentTarget.setAttribute('aria-pressed', 'true');

        currentFilter = e.currentTarget.getAttribute('data-filter');
        updateEventView();
    });
});

// --- Level 3, 4: Dark Mode Implementation ---

/**
 * Applies or removes the dark mode class and updates storage.
 * @param {boolean} isDark - True to set dark mode, false for light.
 * @param {boolean} isManual - True if the change came from the toggle button.
 */
function applyTheme(isDark, isManual = false) {
    const body = document.body;
    const toggle = document.getElementById('theme-toggle');

    if (isDark) {
        body.classList.add('dark-mode');
        toggle.textContent = '🌙'; // Moon icon for dark mode
        toggle.setAttribute('aria-label', 'Switch to light theme');
    } else {
        body.classList.remove('dark-mode');
        toggle.textContent = '☀️'; // Sun icon for light mode
        toggle.setAttribute('aria-label', 'Switch to dark theme');
    }

    if (isManual) {
        // Level 4: Persistent User Choice
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
}

/**
 * Initializes the theme based on local storage or system preference. (Levels 3 & 4)
 */
function initializeTheme() {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
        // Level 4: Load persistent choice
        applyTheme(storedTheme === 'dark');
    } else {
        // Level 3: Auto-detect system preference
        applyTheme(prefersDark);
    }
}

// Level 3: Manual Toggle Listener
themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    applyTheme(isDark, true);
});

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    // Initial render of all events
    updateEventView();
});

// Clean up countdown intervals on page unload (good practice)
window.addEventListener('beforeunload', () => {
    for (const id in countdownIntervals) {
        clearInterval(countdownIntervals[id]);
    }
});