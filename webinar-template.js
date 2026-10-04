/**
 * Shared webinar.html generator.
 *
 * Used BOTH in the browser (webinar-admin.html, for live preview) and in
 * the Netlify function (webinar-publish.js, for the file that actually
 * ships). Keeping it in one file means the preview can never drift from
 * what actually gets published.
 *
 * Convention: in `headline`, wrap the part that should render in the
 * light-blue accent color with **double asterisks**, e.g.
 *   "Skills Needed for Reviews and **Meta-Analysis in Medical Research**"
 * Line breaks are left to the browser (the heading already wraps nicely
 * at max-w-4xl) rather than hand-placed <br> tags, so this keeps working
 * no matter how long the title is.
 *
 * `data` shape:
 * {
 *   title: "How to Do a High-Impact Study Using the NIH Library",   // <title>/meta, plain text
 *   headline: "How to Do a High-Impact Study Using the **NIH Library**",
 *   subtitle: "Learn key skills for conducting and contributing to high-quality reviews and meta-analyses in medical research.",
 *   dateDisplay: "October 31, 2026",        // hero badge + meta description
 *   dateShort: "October 31",                 // used in the two "session" sentences
 *   timeDisplay: "12 Noon EST",
 *   platformDisplay: "Virtual &bull; Google Meet",
 *   speakerName: "Sandra Bakare, MD, MBA",
 *   speakerTitle: "Lead Investigator, Research Junction Institute",
 *   formUrl: "https://docs.google.com/forms/d/e/.../viewform?embedded=true",
 *   cards: [ { icon: "fa-book-medical", title: "...", body: "..." }, ... 6 of them ],
 * }
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Turns "...**NIH Library**" into safe HTML with the accent span.
// Only the **...** segments get the span; everything else is escaped text.
function renderHeadline(headline) {
  const parts = String(headline).split("**");
  return parts
    .map((part, i) => {
      const safe = escapeHtml(part);
      return i % 2 === 1 ? `<span class="text-[#72AEF4]">${safe}</span>` : safe;
    })
    .join("");
}

function plainTextHeadline(headline) {
  return String(headline).replace(/\*\*/g, "");
}

function renderCard(card) {
  return `            <div class="learn-card">
                <div class="w-11 h-11 rounded-xl bg-[#2F6BE8]/10 flex items-center justify-center mb-4">
                    <i class="fas ${escapeHtml(card.icon)} text-[#2F6BE8] text-lg"></i>
                </div>
                <h3 class="font-bold text-[#0D1425] mb-2">${escapeHtml(card.title)}</h3>
                <p class="text-gray-500 text-sm leading-relaxed">${escapeHtml(card.body)}</p>
            </div>`;
}

