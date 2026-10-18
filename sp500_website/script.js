const $ = (selector) => document.querySelector(selector);
const yearSlider = $('#years');
const yearsLabel = $('#years-label');
const agePill = $('#age-pill');
const principalInput = $('#principal');
const monthlyInput = $('#monthly');
const rateInput = $('#rate');
const futureValue = $('#future-value');
const contributionsValue = $('#contributions');
const growthValue = $('#growth');
const money = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0});

function calculate(years, principal, monthly, annualRate) {
  const monthlyRate = annualRate / 100 / 12;
  const periods = Math.round(years * 12);
  if (periods === 0) return {total: principal, contributed: principal, growth: 0};
  if (Math.abs(monthlyRate) < 1e-10) {
    const contributed = principal + monthly * periods;
    return {total: contributed, contributed, growth: 0};
  }
  // End-of-month contributions: ordinary annuity future-value formula.
  const initial = principal * Math.pow(1 + monthlyRate, periods);
  const deposits = monthly * (Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate;
  const contributed = principal + monthly * periods;
  const total = initial + deposits;
  return {total, contributed, growth: total - contributed};
}
function safeNumber(input, fallback, min, max) {
  const parsed = Number(input.value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
function readInputs() {
  return {
    years: Number(yearSlider.value),
    principal: safeNumber(principalInput, 10000, 0, 1e9),
    monthly: safeNumber(monthlyInput, 1000, 0, 1e7),
    rate: safeNumber(rateInput, 10.99, -99, 100)
  };
}
let chart;
function renderChart(params) {
  const labels = [], values = [];
  for (let year = 0; year <= 100; year += 5) {
    const result = calculate(year, params.principal, params.monthly, params.rate);
    labels.push(String(year));
    values.push(Math.max(0, result.total));
  }
  const canvas = $('#growth-chart');
  if (!window.Chart || !canvas) return;
  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: 'line',
    data: {labels, datasets: [{
      label: 'Estimated value', data: values, fill: true, tension: .34,
      borderColor: '#00c85b', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4,
      backgroundColor: (context) => {
        const chartArea = context.chart.chartArea;
        if (!chartArea) return 'rgba(0,200,91,.12)';
        const gradient = context.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(0,200,91,.25)');
        gradient.addColorStop(1, 'rgba(0,200,91,0)');
        return gradient;
      }
    }]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: {duration: 350},
      plugins: {legend: {display: false}, tooltip: {callbacks: {label: (ctx) => money.format(ctx.parsed.y)}}},
      scales: {
        x: {title: {display: true, text: 'Years invested', color: '#8fa598', font: {size: 10}}, grid: {color: 'rgba(255,255,255,.055)'}, ticks: {color: '#9fb1a5', maxTicksLimit: 6}},
        y: {grid: {color: 'rgba(255,255,255,.07)'}, ticks: {color: '#9fb1a5', maxTicksLimit: 5, callback: (value) => value >= 1e6 ? '$' + (value/1e6).toFixed(1) + 'M' : value >= 1000 ? '$' + (value/1000).toFixed(0) + 'k' : '$' + value}}
      }
    }
  });
}
function updateCalculator() {
  const params = readInputs();
  const result = calculate(params.years, params.principal, params.monthly, params.rate);
  yearsLabel.textContent = `${params.years} ${params.years === 1 ? 'year' : 'years'}`;
  agePill.textContent = `Age ${18 + params.years}`;
  futureValue.textContent = money.format(result.total);
  contributionsValue.textContent = money.format(result.contributed);
  growthValue.textContent = money.format(result.growth);
  renderChart(params);
}
[yearSlider, principalInput, monthlyInput, rateInput].forEach(el => el.addEventListener('input', updateCalculator));
$('#reset').addEventListener('click', () => {
  yearSlider.value = 40; principalInput.value = 10000; monthlyInput.value = 1000; rateInput.value = 10.99; updateCalculator();
});
const menuToggle = $('.menu-toggle');
const nav = document.querySelector('.site-header nav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? '✕' : '☰';
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.textContent = '☰';
}));
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  });
}, {threshold: .12});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
// Gentle scroll parallax adds a second layer of motion to the slide background.
const bg = $('.moving-background');
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const offset = window.scrollY * 0.035;
    bg.style.backgroundPosition = `center ${50 + offset * 0.04}%`;
    ticking = false;
  });
}, {passive: true});
updateCalculator();

/* ========================================
   HERO TITLE + BACKGROUND TEXT ANIMATION
======================================== */

const heroSection = document.querySelector('.hero');
const heroCopy = document.querySelector('.hero-copy');
const authorText = document.querySelector('.bg-author-text');


function updateHeroTextAnimation() {
  if (!heroSection || !heroCopy || !authorText) return;

  const heroStart =
    heroSection.getBoundingClientRect().top + window.scrollY;

  const progress = window.scrollY - heroStart;

  // Stage 1: Fade out the title between 0px and 400px
  const titleProgress = Math.max(
    0,
    Math.min(progress / 400, 1)
  );

  heroCopy.style.opacity = String(1 - titleProgress);

  // Stage 2: Fade in "By Kamui" between 400px and 800px
  const authorProgress = Math.max(
    0,
    Math.min((progress - 400) / 400, 1)
  );

  // Stage 3: Fade out "By Kamui" near the end of the hero
  const heroEnd = heroSection.offsetHeight - window.innerHeight;
  const fadeOutStart = heroEnd - 400;

  const fadeOutProgress = Math.max(
    0,
    Math.min((progress - fadeOutStart) / 400, 1)
  );

  authorText.style.opacity = String(
    authorProgress * (1 - fadeOutProgress)
  );
}

// Update on scrolling and resizing
window.addEventListener('scroll', updateHeroTextAnimation, {
  passive: true
});

window.addEventListener('resize', updateHeroTextAnimation);

// Set the correct initial state
updateHeroTextAnimation();
