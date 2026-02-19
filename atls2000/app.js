const posts = [
  { id: 1, author: "Maya", topic: 0.15, negativity: 0.18, credibility: 0.93, novelty: 0.42, recency: 0.85, text: "City library added free tutoring for math and writing this semester." },
  { id: 2, author: "CryptoFlash", topic: 0.93, negativity: 0.62, credibility: 0.34, novelty: 0.81, recency: 0.96, text: "BREAKING: regulators are plotting to erase your financial freedom." },
  { id: 3, author: "CampusNews", topic: 0.22, negativity: 0.14, credibility: 0.89, novelty: 0.56, recency: 0.78, text: "Student climate council released its annual emissions audit." },
  { id: 4, author: "HotTakeHub", topic: 0.88, negativity: 0.84, credibility: 0.31, novelty: 0.73, recency: 0.92, text: "If you don't buy now, you're basically choosing poverty." },
  { id: 5, author: "ScienceDaily", topic: 0.08, negativity: 0.09, credibility: 0.95, novelty: 0.65, recency: 0.62, text: "Researchers found a low-cost battery material with longer lifespan." },
  { id: 6, author: "TownForum", topic: 0.31, negativity: 0.27, credibility: 0.68, novelty: 0.58, recency: 0.55, text: "Debate tonight: should downtown roads be converted to bus-only lanes?" },
  { id: 7, author: "RageWire", topic: 0.89, negativity: 0.95, credibility: 0.2, novelty: 0.71, recency: 0.98, text: "They are laughing at you while taking everything. Share if angry." },
  { id: 8, author: "HealthThread", topic: 0.27, negativity: 0.16, credibility: 0.9, novelty: 0.49, recency: 0.74, text: "Clinic extends vaccine hours to weekends for working families." },
  { id: 9, author: "MarketMemez", topic: 0.82, negativity: 0.44, credibility: 0.37, novelty: 0.88, recency: 0.9, text: "Top 5 coins that could 10x this month (not financial advice)." },
  { id: 10, author: "LocalTeacher", topic: 0.12, negativity: 0.08, credibility: 0.94, novelty: 0.33, recency: 0.47, text: "Our class garden is producing enough veggies for the cafeteria." },
  { id: 11, author: "PartisanPulse", topic: 0.87, negativity: 0.78, credibility: 0.29, novelty: 0.61, recency: 0.88, text: "The other side wants to destroy your values—wake up now." },
  { id: 12, author: "DataCivic", topic: 0.24, negativity: 0.2, credibility: 0.86, novelty: 0.52, recency: 0.67, text: "Survey: transit ridership up 19% after adding protected bike lanes." },
  { id: 13, author: "ByteBard", topic: 0.71, negativity: 0.29, credibility: 0.61, novelty: 0.77, recency: 0.83, text: "A clear explainer on AI jobs: what changes and what stays human." },
  { id: 14, author: "EcoLab", topic: 0.17, negativity: 0.12, credibility: 0.92, novelty: 0.54, recency: 0.69, text: "New compost pilot reduced dorm trash by 22% in 6 weeks." },
  { id: 15, author: "AlertFront", topic: 0.86, negativity: 0.9, credibility: 0.26, novelty: 0.66, recency: 0.95, text: "Total collapse is coming by Friday—prepare and repost." },
  { id: 16, author: "NeighborNet", topic: 0.36, negativity: 0.22, credibility: 0.75, novelty: 0.41, recency: 0.52, text: "Community center starts free legal clinic for tenant disputes." },
  { id: 17, author: "PolicyLens", topic: 0.2, negativity: 0.19, credibility: 0.88, novelty: 0.63, recency: 0.58, text: "Long-read: what the city budget does and who benefits." },
  { id: 18, author: "CoinProphet", topic: 0.97, negativity: 0.55, credibility: 0.33, novelty: 0.86, recency: 0.94, text: "Insider signal says this token will replace banking by next year." },
  { id: 19, author: "OpenJournal", topic: 0.29, negativity: 0.24, credibility: 0.8, novelty: 0.59, recency: 0.64, text: "How local journalists verify claims before publishing." },
  { id: 20, author: "StormSignal", topic: 0.9, negativity: 0.88, credibility: 0.28, novelty: 0.79, recency: 0.97, text: "Your future is under attack. Only this channel tells the truth." }
];

const state = {
  user: {
    likes: 0,
    shares: 0,
    dwell: 0,
    affinity: 0.5,
    outragePreference: 0.5,
    credibilityPreference: 0.5,
    seenTopics: new Set()
  },
  controls: {
    outrageThrottle: 1,
    diversityBoost: 0.4,
    credibilityWeight: 1
  }
};