function generateWebinarHtml(data) {
  const title = escapeHtml(data.title);
  const subtitle = escapeHtml(data.subtitle);
  const dateDisplay = escapeHtml(data.dateDisplay);
  const dateShort = escapeHtml(data.dateShort);
  const timeDisplay = escapeHtml(data.timeDisplay);
  const platformDisplay = data.platformDisplay; // allowed to carry &bull; etc.
  const speakerName = escapeHtml(data.speakerName);
  const speakerTitle = escapeHtml(data.speakerTitle);
  const formUrl = data.formUrl; // URL, not escaped as text
  const cardsHtml = (data.cards || []).map(renderCard).join("\n");
  const metaDescription = `Join Research Junction Institute's free live webinar on ${dateShort}. ${subtitle}`;

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webinar: ${title} | Research Junction Institute</title>
    <meta name="description" content="${metaDescription}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            navy:   '#0D1425',
                            blue:   '#2F6BE8',
                            forest: '#154982',
                            ice:    '#72AEF4',
                            cream:  '#F4F6F7',
                        }
                    },
                    fontFamily: {
                        sans:        ['Inter', 'sans-serif'],
                        montserrat:  ['Montserrat', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #F4F6F7; color: #0D1425; }

        .hero-bg {
            background: linear-gradient(-45deg, #0D1425, #154982, #0f2a6b, #0D1425);
            background-size: 400% 400%;
            animation: gradientShift 12s ease infinite;
        }
        @keyframes gradientShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        @keyframes pulse-badge {
            0%, 100% { box-shadow: 0 0 0 0 rgba(47,107,232,0.4); }
            50%       { box-shadow: 0 0 0 10px rgba(47,107,232,0); }
        }
        .badge-pulse { animation: pulse-badge 2.5s infinite; }

        .form-shell {
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 60px -15px rgba(13,20,37,0.18);
        }

        .learn-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 1.5rem;
            transition: box-shadow 0.2s, transform 0.2s;
        }
        .learn-card:hover {
            box-shadow: 0 8px 30px -8px rgba(47,107,232,0.25);
            transform: translateY(-2px);
        }
    </style>
</head>
<body class="flex flex-col min-h-screen pt-20">

<!-- ── Nav ────────────────────────────────────────────────────────── -->
<nav class="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
            <a href="index.html" class="flex items-center gap-3 cursor-pointer">
                <div class="w-10 h-10 rounded-full border-2 border-[#2F6BE8] flex items-center justify-center bg-[#0D1425] overflow-hidden shrink-0">
                    <img src="logo.png" class="w-6 h-6 object-contain">
                </div>
                <div class="flex flex-col">
                    <span class="font-bold text-lg leading-tight text-[#0D1425] tracking-tight" style="font-family:'Montserrat',sans-serif;">Research Junction</span>
                    <span class="text-[10px] uppercase tracking-widest text-[#2F6BE8] font-semibold">Institute</span>
                </div>
            </a>
            <div class="hidden md:flex space-x-8 items-center text-sm">
                <a href="index.html" class="text-gray-600 hover:text-[#2F6BE8] transition">Home</a>
                <a href="about.html" class="text-gray-600 hover:text-[#2F6BE8] transition">About</a>
                <a href="programmes_page.html" class="text-gray-600 hover:text-[#2F6BE8] transition">Programmes</a>
                <a href="partnership_page.html" class="text-gray-600 hover:text-[#2F6BE8] transition">Partners</a>
                <a href="pulse.html" class="text-gray-600 hover:text-[#2F6BE8] transition">The Pulse</a>
            </div>
            <div class="hidden md:flex">
                <a href="donate_page.html" class="bg-[#2F6BE8] hover:bg-[#154982] text-white font-bold text-sm px-6 py-2.5 rounded-full transition-colors shadow-lg">Donate</a>
            </div>
            <div class="md:hidden flex items-center">
                <button class="text-[#0D1425] hover:text-[#2F6BE8] focus:outline-none p-2" onclick="document.getElementById('mobileMenu').classList.toggle('hidden')">
                    <i class="fas fa-bars text-2xl"></i>
                </button>
            </div>
        </div>
    </div>
    <div id="mobileMenu" class="hidden md:hidden bg-white border-b border-gray-200 shadow-lg absolute w-full">
        <div class="px-4 pt-2 pb-6 space-y-2 flex flex-col text-sm">
            <a href="index.html" class="text-gray-700 hover:bg-gray-50 block px-3 py-2 rounded-md font-medium transition">Home</a>
            <a href="about.html" class="text-gray-700 hover:bg-gray-50 block px-3 py-2 rounded-md font-medium transition">About</a>
            <a href="programmes_page.html" class="text-gray-700 hover:bg-gray-50 block px-3 py-2 rounded-md font-medium transition">Programmes</a>
            <a href="partnership_page.html" class="text-gray-700 hover:bg-gray-50 block px-3 py-2 rounded-md font-medium transition">Partners</a>
            <a href="pulse.html" class="text-gray-700 hover:bg-gray-50 block px-3 py-2 rounded-md font-medium transition">The Pulse</a>
            <a href="donate_page.html" class="text-center block w-full mt-3 bg-[#2F6BE8] text-white px-3 py-3 rounded-md font-bold transition">Donate</a>
        </div>
    </div>
</nav>

<!-- ── Hero ───────────────────────────────────────────────────────── -->
<section class="hero-bg text-white py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-white/5 pointer-events-none"></div>
    <div class="absolute -bottom-32 -left-16 w-72 h-72 rounded-full border border-white/5 pointer-events-none"></div>

    <div class="max-w-4xl mx-auto relative z-10">
        <div class="flex flex-wrap items-center gap-3 mb-6">
            <span class="badge-pulse inline-flex items-center gap-2 bg-[#2F6BE8] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                Free Live Webinar
            </span>
            <span class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                <i class="fas fa-calendar-alt text-[#72AEF4]"></i> ${dateDisplay}
            </span>
            <span class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                <i class="fas fa-clock text-[#72AEF4]"></i> ${timeDisplay}
            </span>
            <span class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                <i class="fas fa-video text-[#72AEF4]"></i> ${platformDisplay}
            </span>
        </div>

        <h1 class="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6" style="font-family:'Montserrat',sans-serif;">
            ${renderHeadline(data.headline)}
        </h1>
        <p class="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl">
            A free live session by Research Junction Institute. ${subtitle}
        </p>

        <!-- Speaker -->
        <div class="flex items-center gap-4 mb-10">
            <div class="w-12 h-12 rounded-full bg-[#2F6BE8] flex items-center justify-center shrink-0">
                <i class="fas fa-microphone text-white text-lg"></i>
            </div>
            <div>
                <p class="font-bold text-white leading-tight" style="font-family:'Montserrat',sans-serif;">${speakerName}</p>
                <p class="text-sm text-[#72AEF4] italic">${speakerTitle}</p>
            </div>
        </div>

        <a href="#register" class="inline-flex items-center gap-3 bg-[#2F6BE8] hover:bg-[#154982] text-white font-bold text-base px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
            Reserve Your Spot — It's Free
            <i class="fas fa-arrow-right"></i>
        </a>
    </div>
</section>

<!-- ── What you'll learn ──────────────────────────────────────────── -->
<section class="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto">
        <div class="text-center mb-12">
            <p class="text-[#2F6BE8] text-xs font-bold uppercase tracking-widest mb-2">Session Overview</p>
            <h2 class="text-3xl md:text-4xl font-extrabold text-[#0D1425]" style="font-family:'Montserrat',sans-serif;">What You'll Walk Away With</h2>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
${cardsHtml}
        </div>
    </div>
</section>

<!-- ── Who this is for ────────────────────────────────────────────── -->
<section class="py-12 px-4 sm:px-6 lg:px-8 bg-[#0D1425]">
    <div class="max-w-5xl mx-auto text-center">
        <p class="text-[#72AEF4] text-xs font-bold uppercase tracking-widest mb-2">Who This Is For</p>
        <h2 class="text-3xl font-extrabold text-white mb-10" style="font-family:'Montserrat',sans-serif;">Built for Every Stage of Your Research Journey</h2>
        <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                <i class="fas fa-user-graduate text-[#72AEF4] text-2xl mb-3"></i>
                <p class="text-white font-semibold text-sm mb-1">Medical Students</p>
                <p class="text-gray-400 text-xs leading-relaxed">Starting out and unsure where to begin your first research project.</p>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                <i class="fas fa-heartbeat text-[#72AEF4] text-2xl mb-3"></i>
                <p class="text-white font-semibold text-sm mb-1">Residents & Clinicians</p>
                <p class="text-xs text-gray-400 leading-relaxed">Balancing clinical work while trying to build a research portfolio.</p>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                <i class="fas fa-flask text-[#72AEF4] text-2xl mb-3"></i>
                <p class="text-white font-semibold text-sm mb-1">Early-Career Researchers</p>
                <p class="text-xs text-gray-400 leading-relaxed">Looking to develop a publishable pipeline and research identity.</p>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                <i class="fas fa-globe text-[#72AEF4] text-2xl mb-3"></i>
                <p class="text-white font-semibold text-sm mb-1">International Students</p>
                <p class="text-xs text-gray-400 leading-relaxed">Seeking globally relevant research opportunities and publication experience.</p>
            </div>
        </div>
    </div>
</section>

<!-- ── Registration form ──────────────────────────────────────────── -->
<section id="register" class="py-16 md:py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
    <div class="max-w-3xl mx-auto">
        <div class="text-center mb-10">
            <p class="text-[#2F6BE8] text-xs font-bold uppercase tracking-widest mb-2">Reserve Your Spot</p>
            <h2 class="text-3xl md:text-4xl font-extrabold text-[#0D1425] mb-3" style="font-family:'Montserrat',sans-serif;">Register Now — Free</h2>
            <p class="text-gray-500 text-sm">Spots are limited. Fill in the form below to secure your place at the ${dateShort} session.</p>
        </div>

        <div class="form-shell bg-white">
            <div class="bg-[#0D1425] px-6 py-4 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full border border-[#2F6BE8] flex items-center justify-center bg-[#0D1425] overflow-hidden shrink-0">
                    <img src="logo.png" class="w-5 h-5 object-contain">
                </div>
                <div>
                    <p class="text-white font-bold text-sm" style="font-family:'Montserrat',sans-serif;">Research Junction Institute</p>
                    <p class="text-[#72AEF4] text-xs">Webinar Registration — ${dateDisplay}</p>
                </div>
            </div>
            <iframe
                src="${formUrl}"
                width="100%"
                height="820"
                frameborder="0"
                marginheight="0"
                marginwidth="0"
                title="Webinar Registration Form"
                style="display:block;">
                Loading registration form…
            </iframe>
        </div>

        <p class="text-center text-xs text-gray-400 mt-4">
            <i class="fas fa-lock mr-1"></i> Your information is kept private and will only be used to send webinar access details.
        </p>
    </div>
</section>

<!-- ── Footer ─────────────────────────────────────────────────────── -->
<footer class="bg-[#0D1425] text-white pt-20 pb-10 mt-auto border-t-4 border-[#2F6BE8]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div class="lg:col-span-1">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 rounded-full border border-[#2F6BE8] flex items-center justify-center bg-[#0D1425] shrink-0 overflow-hidden">
                        <img src="logo.png" class="w-5 h-5 object-contain">
                    </div>
                    <span class="font-bold text-lg tracking-tight">Research Junction</span>
                </div>
                <p class="text-gray-400 text-sm leading-relaxed mb-6">
                    Research Junction Institute is a registered non-profit advancing research education and scientific collaboration for medical, nursing, and pharmacy students worldwide.
                </p>
                <div class="flex gap-4">
                    <a href="https://www.linkedin.com/company/research-junction-institute/" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#2F6BE8] transition"><i class="fab fa-linkedin text-xl"></i></a>
                    <a href="https://www.facebook.com/share/1BkLDnuVHQ/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#2F6BE8] transition"><i class="fab fa-facebook text-xl"></i></a>
                    <a href="https://www.instagram.com/research.junction/" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#2F6BE8] transition"><i class="fab fa-instagram text-xl"></i></a>
                    <a href="https://www.youtube.com/channel/UC9V67fNX-YnRr7fhpF_4lWA" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-[#2F6BE8] transition"><i class="fab fa-youtube text-xl"></i></a>
                </div>
            </div>
            <div>
                <h5 class="font-bold text-sm uppercase tracking-widest text-[#2F6BE8] mb-6">Organisation</h5>
                <ul class="space-y-3 text-gray-400 text-sm">
                    <li><a href="index.html" class="hover:text-white transition">Home</a></li>
                    <li><a href="about.html" class="hover:text-white transition">About</a></li>
                    <li><a href="programmes_page.html" class="hover:text-white transition">Programmes</a></li>
                    <li><a href="partnership_page.html" class="hover:text-white transition">Partners</a></li>
                </ul>
            </div>
            <div>
                <h5 class="font-bold text-sm uppercase tracking-widest text-[#2F6BE8] mb-6">Community</h5>
                <ul class="space-y-3 text-gray-400 text-sm">
                    <li><a href="pulse.html" class="hover:text-white transition">The Pulse</a></li>
                    <li><a href="programmes_page.html" class="hover:text-white transition">Become a Junction Fellow</a></li>
                    <li><a href="donate_page.html" class="hover:text-white transition">Support the Mission</a></li>
                </ul>
            </div>
            <div>
                <h5 class="font-bold text-sm uppercase tracking-widest text-[#2F6BE8] mb-6">Contact</h5>
                <ul class="space-y-3 text-gray-400 text-sm">
                    <li><a href="mailto:help@researchjunction.org" class="hover:text-white transition"><i class="fas fa-envelope w-5"></i> help@researchjunction.org</a></li>
                    <li><a href="https://researchjunction.org" target="_blank" rel="noopener noreferrer" class="hover:text-white transition"><i class="fas fa-globe w-5"></i> researchjunction.org</a></li>
                    <li><span class="text-gray-500"><i class="fas fa-map-marker-alt w-5"></i> Columbus, Ohio, USA</span></li>
                </ul>
            </div>
            <div>
                <h5 class="font-bold text-sm uppercase tracking-widest text-[#2F6BE8] mb-6">Legal</h5>
                <ul class="space-y-3 text-gray-400 text-sm">
                    <li><a href="privacy-policy.html" class="hover:text-white transition">Privacy Policy</a></li>
                    <li><a href="terms.html" class="hover:text-white transition">Terms &amp; Conditions</a></li>
                    <li><a href="authorship-policy.html" class="hover:text-white transition">Authorship Policy</a></li>
                    <li><a href="faq.html" class="hover:text-white transition">FAQ</a></li>
                    <li><span class="text-[#2F6BE8] font-medium mt-2 block">Registered Non-Profit</span></li>
                </ul>
            </div>
        </div>
        <div class="pt-8 border-t border-white/10 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <span class="text-gray-500 text-xs">&copy; 2026 Research Junction Institute. Registered Non-Profit.</span>
            <span class="text-[#2F6BE8] font-serif italic text-sm">Collaborative Science. Global Impact.</span>
        </div>
    </div>
</footer>


</body>
</html>
`;
}

// Isomorphic export: Node (Netlify function) or browser (<script> tag).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateWebinarHtml, renderHeadline, plainTextHeadline, escapeHtml };
} else {
  window.WebinarTemplate = { generateWebinarHtml, renderHeadline, plainTextHeadline, escapeHtml };
}
