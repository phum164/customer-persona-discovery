// ============================================================
// Customer Persona Discovery Tool — Main Logic Script
// ============================================================
let radarChartInstance = null;
let currentStep = 1;
const TOTAL_STEPS = 3;
let selectedFooterClusterId = 0;

// ----- Preset Persona Data -----
const PRESETS = {
    dreamer: { Q3: 1, Q41: 4, Q50: 3, Q288: 3, Q287: "4", Q285: false, Q286: "1", hobby: false, label: "สายฝัน (Dreamer)", clusterId: 0 },
    hustler:  { Q3: 4, Q41: 1, Q50: 6, Q288: 6, Q287: "2", Q285: true,  Q286: "2", hobby: true,  label: "สายลุย (Hustler)", clusterId: 3 },
    saver:    { Q3: 2, Q41: 3, Q50: 8, Q288: 8, Q287: "1", Q285: true,  Q286: "3", hobby: false, label: "สายออม (Saver)", clusterId: 2 },
    social:   { Q3: 2, Q41: 2, Q50: 4, Q288: 4, Q287: "3", Q285: false, Q286: "1", hobby: true,  label: "สายสังคม (Social)", clusterId: 1 },
    aspire:   { Q3: 3, Q41: 3, Q50: 3, Q288: 3, Q287: "4", Q285: false, Q286: "2", hobby: false, label: "สายฝันใหญ่ (Aspire)", clusterId: 4 },
};