const feedEl = document.getElementById("feed");
const likesCount = document.getElementById("likesCount");
const sharesCount = document.getElementById("sharesCount");
const dwellCount = document.getElementById("dwellCount");
const affinityValue = document.getElementById("affinityValue");
const outragePrefValue = document.getElementById("outragePrefValue");
const credPrefValue = document.getElementById("credPrefValue");

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function scorePost(post) {
  const { affinity, outragePreference, credibilityPreference, seenTopics } = state.user;
  const { outrageThrottle, diversityBoost, credibilityWeight } = state.controls;

  const affinityRaw = 1 - Math.abs(post.topic - affinity);
  const engagementSignal = 0.45 * post.recency + 0.55 * post.novelty;
  const outrageSignal = post.negativity * (0.4 + outragePreference) * outrageThrottle;
  const credibilitySignal = post.credibility * credibilityPreference * credibilityWeight;
  const diversitySignal = seenTopics.has(Math.round(post.topic * 4)) ? 0 : diversityBoost;

  const total =
    1.7 * engagementSignal +
    1.25 * affinityRaw +
    1.6 * outrageSignal +
    1.25 * credibilitySignal +
    diversitySignal;

  return {
    total,
    parts: {
      engagement: engagementSignal,
      affinity: affinityRaw,
      outrage: outrageSignal,
      credibility: credibilitySignal,
      diversity: diversitySignal
    }
  };
}

function rankFeed() {
  return posts
    .map((post) => {
      const scored = scorePost(post);
      return { ...post, score: scored.total, parts: scored.parts };
    })
    .sort((a, b) => b.score - a.score);
}

function render() {
  const ranked = rankFeed();

  likesCount.textContent = state.user.likes;
  sharesCount.textContent = state.user.shares;
  dwellCount.textContent = state.user.dwell;
  affinityValue.textContent = state.user.affinity.toFixed(2);
  outragePrefValue.textContent = state.user.outragePreference.toFixed(2);
  credPrefValue.textContent = state.user.credibilityPreference.toFixed(2);

  feedEl.innerHTML = ranked
    .map((post, idx) => {
      const isAngry = post.negativity > 0.75;
      return `
        <article class="post">
          <h3>#${idx + 1} ${post.author}</h3>
          <p class="meta">
            Topic=${post.topic.toFixed(2)} · Negativity=${post.negativity.toFixed(2)} ${isAngry ? '<span class="tag-angry">(high outrage)</span>' : ''}
            · Credibility=${post.credibility.toFixed(2)}
          </p>
          <p>${post.text}</p>
          <div class="actions">
            <button data-id="${post.id}" data-action="like">Like</button>
            <button data-id="${post.id}" data-action="share">Share</button>
            <button data-id="${post.id}" data-action="dwell">Dwell +5s</button>
          </div>
          <p class="score">
            <strong>Total Score: ${post.score.toFixed(3)}</strong><br>
            Breakdown → engagement: ${post.parts.engagement.toFixed(3)} ×1.70,
            affinity: ${post.parts.affinity.toFixed(3)} ×1.25,
            outrage: ${post.parts.outrage.toFixed(3)} ×1.60,
            credibility: ${post.parts.credibility.toFixed(3)} ×1.25,
            diversity bonus: +${post.parts.diversity.toFixed(3)}
          </p>
        </article>
      `;
    })
    .join("");
}

function nudgeProfile(post, action) {
  state.user.seenTopics.add(Math.round(post.topic * 4));

  if (action === "like") {
    state.user.likes += 1;
    state.user.affinity = clamp01(state.user.affinity * 0.8 + post.topic * 0.2);
    state.user.credibilityPreference = clamp01(state.user.credibilityPreference * 0.88 + post.credibility * 0.12);
  }

  if (action === "share") {
    state.user.shares += 1;
    state.user.affinity = clamp01(state.user.affinity * 0.72 + post.topic * 0.28);
    state.user.outragePreference = clamp01(state.user.outragePreference * 0.75 + post.negativity * 0.25);
  }

  if (action === "dwell") {
    state.user.dwell += 5;
    state.user.outragePreference = clamp01(state.user.outragePreference * 0.82 + post.negativity * 0.18);
    state.user.credibilityPreference = clamp01(state.user.credibilityPreference * 0.9 + post.credibility * 0.1);
  }
}

document.getElementById("feed").addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const id = Number(target.dataset.id);
  const action = target.dataset.action;
  const post = posts.find((p) => p.id === id);

  if (!post || !action) return;
  nudgeProfile(post, action);
  render();
});

function bindControl(id, key, formatter) {
  const slider = document.getElementById(id);
  const label = document.getElementById(`${id}Value`);

  slider.addEventListener("input", () => {
    state.controls[key] = Number(slider.value);
    label.textContent = formatter(state.controls[key]);
    render();
  });
}

bindControl("outrageThrottle", "outrageThrottle", (v) => `${v.toFixed(2)}×`);
bindControl("diversityBoost", "diversityBoost", (v) => v.toFixed(2));
bindControl("credibilityWeight", "credibilityWeight", (v) => v.toFixed(2));

document.getElementById("resetProfile").addEventListener("click", () => {
  state.user.likes = 0;
  state.user.shares = 0;
  state.user.dwell = 0;
  state.user.affinity = 0.5;
  state.user.outragePreference = 0.5;
  state.user.credibilityPreference = 0.5;
  state.user.seenTopics.clear();
  render();
});

render();