// ----- Detailed Persona Profiles for Footer Inspector -----
const PERSONA_DETAILS = {
    0: {
        id: 0,
        code: "Cluster 0",
        name: "The Leisure-First Dreamer",
        tagline: "สายรักอิสระและให้ความสำคัญกับเวลาว่าง",
        description: "รักอิสระ ให้ความสำคัญกับความสุขส่วนตัวและการพักผ่อนมากกว่าการโหมทำงาน แต่รากฐานการเงินยังไม่มั่นคงนัก มีแนวโน้มใช้จ่ายกับความสุขเฉพาะหน้า",
        recommendation: "บริการสตรีมมิ่งมัลติมีเดีย, แพ็กเกจท่องเที่ยวแนวประหยัด, สินค้าแฟชั่นราคาเข้าถึงง่าย, แอปพลิเคชันวางแผนการเงินขั้นเริ่มต้น",
        marketing: "เติมเต็มความสุขวันนี้ โดยไม่ต้องรอให้รวย — ใช้โทนเป็นกันเอง เน้นความสุขในปัจจุบัน",
        presetKey: "dreamer",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
        dotColor: "bg-blue-500",
        radarAvg: "เวลาว่างสำคัญสูง | งานต้องมาก่อนต่ำ | เงินออมและรายได้ปานกลาง-ต่ำ"
    },
    1: {
        id: 1,
        code: "Cluster 1",
        name: "The Vulnerable Spendthrift",
        tagline: "สายสังคมและกิจกรรม มุ่งเน้นประสบการณ์",
        description: "สายสังคมตัวจริง ชอบทำกิจกรรมและสังสรรค์กับกลุ่มเพื่อน มีภาระการเงินสูงหรือเงินออมน้อย ต้องการความยืดหยุ่นในการบริหารค่าใช้จ่าย",
        recommendation: "สินค้าผ่อนชำระ 0%, บริการรับประทานอาหาร/บัตรเครดิตสะสมแต้ม, ประกันภัยเบี้ยต่ำคุ้มครองครอบคลุม, สิทธิประโยชน์กลุ่มเพื่อน",
        marketing: "สนุกกับชีวิตได้เต็มที่ พร้อมตัวช่วยจัดการทุกค่าใช้จ่าย — เน้นความคุ้มค่าและความสะดวกสบายในการจ่าย",
        presetKey: "social",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        dotColor: "bg-amber-500",
        radarAvg: "เข้าสังคม/งานอดิเรกสูง | เงินออมน้อย | ต้องการเครื่องมือผ่อนชำระ"
    },
    2: {
        id: 2,
        code: "Cluster 2",
        name: "The Financially Secure Elite",
        tagline: "เศรษฐีเงียบ มั่นคงสูง ไม่เน้นโอ้อวด",
        description: "เศรษฐีเงียบ มีรากฐานการเงินแข็งแรงมาก มีเงินออมและรายได้สูง ไม่เน้นโอ้อวดหรือโชว์ฐานะ ให้ความสำคัญกับคุณภาพ ความน่าเชื่อถือ และความยั่งยืน",
        recommendation: "กองทุนรวม/สินทรัพย์ลงทุนระยะยาว, สินค้าและบริการสุขภาพพรีเมียม, Quiet Luxury Brands, บริการที่ปรึกษาการเงินส่วนบุคคล",
        marketing: "คุณค่าที่ยั่งยืน สำหรับผู้ที่เลือกสิ่งที่ดีที่สุดให้ตัวเอง — ใช้โทนเรียบหรู น่าเชื่อถือ สื่อถึงคุณภาพสูงสุด",
        presetKey: "saver",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotColor: "bg-emerald-500",
        radarAvg: "รายได้และความพึงพอใจการเงินสูงสุด | เงินออมมั่นคง | ชนชั้นสังคมสูง"
    },
    3: {
        id: 3,
        code: "Cluster 3",
        name: "The Hard-Working Hustler",
        tagline: "นักสู้เพื่อความสำเร็จ มุ่งมั่นสร้างอนาคต",
        description: "นักสู้มุ่งมั่น งานต้องมาก่อนเสมอ ชอบเข้าสังคมเพื่อสร้างคอนเนกชันทางธุรกิจ ทุ่มเทเต็มที่เพื่อเป้าหมายและความก้าวหน้าในชีวิต",
        recommendation: "Gadget และไอทีรุ่นท็อปเพื่อการทำงาน, คอร์สสัมมนาและพัฒนาศักยภาพธุรกิจ, อาหารเสริมบำรุงสมอง, บริการ Concierge พิเศษ",
        marketing: "เครื่องมือสู่ความสำเร็จ สำหรับคนที่ไม่เคยหยุดพัฒนา — ใช้โทนปลุกใจ ทะเยอทะยาน สร้างแรงบันดาลใจ",
        presetKey: "hustler",
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
        dotColor: "bg-purple-500",
        radarAvg: "ความทุ่มเทเรื่องงานสูงสุด | ชอบเข้าสังคมเพื่อธุรกิจ | รายได้และเป้าหมายสูง"
    },
    4: {
        id: 4,
        code: "Cluster 4",
        name: "The Aspirational Underdog",
        tagline: "สายทะเยอทะยาน ให้ความสำคัญกับภาพลักษณ์",
        description: "มีความทะเยอทะยานสูง แคร์ภาพลักษณ์และสถานะทางสังคม ต้องการการยอมรับจากคนรอบข้าง แม้รายได้และสถานะการเงินจริงยังอยู่ในระดับปานกลาง",
        recommendation: "สินค้าแบรนด์เนมรุ่นเริ่มต้น (Entry-Luxury), คอร์สพัฒนาบุคลิกภาพและการสื่อสาร, สินค้าที่เป็นกระแสโซเชียลมีเดีย",
        marketing: "ก้าวสู่ตัวตนที่เหนือกว่า ยกระดับชีวิตคุณในทุกย่างก้าว — ใช้โทนสร้างแรงบันดาลใจ ยกระดับสถานะ",
        presetKey: "aspire",
        badgeBg: "bg-pink-50 text-pink-700 border-pink-200",
        dotColor: "bg-pink-500",
        radarAvg: "ประเมินชนชั้นสังคมสูง | แคร์ภาพลักษณ์ | รายได้ปานกลาง"
    }
};

// ----- Step Navigation Logic -----
function goToStep(step) {
    if (step < 1 || step > TOTAL_STEPS) return;
    
    currentStep = step;
    
    // Toggle Step Form Visibility
    document.querySelectorAll('.form-step').forEach((el, idx) => {
        if (idx + 1 === step) {
            el.classList.remove('hidden');
            el.classList.add('animate-slide-up');
        } else {
            el.classList.add('hidden');
        }
    });

    updateProgressBar();
}

function nextStep() {
    if (currentStep < TOTAL_STEPS) {
        goToStep(currentStep + 1);
    }
}

function prevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

function updateProgressBar() {
    // Percentage width: step 1 = 0%, step 2 = 50%, step 3 = 100%
    const pct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    const bar = document.getElementById('stepProgressBar');
    if (bar) {
        bar.style.width = pct + '%';
    }

    // Update Dots & Labels
    for (let i = 1; i <= TOTAL_STEPS; i++) {
        const dot = document.getElementById('step-dot-' + i);
        const label = document.getElementById('step-label-' + i);
        
        if (dot) {
            if (i <= currentStep) {
                dot.className = "step-dot w-9 h-9 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center border-2 border-brand-600 shadow-md transition-all";
            } else {
                dot.className = "step-dot w-9 h-9 rounded-full bg-gray-100 text-gray-400 font-bold text-sm flex items-center justify-center border-2 border-gray-200 transition-all";
            }
        }
        
        if (label) {
            if (i === currentStep) {
                label.className = "text-xs font-bold text-brand-600 mt-2 transition-colors";
            } else if (i < currentStep) {
                label.className = "text-xs font-semibold text-gray-700 mt-2 transition-colors";
            } else {
                label.className = "text-xs text-gray-400 mt-2 transition-colors";
            }
        }
    }
}

// ----- Preset Loader -----
function loadPreset(key) {
    const p = PRESETS[key];
    if (!p) return;

    // Set Slider Values
    ['Q3','Q41','Q50','Q288'].forEach(id => {
        const el = document.getElementById(id);
        const valEl = document.getElementById(id + '_val');
        if (el) { el.value = p[id]; updateSliderLabel(id); }
        if (valEl) valEl.innerText = p[id];
    });

    // Set Dropdowns
    ['Q287','Q286'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = p[id];
    });

    // Set Toggles
    const q285 = document.getElementById('Q285');
    if (q285) {
        q285.checked = p.Q285;
        updateToggleStyle('Q285');
    }
    const hobby = document.getElementById('hobby_membership');
    if (hobby) {
        hobby.checked = p.hobby;
        updateToggleStyle('hobby_membership');
    }

    // Also select the cluster in footer inspector
    selectFooterCluster(p.clusterId);

    showToast(`โหลดโปรไฟล์ตัวอย่าง: ${p.label}`);
}

// ----- Toggle Box Styling -----
function updateToggleStyle(id) {
    if (id === 'Q285') {
        const checkbox = document.getElementById('Q285');
        const box = document.getElementById('Q285_box');
        const text = document.getElementById('Q285_text');
        if (!checkbox || !box || !text) return;
        
        if (checkbox.checked) {
            text.innerText = 'ใช่';
            text.className = 'text-xs font-bold text-emerald-700 min-w-[36px] text-left';
            box.className = 'bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border-2 border-emerald-400 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300';
        } else {
            text.innerText = 'ไม่ใช่';
            text.className = 'text-xs font-medium text-gray-500 min-w-[36px] text-left';
            box.className = 'bg-gray-50/80 p-4 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-center transition-all duration-300';
        }
    } else if (id === 'hobby_membership') {
        const checkbox = document.getElementById('hobby_membership');
        const box = document.getElementById('hobby_box');
        const text = document.getElementById('hobby_text');
        if (!checkbox || !box || !text) return;
        
        if (checkbox.checked) {
            text.innerText = 'เป็น';
            text.className = 'text-xs font-bold text-emerald-700 min-w-[36px] text-left';
            box.className = 'bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border-2 border-emerald-400 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300';
        } else {
            text.innerText = 'ไม่เป็น';
            text.className = 'ml-2 text-xs font-medium text-gray-500 min-w-[36px] text-left';
            box.className = 'bg-gray-50/80 p-4 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-center transition-all duration-300';
        }
    }
}

// ----- Slider Text Labels -----
const SLIDER_LABELS = {
    Q3:   ['', 'สำคัญมากที่สุด', 'สำคัญปานกลาง', 'สำคัญน้อย', 'ไม่สำคัญเลย'],
    Q41:  ['', 'เห็นด้วยอย่างยิ่ง', 'เห็นด้วยพอสมควร', 'ไม่ค่อยเห็นด้วย', 'ไม่เห็นด้วยเลย'],
    Q50:  ['', 'ไม่พอใจมาก','ไม่พอใจ','ค่อนข้างไม่พอใจ','พอรับได้','กลางๆ','ค่อนข้างดี','ดี','พอใจมาก','พอใจมากที่สุด','ยอดเยี่ยมที่สุด'],
    Q288: ['', 'ต่ำมากที่สุด','ต่ำมาก','ต่ำ','ต่ำกว่ากลาง','ระดับปานกลาง','สูงกว่ากลาง','ค่อนข้างสูง','สูงมาก','สูงมากที่สุด','ระดับสูงสุดของประเทศ'],
};

function updateSliderLabel(id) {
    const el = document.getElementById(id);
    const valEl = document.getElementById(id + '_val');
    const textEl = document.getElementById(id + '_text_label');
    if (!el) return;
    const val = parseInt(el.value);
    if (valEl) valEl.innerText = val;
    if (textEl && SLIDER_LABELS[id]) {
        textEl.innerText = SLIDER_LABELS[id][val] || '';
    }
}

// ----- Toast Notification -----
function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-full shadow-2xl z-50 transition-all duration-300 opacity-0 flex items-center gap-2 border border-gray-700';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
        </svg>
        <span>${msg}</span>
    `;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
    }, 2500);
}

// ----- Submit Analysis -----
async function submitAnalysis() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('initialState').classList.add('hidden');
    document.getElementById('resultContainer').classList.add('hidden');
    document.getElementById('resultContainer').classList.remove('flex');

    const Q3  = document.getElementById('Q3').value;
    const Q41 = document.getElementById('Q41').value;
    const Q50 = document.getElementById('Q50').value;
    const Q288 = document.getElementById('Q288').value;
    const Q287 = document.getElementById('Q287').value;
    const Q285 = document.getElementById('Q285').checked ? 1 : 2;
    const Q286 = document.getElementById('Q286').value;
    const hobby_membership = document.getElementById('hobby_membership').checked ? 1 : 0;

    const payload = { Q3, Q41, Q50, Q288, Q287, Q285, Q286, hobby_membership };

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        setTimeout(() => {
            if (data.status === 'success') {
                displayResult(data);
                // Also update lower footer inspector to predicted cluster
                selectFooterCluster(data.cluster_id);
            } else {
                alert('Error: ' + data.error);
            }
            document.getElementById('loading').classList.add('hidden');
        }, 600);

    } catch (err) {
        console.error(err);
        alert('ไม่สามารถเชื่อมต่อกับ Server ได้ กรุณาตรวจสอบว่า Flask กำลังทำงานอยู่');
        document.getElementById('loading').classList.add('hidden');
    }
}

// ----- Display Main Result -----
function displayResult(data) {
    const { profile, normalised_scores, normalised_radar_avg, match_percentage, top_clusters } = data;

    document.getElementById('resultContainer').classList.remove('hidden');
    document.getElementById('resultContainer').classList.add('flex');

    // Cluster Name & Description
    document.getElementById('clusterName').innerText = profile.name;
    document.getElementById('clusterDesc').innerText = profile.description;
    document.getElementById('clusterRec').innerText = profile.recommendation;
    document.getElementById('clusterMarket').innerText = `"${profile.marketing}"`;

    // Match Score %
    const matchEl = document.getElementById('matchPercentage');
    if (matchEl) {
        matchEl.innerText = match_percentage.toFixed(1) + '%';
        animateCounter(matchEl, 0, match_percentage, 1000);
    }
    const matchBarEl = document.getElementById('matchBar');
    if (matchBarEl) {
        setTimeout(() => { matchBarEl.style.width = match_percentage + '%'; }, 80);
    }

    // Top Clusters Bar Comparison
    renderTopClusters(top_clusters);

    // Radar Chart
    renderChart(
        normalised_scores || data.user_scores,
        normalised_radar_avg || profile.radar_avg
    );
}

// ----- Counter Animation -----
function animateCounter(el, from, to, duration) {
    const start = performance.now();
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.innerText = (from + (to - from) * eased).toFixed(1) + '%';
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ----- Top Clusters Bar Chart -----
const CLUSTER_COLORS = {
    0: '#3b82f6', // blue
    1: '#f97316', // orange
    2: '#10b981', // emerald
    3: '#a855f7', // purple
    4: '#ec4899', // pink
};
function renderTopClusters(top_clusters) {
    const container = document.getElementById('topClustersContainer');
    if (!container) return;
    container.innerHTML = '';
    top_clusters.forEach(c => {
        const bar = document.createElement('div');
        bar.className = 'flex items-center gap-3 text-sm';
        bar.innerHTML = `
            <span class="w-36 truncate font-semibold text-gray-700 text-xs">${c.name.split(' ').slice(1, 4).join(' ')}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div class="h-2.5 rounded-full transition-all duration-700 ease-out" style="width: 0%; background:${CLUSTER_COLORS[c.cluster_id]};" data-w="${c.match_pct}%"></div>
            </div>
            <span class="w-12 text-right font-bold text-gray-800 text-xs">${c.match_pct.toFixed(1)}%</span>
        `;
        container.appendChild(bar);
    });
    setTimeout(() => {
        container.querySelectorAll('[data-w]').forEach(el => {
            el.style.width = el.dataset.w;
        });
    }, 120);
}

// ----- Radar Chart -----
function renderChart(userScores, avgScores) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    if (radarChartInstance) radarChartInstance.destroy();

    const data = {
        labels: [
            'เวลาว่างสำคัญ',
            'งานต้องมาก่อน',
            'พอใจฐานะตัวเอง',
            'รายได้ครอบครัว',
            'ชนชั้นสังคม',
            'เสาหลักบ้าน',
            'ความคล่องเงินออม',
            'มีงานอดิเรก'
        ],
        datasets: [
            {
                label: 'คะแนนของคุณ',
                data: userScores,
                fill: true,
                backgroundColor: 'rgba(13, 148, 136, 0.35)',
                borderColor: 'rgb(13, 148, 136)',
                pointBackgroundColor: 'rgb(13, 148, 136)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(13, 148, 136)',
                borderWidth: 3,
            },
            {
                label: 'ค่าเฉลี่ยกลุ่ม',
                data: avgScores,
                fill: true,
                backgroundColor: 'rgba(156, 163, 175, 0.15)',
                borderColor: 'rgb(156, 163, 175)',
                pointBackgroundColor: 'rgb(156, 163, 175)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(156, 163, 175)',
                borderDash: [5, 5],
                borderWidth: 2,
            }
        ]
    };

    const config = {
        type: 'radar',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 25, backdropColor: 'transparent', color: '#94a3b8', font: { size: 10 } },
                    angleLines: { color: 'rgba(0,0,0,0.08)' },
                    grid: { color: 'rgba(0,0,0,0.08)' },
                    pointLabels: {
                        font: { family: 'Sarabun', size: 11, weight: 'bold' },
                        color: '#475569'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Sarabun', size: 12 },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { family: 'Sarabun', size: 13 },
                    bodyFont: { family: 'Sarabun', size: 12 },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) {
                            return `${ctx.dataset.label}: ${ctx.raw.toFixed(1)} / 100`;
                        }
                    }
                }
            }
        }
    };

    radarChartInstance = new Chart(ctx, config);
}

// ----- Reset Form -----
function resetForm() {
    document.getElementById('surveyForm').reset();
    ['Q3','Q41','Q50','Q288'].forEach(id => updateSliderLabel(id));
    updateToggleStyle('Q285');
    updateToggleStyle('hobby_membership');
    goToStep(1);
    document.getElementById('resultContainer').classList.add('hidden');
    document.getElementById('resultContainer').classList.remove('flex');
    document.getElementById('initialState').classList.remove('hidden');

    showToast('รีเซ็ตฟอร์มแล้ว พร้อมทำแบบทดสอบใหม่');
}

// ----- Copy Summary -----
function copySummary() {
    const name = document.getElementById('clusterName').innerText;
    const desc = document.getElementById('clusterDesc').innerText;
    const rec = document.getElementById('clusterRec').innerText;
    const market = document.getElementById('clusterMarket').innerText;
    const match = document.getElementById('matchPercentage')?.innerText || '';

    const text = `Customer Persona Discovery Result\n\n` +
        `กลุ่ม: ${name}\n` +
        `ความตรงกัน: ${match}\n\n` +
        `ลักษณะนิสัย: ${desc}\n\n` +
        `สินค้า/บริการแนะนำ: ${rec}\n\n` +
        `ข้อความการตลาด: ${market}\n\n` +
        `— วิเคราะห์โดย Customer Persona Discovery Tool (WVS Data)`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('คัดลอกสรุปผลลัพธ์สำเร็จ!');
    }).catch(() => {
        showToast('ไม่สามารถคัดลอกได้ กรุณาลองอีกครั้ง');
    });
}

// ----- Interactive Footer Persona Inspector -----
function selectFooterCluster(clusterId) {
    selectedFooterClusterId = clusterId;
    const p = PERSONA_DETAILS[clusterId];
    if (!p) return;

    // Highlight Tab Button
    for (let i = 0; i <= 4; i++) {
        const btn = document.getElementById('footer-tab-' + i);
        if (btn) {
            if (i === clusterId) {
                btn.className = "footer-persona-tab active flex-1 p-3.5 rounded-2xl border transition-all text-left bg-white shadow-md border-brand-500 ring-2 ring-brand-500/20";
            } else {
                btn.className = "footer-persona-tab flex-1 p-3.5 rounded-2xl border border-gray-200/80 transition-all text-left bg-white/60 hover:bg-white hover:border-gray-300";
            }
        }
    }

    // Update Detail Card Content
    const titleEl = document.getElementById('footer-detail-title');
    const taglineEl = document.getElementById('footer-detail-tagline');
    const descEl = document.getElementById('footer-detail-desc');
    const recEl = document.getElementById('footer-detail-rec');
    const marketEl = document.getElementById('footer-detail-market');
    const radarEl = document.getElementById('footer-detail-radar');
    const codeBadgeEl = document.getElementById('footer-detail-code');

    if (titleEl) titleEl.innerText = p.name;
    if (taglineEl) taglineEl.innerText = p.tagline;
    if (descEl) descEl.innerText = p.description;
    if (recEl) recEl.innerText = p.recommendation;
    if (marketEl) marketEl.innerText = `"${p.marketing}"`;
    if (radarEl) radarEl.innerText = p.radarAvg;
    if (codeBadgeEl) {
        codeBadgeEl.innerText = p.code;
        codeBadgeEl.className = `inline-flex items-center px-3 py-1 rounded-full font-bold text-xs border ${p.badgeBg}`;
    }

    // Attach Preset Load Event to Button
    const loadBtn = document.getElementById('footer-detail-load-btn');
    if (loadBtn) {
        loadBtn.onclick = function() {
            loadPreset(p.presetKey);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
}
